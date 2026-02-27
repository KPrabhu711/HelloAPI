import { Endpoint, ErrorGuide } from '../types';

// ─── Error Guidance Generator ───
// Produces per-endpoint error guides with causes and fixes.

const COMMON_ERRORS: ErrorGuide[] = [
    {
        statusCode: 400,
        title: 'Bad Request',
        description: 'The request was malformed or missing required fields.',
        likelyCause: 'Missing required parameter, invalid JSON body, or wrong data type.',
        fix: 'Check that all required fields are present and correctly formatted. Validate JSON syntax.',
    },
    {
        statusCode: 401,
        title: 'Unauthorized',
        description: 'Authentication credentials are missing or invalid.',
        likelyCause: 'Missing Authorization header, expired token, or incorrect API key.',
        fix: 'Verify your API key/token is correct and not expired. Check the header name.',
    },
    {
        statusCode: 403,
        title: 'Forbidden',
        description: 'You don\'t have permission to access this resource.',
        likelyCause: 'Your credentials lack the required scope or role for this endpoint.',
        fix: 'Check your API key permissions. Contact the API provider if you need elevated access.',
    },
    {
        statusCode: 404,
        title: 'Not Found',
        description: 'The requested resource doesn\'t exist.',
        likelyCause: 'Wrong endpoint path, invalid resource ID, or the resource was deleted.',
        fix: 'Double-check the URL path and any resource IDs in the request.',
    },
    {
        statusCode: 405,
        title: 'Method Not Allowed',
        description: 'The HTTP method is not supported for this endpoint.',
        likelyCause: 'Using POST when the endpoint only accepts GET, or vice versa.',
        fix: 'Check the API documentation for the correct HTTP method.',
    },
    {
        statusCode: 409,
        title: 'Conflict',
        description: 'The request conflicts with the current state of the resource.',
        likelyCause: 'Trying to create a resource that already exists, or a version conflict.',
        fix: 'Check if the resource already exists. Use the correct version/ETag if required.',
    },
    {
        statusCode: 422,
        title: 'Unprocessable Entity',
        description: 'The request was valid but the server cannot process it.',
        likelyCause: 'Validation errors on the request payload — fields may have invalid values.',
        fix: 'Check field constraints (min/max values, allowed formats, enum values).',
    },
    {
        statusCode: 429,
        title: 'Too Many Requests',
        description: 'You\'ve hit the rate limit.',
        likelyCause: 'Too many requests in a short period.',
        fix: 'Implement exponential backoff. Check the Retry-After header for wait time.',
    },
    {
        statusCode: 500,
        title: 'Internal Server Error',
        description: 'Something went wrong on the server.',
        likelyCause: 'Server-side bug or temporary overload.',
        fix: 'Wait a moment and retry. If persistent, contact the API provider.',
    },
];

export function getErrorGuidance(endpoint: Endpoint): ErrorGuide[] {
    const guides: ErrorGuide[] = [];

    // Add errors that the endpoint explicitly documents
    for (const resp of endpoint.responses) {
        const code = parseInt(resp.statusCode, 10);
        if (code >= 400) {
            const common = COMMON_ERRORS.find(e => e.statusCode === code);
            if (common) {
                guides.push({
                    ...common,
                    description: resp.description || common.description,
                });
            } else {
                guides.push({
                    statusCode: code,
                    title: `Error ${code}`,
                    description: resp.description,
                    likelyCause: 'See API documentation for details.',
                    fix: 'Check the response body for error details.',
                });
            }
        }
    }

    // Always add the most common errors if not already present
    const presentCodes = new Set(guides.map(g => g.statusCode));
    const alwaysInclude = [401, 404, 429, 500];

    // For mutation endpoints, also include 400 and 422
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(endpoint.method)) {
        alwaysInclude.unshift(400, 422);
    }

    for (const code of alwaysInclude) {
        if (!presentCodes.has(code)) {
            const common = COMMON_ERRORS.find(e => e.statusCode === code);
            if (common) guides.push(common);
        }
    }

    return guides.sort((a, b) => a.statusCode - b.statusCode);
}
