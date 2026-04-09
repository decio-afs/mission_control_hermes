import { create } from 'zustand';
import { socketService } from '../lib/socket.ts';

interface SystemVitals {
  ramUsedMb: number;
  ramTotalMb: number;
  cpuPercentage: number;
  diskUsedGb: number;
  diskTotalGb: number;
  activeRunners: number;
  connectionLatencyMs: number;
}

interface SystemStore {
  vitals: SystemVitals;
  updateVitals: (vitals: Partial<SystemVitals>) => void;
  fetchDashboard: () => Promise<void>;
}

export const useSystemStore = create<SystemStore>((set) => ({
  vitals: {
    ramUsedMb: 0,
    ramTotalMb: 3819,
    cpuPercentage: 0,
    diskUsedGb: 0,
    diskTotalGb: 80,
    activeRunners: 0,
    connectionLatencyMs: 0
  },
  updateVitals: (newVitals) => set((state) => ({ 
    vitals: { ...state.vitals, ...newVitals } 
  })),
  fetchDashboard: async () => {
    try {
      const { api } = await import('../lib/api.ts');
      const response = await api.get('/dashboard');
      if (response.data) {
        set((state) => ({
          vitals: {
            ...state.vitals,
            ramUsedMb: response.data.memory_usage || response.data.ramUsedMb || state.vitals.ramUsedMb,
            cpuPercentage: response.data.cpu_usage || response.data.cpuPercentage || state.vitals.cpuPercentage,
            activeRunners: response.data.active_agents || response.data.activeRunners || state.vitals.activeRunners,
            connectionLatencyMs: response.data.latency || response.data.connectionLatencyMs || state.vitals.connectionLatencyMs,
          }
        }));
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    }
  }
}));

// Initialize socket listener for telemetry data
const socket = socketService.getSocket();
if (socket) {
  socket.on('telemetry', (data: Partial<SystemVitals>) => {
    useSystemStore.getState().updateVitals(data);
  });
}
