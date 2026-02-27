import { NextRequest, NextResponse } from 'next/server';

// ─── Server-Side API Proxy ───
// Forwards "Try It" requests to the actual target API,
// keeping auth credentials safe on the server side.

interface ProxyPayload {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
}

export async function POST(req: NextRequest) {
    try {
        const payload: ProxyPayload = await req.json();

        if (!payload.url || !payload.method) {
            return NextResponse.json(
                { error: 'Missing required fields: url, method' },
                { status: 400 }
            );
        }

        // Validate URL to prevent SSRF attacks on internal services
        const parsedUrl = new URL(payload.url);
        const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1', 'metadata.google.internal'];
        if (blockedHosts.some(h => parsedUrl.hostname === h || parsedUrl.hostname.endsWith('.internal'))) {
            return NextResponse.json(
                { error: 'Requests to internal/local hosts are not allowed' },
                { status: 403 }
            );
        }

        const startTime = Date.now();

        // Build fetch options
        const fetchOptions: RequestInit = {
            method: payload.method.toUpperCase(),
            headers: {
                'Accept': 'application/json',
                ...payload.headers,
            },
            // Don't follow redirects so the user sees them
            redirect: 'manual',
        };

        // Attach body for non-GET/HEAD methods
        if (payload.body && !['GET', 'HEAD'].includes(payload.method.toUpperCase())) {
            fetchOptions.body = JSON.stringify(payload.body);
            (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
        }

        // Make the real request
        const apiResponse = await fetch(payload.url, fetchOptions);
        const elapsed = Date.now() - startTime;

        // Read response body
        let responseBody: unknown;
        const contentType = apiResponse.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            try {
                responseBody = await apiResponse.json();
            } catch {
                responseBody = await apiResponse.text();
            }
        } else {
            const text = await apiResponse.text();
            // Try parsing as JSON anyway (some APIs don't set content-type correctly)
            try {
                responseBody = JSON.parse(text);
            } catch {
                responseBody = text;
            }
        }

        // Collect safe response headers
        const responseHeaders: Record<string, string> = {};
        const safeHeaders = [
            'content-type', 'x-request-id', 'x-ratelimit-limit', 'x-ratelimit-remaining',
            'x-ratelimit-reset', 'retry-after', 'x-total-count', 'link',
            'x-page', 'x-per-page', 'x-total', 'x-next-page',
            'cache-control', 'etag', 'last-modified', 'vary',
        ];
        apiResponse.headers.forEach((value, key) => {
            if (safeHeaders.includes(key.toLowerCase())) {
                responseHeaders[key] = value;
            }
        });

        return NextResponse.json({
            status: apiResponse.status,
            statusText: apiResponse.statusText,
            headers: responseHeaders,
            body: responseBody,
            time: elapsed,
        });
    } catch (err) {
        // Handle network errors, DNS failures, timeouts, etc.
        const message = err instanceof Error ? err.message : 'Proxy request failed';

        // Detect common error types for better user feedback
        let hint = '';
        if (message.includes('ENOTFOUND') || message.includes('getaddrinfo')) {
            hint = 'The API host could not be resolved. Check that the base URL is correct.';
        } else if (message.includes('ECONNREFUSED')) {
            hint = 'Connection was refused. The API server may be down or the URL may be wrong.';
        } else if (message.includes('ETIMEDOUT') || message.includes('timeout')) {
            hint = 'Request timed out. The API server may be slow or unreachable.';
        } else if (message.includes('certificate') || message.includes('SSL')) {
            hint = 'SSL/TLS certificate error. The API may have an invalid certificate.';
        }

        return NextResponse.json({
            status: 0,
            statusText: 'Network Error',
            headers: {},
            body: {
                error: message,
                hint: hint || 'Check the API URL and your network connection.',
            },
            time: 0,
        }, { status: 502 });
    }
}
