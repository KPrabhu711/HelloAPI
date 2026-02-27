import { NextRequest, NextResponse } from 'next/server';
import { parseOpenApiSpec } from '@/lib/parsers/openapi-parser';
import { parseTextDocs } from '@/lib/parsers/text-parser';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { content, type } = body as { content: string; type: 'auto' | 'openapi' | 'text' };

        if (!content || content.trim().length === 0) {
            return NextResponse.json({ error: 'No content provided' }, { status: 400 });
        }

        let result;

        if (type === 'openapi' || (type === 'auto' && isLikelyOpenApi(content))) {
            result = parseOpenApiSpec(content);
        } else {
            result = parseTextDocs(content);
        }

        return NextResponse.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown parsing error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function isLikelyOpenApi(content: string): boolean {
    const trimmed = content.trim();
    // JSON with openapi or swagger key
    if (trimmed.startsWith('{')) {
        try {
            const doc = JSON.parse(trimmed);
            return !!(doc.openapi || doc.swagger);
        } catch { return false; }
    }
    // YAML with openapi or swagger key
    if (/^(openapi|swagger)\s*:/m.test(trimmed)) return true;
    return false;
}
