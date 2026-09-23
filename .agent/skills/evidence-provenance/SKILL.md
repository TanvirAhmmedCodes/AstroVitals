---
name: evidence-provenance
description: Attach a dataset id and source URL to every numeric claim and validate citations before any agent output is shown to a user. Use whenever an agent explains or narrates a result.
allowed-tools: Read
license: Apache-2.0
---

# Evidence and provenance

Every stated number must originate from a tool-result object carrying source_url and dataset_id. Run cite_check before display and block output when a claim has no source. Render the raw tool JSON in a provenance drawer in the interface.

## Wording rules
- Report what was measured, not what it means: "heart rate variability RMSSD dropped to 18.0 ms, Mann-Kendall p = 0.01" rather than "astronaut is panicking".
- State the processing level and any provisional or simulated status.
- Never smooth over a gap in the record. Say the record has a gap.
- Maintain the physical compute boundary: the model does not compute numbers.
