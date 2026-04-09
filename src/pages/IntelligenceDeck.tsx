import { Search, TrendingUp, Filter, Database, X, Zap, Activity, MessageCircle, BarChart2, Globe, Disc3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTrendStore } from '../stores/useTrendStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

export default function IntelligenceDeck() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTrendId, setSelectedTrendId] = useState<string | null>(null);
  const { trends, fetchTrends, isLoading } = useTrendStore();

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  // Set default selection when trends load
  useEffect(() => {
    if (trends.length > 0 && !selectedTrendId) {
      setSelectedTrendId(trends[0].id);
    }
  }, [trends, selectedTrendId]);

  // Derived metrics
  const avgViability = trends.length ? Math.round(trends.reduce((acc, t) => acc + t.viabilityScore, 0) / trends.length) : 0;
  const avgSentiment = trends.length ? Math.round(trends.reduce((acc, t) => acc + t.sentimentScore, 0) / trends.length) : 0;
  const totalVolume = trends.reduce((acc, t) => acc + t.volume, 0);

  const selectedTrend = trends.find(t => t.id === selectedTrendId) || trends[0];

  return (
    <div className="p-4 md:p-6 flex flex-col min-w-0 overflow-y-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-1">Intelligence Deck</h2>
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-text-tertiary">
            <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Data Stream: Active</span>
            <span className="w-1 h-1 rounded-full bg-border-subtle"></span>
            <span className="text-[#38bdf8] flex items-center gap-1"><Activity className="w-3 h-3" /> Live Feed</span>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex-1 md:flex-none rounded-full px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors border ${filterOpen ? 'bg-white text-black border-white' : 'bg-bg-card border-border-subtle text-text-secondary hover:text-white'}`}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button onClick={fetchTrends} disabled={isLoading} className="flex-1 md:flex-none rounded-full bg-gradient-to-r from-[#38bdf8] to-[#6366f1] text-white px-5 py-2.5 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_20px_-5px_#38bdf8] transition-shadow disabled:opacity-50">
            <TrendingUp className="w-4 h-4" /> {isLoading ? 'Scanning...' : 'Scan Matrix'}
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="mb-6 p-4 bg-bg-card border border-[#38bdf8]/30 rounded-3xl animate-in fade-in slide-in-from-top-2 shadow-[0_0_30px_-15px_#38bdf8]">
          <div className="flex justify-between items-center border-b border-border-subtle pb-3 mb-4">
            <h3 className="text-white text-sm font-bold uppercase tracking-widest text-[#38bdf8]">Pattern Recognition Filter</h3>
            <button onClick={() => setFilterOpen(false)}><X className="w-4 h-4 text-text-secondary hover:text-[#38bdf8]" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Target Keywords</label>
              <input type="text" placeholder="e.g. AI, Startups" className="w-full bg-bg-deep border border-border-subtle rounded-xl px-4 py-2 text-sm text-white placeholder-text-tertiary focus:outline-none focus:border-[#38bdf8]" defaultValue="LLMs, Tech" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Platform Focus</label>
              <select className="w-full bg-bg-deep border border-border-subtle rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#38bdf8] appearance-none">
                <option value="all">Global (All Vectors)</option>
                <option value="twitter">X / Twitter</option>
                <option value="reddit">Reddit</option>
                <option value="news">News Outlets</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Min Viability Score</label>
              <input type="range" min="0" max="100" defaultValue="50" className="w-full accent-[#38bdf8] mt-2" />
            </div>
          </div>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Total Signal Volume</div>
            <div className="text-2xl font-black text-white font-mono">{totalVolume.toLocaleString()}</div>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#f64e6e]/10 flex items-center justify-center text-[#f64e6e]">
            <MessageCircle className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Average Viability</div>
            <div className={`text-2xl font-black font-mono ${avgViability >= 75 ? 'text-[#10b981]' : 'text-amber-500'}`}>{avgViability}%</div>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${avgViability >= 75 ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-amber-500/10 text-amber-500'}`}>
            <Zap className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Market Sentiment</div>
            <div className={`text-2xl font-black font-mono ${avgSentiment >= 60 ? 'text-[#6366f1]' : 'text-rose-500'}`}>{avgSentiment}%</div>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${avgSentiment >= 60 ? 'bg-[#6366f1]/10 text-[#6366f1]' : 'bg-rose-500/10 text-rose-500'}`}>
            <BarChart2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Chart Row */}
      <div className="bg-bg-card border border-border-subtle rounded-3xl p-6 mb-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-border-subtle pb-4">Signal Viability vs Velocity</h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
              <XAxis dataKey="topic" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} 
                tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} />
              <YAxis yAxisId="left" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#050505', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                cursor={{ fill: '#ffffff05' }}
              />
              <Bar yAxisId="left" dataKey="viabilityScore" name="Viability %" radius={[4, 4, 0, 0]}>
                {trends.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.viabilityScore >= 80 ? '#10b981' : entry.viabilityScore >= 50 ? '#38bdf8' : '#f64e6e'} />
                ))}
              </Bar>
              <Bar yAxisId="right" dataKey="engagementVelocity" name="Velocity" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Split View Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Vectors Grid */}
        <div className="xl:col-span-2">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Trending Vectors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trends.map((trend) => (
              <div 
                key={trend.id} 
                onClick={() => setSelectedTrendId(trend.id)}
                className={`bg-bg-deep border rounded-2xl p-5 hover:border-[#38bdf8]/50 transition-all cursor-pointer group flex flex-col justify-between ${selectedTrendId === trend.id ? 'border-[#38bdf8] shadow-[0_0_15px_-3px_#38bdf8]' : 'border-border-subtle'}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-white font-bold text-base leading-tight truncate pr-2">{trend.topic}</h4>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase border ${
                      trend.platform === 'twitter' ? 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30' :
                      trend.platform === 'reddit' ? 'bg-[#ff4500]/10 text-[#ff4500] border-[#ff4500]/30' :
                      trend.platform === 'tiktok' ? 'bg-white/10 text-white border-white/30' :
                      'bg-[#f64e6e]/10 text-[#f64e6e] border-[#f64e6e]/30'
                    }`}>
                      {trend.platform}
                    </div>
                  </div>
                  <div className="text-xs font-mono text-text-tertiary mb-5">{trend.hashtag}</div>
                  
                  <div className="space-y-3 mb-6">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">
                        <span>Viability</span>
                        <span className={trend.viabilityScore >= 80 ? 'text-[#10b981]' : ''}>{trend.viabilityScore}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                        <div className={`h-full ${trend.viabilityScore >= 80 ? 'bg-[#10b981]' : trend.viabilityScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${trend.viabilityScore}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">
                        <span>Velocity</span>
                        <span className="text-[#6366f1]">+{trend.engagementVelocity}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                        <div className="h-full bg-[#6366f1]" style={{ width: `${trend.engagementVelocity}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                  <div className="text-xs text-text-secondary font-mono">{trend.volume.toLocaleString()} signals</div>
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors px-3 py-1.5 rounded-full ${selectedTrendId === trend.id ? 'bg-[#38bdf8] text-black' : 'text-[#38bdf8] bg-[#38bdf8]/10 group-hover:bg-[#38bdf8] group-hover:text-black'}`}>
                    {selectedTrendId === trend.id ? <Disc3 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                    {selectedTrendId === trend.id ? 'Active' : 'Analyze'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Digest Sidebar */}
        <div className="xl:col-span-1 flex flex-col h-full min-h-[500px]">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center justify-between">
            Live Feed Digest
            <span className="text-[10px] text-text-tertiary uppercase flex items-center gap-1"><Globe className="w-3 h-3" /> Auto-syncing</span>
          </h3>
          <div className="bg-bg-deep rounded-3xl border border-border-subtle flex-1 p-5 overflow-hidden flex flex-col relative">
            <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#38bdf8]/5 to-transparent pointer-events-none rounded-t-3xl"></div>
            
            {selectedTrend ? (
              <div className="flex-1 overflow-y-auto pr-2 relative z-10 custom-scrollbar">
                <div className="mb-6 border-b border-border-subtle pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></span>
                    <span className="text-xs font-bold text-[#38bdf8] uppercase tracking-widest">Focused Interception</span>
                  </div>
                  <h4 className="text-2xl font-black text-white">{selectedTrend.topic}</h4>
                </div>

                <div className="space-y-4">
                  {selectedTrend.topPosts && selectedTrend.topPosts.length > 0 ? (
                    selectedTrend.topPosts.map(post => (
                      <div key={post.id} className="bg-bg-card border border-border-subtle rounded-2xl p-4 hover:border-white/20 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-[#f64e6e]">{post.author}</span>
                          <span className="text-[10px] text-text-tertiary font-mono uppercase tracking-widest">{post.engagement.toLocaleString()} Eng.</span>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed mb-4">{post.content}</p>
                        <div className="flex items-center gap-3">
                          <button className="text-xs font-bold text-white uppercase tracking-wider bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-colors">Republish</button>
                          <button className="text-xs font-bold text-text-tertiary uppercase tracking-wider hover:text-white transition-colors">Discard</button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center h-40 border border-dashed border-border-subtle rounded-2xl">
                      <Search className="w-8 h-8 text-border-subtle mb-3" />
                      <div className="text-sm font-bold text-text-tertiary uppercase tracking-widest">No detailed feed available yet</div>
                      <div className="text-xs text-text-secondary mt-1">Awaiting OpenClaw scraping sequence...</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-text-tertiary">
                <Globe className="w-12 h-12 mb-4 opacity-50" />
                <div className="text-sm font-bold uppercase tracking-widest">Awaiting Vector Selection</div>
                <div className="text-xs mt-2 max-w-[200px]">Select a trending vector to intercept its live data stream.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
