import yaml from 'js-yaml';
import {
    ApiSpec, AuthScheme, Endpoint, Parameter, RequestBody, ResponseDef,
    SchemaField, TagGroup, PaginationHint, RateLimitHint, HttpMethod, ParseResult
} from '../types';

// ─── OpenAPI / Swagger Parser ───

export function parseOpenApiSpec(input: string): ParseResult {
    const warnings: string[] = [];
    const todos: string[] = [];

    let doc: Record<string, unknown>;
    try {
        doc = JSON.parse(input);
    } catch {
        try {
            const loaded = yaml.load(input);
            if (!loaded || typeof loaded !== 'object' || Array.isArray(loaded)) {
                throw new Error('YAML did not parse to an object');
            }
            doc = loaded as Record<string, unknown>;
        } catch {
            throw new Error('Could not parse input as JSON or YAML');
        }
    }

    // Guard: must be a plain object
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
        throw new Error('Spec must be a JSON/YAML object with an "openapi" or "swagger" key');
    }

    const isSwagger2 = !!(doc.swagger);
    const info = asObj(doc.info) || {};

    const baseUrl = extractBaseUrl(doc, isSwagger2);
    if (!baseUrl) {
        todos.push('TODO: Base URL could not be determined — please set it manually.');
    }

    const auth = extractAuth(doc, isSwagger2, warnings);
    const endpoints = extractEndpoints(doc, isSwagger2, warnings);
    const tags = buildTagGroups(doc, endpoints);
    const paginationHints = detectPagination(endpoints);
    const rateLimitHints = detectRateLimits(endpoints);

    const spec: ApiSpec = {
        title: (info.title as string) || 'Untitled API',
        description: (info.description as string) || '',
        version: (info.version as string) || '1.0.0',
        baseUrl: baseUrl || 'https://api.example.com',
        auth,
        endpoints,
        tags,
        paginationHints,
        rateLimitHints,
        sourceType: 'openapi',
    };

    return { spec, warnings, todos };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Safely cast to plain object, or return null */
function asObj(v: unknown): Record<string, unknown> | null {
    if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
    return null;
}

/** Resolve a JSON Pointer $ref of the form "#/a/b/c" within the root document */
function resolveRef(doc: Record<string, unknown>, ref: string): Record<string, unknown> | null {
    if (!ref || !ref.startsWith('#/')) return null;
    const parts = ref.slice(2).split('/').map(p => p.replace(/~1/g, '/').replace(/~0/g, '~'));
    let cur: unknown = doc;
    for (const part of parts) {
        cur = asObj(cur)?.[part];
        if (cur === undefined) return null;
    }
    return asObj(cur);
}

/** If an object has $ref, resolve it from doc; otherwise return it as-is */
function deref(doc: Record<string, unknown>, obj: unknown): Record<string, unknown> | null {
    const o = asObj(obj);
    if (!o) return null;
    if (typeof o['$ref'] === 'string') return resolveRef(doc, o['$ref']);
    return o;
}

/** Merge allOf/anyOf/oneOf into a single flat schema object */
function flattenComposing(doc: Record<string, unknown>, schema: Record<string, unknown>): Record<string, unknown> {
    const composer = (schema.allOf || schema.anyOf || schema.oneOf) as unknown[];
    if (!Array.isArray(composer) || composer.length === 0) return schema;
    const merged: Record<string, unknown> = { ...schema };
    delete merged.allOf; delete merged.anyOf; delete merged.oneOf;
    for (const sub of composer) {
        const resolved = deref(doc, sub);
        if (!resolved) continue;
        const inner = flattenComposing(doc, resolved);
        // Merge properties
        if (inner.properties) {
            merged.properties = { ...(asObj(merged.properties) || {}), ...(asObj(inner.properties) || {}) };
        }
        if (!merged.type && inner.type) merged.type = inner.type;
        if (inner.required) {
            const existingReq = Array.isArray(merged.required) ? merged.required as string[] : [];
            const newReq = Array.isArray(inner.required) ? inner.required as string[] : [];
            merged.required = [...new Set([...existingReq, ...newReq])];
        }
    }
    return merged;
}

// ─ Base URL ─

