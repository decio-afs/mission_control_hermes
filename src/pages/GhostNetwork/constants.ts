import type { GhostNode } from '../../stores/useGhostStore';
import type { Zone, InteractiveObject, AgentActivity } from './types';

export const ROOM_WIDTH = 1000;
export const ROOM_HEIGHT = 600;

// Zone positions - adjusted for new layout
export const ZONES: Record<string, Zone> = {
  lounge: { x: 20, y: 280, w: 200, h: 280 },
  coffee: { x: 240, y: 280, w: 200, h: 280 },
  recharge: { x: 460, y: 280, w: 200, h: 280 },
  desk: { x: 680, y: 280, w: 300, h: 280 },
  mainframe: { x: 750, y: 50, w: 230, h: 200 },
};

// Window/cityscape area - moved to the left
export const WINDOW = { x: 80, y: 20, w: 520, h: 240 };

// Mainframe plug positions - at floor level so agents don't levitate
// 8 positions for max 8 active agents
export const MAINFRAME_PLUGS = [
  { x: 800, y: 280 }, { x: 850, y: 280 }, { x: 900, y: 280 }, { x: 950, y: 280 },
  { x: 825, y: 310 }, { x: 875, y: 310 }, { x: 925, y: 310 }, { x: 975, y: 310 },
];

// Interactive objects that agents can use
// Z values are calculated as: zone.y + localY (for proper depth sorting)
export const INTERACTIVE_OBJECTS: Record<string, InteractiveObject[]> = {
  // Lounge - couches and chairs
  lounge: [
    { x: 60, y: 320, z: 350, type: 'couch' },   // Front of couch where agents sit
    { x: 140, y: 340, z: 370, type: 'couch' },
    { x: 40, y: 380, z: 410, type: 'chair' },
    { x: 120, y: 400, z: 430, type: 'chair' },
  ],
  // Café - stools at counter
  coffee: [
    { x: 60, y: 330, z: 360, type: 'stool' },   // Stool sitting position
    { x: 110, y: 330, z: 360, type: 'stool' },
    { x: 160, y: 330, z: 360, type: 'stool' },
    { x: 80, y: 400, z: 430, type: 'table' },
    { x: 140, y: 420, z: 450, type: 'table' },
  ],
  // Recharge - pods
  recharge: [
    { x: 500, y: 320, z: 350, type: 'pod' },    // Pod center position
    { x: 570, y: 320, z: 350, type: 'pod' },
    { x: 630, y: 320, z: 350, type: 'pod' },
  ],
  // Workstations - desks with computers
  desk: [
    { x: 720, y: 300, z: 335, type: 'computer' },  // Chair position in front of desk
    { x: 820, y: 300, z: 335, type: 'computer' },
    { x: 900, y: 300, z: 335, type: 'computer' },
    { x: 720, y: 400, z: 435, type: 'computer' },
    { x: 820, y: 400, z: 435, type: 'computer' },
    { x: 900, y: 400, z: 435, type: 'computer' },
  ],
};

// Furniture objects - each is a SOLID object with a single Z position
// Agents are sorted by Z and rendered interleaved with furniture
export const FURNITURE_OBJECTS = [
  // Mainframe area (back of room)
  { id: 'mainframe', type: 'mainframe', x: 865, y: 115, z: 115 },

  // Recharge pods - back row (higher up in the room)
  { id: 'pod1', type: 'pod', x: 530, y: 320, z: 320 },
  { id: 'pod2', type: 'pod', x: 580, y: 320, z: 320 },
  { id: 'pod3', type: 'pod', x: 630, y: 320, z: 320 },
  // Recharge pods - front row (closer to floor)
  { id: 'pod4', type: 'pod', x: 530, y: 440, z: 440 },
  { id: 'pod5', type: 'pod', x: 580, y: 440, z: 440 },
  { id: 'pod6', type: 'pod', x: 630, y: 440, z: 440 },

  // Lounge/CHILL area - 3 sofas in U-shape arrangement
  { id: 'couchLeft', type: 'couchSide', x: 60, y: 420, z: 420 },       // Left couch (rotated, facing right)
  { id: 'couchRight', type: 'couchMain', x: 160, y: 360, z: 360 },     // Right couch (rotated, facing left)
  { id: 'couchBottom', type: 'couchBottom', x: 160, y: 480, z: 480 },  // Bottom couch (facing up)
  // Coffee table in the center
  { id: 'coffeeTable', type: 'coffeeTable', x: 160, y: 420, z: 420 },  // Center coffee table
  // Lamp in the back corner
  { id: 'lamp', type: 'lamp', x: 45, y: 320, z: 330 },                 // Corner lamp (back left)

  // Café furniture  
  { id: 'counter', type: 'counter', x: 275, y: 330, z: 330 },
  { id: 'stool1', type: 'stool', x: 295, y: 395, z: 395 },
  { id: 'stool2', type: 'stool', x: 335, y: 395, z: 395 },
  { id: 'stool3', type: 'stool', x: 375, y: 395, z: 395 },
  { id: 'stool4', type: 'stool', x: 415, y: 395, z: 395 },

  // Workstation desks and chairs (chairs are separate for agents to sit)
  { id: 'desk1', type: 'desk', x: 725, y: 335, z: 335 },
  { id: 'chair1', type: 'officeChair', x: 755, y: 415, z: 415 },
  { id: 'desk2', type: 'desk', x: 825, y: 335, z: 335 },
  { id: 'chair2', type: 'officeChair', x: 855, y: 415, z: 415 },
  { id: 'desk3', type: 'desk', x: 925, y: 335, z: 335 },
  { id: 'chair3', type: 'officeChair', x: 955, y: 415, z: 415 },
  { id: 'desk4', type: 'desk', x: 755, y: 445, z: 445 },
  { id: 'chair4', type: 'officeChair', x: 785, y: 525, z: 525 },
  { id: 'desk5', type: 'desk', x: 855, y: 445, z: 445 },
  { id: 'chair5', type: 'officeChair', x: 885, y: 525, z: 525 },
];

