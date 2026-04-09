import { Database, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export default function Archives() {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text-secondary uppercase tracking-wider">The Archives</h2>
        <div className="flex bg-bg-card border border-border-subtle overflow-hidden">
          <button className="rounded-full px-4 py-2 text-sm text-sky-400 bg-bg-deep">Tables</button>
          <button className="rounded-full px-4 py-2 text-sm text-text-secondary hover:text-white">Queries</button>
          <button className="rounded-full px-4 py-2 text-sm text-text-secondary hover:text-white">Analytics</button>
        </div>
      </div>

      <div className="flex gap-6 flex-1">
        <div className="w-64 bg-bg-card border border-border-subtle p-4 flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">PostgreSQL Tables</h3>
          {['users', 'social_accounts', 'trend_data', 'content_generations', 'publishing_schedule', 'agent_operations', 'learnings', 'system_health'].map(table => (
            <div key={table} className="flex items-center gap-2 text-sm text-white hover:text-sky-400 cursor-pointer p-2 hover:bg-white/5">
              <Database className="w-4 h-4 text-text-secondary" />
              {table}
            </div>
          ))}
        </div>
        
        <div className="flex-1 bg-bg-card border border-border-subtle overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border-subtle">
            <code className="text-sky-400 text-sm">SELECT * FROM agent_operations ORDER BY started_at DESC LIMIT 5;</code>
          </div>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-bg-deep/50 border-b border-border-subtle text-text-secondary">
                <th className="p-3">agent_name</th>
                <th className="p-3">model</th>
                <th className="p-3">status</th>
                <th className="p-3">memory_usage</th>
                <th className="p-3">started_at</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Word-Smith', model: 'claude-sonnet', status: 'completed', mem: '450MB', time: '2 mins ago' },
                { name: 'Chrome-Runner', model: 'kimi-code', status: 'active', mem: '840MB', time: 'Just now' },
                { name: 'Phantom-Cleaner', model: 'gemini-flash', status: 'completed', mem: '120MB', time: '1 hr ago' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border-subtle/50 hover:bg-white/5">
                  <td className="p-3 text-white">{row.name}</td>
                  <td className="p-3 text-text-secondary">{row.model}</td>
                  <td className="p-3">
                    <span className={row.status === 'active' ? 'text-emerald-400' : 'text-text-secondary'}>{row.status}</span>
                  </td>
                  <td className="p-3 font-mono text-sky-400">{row.mem}</td>
                  <td className="p-3 text-text-secondary">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
