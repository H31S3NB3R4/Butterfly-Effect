# AGENTS.md — Instructions for Coding Agents

You are working on **Butterfly Effect**, a voice-built AI-powered hypothetical consequence explorer for HackerHouse Goa 2026.

## Mission

Ship a **functional, demonstrable MVP**, not a UI-only prototype. The highest priority path is: text scenario → Express backend → real Gemini structured output → validated causal graph → React Flow visualization → AI-powered branch expansion.

## Read first

1. `PRD.md` — authoritative requirements and API/data contracts.
2. `TODO.md` — phased work order and acceptance gates.
3. `README.md` — environment and user-facing usage instructions.

If these conflict, favor user instructions first, then PRD, then TODO, then this file. Note any conflict rather than silently changing behavior.

## Scope discipline

- Work **one TODO phase at a time** unless user explicitly requests otherwise.
- Avoid speculative extras: auth, RAG, Docker, multi-agent systems, payments, complex persistence.
- Do not add dependencies when a straightforward solution already exists.
- Only check off tasks that were implemented **and verified**.
- Never claim a test passed unless you actually ran it and observed success.
- Ask only if blocked by missing credentials or a consequential decision; otherwise choose the simplest reversible implementation.

## Stack

- Frontend: Vite, React, TypeScript, Tailwind CSS, `@xyflow/react`, Dagre.
- Backend: Node.js, Express, TypeScript, `@google/genai`, Zod.
- State/persistence: React state plus LocalStorage (no database).
- Dev tooling: npm scripts, TypeScript, ESLint, Vitest.
- Follow existing code style. Prefer small, cohesive modules with clear types.

## Implementation guidance

### Backend
- Keep AI calls server-side; read `GEMINI_API_KEY` only from environment variables.
- Keep `GEMINI_MODEL` configurable; use a model that supports JSON schema structured output in the installed SDK.
- Use a schema for inputs and model outputs; validate independently on the server.
- **Graph integrity is mandatory:** unique IDs, no dangling edges, no cycles, connected graph, appropriate depths, within caps.
- Use explicit HTTP errors with stable error codes. Never send raw stack traces or keys to clients.
- Use timeouts; distinguish invalid user input, missing configuration, model quota/rate limit, and upstream failure.
- For expansion, select existing graph context, generate candidates, assign unique IDs as needed, and validate the merged graph.

### Frontend
- Separate API calls, graph transformations/layout, reusable UI components, and pages.
- Keep graph data separate from React Flow presentation coordinates.
- Use Dagre or deterministic layout. Always show direction with arrowed edges.
- Display model uncertainty as **qualitative speculation**, not a calibrated percentage.
- Make loading/error/empty states real and usable, including when no API key is configured.
- Keep the design dark, clear, visually striking, and legible at 1366×768 resolution.

### Security and privacy
- `.env` must be ignored; `.env.example` contains placeholder values only.
- Never commit secrets or hardcode credentials into frontend code, README, tests, recordings, or example responses.
- Do not log complete user requests by default.
- Treat AI output and client graph payloads as untrusted.
- Keep any scenario involving harmful behavior high-level; do not produce actionable harmful instructions.

### Engineering hygiene
- Avoid `any` without strong justification.
- Use clear function names and small modules.
- Validate frontend and backend contracts, not just TypeScript compile-time types.
- Write tests for graph validation and merge behavior.
- Run the relevant scripts after changes: lint, typecheck, tests, build.
- On failure, explain what failed and fix issues within current scope.
- Update `TODO.md` to reflect verified progress; update `README.md` if setup changes.

## Working style for the Wispr Flow challenge

The human developer uses **Wispr Flow** to dictate prompts, decisions, fixes, and changes. Agent-generated code is allowed as guided by the challenge, but do not describe this project as voice-built unless the human actually followed the rules. The developer is responsible for recording authentic evidence and checking the latest official requirements.

After each phase gate passes, commit the completed phase and push it to the configured GitHub remote. State at the end of each implementation cycle:
1. Files changed.
2. What works now.
3. Checks actually run and their results.
4. Remaining issues / next TODO items.

## Definition of done

See `PRD.md` §12. In particular, a real request must generate a valid, clickable graph, and a real expansion must preserve existing nodes. Hardcoded scenarios or pre-rendered fake results **do not count** as functional completion.
