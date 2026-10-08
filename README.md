# 🦋 Butterfly Effect

**One change. Infinite possibilities.**

An AI-powered interactive explorer of hypothetical ripple effects. Describe a “What if…?” scenario and explore possible immediate, secondary, and long-term consequences in a connected causal graph.

> **Project status:** Planning/scaffolding stage. The codebase will be implemented phase by phase. Commands below describe the **target project structure**, not a claim that the app is already implemented.
>
> **Important:** Consequences are AI-generated thought experiments, not forecasts, verified facts, or calibrated probability estimates.

## Demo concept

**Prompt:** “What if the internet stopped working worldwide for 30 days?”

The app builds a causal graph with distinct branches (communication, business, infrastructure, daily life). Select a node to inspect assumptions and possible impacts, then expand that branch to see further hypothetical consequences.

## Planned MVP features

- Enter your own scenario or choose an example.
- Generate a real Gemini-powered 3-level causal graph.
- Explore directional branches in an interactive React Flow canvas.
- Click a node to read its reasoning, assumptions, impact and uncertainty labels.
- Expand a selected branch with 2–3 new consequences.
- Save and reopen scenarios in browser LocalStorage.
- Graceful loading, empty, and API-error states.

The authoritative scope and acceptance criteria live in [`PRD.md`](./PRD.md). Progress and test gates live in [`TODO.md`](./TODO.md).

## Intended stack

| Area | Technology |
|---|---|
| Frontend | Vite, React, TypeScript, Tailwind CSS |
| Graph | `@xyflow/react` + Dagre |
| Backend | Node.js, Express, TypeScript |
| AI | Google Gemini via `@google/genai` |
| Validation | Zod |
| Persistence | Browser LocalStorage |
| Testing | Vitest, TypeScript, ESLint |

## Intended repository structure

```text
butterfly-effect/
├── PRD.md
├── TODO.md
├── AGENTS.md
├── README.md
├── .gitignore                # created during Phase 0
├── package.json              # root scripts, created during Phase 0
├── client/                   # created during Phase 0–1
└── server/                   # created during Phase 0–1
    └── .env.example          # created during Phase 0
```

## Getting started (after scaffolding)

### Prerequisites
- Node.js LTS (a current supported version; use Node 22+ if the chosen package versions require it).
- npm.
- A Google Gemini API key with an available model and sufficient quota.
- Wispr Flow, if participating in the HackerHouse voice-driven development challenge.

### Set up

After implementing Phase 0 and 1 from `TODO.md`, the intended commands will be:

```bash
npm install
```

Create `server/.env` from `server/.env.example` and fill in your credentials:

```dotenv
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=your_supported_gemini_model
PORT=3001
```

**Never commit `server/.env`.** The exact default model will be selected during implementation based on available structured-output support.

Then run:

```bash
npm run dev
```

Open the local URL printed by Vite. The target backend readiness endpoint is `http://localhost:3001/api/health`.

Expected final scripts, once implemented:

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run test
```

If these scripts don't exist yet, complete the corresponding TODO phase first.

## APIs (planned)

| Endpoint | Action |
|---|---|
| `GET /api/health` | Check server readiness |
| `POST /api/analyze` | Produce a structured graph for a scenario |
| `POST /api/expand` | Return a merged, validated graph with an expanded branch |

See [`PRD.md`](./PRD.md) for request/response contracts and validation rules.

## Suggested build order

1. **Foundation:** get the frontend and backend running.
2. **Real AI:** call Gemini and validate a JSON causal graph.
3. **Visualization:** convert graph data into a usable React Flow canvas.
4. **Expansion:** generate and merge genuine downstream effects.
5. **Persistence and polish:** save graphs, refine UX, run tests.

Do **not** spend days polishing a static graph before building the real API pipeline.

## Building with Wispr Flow

For HackerHouse Goa 2026, the developer should dictate the entire development workflow using Wispr Flow as required by the challenge: project instructions, implementation requests, debugging, and fixes. Record authentic evidence of that process. Verify the latest rules, account/referral conditions, and submission format with the official organizers.

**Starter spoken prompt for your coding assistant:**

> Read PRD.md, TODO.md, and AGENTS.md. Implement Phase 0 and Phase 1 only. Set up the Vite React TypeScript client, Express TypeScript server, environment example, root scripts and health route. Run both locally and fix startup issues. Don't build placeholder AI functionality. Report what you verified and update checked items in TODO.md.

## Project principles

- **Functional before flashy:** always prioritize the complete scenario-to-graph journey.
- **Explain assumptions:** causal graphs are conditional possibilities, not guaranteed predictions.
- **No secrets on the client:** all Gemini calls go through Express.
- **Bound complexity:** capped nodes and depths make demos practical.
- **Be candid:** only mark tested functionality as complete.

## License

License has not been selected. Add a `LICENSE` file before describing the repository as open-source; publicly readable code alone does not grant reuse rights.
