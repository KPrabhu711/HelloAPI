// ─── HelloAPI Core Types ───

export interface ApiSpec {
  title: string;
  description: string;
  version: string;
  baseUrl: string;
  auth: AuthScheme;
  endpoints: Endpoint[];
  tags: TagGroup[];
  paginationHints: PaginationHint[];
  rateLimitHints: RateLimitHint[];
  sourceType: 'openapi' | 'text';
}

export interface AuthScheme {
  type: 'apiKey' | 'bearer' | 'basic' | 'oauth2' | 'none' | 'unknown';
  headerName?: string;
  queryParamName?: string;
  scheme?: string;
  description?: string;
  flows?: Record<string, unknown>;
}

export interface Endpoint {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  tag: string;
  operationId?: string;
  parameters: Parameter[];
  requestBody?: RequestBody;
  responses: ResponseDef[];
  auth: boolean;
  deprecated?: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  description: string;
  type: string;
  default?: string;
  enum?: string[];
  example?: string;
}

export interface RequestBody {
  required: boolean;
  contentType: string;
  schema: SchemaField[];
  example?: Record<string, unknown>;
}

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: unknown;
  enum?: string[];
  example?: unknown;
  nested?: SchemaField[];
}

export interface ResponseDef {
  statusCode: string;
  description: string;
  schema?: SchemaField[];
  example?: unknown;
}

export interface TagGroup {
  name: string;
  description?: string;
  endpointIds: string[];
}

export interface PaginationHint {
  type: 'cursor' | 'offset' | 'page' | 'unknown';
  parameters: string[];
  description: string;
}

export interface RateLimitHint {
  statusCode: number;
  retryHeader?: string;
  description: string;
}

export interface ArtifactSet {
  readme: string;
  curlExamples: string;
  pythonClient: string;
  typescriptClient: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  icon: string;
  steps: LearningStep[];
}

export interface LearningStep {
  title: string;
  description: string;
  endpointId?: string;
  content: string;
  type: 'info' | 'endpoint' | 'exercise';
}

export interface GeneratedSnippet {
  curl: string;
  python: string;
  typescript: string;
}

export interface ErrorGuide {
  statusCode: number;
  title: string;
  description: string;
  likelyCause: string;
  fix: string;
}

export interface ParseResult {
  spec: ApiSpec;
  warnings: string[];
  todos: string[];
}
