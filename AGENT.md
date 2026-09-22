# AGENT.md

This is a NASA Space Apps Challenge 2026 project (Challenge 5: Health Monitoring Software for Astronauts) built at a Bangladesh Local Event.

## Non-negotiables

- Offline-first. Read from cache/. Wrap live calls with a fixture fallback. Support OFFLINE=1.
- Deterministic science (statistics, anomaly scores, baseline deviations, radiation math) lives in backend/compute/ and is never performed by the model.
- Cite every dataset with an id and a URL. Provenance guard blocks unverified claims.
- Record every AI tool and key prompt in docs/AI_USE.md.
- Apache-2.0 license. Public repository. No under-18 likenesses anywhere.
- No m-dashes or en-dashes anywhere in the repository. Use hyphens or periods only.
- Never expose API keys. Secrets in .env only.

## Commands

- make cache : Pre-fetch every demo input and generate fixtures (python scripts/generate_fixtures.py)
- make demo : Run the app with OFFLINE=1 fixture replay mode
- make test : Run compute unit tests, provenance checks, and MCP tool validation (pytest backend/tests)
- npm run build : Build frontend static bundle for Vercel

## Style and Architecture Rules

- Python: Type hints, pure tested functions in backend/compute/, pytest for mathematical and statistical verification.
- Backend: FastAPI deployed on Render. Never modify Procfile, render.yaml, or package.json scripts.
- LLM and Agents: Agents retrieve, orchestrate, and explain. They never compute numbers directly.
- Frontend: React 19 + Vite deployed on Vercel. Provenance drawer and badge for all metrics. No direct external API calls.
