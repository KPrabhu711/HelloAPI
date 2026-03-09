// ─── Groq AI Client for HelloAPI ───
// Provides AI-powered endpoint explanations and error troubleshooting
// using Groq's fast inference API.

import Groq from 'groq-sdk';
import { Endpoint, ApiSpec } from './types';

// ─── Configuration ───
const API_KEY = process.env.GROQ_API_KEY || '';
const MODEL_NAME = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

let groqClient: Groq | null = null;

function getClient(): Groq {
    if (!API_KEY) {
        throw new Error('GROQ_API_KEY environment variable is not set. Get a free key at https://console.groq.com/keys');
    }
    if (!groqClient) {
        groqClient = new Groq({ apiKey: API_KEY });
    }
    return groqClient;
}

// ─── Helper: Invoke Groq ───
async function invokeModel(prompt: string): Promise<string> {
    const client = getClient();

    const completion = await client.chat.completions.create({
        model: MODEL_NAME,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
        throw new Error('Empty response from Groq model');
    }

    return text;
}

// ─── Build context string from API spec ───
function buildApiContext(spec: Partial<ApiSpec>): string {
    const parts: string[] = [];
    if (spec.title) parts.push(`API: ${spec.title}`);
    if (spec.baseUrl) parts.push(`Base URL: ${spec.baseUrl}`);
    if (spec.auth) parts.push(`Auth: ${spec.auth.type}${spec.auth.headerName ? ` (header: ${spec.auth.headerName})` : ''}`);
    if (spec.description) parts.push(`Description: ${spec.description}`);
    return parts.join('\n');
}

// ─── Build endpoint context string ───
function buildEndpointContext(endpoint: Endpoint): string {
    const parts: string[] = [
        `${endpoint.method} ${endpoint.path}`,
        `Summary: ${endpoint.summary || 'N/A'}`,
        `Description: ${endpoint.description || 'N/A'}`,
        `Requires Auth: ${endpoint.auth ? 'Yes' : 'No'}`,
    ];

    if (endpoint.parameters.length > 0) {
        parts.push('Parameters:');
        for (const p of endpoint.parameters) {
            parts.push(`  - ${p.name} (${p.in}, ${p.type}${p.required ? ', required' : ''}): ${p.description || 'N/A'}`);
        }
    }

    if (endpoint.requestBody) {
        parts.push('Request Body:');
        for (const f of endpoint.requestBody.schema) {
            parts.push(`  - ${f.name} (${f.type}${f.required ? ', required' : ''}): ${f.description || 'N/A'}`);
        }
    }

    if (endpoint.responses.length > 0) {
        parts.push('Responses:');
        for (const r of endpoint.responses) {
            parts.push(`  - ${r.statusCode}: ${r.description}`);
        }
    }

    return parts.join('\n');
}

// ─── Public API: Explain an Endpoint ───
export async function explainEndpoint(
    endpoint: Endpoint,
    spec: Partial<ApiSpec>
): Promise<string> {
    const prompt = `You are an expert API documentation assistant. Given the following API context and endpoint details, provide a clear, developer-friendly explanation.

API Context:
${buildApiContext(spec)}

Endpoint:
${buildEndpointContext(endpoint)}

Provide a concise explanation covering:
1. **What it does** — a plain-English summary of this endpoint's purpose
2. **Common use cases** — 2-3 typical scenarios when a developer would use this
3. **Important notes** — any caveats, gotchas, or best practices (auth requirements, pagination, rate limits)
4. **Quick example** — a brief description of a typical request/response flow

Keep the response focused and under 250 words. Use markdown formatting.`;

    return invokeModel(prompt);
}

// ─── Public API: Troubleshoot an Error ───
export async function troubleshootError(
    statusCode: number,
    responseBody: unknown,
    endpoint: Endpoint,
    spec: Partial<ApiSpec>
): Promise<string> {
    const prompt = `You are an expert API debugging assistant. A developer received an error while calling an API endpoint. Help them understand and fix the issue.

API Context:
${buildApiContext(spec)}

Endpoint called:
${endpoint.method} ${endpoint.path}
Auth required: ${endpoint.auth ? 'Yes' : 'No'}

Error received:
Status code: ${statusCode}
Response body:
${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody, null, 2)}

Provide actionable troubleshooting guidance:
1. **What happened** — explain the error in plain English
2. **Most likely cause** — based on the status code and response
3. **How to fix it** — specific, actionable steps the developer should take
4. **Prevention tip** — one thing to do differently next time

Keep the response focused and under 200 words. Use markdown formatting.`;

    return invokeModel(prompt);
}

// ─── Public API: Generate API Overview ───
export async function generateApiOverview(spec: Partial<ApiSpec>): Promise<string> {
    const endpointList = (spec.endpoints || []).slice(0, 12).map(e =>
        `${e.method} ${e.path} — ${e.summary || e.description || 'No description'}`
    ).join('\n');

    const prompt = `You are a developer advocate writing a friendly intro for a new API user.

API Information:
${buildApiContext(spec)}

Available endpoints (sample):
${endpointList}

Write a concise API overview with exactly these four sections:

## What is ${spec.title || 'this API'}?
A 2-3 sentence plain-English explanation of what this API does and who makes it.

## What can you build?
Exactly 3 bullet points describing real things developers build with this API.

## Key capabilities
Exactly 4 bullet points — the most important things this API can do, based on the endpoints.

## Getting started
2-3 sentences on the fastest way to make your first call (auth type, base URL, simplest endpoint).

Keep each section tight. No filler. Use markdown formatting.`;

    return invokeModel(prompt);
}