// Room boundaries
export const ROOM_BOUNDS = {
  minX: 20, maxX: 980,
  minY: 280, maxY: 580,
};

// Waiting positions when all spots are occupied
export const WAITING_POSITIONS: Record<AgentActivity, Array<{ x: number, y: number, z: number }>> = {
  // Near the lounge area but not on the sofas
  lounge_sit: [
    { x: 30, y: 480, z: 480 },
    { x: 30, y: 500, z: 500 },
    { x: 30, y: 520, z: 520 },
  ],
  // Near the café counter
  café_sit: [
    { x: 340, y: 450, z: 450 },
    { x: 380, y: 450, z: 450 },
    { x: 420, y: 450, z: 450 },
    { x: 460, y: 450, z: 450 },
  ],
  // Near the workstations
  desk_work: [
    { x: 700, y: 550, z: 550 },
    { x: 750, y: 550, z: 550 },
    { x: 800, y: 550, z: 550 },
    { x: 850, y: 550, z: 550 },
  ],
  // Near the recharge pods
  pod_recharge: [
    { x: 500, y: 500, z: 500 },
    { x: 580, y: 500, z: 500 },
    { x: 660, y: 500, z: 500 },
  ],
};

// Animation constants
export const ANIMATION_SPEED = 0.6;
export const ACTIVITY_DURATION = 180;

// Squad-based suit colors
export const SQUAD_COLORS: Record<string, string> = {
  'Ghost Legion - Content': '#f59e0b',      // Amber
  'Ghost Legion - Development': '#3b82f6',  // Blue  
  'Ghost Legion - Security': '#ef4444',     // Red
  'Ghost Legion - Intelligence': '#8b5cf6', // Purple
  'Ghost Legion - Infrastructure': '#10b981', // Emerald
  'Ghost Director': '#ec4899',              // Pink
};

// Mock agents - matching the Notion database
export const MOCK_AGENTS: GhostNode[] = [
  { id: 'core-1', name: 'Kate', type: 'core', val: 6, status: 'active', tasks_running: 0, queue_depth: 0, has_active_work: true, last_active: new Date() },
  { id: 'core-2', name: 'Kate (The Director)', type: 'core', val: 6, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'core-3', name: 'Architect Specter', type: 'core', val: 6, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'core-4', name: 'Analyst Specter', type: 'core', val: 6, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'agent-1', name: 'Silicon-Samurai', type: 'runner', model: 'cyan', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'agent-2', name: 'The Prophet', type: 'runner', model: 'purple', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'agent-3', name: 'Word-Smith', type: 'runner', model: 'haiku', val: 4, status: 'active', tasks_running: 1, queue_depth: 0, has_active_work: true },
  { id: 'agent-4', name: 'The Red Pen', type: 'runner', model: 'cyan', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'agent-5', name: 'The Hook', type: 'runner', model: 'sonnet', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'agent-6', name: 'The Architect', type: 'runner', model: 'purple', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'agent-7', name: 'VJ-Ripper', type: 'runner', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'agent-8', name: 'Chrome-Runner', type: 'runner', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'fixer-1', name: 'Blackwatch', type: 'fixer', model: 'sonnet', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'fixer-2', name: 'Morningstar', type: 'fixer', model: 'haiku', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'fixer-3', name: 'The Analyst (Ghost Legion)', type: 'fixer', model: 'cyan', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'fixer-4', name: 'The Weaver', type: 'fixer', model: 'purple', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'fixer-5', name: 'Clockwork', type: 'fixer', model: 'sonnet', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'fixer-6', name: 'Mnemosyne', type: 'fixer', model: 'haiku', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'fixer-7', name: 'Switchboard', type: 'fixer', model: 'cyan', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'fixer-8', name: 'Overwatch', type: 'fixer', model: 'purple', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'fixer-9', name: 'Scout Specter', type: 'fixer', model: 'sonnet', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'fixer-10', name: 'Hunter Specter', type: 'fixer', model: 'haiku', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'fixer-11', name: 'Phantom Specter', type: 'fixer', model: 'cyan', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
];
