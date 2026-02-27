import {
    ApiSpec, AuthScheme, Endpoint, Parameter, TagGroup,
    PaginationHint, RateLimitHint, HttpMethod, ParseResult
} from '../types';

// ─── Free-Text Documentation Parser ───
// Extracts API information from unstructured documentation text using
// heuristics, regex patterns, and common documentation patterns.

export function parseTextDocs(input: string): ParseResult {
    const warnings: string[] = [];
    const todos: string[] = [];

    const baseUrl = extractBaseUrl(input);
    if (!baseUrl) {
        todos.push('TODO: Base URL could not be determined from the text — please provide it.');
    }

    const auth = extractAuth(input, warnings);
    const endpoints = extractEndpoints(input);
    if (endpoints.length === 0) {
        warnings.push('No endpoints could be extracted from the documentation text.');
        todos.push('TODO: Manually add endpoint definitions — the parser could not detect any.');
    }

    const tags = buildTagGroups(endpoints);
    const paginationHints = extractPaginationHints(input);
    const rateLimitHints = extractRateLimitHints(input);

    const spec: ApiSpec = {
        title: extractTitle(input) || 'Untitled API',
        description: extractDescription(input),
        version: '1.0.0',
        baseUrl: baseUrl || 'https://api.example.com',
        auth,
        endpoints,
        tags,
        paginationHints,
        rateLimitHints,
        sourceType: 'text',
    };

    return { spec, warnings, todos };
}

// ─ Title ─

function extractTitle(text: string): string | null {
    // Try markdown H1
    const h1 = text.match(/^#\s+(.+)$/m);
    if (h1) return h1[1].trim();
    // Try first line that looks like a title
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 0 && lines[0].length < 80) return lines[0].trim();
    return null;
}

function extractDescription(text: string): string {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    return lines.slice(0, 3).join(' ').substring(0, 200);
}

// ─ Base URL ─

