import { useState, useMemo, useRef, useEffect } from 'react';
import { Square, Settings, RefreshCw, Plus, Clock, ListChecks } from 'lucide-react';
import { cn } from '../components/Layout';
import { useGhostStore } from '../stores/useGhostStore';
import type { GhostNode } from '../stores/useGhostStore';
import { formatDistanceToNow } from 'date-fns';

const mockTimeline = [
  { task: 'Trend Analysis', start: 0, w: 40, color: 'bg-indigo-500' },
  { task: 'Data Scrape', start: 30, w: 20, color: 'bg-emerald-500' },
  { task: 'Draft Generation', start: 55, w: 30, color: 'bg-[#f64e6e]' },
];

// ─── Pure helpers ────────────────────────────────────────────────────────────

function nodeBaseColor(node: GhostNode): string {
  if (node.type === 'core') return '#f64e6e';
  if (node.type === 'squad') return '#38bdf8';
  if (node.model === 'sonnet') return '#4f46e5';
  if (node.model === 'haiku') return '#10b981';
  if (node.model === 'gpt4o') return '#6366f1';
  if (node.type === 'runner') return '#64748b';
  return '#94a3b8';
}

function statusDotColor(status?: string): string {
  if (status === 'active') return '#10b981';
  if (status === 'idle') return '#fbbf24';
  return '#475569';
}

function nodeRadius(node: GhostNode): number {
  if (node.type === 'core') return 18;
  if (node.type === 'squad') return 12;
  return 7;
}

// ─── Layout engine ───────────────────────────────────────────────────────────
// Positions are computed once from structure and cached in useMemo.
// Status / task changes NEVER re-trigger layout because they aren't in deps.

interface LayoutLink { from: string; to: string; type: 'command' | 'assign' }

function computeLayout(
  nodes: GhostNode[],
  width: number,
  height: number,
): { positions: Map<string, { x: number; y: number }>; links: LayoutLink[] } {
  const positions = new Map<string, { x: number; y: number }>();
  const links: LayoutLink[] = [];

  if (width === 0 || height === 0) return { positions, links };

  const cx = width / 2;
  const cy = height / 2;
  const minDim = Math.min(width, height);
  const R1 = minDim * 0.26;  // squad ring radius
  const R2 = minDim * 0.14;  // agent orbit radius around squad

  const isCore  = (n: GhostNode) => n.name === 'Kate' || n.type?.toLowerCase() === 'core';
  const isSquad = (n: GhostNode) => n.type?.toLowerCase() === 'squad' || n.id.startsWith('squad-');

  const orch = nodes.find(isCore);
  // If no orchestrator found at all, layout everything in a flat ring
  if (!orch) {
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i / nodes.length) - Math.PI / 2;
      positions.set(n.id, { x: cx + R1 * Math.cos(angle), y: cy + R1 * Math.sin(angle) });
    });
    return { positions, links };
  }

  positions.set(orch.id, { x: cx, y: cy });

  const squadNodes = nodes.filter(n => !isCore(n) && isSquad(n));
  const agentNodes = nodes.filter(n => !isCore(n) && !isSquad(n));

  // Group agents by their squad virtual node id
  const agentsBySquad = new Map<string, GhostNode[]>();
  agentNodes.forEach(agent => {
    if (agent.squad) {
      const key = `squad-${agent.squad}`;
      if (!agentsBySquad.has(key)) agentsBySquad.set(key, []);
      agentsBySquad.get(key)!.push(agent);
    }
  });

  // Place squad nodes evenly around a circle
  squadNodes.forEach((squad, i) => {
    const angle = (2 * Math.PI * i / squadNodes.length) - Math.PI / 2;
    const sx = cx + R1 * Math.cos(angle);
    const sy = cy + R1 * Math.sin(angle);
    positions.set(squad.id, { x: sx, y: sy });
    links.push({ from: orch.id, to: squad.id, type: 'command' });

    // Fan agents around their squad node
    const agents = agentsBySquad.get(squad.id) || [];
    const spread = Math.min(Math.PI * 0.75, agents.length * 0.35);
    agents.forEach((agent, j) => {
      const offset = agents.length > 1
        ? -spread / 2 + (spread / (agents.length - 1)) * j
        : 0;
      const aAngle = angle + offset;
      positions.set(agent.id, {
        x: sx + R2 * Math.cos(aAngle),
        y: sy + R2 * Math.sin(aAngle),
      });
      links.push({ from: squad.id, to: agent.id, type: 'assign' });
    });
  });

  // Agents with no squad orbit the orchestrator directly
  const loneAgents = agentNodes.filter(a => !a.squad);
  loneAgents.forEach((agent, i) => {
    const angle = (2 * Math.PI * i / Math.max(1, loneAgents.length));
    positions.set(agent.id, {
      x: cx + R1 * 1.6 * Math.cos(angle),
      y: cy + R1 * 1.6 * Math.sin(angle),
    });
    links.push({ from: orch.id, to: agent.id, type: 'assign' });
  });

  return { positions, links };
}


