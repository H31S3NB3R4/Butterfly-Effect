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
- [x] Parse and validate structured model response, retry only for a narrow recoverable formatting error.
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
- [ ] Test all three PRD sample scenarios using real AI responses.
- [ ] Test blank and too-long scenario input.
- [ ] Test missing key, network failure, timeout, model rate-limit.
- [ ] Test invalid JSON, orphan edges, duplicate IDs, and excessive node counts.
- [ ] Run lint, typecheck, tests, build and resolve failures.
- [ ] Review browser bundle and Git staging for secrets.
- [ ] Update README with exact setup commands and known limitations.
- [ ] Record the required *real* Wispr Flow building process and final demo.
- [ ] Check challenge's official current submission instructions and required referral/account details.
- [ ] Push to GitHub; optionally deploy if time allows.

**Gate:** End-to-end demo works reliably; required evidence is ready.

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
