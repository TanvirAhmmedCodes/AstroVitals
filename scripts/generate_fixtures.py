"""Generate committed demo fixtures for offline-first operation.

Creates:
  demo_fixtures/vitals.json (600 rows for stream replay)
  demo_fixtures/iss_position.json
  demo_fixtures/apod.json
  demo_fixtures/osdr_studies.json
  demo_fixtures/ntrs_citations.json
  demo_fixtures/launches.json
"""

import json
from pathlib import Path
from datetime import datetime, timezone, timedelta
import math

ROOT_DIR = Path(__file__).resolve().parent.parent
FIXTURES_DIR = ROOT_DIR / "demo_fixtures"
FIXTURES_DIR.mkdir(parents=True, exist_ok=True)

# 1. Generate 600-second vitals stream
base_time = datetime(2026, 10, 4, 12, 0, 0, tzinfo=timezone.utc)
vitals_rows = []

for sec in range(600):
    t = base_time + timedelta(seconds=sec)

    # Base nominal vitals
    # Subtle respiratory sinus arrhythmia variation (~0.05 Hz)
    resp_cycle = math.sin(sec * 2 * math.pi / 20.0)
    base_hr = 71.5 + 2.5 * resp_cycle
    base_spo2 = 98.4 + 0.3 * math.cos(sec * 2 * math.pi / 35.0)
    base_temp = 36.52 + 0.05 * math.sin(sec * 2 * math.pi / 120.0)
    base_motion = 0.04 + 0.02 * abs(math.sin(sec * 0.5))
    cumulative_rad = 12.5 + (sec * 0.0004)

    # Anomaly window: seconds 320 to 390
    # Elevated cardiovascular strain with depressed HRV and drop in SpO2
    is_anomaly = False
    rule_fired = "NONE"
    status = "nominal"

    if 320 <= sec <= 390:
        strain_factor = math.sin((sec - 320) * math.pi / 70.0)
        base_hr += 56.0 * strain_factor  # peaks ~127.5 bpm
        base_spo2 -= 7.5 * strain_factor  # dips ~90.9%
        base_temp += 0.9 * strain_factor  # rises ~37.4 C
        base_motion += 0.85 * strain_factor
        status = "critical" if base_hr > 125.0 or base_spo2 < 91.0 else "caution"
        is_anomaly = True
        rule_fired = "CARDIOVASCULAR_EXCURSION_AND_DESATURATION"
    elif 391 <= sec <= 440:
        # Recovery phase
        rec_factor = 1.0 - ((sec - 390) / 50.0)
        base_hr += 20.0 * rec_factor
        base_spo2 -= 2.0 * rec_factor
        base_temp += 0.3 * rec_factor
        status = "caution"
        rule_fired = "RECOVERY_TACHYCARDIA"

    # Derive simulated RR intervals (in ms)
    mean_rr = 60000.0 / base_hr
    hrv_rmssd = 18.0 if is_anomaly else 44.0
    rr_sample = [
        round(mean_rr + (math.sin(i * 1.3) * hrv_rmssd * 0.7), 1)
        for i in range(10)
    ]

    vitals_rows.append({
        "second": sec,
        "astronaut_id": "astronaut-A",
        "timestamp_utc": t.isoformat(),
        "heart_rate_bpm": round(base_hr, 1),
        "spo2_pct": round(min(100.0, max(85.0, base_spo2)), 1),
        "skin_temp_c": round(base_temp, 2),
        "motion_g": round(base_motion, 3),
        "activity_state": "exercise" if (320 <= sec <= 390) else "rest",
        "radiation_dose_uSv_cumulative": round(cumulative_rad, 4),
        "hrv_rmssd_ms": round(hrv_rmssd, 1),
        "rr_intervals_ms": rr_sample,
        "status": status,
        "is_anomaly": is_anomaly,
        "rule_fired": rule_fired,
        "provenance": {
            "dataset_id": "NASA-OSD-575-REPLAY",
            "source_url": "https://osdr.nasa.gov/osdr/data/osd/files/575",
            "data_mode": "fixture",
            "device_id": "ESP32-ORBITAL-HUB-01",
        },
    })

(FIXTURES_DIR / "vitals.json").write_text(json.dumps(vitals_rows, indent=2), encoding="utf-8")
print(f"[OK] Generated demo_fixtures/vitals.json ({len(vitals_rows)} frames)")

# 2. ISS Position Fixture (Entering South Atlantic Anomaly)
iss_fixture = {
    "latitude": -23.456,
    "longitude": -44.128,
    "altitude_km": 418.5,
    "velocity_kmh": 27600.0,
    "in_saa": True,
    "timestamp": "2026-10-04T12:05:00+00:00",
    "source": "open-notify",
    "mode": "FIXTURE",
    "south_atlantic_anomaly": {
        "in_region": True,
        "radiation_multiplier": 10.0,
        "warning": True,
        "boundary": "Lat [-50, 0], Lon [-90, 40]",
    },
    "provenance": {
        "dataset_id": "NASA-ISS-EPHEMERIS",
        "source_url": "https://spotthestation.nasa.gov/trajectory_data.cfm",
        "data_mode": "fixture",
    },
}
(FIXTURES_DIR / "iss_position.json").write_text(json.dumps(iss_fixture, indent=2), encoding="utf-8")
print("[OK] Generated demo_fixtures/iss_position.json")

