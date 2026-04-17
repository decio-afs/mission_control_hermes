<!-- AGENTS.md — Mission Control -->
# Mission Control — Agent Documentation

> **Mission Control** (`ghost-ui`) is a cyberpunk-themed operations dashboard for managing AI agents, monitoring systems, and coordinating distributed tasks. The aesthetic is retro-futuristic with 8-bit pixel art influences.

---

## Project Overview

Mission Control is a React-based single-page application (SPA) that serves as the central command interface for the "Ghost Legion" AI agent system. It provides real-time visualization of agent networks, task management, project tracking, intelligence gathering, and content creation workflows.

### Key Features

| Module | Route | Description |
|--------|-------|-------------|
| **Ghost Network** | `/network` | Visualizes AI agents in a cyberpunk-themed room with animated pixel-art sprites. Shows real-time agent status and workload. |
| **War Room** | `/war-room` | System monitoring dashboard with CPU/RAM gauges, latency charts, and token usage tracking. |
| **Operations Center** | `/operations` | Task queue management, project tracking, and calendar scheduling with Celery Beat integration. |
| **Intelligence Deck** | `/intelligence` | Trend analysis across social platforms (Twitter, Reddit, TikTok) with viability scoring. |
| **Content Factory** | `/factory` | Automated content ideation engine that generates hooks based on trending topics. |
| **Briefing Terminal** | `/briefing` | Daily intelligence briefings with generated reports and asset pipelines. |
| **Workflow Builder** | `/builder` | Visual workflow construction using React Flow. |
| **Archives** | `/archives` | Historical data browser. |
| **Social Publishing** | `/broadcast` | Broadcast interface for content distribution (labeled "Broadcast Uplink" in the nav). |

---

## Technology Stack

### Core Framework
- **React 19.2.4** — UI framework (rendered in `StrictMode`)
- **TypeScript ~5.9.3** — Type safety with strict mode enabled
- **Vite 8.0.1** — Build tool and dev server (port `3001`)

### Styling & UI
- **Tailwind CSS 4.2.2** — Utility-first CSS via `@tailwindcss/vite` plugin
- **Lucide React 1.7.0** — Icon library
- **Recharts 3.8.1** — Data visualization for War Room metrics
- **React Big Calendar 1.19.4** — Calendar component for Operations Center
- **clsx + tailwind-merge** — Conditional class merging (`cn` utility)

### State Management
- **Zustand 5.0.12** — Lightweight state management for stores
- **React Router DOM 7.14.0** — Client-side routing (`BrowserRouter`)

### Real-time Communication
- **Socket.io Client 4.8.3** — WebSocket connections for live updates
- **Axios 1.14.0** — HTTP client for REST API calls

### Data & Visualization
- **pathfinding 0.4.18** — A* grid pathfinding for Ghost Network agent movement
- **react-force-graph-2d 1.29.1** — 2D force-directed graph (used in Ghost Network topology view)
- **date-fns 4.1.0** — Date formatting utilities

### Build Tooling
- **@vitejs/plugin-react 6.0.1** — Vite React plugin
- **@tailwindcss/vite 4.2.2** — Tailwind v4 Vite integration
- **autoprefixer 10.4.27 + postcss 8.5.8** — CSS post-processing

### External Integrations
- **Notion API** — Primary data persistence layer (accessed via Vite dev proxy)
- **OpenClaw Instance** — This Mission Control deployment runs as an OpenClaw-managed instance. The backend is the OpenClaw Gateway (FastAPI) at `openclaw.daagencyllc.com`, which handles agent spawning, subagent monitoring, and token auth. Understanding OpenClaw's config and limitations is essential when modifying integration logic.
- **OpenClaw Webhook** — SaaS integration for triggering actions

---

## Project Structure

