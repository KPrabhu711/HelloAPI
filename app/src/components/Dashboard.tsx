'use client';

import React from 'react';
import { useApi } from '@/context/ApiContext';
import EndpointList from '@/components/EndpointList';
import EndpointDetail from '@/components/EndpointDetail';
import QuickstartViewer from '@/components/QuickstartViewer';
import LearningPathView from '@/components/LearningPathView';
import { BoltIcon, PlugIcon, RocketIcon, BookOpenIcon, AlertTriangleIcon, FileTextIcon } from '@/components/Icons';

export default function Dashboard() {
    const { spec, selectedTab, setSelectedTab, warnings, todos, reset } = useApi();

    if (!spec) return null;

    return (
        <div className="dashboard">
            {/* Top Bar */}
            <div className="dashboard-topbar">
                <div className="topbar-left">
                    <button className="logo-button" onClick={reset}>
                        <span className="logo-icon"><BoltIcon size={18} /></span>
                        <span className="logo-text">HelloAPI</span>
                    </button>
                    <div className="api-info">
                        <h1 className="api-title">{spec.title}</h1>
                        <span className="api-version">v{spec.version}</span>
                        <span className="api-base">{spec.baseUrl}</span>
                    </div>
                </div>
                <div className="topbar-tabs">
                    <button
                        className={`topbar-tab ${selectedTab === 'playground' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('playground')}
                    >
                        <PlugIcon size={14} /> Playground
                    </button>
                    <button
                        className={`topbar-tab ${selectedTab === 'quickstart' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('quickstart')}
                    >
                        <RocketIcon size={14} /> Quickstart
                    </button>
                    <button
                        className={`topbar-tab ${selectedTab === 'learn' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('learn')}
                    >
                        <BookOpenIcon size={14} /> Learn
                    </button>
                </div>
            </div>

            {/* Warnings & Todos */}
            {(warnings.length > 0 || todos.length > 0) && (
                <div className="alerts-bar">
                    {warnings.map((w, i) => (
                        <div key={`w-${i}`} className="alert warning"><AlertTriangleIcon size={14} /> {w}</div>
                    ))}
                    {todos.map((t, i) => (
                        <div key={`t-${i}`} className="alert todo"><FileTextIcon size={14} /> {t}</div>
                    ))}
                </div>
            )}

            {/* Main Content */}
            <div className="dashboard-content">
                {selectedTab === 'playground' && (
                    <div className="playground-layout">
                        <aside className="sidebar">
                            <EndpointList />
                        </aside>
                        <main className="main-panel">
                            <EndpointDetail />
                        </main>
                    </div>
                )}

                {selectedTab === 'quickstart' && (
                    <div className="quickstart-layout">
                        <QuickstartViewer />
                    </div>
                )}

                {selectedTab === 'learn' && (
                    <div className="learn-layout">
                        <LearningPathView />
                    </div>
                )}
            </div>
        </div>
    );
}
