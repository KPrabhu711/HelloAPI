'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { RegistryApi } from '@/lib/api-registry';
import { useApi } from '@/context/ApiContext';
import { IconSearch, IconArrowDownTray } from '@/components/Icons';

// ─── Category colour pills ───
const CATEGORY_COLORS: Record<string, string> = {
    financial: '#10b981',
    messaging: '#3b82f6',
    social: '#f59e0b',
    analytics: '#8b5cf6',
    media: '#ec4899',
    security: '#ef4444',
    storage: '#06b6d4',
    developer: '#6366f1',
    iot: '#f97316',
    location: '#14b8a6',
};

function categoryColor(cat: string): string {
    return CATEGORY_COLORS[cat.toLowerCase()] ?? '#6b7280';
}

// ─── Fallback logo when no URL is available ───
function ApiLogo({ name, logoUrl }: { name: string; logoUrl?: string }) {
    const [imgFailed, setImgFailed] = useState(false);

    if (logoUrl && !imgFailed) {
        return (
            <img
                src={logoUrl}
                alt={name}
                className="api-result-logo"
                onError={() => setImgFailed(true)}
            />
        );
    }

    // Fallback: coloured circle with first letter
    return (
        <div className="api-result-logo-fallback">
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

export default function ApiSearch() {
    const { parseAndGenerate, isLoading } = useApi();

    // ── Search state ──
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<RegistryApi[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── URL import state ──
    const [specUrl, setSpecUrl] = useState('');
    const [urlError, setUrlError] = useState<string | null>(null);
    const [fetching, setFetching] = useState(false);

    // ── Selected result (loading state per card) ──
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!query.trim()) {
            setResults([]);
            setSearchError(null);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            setSearchError(null);
            try {
                const res = await fetch(`/api/search-apis?q=${encodeURIComponent(query)}&limit=12`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Search failed');
                const found: RegistryApi[] = data.results || [];
                setResults(found);
                if (found.length === 0) setSearchError('No APIs found. Try a different keyword.');
            } catch {
                setSearchError('Failed to load API catalog. Check your internet connection.');
            } finally {
                setSearching(false);
            }
        }, 350);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    // Load spec from registry result
    const handleSelectApi = useCallback(async (api: RegistryApi) => {
        setLoadingId(api.id);
        setSearchError(null);
        try {
            const res = await fetch('/api/fetch-spec', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: api.specUrl }),
            });
            const data = await res.json();
            if (!res.ok || !data.content) {
                setSearchError(data.error || 'Failed to fetch the spec.');
                return;
            }
            await parseAndGenerate(data.content);
        } catch {
            setSearchError('Network error loading the spec. Please try again.');
        } finally {
            setLoadingId(null);
        }
    }, [parseAndGenerate]);

    // Load spec from URL input
    const handleUrlFetch = useCallback(async () => {
        if (!specUrl.trim()) return;
        setUrlError(null);
        setFetching(true);
        try {
            const res = await fetch('/api/fetch-spec', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: specUrl.trim() }),
            });
            const data = await res.json();
            if (!res.ok || !data.content) {
                setUrlError(data.error || 'Failed to fetch the spec.');
                return;
            }
            await parseAndGenerate(data.content);
        } catch {
            setUrlError('Network error. Check the URL and try again.');
        } finally {
            setFetching(false);
        }
    }, [specUrl, parseAndGenerate]);

    const busy = isLoading || fetching || !!loadingId;

    return (
        <div className="api-search">
            {/* Search Input */}
            <div className="api-search-input-wrap">
                <IconSearch size={14} className="api-search-icon" />
                <input
                    className="api-search-input"
                    type="text"
                    placeholder="Search 2,000+ APIs — Stripe, GitHub, Spotify, Twilio..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={busy}
                    autoFocus
                />
                {(searching) && <span className="api-search-spinner" />}
                {query && !searching && (
                    <button className="api-search-clear" onClick={() => { setQuery(''); setResults([]); }}>✕</button>
                )}
            </div>

            {/* Results */}
            {results.length > 0 && (
                <div className="api-results">
                    {results.map((api) => (
                        <button
                            key={api.id}
                            className={`api-result-card ${loadingId === api.id ? 'loading' : ''}`}
                            onClick={() => handleSelectApi(api)}
                            disabled={busy}
                        >
                            <ApiLogo name={api.name} logoUrl={api.logoUrl} />
                            <div className="api-result-info">
                                <div className="api-result-header">
                                    <span className="api-result-name">{api.name}</span>
                                    <span className="api-result-version">v{api.version}</span>
                                </div>
                                {api.description && (
                                    <p className="api-result-desc">{api.description}</p>
                                )}
                                {api.categories.length > 0 && (
                                    <div className="api-result-cats">
                                        {api.categories.slice(0, 3).map((cat) => (
                                            <span
                                                key={cat}
                                                className="api-result-cat"
                                                style={{ borderColor: categoryColor(cat), color: categoryColor(cat) }}
                                            >
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="api-result-action">
                                {loadingId === api.id ? (
                                    <span className="spinner" />
                                ) : (
                                    <span className="api-result-arrow">→</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {searchError && (
                <p className="api-search-error">{searchError}</p>
            )}

            {/* Divider */}
            <div className="api-search-divider">
                <span>or import from a URL</span>
            </div>

            {/* URL Import */}
            <div className="api-url-row">
                <input
                    className="api-url-input"
                    type="url"
                    placeholder="https://example.com/openapi.json"
                    value={specUrl}
                    onChange={(e) => setSpecUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlFetch()}
                    disabled={busy}
                />
                <button
                    className="api-url-fetch-btn"
                    onClick={handleUrlFetch}
                    disabled={!specUrl.trim() || busy}
                >
                    {fetching ? <><span className="spinner" /> Fetching...</> : <><IconArrowDownTray size={14} /> Fetch</>}
                </button>
            </div>

            {urlError && (
                <p className="api-search-error">{urlError}</p>
            )}
        </div>
    );
}