```
src/
├── components/              # Shared UI components
│   ├── Layout.tsx           # Main app shell with sidebar navigation + `cn()` utility
│   └── RetroTerminalPopup.tsx # Modal popup for agent details (CRT terminal aesthetic)
├── hooks/                   # Custom React hooks (currently empty)
├── lib/                     # Utility modules and API clients
│   ├── api.ts               # REST API client (VPS backend via Axios)
│   ├── notion.ts            # Notion API client with response parser utilities
│   └── socket.ts            # Socket.io service singleton
├── pages/                   # Route-level page components
│   ├── GhostNetwork.tsx     # Agent visualization main component (~1,186 lines)
│   ├── GhostNetwork/        # Sub-modules extracted from GhostNetwork
│   │   ├── index.ts         # Barrel export
│   │   ├── types.ts         # Agent state, position, and activity types
│   │   ├── constants.ts     # Room geometry, furniture, mock agents
│   │   ├── AgentBehavior.ts # Activity spots, speeds, collision boxes
│   │   ├── pathfinder.ts    # A* pathfinding wrapper around `pathfinding` library
│   │   ├── RoomScene.tsx    # SVG room background and furniture
│   │   ├── RoomBackLayer.tsx
│   │   ├── CharacterSprites.tsx
│   │   ├── SimplePixelAgent.tsx
│   │   └── UnifiedLayer.tsx
│   ├── WarRoom.tsx          # System monitoring dashboard
│   ├── OperationsCenter.tsx # Task/project/calendar management
│   ├── IntelligenceDeck.tsx # Trend analysis
│   ├── ContentFactory.tsx   # Content generation
│   ├── BriefingTerminal.tsx # Daily briefings
│   ├── WorkflowBuilder.tsx  # Flow diagram editor (React Flow / @xyflow/react)
│   ├── Archives.tsx         # Historical data browser
│   └── SocialPublishing.tsx # Broadcast interface
├── stores/                  # Zustand state stores
│   ├── useGhostStore.ts     # Agent/node topology + edges
│   ├── useProjectStore.ts   # Project management
│   ├── useTaskStore.ts      # Task queue + summary
│   ├── useTrendStore.ts     # Trend intelligence
│   └── useSystemStore.ts    # System vitals (RAM/CPU/latency)
├── App.tsx                  # Root component with route definitions
├── main.tsx                 # Application entry point (StrictMode)
├── index.css                # Global styles with Tailwind v4 @theme
└── App.css                  # Component-scoped styles
```

---

## Build Commands

```bash
# Development server (runs on port 3001, binds to all interfaces)
npm run dev

# Production build with TypeScript check
tsc -b && vite build

# ESLint check
npm run lint

# Preview production build
npm run preview
```

---

## Code Style Guidelines

### TypeScript Configuration
TypeScript uses project references (`tsconfig.json` delegates to `tsconfig.app.json` and `tsconfig.node.json`).

- **Target:** `ES2023` with `moduleResolution: bundler`
- **JSX:** `react-jsx` transform
- **Strict mode enabled** — All strict TypeScript checks are active
- **`noUnusedLocals`** and **`noUnusedParameters`** — Clean code enforcement
- **`noFallthroughCasesInSwitch`** — Switch statements must be exhaustive
- **`noUncheckedSideEffectImports`** — Side-effect imports must resolve
- **`erasableSyntaxOnly`** — Only TypeScript syntax that can be erased (no `enum`, `namespace`, parameter properties, etc.)
- **`verbatimModuleSyntax`** — Enforces `type` imports where appropriate
- **`allowImportingTsExtensions`** — Allows `.ts` extensions in imports
- **No emit** — TypeScript is used for type-checking only; Vite handles transpilation

### ESLint Configuration
The project uses the **flat config** format (`eslint.config.js`):

- **Base:** `@eslint/js` recommended
- **TypeScript:** `typescript-eslint` recommended (not strict type-checked)
- **React:** `eslint-plugin-react-hooks` recommended + `eslint-plugin-react-refresh` Vite preset
- **Ignored paths:** `dist/`
- **Linted files:** `**/*.{ts,tsx}`

### Naming Conventions
- React components: `PascalCase` (e.g., `GhostNetwork.tsx`)
- Stores: `camelCase` with `use` prefix (e.g., `useGhostStore.ts`)
- Utilities: `camelCase` (e.g., `utils.getTitle()`)
- Types/Interfaces: `PascalCase` (e.g., `GhostNode`, `AgentState`)

### Component Guidelines
- **Use function declarations** for React components (`function ComponentName() {}`)
- **Props interfaces** should be defined inline or in the same file
- **Export default** for page components
- **Keep components focused** — GhostNetwork has been partially refactored into `pages/GhostNetwork/` sub-modules; continue this pattern for other large pages
- Shared class merging utility is located in `src/components/Layout.tsx`:
  ```ts
  export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
  }
  ```

### State Management Pattern
All stores follow this Zustand pattern:
```typescript
interface StoreState {
  data: DataType[];
  isLoading: boolean;
  fetchData: () => Promise<void>;
  addItem: (item: DataType) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  // initial state
  // actions
}));
```

Socket listeners are typically registered at the bottom of store files:
```typescript
const socket = socketService.getSocket();
if (socket) {
  socket.on('event_name', (data) => {
    useStore.getState().someAction(data);
  });
}
```

---

## Environment Variables

Create `.env.local` with these variables:

