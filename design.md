# HelloAPI Design

## Architecture Overview
HelloAPI is a generator + playground system with five core modules:
1. Doc ingestion
2. Retrieval (for text docs)
3. Artifact generator
4. Interactive demo builder
5. Validation/consistency checker

## Component Design

### 1) Doc Ingestion
- Input: OpenAPI/Swagger or raw docs text
- OpenAPI path: parse operations, parameters, auth schemes, schemas
- Text path: chunk content and extract base URL, auth hints, endpoints, headers, pagination terms

### 2) Retriever (Text-Only Mode)
- Build lightweight chunk index (in-memory or vector index)
- Resolve targeted questions per artifact (auth, examples, pagination, errors)
- Return source evidence for each generated section

### 3) Artifact Generator
- Template-driven output (for quickstart docs/scripts/SDK files)
- Produces:
  - quickstart README content
  - curl examples
  - Python/TypeScript client skeletons
  - basic examples (list/get/create where applicable)
- Marks unknowns as TODO with top-guess fallback

### 4) Interactive Demo Builder
- Converts endpoint metadata into UI definitions
- Per endpoint renders:
  - description and required auth/headers
  - parameter form (path/query/body)
  - request execution action and response display
  - copy-as snippet generators (curl/Python/TS)
  - error-to-fix guidance
- Supports guided flows (basics, CRUD, inferred workflow)

### 5) Validation/Consistency Checker
Rules run before final output:
- base URL present
- auth section present when auth is detected
- generated examples include required headers
- troubleshooting maps to expected HTTP errors

## Runtime Flow
1. User submits docs/spec and selects output languages
2. System parses source and builds normalized endpoint model
3. Generator creates files and demo definitions
4. Validator checks consistency and emits TODOs if needed
5. UI presents generated artifacts plus interactive endpoint demos

## Data Model (Logical)
- `ApiSpec`: base URL, auth scheme, tags/resources, endpoints
- `Endpoint`: method, path, params, request body schema, response schema, errors
- `ArtifactSet`: readme content, script snippets, SDK templates, examples
- `EvidenceNote`: generated section -> source reference mapping

## Security Considerations
- API keys are provided at runtime and kept local-only
- No credential persistence in generated artifacts by default
- Request execution should sanitize logged output to avoid secret leakage

## MVP Technology Direction
- Backend: parser + generator service with `/generate` endpoint
- Frontend: endpoint explorer UI for demo execution
- Templates: deterministic, versioned, easy to extend

## Post-MVP Extensions
- Postman collection ingestion
- Additional language targets
- Deeper retry/rate-limit simulation