function extractBaseUrl(text: string): string | null {
    const urlPattern = /(?:base\s*url|api\s*url|endpoint|server|host)[:\s]*\n?\s*(https?:\/\/[^\s\n"'`<>]+)/i;
    const match = text.match(urlPattern);
    if (match) return match[1].replace(/\/+$/, '');

    // Fallback: find any URL that looks like an API base
    const anyUrl = text.match(/(https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9.]*(?:\/api)?(?:\/v\d+)?)/);
    if (anyUrl) return anyUrl[1].replace(/\/+$/, '');

    return null;
}

// ─ Auth ─

function extractAuth(text: string, warnings: string[]): AuthScheme {
    const lower = text.toLowerCase();

    if (/bearer\s*token/i.test(text) || /authorization:\s*bearer/i.test(text)) {
        return { type: 'bearer', scheme: 'bearer', description: 'Bearer token authentication (detected from docs)' };
    }
    if (/api[_-]?key/i.test(text) || /x-api-key/i.test(text)) {
        const headerMatch = text.match(/(x-api-key|api[_-]?key)/i);
        return {
            type: 'apiKey',
            headerName: headerMatch?.[1] || 'X-API-Key',
            description: 'API Key authentication (detected from docs)',
        };
    }
    if (lower.includes('basic auth')) {
        return { type: 'basic', scheme: 'basic', description: 'Basic authentication (detected from docs)' };
    }
    if (lower.includes('oauth')) {
        return { type: 'oauth2', description: 'OAuth 2.0 (detected from docs)' };
    }

    warnings.push('Authentication method could not be determined from the text.');
    return { type: 'unknown', description: 'Authentication method not detected — please specify.' };
}

// ─ Endpoints ─

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

function extractEndpoints(text: string): Endpoint[] {
    const endpoints: Endpoint[] = [];
    const seen = new Set<string>();

    // Pattern: GET /users, POST /orders, etc.
    const patterns = [
        /\b(GET|POST|PUT|PATCH|DELETE)\s+(\/[a-zA-Z0-9_\-{}/:.]+)/gi,
        /`(GET|POST|PUT|PATCH|DELETE)\s+(\/[a-zA-Z0-9_\-{}/:.]+)`/gi,
        /\*\*(GET|POST|PUT|PATCH|DELETE)\*\*\s+(\/[a-zA-Z0-9_\-{}/:.]+)/gi,
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const method = match[1].toUpperCase() as HttpMethod;
            const path = match[2];
            const key = `${method} ${path}`;
            if (seen.has(key) || !HTTP_METHODS.includes(method)) continue;
            seen.add(key);

            const context = extractContextAround(text, match.index, 500);
            const params = extractParamsFromContext(path, context);
            const tag = guessTag(path);

            endpoints.push({
                id: `${method.toLowerCase()}_${path.replace(/[{}\/:.]/g, '_')}`,
                method,
                path,
                summary: extractSummaryFromContext(context, method, path),
                description: context.substring(0, 200),
                tag,
                parameters: params,
                responses: [{ statusCode: '200', description: 'Successful response' }],
                auth: true,
            });
        }
    }

    // Also look for curl examples
    const curlPattern = /curl\s+(?:-X\s+)?(GET|POST|PUT|PATCH|DELETE)?\s*['"]?(https?:\/\/[^\s'"]+)/gi;
    let curlMatch;
    while ((curlMatch = curlPattern.exec(text)) !== null) {
        const method = (curlMatch[1] || 'GET').toUpperCase() as HttpMethod;
        const fullUrl = curlMatch[2];
        const urlObj = safeParseUrl(fullUrl);
        if (!urlObj) continue;
        const path = urlObj.pathname;
        const key = `${method} ${path}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const tag = guessTag(path);
        endpoints.push({
            id: `${method.toLowerCase()}_${path.replace(/[{}\/:.]/g, '_')}`,
            method,
            path,
            summary: `${method} ${path}`,
            description: `Extracted from curl example`,
            tag,
            parameters: [],
            responses: [{ statusCode: '200', description: 'Successful response' }],
            auth: true,
        });
    }

    return endpoints;
}

function safeParseUrl(url: string): URL | null {
    try {
        return new URL(url);
    } catch {
        return null;
    }
}

function extractContextAround(text: string, index: number, radius: number): string {
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + radius);
    return text.substring(start, end);
}

function extractSummaryFromContext(context: string, method: string, path: string): string {
    // Try to find a heading near the endpoint
    const headingMatch = context.match(/#+\s+(.+)/);
    if (headingMatch) return headingMatch[1].trim();
    return `${method} ${path}`;
}

function extractParamsFromContext(path: string, _context: string): Parameter[] {
    const params: Parameter[] = [];
    // Extract path parameters from {param} patterns
    const pathParams = path.match(/\{([^}]+)\}/g);
    if (pathParams) {
        for (const p of pathParams) {
            const name = p.replace(/[{}]/g, '');
            params.push({
                name,
                in: 'path',
                required: true,
                description: `Path parameter: ${name}`,
                type: 'string',
            });
        }
    }
    return params;
}

function guessTag(path: string): string {
    const segments = path.split('/').filter(s => s && !s.startsWith('{') && !s.startsWith(':'));
    if (segments.length >= 2) return capitalize(segments[1]);
    if (segments.length === 1) return capitalize(segments[0]);
    return 'default';
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─ Tag Groups ─

function buildTagGroups(endpoints: Endpoint[]): TagGroup[] {
    const tagMap = new Map<string, TagGroup>();
    for (const ep of endpoints) {
        const tag = ep.tag || 'default';
        if (!tagMap.has(tag)) {
            tagMap.set(tag, { name: tag, endpointIds: [] });
        }
        tagMap.get(tag)!.endpointIds.push(ep.id);
    }
    return Array.from(tagMap.values());
}

// ─ Pagination ─

function extractPaginationHints(text: string): PaginationHint[] {
    const hints: PaginationHint[] = [];
    const lower = text.toLowerCase();
    if (/\bcursor\b/.test(lower) || /\bafter\b/.test(lower)) {
        hints.push({ type: 'cursor', parameters: ['cursor'], description: 'Cursor-based pagination detected' });
    }
    if (/\boffset\b/.test(lower) && /\blimit\b/.test(lower)) {
        hints.push({ type: 'offset', parameters: ['offset', 'limit'], description: 'Offset-based pagination detected' });
    }
    if (/\bpage\b/.test(lower) && /\bper_page\b/.test(lower)) {
        hints.push({ type: 'page', parameters: ['page', 'per_page'], description: 'Page-based pagination detected' });
    }
    return hints;
}

// ─ Rate Limits ─

function extractRateLimitHints(text: string): RateLimitHint[] {
    const hints: RateLimitHint[] = [];
    if (/429|rate.?limit|too many requests/i.test(text)) {
        hints.push({ statusCode: 429, retryHeader: 'Retry-After', description: 'Rate limiting detected in docs' });
    }
    return hints;
}
