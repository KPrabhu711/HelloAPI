import { ApiSpec, LearningPath, LearningStep } from './types';

// ─── Learning Path Auto-Generator ───
// Given a parsed ApiSpec, builds structured learning paths from the endpoints.

export function generateLearningPaths(spec: ApiSpec): LearningPath[] {
    const paths: LearningPath[] = [];

    // 1. Basics Path — always generated
    paths.push(buildBasicsPath(spec));

    // 2. CRUD Path — if we detect list/get/create/update/delete patterns
    const crudPath = buildCrudPath(spec);
    if (crudPath) paths.push(crudPath);

    // 3. Workflow Path — if we detect business workflow patterns
    const workflowPath = buildWorkflowPath(spec);
    if (workflowPath) paths.push(workflowPath);

    return paths;
}

// ─── Basics Path ───

function buildBasicsPath(spec: ApiSpec): LearningPath {
    const steps: LearningStep[] = [];

    // Step 1: Auth
    steps.push({
        title: 'Authentication Setup',
        description: 'Learn how to authenticate with this API',
        type: 'info',
        content: buildAuthContent(spec),
    });

    // Step 2: First GET request
    const firstGet = spec.endpoints.find(e => e.method === 'GET' && !e.path.includes('{'));
    if (firstGet) {
        steps.push({
            title: 'Your First Request',
            description: `Make a GET request to ${firstGet.path}`,
            type: 'endpoint',
            endpointId: firstGet.id,
            content: `Start by calling \`GET ${firstGet.path}\` — this is the simplest endpoint to verify your setup works.`,
        });
    }

    // Step 3: Pagination
    if (spec.paginationHints.length > 0) {
        steps.push({
            title: 'Pagination',
            description: 'Learn how to paginate through results',
            type: 'info',
            content: buildPaginationContent(spec),
        });
    }

    // Step 4: Error Handling
    steps.push({
        title: 'Error Handling',
        description: 'Understand common errors and how to fix them',
        type: 'info',
        content: `Common HTTP errors you might encounter:\n\n- **401**: Check your API key/token\n- **403**: Verify your permissions\n- **404**: Check the endpoint path and resource IDs\n- **429**: You're being rate limited — slow down\n- **500**: Server issue — retry after a moment`,
    });

    return {
        id: 'basics',
        title: 'Getting Started',
        description: 'Learn the fundamentals: authentication, first request, pagination, and error handling.',
        icon: '🚀',
        steps,
    };
}

// ─── CRUD Path ───

