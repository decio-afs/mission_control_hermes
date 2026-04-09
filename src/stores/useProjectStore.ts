import { create } from 'zustand';
import axios from 'axios';
import { api } from '../lib/api';
import { notion, utils } from '../lib/notion.ts';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'planning' | 'completed' | 'on_hold';
  priority: 'high' | 'medium' | 'low';
  tasksCompleted: number;
  tasksTotal: number;
  dueDate: Date;
}

interface ProjectStore {
  projects: Project[];
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  addProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  isLoading: false,

  addProject: async (project) => {
    const NOTION_DB_PROJECTS = import.meta.env.VITE_NOTION_DB_PROJECTS;
    const WEBHOOK_URL = import.meta.env.VITE_OPENCLAW_WEBHOOK;
    
    // Optimistic update
    set((state) => ({ projects: [project, ...state.projects] }));

    try {
      // 1. Log to Notion (Storage)
      if (NOTION_DB_PROJECTS && NOTION_DB_PROJECTS !== '...') {
        await notion.post('/pages', {
          parent: { database_id: NOTION_DB_PROJECTS },
          properties: {
            Name: { title: [{ text: { content: project.name } }] },
            Description: { rich_text: [{ text: { content: project.description } }] },
            Status: { select: { name: project.status } },
            Priority: { select: { name: project.priority } },
            DueDate: { date: { start: project.dueDate.toISOString() } }
          }
        });
      }

      // 2. Fire SaaS Webhook (Action)
      if (WEBHOOK_URL && WEBHOOK_URL !== '...') {
        await axios.post(WEBHOOK_URL, {
          action: 'create_project',
          payload: project
        });
      }
    } catch (err) {
      console.error("Failed to sync new project with Notion/Webhook:", err);
    }
  },

  fetchProjects: async () => {
    set({ isLoading: true });
    const NOTION_DB_PROJECTS = import.meta.env.VITE_NOTION_DB_PROJECTS;
    
    try {
      if (NOTION_DB_PROJECTS && NOTION_DB_PROJECTS !== '...') {
        const response = await notion.post(`/databases/${NOTION_DB_PROJECTS}/query`);
        const mappedProjects: Project[] = response.data.results.map((page: any) => ({
          id: page.id,
          name: utils.getTitle(page.properties.Name),
          description: utils.getText(page.properties.Description),
          status: (utils.getSelect(page.properties.Status) || 'planning') as any,
          priority: (utils.getSelect(page.properties.Priority) || 'medium') as any,
          tasksCompleted: utils.getNumber(page.properties.TasksCompleted),
          tasksTotal: utils.getNumber(page.properties.TasksTotal),
          dueDate: utils.getDate(page.properties.DueDate) || new Date()
        }));

        set({ projects: mappedProjects, isLoading: false });
        return;
      }

      const response = await api.get('/projects');
      let projectsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          projectsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          projectsData = response.data.data;
        } else if (response.data.items && Array.isArray(response.data.items)) {
          projectsData = response.data.items;
        }
      }

      if (projectsData.length > 0) {
        const mappedProjects = projectsData.map((p: any) => ({
          id: p.id || `proj-${Math.random()}`,
          name: p.name || p.title || 'Unknown Project',
          description: p.description || '',
          status: p.status || 'planning',
          priority: p.priority || 'medium',
          tasksCompleted: p.tasks_completed || p.tasksCompleted || 0,
          tasksTotal: p.tasks_total || p.tasksTotal || 0,
          dueDate: p.due_date ? new Date(p.due_date) : new Date()
        }));
        set({ projects: mappedProjects, isLoading: false });
        return;
      }
    } catch (err) {
      console.error("API Fetch failed for projects, falling back to mock data", err);
    }

    // Fallback Mock Data
    set({
      projects: [
        {
          id: 'proj-1',
          name: 'Q4 Intelligence Scraping',
          description: 'Automated retrieval of tech sentiment across X & Reddit',
          status: 'active',
          priority: 'high',
          tasksCompleted: 45,
          tasksTotal: 100,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
        },
        {
          id: 'proj-2',
          name: 'Content Automation v2',
          description: 'Refactoring the Claude-to-TikTok generation pipeline',
          status: 'planning',
          priority: 'medium',
          tasksCompleted: 2,
          tasksTotal: 14,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        },
        {
          id: 'proj-3',
          name: 'Agent Architecture Tuning',
          description: 'Optimizing context windows for the Core Orchestrator',
          status: 'on_hold',
          priority: 'low',
          tasksCompleted: 0,
          tasksTotal: 5,
          dueDate: new Date(new Date().setDate(new Date().getDate() + 60)),
        }
      ],
      isLoading: false
    });
  }
}));
