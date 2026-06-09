// Ghost Network — "Agent Nexus" reactor dashboard.
//
// A central energy core (the orchestrator) with live Hermes agents radiating
// outward on curved plasma tendrils. Each agent is a glowing orb colour-coded by
// state: orange/coral when ACTIVE/WORKING, cyan when INACTIVE/IDLE. Flowing
// particles travel the tendrils of agents that are currently running work.
//
// 100% live: agents come from the Hermes bridge via useGhostStore. No mock data.
import { useState, useEffect, useRef, useMemo } from 'react';
import { useGhostStore, type GhostNode } from '../stores/useGhostStore';
import { hRand } from '../components/cyberpunk/util';

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

// Colour ramp for an agent orb based on its live state.
function orbColor(online: boolean, busy: boolean): string {
  if (busy) return '#ff6a3d';        // WORKING — hot orange
  if (online) return '#f59e0b';      // ACTIVE/IDLE — amber
  return '#38bdf8';                  // INACTIVE — cyan
}

// Curved tendril from the core to a node (quadratic bezier bowed perpendicular).
function tendril(cx: number, cy: number, x: number, y: number): string {
  const mx = (cx + x) / 2;
  const my = (cy + y) / 2;
  const dx = x - cx;
  const dy = y - cy;
  const off = 0.16;
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

  // Split out the core/orchestrator; everything else radiates around it.
  const { core, placed } = useMemo(() => {
    const live = nodes.filter((n) => n.type !== 'squad');
    const coreNode = live.find((n) => n.type === 'core');
    const others = live.filter((n) => n.id !== coreNode?.id);

    const cx = dims.w / 2;
    const cy = dims.h / 2;
    const base = Math.min(dims.w, dims.h);
    const widen = dims.w > dims.h ? Math.min(1.55, dims.w / dims.h) : 1;
    const padX = 96;
    const padY = 78;
    const N = Math.max(others.length, 1);

    const items: Placed[] = others.map((n, i) => {
      const ring = i % 2;                                   // alternate two rings
      const rad = base * (ring === 0 ? 0.30 : 0.42);
      const ang = -Math.PI / 2 + (i / N) * Math.PI * 2 + (hRand(n.id) - 0.5) * 0.14;
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

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0b0d14 0%, #050507 70%, #030304 100%)' }}
      onClick={() => setSelectedId(null)}
    >
      <NexusStyles />
      {/* faint tech grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(120,140,180,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(120,140,180,0.08) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'radial-gradient(ellipse at center, #000 35%, transparent 85%)',
        }}
      />

      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-[60] flex items-center gap-2 font-mono text-[10px]">
        <span className="px-2 py-1 border border-white/10 bg-[#050505]/80 text-[#b8b8b8]">
          <span className="text-emerald-400">●</span> {onlineCount}/{placed.length} ONLINE
        </span>
        <span className="px-2 py-1 border border-white/10 bg-[#050505]/80 text-[#b8b8b8]">
          <span style={{ color: '#ff6a3d' }}>◆</span> {workingCount} WORKING
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setPulse((p) => !p); }}
          className={`px-2 py-1 border bg-[#050505]/80 ${pulse ? 'border-[#f64e6e] text-[#f64e6e]' : 'border-white/10 text-[#b8b8b8] hover:border-white/30'}`}
        >
          PULSE
        </button>
      </div>

      {error && (
        <div className="absolute top-3 left-3 z-[60] px-2 py-1 border border-red-400/40 bg-[#050505]/80 text-red-400 font-mono text-[10px]">
          ⚠ {error}
        </div>
      )}
      {isLoading && !error && (
        <div className="absolute top-3 left-3 z-[60] px-2 py-1 border border-white/10 bg-[#050505]/80 text-[#b8b8b8] font-mono text-[10px]">
          syncing…
        </div>
      )}

      {/* SVG: tendrils + flowing particles */}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="nx-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {placed.map((p) => {
          const path = tendril(cx, cy, p.x, p.y);
          const color = orbColor(p.online, p.busy);
          const active = p.node.id === hoveredId || p.node.id === selectedId;
          const baseOpacity = p.online ? 0.5 : 0.2;
          return (
            <g key={p.node.id}>
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={active ? 2 : p.busy ? 1.4 : 0.9}
                opacity={active ? 0.95 : baseOpacity}
                filter="url(#nx-glow)"
              />
              {/* flowing energy particles for agents that are running work */}
              {pulse && p.busy && (
                <>
                  <circle r="3" fill="#fff">
                    <animateMotion dur="1.9s" repeatCount="indefinite" path={path} />
                    <animate attributeName="opacity" values="0;1;1;0" dur="1.9s" repeatCount="indefinite" />
                  </circle>
                  <circle r="2" fill={color} filter="url(#nx-glow)">
                    <animateMotion dur="2.6s" begin="0.7s" repeatCount="indefinite" path={path} />
                    <animate attributeName="opacity" values="0;1;1;0" dur="2.6s" begin="0.7s" repeatCount="indefinite" />
                  </circle>
                </>
              )}
              {/* a slow drift particle on merely-online tendrils */}
              {pulse && p.online && !p.busy && (
                <circle r="1.6" fill={color} opacity="0.8" filter="url(#nx-glow)">
                  <animateMotion dur="4.6s" repeatCount="indefinite" path={path} />
                  <animate attributeName="opacity" values="0;0.8;0.8;0" dur="4.6s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* Central reactor core */}
      <CoreReactor cx={cx} cy={cy} online={coreOnline} label={core ? core.name.toUpperCase() : 'ORCHESTRATOR'} />

      {/* Agent orbs */}
      {placed.map((p) => {
        const color = orbColor(p.online, p.busy);
        const hovered = hoveredId === p.node.id;
        const sel = selectedId === p.node.id;
        const dimmed = (hoveredId || selectedId) && !hovered && !sel;
        const size = (p.node.val >= 4 ? 64 : 54) + (p.busy ? 10 : 0);
        const labelAbove = p.y > cy; // nodes in the lower half get labels above
        return (
          <div
            key={p.node.id}
            className="absolute"
            style={{
              left: p.x, top: p.y, transform: 'translate(-50%, -50%)',
              zIndex: hovered || sel ? 50 : 20,
              opacity: dimmed ? 0.4 : 1, transition: 'opacity 0.25s', cursor: 'pointer',
            }}
            onMouseEnter={() => setHoveredId(p.node.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={(e) => { e.stopPropagation(); setSelectedId((c) => (c === p.node.id ? null : p.node.id)); }}
          >
            {/* label + status badges */}
            <div
              className="absolute left-1/2 flex flex-col items-center gap-1 pointer-events-none"
              style={{ transform: 'translateX(-50%)', [labelAbove ? 'bottom' : 'top']: size * 0.5 + 12, [labelAbove ? 'top' : 'bottom']: 'auto' } as React.CSSProperties}
            >
              <span
                className="font-mono text-[11px] tracking-[0.12em] whitespace-nowrap"
                style={{ color: '#e8e8ef', textShadow: '0 1px 4px #000' }}
              >
                {p.node.name.toUpperCase().length > 16 ? p.node.name.toUpperCase().slice(0, 15) + '…' : p.node.name.toUpperCase()}
              </span>
              <div className="flex gap-1">
                <Badge text={p.online ? 'ACTIVE' : 'INACTIVE'} on={p.online} />
                <Badge text={p.busy ? 'WORKING' : 'IDLE'} on={p.busy} amber />
              </div>
            </div>

            <PlasmaOrb size={size} color={color} online={p.online} busy={p.busy} highlight={hovered || sel} />
          </div>
        );
      })}

      {/* Selected detail card */}
      {selected && (
        <div
          className="absolute bottom-3 left-3 z-[70] w-[240px] bg-[#050505]/95 border"
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

      {/* Empty state */}
      {placed.length === 0 && !isLoading && (
        <div className="absolute left-1/2 z-[55] font-mono text-[11px] text-[#545454]" style={{ top: '64%', transform: 'translateX(-50%)' }}>
          No agents on the wire. Create one in Agent Hub.
        </div>
      )}
    </div>
  );
}

// ── Central reactor ───────────────────────────────────────────────────────
function CoreReactor({ cx, cy, online, label }: { cx: number; cy: number; online: boolean; label: string }) {
  const tint = online ? '#ff7a3c' : '#38bdf8';
  return (
    <div className="absolute pointer-events-none" style={{ left: cx, top: cy, transform: 'translate(-50%, -50%)', zIndex: 30 }}>
      {/* outer aura */}
      <div className="absolute" style={{
        left: '50%', top: '50%', width: 320, height: 320, transform: 'translate(-50%,-50%)',
        background: `radial-gradient(circle, ${tint}33 0%, ${tint}11 35%, transparent 68%)`,
        borderRadius: '50%', filter: 'blur(4px)',
      }} />
      {/* rotating rings */}
      {[150, 116, 84].map((d, i) => (
        <div key={d} className="absolute" style={{
          left: '50%', top: '50%', width: d, height: d, transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          border: `2px solid ${i === 1 ? '#38bdf8' : tint}`,
          borderTopColor: 'transparent', borderRightColor: i === 1 ? tint + '88' : 'transparent',
          opacity: 0.55 - i * 0.08,
          boxShadow: `0 0 18px ${tint}55, inset 0 0 14px ${tint}33`,
          animation: `nx-spin ${10 + i * 6}s linear ${i % 2 ? 'reverse' : 'normal'} infinite`,
        }} />
      ))}
      {/* hot core */}
      <div className="absolute" style={{
        left: '50%', top: '50%', width: 46, height: 46, transform: 'translate(-50%,-50%)',
        borderRadius: '50%',
        background: `radial-gradient(circle, #fff 0%, ${tint} 45%, ${tint}00 75%)`,
        boxShadow: `0 0 40px 10px ${tint}aa`,
        animation: 'nx-corepulse 2.4s ease-in-out infinite',
      }} />
      {/* label */}
      <div className="absolute font-mono whitespace-nowrap" style={{
        left: '50%', top: 96, transform: 'translateX(-50%)', textShadow: '0 1px 6px #000',
      }}>
        <span className="text-[12px] tracking-[0.22em] text-[#9aa3b5]">MAIN AGENT: </span>
        <span className="text-[12px] tracking-[0.22em] font-bold" style={{ color: online ? '#ff6a3d' : '#38bdf8' }}>
          {online ? 'ACTIVE' : 'STANDBY'}
        </span>
        <div className="text-[9px] tracking-[0.3em] text-[#545454] text-center mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ── Plasma orb ────────────────────────────────────────────────────────────
function PlasmaOrb({ size, color, online, busy, highlight }: { size: number; color: string; online: boolean; busy: boolean; highlight: boolean }) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* glow */}
      <div style={{
        position: 'absolute', inset: -size * 0.35, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}66 0%, ${color}22 40%, transparent 70%)`,
        filter: 'blur(3px)', opacity: online ? (highlight ? 1 : 0.85) : 0.5,
      }} />
      {/* body */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: `radial-gradient(circle at 38% 34%, #fff8, ${color} 42%, ${color}22 78%, transparent 92%)`,
        boxShadow: `0 0 ${busy ? 26 : 16}px ${color}${busy ? 'cc' : '88'}, inset 0 0 14px ${color}aa`,
        border: `1px solid ${color}${highlight ? 'ff' : '88'}`,
        animation: busy ? 'nx-orbpulse 1.5s ease-in-out infinite' : online ? 'nx-orbpulse 3.4s ease-in-out infinite' : 'none',
        opacity: online ? 1 : 0.7,
      }} />
      {/* turbulence speckle */}
      <div style={{
        position: 'absolute', inset: size * 0.16, borderRadius: '50%',
        background: `radial-gradient(circle at 64% 66%, ${color}cc, transparent 55%)`,
        mixBlendMode: 'screen', animation: 'nx-orbspin 6s linear infinite',
      }} />
    </div>
  );
}

function Badge({ text, on, amber }: { text: string; on: boolean; amber?: boolean }) {
  const color = on ? (amber ? '#ff6a3d' : '#10b981') : '#6b7280';
  return (
    <span
      className="font-mono text-[8px] tracking-[0.14em] px-1.5 py-[2px] leading-none uppercase"
      style={{ color, background: `${color}1f`, border: `1px solid ${color}55` }}
    >
      {text}
    </span>
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
      @keyframes nx-spin { to { transform: translate(-50%,-50%) rotate(360deg); } }
      @keyframes nx-corepulse { 0%,100%{ transform: translate(-50%,-50%) scale(1); opacity:1; } 50%{ transform: translate(-50%,-50%) scale(1.18); opacity:0.85; } }
      @keyframes nx-orbpulse { 0%,100%{ transform: scale(1); } 50%{ transform: scale(1.07); } }
      @keyframes nx-orbspin { to { transform: rotate(360deg); } }
    `}</style>
  );
}
