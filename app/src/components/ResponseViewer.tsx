'use client';

import React from 'react';

interface Props {
    response: {
        status: number;
        statusText: string;
        headers: Record<string, string>;
        body: unknown;
        time: number;
    } | null;
}

export default function ResponseViewer({ response }: Props) {
    if (!response) {
        return (
            <div className="response-viewer empty">
                <div className="response-placeholder">
                    <span className="placeholder-icon">📡</span>
                    <p>Response will appear here after you run the request.</p>
                    <p className="placeholder-hint">Fill in the parameters above and click <strong>Try It</strong></p>
                </div>
            </div>
        );
    }

    const isSuccess = response.status >= 200 && response.status < 300;
    const isRedirect = response.status >= 300 && response.status < 400;
    const isClientError = response.status >= 400 && response.status < 500;

    const statusClass = isSuccess ? 'success' : isRedirect ? 'redirect' : isClientError ? 'client-error' : 'server-error';
    const formattedBody = typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2);

    return (
        <div className="response-viewer">
            <div className="response-header">
                <div className={`status-badge ${statusClass}`}>
                    {response.status} {response.statusText}
                </div>
                <div className="response-time">{response.time}ms</div>
            </div>

            {Object.keys(response.headers).length > 0 && (
                <details className="response-headers">
                    <summary>Response Headers ({Object.keys(response.headers).length})</summary>
                    <div className="headers-list">
                        {Object.entries(response.headers).map(([key, value]) => (
                            <div key={key} className="header-item">
                                <span className="header-key">{key}:</span>
                                <span className="header-value">{value}</span>
                            </div>
                        ))}
                    </div>
                </details>
            )}

            <div className="response-body">
                <pre className="response-code"><code>{formattedBody}</code></pre>
            </div>
        </div>
    );
}
