# ForteVision — ForteBank Datathon 26 Frontend

Responsive React + TypeScript user interface for the ForteBank cashier video analysis challenge. Independent frontend; connects to your teammates' local AI backend through the official jury API contract.

## Start on Windows in VS Code

Install Node.js 20.19+ / 22.12+ (LTS recommended). Open this folder in VS Code, then open **Terminal > New Terminal**.

```powershell
npm install
npm run dev
```

Open **http://localhost:5173**.

Optionally set a default backend URL:

```powershell
Copy-Item .env.example .env
```

The API key is entered in the site via **Настройки API**; it is **never saved to localStorage or a source file**.

## Use the existing Backend

In the upper right, select **Настройки API**. Enter your actual backend address (e.g. `http://127.0.0.1:8000`) and its `X-API-Key`. Press **Сохранить настройки**. Then choose a `.mov` file and click **Запустить анализ**.

The frontend calls:

- `POST /api/v1/analyze`, multipart `file`, `X-API-Key`, expects `{ "job_id": "..." }`.
- `GET /api/v1/jobs/{job_id}`, `X-API-Key`, expects `status: processing | done | failed`.

On `done`, expected result:

```json
{
  "job_id":"abc123",
  "status":"done",
  "verdict":"violation",
  "violations":[{
    "type":"Event name",
    "timecode_sec":44.2,
    "description":"What is visible and why it merits review",
    "evidence_frames":[{"timestamp_sec":44.2,"image_base64":"/9j/4AA..."}]
  }]
}
```

Optional backend extensions `rule` or `normative_source` (with `title`, `document`, `section`, `clause`, `url`) are rendered if present; **no source is invented when those fields are absent**.

## API connection / CORS

If Vite runs on `http://localhost:5173`, FastAPI must permit that exact origin. For example:

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["X-API-Key", "Content-Type"],
)
```

For public deployment, update CORS to the exact HTTPS site origin; configure TLS and rate limits. `localhost` works only on your own device. A public frontend must point to a **publicly reachable** backend URL.

## Demo mode

Click **Посмотреть демо**. This only creates a **clearly labeled synthetic UI result**, not a real AI inference. Its example event is fabricated for UI display and is never counted in real-session statistics or represented as true evidence.

## Key features

- Premium, responsive fintech dashboard in Russian
- Drag/drop `.mov` upload, configurable 250 MiB UI limit (backend may be stricter)
- API key entered at runtime, not committed
- Polling every ~2.2 seconds; front-end timeout before the jury's 5-minute cutoff
- Reliable `processing`, `done`, `failed` handling; cancel frontend waiting
- Multi-event timelines, frame lightbox, video seek to timecode where the browser supports MOV
- Optional verified normative references from backend
- In-memory scan history for this browser session (not persisted)
- No face recognition or client-side cloud AI calls

## Check quality and build

```powershell
npm run test
npm run build
npm run preview
```

Production static files are in `dist/`. Host on any static HTTPS frontend hosting, then connect the backend's real HTTPS URL. Do not put secret API keys in Vite `.env` variables because they are exposed in the browser bundle.

## Important limitations

- This is **frontend only**. Real event detection and evidence come from teammates' AI backend.
- The backend must have `.mov` support and process new files within 5 minutes. The site cannot guarantee that.
- MOV playback in browsers varies by codec. Evidence JPEGs remain accessible even if native MOV playback fails.
- Evidence frames in the official jury schema are JPEG base64; the frontend only displays the provided bytes.
- No legal conclusion is made from the UI. A human examiner must verify events and official rules.
- This is an independently created competition dashboard concept, **not an official ForteBank product**.
