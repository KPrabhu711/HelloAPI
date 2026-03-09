// ─── APIs.guru Registry Client ───
// Searches the public APIs.guru catalog (~2,000 real-world OpenAPI specs)
// Docs: https://apis.guru/api-doc/

const APIS_GURU_LIST_URL = 'https://api.apis.guru/v2/list.json';

export interface RegistryApi {
    id: string;           // e.g. "stripe.com"
    name: string;         // e.g. "Stripe"
    description: string;
    version: string;
    specUrl: string;      // direct URL to OpenAPI JSON/YAML
    logoUrl?: string;
    categories: string[];
    provider: string;
}

// ─── Raw shape from apis.guru ───
interface GuruVersion {
    info: {
        title: string;
        description?: string;
        version: string;
        'x-logo'?: { url: string };
    };
    swaggerUrl: string;
    swaggerYamlUrl: string;
}

interface GuruApi {
    preferred: string;
    versions: Record<string, GuruVersion>;
    categories?: string[];
}

// ─── Module-level cache ───
let cachedList: RegistryApi[] | null = null;

async function fetchFullList(): Promise<RegistryApi[]> {
    if (cachedList) return cachedList;

    // AbortController for timeout — compatible with all Node.js 16+ environments
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    let res: Response;
    try {
        res = await fetch(APIS_GURU_LIST_URL, {
            // 'no-store' works in all deployment modes (standalone, serverless, containers)
            // next: { revalidate } only works properly on Vercel/ISR-enabled deployments
            cache: 'no-store',
            signal: controller.signal,
            headers: { 'User-Agent': 'HelloAPI/1.0' },
        });
    } finally {
        clearTimeout(timer);
    }

    if (!res.ok) throw new Error(`APIs.guru fetch failed: ${res.status} ${res.statusText}`);

    const raw: Record<string, GuruApi> = await res.json();

    const list: RegistryApi[] = [];

    for (const [id, api] of Object.entries(raw)) {
        const preferredVersion = api.versions[api.preferred];
        if (!preferredVersion) continue;

        const { info, swaggerUrl, swaggerYamlUrl } = preferredVersion;

        // Prefer YAML URL, fall back to JSON
        const specUrl = swaggerYamlUrl || swaggerUrl;
        if (!specUrl) continue;

        // Derive a clean provider name from the ID (e.g. "stripe.com" → "Stripe")
        const providerRaw = id.split(':')[0]; // strip variant suffix like "googleapis.com:admin"
        const provider = providerRaw.replace(/\.(com|io|org|net|dev|ai|co)$/, '');

        list.push({
            id,
            name: info.title || provider,
            description: info.description
                ? info.description.replace(/<[^>]+>/g, '').substring(0, 120).trim()
                : '',
            version: info.version || api.preferred,
            specUrl,
            logoUrl: info['x-logo']?.url,
            categories: api.categories || [],
            provider,
        });
    }

    // Sort by provider name
    list.sort((a, b) => a.name.localeCompare(b.name));

    cachedList = list;
    return list;
}

// ─── Search ───
export async function searchApis(query: string, limit = 20): Promise<RegistryApi[]> {
    if (!query.trim()) return [];

    const list = await fetchFullList();
    const q = query.toLowerCase();

    const scored = list
        .map((api) => {
            let score = 0;
            const name = api.name.toLowerCase();
            const desc = api.description.toLowerCase();
            const id = api.id.toLowerCase();
            const cats = api.categories.join(' ').toLowerCase();

            if (name.startsWith(q)) score += 100;
            else if (name.includes(q)) score += 60;
            if (id.includes(q)) score += 40;
            if (desc.includes(q)) score += 20;
            if (cats.includes(q)) score += 10;

            return { api, score };
        })
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((s) => s.api);

    return scored;
}

// ─── Get total catalog count (for display) ───
export async function getCatalogCount(): Promise<number> {
    const list = await fetchFullList();
    return list.length;
}