```bash
# VPS Backend
VITE_VPS_API_URL=https://openclaw.daagencyllc.com:8000
VITE_VPS_WS_URL=wss://openclaw.daagencyllc.com:8000/ws
VITE_API_KEY=your-api-key

# Notion Integration
VITE_NOTION_TOKEN=ntn_your-token
VITE_NOTION_DB_AGENTS=database-id
VITE_NOTION_DB_TASKS=database-id
VITE_NOTION_DB_PROJECTS=database-id
VITE_NOTION_DB_INTELLIGENCE=database-id

# Webhook
VITE_OPENCLAW_WEBHOOK=https://openclaw.daagencyllc.com/webhook
```

**Important:** `.env.local` is gitignored. Never commit secrets.

---

## Design System

### Color Palette (Tailwind v4 @theme)
```css
--color-brand-start: #f64e6e    /* Primary pink/red */
--color-brand-end: #ff795e      /* Gradient end */
--color-bg-deep: #050505        /* Main background */
--color-bg-card: #0A0A0A        /* Card surfaces */
--color-text-primary: #FFFFFF   /* Headings */
--color-text-secondary: #b8b8b8 /* Body text */
--color-text-tertiary: #545454  /* Muted text */
--color-text-placeholder: #363636
--color-border-subtle: rgba(255, 255, 255, 0.1)  /* Borders */
--color-border-hover: rgba(255, 255, 255, 0.3)
```

### Accent Colors
- Neon Green: `#00ff41` — Success, active states, terminal accents
- Amber: `#f59e0b` — Warnings, pending states
- Indigo: `#6366f1` — Information
- Sky Blue: `#38bdf8` — Secondary actions
- Emerald: `#10b981` — Success indicators

### Typography
- **Font Family**: Inter (system-ui fallback)
- **Monospace**: Used for data, timestamps, terminal UIs
- **Uppercase**: Used for labels, headers with `tracking-wider` or `tracking-widest`

### Common Tailwind Patterns
```
# Cards
bg-bg-card border border-border-subtle rounded-2xl

# Buttons (Primary)
bg-gradient-to-r from-[#f64e6e] to-[#ff795e] rounded-full uppercase text-xs tracking-wider

# Status Badges
text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full border
```

---

## Testing Strategy

### Current Status
- **Zero test files** — There are absolutely no `.test.*`, `.spec.*`, or `__tests__/` files in `src/` or anywhere else in the repository.
- Testing infrastructure is listed as a priority in `ENHANCEMENT_GOALS.md`.

### Planned Testing Approach
1. **Unit tests** for `src/lib/` utilities (e.g., `notion.ts` parsers, `AgentBehavior.ts` pathfinding)
2. **Component tests** for UI components (e.g., `RetroTerminalPopup`, `Layout`)
3. **Integration tests** for Zustand stores
4. **Performance tests** for GhostNetwork `requestAnimationFrame` animations

### Coverage Goals (from ENHANCEMENT_GOALS.md)
- Utilities: 80%+
- Components: 60%+
- Stores: 70%+

---

## Security Considerations

1. **API Keys** — Stored in `.env.local`, never commit to git
2. **Notion Token** — Has access to specific databases only
3. **CORS** — Notion API calls go through the Vite dev proxy (`/notion-api`) to avoid CORS issues
4. **No sensitive data** in `localStorage` or `sessionStorage`
5. **Vite proxy headers** — `Notion-Version: 2022-06-28` is injected automatically in `vite.config.ts`

---

## Deployment

### Vercel Configuration
- SPA routing configured in `vercel.json`
- All routes rewrite to `index.html`
- Static build output in `dist/` directory
- **No containerization** — There is no Dockerfile or docker-compose in the project

### Pre-deployment Checklist
1. Verify all environment variables are set in Vercel
2. Run `npm run build` locally to check for TypeScript errors
3. Run `npm run lint` to check for style issues
4. Test on mobile viewport (responsive design)

---

## CI/CD & Automated Enhancement System

The project includes two GitHub Actions workflows in `.github/workflows/`:

### 1. `auto-enhance.yml`
- **Trigger:** Every 3 hours (`cron: '0 */3 * * *'`) + manual (`workflow_dispatch`)
- **Job 1 (`analyze-and-enhance`):**
  - Runs code analysis (counts TS/CSS files, runs lint and type checks)
  - Determines focus area based on current UTC hour modulo 5:
    - `0` → Code Quality | `1` → Performance | `2` → UI/UX | `3` → Testing | `4` → Documentation
  - Creates a GitHub issue with label `auto-enhance`
  - Attempts to assign `github-copilot`
- **Job 2 (`create-enhancement-pr`):**
  - Runs only every 3rd workflow run (or on manual trigger)
  - Runs `npm run lint -- --fix` and `prettier --write "src/**/*.{ts,tsx,css}"`
  - Opens an automated PR from branch `auto/enhance-<run_number>`

