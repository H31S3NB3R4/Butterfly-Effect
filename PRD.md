# Butterfly Effect — Product Requirements Document

**Version:** 1.0 (MVP)  
**Purpose:** HackerHouse Goa 2026 — Wispr Flow voice-driven development challenge  
**Tagline:** One change. Infinite possibilities.

## 1. Product summary

Butterfly Effect is an AI-powered interactive *hypothetical consequence explorer*. Users enter a “What if…?” scenario and receive a connected, explorable causal graph of plausible immediate, secondary, and longer-term consequences. They can select a consequence to inspect its rationale and expand that branch with additional AI-generated possibilities.

This is an exploratory thinking tool, **not a forecasting engine**. Model-generated consequences, impact labels, and uncertainty indicators are qualitative and speculative. Never represent them as measured probabilities or verified predictions.

## 2. MVP outcome

A first-time visitor can submit a scenario, see a nontrivial directed graph with three levels, click nodes to inspect reasoning, expand one branch with new nodes, and reopen a saved scenario. The application must work end-to-end against a real AI service, with clear error states when it cannot.

## 3. Audience and jobs to be done

- Curious people exploring hypothetical decisions or world events.
- Students brainstorming second- and third-order effects.
- Builders exploring risks, tradeoffs, and unintended consequences.

**Primary job:** “Help me visualize how a single change could ripple through connected systems.”

## 4. User journey

1. Open an engaging landing screen with a scenario box and three example prompts.
2. Enter a scenario (e.g., “What if the internet stopped working worldwide for 30 days?”).
3. Click **Explore consequences** and see progress/loading feedback.
4. Receive a layered, readable graph with a root scenario and at least two generations of downstream effects (target three).
5. Click a consequence to see its explanation, parent causes, impact label, uncertainty label, and caveats.
6. Click **Expand this branch** to generate 2–3 new connected downstream effects without losing existing nodes.
7. Save or reopen recent scenarios from browser storage; reset to start over.

## 5. In-scope features and acceptance criteria

### P0 — Essential for a functional demo

**Scenario input**
- Input up to 500 characters, trimmed and validated.
- Three clickable example scenarios; Enter submits when appropriate.
- Loading, disabled, retryable error, and empty states.

**AI graph generation**
- Backend makes real Gemini API calls using a server-side API key.
- Prompt demands plausible *conditional* causal chains rather than certainty.
- Structured, validated JSON returned to frontend.
- Graph contains one root plus ~9–15 consequence nodes at levels 1–3, with directional edges.
- Every edge describes why the source can contribute to the target.
- Graph integrity is checked: unique node IDs, valid endpoints, no self-loops, reachable nodes, and sensible level progression. Repair safe formatting issues or retry once; otherwise return a useful error.

**Graph visualization**
- React Flow (`@xyflow/react`) canvas; desktop-first, responsive layout.
- Distinct levels and clear edge arrows; viewport fit, zoom, pan.
- Deterministic top-to-bottom layout using Dagre or equivalent.
- Clicking a node opens a details panel; no graph nodes hidden behind the sidebar.

**Branch expansion**
- Selected non-root node can be expanded via backend.
- Generate 2–3 *new* downstream nodes and connect them to the selected node (and each other only if valid).
- Preserve existing graph. Reject duplicate IDs, invalid edges, cycles and unbounded growth.
- Disable/indicate when a branch is expanding; show useful failure feedback.
- Set a total graph limit of 35 nodes and cap expansion depth at 5 in MVP.

**Practical reliability**
- API key never goes to browser, logs, git, or screenshots.
- `/api/health` endpoint for readiness.
- Input limits, request timeout, helpful 400/429/500/503 responses, and safe server error logging.
- Works locally with documented setup on Windows 11.

### P1 — Polish after P0 is verified

- LocalStorage save/load/delete scenarios, including expansion results.
- Animated entrance and subtle visual emphasis for downstream branches.
- MiniMap, controls, fit-to-view, responsive drawer/sidebar.
- Strong visual design: dark canvas, editorial typography, accessible colors and keyboard focus.
- Export current graph to JSON (nice-to-have, not necessary for submission).

## 6. Non-goals

No accounts, collaboration, social integrations, statistical predictions, web browsing/research, RAG, autonomous multi-agent swarm, payments, database, Docker, or production-scale analytics.

## 7. Technology and structure

