# SmartSkin – Smart Skin Disease Detection Using Deep Learning

> ## ⚠️ Project status (read first)
> The application code, API, auth, history, tests and training pipeline are complete. **No dataset and no trained
> model are included**, so until you train one the API returns **HTTP 503** on `/api/predict` and the UI shows
> "No trained model is loaded". There is **no fake/demo prediction path**. All metrics (accuracy, F1, confusion
> matrix) are produced only by `train.py` from your dataset's untouched test split.

## Quick start
```bash
# 1. Backend
cd backend
python -m venv .venv && source .venv/bin/activate        # Python 3.10-3.12
pip install -r requirements.txt
cp .env.example .env     # then set SECRET_KEY: python -c "import secrets;print(secrets.token_hex(32))"

# 2. Dataset: place real data in backend/dataset/{train,validation,test}/<class>/  (see dataset/README.md)
python analyze_dataset.py                      # validates + reports counts, corrupt files, duplicates, leakage

# 3. Train + evaluate (writes models/skin_model.keras, class_labels.json, metrics.json, plots...)
python train.py --arch mobilenet --epochs 15
python train.py --arch efficientnet --out-dir models_efficientnet   # optional architecture comparison
python train.py --arch resnet50     --out-dir models_resnet50

# 4. Run
uvicorn app.main:app --reload                  # http://127.0.0.1:8000/docs
cd ../frontend && npm install && npm run dev   # http://localhost:5173

# Tests
cd backend && pytest -q
```

## Verified in this build
- Backend: 26 pytest tests pass (auth, JWT, protected routes, upload validation incl. corrupt/oversized/unsupported,
  503 when no model, low-confidence flag, history ownership, skincare, health, dataset validator).
- API tests of the prediction path use a clearly labelled **test double** (`tests/conftest.py`) because TensorFlow
  and a dataset were unavailable in the build environment; it is never used by the application.
- Frontend: `tsc --noEmit` and `vite build` succeed. Live smoke test: register -> login -> predict (503, no model)
  -> history verified over real HTTP.
- **NOT verified (needs your dataset + TensorFlow):** training, real predictions, metrics, and the full browser
  end-to-end flow with a real model.

## Known gaps / your to-do
- Skincare content (`recommendation_service.py`) is keyed by condition name; make sure it covers the classes in
  YOUR dataset and review wording with a clinician/reference before presenting.
- No camera capture in the Analyze page (upload only). Docker compose is from the original project, untested.
- Report/PPT/viva/team-responsibility documents are not generated in this build.
- Not a medical diagnosis: preliminary educational predictions only; consult a healthcare professional.

computer vision can assist users with **preliminary, educational** skin-
condition screening from an uploaded or captured photo.

