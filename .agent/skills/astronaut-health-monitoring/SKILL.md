---
name: astronaut-health-monitoring
description: Monitor and analyze astronaut physiological telemetry, perform deterministic anomaly detection, and explain findings citing NASA OSDR literature.
license: Apache-2.0
metadata:
  author: Orbitrix Team
  version: "1.0"
---

# Astronaut Health Monitoring Skill

## When to Use

Use when analyzing real-time or recorded vitals streams, detecting physiological deviations, calculating cumulative radiation exposure, or correlating clinical indicators with NASA Open Science Data Repository (OSDR) spaceflight studies.

## Core Rules

1. Offline-First: Always route data retrieval through safe_fetch (Live to Cache to Fixture). Support OFFLINE=1.
2. Deterministic Science: All statistical metrics (Mann-Kendall, Theil-Sen slope), baseline deviations (Z-scores), and radiation accumulation must be computed in backend/compute/. The agent orchestrates and explains only.
3. No Medical Diagnoses: Frame findings as "physiological deviations", "rule triggers", or "clinical threshold violations" rather than medical diagnoses.
4. Provenance Verification: Every numeric value reported to users must be grounded in tool execution carrying dataset_id and source_url. Run cite_check before presentation.
5. Hardware Physics Awareness: Account for sensor limitations (MPU-6050 motion artifact rejection, MLX90614 infrared settling time, haptic alert debounce).
