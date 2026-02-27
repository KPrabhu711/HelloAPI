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
            doc = yaml.load(input) as Record<string, unknown>;
        } catch {
            throw new Error('Could not parse input as JSON or YAML');
        }
    }

    const isSwagger2 = !!(doc as Record<string, unknown>).swagger;
    const info = (doc.info as Record<string, string>) || {};

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
        title: info.title || 'Untitled API',
        description: info.description || '',
        version: info.version || '1.0.0',
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

// ─ Base URL ─

function extractBaseUrl(doc: Record<string, unknown>, isSwagger2: boolean): string | null {
    if (isSwagger2) {
        const host = doc.host as string;
        const basePath = (doc.basePath as string) || '';
        const schemes = (doc.schemes as string[]) || ['https'];
        if (host) return `${schemes[0]}://${host}${basePath}`;
        return null;
    }
    const servers = doc.servers as Array<{ url: string }>;
    if (servers && servers.length > 0) return servers[0].url;
    return null;
}

// ─ Auth ─

function extractAuth(doc: Record<string, unknown>, isSwagger2: boolean, warnings: string[]): AuthScheme {
    const secDefs = isSwagger2
        ? (doc.securityDefinitions as Record<string, Record<string, string>>)
        : ((doc.components as Record<string, unknown>)?.securitySchemes as Record<string, Record<string, string>>);

    if (!secDefs || Object.keys(secDefs).length === 0) {
        warnings.push('No security schemes found — API might be public or auth docs are missing.');
        return { type: 'none', description: 'No authentication detected.' };
    }

    const first = Object.values(secDefs)[0];
    const schemeType = (first.type || '').toLowerCase();

    if (schemeType === 'apikey') {
        return {
            type: 'apiKey',
            headerName: first.in === 'header' ? first.name : undefined,
            queryParamName: first.in === 'query' ? first.name : undefined,
            description: first.description || `API Key in ${first.in}: ${first.name}`,
        };
    }
    if (schemeType === 'http') {
        const scheme = (first.scheme || '').toLowerCase();
        if (scheme === 'bearer') {
            return { type: 'bearer', scheme: 'bearer', description: first.description || 'Bearer token authentication' };
        }
        return { type: 'basic', scheme: 'basic', description: first.description || 'Basic authentication' };
    }
    if (schemeType === 'oauth2') {
        return {
            type: 'oauth2',
            description: first.description || 'OAuth 2.0 authentication',
            flows: first.flows as unknown as Record<string, unknown>,
        };
    }

    return { type: 'unknown', description: `Detected scheme type: ${schemeType}` };
}

// ─ Endpoints ─

function extractEndpoints(doc: Record<string, unknown>, isSwagger2: boolean, warnings: string[]): Endpoint[] {
    const paths = (doc.paths as Record<string, Record<string, unknown>>) || {};
    const endpoints: Endpoint[] = [];
    const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

    for (const [path, pathItem] of Object.entries(paths)) {
        for (const method of methods) {
            const op = pathItem[method.toLowerCase()] as Record<string, unknown> | undefined;
            if (!op) continue;

            const id = (op.operationId as string) || `${method}_${path.replace(/[{}\/]/g, '_')}`;
            const tags = (op.tags as string[]) || ['default'];

            const params = extractParameters(op, pathItem, isSwagger2);
            const reqBody = extractRequestBody(op, isSwagger2);
            const responses = extractResponses(op, isSwagger2, warnings);

            endpoints.push({
                id,
                method,
                path,
                summary: (op.summary as string) || '',
                description: (op.description as string) || (op.summary as string) || '',
                tag: tags[0] || 'default',
                operationId: op.operationId as string,
                parameters: params,
                requestBody: reqBody || undefined,
                responses,
                auth: !!(op.security as unknown[])?.length || !!(doc.security as unknown[])?.length,
                deprecated: !!(op.deprecated),
            });
        }
    }

    return endpoints;
}

