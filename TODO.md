# Butterfly Effect — Implementation Checklist

**Rule:** Finish and validate one phase at a time. Do not prioritize UI polish over the real AI-to-graph flow. Mark boxes only after testing them.

## Phase 0 — Repository and documentation
- [x] Read `PRD.md`, `AGENTS.md`, and `README.md`.
- [x] Create Git repository and `.gitignore` (`node_modules`, `.env`, `dist`, logs, `.DS_Store`).
- [x] Establish `client/` and `server/` workspace structure.
- [x] Add `server/.env.example`, no real secrets.
- [x] Add root scripts to run client and server together.
- [ ] Commit initial scaffold.

**Gate:** `npm install` works from repository root; scripts exist.

## Phase 1 — Working development foundation
- [x] Scaffold Vite React + TypeScript in `client/`.
- [x] Install Tailwind CSS and base design tokens.
- [x] Scaffold Express + TypeScript in `server/`.
- [x] Configure proxy or API base URL for local Vite development.
- [x] Implement `GET /api/health`.
- [x] Add clear root and package-level scripts for `dev`, `build`, `typecheck`, `test`.
- [x] Start both processes; verify health endpoint and frontend screen.

**Gate:** Frontend and backend launch locally without errors.

## Phase 2 — Graph contract and real Gemini integration
- [x] Implement Zod schemas and TypeScript types for graph, node, edge, analyze input, expand input.
- [x] Write graph-integrity checks: unique IDs, valid endpoints, no self-loops/cycles, reachability, valid depths, size caps.
- [x] Configure official Gemini SDK in backend with env model selection.
- [x] Implement prompts for structured 3-level consequence generation.
- [x] Parse and validate structured model response with one bounded retry for malformed model output.
- [x] Implement `POST /api/analyze` and typed error shape.
- [x] Add input validation, timeout, 429 handling, and missing-key response.
- [x] Unit-test graph validity logic with valid and invalid fixtures.
- [x] Manually call analyze endpoint with a real API key and inspect result.

**Gate:** API returns a connected, valid, non-hardcoded graph for at least two distinct scenarios.

## Phase 3 — Functional graph UI
- [x] Build scenario composer with validation and three example chips.
- [x] Add request loading/errors/retry feedback.
- [x] Render generated nodes/edges using `@xyflow/react`.
- [x] Apply deterministic Dagre layout by depth.
- [x] Add directional arrows, zoom, pan, fit view and controls.
- [x] Implement details inspector with explanation, assumptions, impact and uncertainty.
- [x] Include visible note that graphs are hypothetical explorations, not predictions.
- [x] Test on desktop and a narrow mobile viewport.

**Gate:** Anyone can enter a new scenario, inspect connected nodes, and navigate the graph.

## Phase 4 — Branch expansion
- [x] Implement `POST /api/expand` using selected node + current validated graph.
- [x] AI generates 2–3 non-duplicate consequences causally linked to selected node.
- [x] Merge on server; allocate safe IDs and validate full merged graph.
- [x] Enforce max 35 nodes and max depth 5.
- [x] Wire Expand button to backend and update graph in place.
- [x] Show progress, success feedback, and recoverable error states.
- [x] Test expansion twice, leaf expansion, and node/depth limits.

**Gate:** Two successive real expansions work without broken edges or lost nodes.

## Phase 5 — Small but valuable polish
- [x] Add LocalStorage save/load/delete for graphs.
- [x] Add new scenario/reset action.
- [x] Improve graph spacing and readability on normal laptop screens.
- [x] Add subtle node transitions and selection emphasis.
- [x] Add accessible labels, visible focus, and practical keyboard controls.
- [x] Verify mobile sidebar/drawer behavior.
- [ ] Optional: export graph JSON.

**Gate:** Refresh and reopen preserves a generated, expanded scenario.

Verified in the browser with a real Gemini response: 12 nodes initially, 15 after expansion, and 15 after refresh and reopening from Recent explorations.

## Phase 6 — QA and submission readiness
- [x] Test all three PRD sample scenarios using real AI responses.
- [x] Test blank and too-long scenario input.
- [x] Test missing key, network failure, timeout, model rate-limit.
- [x] Test invalid JSON, orphan edges, duplicate IDs, and excessive node counts.
- [x] Run lint, typecheck, tests, build and resolve failures.
- [x] Review browser bundle and Git staging for secrets.
- [x] Update README with exact setup commands and known limitations.
- [ ] Record the required *real* Wispr Flow building process and final demo.
- [x] Check challenge's official current submission instructions and required referral/account details.
- [x] Push to GitHub; optionally deploy if time allows.

**Gate:** End-to-end demo works reliably; required evidence is ready.

QA on 2026-10-09: three live Gemini 3.5 Flash analyses passed (internet 12 nodes/11 edges; universities 12/11 and 15 after expansion; private-car ban 13/12). Blank and 501-character inputs returned HTTP 400 and were blocked in the browser. Error-path and graph-integrity tests passed. The genuine Wispr Flow process recording and account/referral eligibility remain user-owned, so submission readiness is **not** complete. Deployment was not attempted.

## Timeout regression follow-up
- [x] Reproduce the daily-momos timeout against real Gemini (HTTP 504 at 45.4 seconds).
- [x] Use a responsive model and concise three-branch instructions; keep strict graph validation.
- [x] Verify momos and cola-instead-of-water requests return real graphs (both HTTP 200, 10 nodes/9 edges, 4.5 seconds each).
- [x] Verify real expansion preserves the initial graph (10 to 13 nodes, 1.7 seconds).
- [x] Test cancellation for analysis and expansion, plus the shared deadline for a formatting retry.

The server test command now excludes compiled `dist/` copies. Earlier 56-server-test totals counted source and compiled tests twice. The corrected suite contains 31 server tests and 6 client tests, all passing after this fix.

## Intermittent graph-validation follow-up
- [x] Generate ordered causal chains and derive IDs, depths, and edges on the server.
- [x] Derive Gemini's output schema from Zod, including field limits and required branch sizes.
- [x] Retain final graph-integrity validation and one retry for malformed output within the original deadline.
- [x] Test preservation of model content and causal order; reject missing branches/steps, invalid labels, oversized titles, and missing explanations.
- [x] Run five real analyses: exact daily-cola question three times, daily momos, and car ban. All returned HTTP 200 with 10 nodes/9 edges in 3.6–4.9 seconds.

## Don't build for MVP
- [ ] ~~Authentication / accounts~~
- [ ] ~~Complex data science forecasting~~
- [ ] ~~Multi-agent orchestration~~
- [ ] ~~Cloud database~~
- [ ] ~~Payment integration~~
- [ ] ~~Unnecessary Docker setup~~

## Recommended coding-assistant sequence (dictate via Wispr Flow)
1. “Read PRD and AGENTS. Implement Phase 0 and Phase 1 only; run both servers and verify the health endpoint.”
2. “Implement Phase 2 with schema validation and real Gemini structured JSON. Prove it works by running tests and a real sample request.”
3. “Implement Phase 3 using React Flow and Dagre. Do not mock the successful API response.”
4. “Implement Phase 4 and prove that expanding a node preserves the original graph.”
5. “Finish Phase 5, then run all Phase 6 checks. Report actual outcomes and update checked boxes.”
