import type { GhostNode } from '../../stores/useGhostStore';

export type AgentState = 'idle' | 'walking' | 'wandering' | 'sitting' | 'working' | 'recharging' | 'plugged' | 'waiting';
export type ActivityZone = 'lounge' | 'coffee' | 'recharge' | 'desk' | 'mainframe';
export type AgentActivity = 'lounge_sit' | 'café_sit' | 'desk_work' | 'pod_recharge';

export interface WanderPoint {
  x: number;
  y: number;
}

export interface AgentPosition {
  x: number;
  y: number;
  z: number;
  state: AgentState;
  activity?: AgentActivity;
  targetX?: number;
  targetY?: number;
  targetState?: AgentState;
  facing: 'left' | 'right';
  activityTimer: number;
  notionStatus: 'idle' | 'active'; // Track status for transition detection
  // Wandering state
  wanderPoints?: WanderPoint[];
  wanderIndex?: number;
  wanderTimer?: number;
  wanderDuration?: number;
  // Waiting state
  waitingFor?: AgentActivity; // What activity they're queued for
  // Pathfinding around obstacles
  pathWaypoints?: WanderPoint[]; // Temporary waypoints to avoid collisions
  finalTargetX?: number; // Original destination X
  finalTargetY?: number; // Original destination Y
  finalTargetState?: AgentState; // Original destination state
  stuckCounter?: number; // Track how many frames agent has been stuck
  lastPosition?: { x: number; y: number }; // Last position to detect stuck
  stuckCheckPosition?: { x: number; y: number }; // Position sampled when stuck counter resets
}

export interface InteractiveObject {
  x: number;
  y: number;
  z: number;
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
