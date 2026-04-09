import { create } from 'zustand';
import axios from 'axios';
import { api } from '../lib/api';
import { notion, utils } from '../lib/notion.ts';

export interface OpTask {
  id: string;
  projectId: string;
  name: string;
  agentId: string;
  agentName: string;
  status: 'running' | 'pending' | 'failed' | 'complete';
  priority: 'critical' | 'high' | 'normal';
  createdAt: Date;
}

interface TaskStore {
  tasks: OpTask[];
  summary: { total: number; completed: number; running: number; pending: number; failed: number } | null;
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  addTask: (task: OpTask) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  summary: null,
  isLoading: false,

  addTask: async (task) => {
    const NOTION_DB_TASKS = import.meta.env.VITE_NOTION_DB_TASKS;
    const WEBHOOK_URL = import.meta.env.VITE_OPENCLAW_WEBHOOK;
    
    // Optimistic update
    set((state) => ({ tasks: [task, ...state.tasks] }));
    
    try {
      // 1. Log to Notion (Source of Truth)
      if (NOTION_DB_TASKS && NOTION_DB_TASKS !== '...') {
        await notion.post('/pages', {
          parent: { database_id: NOTION_DB_TASKS },
          properties: {
            Name: { title: [{ text: { content: task.name } }] },
            ProjectID: { rich_text: [{ text: { content: task.projectId } }] },
            AgentName: { rich_text: [{ text: { content: task.agentName } }] },
            Status: { select: { name: task.status } },
            Priority: { select: { name: task.priority } }
          }
        });
      }

      // 2. Fire SaaS Webhook (Trigger Action)
      if (WEBHOOK_URL && WEBHOOK_URL !== '...') {
        await axios.post(WEBHOOK_URL, {
          action: 'create_task',
          payload: task
        });
      }
    } catch (err) {
      console.error("Failed to sync new task with backend/webhook:", err);
    }
  },

  fetchSummary: async () => {
    try {
      const resp = await api.get('/tasks/summary');
      if (resp.data) {
        set({ summary: {
          total: resp.data.total || 0,
          completed: resp.data.by_status?.completed || resp.data.completed || 0,
          running: resp.data.by_status?.running || resp.data.running || 0,
          pending: resp.data.by_status?.pending || resp.data.pending || 0,
          failed: resp.data.by_status?.failed || resp.data.failed || 0
        }});
        return;
      }
    } catch {
      console.log("Summary fetch failed, calculating from local state");
    }

    // Fallback: Calculate from currently loaded tasks
    set((state) => {
      const t = state.tasks;
      if (t.length === 0) return state;
      
      return {
        summary: {
          total: t.length,
          completed: t.filter(x => x.status === 'complete').length,
          running: t.filter(x => x.status === 'running').length,
          pending: t.filter(x => x.status === 'pending').length,
          failed: t.filter(x => x.status === 'failed').length
        }
      };
    });
  },

  fetchTasks: async () => {
    set({ isLoading: true });
    const NOTION_DB_TASKS = import.meta.env.VITE_NOTION_DB_TASKS;
    
    try {
      if (NOTION_DB_TASKS && NOTION_DB_TASKS !== '...') {
        const response = await notion.post(`/databases/${NOTION_DB_TASKS}/query`, {
          sorts: [{ timestamp: 'created_time', direction: 'descending' }]
        });

        const mappedTasks: OpTask[] = response.data.results.map((page: any) => ({
          id: page.id,
          projectId: utils.getText(page.properties.ProjectID) || 'proj-auto',
          name: utils.getTitle(page.properties.Name),
          agentId: page.id,
          agentName: utils.getText(page.properties.AgentName) || 'Auto-Assigned',
          status: (utils.getSelect(page.properties.Status)?.toLowerCase() || 'pending') as any,
          priority: (utils.getSelect(page.properties.Priority)?.toLowerCase() || 'normal') as any,
          createdAt: new Date(page.created_time)
        }));

        set({ tasks: mappedTasks, isLoading: false });
        get().fetchSummary();
        return;
      }

      const response = await api.get('/tasks');
      let tasksData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          tasksData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          tasksData = response.data.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          tasksData = response.data.items;
        }
      }

      if (tasksData.length > 0) {
        const mappedTasks = tasksData.map((t: any) => ({
          id: t.id || `task-${Math.random()}`,
          projectId: t.project_id || t.projectId || 'proj-unknown',
          name: t.name || t.title || 'Unknown Task',
          agentId: t.agent_id || t.agentId || 'unassigned',
          agentName: t.agent_name || t.agentName || 'Unassigned',
          status: t.status || 'pending',
          priority: t.priority || 'normal',
          createdAt: t.created_at ? new Date(t.created_at) : new Date()
        }));
        set({ tasks: mappedTasks, isLoading: false });
        return;
      }
    } catch (err) {
      console.error("API Fetch failed for tasks, falling back to mock data", err);
    }

    // Fallback Mock Data
    set({
      tasks: [
        {
          id: 'task-1001',
          projectId: 'proj-1',
          name: 'Scrape /r/LocalLLaMA top weekly',
          agentId: 'the-scraper',
          agentName: 'The Scraper',
          status: 'running',
          priority: 'high',
          createdAt: new Date(),
        },
        {
          id: 'task-1002',
          projectId: 'proj-1',
          name: 'Analyze sentiment for #AGI on X',
          agentId: 'mnemosyne',
          agentName: 'Mnemosyne',
          status: 'pending',
          priority: 'normal',
          createdAt: new Date(new Date().getTime() - 1000 * 60 * 30),
        },
        {
          id: 'task-1003',
          projectId: 'proj-2',
          name: 'Generate scripts for TikTok batch #4',
          agentId: 'claude-write',
          agentName: 'Claude (Writer)',
          status: 'complete',
          priority: 'critical',
          createdAt: new Date(new Date().getTime() - 1000 * 60 * 120),
        },
        {
          id: 'task-1004',
          projectId: 'proj-2',
          name: 'Compile voiceovers via API',
          agentId: 'overwatch',
          agentName: 'Overwatch',
          status: 'running',
          priority: 'high',
          createdAt: new Date(new Date().getTime() - 1000 * 60 * 10),
        },
        {
          id: 'task-1005',
          projectId: 'proj-1',
          name: 'Index historical sentiment logs',
          agentId: 'the-archivist',
          agentName: 'The Archivist',
          status: 'failed',
          priority: 'normal',
          createdAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24),
        }
      ],
      isLoading: false
    });
  }
}));
