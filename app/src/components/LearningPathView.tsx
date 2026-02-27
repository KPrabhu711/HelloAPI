'use client';

import React, { useState } from 'react';
import { useApi } from '@/context/ApiContext';
import { LearningPath, LearningStep } from '@/lib/types';

export default function LearningPathView() {
    const { learningPaths, selectEndpoint, spec } = useApi();
    const [activePath, setActivePath] = useState<LearningPath | null>(null);
    const [activeStep, setActiveStep] = useState(0);

    if (learningPaths.length === 0) {
        return (
            <div className="learning-paths empty">
                <div className="empty-state">
                    <span className="empty-icon">📚</span>
                    <h3>No Learning Paths Available</h3>
                    <p>Learning paths are auto-generated from your API spec. Upload a spec with more endpoints to unlock guided learning.</p>
                </div>
            </div>
        );
    }

    if (!activePath) {
        return (
            <div className="learning-paths">
                <h2 className="learning-title">Guided Learning Paths</h2>
                <p className="learning-subtitle">Follow structured paths to understand this API step by step.</p>
                <div className="path-cards">
                    {learningPaths.map((path) => (
                        <button
                            key={path.id}
                            className="path-card"
                            onClick={() => { setActivePath(path); setActiveStep(0); }}
                        >
                            <span className="path-icon">{path.icon}</span>
                            <h3 className="path-title">{path.title}</h3>
                            <p className="path-description">{path.description}</p>
                            <div className="path-meta">
                                <span>{path.steps.length} steps</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    const step = activePath.steps[activeStep];
    const progress = ((activeStep + 1) / activePath.steps.length) * 100;

    const handleStepEndpoint = (step: LearningStep) => {
        if (step.endpointId && spec) {
            const ep = spec.endpoints.find(e => e.id === step.endpointId);
            if (ep) selectEndpoint(ep);
        }
    };

    return (
        <div className="learning-path-view">
            <div className="path-header">
                <button className="back-button" onClick={() => setActivePath(null)}>
                    ← All Paths
                </button>
                <h2>{activePath.icon} {activePath.title}</h2>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="progress-label">Step {activeStep + 1} of {activePath.steps.length}</span>
            </div>

            <div className="step-content">
                <div className="step-badge">{step.type === 'endpoint' ? '🔌' : step.type === 'exercise' ? '✏️' : 'ℹ️'}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
                <div className="step-body">
                    <p>{step.content}</p>
                </div>
                {step.endpointId && (
                    <button
                        className="open-endpoint-button"
                        onClick={() => handleStepEndpoint(step)}
                    >
                        ▶ Open in Playground
                    </button>
                )}
            </div>

            <div className="step-navigation">
                <button
                    className="nav-button prev"
                    onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                    disabled={activeStep === 0}
                >
                    ← Previous
                </button>
                <div className="step-dots">
                    {activePath.steps.map((_, i) => (
                        <button
                            key={i}
                            className={`step-dot ${i === activeStep ? 'active' : i < activeStep ? 'completed' : ''}`}
                            onClick={() => setActiveStep(i)}
                        />
                    ))}
                </div>
                <button
                    className="nav-button next"
                    onClick={() => setActiveStep(Math.min(activePath.steps.length - 1, activeStep + 1))}
                    disabled={activeStep === activePath.steps.length - 1}
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
