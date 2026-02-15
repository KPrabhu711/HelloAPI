# HelloAPI Requirements

## Goal
Help developers go from API docs to a first successful request quickly, then learn each endpoint through interactive demos.

## Target Users
- Developers integrating an API for the first time
- Teams onboarding engineers to internal APIs
- API providers wanting a ready-made try-it + quickstart experience

## Inputs (MVP Priority)
- OpenAPI/Swagger JSON or YAML (preferred)
- Raw docs text (markdown or copied webpage text)

## Outputs
1. Quickstart pack
   - Setup + auth instructions
   - First request and pagination examples
   - Error notes (401/403/429/400) and troubleshooting
2. Working client starter code
   - Python and TypeScript
   - Base URL, headers, auth, basic retry/backoff
   - Example calls (list/get/create when applicable)
3. Interactive endpoint playground
   - Endpoint list grouped by resource/tag
   - Per-endpoint input form (path/query/body)
   - Try-it execution + formatted response viewer
   - Copy snippets (curl, Python, TypeScript)
   - Common error guidance

## Functional Requirements (MVP)
- Detect and parse OpenAPI vs free-text docs
- Extract base URL, auth method, endpoint operations, required headers
- Detect pagination and rate-limit hints where present
- Generate quickstart artifacts and SDK starter files
- Build endpoint-driven UI forms from extracted schemas/params
- Execute requests with local API key injection only (no key storage)
- Add evidence references for generated guidance
- Emit TODOs + best guesses when source docs are incomplete

## Non-Functional Requirements
- Time-to-first-successful-request: minutes, not hours
- Clear, consistent generated output with minimal manual edits
- Safe handling of credentials (local-only, never persisted)
- Extensible architecture for additional inputs/languages later

## Validation & Success Criteria
- User can produce at least one successful request from provided docs
- User can navigate and run demos for each discovered endpoint
- Generated artifacts include required headers/auth where needed
- Missing information is surfaced explicitly as TODOs

## Out of Scope for MVP
- Postman import
- Unit test stubs generation
- Docker packaging
- Advanced retry orchestration
