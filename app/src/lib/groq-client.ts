// ─── Groq AI Client for HelloAPI ───
// Provides AI-powered endpoint explanations and error troubleshooting
// using Groq (fast inference).

import Groq from 'groq-sdk';
import { Endpoint, ApiSpec } from './types';

// ─── Configuration ───
const API_KEY = process.env.GROQ_API_KEY || '';
const MODEL_NAME = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

let groq: Groq | null = null;

function getClient(): Groq {
    if (!API_KEY) {
        throw new Error('GROQ_API_KEY environment variable is not set. Get a free key at https://console.groq.com/keys');
    }
    if (!groq) {
        groq = new Groq({ apiKey: API_KEY });
    }
    return groq;
}

// ─── Helper: Invoke Groq ───
async function invokeModel(prompt: string): Promise<string> {
    const client = getClient();

    const chatCompletion = await client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: MODEL_NAME,
        temperature: 0.3,
        max_tokens: 1024,
    });

    const text = chatCompletion.choices[0]?.message?.content;

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
    const prompt = `You are an API documentation assistant. Explain this endpoint concisely.

API: ${buildApiContext(spec)}

Endpoint:
${buildEndpointContext(endpoint)}

Provide:
1. **Purpose** — one-sentence summary
2. **Use cases** — 2 brief scenarios
3. **Notes** — key caveats (auth, limits, gotchas)

Keep under 150 words. Use markdown.`;

    return invokeModel(prompt);
}

// ─── Public API: Troubleshoot an Error ───
export async function troubleshootError(
    statusCode: number,
    responseBody: unknown,
    endpoint: Endpoint,
    spec: Partial<ApiSpec>
): Promise<string> {
    const prompt = `You are an API debugging assistant. A developer got an error calling an endpoint.

API: ${buildApiContext(spec)}
Endpoint: ${endpoint.method} ${endpoint.path} (auth: ${endpoint.auth ? 'yes' : 'no'})
Error: ${statusCode}
Body: ${typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody, null, 2)}

Provide:
1. **What happened** — one sentence
2. **Likely cause** — most probable reason
3. **Fix** — actionable steps

Keep under 120 words. Use markdown.`;

    return invokeModel(prompt);
}
