'use client';

import React, { useState, useMemo } from 'react';
import { useApi } from '@/context/ApiContext';
import { Endpoint } from '@/lib/types';

const METHOD_COLORS: Record<string, string> = {
    GET: '#10b981',
    POST: '#3b82f6',
    PUT: '#f59e0b',
    PATCH: '#f97316',
    DELETE: '#ef4444',
};

export default function EndpointList() {
    const { spec, selectedEndpoint, selectEndpoint } = useApi();
    const [query, setQuery] = useState('');

    if (!spec) return null;

    const q = query.trim().toLowerCase();

    const filtered = useMemo(() => {
        if (!q) return spec.endpoints;
        return spec.endpoints.filter(ep =>
            ep.path.toLowerCase().includes(q) ||
            ep.method.toLowerCase().includes(q) ||
            (ep.summary && ep.summary.toLowerCase().includes(q)) ||
            (ep.tag && ep.tag.toLowerCase().includes(q))
        );
    }, [q, spec.endpoints]);

    const grouped = new Map<string, Endpoint[]>();
    for (const ep of filtered) {
        const tag = ep.tag || 'default';
        if (!grouped.has(tag)) grouped.set(tag, []);
        grouped.get(tag)!.push(ep);
    }

    return (
        <div className="endpoint-list">
            <div className="endpoint-list-header">
                <h3>Endpoints</h3>
                <span className="endpoint-count">{filtered.length}</span>
            </div>
            <div className="endpoint-search-wrap">
                <svg className="endpoint-search-icon" viewBox="0 0 20 20" fill="none">
                    <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                <input
                    className="endpoint-search-input"
                    type="text"
                    placeholder="Search endpoints…"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    spellCheck={false}
                />
                {query && (
                    <button className="endpoint-search-clear" onClick={() => setQuery('')} aria-label="Clear">
                        ×
                    </button>
                )}
            </div>
            <div className="endpoint-groups">
                {grouped.size === 0 && (
                    <div className="endpoint-no-results">No endpoints match "{q}"</div>
                )}
                {Array.from(grouped.entries()).map(([tag, endpoints]) => (
                    <div key={tag} className="endpoint-group">
                        <div className="endpoint-group-title">{tag}</div>
                        {endpoints.map((ep) => (
                            <button
                                key={ep.id}
                                className={`endpoint-item ${selectedEndpoint?.id === ep.id ? 'active' : ''}`}
                                onClick={() => selectEndpoint(ep)}
                            >
                                <span
                                    className="method-badge"
                                    style={{ backgroundColor: METHOD_COLORS[ep.method] || '#6b7280' }}
                                >
                                    {ep.method}
                                </span>
                                <span className="endpoint-path" title={ep.path}>{ep.path}</span>
                                {ep.deprecated && <span className="deprecated-badge">deprecated</span>}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
