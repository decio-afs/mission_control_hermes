// Ghost Network — "NEXUS // Orchestration Deck".
//
// Ported from the Claude Design "jarvis" handoff bundle and wired to LIVE Hermes
// data: the agent roster, orbital mesh, grid cards and detail panel all render
// real agents from useGhostStore; the activity stream is the live Hermes feed;
// and the command bar issues real directives to the orchestrator via sendHermesChat.
import { useState, useEffect, useRef, useMemo, useCallback, useId } from 'react';
import { Link } from 'react-router-dom';
import { useGhostStore, type GhostNode } from '../stores/useGhostStore';
import { useActivityStore } from '../stores/useActivityStore';
import { useAgentDrilldownStore } from '../stores/useAgentDrilldownStore';
import { useAgentCrud } from '../components/useAgentCrud';
import { useChatStore } from '../stores/useChatStore';
import './ghostNexus.css';

// ── static lookups ─────────────────────────────────────────────────────────
type Status = 'working' | 'active' | 'idle' | 'warn';
const STLABEL: Record<Status, string> = { working: 'EXEC', active: 'LIVE', idle: 'IDLE', warn: 'WARN' };

const SQUAD_TONE: Record<string, string> = {
  CORE: '#f64e6e', SEC: '#ef4444', INTEL: '#ff795e', INFRA: '#10b981', CONT: '#f59e0b', DEV: '#38bdf8',
};
const SQUAD_ROLE: Record<string, { role: string; domain: string }> = {
  CORE: { role: 'Orchestrator', domain: 'Coordination · Routing' },
  SEC: { role: 'Security', domain: 'Monitor · Guardrails' },
  INTEL: { role: 'Intelligence', domain: 'Research · Synthesis' },
  INFRA: { role: 'Infrastructure', domain: 'Scheduling · Pipelines' },
  CONT: { role: 'Content', domain: 'Drafting · Media' },
  DEV: { role: 'Engineering', domain: 'Code · Review · Deploy' },
};
const SQUAD_GLYPH: Record<string, string> = {
  CORE: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  SEC: 'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z',
  INTEL: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5',
  INFRA: 'M4 5h16v15H4zM4 9h16M8 3v4M16 3v4',
  CONT: 'M4 20l4-1L18 9l-3-3L5 16zM14 6l3 3',
  DEV: 'M8 6l-5 6 5 6M16 6l5 6-5 6M13 4l-2 16',
};
const DEFAULT_GLYPH = 'M3 5h18M3 12h18M3 19h12';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const pad = (n: number) => String(n).padStart(2, '0');

interface NexAgent {
  id: string; name: string; role: string; domain: string;
  status: Status; online: boolean; color: string; ring: 0 | 1;
  load: number; task: string; running: number; queue: number;
  squad: string; tags: string[]; glyph: string;
}

interface FeedLine { id: string; ts: number; ag: string; kind: string; text: string; jarvis: boolean; fresh: boolean; }

function deriveStatus(n: GhostNode): Status {
  const online = n.status === 'active' || n.status === 'online';
  if (!online) return 'idle';
  const q = n.queue_depth ?? 0, r = n.tasks_running ?? 0;
  if (q >= 8) return 'warn';
  if (r > 0) return 'working';
  return 'active';
}

// Deterministic [0,1) hash noise — pure, so the sparkline can render from props
// alone (no state/effect) while still animating as `tick` slides the window.
function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// ── live sparkline (seeded noise window, self-ticking so it never re-renders
//    the parent tree; only mounted sparks run an interval) ───────────────────
function Spark({ base, color, w, h, className }: { base: number; color: string; w: number; h: number; className: string }) {
  const rawId = useId();
  const seed = useMemo(() => { let s = 0; for (let i = 0; i < rawId.length; i++) s = (s * 31 + rawId.charCodeAt(i)) >>> 0; return s % 9973; }, [rawId]);
  const [t, setT] = useState(0);
  useEffect(() => { const id = setInterval(() => setT((x) => x + 1), 1600); return () => clearInterval(id); }, []);
  const n = 26;
  const data = Array.from({ length: n }, (_, i) => clamp(base + (noise(seed + (t - (n - 1 - i))) * 0.32 - 0.16), 0.04, 0.98));
  const pts = data.map((v, i) => `${((i / (n - 1)) * w).toFixed(1)},${(h - v * h).toFixed(1)}`);
  return (
    <svg className={className} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} /><stop offset="1" stopColor="transparent" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#sg-${seed})`} opacity="0.18" points={`0,${h} ${pts.join(' ')} ${w},${h}`} />
      <polyline fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" points={pts.join(' ')} />
    </svg>
  );
}

