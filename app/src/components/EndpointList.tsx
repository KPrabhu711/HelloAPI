'use client';

import React from 'react';
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

    if (!spec) return null;

    const grouped = new Map<string, Endpoint[]>();
    for (const ep of spec.endpoints) {
        const tag = ep.tag || 'default';
        if (!grouped.has(tag)) grouped.set(tag, []);
        grouped.get(tag)!.push(ep);
    }

    return (
        <div className="endpoint-list">
            <div className="endpoint-list-header">
                <h3>Endpoints</h3>
                <span className="endpoint-count">{spec.endpoints.length}</span>
            </div>
            <div className="endpoint-groups">
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
