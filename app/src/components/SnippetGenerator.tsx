'use client';

import React, { useState, useMemo } from 'react';
import { useApi } from '@/context/ApiContext';
import { generateSnippets } from '@/lib/generators/curl-generator';
import { IconTerminal, IconPython, IconTypeScript, IconCheckCircle, IconClipboard } from '@/components/Icons';

interface Props {
    paramValues: Record<string, string>;
}

type SnippetTab = 'curl' | 'python' | 'typescript';

export default function SnippetGenerator({ paramValues }: Props) {
    const { spec, selectedEndpoint, authToken } = useApi();
    const [activeTab, setActiveTab] = useState<SnippetTab>('curl');
    const [copied, setCopied] = useState(false);

    const snippets = useMemo(() => {
        if (!spec || !selectedEndpoint) return null;
        return generateSnippets(spec, selectedEndpoint, paramValues, authToken || undefined);
    }, [spec, selectedEndpoint, paramValues, authToken]);

    if (!snippets) return null;

    const code = snippets[activeTab];

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="snippet-generator">
            <div className="snippet-tabs">
                {(['curl', 'python', 'typescript'] as SnippetTab[]).map(tab => (
                    <button
                        key={tab}
                        className={`snippet-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'curl' ? (<><IconTerminal size={14} />curl</>) : tab === 'python' ? (<><IconPython size={14} />Python</>) : (<><IconTypeScript size={14} />TypeScript</>)}
                    </button>
                ))}
            </div>
            <div className="snippet-content">
                <button className="copy-button" onClick={handleCopy}>
                    {copied ? <><IconCheckCircle size={13} /> Copied!</> : <><IconClipboard size={13} /> Copy</>}
                </button>
                <pre className="snippet-code"><code>{code}</code></pre>
            </div>
        </div>
    );
}