function buildCrudPath(spec: ApiSpec): LearningPath | null {
    // Find CRUD-like endpoints for any resource
    const resources = new Map<string, { list?: string; get?: string; create?: string; update?: string; del?: string }>();

    for (const ep of spec.endpoints) {
        const segments = ep.path.split('/').filter(Boolean);
        const resource = segments.find(s => !s.startsWith('{') && !s.startsWith(':') && !['api', 'v1', 'v2', 'v3'].includes(s));
        if (!resource) continue;

        if (!resources.has(resource)) resources.set(resource, {});
        const r = resources.get(resource)!;

        if (ep.method === 'GET' && !ep.path.includes('{')) r.list = ep.id;
        else if (ep.method === 'GET' && ep.path.includes('{')) r.get = ep.id;
        else if (ep.method === 'POST') r.create = ep.id;
        else if (ep.method === 'PUT' || ep.method === 'PATCH') r.update = ep.id;
        else if (ep.method === 'DELETE') r.del = ep.id;
    }

    // Find the resource with the most CRUD operations
    let bestResource = '';
    let bestCount = 0;
    for (const [name, ops] of resources) {
        const count = Object.values(ops).filter(Boolean).length;
        if (count > bestCount) {
            bestCount = count;
            bestResource = name;
        }
    }

    if (bestCount < 2) return null;

    const ops = resources.get(bestResource)!;
    const steps: LearningStep[] = [];

    if (ops.list) {
        steps.push({
            title: `List ${capitalize(bestResource)}`,
            description: `Fetch all ${bestResource}`,
            type: 'endpoint',
            endpointId: ops.list,
            content: `Start by listing all ${bestResource} to see what data is available.`,
        });
    }

    if (ops.get) {
        steps.push({
            title: `Get a Single ${capitalize(bestResource)}`,
            description: `Fetch one ${bestResource} by ID`,
            type: 'endpoint',
            endpointId: ops.get,
            content: `Pick an ID from the list response and fetch the full details.`,
        });
    }

    if (ops.create) {
        steps.push({
            title: `Create a ${capitalize(bestResource)}`,
            description: `Create a new ${bestResource}`,
            type: 'endpoint',
            endpointId: ops.create,
            content: `Try creating a new ${bestResource} with the required fields.`,
        });
    }

    if (ops.update) {
        steps.push({
            title: `Update a ${capitalize(bestResource)}`,
            description: `Modify an existing ${bestResource}`,
            type: 'endpoint',
            endpointId: ops.update,
            content: `Update one of the fields on an existing ${bestResource}.`,
        });
    }

    if (ops.del) {
        steps.push({
            title: `Delete a ${capitalize(bestResource)}`,
            description: `Remove a ${bestResource}`,
            type: 'endpoint',
            endpointId: ops.del,
            content: `Delete a ${bestResource} by ID. Be careful — this is usually irreversible!`,
        });
    }

    return {
        id: 'crud',
        title: `CRUD Operations — ${capitalize(bestResource)}`,
        description: `Learn the full Create, Read, Update, Delete cycle for ${bestResource}.`,
        icon: '📝',
        steps,
    };
}

// ─── Workflow Path ───

function buildWorkflowPath(spec: ApiSpec): LearningPath | null {
    // Look for workflow-related tags or endpoints
    const workflowKeywords = ['order', 'payment', 'checkout', 'cart', 'invoice', 'booking', 'reservation'];
    const workflowEndpoints = spec.endpoints.filter(ep => {
        const lower = `${ep.path} ${ep.summary} ${ep.tag}`.toLowerCase();
        return workflowKeywords.some(kw => lower.includes(kw));
    });

    if (workflowEndpoints.length < 2) return null;

    const steps: LearningStep[] = workflowEndpoints.slice(0, 5).map((ep, i) => ({
        title: ep.summary || `Step ${i + 1}: ${ep.method} ${ep.path}`,
        description: ep.description || `${ep.method} ${ep.path}`,
        type: 'endpoint' as const,
        endpointId: ep.id,
        content: `Step ${i + 1} of the workflow: ${ep.summary || ep.path}`,
    }));

    return {
        id: 'workflow',
        title: 'Business Workflow',
        description: 'Follow a real-world workflow using multiple endpoints.',
        icon: '🔄',
        steps,
    };
}

// ─── Helpers ───

function buildAuthContent(spec: ApiSpec): string {
    const a = spec.auth;
    switch (a.type) {
        case 'bearer': return 'This API uses Bearer tokens. Include `Authorization: Bearer YOUR_TOKEN` in every request header.';
        case 'apiKey': return `This API uses an API key. Include \`${a.headerName || 'X-API-Key'}: YOUR_KEY\` in every request header.`;
        case 'basic': return 'This API uses Basic Auth. Send your username and password encoded in the Authorization header.';
        case 'oauth2': return 'This API uses OAuth 2.0. You\'ll need to complete the OAuth flow to get an access token.';
        default: return 'Authentication method not detected. Check the API documentation for auth requirements.';
    }
}

function buildPaginationContent(spec: ApiSpec): string {
    const hint = spec.paginationHints[0];
    return `This API uses **${hint.type}-based** pagination with parameters: ${hint.parameters.map(p => `\`${p}\``).join(', ')}.\n\nAlways check the response for pagination metadata (like \`next\`, \`total\`, or \`has_more\`) to know if there are more pages.`;
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
