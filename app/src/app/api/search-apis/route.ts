import { NextRequest, NextResponse } from 'next/server';
import { searchApis, getCatalogCount } from '@/lib/api-registry';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = Math.min(Number(searchParams.get('limit') || '12'), 30);

    try {
        if (!query.trim()) {
            const count = await getCatalogCount();
            return NextResponse.json({ results: [], total: count });
        }

        const results = await searchApis(query, limit);
        return NextResponse.json({ results });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
