import { NextRequest, NextResponse } from 'next/server';
import { explainEndpoint, troubleshootError } from '@/lib/gemini-client';
import { Endpoint, ApiSpec } from '@/lib/types';

interface AiRequestBody {
    action: 'explain' | 'troubleshoot';
    endpoint: Endpoint;
    spec: Partial<ApiSpec>;
    error?: {
        status: number;
        body: unknown;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: AiRequestBody = await request.json();
        const { action, endpoint, spec, error } = body;

        if (!action || !endpoint) {
            return NextResponse.json(
                { error: 'Missing required fields: action, endpoint' },
                { status: 400 }
            );
        }

        let result: string;

        if (action === 'explain') {
            result = await explainEndpoint(endpoint, spec || {});
        } else if (action === 'troubleshoot') {
            if (!error || !error.status) {
                return NextResponse.json(
                    { error: 'Missing error details for troubleshoot action' },
                    { status: 400 }
                );
            }
            result = await troubleshootError(error.status, error.body, endpoint, spec || {});
        } else {
            return NextResponse.json(
                { error: `Unknown action: ${action}` },
                { status: 400 }
            );
        }

        return NextResponse.json({ result });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'AI request failed';

        // Check for missing API key
        if (message.includes('GEMINI_API_KEY') || message.includes('API key')) {
            return NextResponse.json({
                error: 'Gemini API key not configured. Set GEMINI_API_KEY environment variable. Get a free key at https://aistudio.google.com/apikey',
                hint: 'credentials',
            }, { status: 503 });
        }

        // Check for quota / rate limit errors
        if (message.includes('429') || message.includes('quota') || message.includes('RATE_LIMIT')) {
            return NextResponse.json({
                error: 'Gemini API rate limit reached. Please wait a moment and try again.',
                hint: 'rate_limit',
            }, { status: 429 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
