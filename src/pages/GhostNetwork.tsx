// Ghost Network — "Agent Nexus" reactor dashboard.
//
// A large central energy reactor (the orchestrator) with live Hermes agents
// radiating outward on lush, flowing orange/cyan plasma streams. Each agent is a
// particle-burst orb colour-coded by state, with stacked ACTIVE/WORKING status
// tags. Floating HUD panels (AGENT COMMS, AGENT TRACKING) and a framed overlay
// complete the command-deck look — all bound to live bridge data.
import { useState, useEffect, useRef, useMemo } from 'react';
import { useGhostStore, type GhostNode } from '../stores/useGhostStore';
import { hRand } from '../components/cyberpunk/util';

const CYAN = '#38bdf8';
const isOnline = (n?: GhostNode) => !!n && (n.status === 'active' || n.status === 'online');
const isBusy = (n?: GhostNode) => !!n && (n.tasks_running ?? 0) > 0;

interface Placed {
  node: GhostNode;
  x: number;
  y: number;
  ang: number;
  online: boolean;
  busy: boolean;
}

function orbColor(online: boolean, busy: boolean): string {
  if (busy) return '#ff6a3d';   // WORKING — hot orange
  if (online) return '#f59e0b'; // ACTIVE/IDLE — amber
  return CYAN;                  // INACTIVE — cyan
}

// Curved stream from the core to a node with a perpendicular bow `off`.
function stream(cx: number, cy: number, x: number, y: number, off: number): string {
  const mx = (cx + x) / 2;
  const my = (cy + y) / 2;
  const dx = x - cx;
  const dy = y - cy;
  return `M ${cx} ${cy} Q ${mx - dy * off} ${my + dx * off} ${x} ${y}`;
}

