// Agent behavior constants and utilities

export type AgentActivity =
  | 'lounge_sit'
  | 'café_sit'
  | 'desk_work'
  | 'pod_recharge';

// Fixed anchor points for each activity type
export const ACTIVITY_SPOTS: Record<AgentActivity, Array<{ x: number, y: number, z: number }>> = {
  lounge_sit: [
    { x: 145, y: 360, z: 360 },  // couchRight left seat
    { x: 185, y: 360, z: 360 },  // couchRight right seat
    { x: 145, y: 470, z: 470 },  // couchBottom left seat
    { x: 185, y: 470, z: 470 },  // couchBottom right seat
    { x: 65, y: 410, z: 410 },   // couchLeft single seat
  ],
  café_sit: [
    { x: 295, y: 385, z: 385 },  // stool1
    { x: 335, y: 385, z: 385 },  // stool2
    { x: 375, y: 385, z: 385 },  // stool3
    { x: 415, y: 385, z: 385 },  // stool4
  ],
  desk_work: [
    { x: 755, y: 400, z: 400 },  // chair1
    { x: 855, y: 400, z: 400 },  // chair2
    { x: 955, y: 400, z: 400 },  // chair3
    { x: 785, y: 510, z: 510 },  // chair4
    { x: 885, y: 510, z: 510 },  // chair5
  ],
  pod_recharge: [
    // Back row pods
    { x: 530, y: 360, z: 360 },
    { x: 580, y: 360, z: 360 },
    { x: 630, y: 360, z: 360 },
    // Front row pods
    { x: 530, y: 480, z: 480 },
    { x: 580, y: 480, z: 480 },
    { x: 630, y: 480, z: 480 },
  ],
};

// Mainframe plug positions - at floor level so agents don't levitate
// 8 positions for max 8 active agents
export const MAINFRAME_PLUGS = [
  { x: 800, y: 280, z: 280 },
  { x: 850, y: 280, z: 280 },
  { x: 900, y: 280, z: 280 },
  { x: 950, y: 280, z: 280 },
  { x: 825, y: 310, z: 310 },
  { x: 875, y: 310, z: 310 },
  { x: 925, y: 310, z: 310 },
  { x: 975, y: 310, z: 310 },
];

// Activity duration in frames (at 60fps: 300-600 frames = 5-10 seconds)
export function getActivityDuration(agentIndex: number): number {
  return 300 + (agentIndex * 73) % 300; // Random between 300-600
}

// Get state from activity type
export function getStateFromActivity(activity: AgentActivity): 'sitting' | 'working' | 'recharging' {
  switch (activity) {
    case 'lounge_sit':
    case 'café_sit':
      return 'sitting';
    case 'desk_work':
      return 'working';
    case 'pod_recharge':
      return 'recharging';
    default:
      return 'sitting';
  }
}

// Get next random activity (different from current)
export function getNextActivity(currentActivity: AgentActivity | undefined, agentIndex: number): AgentActivity {
  const activities: AgentActivity[] = ['lounge_sit', 'café_sit', 'desk_work', 'pod_recharge'];

  if (!currentActivity) {
    return activities[agentIndex % activities.length];
  }

  const currentIndex = activities.indexOf(currentActivity);
  // Pick next activity (cycle through, skip current)
  const nextIndex = (currentIndex + 1 + agentIndex) % activities.length;
  return activities[nextIndex];
}

// Get spot for activity
export function getActivitySpot(activity: AgentActivity, agentIndex: number): { x: number, y: number, z: number } {
  const spots = ACTIVITY_SPOTS[activity];
  return spots[agentIndex % spots.length];
}

// Get mainframe plug for agent
export function getMainframePlug(agentIndex: number): { x: number, y: number, z: number } {
  return MAINFRAME_PLUGS[agentIndex % MAINFRAME_PLUGS.length];
}

// Animation speeds
export const SPEEDS = {
  walking: 0.8,
  running: 1.5, // When status is 'active'
  wandering: 0.5, // Casual stroll between activities
  arrivalThreshold: 5,
};

// Wandering configuration (between activities)
export const WANDER_CONFIG = {
  minPoints: 2,
  maxPoints: 4,
  minDuration: 180,  // 3 seconds at 60fps
  maxDuration: 480,  // 8 seconds at 60fps
};

// Room bounds for wandering
export const ROOM_BOUNDS = {
  xMin: 60,
  xMax: 940,
  yMin: 300,
  yMax: 550,
};

