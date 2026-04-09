PROJECT GHOST-INTERFACE: Complete Mission Control Specification

Version: 1.0

Date: 2026-04-02

Stack: React 18 + TypeScript + FastAPI + PostgreSQL + Redis + OpenClaw Gateway

1\. SYSTEM ARCHITECTURE OVERVIEW

1.1 Ghost Legion Hierarchy

The Director: Kimia (main agent, not visualized)

Tier 1 - The Fixers (Persistent): 8 agents, always online

Tier 2 - The Runners (On-Demand): 17 agents, spawn/kill per mission

Total Operatives: 25 subagents managed through this interface

1.2 Data Flow Architecture

plain

Copy

┌─────────────────────────────────────────────────────────────────┐

│                    BROWSER (Antigravity UI)                      │

│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │

│  │   React App  │ │  WebSocket   │ │      Static Assets       │ │

│  │   (Port 80)  │ │   Client     │ │    (Built by Kimia)      │ │

│  └──────┬───────┘ └──────┬───────┘ └────────────┬─────────────┘ │

└─────────┼────────────────┼──────────────────────┼───────────────┘

&#x20;         │                │                      │

&#x20;         ▼                ▼                      ▼

┌─────────────────────────────────────────────────────────────────┐

│              KIMIA'S FASTAPI BACKEND (Port 8000)                 │

│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │

│  │  REST API    │ │  WebSocket   │ │   Celery Task Queue      │ │

│  │   Routes     │ │   Server     │ │      (Redis)             │ │

│  └──────┬───────┘ └──────┬───────┘ └────────────┬─────────────┘ │

└─────────┼────────────────┼──────────────────────┼───────────────┘

&#x20;         │                │                      │

&#x20;         ▼                ▼                      ▼

┌─────────────────────────────────────────────────────────────────┐

│              OPENCLAW GATEWAY (Port 18789)                       │

│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │

│  │   Agent      │ │   Subagent   │ │      Token Auth          │ │

│  │   Spawner    │ │   Monitor    │ │    (Local Only)          │ │

│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │

└─────────────────────────────────────────────────────────────────┘

&#x20;         │

&#x20;         ▼

┌─────────────────────────────────────────────────────────────────┐

│              INFRASTRUCTURE LAYER                                │

│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │

│  │  PostgreSQL  │ │    Redis     │ │   Celery Workers         │ │

│  │  (Port 5432) │ │  (Port 6379) │ │   (Background Tasks)     │ │

│  └──────────────┘ └──────────────┘ └──────────────────────────┘ │

└─────────────────────────────────────────────────────────────────┘

2\. MODULE SPECIFICATIONS

MODULE 1: THE GHOST NETWORK (Agent Topology \& Control)

Purpose: Real-time visualization and control of all 25 subagents

1.1 Visual Components

Force Graph 2D Canvas: Full-screen topology visualization

Node Types:

Square Nodes (32px): The Fixers (persistent agents) - pulsing glow animation

Circle Nodes (24px): The Runners (ephemeral agents) - fade in/out on spawn/kill

