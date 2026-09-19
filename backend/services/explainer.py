from typing import Dict, Any


TEMPLATES: Dict[str, Dict[str, str]] = {
    "cardiovascular": {
        "high_hr": "Your heart rate is {pct}% above your personal baseline. NASA LSDA bedrest data flags this as early cardiovascular deconditioning.",
        "low_hrv": "Your HRV dropped {pct}% below baseline. NASA OSDR I4 data associates this with autonomic stress.",
        "elevated_risk": "Cardiovascular risk score elevated to {score}/100. Biomarker proxies indicate orthostatic stress.",
        "nominal": "Cardiovascular tone is within nominal envelope. Vagal modulation aligns with 72h baseline.",
    },
    "sleep_behavioral": {
        "low_score": "Sleep risk index elevated ({score}/100). NASA HRP Sleep/Circadian data associates this with cumulative sleep debt.",
        "disrupted": "Circadian phase shift detected. REM fragmentation observed in telemetry.",
        "nominal": "Circadian synchronization and behavioral resilience indices remain within normal parameters.",
    },
    "immune": {
        "elevated": "Immune risk marker elevated ({score}/100). NASA OSDR I4 (OSD-575) data shows this pattern during cytokine modulation in microgravity.",
        "nominal": "Immune surveillance indicators stable. No inflammatory biomarker cascade detected.",
    },
    "cognitive": {
        "delayed": "Psychomotor vigilance latency slowed +{pct}% vs ESA COGNISPACE norms. Cognitive reserve under strain.",
        "nominal": "Cognitive resilience score nominal. Reaction speeds and executive focus meet mission standards.",
    },
    "radiation": {
        "saa": "Orbital pass through South Atlantic Anomaly (SAA). Local radiation flux increased 10x over background.",
        "elevated": "Cumulative dose rate above normal orbital threshold. Career limit tracking active.",
        "nominal": "Dosimetry within NASA-STD-3001 limits. Career dose consumption running safely under projected mission ceilings.",
    },
}

COUNTERMEASURES: Dict[str, str] = {
    "cardiovascular": "30-min resistance-band protocol + 1L electrolyte hydration (NASA HRP Cardiopulmonary Countermeasure).",
    "sleep_behavioral": "Enable 450nm blue-light filtration, dark visor, and 10-min 4-7-8 autonomic pacing (NASA HRP Circadian Protocol).",
    "immune": "Anti-inflammatory dietary pack (omega-3, polyphenols) + 2000 IU Vit D3 (NASA OSDR OSD-575 Evidence Base).",
    "cognitive": "20-minute restorative power nap or sensory quiet period before scheduled maintenance or EVA.",
    "radiation": "Relocate to central shielded module (Zarya/Destiny water-wall core) during SAA transit.",
}


def generate_explanation(category: str, trigger: str, **kwargs) -> str:
    """Generate plain-language explanation referencing NASA datasets."""
    cat_dict = TEMPLATES.get(category, {})
    template = cat_dict.get(trigger, cat_dict.get("nominal", "Telemetry reading is being tracked."))
    try:
        return template.format(**kwargs)
    except Exception:
        return template


def get_countermeasure(category: str) -> str:
    """Retrieve NASA HRP countermeasure for risk category."""
    return COUNTERMEASURES.get(category, "Monitor vitals and maintain standard mission hydration and exercise routine.")