// Collision boxes - café counter + 5 workstations + 3 sofas
export const COLLISION_BOXES = [
  { x: 275, y: 350, width: 160, height: 30 },   // Café counter
  { x: 725, y: 370, width: 80, height: 30 },    // Workstation 1 (desk1)
  { x: 825, y: 370, width: 80, height: 30 },    // Workstation 2 (desk2)
  { x: 925, y: 370, width: 80, height: 30 },    // Workstation 3 (desk3)
  { x: 755, y: 480, width: 80, height: 30 },    // Workstation 4 (desk4)
  { x: 855, y: 480, width: 80, height: 30 },    // Workstation 5 (desk5)
  { x: 25, y: 420, width: 60, height: 20 },     // Sofa Left (couchSide)
  { x: 110, y: 330, width: 100, height: 30 },   // Sofa Right (couchMain)
  { x: 110, y: 490, width: 100, height: 30 },   // Sofa Bottom (couchBottom)
];

/**
 * Check if a point is inside any collision box (with small safety buffer)
 */
export function isPointInCollisionBox(x: number, y: number): boolean {
  const buffer = 4;
  for (const box of COLLISION_BOXES) {
    if (x >= box.x - buffer && x < box.x + box.width + buffer &&
      y >= box.y - buffer && y < box.y + box.height + buffer) {
      return true;
    }
  }
  return false;
}

/**
 * Simple slide: try direct step, else horizontal, else vertical, else stay put.
 */
export function slideMovement(
  posX: number,
  posY: number,
  targetX: number,
  targetY: number,
  speed: number
): { x: number; y: number } {
  const dx = targetX - posX;
  const dy = targetY - posY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { x: posX, y: posY };

  const desiredX = posX + (dx / dist) * speed;
  const desiredY = posY + (dy / dist) * speed;

  if (!isPointInCollisionBox(desiredX, desiredY)) {
    return { x: desiredX, y: desiredY };
  }

  // Already inside a box - push out immediately
  if (isPointInCollisionBox(posX, posY)) {
    return getClosestPointOutsideCollisionBox(posX, posY);
  }

  // Try sliding horizontally
  if (!isPointInCollisionBox(desiredX, posY)) {
    return { x: desiredX, y: posY };
  }
  // Try sliding vertically
  if (!isPointInCollisionBox(posX, desiredY)) {
    return { x: posX, y: desiredY };
  }

  // Trapped - stay put
  return { x: posX, y: posY };
}

/**
 * Find the closest point outside any collision box
 * Returns the original point if not inside any box
 */
export function getClosestPointOutsideCollisionBox(x: number, y: number): { x: number; y: number } {
  for (const box of COLLISION_BOXES) {
    const buffer = 4;
    if (x >= box.x - buffer && x < box.x + box.width + buffer &&
      y >= box.y - buffer && y < box.y + box.height + buffer) {
      const distToLeft = x - (box.x - buffer);
      const distToRight = box.x + box.width + buffer - x;
      const distToTop = y - (box.y - buffer);
      const distToBottom = box.y + box.height + buffer - y;

      const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

      if (minDist === distToLeft) return { x: box.x - buffer - 10, y };
      if (minDist === distToRight) return { x: box.x + box.width + buffer + 10, y };
      if (minDist === distToTop) return { x, y: box.y - buffer - 10 };
      return { x, y: box.y + box.height + buffer + 10 };
    }
  }
  return { x, y };
}

/**
 * Simple seeded random number generator (0-1)
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

/**
 * Generate random wander points within room bounds, avoiding collision boxes
 */
export function generateWanderPoints(seed: number, count?: number): Array<{ x: number; y: number }> {
  const numPoints = count ?? WANDER_CONFIG.minPoints + Math.floor(seededRandom(seed) * (WANDER_CONFIG.maxPoints - WANDER_CONFIG.minPoints + 1));
  const points = [];

  for (let i = 0; i < numPoints; i++) {
    const rand1 = seededRandom(seed + i * 137);
    const rand2 = seededRandom(seed + i * 53 + 73);
    const x = ROOM_BOUNDS.xMin + Math.floor(rand1 * (ROOM_BOUNDS.xMax - ROOM_BOUNDS.xMin));
    const y = ROOM_BOUNDS.yMin + Math.floor(rand2 * (ROOM_BOUNDS.yMax - ROOM_BOUNDS.yMin));

    // Ensure point is outside collision boxes
    const safePos = getClosestPointOutsideCollisionBox(x, y);
    points.push(safePos);
  }
  return points;
}

/**
 * Generate random wander duration in frames
 */
export function generateWanderDuration(seed: number): number {
  return WANDER_CONFIG.minDuration + Math.floor(seededRandom(seed) * (WANDER_CONFIG.maxDuration - WANDER_CONFIG.minDuration));
}