### 2. `schedule-kimi-enhancement.yml`
- **Trigger:** Every 3 hours (`cron: '0 */3 * * *'`) + manual (`workflow_dispatch`)
- **Job (`create-enhancement-task`):**
  - Same hour-modulo-5 rotation as above
  - **Skips creation** if any open issue with label `kimi-enhancement` already exists
  - Creates a detailed enhancement issue with per-focus instructions and the CLI command:
    ```
    kimi -p "Enhance Mission Control ${focus} based on ENHANCEMENT_GOALS.md"
    ```

### Enhancement Rotation
| Time (UTC) | Focus Area |
|------------|------------|
| 00:00 | Code Quality |
| 03:00 | Performance |
| 06:00 | UI/UX |
| 09:00 | Testing |
| 12:00 | Documentation |
| 15:00 | Code Quality |
| 18:00 | Performance |
| 21:00 | UI/UX |

See `ENHANCEMENT_GOALS.md` for detailed enhancement targets and quick wins.

---

## Key Implementation Details

### Ghost Network Visualization
- **The Director:** The main agent overseeing the Ghost Legion is **Kate** (visualized as the core node in the network topology).
- Uses SVG with custom pixel-art sprites for agents
- Agents have states: `idle`, `walking`, `wandering`, `sitting`, `working`, `recharging`, `plugged`, `waiting`
- Animation loop uses `requestAnimationFrame` inside `GhostNetwork.tsx`
- Agents move between zones: lounge, coffee, recharge, desk, mainframe
- Z-sorting is performed dynamically so agents render behind or in front of furniture based on their Y position
- Pathfinding uses an A* grid (`pathfinder.ts`) built on the `pathfinding` library with `COLLISION_BOXES` from `AgentBehavior.ts`
- Furniture assignment queues (pods: 6, chairs: 5, stools: 4, sofas: 5) prevent over-crowding
- Waiting queues with fallback positions when furniture is full
- Stuck detection samples position every 45 frames and forces waypoint re-routing if stuck for >120 frames
- Core agents always stay `plugged` at mainframe
- Active (`notionStatus === 'active'`) agents run to mainframe; idle agents cycle through activities

### Notion Data Sync
- Stores attempt to fetch from Notion first
- Fall back to local API if Notion is unavailable
- Mock data as last resort
- Optimistic updates for better UX (tasks/projects are added to local state immediately, then synced)

### Socket.io Real-time Updates
```typescript
// In stores, listen for events:
const socket = socketService.getSocket();
if (socket) {
  socket.on('telemetry', (data) => {
    useSystemStore.getState().updateVitals(data);
  });
}
```
- Connection config: `transports: ['websocket']`, `path: '/socket.io/'`, `reconnectionAttempts: Infinity`
- Authenticates with `auth: { token: API_KEY }`

### Data Fallback Pattern
All stores follow a three-tier fallback:
1. **Notion** (if `VITE_NOTION_DB_*` is configured)
2. **Local VPS API** (`/api/*` endpoints)
3. **Mock data** embedded in the store file

---

## Common Tasks

### Adding a New Page
1. Create component in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Add navigation item in `src/components/Layout.tsx`
4. Create store in `src/stores/useNewStore.ts` if needed

### Adding a New Store
1. Create file following existing store pattern
2. Define interface with `State` suffix (or `Store` suffix)
3. Use `create<StoreState>()` with `set`/`get`
4. Export hook with `use` prefix
5. Add Socket.io listeners at bottom of file if needed

### Integrating with Notion
1. Get database ID from Notion
2. Add to `.env.local`
3. Use `notion.post(\`/databases/\${id}/query\`)` for reads
4. Use `notion.post('/pages', { parent, properties })` for writes
5. Use utility functions from `notion.ts` to parse responses:
   - `utils.getTitle(property)`
   - `utils.getText(property)`
   - `utils.getSelect(property)`
   - `utils.getNumber(property)`
   - `utils.getDate(property)`

### Refactoring GhostNetwork
If adding features to the agent visualization:
- Put pure logic (pathfinding, activity scheduling, collision) in `AgentBehavior.ts` or `pathfinder.ts`
- Put SVG primitives in `RoomScene.tsx` or `CharacterSprites.tsx`
- Keep React state and `requestAnimationFrame` loop in `GhostNetwork.tsx`
- Add new types to `GhostNetwork/types.ts`

---

## Resources

- **Vite Docs**: https://vitejs.dev/
- **Tailwind CSS v4**: https://tailwindcss.com/docs/v4-beta
- **Zustand**: https://github.com/pmndrs/zustand
- **Notion API**: https://developers.notion.com/
- **React Router**: https://reactrouter.com/
- **React Flow / @xyflow/react**: https://reactflow.dev/
