import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RefreshCw, Cpu } from 'lucide-react';
import { useGhostStore } from '../stores/useGhostStore';
import type { GhostNode } from '../stores/useGhostStore';
import { RetroTerminalPopup } from '../components/RetroTerminalPopup';
import { RoomBackground, FurnitureObject } from './GhostNetwork/RoomScene';
import { CharacterSprite } from './GhostNetwork/CharacterSprites';
import {
  ROOM_WIDTH,
  ROOM_HEIGHT,
  MOCK_AGENTS,
  FURNITURE_OBJECTS,
  WAITING_POSITIONS,
} from './GhostNetwork/constants';
import type { AgentPosition, AgentActivity, AgentState } from './GhostNetwork/types';
import {
  getActivitySpot,
  getMainframePlug,
  getStateFromActivity,
  getNextActivity,
  getActivityDuration,
  SPEEDS,
  generateWanderPoints,
  generateWanderDuration,
  getClosestPointOutsideCollisionBox,
  isPointInCollisionBox,
  slideMovement,
} from './GhostNetwork/AgentBehavior';
import { findPath } from './GhostNetwork/pathfinder';

function buildWalkState(
  pos: AgentPosition,
  targetX: number,
  targetY: number,
  targetState: AgentState,
  extras?: Partial<AgentPosition>
): AgentPosition {
  const path = findPath(pos.x, pos.y, targetX, targetY);
  // If start and end are in the same grid cell, path may only have 1 point
  if (path.length === 1) {
    return {
      ...pos,
      state: targetState === 'waiting' ? 'waiting' : targetState,
      x: targetX,
      y: targetY,
      z: targetY,
      targetX: undefined,
      targetY: undefined,
      targetState: undefined,
      finalTargetX: undefined,
      finalTargetY: undefined,
      finalTargetState: undefined,
      pathWaypoints: undefined,
      stuckCounter: 0,
      stuckCheckPosition: { x: targetX, y: targetY },
      ...extras,
    };
  }
  if (path.length > 2) {
    const waypoints = path.slice(2, -1);
    const firstWaypoint = path[1];
    return {
      ...pos,
      state: 'walking',
      targetX: firstWaypoint.x,
      targetY: firstWaypoint.y,
      targetState,
      finalTargetX: targetX,
      finalTargetY: targetY,
      finalTargetState: targetState,
      pathWaypoints: waypoints.length > 0 ? waypoints : undefined,
      stuckCounter: 0,
      stuckCheckPosition: { x: pos.x, y: pos.y },
      ...extras,
    };
  }
  return {
    ...pos,
    state: 'walking',
    targetX: path[1].x,
    targetY: path[1].y,
    targetState,
    finalTargetX: targetX,
    finalTargetY: targetY,
    finalTargetState: targetState,
    pathWaypoints: undefined,
    stuckCounter: 0,
    stuckCheckPosition: { x: pos.x, y: pos.y },
    ...extras,
  };
}

