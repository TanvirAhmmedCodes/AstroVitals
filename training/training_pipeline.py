import os, sys, json, time, warnings, re
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, IsolationForest, VotingRegressor
from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.impute import SimpleImputer
import joblib

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

warnings.filterwarnings("ignore")

DATA_DIR = Path("./nasa_osdr")
MODEL_DIR = Path("./models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

RANDOM_STATE = 42
TEST_SIZE = 0.20
N_CV_FOLDS = 5
USE_GPU = False

TARGET_BIOMARKERS = {
    "cardiovascular": ["CRP", "IL6", "TNF", "Fibrinogen"],
    "sleep_behavioral": ["IL6", "IL10", "Glucose"],
    "immune": ["IL6", "TNF", "IFNG", "IL10", "IL12", "IL17", "CRP"],
}

FEATURE_BIOMARKERS = {
    "cardiovascular": ["ALT", "AST", "Albumin", "BUN", "Basophils", "Calcium", "Chloride", "Creatinine", "Eosinophils", "Glucose", "Hematocrit", "Hemoglobin", "Potassium", "Sodium", "WBC", "Neutrophils", "Lymphocytes", "Monocytes", "Platelets", "Age", "Mission_Day"],
    "sleep_behavioral": ["ALT", "AST", "Albumin", "BUN", "Basophils", "Calcium", "Chloride", "Creatinine", "Eosinophils", "Hematocrit", "Hemoglobin", "Potassium", "Sodium", "WBC", "Neutrophils", "Lymphocytes", "Platelets", "Age", "Mission_Day"],
    "immune": ["ALT", "AST", "Albumin", "BUN", "Basophils", "Calcium", "Chloride", "Creatinine", "Eosinophils", "Glucose", "Hematocrit", "Hemoglobin", "Potassium", "Sodium", "WBC", "Monocytes", "Platelets", "Age", "Mission_Day"],
}

RISK_WEIGHTS = {
    "cardiovascular": {"CRP": 0.35, "IL6": 0.30, "TNF": 0.20, "Fibrinogen": 0.15},
    "sleep_behavioral": {"IL6": 0.45, "IL10": 0.30, "Glucose": 0.25},
    "immune": {"IL6": 0.25, "TNF": 0.20, "IFNG": 0.15, "IL10": 0.15, "IL12": 0.10, "IL17": 0.10, "CRP": 0.05},
}

COGNITIVE_NORMS = {
    "reaction_time_ms_mean": 320,
    "reaction_time_ms_std": 45,
    "mood_score_mean": 7.2,
    "mood_score_std": 1.5,
    "source": "ESA COGNISPACE placeholder",
}


def normalize_columns(df):
    rename_map = {}
    for col in df.columns:
        key = str(col).strip().lower()
        key_norm = re.sub(r"[_\-\s]+", " ", key)
        patterns = [
            (r"\bc reactive protein\b|\bcrp\b", "CRP"),
            (r"\binterleukin 6\b|\bil 6\b|\bil6\b", "IL6"),
            (r"\binterleukin 10\b|\bil 10\b|\bil10\b", "IL10"),
            (r"\binterleukin 12\b|\bil 12\b|\bil12\b", "IL12"),
            (r"\binterleukin 17\b|\bil 17\b|\bil17\b", "IL17"),
            (r"\btumor necrosis factor\b|\btnf alpha\b|\btnf a\b|\btnf\b", "TNF"),
            (r"\binterferon gamma\b|\bifn gamma\b|\bifn g\b|\bifng\b", "IFNG"),
            (r"\bfibrinogen\b", "Fibrinogen"),
            (r"\bglucose\b", "Glucose"),
            (r"\bcortisol\b", "Cortisol"),
            (r"\balanine aminotransferase\b|\balt\b", "ALT"),
            (r"\baspartate aminotransferase\b|\bast\b", "AST"),
            (r"\balbumin\b", "Albumin"),
            (r"\bblood urea nitrogen\b|\bbun\b", "BUN"),
            (r"\bcreatinine\b", "Creatinine"),
            (r"\bcalcium\b", "Calcium"),
            (r"\bchloride\b", "Chloride"),
            (r"\bpotassium\b", "Potassium"),
            (r"\bsodium\b", "Sodium"),
            (r"\bhemoglobin\b", "Hemoglobin"),
            (r"\bhematocrit\b", "Hematocrit"),
            (r"\bwhite blood cell\b|\bwbc\b", "WBC"),
            (r"\bneutrophils?\b", "Neutrophils"),
            (r"\blymphocytes?\b", "Lymphocytes"),
            (r"\bmonocytes?\b", "Monocytes"),
            (r"\bbasophils?\b", "Basophils"),
            (r"\beosinophils?\b", "Eosinophils"),
            (r"\bplatelets?\b", "Platelets"),
        ]
        for pattern, canonical in patterns:
            if re.search(pattern, key_norm):
                rename_map[col] = canonical
                break
    return df.rename(columns=rename_map)


def load_all_data(data_dir):
    print(f"[INFO] Scanning: {data_dir}")
    if not data_dir.exists():
        print(f"[ERROR] Not found: {data_dir}")
        return pd.DataFrame()

    candidates = []
    for f in data_dir.rglob("*"):
        if not f.is_file():
            continue
        name = f.name.lower()
        if "multiqc" in name:
            continue
        if "glds" in name:
            continue
        if "submitted" in name:
            continue
        if "transformed" in name:
            candidates.append(f)

    print(f"[INFO] Found {len(candidates)} TRANSFORMED files")

    frames = []
    for f in candidates:
        try:
            if f.suffix in (".xlsx", ".xls"):
                df = pd.read_excel(f)
            elif f.suffix == ".tsv":
                df = pd.read_csv(f, sep="\t", low_memory=False)
            else:
                df = pd.read_csv(f, low_memory=False)

            if df.empty or len(df.columns) < 3:
                continue

            subj_col = None
            for c in df.columns:
                cl = str(c).lower().strip().replace(" ", "_")
                if cl in ("subject_id", "subjectid", "subject", "id",
                          "sample_id", "sampleid", "sample",
                          "participant_id", "participant", "donor",
                          "donor_id", "donorid"):
                    subj_col = c
                    break

            if subj_col is not None:
                df = df.set_index(subj_col)

            df = normalize_columns(df)
            df = df.select_dtypes(include=[np.number])

            if df.shape[1] < 2:
                continue

            frames.append(df)
            print(f"  [OK] {f.name}: {df.shape}")
        except Exception as e:
            print(f"  [SKIP] {f.name}: {str(e)[:60]}")

    if not frames:
        print("[WARN] No valid files")
        return pd.DataFrame()

    merged = frames[0]
    for df in frames[1:]:
        try:
            merged = merged.join(df, how="outer", rsuffix="_dup")
        except Exception:
            continue

    merged = merged.loc[:, ~merged.columns.duplicated()]

    if merged.shape[0] < 5:
        print("[WARN] Too few samples after merge")
        return pd.DataFrame()

    if "Age" not in merged.columns:
        np.random.seed(RANDOM_STATE)
        merged["Age"] = np.random.randint(30, 55, size=len(merged))
    if "Mission_Day" not in merged.columns:
        np.random.seed(RANDOM_STATE)
        merged["Mission_Day"] = np.random.randint(0, 3, size=len(merged))

    merged = merged.fillna(merged.median(numeric_only=True))
    merged = merged.dropna(axis=1, how="all")

    print(f"[INFO] Final shape: {merged.shape}")
    print(f"[INFO] Available columns: {sorted(merged.columns.tolist())}")
    return merged


def robust_zscore(series):
    median = series.median()
    mad = (series - median).abs().median()
    if mad == 0 or pd.isna(mad):
        return pd.Series(np.zeros(len(series)), index=series.index)
    return (series - median) / (1.4826 * mad)


def build_target(df, category):
    biomarkers = TARGET_BIOMARKERS[category]
    weights = RISK_WEIGHTS[category]
    available = [b for b in biomarkers if b in df.columns]
    if not available:
        print(f"  [WARN] No target biomarkers for {category} - using random proxy")
        return pd.Series(np.random.normal(50, 10, size=len(df)))
    print(f"  [INFO] Using target biomarkers: {available}")
    z_sum = pd.Series(np.zeros(len(df)), index=df.index)
    total_w = 0.0
    for b in available:
        w = weights.get(b, 1.0 / len(available))
        z_sum += robust_zscore(df[b]) * w
        total_w += w
    if total_w > 0:
        z_sum /= total_w
    return (50 + 15 * z_sum).clip(0, 100)


def build_features(df, category):
    targets = set(TARGET_BIOMARKERS[category])
    features = [f for f in FEATURE_BIOMARKERS[category] if f in df.columns and f not in targets]
    if len(features) < 3:
        numeric = df.select_dtypes(include=[np.number]).columns.tolist()
        features = [c for c in numeric if c not in targets][:25]
    if not features:
        return pd.DataFrame()
    X = df[features].copy()
    X = X.loc[:, X.std() > 0]
    return X


def get_xgb_model():
    if not HAS_XGB:
        return None
    params = {
        "n_estimators": 200, "max_depth": 3, "learning_rate": 0.05,
        "subsample": 0.8, "colsample_bytree": 0.8,
        "reg_alpha": 0.1, "reg_lambda": 1.0,
        "random_state": RANDOM_STATE, "n_jobs": -1,
    }
    return xgb.XGBRegressor(**params)


def train_ensemble(X, y, category):
    print(f"\n[TRAIN] {category}")
    print(f"  Features: {X.shape[1]}, Samples: {len(y)}")
    if len(X) < 10 or X.shape[1] < 2:
        print(f"  [SKIP] Insufficient data")
        return None

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )

    imputer = SimpleImputer(strategy="median")
    X_train_i = imputer.fit_transform(X_train)
    X_test_i = imputer.transform(X_test)

    models = []
    weights = []

    if HAS_XGB:
        xgb_model = get_xgb_model()
        if xgb_model is not None:
            xgb_model.fit(X_train_i, y_train)
            models.append(("xgb", xgb_model))
            weights.append(0.4)

    gbr = GradientBoostingRegressor(
        n_estimators=100, max_depth=3, learning_rate=0.05,
        random_state=RANDOM_STATE
    )
    gbr.fit(X_train_i, y_train)
    models.append(("gbr", gbr))
    weights.append(0.3)

    rf = RandomForestRegressor(
        n_estimators=100, max_depth=5,
        random_state=RANDOM_STATE, n_jobs=-1
    )
    rf.fit(X_train_i, y_train)
    models.append(("rf", rf))
    weights.append(0.3)

    w_arr = np.array(weights) / sum(weights)
    ensemble = VotingRegressor(models, weights=w_arr)
    ensemble.fit(X_train_i, y_train)

    y_pred = ensemble.predict(X_test_i)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = r2_score(y_test, y_pred)

    print(f"  MAE={mae:.3f}  RMSE={rmse:.3f}  R²={r2:.3f}")

    cv_mean, cv_std = 0.0, 0.0
    if len(X_train_i) >= N_CV_FOLDS * 3:
        kf = KFold(n_splits=N_CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
        cv_scores = cross_val_score(ensemble, X_train_i, y_train, cv=kf, scoring="r2", n_jobs=-1)
        cv_mean = float(cv_scores.mean())
        cv_std = float(cv_scores.std())
        print(f"  CV R²: {cv_mean:.3f} ± {cv_std:.3f}")

    model_path = MODEL_DIR / f"risk_model_{category}.pkl"
    joblib.dump({
        "imputer": imputer,
        "model": ensemble,
        "feature_columns": list(X.columns),
        "metrics": {
            "MAE": float(mae), "RMSE": rmse, "R2": float(r2),
            "CV_R2_mean": cv_mean, "CV_R2_std": cv_std,
        },
    }, model_path)
    print(f"  [SAVED] {model_path}")

    return {
        "MAE": float(mae), "RMSE": rmse, "R2": float(r2),
        "CV_R2_mean": cv_mean, "CV_R2_std": cv_std,
        "n_samples": int(len(y)), "n_features": int(X.shape[1]),
        "target_biomarkers": TARGET_BIOMARKERS[category],
        "feature_columns": list(X.columns),
    }


def train_anomaly(df):
    print(f"\n[TRAIN] Anomaly Detector")
    numeric = df.select_dtypes(include=[np.number]).columns
    X = df[numeric].fillna(df[numeric].median())
    if len(X) < 10:
        print("  [SKIP] Not enough samples")
        return
    model = IsolationForest(
        n_estimators=100, contamination=0.1,
        random_state=RANDOM_STATE, n_jobs=-1
    )
    model.fit(X)
    path = MODEL_DIR / "anomaly_detector.pkl"
    joblib.dump({"model": model, "feature_columns": list(X.columns)}, path)
    print(f"  [SAVED] {path}")


def compute_baselines(df):
    numeric = df.select_dtypes(include=[np.number]).columns
    stats = {}
    for col in numeric:
        v = df[col].dropna()
        if len(v) == 0:
            continue
        median = float(v.median())
        mad = float((v - median).abs().median())
        stats[col] = {
            "mean": float(v.mean()), "std": float(v.std()),
            "median": median, "mad": mad,
            "min": float(v.min()), "max": float(v.max()),
            "n": int(len(v))
        }
    with open(MODEL_DIR / "baseline_stats.json", "w") as f:
        json.dump(stats, f, indent=2)
    print(f"  [SAVED] baseline_stats.json ({len(stats)} features)")


def main():
    start = time.time()
    print("=" * 60)
    print("AstroVitals Training Pipeline v2")
    print(f"Started: {datetime.now().isoformat()}")
    print("=" * 60)

    df = load_all_data(DATA_DIR)
    if df.empty:
        print("[FATAL] No data loaded.")
        return

    df.to_csv(MODEL_DIR / "training_table.csv", index=False)
    print(f"[SAVED] training_table.csv")

    all_metrics = {}
    all_features = {}

    for category in TARGET_BIOMARKERS.keys():
        X = build_features(df, category)
        y = build_target(df, category)
        if X.empty or len(X) < 10:
            print(f"[SKIP] {category}: insufficient data")
            continue
        result = train_ensemble(X, y, category)
        if result is not None:
            all_metrics[category] = result
            all_features[category] = result["feature_columns"]

    train_anomaly(df)
    compute_baselines(df)

    with open(MODEL_DIR / "cognitive_norms.json", "w") as f:
        json.dump(COGNITIVE_NORMS, f, indent=2)
    with open(MODEL_DIR / "feature_columns.json", "w") as f:
        json.dump(all_features, f, indent=2)
    with open(MODEL_DIR / "metrics.json", "w") as f:
        json.dump(all_metrics, f, indent=2)

    metadata = {
        "trained_at": datetime.now().isoformat(),
        "duration_seconds": time.time() - start,
        "data_shape": list(df.shape),
        "categories": list(all_metrics.keys()),
        "gpu_enabled": USE_GPU,
        "has_xgboost": HAS_XGB,
    }
    with open(MODEL_DIR / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    elapsed = time.time() - start
    print("\n" + "=" * 60)
    print(f"DONE - {elapsed / 60:.1f} minutes")
    print("=" * 60)
    for cat, m in all_metrics.items():
        print(f"  {cat}: R²={m['R2']:.3f}  (CV: {m['CV_R2_mean']:.3f}, samples={m['n_samples']})")


if __name__ == "__main__":
    main()
