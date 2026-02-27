import { ApiSpec, Endpoint, GeneratedSnippet } from '../types';

// ─── Curl Example Generator ───

export function generateCurlExamples(spec: ApiSpec): string {
    const lines: string[] = [];
    lines.push(`# ${spec.title} — curl Examples\n`);
    lines.push(`# Base URL: ${spec.baseUrl}\n`);

    for (const ep of spec.endpoints) {
        lines.push(`\n# ${ep.summary || `${ep.method} ${ep.path}`}`);
        lines.push(buildCurl(spec, ep));
    }

    return lines.join('\n');
}

export function buildCurl(spec: ApiSpec, ep: Endpoint, paramValues?: Record<string, string>): string {
    let path = ep.path;
    for (const p of ep.parameters.filter(p => p.in === 'path')) {
        const val = paramValues?.[p.name] || p.example || p.default || `{${p.name}}`;
        path = path.replace(`{${p.name}}`, val);
    }

    const queryParams = ep.parameters.filter(p => p.in === 'query');
    let queryString = '';
    if (queryParams.length > 0) {
        const parts = queryParams.map(p => {
            const val = paramValues?.[p.name] || p.example || p.default || `{${p.name}}`;
            return `${p.name}=${val}`;
        });
        queryString = '?' + parts.join('&');
    }

    let curl = 'curl';
    if (ep.method !== 'GET') curl += ` -X ${ep.method}`;
    curl += ` "${spec.baseUrl}${path}${queryString}"`;

    // Auth headers
    curl += buildAuthHeaderCurl(spec);

    // Content-Type for body
    if (ep.requestBody) {
        curl += ` \\\n  -H "Content-Type: ${ep.requestBody.contentType}"`;
        const body = buildBodyJson(ep, paramValues);
        curl += ` \\\n  -d '${body}'`;
    }

    return curl;
}

function buildAuthHeaderCurl(spec: ApiSpec): string {
    const a = spec.auth;
    if (a.type === 'bearer') return ` \\\n  -H "Authorization: Bearer $API_TOKEN"`;
    if (a.type === 'apiKey' && a.headerName) return ` \\\n  -H "${a.headerName}: $API_KEY"`;
    if (a.type === 'basic') return ` \\\n  -u "$API_USERNAME:$API_PASSWORD"`;
    return '';
}

function buildBodyJson(ep: Endpoint, paramValues?: Record<string, string>): string {
    if (!ep.requestBody) return '{}';
    if (ep.requestBody.example) return JSON.stringify(ep.requestBody.example, null, 2);
    const obj: Record<string, unknown> = {};
    for (const field of ep.requestBody.schema) {
        obj[field.name] = paramValues?.[field.name] || field.example || field.default || getPlaceholder(field.type);
    }
    return JSON.stringify(obj, null, 2);
}

function getPlaceholder(type: string): unknown {
    switch (type) {
        case 'integer': case 'number': return 0;
        case 'boolean': return true;
        case 'array': return [];
        case 'object': return {};
        default: return 'string_value';
    }
}

// ─── Snippet Generator (per-endpoint) ───

export function generateSnippets(spec: ApiSpec, ep: Endpoint, paramValues?: Record<string, string>): GeneratedSnippet {
    return {
        curl: buildCurl(spec, ep, paramValues),
        python: buildPython(spec, ep, paramValues),
        typescript: buildTypeScript(spec, ep, paramValues),
    };
}

function resolvedPath(ep: Endpoint, paramValues?: Record<string, string>): string {
    let path = ep.path;
    for (const p of ep.parameters.filter(p => p.in === 'path')) {
        const val = paramValues?.[p.name] || p.example || p.default || `{${p.name}}`;
        path = path.replace(`{${p.name}}`, val);
    }
    return path;
}

function buildPython(spec: ApiSpec, ep: Endpoint, paramValues?: Record<string, string>): string {
    const path = resolvedPath(ep, paramValues);
    const lines: string[] = [];
    lines.push('import requests');
    lines.push('');
    lines.push(`url = "${spec.baseUrl}${path}"`);

    // Headers
    lines.push('headers = {');
    if (spec.auth.type === 'bearer') lines.push('    "Authorization": "Bearer YOUR_TOKEN",');
    else if (spec.auth.type === 'apiKey' && spec.auth.headerName) lines.push(`    "${spec.auth.headerName}": "YOUR_API_KEY",`);
    if (ep.requestBody) lines.push('    "Content-Type": "application/json",');
    lines.push('}');

    // Query params
    const queryParams = ep.parameters.filter(p => p.in === 'query');
    if (queryParams.length > 0) {
        lines.push('params = {');
        for (const p of queryParams) {
            const val = paramValues?.[p.name] || p.example || p.default || `"${p.name}_value"`;
            lines.push(`    "${p.name}": ${typeof val === 'string' && !val.startsWith('"') ? `"${val}"` : val},`);
        }
        lines.push('}');
    }

    // Body
    if (ep.requestBody) {
        const body = buildBodyJson(ep, paramValues);
        lines.push(`data = ${body}`);
    }

    // Request
    const method = ep.method.toLowerCase();
    let call = `response = requests.${method}(url, headers=headers`;
    if (queryParams.length > 0) call += ', params=params';
    if (ep.requestBody) call += ', json=data';
    call += ')';
    lines.push('');
    lines.push(call);
    lines.push('print(response.status_code)');
    lines.push('print(response.json())');

    return lines.join('\n');
}

function buildTypeScript(spec: ApiSpec, ep: Endpoint, paramValues?: Record<string, string>): string {
    const path = resolvedPath(ep, paramValues);
    const lines: string[] = [];
    lines.push('const axios = require("axios");');
    lines.push('');

    // Headers
    const headers: string[] = [];
    if (spec.auth.type === 'bearer') headers.push('  "Authorization": "Bearer YOUR_TOKEN"');
    else if (spec.auth.type === 'apiKey' && spec.auth.headerName) headers.push(`  "${spec.auth.headerName}": "YOUR_API_KEY"`);
    if (ep.requestBody) headers.push('  "Content-Type": "application/json"');

    // Query params
    const queryParams = ep.parameters.filter(p => p.in === 'query');
    let queryStr = '';
    if (queryParams.length > 0) {
        const parts = queryParams.map(p => {
            const val = paramValues?.[p.name] || p.example || p.default || `${p.name}_value`;
            return `  ${p.name}: "${val}"`;
        });
        queryStr = `params: {\n${parts.join(',\n')}\n  },\n`;
    }

    // Body
    let bodyStr = '';
    if (ep.requestBody) {
        const body = buildBodyJson(ep, paramValues);
        bodyStr = `data: ${body},\n`;
    }

    lines.push(`axios({`);
    lines.push(`  method: "${ep.method.toLowerCase()}",`);
    lines.push(`  url: "${spec.baseUrl}${path}",`);
    if (headers.length > 0) {
        lines.push(`  headers: {\n${headers.join(',\n')}\n  },`);
    }
    if (queryStr) lines.push(`  ${queryStr}`);
    if (bodyStr) lines.push(`  ${bodyStr}`);
    lines.push(`})`);
    lines.push(`.then(res => console.log(res.data))`);
    lines.push(`.catch(err => console.error(err.response?.data || err.message));`);

    return lines.join('\n');
}
