'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '@/context/ApiContext';
import { AiResponse } from '@/lib/types';
import {
    IconCheckCircle, IconMonitor, IconCog, IconGlobe,
    IconGradCap, IconArrowUp, IconArrowDown,
    IconTag, IconLink, IconLightning, IconLock,
    IconRefresh, IconSparkles, IconWarn, IconPlay,
} from '@/components/Icons';

// ─── Animated Request/Response Flow Diagram ───
function ApiFlowDiagram({ baseUrl, method, path }: { baseUrl: string; method: string; path: string }) {
    const [step, setStep] = useState(0);

    // steps: 0=idle, 1=request traveling, 2=server processing, 3=response traveling, 4=received OK
    useEffect(() => {
        const timings = [1400, 850, 1100, 850, 1400];
        const timer = setTimeout(() => setStep(s => (s + 1) % 5), timings[step]);
        return () => clearTimeout(timer);
    }, [step]);

    const shortUrl = baseUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '').substring(0, 20);
    const shortPath = path.length > 22 ? path.substring(0, 22) + '…' : path;

    return (
        <div className="flow-diagram">
            {/* Client node */}
            <div className={`flow-node client-node${step === 4 ? ' received' : step >= 1 ? ' active' : ''}`}>
                <div className="flow-node-icon">{step === 4 ? <IconCheckCircle size={20} /> : <IconMonitor size={20} />}</div>
                <div className="flow-node-label">Your App</div>
                {step === 4 && <div className="flow-ok-badge">Received!</div>}
            </div>

            {/* Bidirectional arrows column */}
            <div className="flow-arrows-col">
                {/* Request row — travels left → right */}
                <div className={`flow-req-row${step === 1 ? ' active' : ''}`}>
                    <div className={`flow-req-label${step === 1 ? ' visible' : ''}`}>
                        <span className={`flow-method ${method.toLowerCase()}`}>{method}</span>
                        <span className="flow-path">{shortPath}</span>
                    </div>
                    <div className="flow-track">
                        <div className={`flow-bullet${step === 1 ? ' shooting-right' : ''}`} />
                        <span className="flow-arrowhead right">›</span>
                    </div>
                </div>

                {/* Response row — travels right → left */}
                <div className={`flow-res-row${step >= 3 ? ' active' : ''}`}>
                    <div className="flow-track">
                        <span className="flow-arrowhead left">‹</span>
                        <div className={`flow-bullet${step === 3 ? ' shooting-left' : ''}`} />
                    </div>
                    <div className={`flow-res-label${step >= 3 ? ' visible' : ''}`}>
                        <span className="flow-status ok">200 OK</span>
                        <span className="flow-data">JSON data</span>
                    </div>
                </div>
            </div>

            {/* Server node */}
            <div className={`flow-node server-node${step === 2 ? ' processing' : step >= 1 ? ' active' : ''}`}>
                <div className="flow-node-icon">{step === 2 ? <IconCog size={20} /> : <IconGlobe size={20} />}</div>
                <div className="flow-node-label">{shortUrl || 'API Server'}</div>
                {step === 2 && <div className="flow-processing-dot" />}
            </div>
        </div>
    );
}