# 3. APOD Fixture
apod_fixture = {
    "title": "Earth and Aurora from the International Space Station",
    "date": "2026-10-04",
    "explanation": "Astronauts aboard the International Space Station captured this striking vista of orbital sunrise brushing against Earth's thin atmospheric limb while auroral curtains dance across the polar upper ionosphere.",
    "media_type": "image",
    "url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200",
    "hdurl": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200",
    "copyright": "NASA / ISS Expedition Crew",
    "provenance": {
        "dataset_id": "NASA-APOD-20261004",
        "source_url": "https://api.nasa.gov/planetary/apod",
        "data_mode": "fixture",
    },
}
(FIXTURES_DIR / "apod.json").write_text(json.dumps(apod_fixture, indent=2), encoding="utf-8")
print("[OK] Generated demo_fixtures/apod.json")

# 4. OSDR Studies Fixture
osdr_studies = [
    {
        "accession": "OSD-569",
        "title": "Inspiration4 Crew Hematology and Complete Blood Count Longitudinal Profiling",
        "organism": "Homo sapiens",
        "assay_type": "Complete Blood Count / Cell Differential",
        "mission": "Inspiration4 (SpaceX Dragon, 3-day LEO)",
        "subjects": 4,
        "source_url": "https://osdr.nasa.gov/osdr/data/osd/files/569",
    },
    {
        "accession": "OSD-570",
        "title": "Single-Cell RNA Sequencing of PBMC in Inspiration4 Astronauts",
        "organism": "Homo sapiens",
        "assay_type": "scRNA-seq (Immune profiling)",
        "mission": "Inspiration4",
        "subjects": 4,
        "source_url": "https://osdr.nasa.gov/osdr/data/osd/files/570",
    },
    {
        "accession": "OSD-571",
        "title": "Cell-Free RNA Liquid Biopsy Profiling of Spaceflight Health Stressors",
        "organism": "Homo sapiens",
        "assay_type": "cfRNA Liquid Biopsy",
        "mission": "Inspiration4",
        "subjects": 4,
        "source_url": "https://osdr.nasa.gov/osdr/data/osd/files/571",
    },
    {
        "accession": "OSD-575",
        "title": "Serum Cytokine and Chemokine Longitudinal Immunoassays (Inspiration4)",
        "organism": "Homo sapiens",
        "assay_type": "Multiplex Immunoassay (65 cytokines)",
        "mission": "Inspiration4",
        "subjects": 4,
        "source_url": "https://osdr.nasa.gov/osdr/data/osd/files/575",
    },
    {
        "accession": "OSD-294",
        "title": "NASA Twin Study: Multi-Omic Assessment of One-Year Spaceflight vs Ground Control",
        "organism": "Homo sapiens",
        "assay_type": "Whole Genome, Transcriptome, Proteome, Cytokines, Telomeres",
        "mission": "ISS One-Year Mission",
        "subjects": 2,
        "source_url": "https://osdr.nasa.gov/osdr/data/osd/files/294",
    },
    {
        "accession": "OSD-379",
        "title": "NASA HRP 70-Day 6-Degree Head-Down Tilt Bed Rest Cardiovascular and Immune Manifold",
        "organism": "Homo sapiens",
        "assay_type": "Cardiovascular, Immune, Muscle Atrophy, Endocrine Markers",
        "mission": "NASA Flight Analogs Research Center (FARC)",
        "subjects": 16,
        "source_url": "https://osdr.nasa.gov/osdr/data/osd/files/379",
    },
]
(FIXTURES_DIR / "osdr_studies.json").write_text(json.dumps(osdr_studies, indent=2), encoding="utf-8")
print("[OK] Generated demo_fixtures/osdr_studies.json")

# 5. NTRS Citations Fixture
ntrs_citations = [
    {
        "id": "NASA/TM-2022-0002812",
        "title": "Risk of Cardiovascular Disease and Recovery Post-Spaceflight",
        "author": "Human Research Program Cardiovascular Discipline Team",
        "year": 2022,
        "source_url": "https://ntrs.nasa.gov/citations/20220002812",
        "key_countermeasure": "High-intensity aerobic interval exercise (ARED + T2 Treadmill) + daily fluid loading.",
    },
    {
        "id": "NASA/SP-2020-0014299",
        "title": "Human Health and Performance Risks of Space Exploration Missions (HRP Evidence Book)",
        "author": "NASA Human Research Program",
        "year": 2020,
        "source_url": "https://humanresearchroadmap.nasa.gov/evidence/",
        "key_countermeasure": "Radiation shielding water walls + sleep hygiene circadian lighting + antioxidant nutritional regimens.",
    },
    {
        "id": "NASA-STD-3001-V1-REV-C",
        "title": "NASA Space Flight Human-System Standard: Crew Health",
        "author": "Office of the Chief Health and Medical Officer",
        "year": 2023,
        "source_url": "https://www.nasa.gov/hhp/standards/",
        "key_countermeasure": "600 mSv lifetime career effective dose ceiling and 250 mSv 30-day Solar Particle Event threshold.",
    },
]
(FIXTURES_DIR / "ntrs_citations.json").write_text(json.dumps(ntrs_citations, indent=2), encoding="utf-8")
print("[OK] Generated demo_fixtures/ntrs_citations.json")

# 6. Launches Fixture
launches_fixture = [
    {
        "name": "Crew-10 Dragon / Falcon 9",
        "net": "2026-11-15T14:30:00Z",
        "status": {"name": "Go for Launch"},
        "mission": {"description": "NASA Commercial Crew Program expedition to the International Space Station."},
        "pad": {"name": "Launch Complex 39A, Kennedy Space Center"},
        "provenance": {
            "dataset_id": "LAUNCH-LIBRARY-2-CREW10",
            "source_url": "https://ll.thespacedevs.com/2.2.0/launch/upcoming/",
            "data_mode": "fixture",
        },
    }
]
(FIXTURES_DIR / "launches.json").write_text(json.dumps(launches_fixture, indent=2), encoding="utf-8")
print("[OK] Generated demo_fixtures/launches.json")
