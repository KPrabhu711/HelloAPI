'use client';

import React, { useState, useCallback } from 'react';
import { useApi } from '@/context/ApiContext';
import { getErrorGuidance } from '@/lib/generators/error-guidance';
import { AiResponse } from '@/lib/types';
import { CpuIcon, AlertTriangleIcon } from '@/components/Icons';
import { marked } from 'marked';

interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
    time: number;
}

interface ErrorGuidanceProps {
    response?: ApiResponse | null;
}

export default function ErrorGuidance({ response }: ErrorGuidanceProps) {
    const { selectedEndpoint, spec } = useApi();

    // AI Troubleshoot state
    const [aiTroubleshoot, setAiTroubleshoot] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const handleAiTroubleshoot = useCallback(async () => {
        if (!selectedEndpoint || !spec || !response) return;

        setAiLoading(true);
        setAiError(null);

        try {
            const res = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'troubleshoot',
                    endpoint: selectedEndpoint,
                    spec: { title: spec.title, baseUrl: spec.baseUrl, auth: spec.auth, description: spec.description },
                    error: {
                        status: response.status,
                        body: response.body,
                    },
                }),
            });

            const data: AiResponse = await res.json();

            if (!res.ok || data.error) {
                setAiError(data.error || 'AI troubleshoot failed');
            } else {
                setAiTroubleshoot(data.result || '');
            }
        } catch {
            setAiError('Failed to connect to AI service.');
        } finally {
            setAiLoading(false);
        }
    }, [selectedEndpoint, spec, response]);

    if (!selectedEndpoint) return null;

    const errors = getErrorGuidance(selectedEndpoint);
    const hasErrorResponse = response && response.status >= 400;

    return (
        <div className="error-guidance">
            {/* AI Troubleshoot Section — shown when there's an error response */}
            {hasErrorResponse && (
                <div className="ai-troubleshoot-section">
                    <div className="ai-troubleshoot-header">
                        <span className="ai-troubleshoot-status">
                            <span className={`error-code code-${Math.floor(response.status / 100)}xx`}>
                                {response.status}
                            </span>
                            <span>{response.statusText}</span>
                        </span>
                        <button
                            className="ai-troubleshoot-button"
                            onClick={handleAiTroubleshoot}
                            disabled={aiLoading}
                        >
                            {aiLoading ? (
                                <><span className="spinner" /> Analyzing...</>
                            ) : (
                                <><CpuIcon size={14} /> AI Troubleshoot</>
                            )}
                        </button>
                    </div>

                    {aiLoading && (
                        <div className="ai-panel ai-troubleshoot-panel">
                            <div className="ai-panel-body">
                                <div className="ai-loading">
                                    <div className="ai-shimmer" />
                                    <div className="ai-shimmer short" />
                                    <div className="ai-shimmer" />
                                </div>
                            </div>
                        </div>
                    )}

                    {aiError && (
                        <div className="ai-panel ai-troubleshoot-panel">
                            <div className="ai-panel-body">
                                <div className="ai-error"><AlertTriangleIcon size={14} /> {aiError}</div>
                            </div>
                        </div>
                    )}

                    {aiTroubleshoot && (
                        <div className="ai-panel ai-troubleshoot-panel">
                            <div className="ai-panel-header">
                                <span className="ai-panel-icon"><CpuIcon size={16} /></span>
                                <span className="ai-panel-title">AI Troubleshooting</span>
                            </div>
                            <div className="ai-panel-body">
                                <div className="ai-content" dangerouslySetInnerHTML={{ __html: marked.parse(aiTroubleshoot) as string }} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Static Error Guidance */}
            <h4 className="error-guidance-title">
                <AlertTriangleIcon size={16} /> Common Errors & Fixes
            </h4>
            <div className="error-list">
                {errors.map((err) => (
                    <details key={err.statusCode} className="error-item">
                        <summary className="error-summary">
                            <span className={`error-code code-${Math.floor(err.statusCode / 100)}xx`}>
                                {err.statusCode}
                            </span>
                            <span className="error-title">{err.title}</span>
                        </summary>
                        <div className="error-details">
                            <p className="error-description">{err.description}</p>
                            <div className="error-cause">
                                <strong>Likely cause:</strong> {err.likelyCause}
                            </div>
                            <div className="error-fix">
                                <strong>Fix:</strong> {err.fix}
                            </div>
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
}

