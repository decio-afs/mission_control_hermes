import { create } from 'zustand';
import { api } from '../lib/api.ts';

export interface Post {
  id: string;
  content: string;
  author: string;
  engagement: number;
}

export interface Trend {
  id: string;
  platform: 'twitter' | 'reddit' | 'tiktok' | 'youtube' | 'news';
  topic: string;
  hashtag?: string;
  engagementVelocity: number;
  sentimentScore: number;
  viabilityScore: number;
  volume: number;
  topPosts: Post[];
  collectedAt: Date;
}

interface TrendStore {
  trends: Trend[];
  isLoading: boolean;
  fetchTrends: () => Promise<void>;
}

export const useTrendStore = create<TrendStore>((set, get) => ({
  trends: [],
  isLoading: false,

  fetchTrends: async () => {
    set({ isLoading: true });
    try {
      // In a real application, fetch from VPS API
      const response = await api.get('/intelligence/trends');
      if (response.data && response.data.trends) {
        const mapped = response.data.trends.map((t: any, i: number) => {
          const growthStr = typeof t.growth === 'string' ? t.growth.replace(/[^0-9-]/g, '') : '0';
          const growth = parseInt(growthStr, 10);
          
          let sentScore = 50;
          if (t.sentiment === 'positive') sentScore = 85;
          if (t.sentiment === 'negative') sentScore = 15;
          if (t.sentiment === 'neutral') sentScore = 50;

          return {
            id: i.toString(),
            topic: t.topic,
            platform: 'twitter',
            volume: t.volume,
            sentimentScore: sentScore,
            engagementVelocity: growth,
            viabilityScore: Math.min(100, Math.max(0, sentScore + growth)),
            collectedAt: new Date(),
          };
        });
        set({ trends: mapped, isLoading: false });
      } else {
        set({ trends: [], isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch trends:', error);
      // Fallback mock data if server fails
      const mockPosts1 = [
        { id: 'p1', author: '@TheAIHawk', content: 'Just deployed OpenClaw to my local cluster. The agent scaffolding is absolutely insane. Managed to automate my entire morning triage in 15 mins.', engagement: 4500 },
        { id: 'p2', author: 'TechCrunch', content: 'Local AI execution is becoming the new standard for privacy-focused startups, significantly reducing OpenAI API overhead.', engagement: 12400 }
      ];
      const mockPosts2 = [
        { id: 'p3', author: '@FrontendWizard', content: 'Stop using Tailwind for everything! Vanilla CSS with native nesting and CSS variables is so much cleaner and you don\'t get messy HTML.', engagement: 8900 },
        { id: 'p4', author: '/u/ReactDev99', content: 'I tried the deepseek-coder V2 model to refactor a massive React context tree and it hallucinated less than GPT-4. Seriously impressive.', engagement: 3200 }
      ];
      
      set({
        trends: [
          { id: '1', platform: 'twitter', topic: 'Local AI Agents', hashtag: '#OpenClaw', engagementVelocity: 85, sentimentScore: 90, viabilityScore: 92, volume: 45000, topPosts: mockPosts1, collectedAt: new Date() },
          { id: '2', platform: 'reddit', topic: 'DeepSeek React Hacks', hashtag: '#reactjs', engagementVelocity: 94, sentimentScore: 75, viabilityScore: 88, volume: 22000, topPosts: mockPosts2, collectedAt: new Date() },
          { id: '3', platform: 'news', topic: 'GPU Market Plunge', hashtag: '#Nvidia', engagementVelocity: 45, sentimentScore: 20, viabilityScore: 55, volume: 153000, topPosts: [{ id:'p5', author: 'Bloomberg', content:'Nvidia shares fall 4% in pre-market due to oversupply of H100s in Secondary Markets', engagement: 45000 }], collectedAt: new Date() },
          { id: '4', platform: 'twitter', topic: 'Next.js 15 Launch', hashtag: '#Nextjs', engagementVelocity: 70, sentimentScore: 82, viabilityScore: 85, volume: 89000, topPosts: [], collectedAt: new Date() },
          { id: '5', platform: 'tiktok', topic: 'Coding Setup Tours', hashtag: '#desksetup', engagementVelocity: 99, sentimentScore: 95, viabilityScore: 97, volume: 340000, topPosts: [], collectedAt: new Date() },
          { id: '6', platform: 'reddit', topic: 'Tailwind vs Vanilla CSS', hashtag: '#css', engagementVelocity: 30, sentimentScore: 40, viabilityScore: 50, volume: 12000, topPosts: [], collectedAt: new Date() }
        ],
        isLoading: false
      });
    }
  }
}));
