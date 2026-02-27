'use client';

import React from 'react';
import { useApi } from '@/context/ApiContext';
import { getErrorGuidance } from '@/lib/generators/error-guidance';

export default function ErrorGuidance() {
    const { selectedEndpoint } = useApi();

    if (!selectedEndpoint) return null;

    const errors = getErrorGuidance(selectedEndpoint);

    return (
        <div className="error-guidance">
            <h4 className="error-guidance-title">
                <span>⚠️</span> Common Errors & Fixes
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
