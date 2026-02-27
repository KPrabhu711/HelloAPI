'use client';

import React, { useState } from 'react';
import ParameterForm from './ParameterForm';
import ResponseViewer from './ResponseViewer';
import SnippetGenerator from './SnippetGenerator';
import ErrorGuidance from './ErrorGuidance';
import { useApi } from '@/context/ApiContext';

const METHOD_COLORS: Record<string, string> = {
    GET: '#10b981',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    PATCH: '#f97316',
    DELETE: '#ef4444',
};

interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
    time: number;
}

export default function EndpointDetail() {
    const { spec, selectedEndpoint } = useApi();
    const [paramValues, setParamValues] = useState<Record<string, string>>({});
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [activeSection, setActiveSection] = useState<'params' | 'snippets' | 'errors'>('params');
    const [authToken, setAuthToken] = useState('');
    const [isRequesting, setIsRequesting] = useState(false);

    if (!selectedEndpoint || !spec) {
        return (
            <div className="endpoint-detail empty">
                <div className="empty-state">
                    <span className="empty-icon">👈</span>
                    <h3>Select an endpoint</h3>
                    <p>Choose an endpoint from the sidebar to explore its details, parameters, and try it out.</p>
                </div>
            </div>
        );
    }

    const ep = selectedEndpoint;

    // Build the full URL with path params and query params substituted
    const buildRequestUrl = (): string => {
        let path = ep.path;

        // Substitute path parameters
        for (const param of ep.parameters.filter(p => p.in === 'path')) {
            const val = paramValues[param.name] || `{${param.name}}`;
            path = path.replace(`{${param.name}}`, encodeURIComponent(val));
        }

        // Build query string
        const queryParams = ep.parameters.filter(p => p.in === 'query');
        const queryParts: string[] = [];
        for (const param of queryParams) {
            const val = paramValues[param.name];
            if (val) {
                queryParts.push(`${encodeURIComponent(param.name)}=${encodeURIComponent(val)}`);
            }
        }

        const baseUrl = spec.baseUrl.replace(/\/+$/, '');
        const fullUrl = `${baseUrl}${path}${queryParts.length > 0 ? '?' + queryParts.join('&') : ''}`;
        return fullUrl;
    };

    // Build request headers (auth + custom headers)
    const buildHeaders = (): Record<string, string> => {
        const headers: Record<string, string> = {};

        // Auth header
        if (authToken.trim()) {
            if (spec.auth.type === 'apiKey' && spec.auth.headerName) {
                headers[spec.auth.headerName] = authToken;
            } else if (spec.auth.type === 'basic') {
                headers['Authorization'] = `Basic ${authToken}`;
            } else {
                // Default to Bearer for bearer, oauth2, or unknown
                headers['Authorization'] = `Bearer ${authToken}`;
            }
        }

        // Custom header params
        for (const param of ep.parameters.filter(p => p.in === 'header')) {
            const val = paramValues[param.name];
            if (val) headers[param.name] = val;
        }

        return headers;
    };

    // Build request body from body schema fields
    const buildBody = (): unknown | undefined => {
        if (!ep.requestBody || !ep.requestBody.schema || ep.requestBody.schema.length === 0) return undefined;

        const body: Record<string, unknown> = {};
        for (const field of ep.requestBody.schema) {
            const val = paramValues[`body.${field.name}`];
            if (val !== undefined && val !== '') {
                // Try to parse JSON values for objects/arrays/numbers/booleans
                if (field.type === 'integer' || field.type === 'number') {
                    body[field.name] = Number(val) || val;
                } else if (field.type === 'boolean') {
                    body[field.name] = val === 'true';
                } else if (field.type === 'array' || field.type === 'object') {
                    try { body[field.name] = JSON.parse(val); } catch { body[field.name] = val; }
                } else {
                    body[field.name] = val;
                }
            }
        }
        return Object.keys(body).length > 0 ? body : undefined;
    };

    const handleTryIt = async () => {
        setIsRequesting(true);
        setResponse(null);

        try {
            const url = buildRequestUrl();
            const headers = buildHeaders();
            const body = buildBody();

            const proxyRes = await fetch('/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method: ep.method,
                    url,
                    headers,
                    body,
                }),
            });

            const result: ApiResponse = await proxyRes.json();
            setResponse(result);
        } catch (err) {
            setResponse({
                status: 0,
                statusText: 'Request Failed',
                headers: {},
                body: {
                    error: err instanceof Error ? err.message : 'Failed to send request',
                    hint: 'Check that the API URL is accessible and try again.',
                },
                time: 0,
            });
        } finally {
            setIsRequesting(false);
        }
    };

    // Determine auth placeholder based on auth type
    const authPlaceholder = (() => {
        switch (spec.auth.type) {
            case 'apiKey': return `Enter your API key (${spec.auth.headerName || 'X-API-Key'})`;
            case 'basic': return 'Enter Base64-encoded username:password';
            case 'oauth2': return 'Enter your OAuth2 access token';
            case 'bearer': return 'Enter your Bearer token';
            default: return 'Enter your auth token';
        }
    })();

    return (
        <div className="endpoint-detail">
            {/* Header */}
            <div className="endpoint-detail-header">
                <div className="endpoint-title-row">
                    <span
                        className="method-badge-lg"
                        style={{ backgroundColor: METHOD_COLORS[ep.method] || '#6b7280' }}
                    >
                        {ep.method}
                    </span>
                    <code className="endpoint-path-lg">{ep.path}</code>
                    {ep.auth && <span className="auth-badge">🔒 Auth</span>}
                </div>
                <h2 className="endpoint-summary">{ep.summary || `${ep.method} ${ep.path}`}</h2>
                {ep.description && ep.description !== ep.summary && (
                    <p className="endpoint-description">{ep.description}</p>
                )}
            </div>

            {/* Auth Token Input */}
            {ep.auth && (
                <div className="auth-input-section">
                    <label className="auth-input-label">
                        <span className="auth-label-icon">🔑</span>
                        <span className="auth-label-text">Authentication</span>
                        <span className="auth-label-type">{spec.auth.type}</span>
                    </label>
                    <input
                        type="password"
                        className="auth-input"
                        placeholder={authPlaceholder}
                        value={authToken}
                        onChange={(e) => setAuthToken(e.target.value)}
                        autoComplete="off"
                    />
                    <p className="auth-input-hint">
                        Your token stays in your browser and is sent server-side via proxy — never stored.
                    </p>
                </div>
            )}

            {/* Section Tabs */}
            <div className="section-tabs">
                <button
                    className={`section-tab ${activeSection === 'params' ? 'active' : ''}`}
                    onClick={() => setActiveSection('params')}
                >
                    ⚡ Parameters
                </button>
                <button
                    className={`section-tab ${activeSection === 'snippets' ? 'active' : ''}`}
                    onClick={() => setActiveSection('snippets')}
                >
                    💻 Code Snippets
                </button>
                <button
                    className={`section-tab ${activeSection === 'errors' ? 'active' : ''}`}
                    onClick={() => setActiveSection('errors')}
                >
                    ⚠️ Errors
                </button>
            </div>

            {/* Active Section Content */}
            <div className="section-content">
                {activeSection === 'params' && (
                    <>
                        <ParameterForm
                            endpoint={ep}
                            values={paramValues}
                            onChange={setParamValues}
                        />
                        <button
                            className={`try-it-button ${isRequesting ? 'loading' : ''}`}
                            onClick={handleTryIt}
                            disabled={isRequesting}
                        >
                            {isRequesting ? (
                                <>
                                    <span className="spinner" />
                                    Sending Request...
                                </>
                            ) : (
                                <>
                                    <span className="try-it-icon">▶</span>
                                    Try It
                                </>
                            )}
                        </button>
                        <ResponseViewer response={response} />
                    </>
                )}

                {activeSection === 'snippets' && (
                    <SnippetGenerator paramValues={paramValues} />
                )}

                {activeSection === 'errors' && (
                    <ErrorGuidance />
                )}
            </div>
        </div>
    );
}