function extractBaseUrl(doc: Record<string, unknown>, isSwagger2: boolean): string | null {
    if (isSwagger2) {
        const host = doc.host as string;
        const basePath = (doc.basePath as string) || '';
        const schemes = (doc.schemes as string[]) || ['https'];
        if (host) return `${schemes[0]}://${host}${basePath}`;
        return null;
    }
    const servers = doc.servers as Array<{ url: string }> | undefined;
    if (Array.isArray(servers) && servers.length > 0) {
        const url = servers[0]?.url;
        if (url) return url;
    }
    return null;
}

// ─ Auth ─

function extractAuth(doc: Record<string, unknown>, isSwagger2: boolean, warnings: string[]): AuthScheme {
    let secDefs: Record<string, unknown> | null = null;
    if (isSwagger2) {
        secDefs = asObj(doc.securityDefinitions);
    } else {
        secDefs = asObj(asObj(doc.components)?.securitySchemes);
    }

    if (!secDefs || Object.keys(secDefs).length === 0) {
        // Also check if there's a global security requirement even without scheme def
        const globalSec = doc.security;
        if (Array.isArray(globalSec) && globalSec.length > 0) {
            warnings.push('Security requirements found but scheme definitions are missing or use $ref.');
            return { type: 'bearer', description: 'Authentication required — check the API docs for token type.' };
        }
        warnings.push('No security schemes found — API might be public or auth docs are missing.');
        return { type: 'none', description: 'No authentication detected.' };
    }

    // Find first non-$ref scheme entry (resolve if needed)
    const firstRaw = Object.values(secDefs).find(v => v);
    const first = deref(doc, firstRaw) || asObj(firstRaw);
    if (!first) {
        return { type: 'unknown', description: 'Authentication detected but scheme could not be parsed.' };
    }
    const schemeType = ((first.type as string) || '').toLowerCase();

    if (schemeType === 'apikey') {
        return {
            type: 'apiKey',
            headerName: first.in === 'header' ? (first.name as string) : undefined,
            queryParamName: first.in === 'query' ? (first.name as string) : undefined,
            description: (first.description as string) || `API Key in ${first.in}: ${first.name}`,
        };
    }
    if (schemeType === 'http') {
        const scheme = ((first.scheme as string) || '').toLowerCase();
        if (scheme === 'bearer') {
            return { type: 'bearer', scheme: 'bearer', description: (first.description as string) || 'Bearer token authentication' };
        }
        return { type: 'basic', scheme: 'basic', description: (first.description as string) || 'Basic authentication' };
    }
    if (schemeType === 'oauth2') {
        return {
            type: 'oauth2',
            description: (first.description as string) || 'OAuth 2.0 authentication',
            flows: first.flows as unknown as Record<string, unknown>,
        };
    }

    return { type: 'unknown', description: `Detected scheme type: ${schemeType}` };
}

// ─ Endpoints ─

function extractEndpoints(doc: Record<string, unknown>, isSwagger2: boolean, warnings: string[]): Endpoint[] {
    const pathsRaw = asObj(doc.paths) || {};
    const endpoints: Endpoint[] = [];
    const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

    for (const [path, pathItemRaw] of Object.entries(pathsRaw)) {
        // Path items can themselves be $ref
        const pathItem = deref(doc, pathItemRaw) || asObj(pathItemRaw);
        if (!pathItem) continue;

        for (const method of methods) {
            const opRaw = pathItem[method.toLowerCase()];
            if (!opRaw) continue;
            const op = deref(doc, opRaw) || asObj(opRaw);
            if (!op) continue;

            const id = (op.operationId as string) || `${method}_${path.replace(/[{}\/]/g, '_')}`;
            const tags = Array.isArray(op.tags) ? op.tags as string[] : ['default'];

            const params = extractParameters(doc, op, pathItem, isSwagger2);
            const reqBody = extractRequestBody(doc, op, isSwagger2);
            const responses = extractResponses(doc, op, isSwagger2, warnings);

            // Auth: check op-level security OR global-level security
            const opSec = op.security as unknown[];
            const docSec = doc.security as unknown[];
            const requiresAuth = (Array.isArray(opSec) && opSec.length > 0) ||
                                  (Array.isArray(docSec) && docSec.length > 0);

            endpoints.push({
                id,
                method,
                path,
                summary: (op.summary as string) || '',
                description: (op.description as string) || (op.summary as string) || '',
                tag: (typeof tags[0] === 'string' ? tags[0] : null) || 'default',
                operationId: op.operationId as string,
                parameters: params,
                requestBody: reqBody || undefined,
                responses,
                auth: requiresAuth,
                deprecated: !!(op.deprecated),
            });
        }
    }

    return endpoints;
}

