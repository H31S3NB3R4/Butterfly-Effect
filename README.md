# 🦋 Butterfly Effect

**One change. Infinite possibilities.** Enter a hypothetical “What if…?” scenario, explore a Gemini-generated causal graph, inspect assumptions, and expand individual branches. These are conditional thought experiments, **not forecasts or measured probabilities**.

## Run locally (Windows PowerShell)

Prerequisites: Node.js 22 or newer, npm, and a Gemini API key with access to a structured-output-capable model and available quota. The verified development environment used Node 22.23.2 and npm 10.9.8.

```powershell
git clone https://github.com/H31S3NB3R4/Butterfly-Effect.git
Set-Location Butterfly-Effect
npm ci
Copy-Item server/.env.example server/.env
```

Edit `server/.env` and set `GEMINI_API_KEY` to your own key. The example selects `gemini-3.5-flash-lite`; `GEMINI_MODEL` can be changed to another model your key can access. Do not commit `server/.env` or put a key in `client/`.

Gemini 3 requests use low thinking effort and concise graph instructions to reduce latency. `GEMINI_TIMEOUT_MS` defaults to `90000` (allowed range: 1000–180000); invalid values fall back to 90000. This is one total deadline, including the optional JSON-format retry. If an existing `.env` pins the slower `gemini-3.5-flash`, change it to `gemini-3.5-flash-lite` and restart `npm run dev`.

```powershell
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the Express server at `http://localhost:3001`; `http://localhost:3001/api/health` should return `{"status":"ok"}`. Wait until both startup messages appear before submitting a scenario.

To run the release checks:

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
```

To run only the built backend: `npm run build -w server` followed by `npm run start -w server`. The frontend can be previewed after a build with `npm run preview -w client`; its `/api` proxy is configured for Vite development, so use the two development servers for a local end-to-end demo.

## Use the app

Choose one of the three example scenarios or enter up to 500 characters. Gemini returns one root and 9–15 consequences across three depths. Click a card, or focus it with Tab and press Enter/Space, to inspect its explanation, assumptions, and qualitative impact/uncertainty. Expand a non-root branch to add 2–3 new downstream consequences; the full graph is capped at 35 nodes and depth 5. Use **New scenario** to close the current graph, then **Open** or **Delete** in Recent explorations. Graphs auto-save to this browser's LocalStorage, including expansions.

On narrow screens the inspector is a collapsible bottom drawer. The graph supports pan, zoom, fit view, and a desktop MiniMap.

## API

| Endpoint | Request | Result |
|---|---|---|
| `GET /api/health` | None | `{ "status": "ok" }` |
| `POST /api/analyze` | `{ "scenario": "What if ...?" }` | Validated `ScenarioGraph` |
| `POST /api/expand` | `{ "graph": ScenarioGraph, "selectedNodeId": "..." }` | Full merged, validated graph |

The server uses the official `@google/genai` SDK, server-side environment variables, structured JSON, Zod validation, and graph-integrity checks. Invalid input returns 400; missing configuration, upstream timeout, rate limit, and unavailable-service responses use a stable JSON `{ "error": { "code", "message" } }` shape. Model output is never accepted as a graph without validation.

## Known limitations

- Results are speculative AI-generated possibilities, not verified facts or forecasts. Impact and uncertainty are qualitative labels.
- Gemini model availability and quota depend on the API account. In the October 2026 QA run, `gemini-2.5-flash` returned a 429 rate limit and `gemini-2.5-flash-lite` returned a 404 stating it was unavailable to new users; `gemini-3.5-flash` generated valid sample graphs. A weaker model may produce JSON that fails strict graph validation; the app rejects it and offers retry.
- A subsequent timeout regression reproduced a 45-second failure for the daily-momos scenario on `gemini-3.5-flash`. The default now uses Flash-Lite with an explicit three-branch, ten-node structure. Both reported food/drink scenarios returned validated graphs in 4.5 seconds during the fix verification. Provider latency can still vary.
- LocalStorage is per browser/device, may be cleared, and can fail under storage restrictions. There is no account sync or cloud database. The 20 most recent saved graphs are retained. JSON export is not implemented.
- The production client bundle currently triggers Vite's >500 kB chunk warning; the build still succeeds. There is no deployed-host configuration in this repository.

## Wispr Flow shortlisting submission

The [official Wispr Flow task](https://docs.google.com/document/d/1VXZ0LyPC39nA5RhF5e0rpCT_hFFfEHj0XReXuu5zhxI/edit?usp=sharing), linked from [HH Goa's task page](https://hhgoa.com/), says the Wispr Flow account **must** be created through [the HHG referral link](https://ref.wisprflow.ai/hhg); otherwise the submission is not counted. It requires an actual voice-driven build process recording, a working project, and a GitHub repository URL. Submit through [the official form](https://forms.gle/Lv9wF8gYVHdEqfJW8) by **October 10, 2026 at 11:59 PM**; the document says no resubmissions. Verify account/referral eligibility and record authentic process evidence before submitting. This repository alone does **not** prove voice-only development or satisfy the video requirement.

See [PRD.md](./PRD.md) for product scope and [TODO.md](./TODO.md) for test status. A license has not been selected; public visibility does not grant reuse rights.
