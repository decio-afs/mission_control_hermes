import type { GhostNode } from '../../stores/useGhostStore';

export type AgentState = 'idle' | 'walking' | 'sitting' | 'working' | 'recharging' | 'plugged';
export type ActivityZone = 'lounge' | 'coffee' | 'recharge' | 'desk' | 'mainframe';

export interface AgentPosition {
  x: number;
  y: number;
  z: number;  // Depth position - derived from Y for 2.5D effect
  targetX?: number;
  targetY?: number;
  state: AgentState;
  targetState?: AgentState;
  facing: 'left' | 'right';
  zone?: ActivityZone;
  activityTimer: number;
}

export interface InteractiveObject {
  x: number;
  y: number;
  z: number;  // Depth position for proper sorting
  type: 'couch' | 'chair' | 'stool' | 'table' | 'pod' | 'computer';
}

export interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AgentSpriteProps {
  node: GhostNode;
  position: AgentPosition;
  isSelected: boolean;
  onClick: () => void;
}

export interface UnifiedLayerProps {
  nodes: GhostNode[];
  positions: Map<string, AgentPosition>;
  selectedNode: GhostNode | null;
  onNodeClick: (node: GhostNode) => void;
}

export interface RetroTerminalPopupProps {
  node: GhostNode;
  onClose: () => void;
}

// Furniture layer definition for Z-depth sorting
export interface FurnitureLayer {
  key: string;
  z: number;
  element: React.ReactNode;
}
