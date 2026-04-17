import { Terminal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { GhostNode } from '../stores/useGhostStore';

interface RetroTerminalPopupProps {
  node: GhostNode;
  onClose: () => void;
}

export function RetroTerminalPopup({ node, onClose }: RetroTerminalPopupProps) {
  const baseColor = node.type === 'core' ? '#f64e6e' : 
                node.type === 'squad' ? '#38bdf8' :
                node.model === 'sonnet' ? '#a855f7' :
                node.model === 'haiku' ? '#10b981' : '#94a3b8';
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border-2 border-[#00ff41] w-full max-w-md relative overflow-hidden shadow-[0_0_50px_rgba(0,255,65,0.4)]">
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff41 2px, #00ff41 4px)'
        }} />
        
        {/* Terminal header */}
        <div className="bg-[#00ff41] text-black p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            <span className="font-mono font-bold text-sm">AGENT_PROFILE.exe</span>
          </div>
          <button onClick={onClose} className="hover:bg-black/20 px-2 font-mono font-bold">[X]</button>
        </div>
        
        {/* Terminal content */}
        <div className="p-6 font-mono text-[#00ff41]">
          {/* ASCII Art header */}
          <pre className="text-xs text-[#00ff41]/50 mb-4 overflow-hidden">
{`  _____   _____    ___  _______
 /  _  \\ |  _  \\  /   ||__   __|
 |  |_|  || |_|  ||  _ |   | |
 |   _   ||    _/ | |_| |   | |
 |__| |__||_|\\_\\  |_____|   |_|`}
          </pre>
          
          <div className="space-y-4">
            {/* Agent ID */}
            <div className="border border-[#00ff41]/30 p-3">
              <div className="text-xs text-[#00ff41]/50 mb-1">AGENT_IDENTITY</div>
              <div className="text-xl font-bold" style={{ color: baseColor }}>{node.name}</div>
              <div className="text-xs mt-1">TYPE: {node.type.toUpperCase()}</div>
              {node.model && <div className="text-xs">MODEL: {node.model.toUpperCase()}</div>}
            </div>
            
            {/* Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#00ff41]/30 p-3">
                <div className="text-xs text-[#00ff41]/50 mb-1">STATUS</div>
                <div className={`text-sm font-bold ${
                  node.status === 'active' ? 'text-emerald-400' :
                  node.status === 'idle' ? 'text-amber-400' : 'text-gray-400'
                }`}>
                  {node.status?.toUpperCase() || 'OFFLINE'}
                </div>
              </div>
              <div className="border border-[#00ff41]/30 p-3">
                <div className="text-xs text-[#00ff41]/50 mb-1">LAST_ACTIVE</div>
                <div className={`text-sm font-bold ${
                  node.status === 'active' ? 'text-emerald-400 animate-pulse' : ''
                }`}>
                  {node.status === 'active' 
                    ? 'HUNTING...' 
                    : node.last_active
                      ? formatDistanceToNow(new Date(node.last_active), { addSuffix: true })
                      : 'UNKNOWN'}
                </div>
              </div>
            </div>
            
            {/* Tasks */}
            <div className="border border-[#00ff41]/30 p-3">
              <div className="text-xs text-[#00ff41]/50 mb-2">WORKLOAD_METRICS</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>ACTIVE_TASKS:</span>
                  <span className={node.has_active_work ? 'text-emerald-400' : ''}>{node.tasks_running || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>QUEUE_DEPTH:</span>
                  <span className="text-amber-400">{node.queue_depth || 0}</span>
                </div>
                <div className="w-full h-2 bg-[#00ff41]/20 mt-2">
                  <div 
                    className="h-full bg-[#00ff41] transition-all"
                    style={{ width: `${Math.min(100, ((node.queue_depth || 0) + (node.tasks_running || 0)) * 10)}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button className="flex-1 border border-[#00ff41] text-[#00ff41] py-2 text-sm hover:bg-[#00ff41] hover:text-black transition-colors font-mono">
                [EXECUTE_TASK]
              </button>
              {node.type !== 'core' && (
                <button className="flex-1 border border-red-500 text-red-500 py-2 text-sm hover:bg-red-500 hover:text-black transition-colors font-mono">
                  [TERMINATE]
                </button>
              )}
            </div>
          </div>
          
          {/* Blinking cursor */}
          <div className="mt-4 text-sm">{'>'}<span className="animate-pulse">_</span></div>
        </div>
      </div>
    </div>
  );
}

export default RetroTerminalPopup;