Color Coding: Kimi (cyan #00f0ff), Claude (purple #a855f7), Gemini (green #10b981)

Status Indicators: Green halo (healthy), Yellow (warning), Red (error/crashed), Grey (completed/killed)

Edges: Bézier curves showing parent-child spawn relationships, animated data flow particles

Clustering: Auto-group by operational domain (Content Syndicate, Construct Squad, etc.)

Ghost Detail Panel (Slide-out):

Agent ID, Street Name, Model Type

Real-time metrics: RAM usage, Token consumption, Uptime

Kill Switch: Red button for Runners (sends DELETE to Gateway)

Log Stream: Last 50 lines from that specific agent

Spawn Children: Button to create sub-subagents (if applicable)

1.2 Controls

Pan/Zoom: Mouse drag to pan, scroll to zoom, reset view button

Filter Toggles: Show/hide by type (Fixers only, Runners only, by Model)

Physics Controls: Pause simulation, adjust repulsion strength

Spawn Terminal: Command palette interface (Ctrl+K) to type agent names and spawn instantly

1.3 Data Structure

TypeScript

Copy

interface GhostNode {

&#x20; id: string;                    // "word-smith-7a2f"

&#x20; name: string;                  // "Word-Smith"

&#x20; type: 'fixer' | 'runner';

&#x20; model: 'kimi-code' | 'claude-sonnet' | 'gemini-flash';

&#x20; status: 'active' | 'idle' | 'error' | 'completed' | 'killed';

&#x20; parent?: string;               // Parent agent ID

&#x20; memory: number;                // MB used

&#x20; cpu: number;                   // Percentage

&#x20; tokensConsumed: number;

&#x20; spawnTime: Date;

&#x20; eta?: number;                  // Seconds remaining (for Runners)

&#x20; mission: string;               // Current task description

}



interface GhostEdge {

&#x20; source: string;

&#x20; target: string;

&#x20; type: 'spawned' | 'delegated' | 'reports\_to';

&#x20; strength: number;              // 0.0 to 1.0

}

MODULE 2: THE WAR ROOM (System Health \& Resource Monitoring)

Purpose: Real-time infrastructure vitals with cyberpunk HUD aesthetic

2.1 Resource Gauges

RAM Gauge: Circular progress (dial)

Total: 3.8GB (3819MB)

Zones: Green (0-2GB), Yellow (2-2.5GB), Red (2.5GB+)

OOM Warning: Flashing red + alarm sound when >3GB

CPU Gauge: 3-bar display (one per vCPU)

Real-time utilization per core

Disk Usage: Horizontal bar (80GB total)

Warning at 70GB (87.5%)

Network I/O: Live tx/rx counters

2.2 Gateway Status Dashboard

Connection Status: Large LED indicator (Green/Red)

Latency Graph: Sparkline showing last 60 seconds of ping times

Request Rate: Requests/minute to Gateway

Error Rate: 4xx/5xx error percentage

Token Burn Rate: $/hour, daily budget tracker with projected cost

2.3 Ghost Legion Metrics

Active Operations Counter: "3/3 Runners Deployed" (max capacity indicator)

Queue Depth: Pending missions waiting for resources

Success Rate: Percentage of completed vs failed missions (last 24h)

Model Distribution Pie Chart: % Kimi vs Claude vs Gemini usage

2.4 Alert System

Toast Notifications:

"Word-Smith completed mission"

"WARNING: Memory at 2.6GB - Phantom-Cleaner dispatched"

"ERROR: Gateway connection lost"

Severity Levels: Info (cyan), Warning (gold), Critical (red flash + sound)

MODULE 3: OPERATIONS CENTER (Calendar \& Scheduling)

Purpose: Temporal mission control with Celery Beat integration

3.1 Visual Design

Main View: React Big Calendar (month/week/day/agenda views)

Theme: Dark mode, neon event borders, cyberpunk typography

Current Time Indicator: Red pulsing line (Gantt-style)

3.2 Event Types \& Styling

Table

Event Type	Color	Icon	Description	Trigger

Content Generation	#00f0ff (Cyan)	📝	Word-Smith deployment	Manual or Scheduled

Trend Collection	#10b981 (Green)	🔍	Chrome-Runner + Statistician	Every 15min

System Maintenance	#f59e0b (Gold)	🔧	Phantom-Cleaner, backups	Daily at 04:00

Analysis	#a855f7 (Purple)	📊	The Analyst meta-review	Every 5 missions

Deep Research	#6366f1 (Indigo)	🎓	The Professor academic scan	Weekly

Social Publishing	#ec4899 (Pink)	📢	Publisher-Dispatcher	Optimal time slots

3.3 Interactions

Click Event: Open detail modal showing:

Assigned Ghost(s)

Mission parameters (prompt, priority, memory limit)

Status (pending/active/completed)

Execute Now Button: Skip schedule, spawn immediately

Edit Button: Modify schedule (updates Celery Beat)

Drag \& Drop: Reschedule missions (updates database + Celery)

Right-Click Context Menu: Clone event, Delete, View Logs

Create Event: Modal with template selector (New Mission from Template)

3.4 Recurring Patterns

Daily Content Batch: 07:30 - 2 carousels + 2 videos

Hourly Trend Check: Every 15 minutes (XX:00, XX:15, XX:30, XX:45)

Nightly Cleanup: 04:00 - Phantom-Cleaner + Backup-Boy

Weekly Briefing: Monday 08:00 - Morningstar report generation

3.5 Integration Points

Celery Beat Scheduler: Calendar edits write to celerybeat-schedule table

Queue Preview: Shows next 5 upcoming missions with resource forecast

MODULE 4: INTELLIGENCE DECK (Trend Dashboard)

Purpose: Multi-platform trend aggregation and viability analysis

4.1 Data Sources Panel

Platform Tabs: Twitter/X, Reddit, TikTok, YouTube, News RSS

Status Indicators: Per-platform connection health (API limits, errors)

Last Updated: Timestamp + "Refresh Now" button (spawns Chrome-Runner)

4.2 Trend Table/List

Columns:

Rank (#1-50)

Topic/Hashtag (clickable for details)

Platform icon

Engagement Velocity (trending arrow ↑↓)

Viability Score (0-100, color-coded)

Sentiment (emoji 😐🙂😠)

Age (how long trending)

Filters:

Platform multi-select

Min Viability Score slider (default 60)

Sentiment filter

Keywords (primary/secondary/negative)

Time range (Last hour, 24h, 7d)

Sorting: By viability, by velocity, by recency

4.3 Viability Analyzer

Detail Panel (Side drawer):

Composite Score Breakdown:

Engagement Velocity: 30%

Sentiment: 20%

Topic Relevance: 25%

Competitive Saturation: 15%

Momentum Prediction: 10%

Raw Metrics: Likes, shares, comments, views per hour

Sample Content: Top 3 posts from this trend

Content Suggestions: "Angle ideas for this trend" (spawns The Hook)

Add to Queue: One-click add to Content Generation pipeline

4.4 Redis Hot Cache

Hot Trends Widget: Top 10 trends (15-minute TTL from Redis)

Trend History Graph: Line chart showing viability score over time

Correlation Matrix: "Trends often mentioned together"

4.5 Data Schema (for UI rendering)

TypeScript

Copy

interface Trend {

&#x20; id: string;                    // "trend\_x\_abc123"

&#x20; platform: 'twitter' | 'reddit' | 'tiktok' | 'youtube' | 'news';

&#x20; topic: string;

&#x20; hashtag?: string;

&#x20; engagementVelocity: number;    // Normalized 0-1

&#x20; sentimentScore: number;        // -1 to 1

&#x20; viabilityScore: number;        // 0-100 (threshold 60)

&#x20; volume: number;                // Posts per hour

&#x20; topPosts: Post\[];

&#x20; collectedAt: Date;

&#x20; expiresAt: Date;               // Redis TTL

}



interface Post {

&#x20; id: string;

&#x20; content: string;

&#x20; author: string;

&#x20; engagement: number;

&#x20; timestamp: Date;

}

MODULE 5: CONTENT FACTORY (Generation Pipeline)

Purpose: End-to-end content creation workflow from trend to publish-ready asset

5.1 Workflow Builder (React Flow)

Visual Pipeline Editor:

Nodes: TrendCollector → ViabilityScorer → AngleHunter → ScriptWriter → VisualSelector → EditorReview → Publisher

Drag \& Drop: Connect nodes to create custom workflows

Configuration: Click node to set parameters (e.g., Word-Smith: "5-10 slides")

Execution: "Run Pipeline" button spawns agents sequentially

Progress Indication: Animated flow showing active node, completed nodes (green), errors (red)

5.2 Content Editor Interface

Carousel Composer:

Slide Navigator: Thumbnails 1-10 on left

Editor: Markdown/richtext per slide with live preview

Visual Preview: Right panel showing Instagram-style carousel mockup

AI Assist: "Regenerate this slide" (spawns Word-Smith for specific slide)

Export: PNG sequence or PDF

Video Script Studio:

Timeline: 0-90 second timeline with segment markers

Script Editor: Hook (0-3s) → Setup (3-15s) → Body (15-75s) → CTA (75-90s)

B-Roll Panel: VJ-Ripper suggestions with preview thumbnails

Timing Annotations: Word count targets, pause recommendations, beat markers

Export: Markdown, teleprompter mode, or subtitle file

5.3 Asset Library

B-Roll Browser:

Grid of suggested videos/images from Pexels/Pixabay

Search: "technology", "city night", "person typing"

Download/Import to project

Auto-Match: VJ-Ripper suggests based on script keywords

Generated Content Archive:

History of all past carousels/scripts

Searchable by date, topic, performance

Clone \& Remix: Duplicate and modify past content

5.4 Publishing Queue

Status Board:

Draft → Review → Scheduled → Published

Drag cards between columns (Kanban style)

Auto-Schedule: Optimal posting time calculation (based on engagement history)

Platform Toggles: Instagram, X/Twitter, TikTok, LinkedIn

Preview: Platform-specific preview (e.g., Instagram crop vs Twitter card)

MODULE 6: THE ARCHIVES (Database Explorer)

Purpose: Direct access to PostgreSQL data with visualization

6.1 Table Browser

Tables List: users, social\_accounts, trend\_data, content\_generations, publishing\_schedule, engagement\_metrics, agent\_logs, learnings

Data Grid: Paginated table view with sorting/filtering

Query Editor: Raw SQL input for advanced queries (read-only for safety)

Export: CSV, JSON, or Excel

6.2 Analytics Dashboard

Time Series Charts:

Token usage over time (by model)

Mission success rate trends

Content engagement performance

System resource utilization (24h/7d/30d views)

Cost Analysis:

Per-agent-type cost breakdown

Per-mission-type average cost

Budget forecasting ("At current rate, $X remaining for month")

6.3 Learning Repository

Mnemosyne's Index:

Searchable pattern database ("Show me successful hooks for tech trends")

Failed attempt graveyard (with root cause analysis)

Insight Cards: "Word-Smith performs 23% better when given 3 examples"

MODULE 7: BRIEFING TERMINAL (Daily Intelligence)

Purpose: Morningstar's automated daily report

7.1 Auto-Generated Layout

Generated every day at 08:00 by Morningstar agent:

Header: Date, weather (if relevant), "Situation Report"

Executive Summary:

Missions completed last 24h: X/Y success

Notable achievements: "Viral hit on X post (50k views)"

Critical issues: "Gateway latency spike at 03:00"

Ghost Legion Status:

Active Fixers health check

Runner performance stats

Resource consumption summary

Trend Intelligence Brief:

Top 5 new trends detected

Recommended actions: "Deploy The Hook on #AI trends"

Today's Operations:

Scheduled missions (from Calendar)

Resource forecast: "Expected 2.8GB peak at 14:00"

Financial: Token costs, remaining budget

7.2 Interactions

Export: PDF generation for email (Courier-Post sends it)

Historical: Browse past briefings

Mark Read: Acknowledge to dismiss notification

3\. DATABASE SCHEMA (PostgreSQL)

sql

Copy

\-- Users \& Authentication

CREATE TABLE users (

&#x20;   id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&#x20;   email VARCHAR(255) UNIQUE NOT NULL,

&#x20;   password\_hash VARCHAR(255),

&#x20;   preferences JSONB DEFAULT '{}',

&#x20;   created\_at TIMESTAMP DEFAULT NOW()

);



\-- Social Media Connections (Section 7)

CREATE TABLE social\_accounts (

&#x20;   id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&#x20;   user\_id UUID REFERENCES users(id),

&#x20;   platform VARCHAR(50) NOT NULL, -- 'instagram', 'twitter', 'tiktok', etc.

&#x20;   credentials\_encrypted TEXT,    -- OAuth tokens, encrypted

&#x20;   metrics JSONB DEFAULT '{}',    -- Follower count, engagement rate

&#x20;   connected\_at TIMESTAMP DEFAULT NOW(),

&#x20;   last\_sync TIMESTAMP

);



\-- Trend Intelligence (Section 5)

CREATE TABLE trend\_data (

&#x20;   id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&#x20;   platform VARCHAR(50) NOT NULL,

&#x20;   topic VARCHAR(255) NOT NULL,

&#x20;   hashtag VARCHAR(100),

&#x20;   raw\_data JSONB NOT NULL,       -- Full API response

&#x20;   viability\_score FLOAT CHECK (viability\_score >= 0 AND viability\_score <= 100),

&#x20;   sentiment\_score FLOAT CHECK (sentiment\_score >= -1 AND sentiment\_score <= 1),

&#x20;   engagement\_velocity FLOAT,

&#x20;   volume\_1h INTEGER,

&#x20;   collected\_at TIMESTAMP DEFAULT NOW(),

&#x20;   expires\_at TIMESTAMP,          -- For Redis TTL sync

&#x20;   UNIQUE(platform, topic, collected\_at)

);



\-- AI Generated Content (Section 6)

CREATE TABLE content\_generations (

&#x20;   id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&#x20;   trend\_id UUID REFERENCES trend\_data(id),

&#x20;   format VARCHAR(50) NOT NULL,   -- 'carousel', 'short\_video', 'thread'

&#x20;   script\_content TEXT NOT NULL,

&#x20;   b\_roll\_suggestions JSONB,      -- Array of {url, description, timestamp}

&#x20;   angle\_concept TEXT,            -- The hook concept

&#x20;   slides JSONB,                  -- For carousels: \[{slide\_num, text, image\_prompt}]

&#x20;   video\_segments JSONB,          -- For videos: \[{start, end, script, b\_roll}]

&#x20;   approval\_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'

&#x20;   performance\_metrics JSONB,     -- Post-publish data

&#x20;   created\_at TIMESTAMP DEFAULT NOW()

);



\-- Publishing Schedule (Section 4.2)

CREATE TABLE publishing\_schedule (

&#x20;   id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&#x20;   content\_id UUID REFERENCES content\_generations(id),

&#x20;   platform VARCHAR(50) NOT NULL,

&#x20;   scheduled\_time TIMESTAMP NOT NULL,

&#x20;   published\_time TIMESTAMP,

&#x20;   status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'publishing', 'published', 'failed'

&#x20;   error\_message TEXT,

&#x20;   remote\_post\_id VARCHAR(255),   -- Platform's post ID

&#x20;   created\_at TIMESTAMP DEFAULT NOW()

);



\-- Ghost Legion Operations

CREATE TABLE agent\_operations (

&#x20;   id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&#x20;   agent\_id VARCHAR(100) NOT NULL,

&#x20;   agent\_name VARCHAR(100),

&#x20;   agent\_type VARCHAR(50),        -- 'fixer' or 'runner'

&#x20;   model VARCHAR(50),

&#x20;   mission TEXT,

&#x20;   status VARCHAR(20),            -- 'spawned', 'active', 'completed', 'killed', 'error'

&#x20;   memory\_usage\_mb INTEGER,

&#x20;   tokens\_consumed INTEGER,

&#x20;   started\_at TIMESTAMP DEFAULT NOW(),

&#x20;   completed\_at TIMESTAMP,

&#x20;   parent\_agent VARCHAR(100),     -- Who spawned this agent

&#x20;   error\_log TEXT

);



\-- Mnemosyne's Learning Index

CREATE TABLE learnings (

&#x20;   id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&#x20;   pattern\_type VARCHAR(100),     -- 'prompt\_strategy', 'model\_selection', 'timing'

&#x20;   trigger\_context TEXT,

&#x20;   action\_taken TEXT,

&#x20;   success\_score FLOAT,           -- 0.0 to 1.0

&#x20;   tokens\_used INTEGER,

&#x20;   applied\_to\_profile VARCHAR(100),

&#x20;   created\_at TIMESTAMP DEFAULT NOW()

);



\-- System Health Logs

CREATE TABLE system\_health (

&#x20;   id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

&#x20;   ram\_used\_mb INTEGER,

&#x20;   ram\_total\_mb INTEGER,

&#x20;   cpu\_percent FLOAT,

&#x20;   disk\_used\_gb FLOAT,

&#x20;   disk\_total\_gb FLOAT,

&#x20;   gateway\_status VARCHAR(20),

&#x20;   latency\_ms INTEGER,

&#x20;   recorded\_at TIMESTAMP DEFAULT NOW()

);



\-- Create indexes for performance

CREATE INDEX idx\_trend\_viability ON trend\_data(viability\_score DESC);

CREATE INDEX idx\_operations\_time ON agent\_operations(started\_at DESC);

CREATE INDEX idx\_schedule\_time ON publishing\_schedule(scheduled\_time);

CREATE INDEX idx\_learnings\_type ON learnings(pattern\_type);

4\. API CONTRACT (FastAI Backend Endpoints)

Ghost Legion Control

http

Copy

GET  /api/legion/status              # All Fixers status

GET  /api/legion/active              # Currently running Runners

GET  /api/legion/operations          # History with pagination

POST /api/legion/spawn               # Spawn new agent

&#x20;    Body: {agent\_type, mission, priority, memory\_limit}

DELETE /api/legion/kill/{agent\_id}   # Terminate runner

GET  /api/legion/topology            # Force Graph data {nodes, edges}

GET  /api/legion/logs/{agent\_id}     # Real-time logs stream

System Monitoring

http

Copy

GET  /api/system/resources           # Current RAM/CPU/Disk

GET  /api/system/gateway             # Gateway health \& latency

GET  /api/system/budget              # Token costs today/this month

WS   /ws/system                      # WebSocket for real-time updates

Trend Intelligence

http

Copy

GET  /api/trends?platform=\&min\_viability=\&limit=

GET  /api/trends/{trend\_id}          # Detail view with posts

POST /api/trends/refresh             # Trigger Chrome-Runner collection

GET  /api/trends/hot                 # Top 10 from Redis cache

Content Pipeline

http

Copy

GET  /api/content                    # List generated content

GET  /api/content/{id}               # Detail with slides/script

POST /api/content/create             # Start generation pipeline

&#x20;    Body: {trend\_id, format, workflow\_config}

PUT  /api/content/{id}               # Edit content

POST /api/content/{id}/publish       # Queue for publishing

Calendar \& Scheduling

http

Copy

GET  /api/calendar/events?start=\&end=

POST /api/calendar/events            # Create mission schedule

PUT  /api/calendar/events/{id}       # Reschedule

DELETE /api/calendar/events/{id}     # Cancel mission

GET  /api/calendar/next              # Next 5 upcoming missions

Briefing \& Reports

http

Copy

GET  /api/briefing/daily             # Today's Morningstar report

GET  /api/briefing/latest            # Most recent report

GET  /api/analytics/performance      # Charts data

GET  /api/analytics/costs            # Financial breakdown

5\. WEBSOCKET EVENTS (Real-Time)

Client → Server:

plain

Copy

subscribe\_agents          # Start receiving agent updates

subscribe\_system          # Start receiving resource updates

subscribe\_logs:{agent\_id} # Stream specific agent logs

Server → Client:

plain

Copy

agent\_spawned:{agent\_data}

agent\_status\_changed:{id, status, memory}

agent\_killed:{id, reason}

system\_alert:{level, message, metric}

log\_line:{agent\_id, timestamp, level, message}

resource\_update:{ram, cpu, gateway\_status}

6\. TECHNICAL REQUIREMENTS

Frontend Stack

Framework: React 18 + TypeScript

Build Tool: Vite (faster than CRA)

State Management: Zustand (lightweight) or Redux Toolkit

Routing: React Router v6 (basename: /custom/)

Styling: Tailwind CSS + Headless UI components

Visualization:

react-force-graph-2d (topology)

recharts (analytics)

react-big-calendar (scheduling)

react-flow-renderer (workflow builder)

Real-time: Socket.io-client

HTTP Client: Axios with interceptors for auth

Backend Stack (Kimia Builds This)

Framework: FastAPI (Python 3.10+)

Database: SQLAlchemy 2.0 + asyncpg

Cache: Redis (aioredis)

Tasks: Celery + Celery Beat (Redis broker)

WebSocket: python-socketio

Auth: JWT tokens (FastAPI Users library)

Deployment Config

Port Mapping:

3001 → React dev server (local dev)

8000 → FastAPI backend

18789 → OpenClaw Gateway (localhost only, never exposed)

Nginx Routes:

plain

Copy

/custom/         → /var/www/missioncontrol-custom/frontend/dist (static)

/api/            → http://127.0.0.1:8000 (FastAPI)

/ws/             → http://127.0.0.1:8000 (WebSocket upgrade)

/api/gateway/    → Proxy to 127.0.0.1:18789 (protected)

7\. SECURITY REQUIREMENTS

Gateway Isolation: Port 18789 never exposed to internet (bind 127.0.0.1 only)

Authentication: JWT required for all /api/\* routes except health check

CORS: Disabled (all same-origin since hosted on VPS subdomain)

SQL Injection: SQLAlchemy ORM only (no raw queries from frontend)

Sandbox: File system access restricted to /var/lib/openclaw/workspace/

Secrets: All API keys in environment variables, never in code

END OF SPECIFICATION

Feed this complete document to Antigravity for UI generation, then export to Google Drive for Kimia to implement the full Ghost Legion infrastructure.

