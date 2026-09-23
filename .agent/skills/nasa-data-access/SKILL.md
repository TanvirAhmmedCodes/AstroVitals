---
name: nasa-data-access
description: Access NASA and partner data - earthaccess, CMR, Harmony, FIRMS, POWER, api.nasa.gov, GIBS, ASF, IRSA, PDS, Treks, OSDR, NTRS, ADS - with caching and offline fallback. Use whenever the project needs NASA data.
allowed-tools: Read, Bash
license: Apache-2.0
---

# NASA data access

Use verified endpoints and working snippets. Do not invent base URLs.

## Rules
- Cache first: try live, fall back to cache, then to demo_fixtures.
- Never let a demo depend on the network. Support OFFLINE=1.
- Keys live in .env and are never committed. Commit .env.example only.
- Record the dataset id and source URL alongside every value you store.

## Status notes to repeat in the interface
- NISAR L-band products are PROVISIONAL, validated at a limited set of sites.
- SPHEREx current release is QR2 - cite DOI 10.26131/IRSA652.
- Suomi-NPP ends 1 November 2026. Prefer VIIRS on NOAA-20 and NOAA-21.
- NASA OSDR Inspiration4 datasets (OSD-569 to OSD-575) - cite open science accession IDs.
