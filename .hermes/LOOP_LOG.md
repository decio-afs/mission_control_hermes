# Mission Control — Autonomous Evolution Loop Log

This file is the **handoff document** for the `mission-control-evolve` scheduled task,
which runs every 3 hours. Each run MUST:

1. **Read this file top to bottom** before doing anything else.
2. **Execute the "Next Steps / TODO" items** listed below (consolidation, UI fixes, the next feature).
3. **Append a new dated entry** to the "Run History" section describing exactly what it did.
4. **Rewrite the "Next Steps / TODO" section** with what the *next* run should tackle
   (remaining consolidation, new UI issues found, and the next feature to build).
5. Commit this file alongside the code changes.

**Rules:** Never repeat a feature already listed under Run History. Verify `npm run build`
and `npm run lint` pass before committing. Work on an `auto/evolve-*` branch, commit locally,
do not push/PR. Keep LIVE Hermes-backed functionality intact; only consolidate redundant tabs.

---

## Current State (13 tabs after the 2026-06-09 consolidation)

Nav lives in **`src/lib/nav.ts`** (`MODULES`) — single source consumed by both
`Layout.tsx` (sidebar) and `CommandPalette.tsx`. To add/remove/reorder a tab, edit `nav.ts`.

| # | Path | Page | Data | Notes |
|---|------|------|------|-------|
| 00 | `/command`     | Hermes Command (Cyberpunk) | LIVE | Primary ops console: agents, tasks, cron, spawn/dispatch. |
| 01 | `/network`     | Ghost Network              | LIVE | Sprite-room agent topology (unique viz). |
| 02 | `/agent-hub`   | Agent Hub                  | LIVE | Agent CRUD registry + agent-activity tab + spawn-on-task. |
| 03 | `/war-room`    | War Room                   | LIVE | Metrics gauges + task-status + agent-load + **TASKS/SIGNAL feed toggle** (Signal Intel merged in). |
| 04 | `/operations`  | Operations Center          | LIVE | Kanban CRUD + cron run + task decompose. |
| 05 | `/chat`        | Ghost Comms (ChatTerminal) | LIVE | Chat round-trips to Hermes. |
| 06 | `/intelligence`| Intel Deck                 | DEMO | Static `legionData.ts` trend signal. |
| 07 | `/factory`     | Content Factory            | LIVE | `useContentStore` → `/api/content/pipeline`. |
| 08 | `/briefing`    | Briefing Terminal          | LIVE | `useBriefingStore` (briefing + sentinel digest). |
| 09 | `/builder`     | Workflow Builder           | DEMO | Static node graph. |
| 10 | `/archives`    | Archives                   | DEMO | Static mission history. |
| 11 | `/broadcast`   | Broadcast Uplink           | DEMO | Static channel stats. |
| 12 | `/leads`       | Lead Tracker               | LIVE | `useLeadStore`. |

- **Removed this run:** `Signal Intelligence` (`/signal-intelligence`) — its live
  `useActivityStore` feed was folded into War Room's bottom panel. The old route now
  redirects to `/war-room`. Page file deleted.
- **Remaining DEMO/static tabs (4):** Intel Deck, Workflow Builder, Archives, Broadcast Uplink.
  These are the lowest-value clutter for a real Hermes ops dashboard.
- **Global ⌘K / Ctrl+K command palette** mounted in `Layout.tsx` (`src/components/CommandPalette.tsx`).

---

## Redundancy Matrix (observed — for the next run's consolidation)

- **Activity/log views** — was: Signal Intel feed + Agent Hub "Activity" tab + War Room task log.
  Signal Intel folded into War Room this run. Agent Hub's "Activity" tab (agent CRUD events from
  `useGhostStore.agentActivity`) still partially overlaps War Room's SIGNAL feed (Hermes `/activity`).
- **Command vs War Room** — both surface agent roster + task summary. Command is the *action* console
  (spawn/claim/complete), War Room is the *read-only metrics* board. Distinct enough; keep separate.
- **Command vs Operations** — both expose cron + tasks. Operations is the fuller kanban CRUD; Command
  has a lighter inline cron/task widget. Candidate for a future trim of Command's cron duplication.
- **4 DEMO tabs** — Intel Deck / Workflow Builder / Archives / Broadcast Uplink have no Hermes source.
  Strongest candidate for the next consolidation: collapse into ONE "Showcase / Design Lab" tab with
  internal sub-tabs (preserves the design work without 4 separate top-level nav entries).