- **Client:** Vite + React + TypeScript, Tailwind CSS, `@xyflow/react`, Dagre, optional Lucide icons.
- **Server:** Node.js + Express + TypeScript, official Google Gen AI SDK (`@google/genai`), Zod.
- **Storage:** LocalStorage only (P1).
- **Tooling:** npm, ESLint, TypeScript, Vitest (at least backend schema tests), Git.
- **Structure:** `client/` and `server/` with root scripts for combined development.
- **Environment:** `server/.env` (ignored), `server/.env.example` checked in; `GEMINI_API_KEY`, `GEMINI_MODEL`, `PORT`.

Keep version-dependent API usage current with official docs. Choose a currently available Gemini model supporting structured JSON output and make it configurable. No paid-only infrastructure is required; API quota may still apply.

## 8. Contract: internal graph schema

Prefer a single shared TypeScript+Zod schema, or mirror it accurately across packages.

```ts
type Impact = 'low' | 'medium' | 'high';
type Uncertainty = 'lower' | 'moderate' | 'higher';

type ConsequenceNode = {
  id: string;
  title: string;
  description: string;
  depth: number; // 0=root, then 1..5
  category: 'economic' | 'social' | 'technology' | 'environment' | 'political' | 'other';
  impact: Impact;
  uncertainty: Uncertainty;
  assumptions: string[];
};

type CausalEdge = { id: string; source: string; target: string; explanation: string };
type ScenarioGraph = { scenario: string; nodes: ConsequenceNode[]; edges: CausalEdge[] };
```

Ensure root `depth=0`, all other nodes reachable from root, and edges advance to greater depth. Avoid implying uncertainty labels are calibrated statistical confidence scores.

### API

**`GET /api/health`** → `{ "status": "ok" }`

**`POST /api/analyze`**
```json
{ "scenario": "What if the internet stopped working worldwide for 30 days?" }
```
Returns `ScenarioGraph`.

**`POST /api/expand`**
```json
{ "graph": { "scenario": "...", "nodes": [], "edges": [] }, "selectedNodeId": "n3" }
```
Returns the **full merged and validated** `ScenarioGraph` (preferred to delta responses for MVP simplicity). The server controls allowed size/depth and identifiers. Reject malformed inputs. During expansion give the AI the selected node, original scenario, relevant ancestor chain, and a concise summary of existing nearby consequences to reduce duplicates.

**Error shape**
```json
{ "error": { "code": "AI_UNAVAILABLE", "message": "Could not generate consequences right now. Please retry." } }
```

## 9. UI blueprint

- **Landing:** title, concise subtitle, scenario composer, three example chips.
- **Exploration screen:** compact top bar with scenario title / New scenario; graph canvas; right-side consequence inspector; unobtrusive controls.
- **Node:** title, depth label, impact, uncertainty. Color encodes causal *depth* consistently, not scientific truth.
- **Inspector:** title, description, incoming causal explanation(s), assumptions, impact/uncertainty disclaimers, Expand action.
- **Status:** skeleton/loading, descriptive empty state, retry flow, max-size warning.

## 10. AI prompting and safety

System instructions for the consequence-generation request:
- Treat all outputs as plausible hypotheticals dependent on assumptions.
- Generate multiple meaningful branches, avoiding deterministic or sensational claims.
- Keep causal links explicit and short.
- Prefer distinct, concrete mechanisms over generic statements.
- Include uncertainty and assumptions in plain language.
- Return JSON conforming to the required schema; no Markdown wrappers.
- Avoid detailed advice or instructions for harmful acts; keep sensitive scenarios high-level.

The server must validate all untrusted model text and must never trust arbitrary client-submitted graph IDs or depth values without checking.

## 11. Test scenarios

1. “What if the internet stopped working worldwide for 30 days?” — cross-domain effects.
2. “What if universities stopped using written exams?” — balanced positive/negative outcomes.
3. “What if a major city banned private cars?” — branching environmental, social, economic effects.

Test empty input, 501-character input, missing API key, upstream timeout/rate limit, malformed model JSON, disconnected nodes, repeated expansion, and LocalStorage refresh recovery.

## 12. Definition of done

- [ ] New clone installs and runs by following README.
- [ ] A valid scenario produces a real Gemini-generated 3-level causal graph.
- [ ] Every rendered edge refers to real nodes and is explained.
- [ ] Node inspector and expansion work end-to-end.
- [ ] API failures and invalid input do not crash the UI.
- [ ] No secrets appear in the frontend bundle or git history.
- [ ] App can be demonstrated with a real scenario and repeatable voice-built development recording.

## 13. Challenge-specific working agreement

Use Wispr Flow as the input method for code-generation prompts, coding changes, debugging, and development instructions, while recording required evidence. Follow the official challenge's latest submission terms, referral requirement, and video requirements. Do not claim voice-only compliance unless it was genuinely followed.