// ─── New to APIs? collapsible card ───
function NewToApisCard() {
    const [open, setOpen] = useState(false);

    return (
        <div className={`new-to-apis-card ${open ? 'open' : ''}`}>
            <button className="new-to-apis-toggle" onClick={() => setOpen(!open)}>
                <span className="new-to-apis-icon"><IconGradCap size={18} /></span>
                <span className="new-to-apis-title">New to APIs?</span>
                <span className="new-to-apis-subtitle">Learn the basics in 30 seconds</span>
                <span className="new-to-apis-chevron">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div className="new-to-apis-body">
                    <p className="new-to-apis-intro">
                        An <strong>API</strong> (Application Programming Interface) is a way for two programs to talk to each other over the internet.
                        Think of it like a waiter at a restaurant — you give the waiter (API) your order (request), they go to the kitchen (server),
                        and bring back your food (response).
                    </p>
                    <div className="new-to-apis-concepts">
                        <div className="concept">
                            <span className="concept-icon"><IconArrowUp size={18} /></span>
                            <div>
                                <strong>Request</strong>
                                <p>Your app sends an HTTP request with a method (GET, POST…), a URL, and optional data.</p>
                            </div>
                        </div>
                        <div className="concept">
                            <span className="concept-icon"><IconCog size={18} /></span>
                            <div>
                                <strong>Server processes</strong>
                                <p>The API server reads your request, looks up or modifies the data, and prepares a response.</p>
                            </div>
                        </div>
                        <div className="concept">
                            <span className="concept-icon"><IconArrowDown size={18} /></span>
                            <div>
                                <strong>Response</strong>
                                <p>You get back a status code (200 = success, 404 = not found) and usually JSON data.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Featured endpoint card ───
function FeaturedEndpoint({ method, path, summary, onTryIt }: {
    method: string; path: string; summary: string; onTryIt: () => void;
}) {
    const colors: Record<string, string> = {
        GET: '#10b981', POST: '#3b82f6', PUT: '#f59e0b', PATCH: '#f97316', DELETE: '#ef4444',
    };

    return (
        <div className="featured-endpoint">
            <div className="featured-ep-top">
                <span className="featured-ep-method" style={{ backgroundColor: colors[method] || '#6b7280' }}>{method}</span>
                <code className="featured-ep-path">{path}</code>
            </div>
            <p className="featured-ep-summary">{summary}</p>
            <button className="featured-ep-try" onClick={onTryIt}>
                Try in Playground →
            </button>
        </div>
    );
}

// ─── Main Overview Component ───
export default function ApiOverview() {
    const { spec, selectEndpoint } = useApi();
    const [overview, setOverview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOverview = useCallback(async () => {
        if (!spec || overview) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'overview',
                    spec: {
                        title: spec.title,
                        description: spec.description,
                        baseUrl: spec.baseUrl,
                        auth: spec.auth,
                        endpoints: spec.endpoints,
                    },
                }),
            });
            const data: AiResponse = await res.json();
            if (!res.ok || data.error) {
                setError(data.error || 'Failed to generate overview');
            } else {
                setOverview(data.result || '');
            }
        } catch {
            setError('Failed to connect to AI service.');
        } finally {
            setLoading(false);
        }
    }, [spec, overview]);

    // Auto-fetch on mount
    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    if (!spec) return null;

    // Pick up to 3 featured endpoints — prefer GET, then first available
    const getEndpoints = spec.endpoints.filter(e => e.method === 'GET').slice(0, 2);
    const otherEndpoints = spec.endpoints.filter(e => e.method !== 'GET').slice(0, 1);
    const featured = [...getEndpoints, ...otherEndpoints].slice(0, 3);

    // Pick a simple GET for the flow diagram
    const demoEndpoint = spec.endpoints.find(e => e.method === 'GET') || spec.endpoints[0];

    return (
        <div className="api-overview">
            {/* Hero Header */}
            <div className="overview-hero">
                <div className="overview-hero-content">
                    <div className="overview-api-badge">
                        <span className="overview-api-badge-dot" />
                        {spec.sourceType === 'openapi' ? 'OpenAPI Spec' : 'API Documentation'}
                    </div>
                    <h1 className="overview-title">{spec.title}</h1>
                    {spec.description && (
                        <p className="overview-description">{spec.description}</p>
                    )}
                    <div className="overview-meta">
                        <span className="overview-meta-item"><IconTag size={13} /> v{spec.version}</span>
                        <span className="overview-meta-item"><IconLink size={13} /> {spec.baseUrl}</span>
                        <span className="overview-meta-item"><IconLightning size={13} /> {spec.endpoints.length} endpoints</span>
                        <span className="overview-meta-item"><IconLock size={13} /> {spec.auth.type} auth</span>
                    </div>
                </div>
            </div>

            <div className="overview-body">
                {/* New to APIs card */}
                <NewToApisCard />

                {/* Two-column layout: flow diagram + AI overview */}
                <div className="overview-main-grid">
                    {/* Left: flow diagram */}
                    {demoEndpoint && (
                        <div className="overview-flow-card">
                            <h3 className="overview-section-title">
                                <IconRefresh size={15} /> How it works
                            </h3>
                            <p className="overview-flow-subtitle">
                                Watch a live request cycle for <strong>{spec.title}</strong>
                            </p>
                            <ApiFlowDiagram
                                baseUrl={spec.baseUrl}
                                method={demoEndpoint.method}
                                path={demoEndpoint.path}
                            />
                        </div>
                    )}

                    {/* Right: AI Overview */}
                    <div className="overview-ai-card">
                        <div className="overview-ai-card-header">
                            <h3 className="overview-section-title">
                                <IconSparkles size={15} /> AI Overview
                            </h3>
                            <span className="overview-ai-provider-badge">Groq</span>
                        </div>
                        {loading && (
                            <div className="overview-ai-loading">
                                <div className="ai-shimmer" />
                                <div className="ai-shimmer short" />
                                <div className="ai-shimmer" />
                                <div className="ai-shimmer short" />
                                <div className="ai-shimmer" />
                            </div>
                        )}
                        {error && (
                            <div className="overview-ai-error">
                                <IconWarn size={14} /> {error}
                                <button className="overview-retry-btn" onClick={() => { setOverview(null); setError(null); fetchOverview(); }}>
                                    Retry
                                </button>
                            </div>
                        )}
                        {overview && (
                            <div className="ai-content overview-ai-content"
                                dangerouslySetInnerHTML={{ __html: formatOverviewMarkdown(overview) }}
                            />
                        )}
                    </div>
                </div>

                {/* Featured Endpoints */}
                {featured.length > 0 && (
                    <div className="overview-featured">
                        <h3 className="overview-section-title">
                            <IconPlay size={15} /> Featured Endpoints
                        </h3>
                        <p className="overview-featured-subtitle">
                            Jump straight into the most useful parts of this API
                        </p>
                        <div className="featured-endpoints-grid">
                            {featured.map((ep) => (
                                <FeaturedEndpoint
                                    key={ep.id}
                                    method={ep.method}
                                    path={ep.path}
                                    summary={ep.summary || ep.description || ep.path}
                                    onTryIt={() => selectEndpoint(ep)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Reuse the same markdown formatter from EndpointDetail
function formatOverviewMarkdown(text: string): string {
    const lines = text.split('\n');
    const result: string[] = [];
    let inList = false;

    for (const raw of lines) {
        const line = raw;
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
        const listMatch = line.match(/^(?:[-*+]|\d+\.)\s+(.+)$/);
        if (listMatch) {
            if (!inList) { result.push('<ul>'); inList = true; }
            result.push(`<li>${applyInline(listMatch[1])}</li>`);
            continue;
        }
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

function applyInline(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}
