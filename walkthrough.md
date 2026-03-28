# ML Module Integration — Walkthrough

## What Changed

### 1. ML Folder Restructured
The flat [ml/](file:///d:/projects/Nivaran/app/pubspec.yaml) folder was reorganized into a proper Python package:

```
ml/
├── __init__.py
├── api/
│   ├── __init__.py
│   └── main.py              ← FastAPI service (6 endpoints)
├── models/
│   ├── __init__.py
│   ├── red_zone_predictor.py         ← XGBoost + optional LSTM
│   └── report_verifier_trust_scorer.py ← BERT + Random Forest
├── data/
│   ├── __init__.py
│   └── ingestion_pipeline.py ← News/Twitter/Govt/Blockchain fetcher
├── prompts/
│   ├── __init__.py
│   └── prompts.py            ← LLM prompt templates
├── train_models.py            ← Training entry point
├── ml-integration.js          ← Node.js client wrapper
├── requirements.txt
└── README.md
```

Import paths in [api/main.py](file:///d:/projects/Nivaran/ml/api/main.py) and [train_models.py](file:///d:/projects/Nivaran/ml/train_models.py) were fixed to use `sys.path.insert(0, ...)`.

---

### 2. Backend Wired (4 New Routes)

Added to [server.js](file:///d:/projects/Nivaran/safeher-backend/server.js):

| Route | Method | Purpose |
|---|---|---|
| `/api/zones/predict` | POST | Zone risk prediction via ML |
| `/api/reports/analyse` | POST | Report verification + trust scoring |
| `/api/ml/refresh` | POST | Refresh data ingestion pipeline |
| `/api/ml/health` | GET | ML service connectivity check |

All routes have **graceful fallbacks** — if the ML service is offline, they return safe defaults instead of crashing.

---

### 3. Admin Dashboard Connected

[MLPredictionsPage.tsx](file:///d:/projects/Nivaran/Admin%20Dashboard/src/pages/MLPredictionsPage.tsx):
- "Predict Risk Score" button now calls `POST /api/zones/predict`
- Model Status panel shows real ML health (XGBoost, BERT, Trust Scorer)
- ML Service connection indicator at bottom of status panel

---

### 4. Flutter App Integrated

[safety_service.dart](file:///d:/projects/Nivaran/app/lib/services/safety_service.dart):
- [_updateRiskAssessment()](file:///d:/projects/Nivaran/app/lib/services/safety_service.dart#542-569) now calls [_fetchMLZonePrediction()](file:///d:/projects/Nivaran/app/lib/services/safety_service.dart#570-615) asynchronously
- Blends ML-returned `risk_score` (40%) with local calculation (60%)
- 3-second timeout — silently falls back to local-only if ML is unavailable

---

## How to Run the Complete Stack

### Step 1: Train ML Models
```bash
cd d:\projects\Nivaran\ml
pip install -r requirements.txt
python train_models.py
```

### Step 2: Start ML FastAPI Service
```bash
cd d:\projects\Nivaran\ml
uvicorn api.main:app --reload --port 8000
```
Verify: `curl http://localhost:8000/health`

### Step 3: Start Node.js Backend
```bash
cd d:\projects\Nivaran\safeher-backend
npm start
```
Verify: `curl http://localhost:3000/api/ml/health`

### Step 4: Test Prediction
```bash
curl -X POST http://localhost:3000/api/zones/predict -H "Content-Type: application/json" -d "{\"locations\":[{\"latitude\":19.9975,\"longitude\":73.7898}]}"
```

### Step 5: Run Flutter App & Admin Dashboard
Both will automatically connect to the ML service through the Node.js backend proxy.
