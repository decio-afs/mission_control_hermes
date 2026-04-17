import { create } from 'zustand';
import { socketService } from '../lib/socket.ts';
import { api } from '../lib/api.ts';
import { notion, utils } from '../lib/notion.ts';

export interface GhostNode {
  id: string;
  name: string;
  type: 'core' | 'fixer' | 'runner' | 'squad';
  model?: 'cyan' | 'purple' | 'green' | string;
  val: number;
  squad?: string;
  tasks_running?: number;
  queue_depth?: number;
  has_active_work?: boolean;
  status?: 'active' | 'idle' | 'offline' | string;
  last_active?: Date | null;
}

export interface GhostEdge {
  source: string;
  target: string;
}

interface GhostStore {
  nodes: GhostNode[];
  edges: GhostEdge[];
  isConnected: boolean;
  fetchTopology: () => Promise<void>;
  updateNodes: (nodes: GhostNode[]) => void;
  updateEdges: (edges: GhostEdge[]) => void;
  setConnectionStatus: (status: boolean) => void;
}

export const useGhostStore = create<GhostStore>((set, get) => ({
  nodes: [],
  edges: [],
  isConnected: false,

  setConnectionStatus: (status) => set({ isConnected: status }),
  updateNodes: (nodes) => set({ nodes }),
  updateEdges: (edges) => set({ edges }),

  fetchTopology: async () => {
    const NOTION_DB_AGENTS = import.meta.env.VITE_NOTION_DB_AGENTS;
    
    try {
      if (NOTION_DB_AGENTS && NOTION_DB_AGENTS !== '...') {
        const response = await notion.post(`/databases/${NOTION_DB_AGENTS}/query`);
        const freshNodes: GhostNode[] = response.data.results.map((page: any) => {
          const name = utils.getTitle(page.properties.Name);
          const status = utils.getSelect(page.properties.Status)?.toLowerCase() || 'offline';
          const lastActive = utils.getDate(page.properties['Last Active']);
          
          return {
            id: page.id,
            name,
            type: (utils.getSelect(page.properties.Type) || 'runner') as any,
            model: utils.getSelect(page.properties.Model),
            squad: utils.getSelect(page.properties.Squad),
            val: utils.getSelect(page.properties.Type) === 'core' ? 6 : 4,
            tasks_running: utils.getNumber(page.properties.TasksRunning),
            queue_depth: utils.getNumber(page.properties.QueueDepth),
            has_active_work: utils.getNumber(page.properties.TasksRunning) > 0,
            status,
            last_active: lastActive
          };
        });



        // ---- Build the new edge set and virtual squad nodes ----
        const freshEdges: GhostEdge[] = [];
        const coreNode = freshNodes.find((n) => n.name === 'Kate' || n.type === 'core');

        if (coreNode) {
          const squads = new Set<string>();
          freshNodes.forEach((n) => { if (n.squad) squads.add(n.squad); });

          squads.forEach(squad => {
            const squadNodeId = `squad-${squad}`;
            if (!freshNodes.find(n => n.id === squadNodeId)) {
              freshNodes.push({
                id: squadNodeId,
                name: `${squad.toUpperCase()} SQUAD`,
                type: 'squad',
                val: 5,
                tasks_running: 0,
                queue_depth: 0,
                has_active_work: false
              });
            }
            freshEdges.push({ source: coreNode.id, target: squadNodeId });
          });

          freshNodes.forEach((n) => {
            if (n.id !== coreNode.id && n.type !== 'squad' && !n.id.startsWith('squad-')) {
              if (n.squad) {
                freshEdges.push({ source: `squad-${n.squad}`, target: n.id });
              } else {
                freshEdges.push({ source: coreNode.id, target: n.id });
              }
            }
          });
        }

        // Always set the full fresh data — the SVG renderer is static
        // and doesn't have a physics simulation to disturb, so there's
        // no reason to do complex in-place mutation anymore.
        set({ nodes: freshNodes, edges: freshEdges });

        return;
      }

      // If Notion isn't configured, try the local API
      const response = await api.get('/agents');
      if (response.data && response.data.agents) {
        const nodes = response.data.agents.map((a: any) => ({
          ...a,
          val: a.type === 'core' ? 6 : 4
        }));
        
        // Dynamically create edges: construct a hierarchy Grouped by Squad
        const edges: any[] = [];
        const coreNode = nodes.find((n: any) => n.type === 'core');
        
        if (coreNode) {
          const squads = new Set<string>();
          nodes.forEach((n: any) => { if (n.squad) squads.add(n.squad); });
          
          squads.forEach(squad => {
            const squadId = `squad-${squad}`;
            nodes.push({ 
              id: squadId, 
              name: `${squad} Squad`, 
              type: 'squad', 
              val: 5,
              tasks_running: 0,
              queue_depth: 0,
              has_active_work: false
            });
            edges.push({ source: coreNode.id, target: squadId });
          });
          
          nodes.forEach((n: any) => {
            if (n.id !== coreNode.id && n.type !== 'squad') {
              if (n.squad) {
                edges.push({ source: `squad-${n.squad}`, target: n.id });
              } else {
                edges.push({ source: coreNode.id, target: n.id });
              }
            }
          });
        }
        
        set({ nodes, edges });
      }
    } catch (error: any) {
      console.error('[GhostStore] fetchTopology error:', error?.message, error?.response?.status, error?.response?.data);
      // Fallback mock data if server fails temporarily
      if (get().nodes.length === 0) {
        set({
           nodes: [
             { id: 'director', name: 'The Director', type: 'core', val: 5 },
             { id: 'kimi-code', name: 'Kimi (Code)', type: 'fixer', model: 'cyan', val: 3 },
             { id: 'claude-write', name: 'Claude (Writer)', type: 'fixer', model: 'purple', val: 3 },
           ],
           edges: [
             { source: 'director', target: 'kimi-code' },
             { source: 'director', target: 'claude-write' }
           ]
        });
      }
    }
  }
}));

// Initialize socket listeners for real-time node updates
const socket = socketService.getSocket();
if (socket) {
  socket.on('topology_update', (data) => {
    useGhostStore.getState().updateNodes(data.nodes);
    useGhostStore.getState().updateEdges(data.edges);
  });
}
