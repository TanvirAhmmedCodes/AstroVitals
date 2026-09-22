# AI Use and Attribution Disclosure

NASA International Space Apps Challenge 2026 - Challenge 5: Health Monitoring Software for Astronauts

## AI Tools Employed

1. Google Antigravity IDE (Gemini 3.8 Flash / Gemini Pro reasoning models):
   - Code scaffolding, refactoring, deterministic compute extraction, architecture audit, and documentation assistance.
2. In-app Explanation Agent:
   - Google Gemini 1.5 Flash (via google-genai / os.getenv("GEMINI_API_KEY")) deployed in backend/services/agent_orchestrator.py for translating deterministic physiological deviations and rule triggers into crew explanations and literature citations.

## What the AI Did

- Scaffolding the safe_fetch layer (Live to Cache to Demo Fixture pipeline) and demo fixtures generator.
- Refactoring deterministic mathematical routines (Mann-Kendall, Theil-Sen, HRV RMSSD/SDNN, NASA-STD-3001 radiation limits) into pure functions in backend/compute/.
- Constructing the MCP (Model Context Protocol) tool interface in mcp_server.py.
- Implementing the provenance badge and raw tool JSON drawer in React 19 frontend components.
- Scripting the multi-dataset harmonization pipeline across NASA OSDR Inspiration4, Twin Study OSD-294, HRP Bed Rest OSD-379, and ESA Concordia datasets with 5-fold subject-level cross-validation.
- Drafting firmware template firmware/astrovitals_esp32.ino with MPU-6050 motion rejection, haptic signaling, and edge alert physics.

## What the Team (Human Engineering) Did

- Conceptual architecture and domain-specific mission requirements for long-duration deep space astronaut monitoring.
- Designing the physical layered spine separating UI, API, agent, deterministic compute, and hardware ingestion.
- Biological feature selection, clinical threshold calibration (NASA-STD-3001 standards, ALARA guidelines), and physiological interaction engineering.
- Hardware circuit schematic, sensor selection (MAX30102, MLX90614, MPU-6050, SSD1306, haptic motor, LEDs), and hardware physics validation.
- Evaluation and honest auditing of machine learning performance metrics (reporting subject-level cross-validation scores without data fabrication).
- Project presentation, UX design system, and deployment topology on Render and Vercel.

## Prompts and Interaction History

Key prompts utilized during system upgrades:
- "Audit existing project against layered spine architecture. Identify boundaries, missing caches, and deterministic compute isolation."
- "Implement safe_fetch wrapper with Live, Cache, and Fixture fallback hierarchy supporting OFFLINE=1."
- "Extract all mathematical, statistical, and threshold calculations into a pure, tested backend/compute module."
- "Harmonize NASA OSDR and ESA analog human data using strict subject-level GroupKFold splitting to prevent cross-astronaut data leakage."
- "Implement MCP server exposing tools with rigorous schema docstrings, units, and citation provenance requirements."