function extractParameters(
    doc: Record<string, unknown>,
    op: Record<string, unknown>,
    pathItem: Record<string, unknown>,
    _isSwagger2: boolean
): Parameter[] {
    const rawList = [
        ...((pathItem.parameters as unknown[]) || []),
        ...((op.parameters as unknown[]) || []),
    ];
    const result: Parameter[] = [];
    for (const rawP of rawList) {
        // Resolve $ref params (e.g. #/components/parameters/Limit)
        const p = deref(doc, rawP) || asObj(rawP);
        if (!p || !p.name) continue; // skip unresolvable refs
        result.push({
            name: p.name as string,
            in: (p.in as Parameter['in']) || 'query',
            required: !!(p.required),
            description: (p.description as string) || '',
            type: resolveParamType(doc, p),
            default: p.default !== undefined ? String(p.default) : undefined,
            enum: Array.isArray(p.enum) ? p.enum as string[] : undefined,
            example: p.example !== undefined ? String(p.example) : undefined,
        });
    }
    return result;
}

function resolveParamType(doc: Record<string, unknown>, p: Record<string, unknown>): string {
    if (p.type) return p.type as string;
    const schema = deref(doc, p.schema) || asObj(p.schema);
    if (schema) return (schema.type as string) || 'string';
    return 'string';
}

function extractRequestBody(doc: Record<string, unknown>, op: Record<string, unknown>, isSwagger2: boolean): RequestBody | null {
    if (isSwagger2) {
        const bodyParams = ((op.parameters as unknown[]) || [])
            .map(p => deref(doc, p) || asObj(p))
            .filter((p): p is Record<string, unknown> => !!(p && p.in === 'body'));
        if (bodyParams.length === 0) return null;
        const schemaRaw = deref(doc, bodyParams[0].schema) || asObj(bodyParams[0].schema);
        const schema = schemaRaw ? flattenComposing(doc, schemaRaw) : null;
        return {
            required: !!(bodyParams[0].required),
            contentType: 'application/json',
            schema: schema ? flattenSchema(doc, schema) : [],
            example: (schema?.example as Record<string, unknown>) || undefined,
        };
    }

    const rb = deref(doc, op.requestBody) || asObj(op.requestBody);
    if (!rb) return null;
    const content = asObj(rb.content);
    if (!content) return null;
    const keys = Object.keys(content);
    if (keys.length === 0) return null;
    const primaryKey = keys.find(k => k.includes('json')) || keys[0];
    const jsonContent = asObj(content[primaryKey]);
    if (!jsonContent) return null;
    const schemaRaw = deref(doc, jsonContent.schema) || asObj(jsonContent.schema);
    const schema = schemaRaw ? flattenComposing(doc, schemaRaw) : null;
    return {
        required: !!(rb.required),
        contentType: primaryKey,
        schema: schema ? flattenSchema(doc, schema) : [],
        example: (jsonContent.example || schema?.example) as Record<string, unknown> | undefined,
    };
}

function flattenSchema(doc: Record<string, unknown>, schema: Record<string, unknown>): SchemaField[] {
    if (!schema) return [];

    // Resolve composing first
    const resolved = flattenComposing(doc, schema);
    const type = resolved.type as string;

    if (type === 'object' || resolved.properties) {
        const properties = asObj(resolved.properties) || {};
        const required = Array.isArray(resolved.required) ? resolved.required as string[] : [];
        return Object.entries(properties).map(([name, propRaw]) => {
            const prop = deref(doc, propRaw) || asObj(propRaw) || {};
            return {
                name,
                type: (prop.type as string) || 'string',
                required: required.includes(name),
                description: (prop.description as string) || '',
                default: prop.default,
                enum: Array.isArray(prop.enum) ? prop.enum as string[] : undefined,
                example: prop.example,
                nested: (prop.type === 'object' || prop.properties || prop.allOf || prop.anyOf)
                    ? flattenSchema(doc, deref(doc, prop) || prop)
                    : undefined,
            };
        });
    }
    if (type === 'array') {
        const itemsRaw = asObj(resolved.items);
        const items = itemsRaw ? (deref(doc, itemsRaw) || itemsRaw) : null;
        return [{
            name: 'items',
            type: 'array',
            required: false,
            description: (resolved.description as string) || 'Array items',
            nested: items ? flattenSchema(doc, items) : undefined,
        }];
    }
    // Scalar or unrecognised — return a single representational field
    return [{
        name: 'value',
        type: type || 'string',
        required: false,
        description: (resolved.description as string) || '',
    }];
}

