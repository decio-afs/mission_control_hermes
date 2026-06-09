// AgentPerformance — a per-agent operational leaderboard for the War Room.
//
// Renders the analytics produced by computeAgentMetrics() (pure aggregation of
// the live Hermes task queue): throughput (done), in-flight load, failure count,
// success rate, average task duration and 24h completions — ranked best-first.
// No bridge endpoint of its own; it consumes the already-polled task store.
import type { AgentMetric } from '../lib/agentMetrics';
import { fmtDuration } from '../lib/agentMetrics';

function rateTone(rate: number | null): string {
  if (rate == null) return 'text-[#545454]';
  if (rate >= 0.85) return 'text-emerald-400';
  if (rate >= 0.6) return 'text-amber-400';
  return 'text-red-400';
}

export default function AgentPerformance({ metrics }: { metrics: AgentMetric[] }) {
  if (metrics.length === 0) {
    return <div className="text-[10px] font-mono text-[#545454] p-1">No assigned tasks yet — performance accrues as agents claim and complete work.</div>;
  }

  // Scale the throughput bar to the busiest agent so the ranking reads at a glance.
  const maxDone = Math.max(1, ...metrics.map((m) => m.done));

  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-[10px] font-mono border-collapse">
        <thead className="sticky top-0 bg-[#0A0A0A] z-10">
          <tr className="text-[#545454] text-left">
            <th className="font-normal tracking-[0.12em] uppercase py-1 pr-2">Agent</th>
            <th className="font-normal tracking-[0.12em] uppercase py-1 px-2 text-right">Done</th>
            <th className="font-normal tracking-[0.12em] uppercase py-1 px-2 text-right hidden sm:table-cell">Run</th>
            <th className="font-normal tracking-[0.12em] uppercase py-1 px-2 text-right hidden sm:table-cell">Fail</th>
            <th className="font-normal tracking-[0.12em] uppercase py-1 px-2 text-right">Rate</th>
            <th className="font-normal tracking-[0.12em] uppercase py-1 px-2 text-right">Avg</th>
            <th className="font-normal tracking-[0.12em] uppercase py-1 pl-2 text-right hidden md:table-cell">24h</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.agent} className="border-t border-white/5 hover:bg-white/[0.02]">
              <td className="py-1 pr-2 max-w-0">
                <div className="text-[#b8b8b8] truncate" title={m.agent}>{m.agent}</div>
                <div className="h-1 mt-0.5 bg-[#080808] relative">
                  <div className="absolute inset-y-0 left-0 bg-[#f64e6e]/70" style={{ width: `${(m.done / maxDone) * 100}%` }} />
                </div>
              </td>
              <td className="py-1 px-2 text-right tabular-nums text-white">{m.done}</td>
              <td className="py-1 px-2 text-right tabular-nums text-amber-400 hidden sm:table-cell">{m.running}</td>
              <td className="py-1 px-2 text-right tabular-nums text-[#545454] hidden sm:table-cell">{m.failed}</td>
              <td className={`py-1 px-2 text-right tabular-nums ${rateTone(m.successRate)}`}>
                {m.successRate == null ? '—' : `${Math.round(m.successRate * 100)}%`}
              </td>
              <td className="py-1 px-2 text-right tabular-nums text-[#b8b8b8]">{fmtDuration(m.avgDurationSec)}</td>
              <td className="py-1 pl-2 text-right tabular-nums text-sky-400 hidden md:table-cell">{m.last24h || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
