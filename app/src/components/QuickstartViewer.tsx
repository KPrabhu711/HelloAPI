'use client';

import React, { useState } from 'react';
import { useApi } from '@/context/ApiContext';

type QuickstartTab = 'readme' | 'curl' | 'python' | 'typescript';

export default function QuickstartViewer() {
    const { artifacts } = useApi();
    const [activeTab, setActiveTab] = useState<QuickstartTab>('readme');
    const [copied, setCopied] = useState(false);

    if (!artifacts) return null;

    const tabs: { key: QuickstartTab; label: string; icon: string }[] = [
        { key: 'readme', label: 'README', icon: '📖' },
        { key: 'curl', label: 'curl', icon: '🔗' },
        { key: 'python', label: 'Python', icon: '🐍' },
        { key: 'typescript', label: 'TypeScript', icon: '📘' },
    ];

    const content: Record<QuickstartTab, string> = {
        readme: artifacts.readme,
        curl: artifacts.curlExamples,
        python: artifacts.pythonClient,
        typescript: artifacts.typescriptClient,
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(content[activeTab]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const extensions: Record<QuickstartTab, string> = {
            readme: 'md',
            curl: 'sh',
            python: 'py',
            typescript: 'ts',
        };
        const blob = new Blob([content[activeTab]], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab === 'readme' ? 'README' : `client.${extensions[activeTab]}`}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="quickstart-viewer">
            <div className="quickstart-header">
                <div className="quickstart-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`quickstart-tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>
                <div className="quickstart-actions">
                    <button className="action-button" onClick={handleCopy}>
                        {copied ? '✅ Copied' : '📋 Copy'}
                    </button>
                    <button className="action-button" onClick={handleDownload}>
                        ⬇️ Download
                    </button>
                </div>
            </div>
            <div className="quickstart-content">
                <pre className="quickstart-code"><code>{content[activeTab]}</code></pre>
            </div>
        </div>
    );
}