function extractResponses(
    doc: Record<string, unknown>,
    op: Record<string, unknown>,
    _isSwagger2: boolean,
    _warnings: string[]
): ResponseDef[] {
    const resps = asObj(op.responses) || {};
    return Object.entries(resps).map(([statusCode, respRaw]) => {
        const resp = deref(doc, respRaw) || asObj(respRaw) || {};
        let schema: SchemaField[] = [];
        let example: unknown;
        const content = asObj(resp.content);
        if (content) {
            const primaryKey = Object.keys(content).find(k => k.includes('json')) || Object.keys(content)[0];
            const jsonContent = primaryKey ? asObj(content[primaryKey]) : null;
            if (jsonContent) {
                const schemaRaw = deref(doc, jsonContent.schema) || asObj(jsonContent.schema);
                if (schemaRaw) {
                    schema = flattenSchema(doc, flattenComposing(doc, schemaRaw));
                }
                example = jsonContent.example || (schemaRaw as Record<string, unknown>)?.example;
            }
        } else if (resp.schema) {
            const schemaRaw = deref(doc, resp.schema) || asObj(resp.schema);
            if (schemaRaw) schema = flattenSchema(doc, flattenComposing(doc, schemaRaw));
        }
        return {
            statusCode,
            description: (resp.description as string) || '',
            schema,
            example,
        };
    });
}

// ─ Tags ─

function buildTagGroups(doc: Record<string, unknown>, endpoints: Endpoint[]): TagGroup[] {
    const tagDefs = (doc.tags as Array<{ name: string; description?: string }>) || [];
    const tagMap = new Map<string, TagGroup>();

    for (const td of tagDefs) {
        tagMap.set(td.name, { name: td.name, description: td.description, endpointIds: [] });
    }

    for (const ep of endpoints) {
        if (!tagMap.has(ep.tag)) {
            tagMap.set(ep.tag, { name: ep.tag, endpointIds: [] });
        }
        tagMap.get(ep.tag)!.endpointIds.push(ep.id);
    }

    return Array.from(tagMap.values());
}

// ─ Pagination & Rate Limit Detection ─

const PAGINATION_KEYWORDS = ['page', 'limit', 'offset', 'cursor', 'after', 'before', 'per_page', 'pageSize', 'page_size'];

function detectPagination(endpoints: Endpoint[]): PaginationHint[] {
    const hints: PaginationHint[] = [];
    const seen = new Set<string>();

    for (const ep of endpoints) {
        for (const p of ep.parameters) {
            const lowerName = p.name.toLowerCase();
            if (PAGINATION_KEYWORDS.includes(lowerName) && !seen.has(lowerName)) {
                seen.add(lowerName);
                const pType = ['cursor', 'after', 'before'].includes(lowerName) ? 'cursor' as const
                    : ['offset'].includes(lowerName) ? 'offset' as const
                        : 'page' as const;
                hints.push({
                    type: pType,
                    parameters: [p.name],
                    description: p.description || `Pagination parameter: ${p.name}`,
                });
            }
        }
    }
    return hints;
}

function detectRateLimits(endpoints: Endpoint[]): RateLimitHint[] {
    const hints: RateLimitHint[] = [];
    for (const ep of endpoints) {
        for (const r of ep.responses) {
            if (r.statusCode === '429') {
                hints.push({
                    statusCode: 429,
                    retryHeader: 'Retry-After',
                    description: r.description || 'Rate limit exceeded — wait and retry.',
                });
                return hints;
            }
        }
    }
    return hints;
}
