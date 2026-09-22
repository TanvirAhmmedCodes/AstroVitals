# AstroVitals Dataset Harmonization Specification

Author: MD Tanvir Ahmmed and Team Orbitrix
Challenge: NASA Space Apps Challenge 2026 - Challenge 5 (Health Monitoring Software for Astronauts)

## 1. Overview and Problem Statement

The initial baseline models in AstroVitals were trained solely on the NASA OSDR Inspiration4 mission (OSD-569, OSD-570, OSD-571, OSD-575). While rich in multi-omic depth, Inspiration4 included only 4 civilian astronauts across 55 longitudinal timepoints. In statistical machine learning, n=4 subjects cannot support reliable cross-subject generalization, resulting in negative cross-validation R-squared scores when evaluated across unseen subjects.

To solve this generalization challenge while preserving strict scientific grounding, Team Orbitrix harmonized four distinct human spaceflight and spaceflight analog datasets into a unified multi-subject training manifold.

---

## 2. Ingested Datasets

| Study Accession | Mission / Analog Context | Cohort Type | Subject Count | Samples | Primary Assays | Canonical Source |
|-----------------|--------------------------|-------------|---------------|---------|----------------|------------------|
| OSD-569/570/571/575 | Inspiration4 (SpaceX Dragon, 3-day LEO) | Commercial Astronauts | 4 | 55 | CBC, scRNA-seq, cfRNA, 65-plex Serum Cytokines | https://osdr.nasa.gov |
| OSD-294 | NASA Twin Study (ISS 340-day mission) | NASA Astronauts (TW vs HR) | 2 | 36 | Longitudinal Cytokines, Immune Profiles, CBC, Blood Chem | https://osdr.nasa.gov |
| OSD-379 / CFT70 | NASA HRP 70-Day Head-Down Tilt Bed Rest | Terrestrial Microgravity Analog | 16 | 96 | Hemodynamic, Inflammatory, Endocrine, Metabolic | https://humanresearchroadmap.nasa.gov |
| ESA-CONCORDIA | Concordia Station Antarctic Winter-Over | Extreme Isolation & Hypoxia Analog | 14 | 112 | Psychomotor Vigilance, Immune Adaptation, Cortisol | https://www.esa.int |
| **Total Harmonized Manifold** | **LEO Spaceflight + Analogs** | **Combined** | **36** | **299** | **619 Harmonized Biomarkers & Features** | **Verified NASA/ESA Data** |

---

## 3. Harmonization and Column Mapping

Biomarker names and clinical laboratory analytes vary across mission repositories and instruments. A canonical standardization dictionary was applied to map varying raw strings to unified clinical features:

| Canonical Feature | Raw Variations in Source Repositories | Biological Significance | Units |
|-------------------|---------------------------------------|-------------------------|-------|
| `CRP` | C-Reactive Protein, c reactive protein, crp, CRP_concentration | Acute systemic vascular inflammation | mg/L |
| `IL6` | Interleukin-6, interleukin 6, il 6, il6, IL6_concentration | Pro-inflammatory cytokine, immune activation | pg/mL |
| `IL10` | Interleukin-10, interleukin 10, il10 | Anti-inflammatory cytokine regulator | pg/mL |
| `TNF` | Tumor necrosis factor, tnf alpha, tnf a, tnf, tnfa | Cytokine involved in systemic inflammation | pg/mL |
| `IFNG` | Interferon-gamma, ifn gamma, ifng | Adaptive immune cellular response | pg/mL |
| `Fibrinogen` | Fibrinogen, coagulation factor I | Coagulation and cardiovascular risk | mg/dL |
| `WBC` | White blood cell count, wbc, leukocytes | Total immune defense count | 10^3/uL |
| `Neutrophils` | Absolute neutrophil count, neut, PMN | First-line antimicrobial leukocyte | 10^3/uL |
| `Lymphocytes` | Absolute lymphocyte count, lymph | T-cell, B-cell, NK cell immune arm | 10^3/uL |
| `Hematocrit` | Hematocrit, HCT, packed cell volume | Red blood cell volume fraction | % |
| `BUN` | Blood urea nitrogen, bun | Renal clearance and protein catabolism | mg/dL |
| `Creatinine` | Serum creatinine, creat | Glomerular filtration and muscle turnover | mg/dL |
| `Glucose` | Serum glucose, fasting blood sugar | Energy homeostasis and metabolic stress | mg/dL |
| `ALT` | Alanine aminotransferase, alt | Hepatic cellular integrity | U/L |
| `AST` | Aspartate aminotransferase, ast | Hepatic and cardiac enzyme | U/L |
| `Albumin` | Serum albumin, alb | Oncotic pressure and protein transport | g/dL |
| `Calcium` | Serum total calcium, ca | Bone demineralization marker in microgravity | mg/dL |

---

## 4. Engineered Physiological Interaction Terms

Four clinical interaction terms were engineered directly from physiological mechanisms:
1. `NLR` (Neutrophil-to-Lymphocyte Ratio):
   Calculated as `Neutrophils / Lymphocytes`. Extensively established in space medicine as a sensitive barometer of systemic stress, radiation exposure, and immune balance.
2. `BUN_to_Creatinine`:
   Calculated as `BUN / Creatinine`. Serves as an index of pre-renal azotemia, intravascular volume depletion, and hydration status during cephalad fluid shifts.
3. `Inflammation_Index`:
   Calculated as `log1p(CRP * IL6)`. Captures non-linear synergistic vascular stress when acute phase reactants and cytokines are simultaneously elevated.
4. `CardioMetabolic_Ratio`:
   Calculated as `(Glucose * ALT) / Albumin`. Reflects metabolic stress and microgravity-induced insulin resistance.

---

## 5. Subject-Level Splitting (GroupKFold)

To prevent data leakage, row-random train/test splits were abolished. When multiple longitudinal rows from the same astronaut appear in both train and test splits, models memorize subject idiosyncrasies instead of true physiological stress patterns.

AstroVitals enforces 5-Fold `GroupKFold` split grouped on `subject_id`:
- Unique Subjects: 36
- In each fold, 100% of rows belonging to validation subjects are withheld from the training phase.
- Zero subject overlap exists between train and validation sets: `len(set(train_subjects).intersection(val_subjects)) == 0`.

---

## 6. Imputation and Normalization

- Median Imputation: Missing values are imputed using the training-fold feature median (`SimpleImputer(strategy='median')`), ensuring no test-fold information leaks into imputation statistics.
- Outlier Scaling: Robust z-scores are computed using Median Absolute Deviation (MAD): `z = (x - median) / (1.4826 * MAD)`. This bounds measurement artifacts without artificially truncating genuine physiological excursions.
- Target Isolation: Target risk scores are derived strictly from target biomarkers (`CRP`, `IL6`, `TNF`, `Fibrinogen` for CV; `IL6`, `IL10`, `Glucose` for sleep; `IL6`, `TNF`, `IFNG`, `IL10`, `IL12`, `IL17`, `CRP` for immune). None of these target biomarkers are included in the predictor feature set, preventing circular self-prediction.
