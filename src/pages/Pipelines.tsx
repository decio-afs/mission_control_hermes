import { useEffect, useMemo, useState } from 'react';
import { getSelfHealing, getBugHunter, getPatching, getHiggsfieldJobs, type SelfHealingStatus, type BugHunterReport, type PatchStatus, type HiggsfieldJob } from '../lib/api';
import { Panel, Pill, Stat } from '../components/cyberpunk/ui';

const POLL_MS = 15000;

export default function Pipelines() {
  const [healing, setHealing] = useState<SelfHealingStatus | null>(null);
  const [bugs, setBugs] = useState<BugHunterReport | null>(null);
  const [patch, setPatch] = useState<PatchStatus | null>(null);
  const [higgs, setHiggs] = useState<{ jobs: HiggsfieldJob[]; total: number; running: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const load = async () => {
    try {
      const [h, b, p, hf] = await Promise.all([
        getSelfHealing().catch(() => null),
        getBugHunter().catch(() => null),
        getPatching().catch(() => null),
        getHiggsfieldJobs().catch(() => null),
      ]);
      setHealing(h);
      setBugs(b);
      setPatch(p);
      setHiggs(hf);
      setError(null);
      setLastSync(new Date());
    } catch (e) {
      setError('Pipeline data unreachable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const healingChecks = useMemo(() => healing?.checks ?? [], [healing]);
  const bugIssues = useMemo(() => bugs?.issues ?? [], [bugs]);
  const higgsJobs = useMemo(() => higgs?.jobs ?? [], [higgs]);

  return (
    <div className="h-full flex flex-col gap-2 p-2 overflow-auto">
      <div className="shrink-0 flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.2em] text-white font-bold">PIPELINE COMMAND</span>
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#545454]">
          {loading && <span>syncing…</span>}
          {lastSync && <span>synced {lastSync.toLocaleTimeString()}</span>}
        </div>
      </div>

      {error && (
        <div className="shrink-0 px-2 py-1 border border-red-400/40 bg-[#050505]/80 text-red-400 font-mono text-[10px]">
          ⚠ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 shrink-0">
        <Panel label="SELF-HEALING" className="min-h-[120px]">
          <Stat
            label="status"
            value={healing ? (healing.all_ok ? 'HEALTHY' : 'DEGRADED') : '—'}
            tone={healing ? (healing.all_ok ? 'good' : 'warn') : 'white'}
            sub={healing ? `checked ${new Date(healing.checked_at).toLocaleTimeString()}` : undefined}
          />
          <div className="mt-2 flex flex-col gap-1">
            {healingChecks.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                <span className={c.ok ? 'text-emerald-400' : 'text-amber-400'}>{c.ok ? '✓' : '⚠'}</span>
                <span className="text-[#b8b8b8]">{c.name}</span>
                {c.detail && <span className="text-[#545454] truncate">{c.detail}</span>}
              </div>
            ))}
            {healingChecks.length === 0 && <div className="text-[10px] font-mono text-[#545454]">no checks yet</div>}
          </div>
          {healing && healing.actions_taken.length > 0 && (
            <div className="mt-2">
              <div className="text-[10px] font-mono text-[#545454] tracking-[0.15em] uppercase mb-1">actions taken</div>
              {healing.actions_taken.map((a, i) => (
                <div key={i} className="text-[10px] font-mono text-emerald-400">▸ {a}</div>
              ))}
            </div>
          )}
        </Panel>

        <Panel label="BUG HUNTER" className="min-h-[120px]">
          <Stat
            label="issues found"
            value={bugs?.issues_found ?? '—'}
            tone={bugs && bugs.issues_found > 0 ? 'warn' : 'good'}
            sub={bugs ? `${bugs.kanban_tasks_created} kanban tickets created` : undefined}
          />
          <div className="mt-2 flex flex-col gap-1 max-h-[180px] overflow-auto">
            {bugIssues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px] font-mono border-b border-white/[0.04] py-1">
                <Pill tone={issue.severity === 'high' ? 'bad' : issue.severity === 'medium' ? 'warn' : 'info'}>
                  {issue.severity}
                </Pill>
                <div className="min-w-0">
                  <div className="text-[#b8b8b8] truncate">{issue.message}</div>
                  <div className="text-[#545454] truncate">{issue.file}{issue.line ? `:${issue.line}` : ''}</div>
                </div>
              </div>
            ))}
            {bugIssues.length === 0 && <div className="text-[10px] font-mono text-emerald-400">✓ no issues detected</div>}
          </div>
        </Panel>

        <Panel label="PATCH STATUS" className="min-h-[120px]">
          <Stat
            label="security posture"
            value={patch ? (patch.all_clean ? 'CLEAN' : 'ATTENTION') : '—'}
            tone={patch ? (patch.all_clean ? 'good' : 'warn') : 'white'}
            sub={patch ? `checked ${new Date(patch.checked_at).toLocaleTimeString()}` : undefined}
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Stat label="patches applied" value={patch?.patches_applied ?? '—'} tone="info" />
            <Stat label="patches failed" value={patch?.patches_failed ?? '—'} tone={patch && patch.patches_failed > 0 ? 'warn' : 'info'} />
            <Stat label="npm vulns" value={patch?.npm_audit_vulnerabilities ?? '—'} tone={patch && (patch.npm_audit_vulnerabilities ?? 0) > 0 ? 'warn' : 'info'} />
            <Stat label="py outdated" value={patch?.python_outdated ?? '—'} tone={patch && (patch.python_outdated ?? 0) > 0 ? 'warn' : 'info'} />
          </div>
        </Panel>

        <Panel label="HIGGSFIELD JOBS" className="min-h-[120px]">
          <Stat
            label="active renders"
            value={higgs ? `${higgs.running} / ${higgs.total}` : '—'}
            tone="brand"
            sub={higgs ? `${higgs.total - higgs.running} queued or done` : undefined}
          />
          <div className="mt-2 flex flex-col gap-1 max-h-[180px] overflow-auto">
            {higgsJobs.map((job) => (
              <div key={job.id} className="flex flex-col gap-1 text-[10px] font-mono border-b border-white/[0.04] py-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#b8b8b8] truncate">{job.title}</span>
                  <Pill tone={job.status === 'done' ? 'good' : job.status === 'running' ? 'brand' : job.status === 'failed' ? 'bad' : 'info'}>
                    {job.status}
                  </Pill>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[6px] bg-white/[0.04]">
                    <div className="h-full bg-[#f64e6e]/60" style={{ width: `${job.progress}%` }} />
                  </div>
                  <span className="text-[#545454] w-[28px] text-right">{job.progress}%</span>
                </div>
              </div>
            ))}
            {higgsJobs.length === 0 && <div className="text-[10px] font-mono text-[#545454]">no animation jobs</div>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