export default function GhostNetwork() {
  const { nodes, fetchTopology } = useGhostStore();
  const [selectedNode, setSelectedNode] = useState<GhostNode | null>(null);
  const [agentPositions, setAgentPositions] = useState<Map<string, AgentPosition>>(new Map());
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<GhostNode[]>([]);
  
  // Pod queue system - track which pods are occupied
  const podStatusRef = useRef<Map<number, string | null>>(new Map([
    [0, null], [1, null], [2, null], // Back row
    [3, null], [4, null], [5, null], // Front row
  ]));
  
  // Chair queue system - track which workstation chairs are occupied
  const chairStatusRef = useRef<Map<number, string | null>>(new Map([
    [0, null], [1, null], [2, null], // Top row
    [3, null], [4, null],             // Bottom row
  ]));
  
  // Stool queue system - track which café stools are occupied
  const stoolStatusRef = useRef<Map<number, string | null>>(new Map([
    [0, null], [1, null], [2, null], [3, null], // 4 stools at café bar
  ]));
  
  // Sofa queue system - track which sofa positions are occupied
  // couchRight: 2 positions, couchBottom: 2 positions, couchLeft: 1 position = 5 total
  const sofaStatusRef = useRef<Map<number, string | null>>(new Map([
    [0, null], [1, null], // couchRight positions
    [2, null], [3, null], // couchBottom positions
    [4, null],            // couchLeft position
  ]));
  
  // Waiting queues - track agents waiting for each activity type
  const waitingQueuesRef = useRef<Map<AgentActivity, string[]>>(new Map([
    ['lounge_sit', []],
    ['café_sit', []],
    ['desk_work', []],
    ['pod_recharge', []],
  ]));

  const displayNodes = nodes.length > 0 ? nodes : MOCK_AGENTS;
  
  // Helper: Find available pod for agent
  const findAvailablePod = useCallback((agentId: string): number | null => {
    const pods = podStatusRef.current;
    // Check if agent already has a pod
    for (const [podIndex, occupantId] of pods.entries()) {
      if (occupantId === agentId) return podIndex;
    }
    // Find first available pod
    for (const [podIndex, occupantId] of pods.entries()) {
      if (occupantId === null) return podIndex;
    }
    return null; // All pods occupied
  }, []);
  
  // Helper: Release pod when agent leaves
  const releasePod = useCallback((agentId: string) => {
    const pods = podStatusRef.current;
    for (const [podIndex, occupantId] of pods.entries()) {
      if (occupantId === agentId) {
        pods.set(podIndex, null);
        break;
      }
    }
  }, []);
  
  // Helper: Assign pod to agent
  const assignPod = useCallback((agentId: string, podIndex: number) => {
    podStatusRef.current.set(podIndex, agentId);
  }, []);
  
  // Helper: Find available chair for agent
  const findAvailableChair = useCallback((agentId: string): number | null => {
    const chairs = chairStatusRef.current;
    // Check if agent already has a chair
    for (const [chairIndex, occupantId] of chairs.entries()) {
      if (occupantId === agentId) return chairIndex;
    }
    // Find first available chair
    for (const [chairIndex, occupantId] of chairs.entries()) {
      if (occupantId === null) return chairIndex;
    }
    return null; // All chairs occupied
  }, []);
  
  // Helper: Release chair when agent leaves
  const releaseChair = useCallback((agentId: string) => {
    const chairs = chairStatusRef.current;
    for (const [chairIndex, occupantId] of chairs.entries()) {
      if (occupantId === agentId) {
        chairs.set(chairIndex, null);
        break;
      }
    }
  }, []);
  
  // Helper: Assign chair to agent
  const assignChair = useCallback((agentId: string, chairIndex: number) => {
    chairStatusRef.current.set(chairIndex, agentId);
  }, []);
  
  // Helper: Find available stool for agent
  const findAvailableStool = useCallback((agentId: string): number | null => {
    const stools = stoolStatusRef.current;
    // Check if agent already has a stool
    for (const [stoolIndex, occupantId] of stools.entries()) {
      if (occupantId === agentId) return stoolIndex;
    }
    // Find first available stool
    for (const [stoolIndex, occupantId] of stools.entries()) {
      if (occupantId === null) return stoolIndex;
    }
    return null; // All stools occupied
  }, []);
  
  // Helper: Release stool when agent leaves
  const releaseStool = useCallback((agentId: string) => {
    const stools = stoolStatusRef.current;
    for (const [stoolIndex, occupantId] of stools.entries()) {
      if (occupantId === agentId) {
        stools.set(stoolIndex, null);
        break;
      }
    }
  }, []);
  
  // Helper: Assign stool to agent
  const assignStool = useCallback((agentId: string, stoolIndex: number) => {
    stoolStatusRef.current.set(stoolIndex, agentId);
  }, []);
  
  // Helper: Find available sofa position for agent
  const findAvailableSofa = useCallback((agentId: string): number | null => {
    const sofas = sofaStatusRef.current;
    // Check if agent already has a sofa position
    for (const [sofaIndex, occupantId] of sofas.entries()) {
      if (occupantId === agentId) return sofaIndex;
    }
    // Find first available sofa position
    for (const [sofaIndex, occupantId] of sofas.entries()) {
      if (occupantId === null) return sofaIndex;
    }
    return null; // All sofa positions occupied
  }, []);
  
  // Helper: Release sofa position when agent leaves
  const releaseSofa = useCallback((agentId: string) => {
    const sofas = sofaStatusRef.current;
    for (const [sofaIndex, occupantId] of sofas.entries()) {
      if (occupantId === agentId) {
        sofas.set(sofaIndex, null);
        break;
      }
    }
  }, []);
  
  // Helper: Assign sofa position to agent
  const assignSofa = useCallback((agentId: string, sofaIndex: number) => {
    sofaStatusRef.current.set(sofaIndex, agentId);
  }, []);
  
  // Helper: Add agent to waiting queue
  const addToWaitingQueue = useCallback((agentId: string, activity: AgentActivity): number => {
    const queue = waitingQueuesRef.current.get(activity) || [];
    if (!queue.includes(agentId)) {
      queue.push(agentId);
      waitingQueuesRef.current.set(activity, queue);
    }
    return queue.indexOf(agentId);
  }, []);
  
  // Helper: Remove agent from waiting queue
  const removeFromWaitingQueue = useCallback((agentId: string) => {
    for (const [activity, queue] of waitingQueuesRef.current.entries()) {
      const index = queue.indexOf(agentId);
      if (index !== -1) {
        queue.splice(index, 1);
        waitingQueuesRef.current.set(activity, queue);
        break;
      }
    }
  }, []);
  
  // Helper: Get waiting position for agent
  const getWaitingPosition = useCallback((activity: AgentActivity, queuePosition: number) => {
    const positions = WAITING_POSITIONS[activity];
    return positions[Math.min(queuePosition, positions.length - 1)];
  }, []);
  
  // Keep nodesRef in sync
  useEffect(() => {
    nodesRef.current = displayNodes;
  }, [displayNodes]);

  // Initialize agent positions - start at random activities
  useEffect(() => {
    // Reset all furniture assignments on re-initialization (when switching from mock to real data)
    podStatusRef.current = new Map([
      [0, null], [1, null], [2, null], [3, null], [4, null], [5, null],
    ]);
    chairStatusRef.current = new Map([
      [0, null], [1, null], [2, null], [3, null], [4, null],
    ]);
    stoolStatusRef.current = new Map([
      [0, null], [1, null], [2, null], [3, null],
    ]);
    sofaStatusRef.current = new Map([
      [0, null], [1, null], // couchRight positions
      [2, null], [3, null], // couchBottom positions
      [4, null],            // couchLeft position
    ]);
    waitingQueuesRef.current = new Map([
      ['lounge_sit', []],
      ['café_sit', []],
      ['desk_work', []],
      ['pod_recharge', []],
    ]);


    const initial = new Map<string, AgentPosition>();

    displayNodes.forEach((node, i) => {
      const existingPos = agentPositions.get(node.id);

      if (existingPos) {
        initial.set(node.id, { ...existingPos });
      } else {
        const isCore = node.type === 'core';
        const isActive = node.status === 'active';

        if (isCore) {
          // Core agents start at mainframe
          const plug = getMainframePlug(i);
          initial.set(node.id, {
            x: plug.x,
            y: plug.y,
            z: plug.z,
            state: 'plugged',
            facing: 'right',
            activityTimer: 0,
            notionStatus: 'active',
            stuckCounter: 0,
            stuckCheckPosition: { x: plug.x, y: plug.y },
          });
        } else if (isActive) {
          // Active agents walk to mainframe
          const plug = getMainframePlug(i);
          const startX = plug.x + 100;
          const startY = plug.y + 50;
          const basePos: AgentPosition = {
            x: startX,
            y: startY,
            z: startY,
            state: 'walking',
            facing: 'left',
            activityTimer: 0,
            notionStatus: 'active',
            stuckCounter: 0,
            stuckCheckPosition: { x: startX, y: startY },
          };
          initial.set(node.id, buildWalkState(basePos, plug.x, plug.y, 'plugged'));
        } else {
          // Idle agents start at random activity
          const activities: AgentActivity[] = ['lounge_sit', 'café_sit', 'desk_work', 'pod_recharge'];
          const activity = activities[i % activities.length];
          let spotIndex = i;
          
          // Handle pod assignment for initial positions
          if (activity === 'pod_recharge') {
            const availablePod = findAvailablePod(node.id);
            if (availablePod !== null) {
              assignPod(node.id, availablePod);
              spotIndex = availablePod;
            } else {
              // All pods occupied - go to waiting position
              const queuePos = addToWaitingQueue(node.id, 'pod_recharge');
              const waitSpot = getWaitingPosition('pod_recharge', queuePos);
              initial.set(node.id, {
                x: waitSpot.x + (Math.random() - 0.5) * 10,
                y: waitSpot.y,
                z: waitSpot.z,
                state: 'waiting',
                activity: 'pod_recharge',
                waitingFor: 'pod_recharge',
                facing: Math.random() > 0.5 ? 'left' : 'right',
                activityTimer: i * 50,
                notionStatus: 'idle',
                stuckCounter: 0,
                stuckCheckPosition: { x: waitSpot.x, y: waitSpot.y },
              });
              return;
            }
          }
          
          // Handle chair assignment for initial positions
          if (activity === 'desk_work') {
            const availableChair = findAvailableChair(node.id);
            if (availableChair !== null) {
              assignChair(node.id, availableChair);
              spotIndex = availableChair;
            } else {
              // All chairs occupied - go to waiting position
              const queuePos = addToWaitingQueue(node.id, 'desk_work');
              const waitSpot = getWaitingPosition('desk_work', queuePos);
              initial.set(node.id, {
                x: waitSpot.x + (Math.random() - 0.5) * 10,
                y: waitSpot.y,
                z: waitSpot.z,
                state: 'waiting',
                activity: 'desk_work',
                waitingFor: 'desk_work',
                facing: Math.random() > 0.5 ? 'left' : 'right',
                activityTimer: i * 50,
                notionStatus: 'idle',
                stuckCounter: 0,
                stuckCheckPosition: { x: waitSpot.x, y: waitSpot.y },
              });
              return;
            }
          }
          
          // Handle stool assignment for initial positions
          if (activity === 'café_sit') {
            const availableStool = findAvailableStool(node.id);
            if (availableStool !== null) {
              assignStool(node.id, availableStool);
              spotIndex = availableStool;
            } else {
              // All stools occupied - go to waiting position
              const queuePos = addToWaitingQueue(node.id, 'café_sit');
              const waitSpot = getWaitingPosition('café_sit', queuePos);
              initial.set(node.id, {
                x: waitSpot.x + (Math.random() - 0.5) * 10,
                y: waitSpot.y,
                z: waitSpot.z,
                state: 'waiting',
                activity: 'café_sit',
                waitingFor: 'café_sit',
                facing: Math.random() > 0.5 ? 'left' : 'right',
                activityTimer: i * 50,
                notionStatus: 'idle',
                stuckCounter: 0,
                stuckCheckPosition: { x: waitSpot.x, y: waitSpot.y },
              });
              return;
            }
          }
          
          // Handle sofa assignment for initial positions
          if (activity === 'lounge_sit') {
            const availableSofa = findAvailableSofa(node.id);
            if (availableSofa !== null) {
              assignSofa(node.id, availableSofa);
              spotIndex = availableSofa;
            } else {
              // All sofas occupied - go to waiting position
              const queuePos = addToWaitingQueue(node.id, 'lounge_sit');
              const waitSpot = getWaitingPosition('lounge_sit', queuePos);
              initial.set(node.id, {
                x: waitSpot.x + (Math.random() - 0.5) * 10,
                y: waitSpot.y,
                z: waitSpot.z,
                state: 'waiting',
                activity: 'lounge_sit',
                waitingFor: 'lounge_sit',
                facing: Math.random() > 0.5 ? 'left' : 'right',
                activityTimer: i * 50,
                notionStatus: 'idle',
                stuckCounter: 0,
                stuckCheckPosition: { x: waitSpot.x, y: waitSpot.y },
              });
              return;
            }
          }
          
          const spot = getActivitySpot(activity, spotIndex);

          initial.set(node.id, {
            x: spot.x + (Math.random() - 0.5) * 20,
            y: spot.y,
            z: spot.z,
            state: getStateFromActivity(activity),
            activity,
            facing: Math.random() > 0.5 ? 'left' : 'right',
            activityTimer: i * 50, // Stagger start times
            notionStatus: 'idle',
            stuckCounter: 0,
            stuckCheckPosition: { x: spot.x, y: spot.y },
          });
        }
      }
    });

    setAgentPositions(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayNodes.length]);

  // Animation loop - state machine
  useEffect(() => {
    if (agentPositions.size === 0) return;

    const animate = () => {
      setAgentPositions(prev => {
        const next = new Map(prev);
        const currentNodes = nodesRef.current;

        currentNodes.forEach((node, index) => {
          const pos = next.get(node.id);
          if (!pos) return;

          const isCore = node.type === 'core';
          const currentNotionStatus = node.status === 'active' ? 'active' : 'idle';

          // === CORE AGENTS: Always at mainframe ===
          if (isCore) {
            const plug = getMainframePlug(index);
            next.set(node.id, {
              ...pos,
              x: plug.x,
              y: plug.y,
              z: plug.z,
              state: 'plugged',
              notionStatus: 'active',
            });
            return;
          }

          // === STATUS CHANGE: IDLE → ACTIVE ===
          if (currentNotionStatus === 'active' && pos.notionStatus === 'idle') {
            // Release current resource before walking to mainframe
            if (pos.state === 'sitting' && pos.activity === 'lounge_sit') {
              releaseSofa(node.id);
            }
            if (pos.state === 'sitting' && pos.activity === 'café_sit') {
              releaseStool(node.id);
            }
            if (pos.state === 'working') {
              releaseChair(node.id);
            }
            if (pos.state === 'recharging') {
              releasePod(node.id);
            }
            const plug = getMainframePlug(index);
            next.set(node.id, buildWalkState(
              { ...pos, notionStatus: 'active' },
              plug.x,
              plug.y,
              'plugged'
            ));
            return;
          }

          // === STATUS CHANGE: ACTIVE → IDLE ===
          if (currentNotionStatus === 'idle' && pos.notionStatus === 'active') {
            let newActivity = getNextActivity(pos.activity, index);
            let targetSpot = getActivitySpot(newActivity, index);
            
            // Handle pod assignment
            if (newActivity === 'pod_recharge') {
              const availablePod = findAvailablePod(node.id);
              if (availablePod !== null) {
                assignPod(node.id, availablePod);
                targetSpot = getActivitySpot('pod_recharge', availablePod);
                removeFromWaitingQueue(node.id);
              } else {
                // All pods occupied - go to waiting position
                const queuePos = addToWaitingQueue(node.id, 'pod_recharge');
                targetSpot = getWaitingPosition('pod_recharge', queuePos);
                newActivity = 'pod_recharge'; // Keep the intended activity
              }
            }
            
            // Handle chair assignment for workstations
            if (newActivity === 'desk_work') {
              const availableChair = findAvailableChair(node.id);
              if (availableChair !== null) {
                assignChair(node.id, availableChair);
                targetSpot = getActivitySpot('desk_work', availableChair);
                removeFromWaitingQueue(node.id);
              } else {
                // All chairs occupied - go to waiting position
                const queuePos = addToWaitingQueue(node.id, 'desk_work');
                targetSpot = getWaitingPosition('desk_work', queuePos);
                newActivity = 'desk_work'; // Keep the intended activity
              }
            }
            
            // Handle stool assignment for café
            if (newActivity === 'café_sit') {
              const availableStool = findAvailableStool(node.id);
              if (availableStool !== null) {
                assignStool(node.id, availableStool);
                targetSpot = getActivitySpot('café_sit', availableStool);
                removeFromWaitingQueue(node.id);
              } else {
                // All stools occupied - go to waiting position
                const queuePos = addToWaitingQueue(node.id, 'café_sit');
                targetSpot = getWaitingPosition('café_sit', queuePos);
                newActivity = 'café_sit'; // Keep the intended activity
              }
            }
            
            // Handle sofa assignment for lounge
            if (newActivity === 'lounge_sit') {
              const availableSofa = findAvailableSofa(node.id);
              if (availableSofa !== null) {
                assignSofa(node.id, availableSofa);
                targetSpot = getActivitySpot('lounge_sit', availableSofa);
                removeFromWaitingQueue(node.id);
              } else {
                // All sofas occupied - go to waiting position
                const queuePos = addToWaitingQueue(node.id, 'lounge_sit');
                targetSpot = getWaitingPosition('lounge_sit', queuePos);
                newActivity = 'lounge_sit'; // Keep the intended activity
              }
            }

            next.set(node.id, buildWalkState(
              { ...pos, activity: newActivity, activityTimer: 0, notionStatus: 'idle' },
              targetSpot.x,
              targetSpot.y,
              getStateFromActivity(newActivity)
            ));
            return;
          }

          // === STATE: WALKING ===
          if (pos.state === 'walking' && pos.targetX !== undefined && pos.targetY !== undefined) {
            const dx = pos.targetX - pos.x;
            const dy = pos.targetY - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < SPEEDS.arrivalThreshold) {
              // Arrived at current target
              if (pos.pathWaypoints && pos.pathWaypoints.length > 0) {
                // Follow next waypoint
                const nextWaypoint = pos.pathWaypoints[0];
                const remainingWaypoints = pos.pathWaypoints.slice(1);
                // Safety: ensure arrival position is outside collision boxes
                let arriveX = pos.targetX;
                let arriveY = pos.targetY;
                if (isPointInCollisionBox(arriveX, arriveY)) {
                  const safe = getClosestPointOutsideCollisionBox(arriveX, arriveY);
                  arriveX = safe.x;
                  arriveY = safe.y;
                }
                next.set(node.id, {
                  ...pos,
                  x: arriveX,
                  y: arriveY,
                  z: arriveY,
                  targetX: nextWaypoint.x,
                  targetY: nextWaypoint.y,
                  pathWaypoints: remainingWaypoints.length > 0 ? remainingWaypoints : undefined,
                  facing: nextWaypoint.x > pos.x ? 'right' : 'left',
                  stuckCounter: 0,
                  stuckCheckPosition: { x: arriveX, y: arriveY },
                });
              } else if (pos.pathWaypoints !== undefined && pos.pathWaypoints.length === 0 && pos.finalTargetX !== undefined) {
                // Waypoints done, now go to final destination
                let arriveX = pos.targetX;
                let arriveY = pos.targetY;
                if (isPointInCollisionBox(arriveX, arriveY)) {
                  const safe = getClosestPointOutsideCollisionBox(arriveX, arriveY);
                  arriveX = safe.x;
                  arriveY = safe.y;
                }
                next.set(node.id, {
                  ...pos,
                  x: arriveX,
                  y: arriveY,
                  z: arriveY,
                  targetX: pos.finalTargetX,
                  targetY: pos.finalTargetY,
                  targetState: pos.finalTargetState,
                  pathWaypoints: undefined,
                  facing: pos.finalTargetX > pos.x ? 'right' : 'left',
                  stuckCounter: 0,
                  stuckCheckPosition: { x: arriveX, y: arriveY },
                });
              } else {
                // Arrived at final destination - snap to exact target if available
                const exactX = pos.finalTargetX ?? pos.targetX;
                const exactY = pos.finalTargetY ?? pos.targetY;
                let arriveX = exactX;
                let arriveY = exactY;
                if (isPointInCollisionBox(arriveX, arriveY)) {
                  const safe = getClosestPointOutsideCollisionBox(arriveX, arriveY);
                  arriveX = safe.x;
                  arriveY = safe.y;
                }
                next.set(node.id, {
                  ...pos,
                  x: arriveX,
                  y: arriveY,
                  z: arriveY,
                  state: pos.targetState || 'idle',
                  targetX: undefined,
                  targetY: undefined,
                  targetState: undefined,
                  pathWaypoints: undefined,
                  finalTargetX: undefined,
                  finalTargetY: undefined,
                  finalTargetState: undefined,
                  activityTimer: 0,
                  stuckCounter: 0,
                  stuckCheckPosition: { x: arriveX, y: arriveY },
                });
              }
            } else {
              // Continue walking - run faster when active
              const speed = pos.notionStatus === 'active' ? SPEEDS.running : SPEEDS.walking;
              const finalDestX = pos.finalTargetX ?? pos.targetX;
              const finalDestY = pos.finalTargetY ?? pos.targetY;

              // Always use sliding movement to handle collisions smoothly
              const moved = slideMovement(pos.x, pos.y, pos.targetX, pos.targetY, speed);

              // Stuck detection: are we actually making progress toward the final destination?
              const checkPos = pos.stuckCheckPosition || { x: pos.x, y: pos.y };
              const sampleInterval = 45;
              const stuckTimer = (pos.stuckCounter || 0) + 1;
              const hasMovedLocally =
                Math.abs(pos.x - checkPos.x) > 10 ||
                Math.abs(pos.y - checkPos.y) > 10;
              const distBefore = Math.hypot(finalDestX - pos.x, finalDestY - pos.y);
              const distAfter = Math.hypot(finalDestX - moved.x, finalDestY - moved.y);
              const makingProgress = distAfter < distBefore - 0.05;

              let nextStuckCounter = stuckTimer;
              let nextCheckPos = checkPos;

              if (makingProgress) {
                nextStuckCounter = 0;
                nextCheckPos = { x: pos.x, y: pos.y };
              } else if (hasMovedLocally && stuckTimer >= sampleInterval) {
                // Significant local movement over the sample window - navigating an obstacle
                nextStuckCounter = 0;
                nextCheckPos = { x: pos.x, y: pos.y };
              } else if (stuckTimer % sampleInterval === 0) {
                // Resample position every interval
                nextCheckPos = { x: pos.x, y: pos.y };
              }

              const isStuck = nextStuckCounter > 120;

              if (isStuck) {
                // Not making progress - force waypoint routing
                const finalDestState = pos.finalTargetState ?? pos.targetState;
                let startX = pos.x;
                let startY = pos.y;

                if (isPointInCollisionBox(startX, startY)) {
                  const safe = getClosestPointOutsideCollisionBox(startX, startY);
                  startX = safe.x;
                  startY = safe.y;
                }

                // Find a safe breakout position
                let foundSafe = false;
                for (let attempt = 0; attempt < 12; attempt++) {
                  const angle = (Math.PI * 2 * attempt) / 12 + Math.random() * 0.5;
                  const testX = startX + Math.cos(angle) * 60;
                  const testY = startY + Math.sin(angle) * 60;
                  if (!isPointInCollisionBox(testX, testY)) {
                    startX = testX;
                    startY = testY;
                    foundSafe = true;
                    break;
                  }
                }
                if (!foundSafe) {
                  const safePos = getClosestPointOutsideCollisionBox(startX, startY);
                  startX = safePos.x;
                  startY = safePos.y;
                }

                next.set(node.id, buildWalkState(
                  { ...pos, x: startX, y: startY, z: startY },
                  finalDestX,
                  finalDestY,
                  finalDestState || pos.targetState || 'idle'
                ));
              } else {
                next.set(node.id, {
                  ...pos,
                  x: moved.x,
                  y: moved.y,
                  z: moved.y,
                  stuckCounter: nextStuckCounter,
                  stuckCheckPosition: nextCheckPos,
                  facing: moved.x > pos.x ? 'right' : 'left',
                });
              }
            }
            return;
          }

          // === STATE: DOING ACTIVITY (sitting/working/recharging) ===
          if (['sitting', 'working', 'recharging'].includes(pos.state)) {
            const newTimer = (pos.activityTimer || 0) + 1;
            const duration = getActivityDuration(index);

            if (newTimer > duration) {
              // Activity done - release pod/chair/stool/sofa if was using one
              if (pos.state === 'recharging') {
                releasePod(node.id);
              }
              if (pos.state === 'working') {
                releaseChair(node.id);
              }
              if (pos.state === 'sitting' && pos.activity === 'café_sit') {
                releaseStool(node.id);
              }
              if (pos.state === 'sitting' && pos.activity === 'lounge_sit') {
                releaseSofa(node.id);
              }
              // Start wandering before next activity
              const wanderPoints = generateWanderPoints(index + Date.now());
              const wanderDuration = generateWanderDuration(index);

              next.set(node.id, {
                ...pos,
                state: 'wandering',
                wanderPoints,
                wanderIndex: 0,
                wanderTimer: 0,
                wanderDuration,
                activityTimer: 0,
              });
            } else {
              next.set(node.id, { ...pos, activityTimer: newTimer });
            }
            return;
          }

          // === STATE: WANDERING ===
          if (pos.state === 'wandering' && pos.wanderPoints && pos.wanderIndex !== undefined) {
            const target = pos.wanderPoints[pos.wanderIndex];
            const dx = target.x - pos.x;
            const dy = target.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Update wander timer
            const newWanderTimer = (pos.wanderTimer || 0) + 1;

            if (dist < SPEEDS.arrivalThreshold) {
              // Reached wander point - go to next or finish
              const newIndex = pos.wanderIndex + 1;

              if (newIndex >= pos.wanderPoints.length || newWanderTimer > (pos.wanderDuration || 0)) {
                // Done wandering - pick new activity
                let newActivity = getNextActivity(pos.activity, index);
                let targetSpot = getActivitySpot(newActivity, index);
                
                // Handle pod assignment
                if (newActivity === 'pod_recharge') {
                  const availablePod = findAvailablePod(node.id);
                  if (availablePod !== null) {
                    // Assign this pod to the agent
                    assignPod(node.id, availablePod);
                    targetSpot = getActivitySpot('pod_recharge', availablePod);
                  } else {
                    // All pods occupied - pick a different activity
                    newActivity = 'lounge_sit'; // Fallback to lounge
                    targetSpot = getActivitySpot(newActivity, index);
                  }
                }
                
                // Handle chair assignment for workstations
                if (newActivity === 'desk_work') {
                  const availableChair = findAvailableChair(node.id);
                  if (availableChair !== null) {
                    assignChair(node.id, availableChair);
                    targetSpot = getActivitySpot('desk_work', availableChair);
                    removeFromWaitingQueue(node.id);
                  } else {
                    // All chairs occupied - go to waiting position
                    const queuePos = addToWaitingQueue(node.id, 'desk_work');
                    targetSpot = getWaitingPosition('desk_work', queuePos);
                    newActivity = 'desk_work';
                  }
                }
                
                // Handle stool assignment for café
                if (newActivity === 'café_sit') {
                  const availableStool = findAvailableStool(node.id);
                  if (availableStool !== null) {
                    assignStool(node.id, availableStool);
                    targetSpot = getActivitySpot('café_sit', availableStool);
                    removeFromWaitingQueue(node.id);
                  } else {
                    // All stools occupied - go to waiting position
                    const queuePos = addToWaitingQueue(node.id, 'café_sit');
                    targetSpot = getWaitingPosition('café_sit', queuePos);
                    newActivity = 'café_sit';
                  }
                }
                
                // Handle sofa assignment for lounge
                if (newActivity === 'lounge_sit') {
                  const availableSofa = findAvailableSofa(node.id);
                  if (availableSofa !== null) {
                    assignSofa(node.id, availableSofa);
                    targetSpot = getActivitySpot('lounge_sit', availableSofa);
                    removeFromWaitingQueue(node.id);
                  } else {
                    // All sofas occupied - go to waiting position
                    const queuePos = addToWaitingQueue(node.id, 'lounge_sit');
                    targetSpot = getWaitingPosition('lounge_sit', queuePos);
                    newActivity = 'lounge_sit';
                  }
                }
                
                // Determine target state based on whether we got a spot or are waiting
                const isWaiting = 
                  (newActivity === 'desk_work' && findAvailableChair(node.id) === null) ||
                  (newActivity === 'café_sit' && findAvailableStool(node.id) === null) ||
                  (newActivity === 'lounge_sit' && findAvailableSofa(node.id) === null) ||
                  (newActivity === 'pod_recharge' && findAvailablePod(node.id) === null);

                next.set(node.id, buildWalkState(
                  {
                    ...pos,
                    activity: newActivity,
                    waitingFor: isWaiting ? newActivity : undefined,
                    wanderPoints: undefined,
                    wanderIndex: undefined,
                    wanderTimer: undefined,
                    wanderDuration: undefined,
                  },
                  targetSpot.x,
                  targetSpot.y,
                  isWaiting ? 'waiting' : getStateFromActivity(newActivity)
                ));
              } else {
                // Continue to next wander point
                next.set(node.id, {
                  ...pos,
                  wanderIndex: newIndex,
                  wanderTimer: newWanderTimer,
                });
              }
            } else {
              // Continue wandering to current point using A* path
              const speed = SPEEDS.wandering;
              const path = findPath(pos.x, pos.y, target.x, target.y);
              if (path.length > 1) {
                const nextPos = path[1];
                const pdx = nextPos.x - pos.x;
                const pdy = nextPos.y - pos.y;
                const pDist = Math.hypot(pdx, pdy);
                if (pDist > 0) {
                  const newX = pos.x + (pdx / pDist) * speed;
                  const newY = pos.y + (pdy / pDist) * speed;
                  next.set(node.id, {
                    ...pos,
                    x: newX,
                    y: newY,
                    z: newY,
                    wanderTimer: newWanderTimer,
                    facing: newX > pos.x ? 'right' : 'left',
                  });
                } else {
                  next.set(node.id, { ...pos, wanderTimer: newWanderTimer });
                }
              } else {
                // Stuck or arrived - advance to next wander point
                next.set(node.id, {
                  ...pos,
                  wanderIndex: pos.wanderIndex + 1,
                  wanderTimer: newWanderTimer,
                });
              }
            }
            return;
          }

          // === STATE: WAITING ===
          if (pos.state === 'waiting' && pos.waitingFor) {
            // Periodically check if a spot opened up (every ~2 seconds = 120 frames)
            if ((pos.activityTimer || 0) % 120 === 0) {
              let availableSpot: number | null = null;
              let targetSpot = { x: pos.x, y: pos.y, z: pos.z };
              
              switch (pos.waitingFor) {
                case 'pod_recharge':
                  availableSpot = findAvailablePod(node.id);
                  if (availableSpot !== null) {
                    assignPod(node.id, availableSpot);
                    targetSpot = getActivitySpot('pod_recharge', availableSpot);
                    removeFromWaitingQueue(node.id);
                  }
                  break;
                case 'desk_work':
                  availableSpot = findAvailableChair(node.id);
                  if (availableSpot !== null) {
                    assignChair(node.id, availableSpot);
                    targetSpot = getActivitySpot('desk_work', availableSpot);
                    removeFromWaitingQueue(node.id);
                  }
                  break;
                case 'café_sit':
                  availableSpot = findAvailableStool(node.id);
                  if (availableSpot !== null) {
                    assignStool(node.id, availableSpot);
                    targetSpot = getActivitySpot('café_sit', availableSpot);
                    removeFromWaitingQueue(node.id);
                  }
                  break;
                case 'lounge_sit':
                  availableSpot = findAvailableSofa(node.id);
                  if (availableSpot !== null) {
                    assignSofa(node.id, availableSpot);
                    targetSpot = getActivitySpot('lounge_sit', availableSpot);
                    removeFromWaitingQueue(node.id);
                  }
                  break;
              }
              
              if (availableSpot !== null) {
                // Spot available! Move to it
                next.set(node.id, buildWalkState(
                  { ...pos, waitingFor: undefined, activityTimer: 0 },
                  targetSpot.x,
                  targetSpot.y,
                  getStateFromActivity(pos.waitingFor)
                ));
                return;
              }
            }
            
            // Still waiting - update timer and maybe shift position in queue
            next.set(node.id, { 
              ...pos, 
              activityTimer: (pos.activityTimer || 0) + 1,
              notionStatus: currentNotionStatus 
            });
            return;
          }

          // === STATE: PLUGGED ===
          if (pos.state === 'plugged') {
            // Just update notion status for transition detection
            next.set(node.id, { ...pos, notionStatus: currentNotionStatus });
            return;
          }

          // === DEFAULT: IDLE ===
          // Shouldn't really happen, but handle gracefully
          next.set(node.id, { ...pos, notionStatus: currentNotionStatus });
        });

        return next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentPositions.size]);

  // Fetch topology periodically
  useEffect(() => {
    fetchTopology();
    const interval = setInterval(fetchTopology, 10000);
    return () => clearInterval(interval);
  }, [fetchTopology]);

  const handleNodeClick = useCallback((node: GhostNode) => setSelectedNode(node), []);

  // Combine furniture and agents, sort by Z for proper depth
  const sortedSceneItems = useMemo(() => {
    // Find which pods are occupied by recharging agents
    const occupiedPods = new Set<string>();
    displayNodes.forEach((node) => {
      const pos = agentPositions.get(node.id);
      if (pos && pos.state === 'recharging') {
        // Find which pod this agent is at based on position
        // Agents go to y: 360 (back row) and y: 480 (front row)
        const podSpots = [
          { id: 'pod1', x: 530, y: 360 },
          { id: 'pod2', x: 580, y: 360 },
          { id: 'pod3', x: 630, y: 360 },
          { id: 'pod4', x: 530, y: 480 },
          { id: 'pod5', x: 580, y: 480 },
          { id: 'pod6', x: 630, y: 480 },
        ];
        const closestPod = podSpots.find(p => 
          Math.abs(p.x - pos.x) < 30 && Math.abs(p.y - pos.y) < 30
        );
        if (closestPod) {
          occupiedPods.add(closestPod.id);
        }
      }
    });
    
    // Furniture items with their Z positions and occupancy
    const furniture = FURNITURE_OBJECTS.map(f => ({
      type: 'furniture' as const,
      id: f.id,
      z: f.z,
      furniture: f,
      isOccupied: f.type === 'pod' ? occupiedPods.has(f.id) : false,
    }));

    // Agent items with their current Z positions
    const agents = displayNodes
      .map(node => {
        const pos = agentPositions.get(node.id);
        if (!pos) return null;
        return {
          type: 'agent' as const,
          id: node.id,
          z: pos.z,
          node,
          pos,
        };
      })
      .filter((item): item is NonNullable<typeof item> => !!item);

    // Combine and sort by Z
    return [...furniture, ...agents].sort((a, b) => a.z - b.z);
  }, [displayNodes, agentPositions]);

  return (
    <div className="h-full w-full flex relative overflow-hidden bg-bg-deep">
      <div className="flex-1 relative min-w-0 overflow-auto" ref={containerRef}>
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={() => fetchTopology()}
            className="rounded bg-bg-card border border-[#00ff41] p-2 hover:bg-[#00ff41]/10 text-[#00ff41] transition-colors font-mono text-xs"
            title="Refresh"
            aria-label="Refresh agent data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Status indicators */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <div className="bg-bg-card/80 border border-[#00ff41]/30 px-3 py-2 flex items-center gap-2">
            <Cpu className="w-3 h-3 text-[#00ff41]" aria-hidden="true" />
            <span className="text-[#00ff41] font-mono text-xs">{displayNodes.filter(n => n.status === 'active').length} ACTIVE</span>
          </div>
        </div>

        {/* Room SVG */}
        <svg
          width={ROOM_WIDTH}
          height={ROOM_HEIGHT}
          viewBox={`0 0 ${ROOM_WIDTH} ${ROOM_HEIGHT}`}
          className="min-w-[1000px] min-h-[600px]"
          style={{ fontFamily: 'monospace' }}
          role="img"
          aria-label="Ghost Network visualization"
        >
          {/* 1. Background only (wall, floor, window) */}
          <RoomBackground />

          {/* 2. Furniture + Agents - interleaved by Z for proper depth */}
          {sortedSceneItems.map((item) =>
            item.type === 'furniture' ? (
              <FurnitureObject
                key={item.id}
                type={item.furniture.type}
                x={item.furniture.x}
                y={item.furniture.y}
                isOccupied={item.isOccupied}
              />
            ) : (
              <CharacterSprite
                key={item.id}
                node={item.node}
                position={item.pos}
                state={item.pos.state}
                isSelected={selectedNode?.id === item.node.id}
                onClick={() => handleNodeClick(item.node)}
              />
            )
          )}
        </svg>
      </div>

      {/* Terminal Popup */}
      {selectedNode && <RetroTerminalPopup node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
  );
}