// ─── Component ───────────────────────────────────────────────────────────────

export default function GhostNetwork() {
  const { nodes, fetchTopology } = useGhostStore();
  const [selectedNode, setSelectedNode] = useState<GhostNode | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Polling
  useEffect(() => {
    fetchTopology();
    const interval = setInterval(fetchTopology, 10000);
    return () => clearInterval(interval);
  }, [fetchTopology]);

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', updateSize);
    setTimeout(updateSize, 100);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Structural key — only changes when agents join / leave squads.
  // Status / task updates do NOT change this, so layout is never re-computed on polls.
  const structureKey = useMemo(
    () => nodes.map(n => `${n.id}:${n.type}:${n.squad ?? ''}`).sort().join('|'),
    [nodes],
  );

  // Layout is memoised on structureKey + size — never on status/tasks
  const layout = useMemo(
    () => computeLayout(nodes, containerSize.width, containerSize.height),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [structureKey, containerSize],
  );

  // Keep the side-panel node data fresh after polls without triggering layout
  useEffect(() => {
    if (selectedNode) {
      const fresh = nodes.find(n => n.id === selectedNode.id);
      if (fresh) setSelectedNode(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes]);

  return (
    <div className="h-full w-full flex relative overflow-hidden bg-bg-deep">

      {/* ── SVG Canvas ────────────────────────────────────────────────────── */}
      <div className="flex-1 relative min-w-0" ref={containerRef}>

        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={() => fetchTopology()}
            className="rounded-full bg-bg-card border border-border-subtle p-2 hover:bg-border-subtle hover:text-white text-text-secondary transition-colors"
            title="Refresh Topology"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="rounded-full bg-bg-card border border-border-subtle p-2 hover:bg-border-subtle hover:text-white text-text-secondary transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <svg
          width={containerSize.width}
          height={containerSize.height}
          className="absolute inset-0"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >

          <defs>
            {/* Glow filter – core / orchestrator */}
            <filter id="glow-coral" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Glow filter – active agents */}
            <filter id="glow-green" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Animated pulse ring keyframes */}
            <style>{`
              @keyframes pulse-ring {
                0%   { r: 20; opacity: 0.6; }
                100% { r: 32; opacity: 0; }
              }
              .pulse-anim { animation: pulse-ring 1.8s ease-out infinite; }
            `}</style>
          </defs>

          {/* ── Links ──────────────────────────────────────────────────── */}
          {layout.links.map((link, i) => {
            const from = layout.positions.get(link.from);
            const to   = layout.positions.get(link.to);
            if (!from || !to) return null;
            return (
              <line
                key={`link-${i}`}
                x1={from.x} y1={from.y}
                x2={to.x}   y2={to.y}
                stroke={link.type === 'command'
                  ? 'rgba(255,255,255,0.22)'
                  : 'rgba(255,255,255,0.09)'}
                strokeWidth={link.type === 'command' ? 1.5 : 1}
                strokeDasharray={link.type === 'assign' ? '4 4' : undefined}
              />
            );
          })}

          {/* ── Nodes ──────────────────────────────────────────────────── */}
          {nodes.map(node => {
            const pos = layout.positions.get(node.id);
            if (!pos) return null;

            const r       = nodeRadius(node);
            const color   = nodeBaseColor(node);
            const isCore  = node.type === 'core';
            const isOffline = !node.status || node.status === 'offline';
            const isActive  = node.status === 'active';
            const isSquad   = node.type === 'squad';
            const fillColor = isOffline && !isSquad ? color + '44' : color;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x},${pos.y})`}
                onClick={() => setSelectedNode(node)}
                style={{ cursor: 'pointer' }}
              >
                {/* Animated pulse ring for core */}
                {isCore && (
                  <circle
                    className="pulse-anim"
                    r={20}
                    fill="none"
                    stroke="#f64e6e"
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                )}

                {/* Soft glow ring for active agents */}
                {isActive && !isCore && (
                  <circle
                    r={r + 5}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1"
                    opacity="0.35"
                  />
                )}

                {/* Main circle */}
                <circle
                  r={r}
                  fill={fillColor}
                  stroke={isCore ? '#f64e6e' : isSquad ? '#38bdf833' : 'rgba(255,255,255,0.08)'}
                  strokeWidth={isCore ? 2 : 1}
                  filter={isCore ? 'url(#glow-coral)' : isActive ? 'url(#glow-green)' : undefined}
                />

                {/* Status dot (non-squad only) */}
                {!isSquad && node.status && (
                  <circle
                    cx={r * 0.65}
                    cy={-r * 0.65}
                    r={2.5}
                    fill={statusDotColor(node.status)}
                  />
                )}

                {/* Label */}
                <text
                  y={r + 13}
                  textAnchor="middle"
                  fontSize={isSquad ? 9 : 8}
                  fontWeight={isSquad || isCore ? '700' : '400'}
                  fill={isOffline && !isSquad ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)'}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.name.length > 20 ? node.name.slice(0, 18) + '…' : node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Details Side Panel ────────────────────────────────────────────── */}
      <div
        className={cn(
          'w-full md:w-80 lg:w-96 bg-bg-card border-l border-border-subtle absolute md:relative right-0 top-0 h-full z-20 flex flex-col shadow-2xl',
        )}
        style={{ display: selectedNode ? 'flex' : 'none' }}
      >
        {selectedNode && (
          <div className="p-6 h-full flex flex-col overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">{selectedNode.name}</h3>
                <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#f64e6e]">
                  {selectedNode.type} • {selectedNode.id.slice(0, 16)}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-text-secondary hover:text-white rounded-full p-1 bg-black/50 border border-border-subtle"
              >
                &times;
              </button>
            </div>

            <div className="space-y-8 flex-1">
              {/* Queue Status */}
              <div>
                <h4 className="text-xs font-bold text-text-tertiary mb-3 uppercase tracking-widest flex items-center gap-2">
                  <ListChecks className="w-3 h-3" /> Queue Status
                </h4>
                <div className="bg-bg-deep p-4 rounded-xl border border-border-subtle flex flex-col gap-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Connectivity</span>
                    <span className={`font-bold uppercase tracking-widest text-[10px] px-2 py-0.5 rounded-full border ${
                      selectedNode.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                      selectedNode.status === 'idle'   ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                      'bg-white/5 text-text-tertiary border-white/10'
                    }`}>
                      {selectedNode.status || 'OFFLINE'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Last Heartbeat</span>
                    <span className="font-mono text-[10px] text-text-tertiary">
                      {selectedNode.last_active
                        ? formatDistanceToNow(new Date(selectedNode.last_active), { addSuffix: true })
                        : 'Never'}
                    </span>
                  </div>
                  <div className="h-px bg-border-subtle my-1" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Active Tasks</span>
                    <span className={`font-mono ${selectedNode.has_active_work ? 'text-emerald-400 font-bold' : 'text-text-tertiary'}`}>
                      {selectedNode.tasks_running ?? 0} Running
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Pending Queue</span>
                    <span className="font-mono text-amber-500">{selectedNode.queue_depth ?? 0} Items</span>
                  </div>
                  <div className="w-full h-1.5 bg-border-subtle rounded-full overflow-hidden">
                    <div
                      className={`h-full ${selectedNode.has_active_work ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-text-tertiary'}`}
                      style={{ width: `${Math.min(100, ((selectedNode.queue_depth || 0) + (selectedNode.tasks_running || 0)) * 10)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Execution Timeline */}
              <div>
                <h4 className="text-xs font-bold text-text-tertiary mb-3 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Execution Timeline
                </h4>
                <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[4px] before:w-px before:bg-border-subtle pl-4">
                  {mockTimeline.map((item, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full bg-border-subtle ring-2 ring-bg-card" />
                      <div className="text-xs text-text-secondary mb-1">{item.task}</div>
                      <div className="w-full bg-bg-deep h-4 rounded overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded opacity-80`}
                          style={{ marginLeft: `${item.start}%`, width: `${item.w}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-border-subtle space-y-3 mt-6">
              <button className="rounded-full w-full bg-gradient-to-r from-[#f64e6e] to-[#ff795e] text-white py-3 flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs hover:shadow-[0_0_20px_-5px_#f64e6e] transition-shadow">
                <Plus className="w-4 h-4" /> Spawn Sub-Agent
              </button>
              {selectedNode.type !== 'core' && (
                <button className="rounded-full w-full bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 py-2.5 flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs transition-colors">
                  <Square className="w-4 h-4" /> Terminate Instance
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
