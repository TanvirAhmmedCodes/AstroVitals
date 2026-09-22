# AGENTS.md

Instructions for autonomous AI agents and coding assistants working on AstroVitals.

## Capabilities and Role Boundaries

### Agents May:
- Search scientific catalogues (NASA OSDR, NASA NTRS, PubMed, Space Omics).
- Fetch data from safe wrappers (safe_fetch via cache or demo_fixtures).
- Orchestrate workflow steps using the plain state machine orchestrator.
- Explain, narrate, and contextualize deviations, rule triggers, and mission physiological status.
- Generate UI captions, structured summaries, and evidence citations.

### Agents May Not:
- Compute statistics, trend tests, slopes, p-values, or anomaly scores directly in LLM prompts.
- Perform physiological math (HRV RMSSD, SDNN, baseline deviation ratios) or radiation dose accumulation.
- Diagnose medical conditions. Agents flag deviations, report triggered threshold rules, and cite supporting spaceflight studies.
- Invent, estimate, or hallucinate missing numeric values. If a tool fails or data is unavailable, return cached data with its timestamp or explicit status notice.

## Provenance Gate Rule

Every numeric claim delivered by an agent must carry a verified dataset_id and source_url from a tool execution. The cite_check guard blocks unverified claims before user display.

## Physical Boundaries

1. backend/compute/ : Pure deterministic Python functions. Zero LLM involvement.
2. backend/services/agent_orchestrator.py : Hard 6-step cap, tool calling loop, and provenance verification gate.
3. mcp_server.py : Model Context Protocol interface exposing deterministic tools.
