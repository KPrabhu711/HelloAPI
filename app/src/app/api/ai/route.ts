import { NextRequest, NextResponse } from 'next/server';
import * as groqClient from '@/lib/groq-client';
import { Endpoint, ApiSpec } from '@/lib/types';

interface AiRequestBody {
    action: 'explain' | 'troubleshoot' | 'overview';
    endpoint?: Endpoint;
    spec: Partial<ApiSpec>;
    provider?: string; // kept for backwards compat, ignored — always uses Groq
    error?: {
        status: number;
        body: unknown;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: AiRequestBody = await request.json();
        const { action, endpoint, spec, error } = body;

        if (!action) {
            return NextResponse.json(
                { error: 'Missing required field: action' },
                { status: 400 }
            );
        }

        const client = groqClient;
        let result: string;

        if (action === 'overview') {
            result = await client.generateApiOverview(spec || {});
        } else if (action === 'explain') {
            if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
            result = await client.explainEndpoint(endpoint, spec || {});
        } else if (action === 'troubleshoot') {
            if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
            if (!error || !error.status) {
                return NextResponse.json(
                    { error: 'Missing error details for troubleshoot action' },
                    { status: 400 }
                );
            }
            result = await client.troubleshootError(error.status, error.body, endpoint, spec || {});
        } else {
            return NextResponse.json(
                { error: `Unknown action: ${action}` },
                { status: 400 }
            );
        }

        return NextResponse.json({ result });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'AI request failed';

        if (message.includes('GEMINI_API_KEY') || message.includes('GROQ_API_KEY') || message.includes('API key')) {
            return NextResponse.json({
                error: message,
                hint: 'credentials',
            }, { status: 503 });
        }

        if (message.includes('429') || message.includes('quota') || message.includes('RATE_LIMIT') || message.includes('rate_limit')) {
            return NextResponse.json({
                error: 'AI API rate limit reached. Please wait a moment and try again.',
                hint: 'rate_limit',
            }, { status: 429 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
