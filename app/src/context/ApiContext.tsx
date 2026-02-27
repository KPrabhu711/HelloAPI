'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ApiSpec, Endpoint, ArtifactSet, LearningPath, ParseResult } from '@/lib/types';
import { generateLearningPaths } from '@/lib/learning-paths';

interface ApiContextType {
    // State
    spec: ApiSpec | null;
    artifacts: ArtifactSet | null;
    learningPaths: LearningPath[];
    selectedEndpoint: Endpoint | null;
    selectedTab: 'playground' | 'quickstart' | 'learn';
    isLoading: boolean;
    error: string | null;
    warnings: string[];
    todos: string[];

    // Actions
    parseAndGenerate: (content: string) => Promise<void>;
    selectEndpoint: (endpoint: Endpoint | null) => void;
    setSelectedTab: (tab: 'playground' | 'quickstart' | 'learn') => void;
    reset: () => void;
}

const ApiContext = createContext<ApiContextType | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
    const [spec, setSpec] = useState<ApiSpec | null>(null);
    const [artifacts, setArtifacts] = useState<ArtifactSet | null>(null);
    const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
    const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
    const [selectedTab, setSelectedTab] = useState<'playground' | 'quickstart' | 'learn'>('playground');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [todos, setTodos] = useState<string[]>([]);

    const parseAndGenerate = useCallback(async (content: string) => {
        setIsLoading(true);
        setError(null);
        setWarnings([]);
        setTodos([]);

        try {
            // Step 1: Parse
            const parseRes = await fetch('/api/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, type: 'auto' }),
            });

            if (!parseRes.ok) {
                const err = await parseRes.json();
                throw new Error(err.error || 'Parsing failed');
            }

            const parseResult: ParseResult = await parseRes.json();
            setSpec(parseResult.spec);
            setWarnings(parseResult.warnings);
            setTodos(parseResult.todos);

            // Step 2: Generate artifacts
            const genRes = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ spec: parseResult.spec }),
            });

            if (!genRes.ok) {
                const err = await genRes.json();
                throw new Error(err.error || 'Generation failed');
            }

            const genResult = await genRes.json();
            setArtifacts(genResult.artifacts);

            // Step 3: Generate learning paths
            const paths = generateLearningPaths(parseResult.spec);
            setLearningPaths(paths);

            // Auto-select first endpoint
            if (parseResult.spec.endpoints.length > 0) {
                setSelectedEndpoint(parseResult.spec.endpoints[0]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const selectEndpoint = useCallback((endpoint: Endpoint | null) => {
        setSelectedEndpoint(endpoint);
        setSelectedTab('playground');
    }, []);

    const reset = useCallback(() => {
        setSpec(null);
        setArtifacts(null);
        setLearningPaths([]);
        setSelectedEndpoint(null);
        setSelectedTab('playground');
        setIsLoading(false);
        setError(null);
        setWarnings([]);
        setTodos([]);
    }, []);

    return (
        <ApiContext.Provider
            value={{
                spec, artifacts, learningPaths, selectedEndpoint, selectedTab,
                isLoading, error, warnings, todos,
                parseAndGenerate, selectEndpoint, setSelectedTab, reset,
            }}
        >
            {children}
        </ApiContext.Provider>
    );
}

export function useApi(): ApiContextType {
    const ctx = useContext(ApiContext);
    if (!ctx) throw new Error('useApi must be used within an ApiProvider');
    return ctx;
}
