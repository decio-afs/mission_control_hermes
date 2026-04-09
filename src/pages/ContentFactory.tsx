import { Play, Sparkles, Video, MessageCircle, Disc3, FileText, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTrendStore } from '../stores/useTrendStore';

export default function ContentFactory() {
  const { trends, fetchTrends, isLoading } = useTrendStore();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000); // Mock generation delay
  };

  // Generate dynamic ideas based on fetched trends
  const ideas = trends.map((trend, i) => {
    const platforms = [
      { id: 'youtube', icon: Video, color: '#ff0000', label: 'YouTube Video' },
      { id: 'twitter', icon: MessageCircle, color: '#1da1f2', label: 'X Thread' },
      { id: 'tiktok', icon: Smartphone, color: '#00f2fe', label: 'TikTok/Shorts' },
      { id: 'blog', icon: FileText, color: '#10b981', label: 'Blog Post' }
    ];
    
    // Assign pseudo-random platform based on index
    const platform = platforms[i % platforms.length];
    
    // Generate an exciting hook based on the topic
    let hook = `Why ${trend.topic} is changing the game forever.`;
    if (trend.viabilityScore > 85) hook = `The Untold Truth About ${trend.topic} (Watch Before It's Too Late)`;
    if (trend.engagementVelocity > 80) hook = `${trend.topic}: A Step-by-Step Guide for Beginners`;
    
    return {
      id: `idea-${i}`,
      trendId: trend.id,
      topic: trend.topic,
      viability: trend.viabilityScore,
      platform,
      hook,
      status: 'Ready to Draft'
    };
  }).sort((a, b) => b.viability - a.viability);

  return (
    <div className="p-4 md:p-6 h-full flex flex-col min-w-0 overflow-y-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-1">Content Factory</h2>
          <div className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
            Automated Ideation Engine
          </div>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isLoading || isGenerating}
          className="w-full md:w-auto rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white px-6 py-2.5 font-bold uppercase text-xs tracking-wider hover:shadow-[0_0_20px_-5px_#8b5cf6] transition flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {isGenerating ? <Disc3 className="w-4 h-4 fill-white animate-spin" /> : <Sparkles className="w-4 h-4 fill-white" />}
          {isGenerating ? 'Synthesizing...' : 'Generate New Ideas'}
        </button>
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">High-Viability Content Hooks</h3>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <span className="text-text-tertiary font-mono text-sm uppercase">Syncing with Intelligence Deck...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {ideas.map((idea) => {
              const Icon = idea.platform.icon;
              return (
                <div key={idea.id} className="bg-bg-card border border-border-subtle rounded-3xl p-6 hover:border-[#8b5cf6] transition-colors group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-subtle bg-bg-deep" style={{ color: idea.platform.color }}>
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{idea.platform.label}</span>
                      </div>
                      <div className={`text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-sm border ${idea.viability >= 80 ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'}`}>
                        {idea.viability}% Viability
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-bold text-white mb-3">"{idea.hook}"</h4>
                    <p className="text-sm text-text-secondary mb-6">
                      Vector Match: <span className="text-[#38bdf8] font-bold">{idea.topic}</span>
                    </p>
                  </div>

                  <div className="flex gap-2 w-full pt-4 border-t border-border-subtle mt-auto">
                    <button className="flex-1 bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white transition-colors py-2 rounded-full text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-1.5">
                      <Play className="w-3 h-3" /> Draft Content
                    </button>
                    <button className="px-4 bg-transparent border border-border-subtle text-text-tertiary hover:text-white hover:bg-white/5 transition-colors py-2 rounded-full text-xs font-bold uppercase tracking-wider">
                      Skip
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
