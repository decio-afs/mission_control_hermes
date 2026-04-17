# Ghost Network Visual Update - Cyberpunk Hacker Den

## Overview
Complete visual redesign of the Ghost Network tab with an 8-bit cyberpunk aesthetic featuring a detailed hacker den/office environment where agents roam, work, and plug into the mainframe.

---

## File Modified
- `src/pages/GhostNetwork.tsx` - Complete rewrite with new visual components

---

## New Features

### 1. Room Layout (1000x600 SVG Canvas)
The room is divided into 5 distinct zones plus a cityscape window view:

| Zone | Position | Description |
|------|----------|-------------|
| **LOUNGE** | x:20, y:280 | Relaxation area with couches and neon signs |
| **CAFÉ** | x:240, y:280 | Coffee bar with machines and menu |
| **RECHARGE BAY** | x:460, y:280 | Cylindrical pods for agent recharging |
| **WORKSTATIONS** | x:680, y:280 | 5 desks with CRT monitors |
| **MAINFRAME** | x:750, y:50 | Server racks with Matrix code display |
| **WINDOW** | x:200, y:20 | Cityscape view with night sky |

---

### 2. Visual Elements

#### Neon Signs with Glow Effects
- **"CHILL"** - Pink (#ec4899) neon sign in lounge
- **"CAFÉ"** - Amber (#f59e0b) neon sign above coffee bar
- **"RECHARGE BAY"** - Green (#00ff41) neon sign
- **"MAINFRAME"** - Green (#00ff41) neon sign

All signs feature:
- SVG filter glow effects
- Pulsing opacity animations
- Retro rectangular borders

#### Cityscape Window View
- Night sky gradient (dark blue to purple)
- Distant buildings with lit windows
- Animated neon signs visible through window
- Window grid lines for realism

#### Lounge Area Details
- Purple couches with pillows
- String lights with twinkling animation
- Coffee table with mug
- "HACKER WANTED" poster
- Floor lamp with warm glow effect

#### Café Area Details
- Wooden counter with espresso machines
- Steam animation rising from machines
- Menu board (COFFEE, TEA, ENERGY)
- Bar stools

#### Recharge Bay Details
- 3 cylindrical glass pods
- Animated lightning bolt symbols
- Status indicator lights (green pulse when active)
- Connected cables on floor

#### Workstations Details
- 5 desks arranged in grid
- CRT monitors with different colored glows:
  - Green (#00ff41)
  - Amber (#f59e0b)
  - Blue (#3b82f6)
  - Pink (#ec4899)
- Flickering screen effects
- Office chairs
- Code lines displayed on screens

#### Mainframe Details
- 2 towering server racks
- 32+ blinking LED lights per rack
- Randomized blink patterns for realism
- Matrix code rain display
- "SYSTEM ACTIVE" status text
- Green phosphor glow gradient
- Digital rain effect with Japanese characters

#### Atmospheric Details
- Floor cables running between zones
- Floor grid pattern
- Wall and floor gradients
- Zone labels at bottom of screen
- Status indicators ("MAINFRAME ONLINE", "X ACTIVE")

---

### 3. Agent Visuals

#### Pixel Art Sprites
Agents are rendered as 8-bit style characters with:

**Body Parts:**
- Head (colored rectangle with rounded corners)
- Eyes (white squares, directional based on facing)
- Body (colored rectangle)
- Arms (colored rectangles)
- Legs (colored rectangles)

**Colors by Type:**
- **Core** (Kate): #f64e6e (coral/pink)
- **Squad**: #38bdf8 (light blue)
- **Sonnet model**: #a855f7 (purple)
- **Haiku model**: #10b981 (emerald)
- **Default**: #64748b (gray)
- **Offline**: #4b5563 (dark gray)

#### Agent Poses
Three different sprite configurations:

1. **Standing/Walking**
   - Full body visible
   - Walking bounce animation
   - Directional facing (left/right)

2. **Sitting/Working**
   - Chair back visible
   - Agent positioned lower
   - Arms positioned for typing
   - Working indicator light above head

3. **Recharging (In Pod)**
   - Simplified vertical sprite
   - Lightning bolt overlay
   - Energy glow effect

#### Status Indicators
- **Active agents**: Green glow ring with pulse animation
- **Selected agent**: Rotating coral ring
- **Offline agents**: Grayed out colors
- **State label**: Text below agent (IDLE, WALKING, SITTING, WORKING, RECHARGING, PLUGGED)

---

### 4. Agent Behavior

#### State Machine
Agents cycle through states with timers:

| State | Description | Visual |
|-------|-------------|--------|
| **idle** | Standing still | Standing pose |
| **walking** | Moving to target | Standing pose + bounce |
| **sitting** | Resting on couch/chair | Sitting pose |
| **working** | At workstation | Sitting pose + activity light |
| **recharging** | In pod | Pod pose |
| **plugged** | Connected to mainframe | Standing pose near mainframe |

#### Movement Logic
- Idle agents randomly change state after ~180 frames
- Active agents automatically walk to mainframe plugs
- Agents avoid mainframe area unless active
- Smooth interpolation movement
- Directional facing based on movement vector

#### Cable Connections
When agents are "plugged" into the mainframe:
- Green cable line from agent to plug port
- Animated data packets flowing along cable
- Agent positioned near plug port

---

### 5. Interactive Elements

#### Clickable Agents
- Click any agent to open retro terminal popup
- Cursor changes to pointer on hover
- Selection ring appears around selected agent

#### Retro Terminal Popup
Matrix-style terminal with:
- CRT scanline effect overlay
- ASCII art header
- Green phosphor text (#00ff41)
- Blinking cursor
- Agent details:
  - Name (colored by type)
  - Type and model
  - Status (colored by state)
  - Last active time
  - Active tasks count
  - Queue depth
  - Progress bar
- Action buttons: [EXECUTE_TASK], [TERMINATE]
- Close button [X]

---

## Technical Implementation

### SVG Structure
```
<svg>
  <defs> (gradients, patterns, filters)
  <RoomBackground> (all static room elements)
  <g> (cables for plugged agents)
  <PixelAgent> (each agent sprite)
</svg>
```

### Animations
All animations use SVG `<animate>` and `<animateMotion>` elements:
- Neon sign pulsing
- Server light blinking
- Data packet movement
- Agent walking bounce
- Steam rising
- Screen flickering
- Status light pulsing

### State Management
- `agentPositions`: Map of agent IDs to position/state data
- `selectedNode`: Currently selected agent for popup
- `displayNodes`: Array of agents (from store or mock data)

### Mock Data
12 mock agents for testing (when Notion API unavailable):
- Kate (core, always at mainframe)
- Various runners and fixers with different states
- Mix of active, idle, and offline statuses

---

## Visual Aesthetic Summary

**Color Palette:**
- Background: Dark grays (#0f172a, #1f2937)
- Accents: Neon green (#00ff41), pink (#ec4899), amber (#f59e0b)
- Glow effects: Semi-transparent overlays
- Text: Monospace font throughout

**Style:**
- 8-bit pixel art aesthetic
- Cyberpunk/hacker den atmosphere
- Retro computer terminals
- Neon noir lighting
- Detailed environmental storytelling

---

## How to Test

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Navigate to:
   ```
   http://localhost:3001/network
   ```

3. Interactions:
   - Watch agents roam between zones
   - Click agents to open terminal popup
   - Observe active agents plugging into mainframe
   - Enjoy the cyberpunk atmosphere!

---

## Future Enhancements (Optional)

- [ ] Add sound effects (keyboard typing, server hum)
- [ ] More agent poses and animations
- [ ] Weather effects in window (rain, snow)
- [ ] Interactive furniture (clickable coffee machine)
- [ ] Agent chat bubbles
- [ ] Day/night cycle in window
- [ ] More detailed pixel art sprites
