import { NextRequest, NextResponse } from 'next/server';

// ─── Server-side spec fetcher ───
// Fetches any OpenAPI spec URL server-side to avoid CORS issues in the browser.

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
        }

        // Basic URL validation
        let parsed: URL;
        try {
            parsed = new URL(url);
        } catch {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return NextResponse.json({ error: 'Only HTTP/HTTPS URLs are allowed' }, { status: 400 });
        }

        // Try to fetch with multiple Accept headers and follow redirects
        // Some spec hosts (APIs.guru mirrors, GitHub raw, etc.) need specific headers
        const fetchAttempts = [
            { Accept: 'application/json, application/yaml, text/yaml, text/plain, */*' },
            { Accept: 'text/plain, */*' },
        ];

        let lastError = '';
        for (const headers of fetchAttempts) {
            try {
                const res = await fetch(url, {
                    headers: {
                        ...headers,
                        'User-Agent': 'HelloAPI/1.0 (OpenAPI Explorer)',
                    },
                    redirect: 'follow',
                    signal: AbortSignal.timeout(20000), // 20s — some spec endpoints are slow
                });

                if (!res.ok) {
                    lastError = `HTTP ${res.status}: ${res.statusText}`;
                    if (res.status === 404) {
                        return NextResponse.json(
                            { error: `Spec not found (404). The spec URL may have moved or been removed.` },
                            { status: 404 }
                        );
                    }
                    if (res.status === 401 || res.status === 403) {
                        return NextResponse.json(
                            { error: `Access denied (${res.status}). This spec requires authentication to download.` },
                            { status: 403 }
                        );
                    }
                    continue; // try next accept header
                }

                const text = await res.text();

                if (!text || text.trim().length < 20) {
                    lastError = 'Spec URL returned empty or very short content';
                    continue;
                }

                // Quick sanity check: must look like JSON or YAML
                const trimmed = text.trim();
                const looksLikeSpec =
                    trimmed.startsWith('{') ||          // JSON object
                    trimmed.startsWith('---') ||         // YAML document
                    trimmed.startsWith('openapi:') ||    // OAS3 YAML
                    trimmed.startsWith('swagger:') ||    // Swagger 2 YAML
                    trimmed.includes('"openapi"') ||     // OAS3 JSON key
                    trimmed.includes('"swagger"') ||     // Swagger 2 JSON key
                    trimmed.includes('"paths"');          // Paths object

                if (!looksLikeSpec) {
                    return NextResponse.json(
                        { error: 'URL did not return an OpenAPI/Swagger spec. It may be an HTML page or an API that requires authentication to access the spec.' },
                        { status: 422 }
                    );
                }

                return NextResponse.json({ content: text });
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                if (msg.toLowerCase().includes('timeout') || msg.includes('TimeoutError')) {
                    return NextResponse.json(
                        { error: 'Request timed out (20s). The spec server is too slow. Try the URL directly and paste the content.' },
                        { status: 504 }
                    );
                }
                lastError = msg;
            }
        }

        return NextResponse.json(
            { error: `Failed to fetch spec: ${lastError}` },
            { status: 502 }
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch spec';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