---

## Next Steps / TODO (the next run executes these)

### Consolidation
- [ ] Collapse the 4 static DEMO tabs (Intel Deck, Workflow Builder, Archives, Broadcast Uplink) into a
      single **"Design Lab"** tab with internal sub-tab navigation. Keep `DemoBadge`. Update `nav.ts`,
      `App.tsx` routes (redirect old paths), and the CommandPalette will pick up the new module automatically.
- [ ] Consider trimming the cron widget duplicated between Command and Operations (leave Operations as the home).

### UI / Display Fixes
- [ ] War Room top row is a 6-up grid of fixed `h-[118px]` panels — verify it doesn't clip on the
      smallest Electron window width; tighten the `lg:grid-cols-6` breakpoint if cramped.
- [ ] Audit Content Factory / Lead Tracker / Briefing for overflow + design-system consistency (not yet reviewed this loop).
- [ ] Sidebar nav now has 13 items + roster + footer; confirm it scrolls cleanly at short viewport heights.

### Next Feature (must differ from everything in Run History)
- [ ] Build a **Cron Creation UI** in Operations: add a `POST /api/hermes/cron` endpoint to `hermes-bridge.py`
      (shell `hermes cron add …`), mirror a `createHermesCron` type in `api.ts`, and a small create form.
      (Bridge currently only lists/runs cron — creating is the obvious missing CRUD verb.)
- [ ] Alternative candidates (pick ONE, not already done): live log streaming, agent drill-down panel,
      bridge health diagnostics panel, task dependency view, completed-task desktop notifications.

---

## Run History (newest first — append, never overwrite)

### 2026-06-09 — Run #1 (branch `auto/evolve-cmdk-consolidation`)

**Tab audit findings.** Enumerated all 14 tabs from `Layout.tsx`/`App.tsx`. Classified by data source
(grep for `legionData`/`DemoBadge` vs store/`api` imports): 9 LIVE (Command, Network, Agent Hub, War Room,
Operations, Chat, Signal Intel, Content Factory now live, Briefing, Lead Tracker) and 4 DEMO/static
(Intel Deck, Workflow Builder, Archives, Broadcast Uplink). Note: AGENTS.md is stale — Content Factory &
Briefing are now LIVE (wired to `useContentStore`/`useBriefingStore`), and AgentHub/ChatTerminal/
SignalIntelligence/LeadTracker exist but aren't documented there. Clearest redundancy: **three overlapping
"activity/log" views** — the standalone Signal Intelligence feed, Agent Hub's Activity tab, and War Room's
bottom task log all answer "what are the agents doing right now."

**Consolidated.** Merged **Signal Intelligence → War Room** (14 → 13 tabs). War Room's bottom panel is now
a TASKS/SIGNAL toggle: TASKS keeps the kanban activity log; SIGNAL renders the live Hermes `/api/hermes/activity`
feed via `useActivityStore` (the exact data the old tab showed — no live functionality lost). Deleted
`src/pages/SignalIntelligence.tsx`, removed its route, added a `/signal-intelligence → /war-room` redirect.
Extracted the nav list into `src/lib/nav.ts` so Layout and the new palette share one source of truth.

**UI fixes.** (1) Fixed the **frozen ZULU clock** in the topbar — it only re-rendered on the 7s data poll,
so the seconds counter jumped in ~7s steps; added a 1s `setInterval` tick (`now` state) so it updates every
second. (2) Added a clickable **⌘K hint button** in the topbar that opens the command palette.

**New feature — Command Palette (⌘K / Ctrl+K).** `src/components/CommandPalette.tsx`, mounted globally in
`Layout.tsx`. Subsequence fuzzy-search across all nav modules, quick actions, and **live Hermes entities**
(agents from `useGhostStore`, tasks from `useTaskStore` — already polled by Layout, no new bridge endpoint).
Arrow keys navigate, Enter opens, Esc/backdrop close. Selecting a module/agent/task routes to the relevant
screen. **How to access:** press Ctrl+K (or ⌘K), or click the `⌘K` chip in the top bar.

**Verify.** `npm run build` ✓ (tsc + vite, 106 modules) and `npm run lint` ✓ (0 issues) both pass.
