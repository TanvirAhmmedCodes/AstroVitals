# AGENTS.md

Instructions, architecture rules, and operational boundaries for autonomous AI agents and coding assistants working on AstroVitals.

This is a NASA Space Apps Challenge 2026 project (Challenge 5: Health Monitoring Software for Astronauts) built by Team Orbitrix, Dhaka, Bangladesh.

## Project Rules

### Non-negotiables:
- Offline-first. Read from cache/. Wrap live calls with a fixture fallback. Support OFFLINE=1.
- Deterministic science (statistics, anomaly scores, baseline deviations, radiation math) lives in backend/compute/ and is never performed by the model.
- Cite every dataset with an id and a URL. Provenance guard blocks unverified claims.
- Record every AI tool and key prompt in docs/AI_USE.md.
- Apache-2.0 license. Public repository. No under-18 likenesses anywhere.
- No m-dashes or en-dashes anywhere in the repository. Use hyphens or periods only.
- Never expose API keys. Secrets in .env only.

### Commands:
- make cache : Pre-fetch every demo input and generate fixtures (python scripts/generate_fixtures.py)
- make demo : Run the app with OFFLINE=1 fixture replay mode
- make test : Run compute unit tests, provenance checks, and ML model validation (python -m unittest discover -s backend/tests)
- npm run build : Build frontend static bundle for Vercel

### Style and Architecture Rules:
- Python: Type hints, pure tested functions in backend/compute/, unittest/pytest for mathematical and statistical verification.
- Backend: FastAPI deployed on Render. Never modify Procfile, render.yaml, or package.json scripts.
- LLM and Agents: Agents retrieve, orchestrate, and explain. They never compute numbers directly.
- Frontend: React 19 + Vite deployed on Vercel. Provenance drawer and badge for all metrics. No direct external API calls.

## Agent Boundaries

### Capabilities and Role Boundaries

#### Agents May:
- Search scientific catalogues (NASA OSDR, NASA NTRS, PubMed, Space Omics).
- Fetch data from safe wrappers (safe_fetch via cache or demo_fixtures).
- Orchestrate workflow steps using the plain state machine orchestrator.
- Explain, narrate, and contextualize deviations, rule triggers, and mission physiological status.
- Generate UI captions, structured summaries, and evidence citations.

#### Agents May Not:
- Compute statistics, trend tests, slopes, p-values, or anomaly scores directly in LLM prompts.
- Perform physiological math (HRV RMSSD, SDNN, baseline deviation ratios) or radiation dose accumulation.
- Diagnose medical conditions. Agents flag deviations, report triggered threshold rules, and cite supporting spaceflight studies.
- Invent, estimate, or hallucinate missing numeric values. If a tool fails or data is unavailable, return cached data with its timestamp or explicit status notice.

### Provenance Gate Rule

Every numeric claim delivered by an agent must carry a verified dataset_id and source_url from a tool execution. The cite_check guard blocks unverified claims before user display.

### Physical Boundaries

1. backend/compute/ : Pure deterministic Python functions. Zero LLM involvement.
2. backend/services/agent_orchestrator.py : Hard 6-step cap, tool calling loop, and provenance verification gate.
3. mcp_server.py : Model Context Protocol interface exposing deterministic tools.