> ⚠️ **This is not a medical device.** Every prediction is labeled with a
> disclaimer and is never presented as a diagnosis. See [Medical Disclaimer](#medical-disclaimer).

---

## 1. Project Overview

- **Frontend:** React + Vite + TypeScript + Tailwind CSS, React Router, Axios, Recharts, Lucide icons
- **Backend:** FastAPI + SQLAlchemy + SQLite, JWT auth, Pillow, NumPy

The full user flow (all real, working steps — no hard-coded results):

```
Landing → Register/Login → Dashboard → Analyze (Upload/Camera) → Preview
   → AI Analysis (preprocess → model → predict) → Confidence + Top-3
   → Educational explanation → General skincare guidance → Daily routine
   → Save to history → History (view / filter / delete)
```

## 2. Features

- JWT authentication with hashed passwords (register/login/me/logout)
- Drag-and-drop image upload **and** live camera capture, with client- and
  server-side validation (type, size, corruption)
- Real preprocessing pipeline (RGB conversion → resize → normalize → tensor → batch)
- A `ModelService` that loads a `.keras`/`.h5`/`.pth` model **once** at startup and
  reuses it for every request
  UI and API response, never presented as a real result (see `backend/app/services/model_service.py`)
- Configurable low-confidence threshold with a dedicated UI warning
- Rule-based skincare recommendation engine (general, non-prescription guidance only)
- Personalized daily routine (skin type / sun exposure / current products)
- Prediction history with filtering, pagination, and per-record delete
- Dashboard analytics (confidence over time, most-frequent conditions) via Recharts
- Admin/model-status page showing what's actually loaded (no fake claims)
- Per-user data isolation — users cannot read or delete another user's predictions
- Friendly error handling everywhere; no Python stack traces reach the client
- `train.py` — a real transfer-learning training pipeline for when you have a dataset
- Automated backend test suite (pytest) covering auth, prediction, history, skincare, health

## 3. Architecture

```
smartskin/
├── frontend/            React + Vite + TS + Tailwind SPA
│   └── src/{components,pages,layouts,hooks,services,types,utils}
├── backend/
│   ├── app/
│   │   ├── main.py           FastAPI app, CORS, static /uploads, error handling
│   │   ├── database.py       SQLAlchemy engine/session
│   │   ├── models.py         User, Prediction, SkincarePreference
│   │   ├── schemas.py        Pydantic request/response models
│   │   ├── auth.py           Password hashing + JWT
│   │   ├── routes/           auth.py, prediction.py (incl. history), skincare.py, admin.py
│   │   └── services/
│   │       ├── image_service.py          validation + preprocessing
│   │       └── recommendation_service.py rule-based skincare engine
│   ├── models/            class_labels.json (+ your trained skin_model.keras)
│   ├── dataset/            put a real train/validation/test dataset here
│   ├── uploads/             uploaded images are saved here
│   ├── train.py             transfer-learning training script
│   └── tests/                pytest suite
└── docker-compose.yml
```

**Note on routes:** the spec listed a separate `routes/history.py`, but since
prediction history shares the same `Prediction` table and ownership rules as
the prediction endpoints, history listing/get/delete live in
`routes/prediction.py` alongside `POST /api/predict` to avoid duplicating
the same DB model and auth logic across two files.

## 4. Requirements

- Python 3.10+
- Node.js 18+
- (Optional, for real inference) TensorFlow 2.17+ or PyTorch, matching whichever
  model file format you provide

## 5. Dataset Setup

Place a real skin-image dataset under `backend/dataset/`:

```
backend/dataset/
├── train/<class_name>/*.jpg
├── validation/<class_name>/*.jpg
└── test/<class_name>/*.jpg
```

Class names are auto-detected from folder names — see `backend/dataset/README.md`.

## 6. Model Training

```bash
cd backend
pip install tensorflow scikit-learn   # optional ML deps, not in the base requirements.txt
python train.py --arch mobilenet --epochs 15 --image-size 224
```

This saves `models/skin_model.keras`, `models/class_labels.json`, and
`models/training_report.json` (accuracy/precision/recall/F1/confusion matrix
on the held-out test set). The moment `skin_model.keras` exists, the backend
no code changes needed.

## 7. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # edit as needed
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`. Interactive docs at `/docs` and `/redoc`.

## 8. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env            # set VITE_API_BASE_URL if not using the Vite proxy
npm run dev
```

Frontend runs at `http://localhost:5173` and proxies `/api` and `/uploads`
to `http://localhost:8000` in dev (see `vite.config.ts`).

## 9. Environment Variables

**backend/.env**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLAlchemy connection string (SQLite by default; swap for Postgres later without code changes) |
| `SECRET_KEY` | JWT signing secret — change before any real deployment |
| `MODEL_PATH` | Path to the trained model file |
| `CLASS_LABELS_PATH` | Path to `class_labels.json` |
| `CONFIDENCE_THRESHOLD` | Below this, the UI shows a low-confidence warning |
| `MAX_UPLOAD_SIZE_MB` | Upload size limit |
| `IMAGE_SIZE` | Model input resolution |
| `CORS_ORIGINS` | Comma-separated allowed origins |

**frontend/.env**

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL (leave blank to use the Vite dev proxy) |

## 10. Running the Application

1. Start the backend (`uvicorn app.main:app --reload`) — it auto-creates the SQLite DB and tables on startup.
2. Start the frontend (`npm run dev`).
3. Visit `http://localhost:5173`, register an account, and try **Analyze**.

## 11. API Documentation

Full interactive OpenAPI docs are auto-generated at `/docs` and `/redoc`
once the backend is running. Summary:

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Create an account |
| POST | `/api/auth/login` | — | Get a JWT |
| GET | `/api/auth/me` | ✓ | Current user |
| POST | `/api/auth/logout` | — | Client-side token discard |
| POST | `/api/predict` | ✓ | Upload an image, run inference, save + return the result |
| GET | `/api/predictions` | ✓ | List your history (supports `condition`, `skip`, `limit`) |
| GET | `/api/predictions/{id}` | ✓ | Get one result (owner-only) |
| DELETE | `/api/predictions/{id}` | ✓ | Delete one result (owner-only) |
| GET | `/api/skincare/{condition}` | — | Educational info + skincare plan for a condition |
| POST | `/api/skincare/preferences` | ✓ | Save skin type / sun exposure / current products |
| GET | `/api/skincare/routine/get` | ✓ | Personalized daily routine |
| GET | `/api/admin/model-status` | — | Model/dataset configuration snapshot |

## 12. Database Structure

- **users**: id, name, email (unique), password_hash, created_at
- **skincare_preferences**: id, user_id (FK, unique), skin_type, sun_exposure, routine_preferences (JSON), updated_at

## 13. Model Evaluation

`train.py` reports accuracy, precision, recall, F1-score, and a confusion
matrix on a **held-out test set** — kept separate from training accuracy, as
required. A high training accuracy alone is never sufficient evidence of
real-world or medical reliability.

## 14. Limitations

- Not validated against any clinical benchmark; not a regulated medical device
- Single-node SQLite deployment; swap `DATABASE_URL` for Postgres for multi-instance production use
- No email verification or password-reset flow
- No rate limiting on the prediction endpoint

## 15. Medical Disclaimer

**AI screening result only. This tool is for educational and preliminary
screening purposes and is not a medical diagnosis. Consult a qualified
dermatologist or healthcare professional for diagnosis and treatment.**

This project does not prescribe medicines, dosages, or treatments. All
skincare guidance is general and educational.

## 16. Future Improvements

- Real dataset + trained model (HAM10000 / ISIC Archive, subject to license terms)
- Password reset / email verification
- Bulk history delete + CSV export
- Postgres + Docker Compose production profile
- Rate limiting and image virus/malware scanning on upload
- Model versioning and A/B evaluation in the admin page

---

## Testing

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

19 tests cover registration, login/auth, image validation (type/size/corruption),
prediction + low-confidence flagging, history list/get/delete with per-user
ownership checks, skincare info, preferences/routine, and health/model-status.

All of the above was run against a live server during development (registration →
login → upload → predict → history → skincare → routine → model-status) to confirm
the full stack actually works end-to-end, not just that the pieces compile.