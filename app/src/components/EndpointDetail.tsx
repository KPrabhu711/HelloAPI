'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ParameterForm from './ParameterForm';
import ResponseViewer from './ResponseViewer';
import SnippetGenerator from './SnippetGenerator';
import ErrorGuidance from './ErrorGuidance';
import { useApi } from '@/context/ApiContext';
import { AiResponse, ApiSpec } from '@/lib/types';
import {
    IconLock, IconSparkles, IconCpu, IconWarn, IconKey, IconLink,
    IconSliders, IconCode, IconShieldWarn, IconArrowLeft,
    IconPlay,
} from '@/components/Icons';

const METHOD_COLORS: Record<string, string> = {
    GET: '#10b981',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    PATCH: '#f97316',
    DELETE: '#ef4444',
};

// ─── Developer Portal Links ───
// Map common API providers (by title or base URL) to their key/token signup pages.
const DEV_PORTALS: Array<{ match: string[]; name: string; url: string }> = [
    { match: ['spotify'], name: 'Spotify Developer', url: 'https://developer.spotify.com/dashboard' },
    { match: ['twitter', 'x.com', 'x api'], name: 'X Developer Portal', url: 'https://developer.x.com/en/portal/dashboard' },
    { match: ['openai'], name: 'OpenAI Platform', url: 'https://platform.openai.com/api-keys' },
    { match: ['github'], name: 'GitHub Settings', url: 'https://github.com/settings/tokens' },
    { match: ['stripe'], name: 'Stripe Dashboard', url: 'https://dashboard.stripe.com/apikeys' },
    { match: ['twilio'], name: 'Twilio Console', url: 'https://console.twilio.com' },
    { match: ['sendgrid'], name: 'SendGrid API Keys', url: 'https://app.sendgrid.com/settings/api_keys' },
    { match: ['google maps', 'googleapis'], name: 'Google Cloud Console', url: 'https://console.cloud.google.com/apis/credentials' },
    { match: ['openweathermap', 'weather'], name: 'OpenWeatherMap', url: 'https://home.openweathermap.org/api_keys' },
    { match: ['newsapi', 'news api'], name: 'NewsAPI', url: 'https://newsapi.org/register' },
    { match: ['the movie db', 'tmdb'], name: 'TMDB', url: 'https://www.themoviedb.org/settings/api' },
    { match: ['imgur'], name: 'Imgur API', url: 'https://api.imgur.com/oauth2/addclient' },
    { match: ['reddit'], name: 'Reddit Apps', url: 'https://www.reddit.com/prefs/apps' },
    { match: ['slack'], name: 'Slack API', url: 'https://api.slack.com/apps' },
    { match: ['discord'], name: 'Discord Developer', url: 'https://discord.com/developers/applications' },
    { match: ['pagerduty'], name: 'PagerDuty', url: 'https://developer.pagerduty.com/api-reference/' },
    { match: ['nasa'], name: 'NASA API', url: 'https://api.nasa.gov/#signUp' },
    { match: ['shopify'], name: 'Shopify Partners', url: 'https://partners.shopify.com/' },
    { match: ['hubspot'], name: 'HubSpot API', url: 'https://app.hubspot.com/l/api-key' },
    { match: ['zendesk'], name: 'Zendesk', url: 'https://developer.zendesk.com/api-reference/' },
];

function findDevPortal(title: string, baseUrl: string): { name: string; url: string } | null {
    const haystack = (title + ' ' + baseUrl).toLowerCase();
    for (const portal of DEV_PORTALS) {
        if (portal.match.some(kw => haystack.includes(kw))) {
            return { name: portal.name, url: portal.url };
        }
    }
    return null;
}

function DevPortalLink({ spec }: { spec: ApiSpec }) {
    const portal = findDevPortal(spec.title, spec.baseUrl);
    if (!portal) return null;
    return (
        <a
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="dev-portal-link"
        >
            <IconLink size={12} /> Get your key at {portal.name} →
        </a>
    );
}

interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
    time: number;
}

export default function EndpointDetail() {
    const { spec, selectedEndpoint, aiProvider, authToken, setAuthToken } = useApi();
    const [paramValues, setParamValues] = useState<Record<string, string>>({});
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [activeSection, setActiveSection] = useState<'params' | 'snippets' | 'errors'>('params');
    const [isRequesting, setIsRequesting] = useState(false);
    const [authExpanded, setAuthExpanded] = useState(false);
    const [missingFields, setMissingFields] = useState<string[]>([]);

    // Auto-populate example/default values when endpoint changes
    useEffect(() => {
        if (!selectedEndpoint) return;
        const prefill: Record<string, string> = {};
        // Body schema fields with example or default
        if (selectedEndpoint.requestBody?.schema) {
            for (const field of selectedEndpoint.requestBody.schema) {
                const val = field.example !== undefined ? String(field.example)
                    : field.default !== undefined ? String(field.default)
                    : '';
                if (val) prefill[field.name] = val;
            }
        }
        setParamValues(prev => ({ ...prefill, ...prev }));
        setMissingFields([]);
    }, [selectedEndpoint]);
    // AI Explain state
    const [aiExplanation, setAiExplanation] = useState<string | null>(null);
    const [aiExplainLoading, setAiExplainLoading] = useState(false);
    const [aiExplainError, setAiExplainError] = useState<string | null>(null);
    const [showAiExplain, setShowAiExplain] = useState(false);

    // Auto-expand auth when endpoint requires it
    useEffect(() => {
        if (selectedEndpoint?.auth || (spec?.auth?.type && spec.auth.type !== 'none')) {
            setAuthExpanded(true);
        }
    }, [selectedEndpoint, spec]);

    // Reset explanation when endpoint changes (remove stale AI explain)
    useEffect(() => {
        setAiExplanation(null);
        setAiExplainError(null);
        setShowAiExplain(false);
    }, [selectedEndpoint]);

    // AI Explain handler - must be before early return to maintain hook order
    const handleAiExplain = useCallback(async () => {
        if (!selectedEndpoint || !spec) return;
        
        if (aiExplanation) {
            setShowAiExplain(!showAiExplain);
            return;
        }

        setAiExplainLoading(true);
        setAiExplainError(null);
        setShowAiExplain(true);

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'explain',
                    endpoint: selectedEndpoint,
                    spec: { title: spec.title, baseUrl: spec.baseUrl, auth: spec.auth, description: spec.description },
                }),
            });

            const data: AiResponse = await res.json();

            if (!res.ok || data.error) {
                setAiExplainError(data.error || 'AI request failed');
            } else {
                setAiExplanation(data.result || '');
            }
        } catch {
            setAiExplainError('Failed to connect to AI service. Check your API key configuration.');
        } finally {
            setAiExplainLoading(false);
        }
    }, [selectedEndpoint, spec, aiExplanation, showAiExplain]);

    if (!selectedEndpoint || !spec) {
        return (
            <div className="endpoint-detail empty">
                <div className="empty-state">
                    <span className="empty-icon"><IconArrowLeft size={28} /></span>
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
    // NOTE: ParameterForm stores body fields under paramValues[field.name] (no prefix)
    const buildBody = (): unknown | undefined => {
        if (!ep.requestBody || !ep.requestBody.schema || ep.requestBody.schema.length === 0) return undefined;

        const body: Record<string, unknown> = {};
        for (const field of ep.requestBody.schema) {
            const val = paramValues[field.name];  // direct key — matches what ParameterForm writes
            if (val !== undefined && val !== '') {
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

    // Validate required fields before sending
    const validateRequired = (): string[] => {
        const missing: string[] = [];
        // Required path/query params
        for (const p of ep.parameters.filter(p => p.required)) {
            if (!paramValues[p.name]?.trim()) missing.push(p.name);
        }
        // Required body fields
        if (ep.requestBody?.required && ep.requestBody.schema) {
            for (const f of ep.requestBody.schema.filter(f => f.required)) {
                if (!paramValues[f.name]?.trim()) missing.push(f.name);
            }
        }
        return missing;
    };

    const handleTryIt = async () => {
        const missing = validateRequired();
        if (missing.length > 0) {
            setMissingFields(missing);
            return;
        }
        setMissingFields([]);
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
            case 'apiKey': return `Enter your API key${spec.auth.headerName ? ` (${spec.auth.headerName})` : ''}`;
            case 'basic': return 'Enter Base64-encoded username:password';
            case 'oauth2': return 'Enter your OAuth2 access token (Bearer)';
            case 'bearer': return 'Enter your Bearer token';
            default: return 'Enter your API key or access token';
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
                    {ep.auth && <span className="auth-badge"><IconLock size={11} /> Auth</span>}
                </div>
                <h2 className="endpoint-summary">{ep.summary || `${ep.method} ${ep.path}`}</h2>
                {ep.description && ep.description !== ep.summary && (
                    <p className="endpoint-description">{ep.description}</p>
                )}
                <div className="ai-explain-row">
                    <button
                        className={`ai-explain-button ${showAiExplain ? 'active' : ''}`}
                        onClick={handleAiExplain}
                        disabled={aiExplainLoading}
                    >
                        {aiExplainLoading ? (
                            <><span className="spinner" /> Thinking...</>
                        ) : (
                            <><IconSparkles size={14} /> AI Explain</>
                        )}
                    </button>
                </div>
            </div>

            {/* AI Explanation Panel */}
            {showAiExplain && (
                <div className="ai-panel">
                    <div className="ai-panel-header">
                        <span className="ai-panel-icon"><IconCpu size={15} /></span>
                        <span className="ai-panel-title">AI Explanation</span>
                        <button className="ai-panel-close" onClick={() => setShowAiExplain(false)}>✕</button>
                    </div>
                    <div className="ai-panel-body">
                        {aiExplainLoading && (
                            <div className="ai-loading">
                                <div className="ai-shimmer" />
                                <div className="ai-shimmer short" />
                                <div className="ai-shimmer" />
                            </div>
                        )}
                        {aiExplainError && (
                            <div className="ai-error">
                                <IconWarn size={14} /> {aiExplainError}
                            </div>
                        )}
                        {aiExplanation && (
                            <div className="ai-content" dangerouslySetInnerHTML={{ __html: formatAiMarkdown(aiExplanation) }} />
                        )}
                    </div>
                </div>
            )}

            {/* Always-visible Auth / API Key section — collapsible */}
            <div className={`auth-input-section ${authExpanded ? 'expanded' : 'collapsed'}`}>
                <button
                    className="auth-section-toggle"
                    onClick={() => setAuthExpanded(e => !e)}
                >
                    <span className="auth-toggle-left">
                        <span className="auth-label-icon"><IconKey size={14} /></span>
                        <span className="auth-label-text">API Key / Token</span>
                        {spec.auth.type !== 'none' && (
                            <span className="auth-label-type">{spec.auth.type}</span>
                        )}
                        {ep.auth && spec.auth.type === 'none' && (
                            <span className="auth-label-type">required</span>
                        )}
                        {authToken && <span className="auth-set-badge">set ✓</span>}
                    </span>
                    <span className="auth-toggle-right">
                        <DevPortalLink spec={spec} />
                        <span className="auth-chevron">{authExpanded ? '▲' : '▼'}</span>
                    </span>
                </button>
                {authExpanded && (
                    <div className="auth-input-body">
                        <input
                            type="password"
                            className="auth-input"
                            placeholder={authPlaceholder}
                            value={authToken}
                            onChange={(e) => setAuthToken(e.target.value)}
                            autoComplete="off"
                            autoFocus={ep.auth}
                        />
                        {authToken && (
                            <button
                                className="auth-clear-btn"
                                onClick={() => setAuthToken('')}
                            >
                                ✕ Clear
                            </button>
                        )}
                        <p className="auth-input-hint">
                            {spec.auth.type === 'none' && !ep.auth
                                ? '⚠️ No auth was detected in this spec, but you can still pass a key if the API requires one.'
                                : 'Your key is sent server-side via proxy — never stored or logged.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Section Tabs */}
            <div className="section-tabs">
                <button
                    className={`section-tab ${activeSection === 'params' ? 'active' : ''}`}
                    onClick={() => setActiveSection('params')}
                >
                    <IconSliders size={13} /> Parameters
                </button>
                <button
                    className={`section-tab ${activeSection === 'snippets' ? 'active' : ''}`}
                    onClick={() => setActiveSection('snippets')}
                >
                    <IconCode size={13} /> Code Snippets
                </button>
                <button
                    className={`section-tab ${activeSection === 'errors' ? 'active' : ''}`}
                    onClick={() => setActiveSection('errors')}
                >
                    <IconShieldWarn size={13} /> Errors
                </button>
            </div>

            {/* Active Section Content */}
            <div className="section-content">
                {activeSection === 'params' && (
                    <>
                        <ParameterForm
                            endpoint={ep}
                            values={paramValues}
                            onChange={(v) => { setParamValues(v); setMissingFields([]); }}
                            missingFields={missingFields}
                        />
                        {missingFields.length > 0 && (
                            <div className="required-fields-error">
                                <IconWarn size={14} />
                                <span>
                                    Required {missingFields.length === 1 ? 'field' : 'fields'} missing:
                                    {' '}<strong>{missingFields.join(', ')}</strong>
                                </span>
                            </div>
                        )}
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
                                    <IconPlay size={13} />
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
                    <ErrorGuidance response={response} />
                )}
            </div>
        </div>
    );
}

// Simple markdown-to-HTML converter for AI responses
function formatAiMarkdown(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let inList = false;

    for (const raw of lines) {
        let line = raw;

        // ── Headings (####, ###, ##, #) ──
        if (/^#{4}\s+(.+)$/.test(line)) {
            if (inList) { result.push('</ul>'); inList = false; }
            result.push(`<h5>${line.replace(/^#{4}\s+/, '')}</h5>`);
            continue;
        }
        if (/^#{3}\s+(.+)$/.test(line)) {
            if (inList) { result.push('</ul>'); inList = false; }
            result.push(`<h4>${line.replace(/^#{3}\s+/, '')}</h4>`);
            continue;
        }
        if (/^#{2}\s+(.+)$/.test(line)) {
            if (inList) { result.push('</ul>'); inList = false; }
            result.push(`<h3>${line.replace(/^#{2}\s+/, '')}</h3>`);
            continue;
        }
        if (/^#{1}\s+(.+)$/.test(line)) {
            if (inList) { result.push('</ul>'); inList = false; }
            result.push(`<h2>${line.replace(/^#{1}\s+/, '')}</h2>`);
            continue;
        }

        // ── List items (-, *, + and numbered) ──
        const listMatch = line.match(/^(?:[-*+]|\d+\.)\s+(.+)$/);
        if (listMatch) {
            if (!inList) { result.push('<ul>'); inList = true; }
            result.push(`<li>${applyInline(listMatch[1])}</li>`);
            continue;
        }

        // ── Close list on blank / non-list line ──
        if (inList) { result.push('</ul>'); inList = false; }

        if (line.trim() === '') {
            result.push('<br/>');
        } else {
            result.push(`<p>${applyInline(line)}</p>`);
        }
    }

    if (inList) result.push('</ul>');

    return result.join('');
}

// Apply inline formatting: bold, italic, inline code
function applyInline(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}
