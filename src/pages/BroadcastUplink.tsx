import { MessageSquare, Image, Briefcase, Video, Radio, Activity, Clock, CheckCircle, Smartphone } from 'lucide-react';

const mockConnections = [
  { platform: 'Twitter / X', status: 'Connected', handle: '@MissionControl', icon: MessageSquare, color: 'text-sky-400' },
  { platform: 'LinkedIn', status: 'Connected', handle: 'DA Agency Org', icon: Briefcase, color: 'text-indigo-400' },
  { platform: 'TikTok', status: 'OAuth Expired', handle: '@MissionControl', icon: Smartphone, color: 'text-rose-500' },
  { platform: 'Instagram', status: 'Connected', handle: '@MissionControl', icon: Image, color: 'text-pink-500' },
  { platform: 'YouTube', status: 'Connected', handle: 'MissionControlDev', icon: Video, color: 'text-red-500' },
];

const mockQueue = [
  { id: 'PUB-193', type: 'Carousel', title: 'Why AI Agents are the Next Frontier', platforms: [Briefcase, MessageSquare], time: '14:30 EST', algorithm: 'Peak Engagement (+24% Lift predicted)', status: 'Queued' },
  { id: 'PUB-194', type: 'Short Video', title: 'Context Pruning Explained in 60s', platforms: [Video, Smartphone, Image], time: '17:00 EST', algorithm: 'Afternoon Commute (+12% Lift predicted)', status: 'Queued' },
  { id: 'PUB-191', type: 'Text Thread', title: 'Top 5 OpenClaw Features', platforms: [MessageSquare], time: '09:00 EST', algorithm: 'Morning Routine', status: 'Published' },
];

export default function SocialPublishing() {
  return (
    <div className="p-4 md:p-6 flex flex-col items-center min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 w-full gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-1 flex items-center gap-2">
            <Radio className="w-6 h-6 text-[#f64e6e]" /> Broadcast Uplink
          </h2>
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-text-tertiary">
            <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-400" /> Webhook Polling Active</span>
          </div>
        </div>
        <button className="w-full md:w-auto rounded-full bg-gradient-to-r from-[#f64e6e] to-[#ff795e] text-white px-6 py-2.5 font-bold uppercase text-xs tracking-wider hover:shadow-[0_0_20px_-5px_#f64e6e] transition flex justify-center items-center gap-2">
          New Broadcast Hub
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Connections */}
        <div className="col-span-1 border border-border-subtle bg-bg-card rounded-3xl p-6">
          <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-border-subtle pb-4 mb-4">OAuth Relays</h3>
          <ul className="space-y-4">
            {mockConnections.map((conn) => {
              const Icon = conn.icon;
              return (
                <li key={conn.platform} className="flex justify-between items-center bg-bg-deep p-4 rounded-2xl border border-border-subtle hover:border-[#f64e6e]/50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 bg-black rounded-lg ${conn.color} border border-border-subtle group-hover:bg-[#f64e6e]/10 group-hover:border-[#f64e6e]/30 transition-colors`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white mb-0.5">{conn.platform}</div>
                      <div className="text-xs text-text-secondary">{conn.handle}</div>
                    </div>
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${conn.status === 'Connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'}`}>
                    {conn.status}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Publishing Queue */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          <div className="border border-border-subtle bg-bg-card rounded-3xl p-6 flex-1">
            <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-border-subtle pb-4 mb-4 flex items-center justify-between">
              <span>Publishing Queue</span>
              <span className="text-[10px] text-brand-end flex items-center gap-1"><Clock className="w-3 h-3"/> AI Algorithm Optimized</span>
            </h3>
            
            <div className="space-y-4">
              {mockQueue.map((item) => (
                <div key={item.id} className="bg-bg-deep rounded-2xl p-4 border border-border-subtle flex flex-col md:flex-row md:items-center gap-4 justify-between transition-colors hover:border-brand-end/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-text-tertiary">{item.id}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-black bg-[#f64e6e] px-2 py-0.5 rounded-sm">{item.type}</span>
                    </div>
                    <div className="text-base font-bold text-white mb-2">{item.title}</div>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {item.platforms.map((P, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-black border border-border-subtle flex items-center justify-center">
                            <P className="w-3 h-3 text-text-secondary" />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-text-tertiary flex items-center gap-1">
                        <Activity className="w-3 h-3" /> {item.algorithm}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center md:flex-col md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-border-subtle pt-3 md:pt-0 pl-0 md:pl-6">
                    <div className="text-sm font-bold text-white font-mono mb-1">{item.time}</div>
                    <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${item.status === 'Queued' ? 'text-amber-500' : 'text-emerald-400'}`}>
                      {item.status === 'Published' && <CheckCircle className="w-3 h-3" />}
                      {item.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