const cssVars = (o: Record<string, string>) => o as React.CSSProperties;

export default function GhostNetwork() {
  const { nodes, fetchTopology } = useGhostStore();
  const { activities, startPolling, stopPolling } = useActivityStore();
  const openDrilldown = useAgentDrilldownStore((s) => s.open);
  // Agent CRUD (create / edit / delete / spawn) — lives in the detail panel now
  // that the orbital roster + detail panel replace the old Registry table.
  const crud = useAgentCrud();
  // Shared chat/session store — the command bar drives the active Hermes session
  // (persisted + resumable), so the conversation survives tab switches and is the
  // same session you see in Ghost Comms.
  const {
    init: initChat, send: sendChat, sending, activeMessages,
    sessions: chatSessions, activeId: chatActiveId, isDraft: chatIsDraft,
    selectSession, newSession,
  } = useChatStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [paused, setPaused] = useState(false);
  const [zoomLabel, setZoomLabel] = useState('100%');

  useEffect(() => { initChat(); }, [initChat]);

  const stageBodyRef = useRef<HTMLDivElement>(null);
  const orbitSpaceRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef({ z: 1, px: 0, py: 0 });

  // live data lifecycle
  useEffect(() => { fetchTopology(); startPolling(); return () => stopPolling(); }, [fetchTopology, startPolling, stopPolling]);
  // Pause all the deck's CSS animations when the window is hidden/backgrounded —
  // saves continuous GPU compositing + CPU while the user isn't looking.
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // map live agents → nexus agents
  const agents = useMemo<NexAgent[]>(() => {
    const live = nodes.filter((n) => n.type !== 'squad');
    const nonCore = live.filter((n) => n.type !== 'core').sort((a, b) => a.name.localeCompare(b.name));
    const innerCount = Math.min(6, Math.ceil(nonCore.length * 0.4));
    return nonCore.map((n, i) => {
      const squad = n.squad || 'DEV';
      const status = deriveStatus(n);
      const online = status !== 'idle';
      const r = n.tasks_running ?? 0, q = n.queue_depth ?? 0;
      const task = !online ? 'Offline — not on the wire'
        : r > 0 ? `${r} task${r > 1 ? 's' : ''} running${q ? ` · ${q} queued` : ''}`
        : q > 0 ? `${q} job${q > 1 ? 's' : ''} queued — standing by`
        : 'Idle — awaiting directive';
      const rl = SQUAD_ROLE[squad] || { role: 'Agent', domain: 'General' };
      return {
        id: n.id, name: n.name.toUpperCase(), role: rl.role, domain: rl.domain,
        status, online, color: SQUAD_TONE[squad] || '#f64e6e', ring: i < innerCount ? 0 : 1,
        load: clamp(0.1 + r * 0.22 + q * 0.04 + (online ? 0.08 : 0), 0.05, 0.98),
        task, running: r, queue: q, squad,
        tags: [squad.toLowerCase(), n.type, ...(r > 0 ? ['active'] : [])],
        glyph: SQUAD_GLYPH[squad] || DEFAULT_GLYPH,
      };
    });
  }, [nodes]);

  const coreNode = useMemo(() => nodes.find((n) => n.type === 'core'), [nodes]);
  const byId = useMemo(() => Object.fromEntries(agents.map((a) => [a.id, a])), [agents]);
  const selected = selectedId ? byId[selectedId] : null;

  // live aggregates
  const total = agents.length;
  const onlineCount = agents.filter((a) => a.online).length;
  const busyCount = agents.filter((a) => a.running > 0).length;
  const running = agents.reduce((s, a) => s + a.running, 0);
  const queue = agents.reduce((s, a) => s + a.queue, 0);
  const onlinePct = total ? Math.round((onlineCount / total) * 100) : 0;
  const coreActive = onlineCount > 0;

  // ── selection helpers ──
  const select = useCallback((id: string | null) => setSelectedId((cur) => (cur === id ? null : id)), []);

  // ── command directive → shared Hermes chat session ──
  const runDirective = useCallback((textRaw: string) => {
    const text = textRaw.trim();
    if (!text || sending) return;
    void sendChat(text);
  }, [sending, sendChat]);

  const submit = () => { const v = input.trim(); if (!v) return; runDirective(v); setInput(''); };

  const chatMessages = activeMessages();

  // ── merged feed (live activity + the active chat conversation) ──
  const feed = useMemo<FeedLine[]>(() => {
    const norm = (t: number) => (t < 1e12 ? t * 1000 : t);
    const acts: FeedLine[] = activities.map((a) => {
      const s = (a.status || '').toLowerCase(), act = (a.action || '').toLowerCase();
      const kind = s.includes('fail') || s.includes('error') || act.includes('block') ? 'warn'
        : s.includes('complete') || s.includes('done') || act.includes('complete') ? 'ok'
        : act.includes('spawn') || act.includes('start') || act.includes('claim') ? 'exec'
        : act.includes('creat') || act.includes('updat') ? 'data' : 'info';
      return { id: a.id, ts: norm(a.timestamp), ag: (a.agent || 'SYS').toUpperCase().slice(0, 10), kind, text: a.action + (a.status ? ` · ${a.status}` : ''), jarvis: false, fresh: false };
    });
    const chat: FeedLine[] = chatMessages.map((m) => ({
      id: m.id,
      ts: Date.parse(m.timestamp) || 0,
      ag: m.role === 'user' ? 'OPERATOR' : m.role === 'assistant' ? 'ARCAN' : 'SYSTEM',
      kind: m.error ? 'warn' : 'jarvis',
      text: m.role === 'user' ? `“${m.content}”` : m.content,
      jarvis: m.role !== 'system',
      fresh: false,
    }));
    return [...acts, ...chat].sort((x, y) => x.ts - y.ts).slice(-80);
  }, [activities, chatMessages]);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [feed.length, sending]);

  // ── zoom + pan (orbital) ──
  const applyZoom = useCallback((smooth: boolean) => {
    const s = orbitSpaceRef.current; if (!s) return;
    const { z, px, py } = zoomRef.current;
    s.style.transition = smooth ? 'transform .26s cubic-bezier(.2,.8,.2,1)' : 'none';
    s.style.transform = `translate(${px}px, ${py}px) scale(${z})`;
    setZoomLabel(Math.round(z * 100) + '%');
  }, []);
  const setZoom = useCallback((z: number, smooth: boolean) => { zoomRef.current.z = clamp(z, 0.45, 2.6); applyZoom(smooth); }, [applyZoom]);

  useEffect(() => {
    const stage = stageBodyRef.current; if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = orbitSpaceRef.current; if (!s) return;
      const r = s.getBoundingClientRect();
      const cX = r.left + r.width / 2, cY = r.top + r.height / 2;
      const z = zoomRef.current;
      const nz = clamp(z.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), 0.45, 2.6);
      const k = nz / z.z;
      z.px -= (e.clientX - cX) * (k - 1); z.py -= (e.clientY - cY) * (k - 1); z.z = nz;
      applyZoom(false);
    };
    let drag = false, sx = 0, sy = 0;
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('.agent-node') || t.closest('.zoomctl')) return;
      drag = true; sx = e.clientX - zoomRef.current.px; sy = e.clientY - zoomRef.current.py;
      stage.classList.add('grabbing'); stage.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => { if (!drag) return; zoomRef.current.px = e.clientX - sx; zoomRef.current.py = e.clientY - sy; applyZoom(false); };
    const onUp = () => { drag = false; stage.classList.remove('grabbing'); };
    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onUp);
    return () => {
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onUp);
    };
  }, [applyZoom]);

  // rings for orbital
  const rings = useMemo(() => {
    const inner = agents.filter((a) => a.ring === 0);
    const outer = agents.filter((a) => a.ring === 1);
    return [
      { cls: 'inner', rad: 0.34, off: -45, items: inner },
      { cls: 'outer', rad: 0.52, off: -90, items: outer },
    ];
  }, [agents]);

  // rail bars (real fleet %)
  const bars = [
    { k: 'ONLINE', v: onlinePct },
    { k: 'BUSY', v: total ? Math.round((busyCount / total) * 100) : 0 },
    { k: 'IDLE', v: total ? Math.round(((onlineCount - busyCount) / total) * 100) : 0 },
    { k: 'QUEUE', v: Math.min(98, Math.round((queue / Math.max(20, total * 3)) * 100)) },
  ];

  // vitals (real)
  const vitals = [
    { id: 'agents', label: 'Agents Online', unit: `/ ${total}`, value: String(onlineCount), norm: total ? onlineCount / total : 0, up: true },
    { id: 'run', label: 'Running', unit: 'jobs', value: String(running), norm: clamp(running / Math.max(8, total), 0.04, 0.98), up: false },
    { id: 'queue', label: 'Queue Depth', unit: 'jobs', value: String(queue), norm: clamp(queue / Math.max(20, total * 3), 0.04, 0.98), up: false },
    { id: 'online', label: 'Fleet Online', unit: '%', value: String(onlinePct), norm: onlinePct / 100, up: true },
  ];

  const ghostError = useGhostStore((s) => s.error);

  return (
    <div className={`nexus${paused ? ' paused' : ''}`} data-layout="orbital">
      <div className="fx fx-grid" />
      <div className="fx fx-scan" />
      <div className="fx fx-vignette" />

      <div className="main">
        {/* LEFT RAIL — roster */}
        <aside className="col rail">
          <div className="col-head"><span>Agents</span><span className="n">// {total}</span></div>
          <div className="col-body">
            <ul className="roster">
              {agents.map((a) => (
                <li key={a.id} className={`ragent${selectedId === a.id ? ' sel' : ''}`} style={cssVars({ '--c': a.color })} onClick={() => select(a.id)}>
                  <div className="ico"><svg viewBox="0 0 24 24"><path d={a.glyph} /></svg></div>
                  <div className="meta">
                    <div className="nm">{a.name}</div>
                    <div className="rl">{a.role.toUpperCase()} · {a.domain}</div>
                  </div>
                  <div className="stat">
                    <div className="s-badge">{STLABEL[a.status]}</div>
                    <div className="load">{Math.round(a.load * 100)}%</div>
                  </div>
                </li>
              ))}
              {total === 0 && <li className="rl" style={{ padding: 12, fontFamily: 'var(--font-mono)', color: 'var(--txt-dim)' }}>No agents on the wire.</li>}
            </ul>
          </div>
          <div className="rail-foot">
            <div className="mini-label">Cluster Load</div>
            <div className="bars">
              {bars.map((b) => (
                <div className="bar" key={b.k}>
                  <span>{b.k}</span>
                  <div className="track"><div className="fill" style={{ width: `${b.v}%` }} /></div>
                  <span className="v">{b.v}%</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER STAGE */}
        <section className="col stage">
          <div className="stage-head">
            <div className="stage-title"><b>AGENT MESH</b><span>// {coreNode ? coreNode.name : 'arcan'} core · {total} nodes</span></div>
            <div className="stage-stats">
              <div className="chip"><span className="dot" /><span className="k">AGENTS</span><b>{onlineCount}/{total}</b></div>
              <div className="chip"><span className="dot cyan" /><span className="k">RUNNING</span><b>{running}</b></div>
              <div className="chip"><span className={`dot ${queue ? 'amber' : ''}`} /><span className="k">QUEUE</span><b>{queue}</b></div>
            </div>
            <div className="view-toggle">
              <button onClick={() => crud.openCreate()} title="Create a new agent">+ Agent</button>
            </div>
          </div>

          <div className="stage-body" ref={stageBodyRef}>
            <div className="orbital">
              <div className="orbit-space" ref={orbitSpaceRef}>
                {rings.map((r) => (
                  <div className={`ring ${r.cls}`} key={r.cls}>
                    {r.items.map((a, i) => {
                      const ang = (360 / Math.max(r.items.length, 1)) * i + r.off;
                      return (
                        <div className="spoke" key={`sp-${a.id}`} style={cssVars({ '--a': `${ang}deg`, '--c': a.color, '--pdur': `${rnd(2.6, 4.2).toFixed(2)}s`, ...(a.status === 'idle' ? { opacity: '.18' } : {}) }) as React.CSSProperties} />
                      );
                    })}
                    {r.items.map((a, i) => {
                      const ang = (360 / Math.max(r.items.length, 1)) * i + r.off;
                      return (
                        <div className="node" key={a.id} style={{ ...cssVars({ '--a': `${ang}deg` }), transform: `rotate(${ang}deg) translateX(calc(var(--orbit) * ${r.rad}))` }}>
                          <div className="spin"><div className="upr">
                            <div className={`agent-node st-${a.status}${selectedId === a.id ? ' sel' : ''}`} style={cssVars({ '--c': a.color })} onClick={(e) => { e.stopPropagation(); select(a.id); }}>
                              <div className="orb"><svg viewBox="0 0 24 24"><path d={a.glyph} /></svg></div>
                              <div className="lab"><b className="glitch" data-t={a.name}>{a.name}</b><span>{a.role.toUpperCase()}</span></div>
                            </div>
                          </div></div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div className="core">
                  <div className="layer orb-halo" /><div className="layer orb-dial" /><div className="layer orb-ring-o" />
                  <div className="layer orb-ring-r" /><div className="layer orb-ring-i" /><div className="layer orb-sweep" />
                  <div className="layer orb-sphere" />
                  <div className="layer orb-hot"><span className="flare-h" /><span className="flare-v" /></div>
                  <div className="core-stat cs-top">{running} RUNNING</div>
                  <div className="core-stat cs-bl">{queue} QUEUED</div>
                  <div className="core-stat cs-br">{onlineCount}/{total} ACTIVE</div>
                  <div className="core-label"><b>{coreNode ? coreNode.name.toUpperCase() : 'ARCAN'}</b><span>ORCHESTRATOR · {coreActive ? 'ACTIVE' : 'STANDBY'}</span></div>
                </div>
              </div>
            </div>

            <div className="zoomctl">
              <button title="Zoom in" onClick={() => setZoom(zoomRef.current.z * 1.2, true)}>+</button>
              <button title="Zoom out" onClick={() => setZoom(zoomRef.current.z / 1.2, true)}>−</button>
              <button className="zreset" title="Reset view" onClick={() => { zoomRef.current = { z: 1, px: 0, py: 0 }; applyZoom(true); }}>◎</button>
              <div className="zlvl">{zoomLabel}</div>
            </div>

            <div className="stage-foot">
              <span>MESH&nbsp;<b>{ghostError ? 'DEGRADED' : 'STABLE'}</b></span>
              <span>AGENTS&nbsp;<b>{onlineCount}/{total}</b></span>
              <span>RUNNING&nbsp;<b>{running}</b></span>
              <span>QUEUE&nbsp;<b>{queue}</b></span>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <aside className="col panel">
          <div className="panel-detail">
            <div className="col-head"><span>{selected ? 'Agent Detail' : 'System Telemetry'}</span><span className="n">// {selected ? 'live' : 'realtime'}</span></div>
            {!selected && (
              <div className="vitals">
                {vitals.map((v) => (
                  <div className={`vital${v.up ? ' up' : ''}`} key={v.id}>
                    <div className="vl">{v.label}</div>
                    <div className="vv">{v.value}<small>{v.unit}</small></div>
                    <Spark base={v.norm} color={v.up ? 'var(--accent-2)' : 'var(--accent)'} w={60} h={22} className="vspark" />
                  </div>
                ))}
              </div>
            )}
            {selected && (
              <div className="detail" style={cssVars({ '--c': selected.color })}>
                <div className="dh">
                  <div className="di" style={cssVars({ '--c': selected.color })}><svg viewBox="0 0 24 24"><path d={selected.glyph} /></svg></div>
                  <div className="dt"><b>{selected.name}</b><span>{selected.role.toUpperCase()} · {selected.squad}</span></div>
                  <button className="dclose" onClick={() => openDrilldown(selected.name)} title="Open full agent drill-down">▦ INSPECT</button>
                  <button className="dclose" onClick={() => setSelectedId(null)}>▢ CLOSE</button>
                </div>
                <div className="dtask">
                  <div className="tl">Current Directive · {STLABEL[selected.status]}</div>
                  <div className="tx">{selected.task}</div>
                  <div className="prog"><i style={{ width: `${Math.round(selected.load * 100)}%` }} /></div>
                </div>
                <div className="dstats">
                  <div className="dstat"><div className="l">Load</div><div className="v" style={{ color: selected.color }}>{Math.round(selected.load * 100)}%</div></div>
                  <div className="dstat"><div className="l">Queue</div><div className="v">{selected.queue}</div></div>
                  <div className="dstat"><div className="l">Running</div><div className="v">{selected.running}</div></div>
                </div>
                <div className="dtags">{selected.tags.map((t) => <span className="dtag" key={t}>#{t}</span>)}</div>
                <div className="dctrl" style={cssVars({ '--accent': selected.color })}>
                  <button className="dbtn" disabled={sending} onClick={() => runDirective(`Give me a status report on ${selected.name}`)}>Status</button>
                  <button className="dbtn warn" disabled={sending} onClick={() => runDirective(`Pause agent ${selected.name}`)}>Pause</button>
                  <button className="dbtn danger" disabled={sending} onClick={() => runDirective(`Reassign the workload of ${selected.name}`)}>Reassign</button>
                </div>
                {/* Agent management — the CRUD that used to live in the Registry tab. */}
                <div className="dctrl" style={cssVars({ '--accent': selected.color })}>
                  <button className="dbtn" onClick={() => { const n = nodes.find((x) => x.id === selected.id); if (n) crud.openSpawn(n); }}>Spawn</button>
                  <button className="dbtn" onClick={() => { const n = nodes.find((x) => x.id === selected.id); if (n) crud.openEdit(n); }}>Edit</button>
                  <button className="dbtn danger" onClick={() => { const n = nodes.find((x) => x.id === selected.id); if (n) crud.openDelete(n); }}>Delete</button>
                </div>
              </div>
            )}
          </div>

          <div className="feed-wrap">
            <div className="feed-head"><span>Activity Stream</span><span className="live"><span className="dot red" />LIVE</span></div>
            <div className="feed" ref={feedRef}>
              {feed.length === 0 && <div className="fline"><span className="tx" style={{ color: 'var(--txt-dim)' }}>Awaiting activity from the bridge…</span></div>}
              {feed.map((l) => (
                <div className={`fline${l.fresh ? ' fresh' : ''}${l.jarvis ? ' jarvis' : ''}`} key={l.id}>
                  <span className="ts">{(() => { const d = new Date(l.ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; })()}</span>
                  <span className="ag">{l.ag}</span>
                  <span className={`kk ${l.jarvis ? 'jarvis' : l.kind}`}>{l.jarvis ? 'CORE' : l.kind.toUpperCase()}</span>
                  <span className="tx">{l.text}</span>
                </div>
              ))}
              {sending && (
                <div className="fline jarvis nx-thinking">
                  <span className="ts">··:··:··</span>
                  <span className="ag">ARCAN</span>
                  <span className="kk jarvis">CORE</span>
                  <span className="tx">orchestrator is thinking<span className="nx-ellipsis" /></span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* COMMAND BAR — real directives to the orchestrator */}
      <footer className="commandbar">
        {/* Session control — the active session is shared with Ghost Comms and
            persists across tabs. Switch, start fresh, or pop out to the full
            workspace for history + projects. */}
        <div className="flex items-center gap-1 mr-1 shrink-0">
          <select
            value={chatIsDraft ? '' : (chatActiveId || '')}
            onChange={(e) => { const v = e.target.value; if (v) void selectSession(v); }}
            title="Active session"
            className="max-w-[150px] bg-[#0b0b0b] border border-white/15 text-[10px] font-mono text-[#b8b8b8] px-1.5 py-1 outline-none focus:border-[#f64e6e]"
          >
            {chatIsDraft && <option value="">◆ New Session</option>}
            {chatSessions.slice(0, 30).map((s) => (
              <option key={s.id} value={s.id}>{(s.title || s.preview || s.id).slice(0, 40)}</option>
            ))}
          </select>
          <button
            onClick={() => newSession()}
            title="New session"
            className="h-[26px] w-[26px] shrink-0 flex items-center justify-center border border-white/15 text-[#b8b8b8] hover:border-[#f64e6e] hover:text-[#f64e6e] text-[13px]"
          >+</button>
          <Link
            to="/chat"
            title="Open in Ghost Comms — full history, rename & projects"
            className="h-[26px] w-[26px] shrink-0 flex items-center justify-center border border-white/15 text-[#b8b8b8] hover:border-sky-400 hover:text-sky-400 text-[12px]"
          >⤢</Link>
        </div>
        <div className="cmd-pre"><span className="pr">ARCAN</span><span>▷</span></div>
        <input
          className="cmd-input" type="text" autoComplete="off" spellCheck={false}
          value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder={sending ? 'Orchestrator is thinking…' : 'Issue a directive to the orchestrator —  e.g.  “give me a status report”'}
          disabled={sending}
        />
        <div className="chips">
          <button className="qchip" onClick={() => setInput('Give me a status report')}>status report</button>
          <button className="qchip" onClick={() => setInput('List all active agents and what they are working on')}>list agents</button>
          <button className="qchip" onClick={() => setInput('What tasks are queued right now?')}>queue</button>
        </div>
        <button className="cmd-send" onClick={submit} disabled={sending || !input.trim()}>{sending ? '···' : 'Execute'}</button>
      </footer>

      {/* Agent CRUD modals (create / edit / delete / spawn) */}
      {crud.modals}
    </div>
  );
}
