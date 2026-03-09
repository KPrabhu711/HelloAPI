'use client';

import React from 'react';
import { useApi } from '@/context/ApiContext';
import EndpointList from '@/components/EndpointList';
import EndpointDetail from '@/components/EndpointDetail';
import QuickstartViewer from '@/components/QuickstartViewer';
import LearningPathView from '@/components/LearningPathView';
import ApiOverview from '@/components/ApiOverview';
import {
    LogoMark,
    IconLightbulb, IconPlay, IconRocket,
    IconBook, IconWarn, IconSun, IconMoon, IconInfo,
} from '@/components/Icons';

export default function Dashboard() {
    const { spec, selectedTab, setSelectedTab, warnings, todos, reset, theme, toggleTheme } = useApi();

    if (!spec) return null;

    return (
        <div className="dashboard">
            {/* Top Bar */}
            <div className="dashboard-topbar">
                <div className="topbar-left">
                    <button className="logo-button" onClick={reset}>
                        <LogoMark size={30} className="logo-mark" />
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
                        className={`topbar-tab ${selectedTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('overview')}
                    >
                        <IconLightbulb size={14} />
                        Overview
                    </button>
                    <button
                        className={`topbar-tab ${selectedTab === 'playground' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('playground')}
                    >
                        <IconPlay size={14} />
                        Playground
                    </button>
                    <button
                        className={`topbar-tab ${selectedTab === 'quickstart' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('quickstart')}
                    >
                        <IconRocket size={14} />
                        Quickstart
                    </button>
                    <button
                        className={`topbar-tab ${selectedTab === 'learn' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('learn')}
                    >
                        <IconBook size={14} />
                        Learn
                    </button>
                </div>
                <div className="topbar-right">
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
                    </button>
                </div>
            </div>

            {/* Warnings & Todos */}
            {(warnings.length > 0 || todos.length > 0) && (
                <div className="alerts-bar">
                    {warnings.map((w, i) => (
                        <div key={`w-${i}`} className="alert warning">
                            <IconWarn size={13} /> {w}
                        </div>
                    ))}
                    {todos.map((t, i) => (
                        <div key={`t-${i}`} className="alert todo">
                            <IconInfo size={13} /> {t}
                        </div>
                    ))}
                </div>
            )}

            {/* Main Content */}
            <div className="dashboard-content">
                {selectedTab === 'overview' && (
                    <div className="overview-layout">
                        <ApiOverview />
                    </div>
                )}

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

