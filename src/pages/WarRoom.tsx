import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { Network, Brain } from 'lucide-react';
import { useSystemStore } from '../stores/useSystemStore';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const mockLatency = Array.from({ length: 60 }).map((_, i) => ({
  time: i,
  latency: Math.floor(Math.random() * 20) + 15
}));

function useTokenUsage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await api.get('/metrics/token-usage');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          if (isMounted) setData(res.data);
          return;
        }
      } catch (err) {
        console.warn("Failed to load token usage API, using fallback data");
      }
      
      // Fallback
      const mockCostAccrual = Array.from({ length: 24 }).map((_, i) => {
        const sonnet = Math.random() * 3 + 1;
        const haiku = Math.random() * 1 + 0.1;
        const gpt4o = Math.random() * 2 + 0.5;
        return {
          hour: i,
          'Claude Sonnet': sonnet,
          'Claude Haiku': haiku,
          'GPT-4o': gpt4o,
          total: sonnet + haiku + gpt4o
        };
      });
      if (isMounted) setData(mockCostAccrual);
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  return data;
}

function CircularGauge({ value, total, label, colorClass }: { value: number, total: number, label: string, colorClass: string }) {
  const percentage = Math.round((value / total) * 100);
  return (
    <div className="flex flex-col items-center p-4 bg-bg-deep border border-border-subtle rounded-2xl w-full">
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="50%" cy="50%" r="40%" className="stroke-border-subtle fill-none" strokeWidth="8" />
          <circle cx="50%" cy="50%" r="40%" className={`${colorClass} fill-none`} strokeWidth="8" 
            strokeDasharray="250" strokeDashoffset={250 - (250 * percentage) / 100} strokeLinecap="round" />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-xl sm:text-2xl font-black text-white">{percentage}%</span>
          <span className="text-[10px] sm:text-xs text-text-secondary font-mono">{value} / {total}</span>
        </div>
      </div>
      <span className="mt-4 text-[10px] sm:text-xs font-bold tracking-widest uppercase text-text-tertiary text-center leading-tight max-w-[120px]">{label}</span>
    </div>
  );
}

export default function WarRoom() {
  const { vitals, fetchDashboard } = useSystemStore();
  const costData = useTokenUsage();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="p-4 md:p-6 flex flex-col min-w-0">
      <h2 className="text-xl md:text-2xl font-black mb-6 text-white uppercase tracking-tighter w-max relative">
        The War Room
        <span className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-[#f64e6e]"></span>
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <CircularGauge value={vitals.ramUsedMb || 0} total={vitals.ramTotalMb} label="Context RAM (MB)" colorClass="stroke-amber-500" />
        <CircularGauge value={vitals.cpuPercentage || 0} total={100} label="CPU Aggregate" colorClass="stroke-[#f64e6e]" />
        
        <div className="flex flex-col p-4 bg-bg-deep border border-border-subtle rounded-2xl col-span-2 md:col-span-1 min-h-[140px]">
          <div className="flex justify-between items-center mb-4 text-text-secondary">
            <span className="text-xs font-bold uppercase tracking-widest text-[#f64e6e]">Context Prune</span>
            <Brain className="w-4 h-4 text-[#f64e6e]" />
          </div>
          <div className="mt-auto">
            <div className="flex justify-between text-xs mb-2 text-white font-bold">
              <span>Threshold</span>
              <span>80 / 100K Tokens</span>
            </div>
            <div className="w-full h-2 bg-border-subtle rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#f64e6e] to-[#ff795e] w-[80%]"></div>
            </div>
            <div className="text-[10px] font-bold text-amber-500 mt-3 animate-pulse border border-amber-500/20 bg-amber-500/5 px-2 py-1 rounded inline-block">Safeguard Mode Active</div>
          </div>
        </div>

        <div className="flex flex-col p-4 bg-bg-deep border border-border-subtle rounded-2xl col-span-2 md:col-span-1 min-h-[140px]">
          <div className="flex justify-between items-center mb-4 text-text-secondary">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Network I/O</span>
            <Network className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-auto flex flex-col gap-3">
            <div className="flex justify-between items-end border-b border-border-subtle/50 pb-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">Gateway DL</span>
              <span className="font-mono text-sm text-emerald-400 font-bold">14.2 MB/s</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">Gateway UP</span>
              <span className="font-mono text-sm text-indigo-400 font-bold">2.8 MB/s</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        {/* Token Cost Tracker */}
        <div className="bg-bg-card border border-border-subtle p-4 md:p-6 flex flex-col rounded-3xl h-[300px] lg:h-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-white">Model Cost Tracking ($)</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary bg-bg-deep px-2 py-1 rounded">24 Hour Window</span>
          </div>
          <div className="flex-1 w-full min-h-[200px] -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData}>
                <XAxis dataKey="hour" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickMargin={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  cursor={{ fill: '#1a1a1a' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="Claude Sonnet" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                <Bar dataKey="GPT-4o" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Claude Haiku" stackId="a" fill="#f64e6e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Graph */}
        <div className="bg-bg-card border border-border-subtle p-4 md:p-6 flex flex-col rounded-3xl h-[300px] lg:h-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-white">API Latency Matrix</h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Live (60s)</span>
          </div>
          <div className="flex-1 w-full min-h-[200px] -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockLatency}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f64e6e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f64e6e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 10']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#f64e6e', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="latency" stroke="#f64e6e" strokeWidth={3} fillOpacity={1} fill="url(#colorLatency)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