export default function GhostNetwork() {
  const { nodes, fetchTopology, error, isLoading } = useGhostStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 1200, h: 700 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pulse, setPulse] = useState(true);

  useEffect(() => { fetchTopology(); }, [fetchTopology]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      const r = containerRef.current!.getBoundingClientRect();
      setDims({ w: r.width, h: r.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { core, placed } = useMemo(() => {
    const live = nodes.filter((n) => n.type !== 'squad');
    const coreNode = live.find((n) => n.type === 'core');
    const others = live.filter((n) => n.id !== coreNode?.id);

    const cx = dims.w / 2;
    const cy = dims.h / 2;
    const base = Math.min(dims.w, dims.h);
    const widen = dims.w > dims.h ? Math.min(1.6, dims.w / dims.h) : 1;
    const padX = 120;
    const padY = 96;
    const N = Math.max(others.length, 1);

    const items: Placed[] = others.map((n, i) => {
      const ring = i % 2;
      const rad = base * (ring === 0 ? 0.31 : 0.44);
      const ang = -Math.PI / 2 + (i / N) * Math.PI * 2 + (hRand(n.id) - 0.5) * 0.13;
      let x = cx + Math.cos(ang) * rad * widen;
      let y = cy + Math.sin(ang) * rad;
      x = Math.max(padX, Math.min(dims.w - padX, x));
      y = Math.max(padY, Math.min(dims.h - padY, y));
      return { node: n, x, y, ang, online: isOnline(n), busy: isBusy(n) };
    });
    return { core: coreNode, placed: items };
  }, [nodes, dims]);

  const cx = dims.w / 2;
  const cy = dims.h / 2;
  const coreOnline = core ? isOnline(core) : placed.some((p) => p.online);
  const onlineCount = placed.filter((p) => p.online).length;
  const workingCount = placed.filter((p) => p.busy).length;
  const selected = placed.find((p) => p.node.id === selectedId);

  // Live feed for the comms panel: working agents first, then online, then rest.
  const feed = useMemo(() => {
    return [...placed]
      .sort((a, b) => Number(b.busy) - Number(a.busy) || Number(b.online) - Number(a.online))
      .slice(0, 6);
  }, [placed]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0b0e16 0%, #060709 68%, #030304 100%)' }}
      onClick={() => setSelectedId(null)}
    >
      <NexusStyles />

      {/* faint tech grid + isometric floor hint */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(120,150,190,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(120,150,190,0.10) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 82%)',
        }}
      />

      {/* SVG: plasma streams + core rings */}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="nx-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="nx-core-aura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={coreOnline ? '#ff7a3c' : CYAN} stopOpacity="0.5" />
            <stop offset="34%" stopColor="#ff5a2c" stopOpacity="0.16" />
            <stop offset="62%" stopColor={CYAN} stopOpacity="0.10" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* streams — three strands per agent for a fibre-bundle look */}
        {placed.map((p) => {
          const color = orbColor(p.online, p.busy);
          const active = p.node.id === hoveredId || p.node.id === selectedId;
          const baseOp = p.online ? 1 : 0.5;
          const flowDur = p.busy ? 1.1 : p.online ? 2.4 : 4.2;
          const strands = [
            { off: 0.0, c: color, w: active ? 2.2 : p.busy ? 1.7 : 1.1, o: 0.85 },
            { off: 0.05, c: CYAN, w: active ? 1.3 : 0.8, o: 0.4 },
            { off: -0.045, c: color, w: active ? 1.3 : 0.8, o: 0.35 },
          ];
          return (
            <g key={p.node.id} opacity={baseOp}>
              {strands.map((s, k) => {
                const d = stream(cx, cy, p.x, p.y, s.off);
                return (
                  <path
                    key={k}
                    d={d}
                    fill="none"
                    stroke={s.c}
                    strokeWidth={s.w}
                    opacity={active ? Math.min(1, s.o + 0.25) : s.o}
                    strokeLinecap="round"
                    filter="url(#nx-glow)"
                    strokeDasharray={pulse ? '5 11' : undefined}
                  >
                    {pulse && (
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-32"
                        dur={`${flowDur + k * 0.3}s`}
                        repeatCount="indefinite"
                      />
                    )}
                  </path>
                );
              })}
              {/* bright travelling pulse for working agents */}
              {pulse && p.busy && (
                <circle r="3.2" fill="#fff" filter="url(#nx-glow)">
                  <animateMotion dur="1.8s" repeatCount="indefinite" path={stream(cx, cy, p.x, p.y, 0)} />
                  <animate attributeName="opacity" values="0;1;1;0" dur="1.8s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}

        {/* central reactor rings */}
        <g>
          <circle cx={cx} cy={cy} r={170} fill="url(#nx-core-aura)" />
          {/* outer tick ring */}
          <circle cx={cx} cy={cy} r={104} fill="none" stroke={CYAN} strokeWidth="1" opacity="0.5"
            strokeDasharray="2 7" filter="url(#nx-glow)">
            <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="48s" repeatCount="indefinite" />
          </circle>
          {/* orange segmented ring */}
          <circle cx={cx} cy={cy} r={84} fill="none" stroke="#ff6a3d" strokeWidth="3" opacity="0.85"
            strokeDasharray="34 18" strokeLinecap="round" filter="url(#nx-glow)">
            <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="16s" repeatCount="indefinite" />
          </circle>
          {/* cyan counter-rotating ring */}
          <circle cx={cx} cy={cy} r={66} fill="none" stroke={CYAN} strokeWidth="2" opacity="0.7"
            strokeDasharray="10 12" filter="url(#nx-glow)">
            <animateTransform attributeName="transform" type="rotate" from={`360 ${cx} ${cy}`} to={`0 ${cx} ${cy}`} dur="11s" repeatCount="indefinite" />
          </circle>
          {/* inner orange ring */}
          <circle cx={cx} cy={cy} r={46} fill="none" stroke="#ff7a3c" strokeWidth="2.5" opacity="0.9"
            strokeDasharray="20 10" strokeLinecap="round" filter="url(#nx-glow)">
            <animateTransform attributeName="transform" type="rotate" from={`0 ${cx} ${cy}`} to={`360 ${cx} ${cy}`} dur="7s" repeatCount="indefinite" />
          </circle>
          {/* hot core */}
          <circle cx={cx} cy={cy} r={20} fill="#fff" filter="url(#nx-glow)">
            <animate attributeName="r" values="17;23;17" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.82;1" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx} cy={cy} r={32} fill="none" stroke={coreOnline ? '#ff7a3c' : CYAN} strokeWidth="6" opacity="0.5" filter="url(#nx-glow)" />
        </g>
      </svg>

      {/* core label */}
      <div
        className="absolute font-mono whitespace-nowrap pointer-events-none text-center"
        style={{ left: cx, top: cy + 118, transform: 'translateX(-50%)', textShadow: '0 1px 8px #000', zIndex: 35 }}
      >
        <span className="text-[13px] tracking-[0.24em] text-[#9aa3b5]">MAIN AGENT: </span>
        <span className="text-[13px] tracking-[0.24em] font-bold" style={{ color: coreOnline ? '#ff6a3d' : CYAN }}>
          {coreOnline ? 'ACTIVE' : 'STANDBY'}
        </span>
        <div className="text-[9px] tracking-[0.34em] text-[#566] mt-1">{core ? core.name.toUpperCase() : 'ORCHESTRATOR'}</div>
      </div>

      {/* Agent orbs */}
      {placed.map((p) => {
        const color = orbColor(p.online, p.busy);
        const hovered = hoveredId === p.node.id;
        const sel = selectedId === p.node.id;
        const dimmed = (hoveredId || selectedId) && !hovered && !sel;
        const size = (p.node.val >= 4 ? 72 : 60) + (p.busy ? 12 : 0);
        const labelAbove = p.y > cy;
        return (
          <div
            key={p.node.id}
            className="absolute"
            style={{
              left: p.x, top: p.y, transform: 'translate(-50%, -50%)',
              zIndex: hovered || sel ? 50 : 22,
              opacity: dimmed ? 0.4 : 1, transition: 'opacity 0.25s', cursor: 'pointer',
            }}
            onMouseEnter={() => setHoveredId(p.node.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={(e) => { e.stopPropagation(); setSelectedId((c) => (c === p.node.id ? null : p.node.id)); }}
          >
            {/* label + stacked status tags */}
            <div
              className="absolute left-1/2 flex flex-col items-center gap-1 pointer-events-none"
              style={{ transform: 'translateX(-50%)', [labelAbove ? 'bottom' : 'top']: size * 0.5 + 14, [labelAbove ? 'top' : 'bottom']: 'auto' } as React.CSSProperties}
            >
              <span
                className="font-mono text-[11px] tracking-[0.16em] whitespace-nowrap"
                style={{ color: '#cfe6ff', textShadow: '0 1px 5px #000, 0 0 10px rgba(56,189,248,0.4)' }}
              >
                {p.node.name.toUpperCase().length > 16 ? p.node.name.toUpperCase().slice(0, 15) + '…' : p.node.name.toUpperCase()}
              </span>
              <div className="flex flex-col gap-[3px] items-stretch min-w-[78px]">
                <Tag text={p.online ? 'ACTIVE' : 'INACTIVE'} on={p.online} />
                <Tag text={p.busy ? 'WORKING' : 'IDLE'} on={p.busy} />
              </div>
            </div>

            <PlasmaOrb size={size} color={color} online={p.online} busy={p.busy} highlight={hovered || sel} seed={hRand(p.node.id, 7)} />
          </div>
        );
      })}

      {/* ── HUD frame ── */}
      <FrameCorners />

      {/* Top-center status strip */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 font-mono text-[10px]">
        <span className="px-2 py-1 border border-white/10 bg-[#050505]/80 text-[#b8b8b8]">
          <span className="text-emerald-400">●</span> {onlineCount}/{placed.length} ONLINE
        </span>
        <span className="px-2 py-1 border border-white/10 bg-[#050505]/80 text-[#b8b8b8]">
          <span style={{ color: '#ff6a3d' }}>◆</span> {workingCount} WORKING
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setPulse((s) => !s); }}
          className={`px-2 py-1 border bg-[#050505]/80 ${pulse ? 'border-[#f64e6e] text-[#f64e6e]' : 'border-white/10 text-[#b8b8b8] hover:border-white/30'}`}
        >
          PULSE
        </button>
      </div>

      {error && (
        <div className="absolute bottom-3 right-3 z-[60] px-2 py-1 border border-red-400/40 bg-[#050505]/80 text-red-400 font-mono text-[10px]">
          ⚠ {error}
        </div>
      )}
      {isLoading && !error && (
        <div className="absolute bottom-3 right-3 z-[60] px-2 py-1 border border-white/10 bg-[#050505]/80 text-[#b8b8b8] font-mono text-[10px]">
          syncing…
        </div>
      )}

      {/* ── AGENT COMMS panel (top-left) ── */}
      <div
        className="absolute top-10 left-4 z-[58] w-[218px] bg-[#05070b]/82 border border-white/12 backdrop-blur-[2px]"
        style={{ boxShadow: '0 0 24px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-2.5 h-[24px] flex items-center justify-between border-b border-white/10">
          <span className="font-mono text-[9px] tracking-[0.22em] text-[#9aa3b5]">AGENT COMMS</span>
          <span className="font-mono text-[8px] text-emerald-400">● LIVE</span>
        </div>
        <div className="p-2 flex flex-col gap-1.5">
          {feed.length === 0 && <span className="font-mono text-[9px] text-[#545454]">awaiting agents…</span>}
          {feed.map((p) => {
            const c = orbColor(p.online, p.busy);
            return (
              <div key={p.node.id} className="flex items-center gap-1.5">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}`, flex: '0 0 auto' }} />
                <span className="font-mono text-[9px] text-[#cdd3df] truncate flex-1">{p.node.name.toUpperCase()}</span>
                <span className="font-mono text-[8px]" style={{ color: c }}>{p.busy ? 'WORKING' : p.online ? 'IDLE' : 'OFFLINE'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AGENT TRACKING panel (top-right) ── */}
      <div
        className="absolute top-10 right-4 z-[58] w-[208px] bg-[#05070b]/82 border border-white/12 backdrop-blur-[2px]"
        style={{ boxShadow: '0 0 24px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-2.5 h-[24px] flex items-center justify-between border-b border-white/10">
          <span className="font-mono text-[9px] tracking-[0.2em] text-[#9aa3b5]">AGENT TRACKING</span>
          <span className="font-mono text-[8px] text-[#566]">{placed.length} NODES</span>
        </div>
        <div className="p-2 grid grid-cols-8 gap-1.5">
          {placed.map((p) => {
            const c = orbColor(p.online, p.busy);
            const on = p.node.id === hoveredId || p.node.id === selectedId;
            return (
              <button
                key={p.node.id}
                title={p.node.name}
                onMouseEnter={() => setHoveredId(p.node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(e) => { e.stopPropagation(); setSelectedId((x) => (x === p.node.id ? null : p.node.id)); }}
                style={{
                  height: 12, borderRadius: 2, background: c,
                  opacity: p.online ? 1 : 0.5,
                  outline: on ? `1.5px solid ${c}` : 'none', outlineOffset: 1,
                  boxShadow: p.busy ? `0 0 6px ${c}` : 'none',
                  animation: p.busy ? 'nx-orbpulse 1.4s ease-in-out infinite' : 'none',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Selected detail card */}
      {selected && (
        <div
          className="absolute bottom-4 left-4 z-[70] w-[240px] bg-[#05070b]/95 border"
          style={{ borderColor: orbColor(selected.online, selected.busy) + '66' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 h-[28px] flex items-center justify-between border-b" style={{ borderColor: orbColor(selected.online, selected.busy) + '33' }}>
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: orbColor(selected.online, selected.busy) }}>
              {selected.node.name}
            </span>
            <button onClick={() => setSelectedId(null)} className="text-[#545454] hover:text-white text-[11px]">✕</button>
          </div>
          <div className="p-3 font-mono text-[10px] text-[#b8b8b8] flex flex-col gap-1">
            <Row k="POWER" val={selected.online ? 'ACTIVE' : 'INACTIVE'} color={selected.online ? '#10b981' : '#545454'} />
            <Row k="WORK" val={selected.busy ? 'WORKING' : 'IDLE'} color={selected.busy ? '#ff6a3d' : '#545454'} />
            <Row k="SQUAD" val={selected.node.squad || '—'} />
            <Row k="RUNNING" val={String(selected.node.tasks_running ?? 0)} />
            <Row k="QUEUE" val={String(selected.node.queue_depth ?? 0)} />
            <Row k="TYPE" val={selected.node.type} />
          </div>
        </div>
      )}

      {placed.length === 0 && !isLoading && (
        <div className="absolute left-1/2 z-[55] font-mono text-[11px] text-[#545454]" style={{ top: '66%', transform: 'translateX(-50%)' }}>
          No agents on the wire. Create one in Agent Hub.
        </div>
      )}
    </div>
  );
}

// ── Particle-burst orb ────────────────────────────────────────────────────
function PlasmaOrb({ size, color, online, busy, highlight, seed }: { size: number; color: string; online: boolean; busy: boolean; highlight: boolean; seed: number }) {
  const plumes = [0, 1, 2, 3];
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* wide outer glow */}
      <div style={{
        position: 'absolute', inset: -size * 0.5, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}55 0%, ${color}18 42%, transparent 72%)`,
        filter: 'blur(4px)', opacity: online ? (highlight ? 1 : 0.8) : 0.45,
      }} />
      {/* turbulent plumes (nebula feel) — static offset, flickering opacity */}
      {plumes.map((i) => {
        const a = (seed * 6.28 + i * 1.57);
        const r = size * (0.14 + ((i % 2) * 0.11));
        return (
          <div key={i} style={{
            position: 'absolute', left: '50%', top: '50%',
            width: size * 0.6, height: size * 0.6, borderRadius: '50%',
            background: `radial-gradient(circle at 50% 50%, ${i % 2 ? color : '#fff'}aa, transparent 60%)`,
            transform: `translate(-50%,-50%) translate(${Math.cos(a) * r}px, ${Math.sin(a) * r * 0.85}px)`,
            mixBlendMode: 'screen', filter: 'blur(2.5px)',
            animation: `nx-plume ${1.8 + i * 0.6}s ease-in-out ${i * 0.4}s infinite`,
            opacity: online ? 0.85 : 0.45,
          }} />
        );
      })}
      {/* body */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `radial-gradient(circle at 40% 36%, #fff 0%, ${color} 40%, ${color}33 76%, transparent 92%)`,
        boxShadow: `0 0 ${busy ? 30 : 18}px ${color}${busy ? 'dd' : '99'}, inset 0 0 16px ${color}cc`,
        border: `1px solid ${color}${highlight ? 'ff' : '99'}`,
        animation: busy ? 'nx-orbpulse 1.4s ease-in-out infinite' : online ? 'nx-orbpulse 3.2s ease-in-out infinite' : 'none',
        opacity: online ? 1 : 0.72,
      }} />
      {/* hot center */}
      <div style={{
        position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%)',
        width: size * 0.3, height: size * 0.3, borderRadius: '50%',
        background: 'radial-gradient(circle, #fff, transparent 65%)',
      }} />
    </div>
  );
}

function Tag({ text, on }: { text: string; on: boolean }) {
  // Reference uses amber/orange tags; muted when the dimension is off.
  const bg = on ? 'rgba(255,106,61,0.22)' : 'rgba(148,120,90,0.14)';
  const bd = on ? 'rgba(255,106,61,0.6)' : 'rgba(160,130,100,0.4)';
  const fg = on ? '#ffb088' : '#a08a73';
  return (
    <span
      className="font-mono text-[8px] tracking-[0.16em] px-1.5 py-[2px] leading-none uppercase text-center"
      style={{ color: fg, background: bg, border: `1px solid ${bd}` }}
    >
      {text}
    </span>
  );
}

function FrameCorners() {
  const c = 'rgba(120,150,190,0.45)';
  const common = 'absolute w-6 h-6 pointer-events-none';
  return (
    <div className="absolute inset-0 pointer-events-none z-[57]">
      <div className="absolute inset-2 border border-white/[0.06]" />
      <div className={`${common} top-2 left-2`} style={{ borderTop: `2px solid ${c}`, borderLeft: `2px solid ${c}` }} />
      <div className={`${common} top-2 right-2`} style={{ borderTop: `2px solid ${c}`, borderRight: `2px solid ${c}` }} />
      <div className={`${common} bottom-2 left-2`} style={{ borderBottom: `2px solid ${c}`, borderLeft: `2px solid ${c}` }} />
      <div className={`${common} bottom-2 right-2`} style={{ borderBottom: `2px solid ${c}`, borderRight: `2px solid ${c}` }} />
    </div>
  );
}

function Row({ k, val, color }: { k: string; val: string; color?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#545454]">{k}</span>
      <span style={{ color: color || '#fff' }}>{val}</span>
    </div>
  );
}

function NexusStyles() {
  return (
    <style>{`
      @keyframes nx-orbpulse { 0%,100%{ transform: scale(1); } 50%{ transform: scale(1.06); } }
      @keyframes nx-plume { 0%,100%{ opacity: 0.35; } 50%{ opacity: 0.95; } }
    `}</style>
  );
}