function extractParameters(
    op: Record<string, unknown>,
    pathItem: Record<string, unknown>,
    _isSwagger2: boolean
): Parameter[] {
    const raw = [
        ...((pathItem.parameters as Array<Record<string, unknown>>) || []),
        ...((op.parameters as Array<Record<string, unknown>>) || []),
    ];
    return raw.map((p) => ({
        name: p.name as string,
        in: p.in as Parameter['in'],
        required: !!(p.required),
        description: (p.description as string) || '',
        type: resolveParamType(p),
        default: p.default !== undefined ? String(p.default) : undefined,
        enum: p.enum as string[] | undefined,
        example: p.example !== undefined ? String(p.example) : undefined,
    }));
}

function resolveParamType(p: Record<string, unknown>): string {
    if (p.type) return p.type as string;
    const schema = p.schema as Record<string, unknown>;
    if (schema) return (schema.type as string) || 'string';
    return 'string';
}

function extractRequestBody(op: Record<string, unknown>, isSwagger2: boolean): RequestBody | null {
    if (isSwagger2) {
        const bodyParams = ((op.parameters as Array<Record<string, unknown>>) || [])
            .filter((p) => p.in === 'body');
        if (bodyParams.length === 0) return null;
        const schema = bodyParams[0].schema as Record<string, unknown>;
        return {
            required: !!(bodyParams[0].required),
            contentType: 'application/json',
            schema: flattenSchema(schema),
            example: (schema?.example as Record<string, unknown>) || undefined,
        };
    }

    const rb = op.requestBody as Record<string, unknown>;
    if (!rb) return null;
    const content = rb.content as Record<string, Record<string, unknown>>;
    if (!content) return null;
    const jsonContent = content['application/json'] || content[Object.keys(content)[0]];
    if (!jsonContent) return null;
    const schema = jsonContent.schema as Record<string, unknown>;
    return {
        required: !!(rb.required),
        contentType: Object.keys(content)[0],
        schema: flattenSchema(schema),
        example: (jsonContent.example || schema?.example) as Record<string, unknown> | undefined,
    };
}

function flattenSchema(schema: Record<string, unknown> | undefined): SchemaField[] {
    if (!schema) return [];
    const type = schema.type as string;
    if (type === 'object' || schema.properties) {
        const properties = (schema.properties as Record<string, Record<string, unknown>>) || {};
        const required = (schema.required as string[]) || [];
        return Object.entries(properties).map(([name, prop]) => ({
            name,
            type: (prop.type as string) || 'string',
            required: required.includes(name),
            description: (prop.description as string) || '',
            default: prop.default,
            enum: prop.enum as string[] | undefined,
            example: prop.example,
            nested: (prop.type === 'object' || prop.properties) ? flattenSchema(prop) : undefined,
        }));
    }
    if (type === 'array') {
        const items = schema.items as Record<string, unknown>;
        return [{
            name: 'items',
            type: 'array',
            required: false,
            description: (schema.description as string) || 'Array items',
            nested: flattenSchema(items),
        }];
    }
    return [{
        name: 'value',
        type: type || 'string',
        required: false,
        description: (schema.description as string) || '',
    }];
}

function extractResponses(
    op: Record<string, unknown>,
    _isSwagger2: boolean,
    _warnings: string[]
): ResponseDef[] {
    const resps = (op.responses as Record<string, Record<string, unknown>>) || {};
    return Object.entries(resps).map(([statusCode, resp]) => {
        let schema: SchemaField[] = [];
        let example: unknown;
        const content = resp.content as Record<string, Record<string, unknown>>;
        if (content) {
            const jsonContent = content['application/json'] || content[Object.keys(content)[0]];
            if (jsonContent) {
                schema = flattenSchema(jsonContent.schema as Record<string, unknown>);
                example = jsonContent.example || (jsonContent.schema as Record<string, unknown>)?.example;
            }
        } else if (resp.schema) {
            schema = flattenSchema(resp.schema as Record<string, unknown>);
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
