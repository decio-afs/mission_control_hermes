import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Cpu } from 'lucide-react';
import { useGhostStore } from '../stores/useGhostStore';
import type { GhostNode } from '../stores/useGhostStore';
import { RetroTerminalPopup } from '../components/RetroTerminalPopup';
import { RoomBackLayer } from './GhostNetwork/RoomBackLayer';
import { UnifiedLayer } from './GhostNetwork/UnifiedLayer';
import { 
  ROOM_WIDTH, 
  ROOM_HEIGHT, 
  ZONES, 
  MAINFRAME_PLUGS, 
  MOCK_AGENTS,
  INTERACTIVE_OBJECTS,
  ANIMATION_SPEED,
  ACTIVITY_DURATION 
} from './GhostNetwork/constants';
import type { AgentPosition, ActivityZone } from './GhostNetwork/types';

export default function GhostNetwork() {
  const { nodes, fetchTopology } = useGhostStore();
  const [selectedNode, setSelectedNode] = useState<GhostNode | null>(null);
  const [agentPositions, setAgentPositions] = useState<Map<string, AgentPosition>>(new Map());
  const animationRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<GhostNode[]>([]);
  
  const displayNodes = nodes.length > 0 ? nodes : MOCK_AGENTS;
  
  // Sync nodesRef in useEffect to avoid ref mutation during render
  useEffect(() => {
    nodesRef.current = displayNodes;
  }, [displayNodes]);
  
  // Initialize agent positions on mount and when nodes change
  useEffect(() => {
    const initial = new Map<string, AgentPosition>();
    const nodesToInit = displayNodes;
    nodesToInit.forEach((node, i) => {
      // Check if agent already has a position
      const existingPos = agentPositions.get(node.id);
      
      if (existingPos) {
        // Keep existing position but ensure it has required fields
        initial.set(node.id, {
          ...existingPos,
          activityTimer: existingPos.activityTimer || 0,
        });
      } else {
        // New agent - assign to a furniture position based on type
        const zoneNames: ActivityZone[] = ['lounge', 'coffee', 'desk', 'recharge'];
        const zone = zoneNames[i % 4];
        const idSum = node.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        
        // Get furniture objects for this zone
        const furniture = INTERACTIVE_OBJECTS[zone];
        const furnitureItem = furniture ? furniture[(idSum) % furniture.length] : null;
        
        if (furnitureItem) {
          // Start at a furniture position
          initial.set(node.id, {
            x: furnitureItem.x + (Math.random() - 0.5) * 20, // Slight offset
            y: furnitureItem.y,
            z: furnitureItem.z,
            state: 'idle',
            facing: 'right',
            zone,
            activityTimer: i * 10,
          });
        } else {
          // Fallback to zone center
          const zoneData = ZONES[zone];
          const initialY = zoneData.y + 80;
          initial.set(node.id, {
            x: zoneData.x + zoneData.w / 2,
            y: initialY,
            z: initialY,
            state: 'idle',
            facing: 'right',
            zone,
            activityTimer: i * 10,
          });
        }
      }
    });
    setAgentPositions(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayNodes.length]);
  
  // Track previous node statuses to detect changes
  const prevStatusesRef = useRef<Map<string, string>>(new Map());
  
  // Watch for status changes and trigger movement
  useEffect(() => {
    if (agentPositions.size === 0) return;
    
    // Check if any node status changed
    let statusChanged = false;
    const currentStatuses = new Map<string, string>();
    displayNodes.forEach(node => {
      currentStatuses.set(node.id, node.status || 'idle');
      const prevStatus = prevStatusesRef.current.get(node.id);
      if (prevStatus !== node.status) {
        statusChanged = true;
      }
    });
    
    // Update ref for next comparison
    prevStatusesRef.current = currentStatuses;
    
    // Also trigger on first load or when nodes are added/removed
    if (!statusChanged && displayNodes.length === prevStatusesRef.current.size) {
      return; // No changes detected
    }
    
    setAgentPositions(prev => {
      const next = new Map(prev);
      let hasChanges = false;
      
      displayNodes.forEach(node => {
        const pos = next.get(node.id);
        if (!pos) return;
        
        const isActive = node.status === 'active';
        const isCore = node.type === 'core';
        
        // Core agents should always be at mainframe
        if (isCore && pos.state !== 'plugged') {
          const newPos = { ...pos };
          newPos.x = ZONES.mainframe.x + ZONES.mainframe.w / 2;
          newPos.y = ZONES.mainframe.y + 120;
          newPos.state = 'plugged';
          next.set(node.id, newPos);
          hasChanges = true;
        }
        
        // Active agents should walk to mainframe (only trigger when not already walking there)
        if (isActive && !isCore && pos.state !== 'plugged' && pos.state !== 'walking') {
          const plugIndex = parseInt(node.id.slice(-2) || '0', 16) % MAINFRAME_PLUGS.length;
          const plug = MAINFRAME_PLUGS[plugIndex];
          if (plug) {
            const newPos = { ...pos };
            newPos.targetX = plug.x - 30;
            newPos.targetY = plug.y + 20;
            newPos.state = 'walking';
            newPos.activityTimer = 0;
            next.set(node.id, newPos);
            hasChanges = true;
          }
        }
        
        // Inactive agents at mainframe should walk away
        if (!isActive && !isCore && pos.state === 'plugged') {
          const zones: ActivityZone[] = ['lounge', 'coffee', 'desk', 'recharge'];
          // Use deterministic "random" based on node id to avoid impure functions
          const idSum = node.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
          const zoneIndex = idSum % zones.length;
          const zone = zones[zoneIndex];
          const z = ZONES[zone];
          if (z) {
            const newPos = { ...pos };
            newPos.targetX = z.x + 30 + (idSum % 100) / 100 * (z.w - 60);
            newPos.targetY = z.y + 40 + ((idSum * 7) % 100) / 100 * (z.h - 80);
            newPos.state = 'walking';
            newPos.zone = zone;
            newPos.activityTimer = 0;
            next.set(node.id, newPos);
            hasChanges = true;
          }
        }
      });
      
      return hasChanges ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayNodes, agentPositions]);
  
  // Animation loop
  useEffect(() => {
    // Don't start until positions are initialized
    if (agentPositions.size === 0) return;
    
    const animate = () => {
      setAgentPositions(prev => {
        const next = new Map(prev);
        
        // Get current nodes from ref to avoid stale closures
        const currentNodes = nodesRef.current;
        
        currentNodes.forEach((node, index) => {
          let pos = next.get(node.id);
          
          // Initialize position if not exists
          if (!pos) {
            const zoneNames: ActivityZone[] = ['lounge', 'coffee', 'desk', 'recharge'];
            const zone = zoneNames[index % 4];
            const zoneData = ZONES[zone];
            const initY = zoneData.y + 60 + Math.floor(index / 4) * 50;
            pos = {
              x: zoneData.x + 40 + (index % 3) * 50,
              y: initY,
              z: initY,  // Z equals Y for 2.5D depth
              state: 'idle',
              facing: 'right',
              zone,
              activityTimer: index * 10,
            };
            next.set(node.id, pos);
          }
          
          const isActive = node.status === 'active';
          const isCore = node.type === 'core';
          
          if (isCore) {
            const corePos = { ...pos };
            corePos.x = ZONES.mainframe.x + ZONES.mainframe.w / 2;
            corePos.y = ZONES.mainframe.y + 120;
            corePos.z = ZONES.mainframe.y + 120;  // Z follows Y
            corePos.state = 'plugged';
            next.set(node.id, corePos);
            return;
          }
          
          if (isActive && pos.state !== 'plugged') {
            const plugIndex = parseInt(node.id.slice(-2) || '0', 16) % MAINFRAME_PLUGS.length;
            const plug = MAINFRAME_PLUGS[plugIndex];
            if (plug) {
              const targetX = plug.x - 30;
              const targetY = plug.y + 20;
              const dx = targetX - pos.x;
              const dy = targetY - pos.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              const newPos = { ...pos };
              if (dist < 5) {
                newPos.state = 'plugged';
                newPos.x = targetX;
                newPos.y = targetY;
                newPos.z = targetY;  // Z follows Y when arriving
              } else {
                newPos.x = pos.x + (dx / dist) * ANIMATION_SPEED * 1.5;
                newPos.y = pos.y + (dy / dist) * ANIMATION_SPEED * 1.5;
                newPos.z = newPos.y;  // Z follows Y for depth while walking
                newPos.state = 'walking';
                newPos.facing = dx > 0 ? 'right' : 'left';
              }
              next.set(node.id, newPos);
            }
            return;
          }
          
          if (!isActive && pos.state === 'plugged') {
            const zones: ActivityZone[] = ['lounge', 'coffee', 'desk', 'recharge'];
            // Use deterministic "random" based on node id
            const idSum = node.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
            const zoneIndex = idSum % zones.length;
            const zone = zones[zoneIndex];
            const z = ZONES[zone];
            if (z) {
              const newPos = { ...pos };
              const targetY = z.y + 40 + ((idSum * 7) % 100) / 100 * (z.h - 80);
              newPos.targetX = z.x + 30 + (idSum % 100) / 100 * (z.w - 60);
              newPos.targetY = targetY;
              newPos.z = pos.z;  // Keep current Z until movement starts
              newPos.state = 'walking';
              newPos.zone = zone;
              newPos.activityTimer = 0;
              next.set(node.id, newPos);
            }
            return;
          }
          
          if (pos.state === 'idle' || pos.state === 'sitting' || pos.state === 'working' || pos.state === 'recharging') {
            const newPos = { ...pos };
            newPos.activityTimer = (pos.activityTimer || 0) + 1;
            if (newPos.activityTimer > ACTIVITY_DURATION) {
              const roll = (index * 13 + Math.floor(newPos.activityTimer / 100)) % 100 / 100;
              
              // Pick a furniture object based on agent index
              const idSum = node.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
              
              if (roll < 0.25) {
                // Walk to a random open area in a zone
                const zones: ActivityZone[] = ['lounge', 'coffee', 'desk', 'recharge'];
                const zone = zones[(idSum + index) % zones.length];
                const z = ZONES[zone];
                if (z) {
                  newPos.targetX = z.x + 40 + ((idSum * 3) % 100) / 100 * (z.w - 80);
                  newPos.targetY = z.y + 50 + ((idSum * 7) % 100) / 100 * (z.h - 100);
                  newPos.state = 'walking';
                  newPos.zone = zone;
                  newPos.activityTimer = 0;
                }
              } else if (roll < 0.5) {
                // Sit on couch/chair in lounge - use actual furniture positions
                const loungeObjects = INTERACTIVE_OBJECTS.lounge;
                const targetObj = loungeObjects[(idSum + index) % loungeObjects.length];
                newPos.targetX = targetObj.x;
                newPos.targetY = targetObj.y;
                newPos.state = 'walking';
                newPos.targetState = 'sitting';
                newPos.zone = 'lounge';
                newPos.activityTimer = 0;
              } else if (roll < 0.75) {
                // Work at computer in workstation area - use actual desk positions
                const deskObjects = INTERACTIVE_OBJECTS.desk;
                const targetObj = deskObjects[(idSum + index) % deskObjects.length];
                newPos.targetX = targetObj.x;
                newPos.targetY = targetObj.y;
                newPos.state = 'walking';
                newPos.targetState = 'working';
                newPos.zone = 'desk';
                newPos.activityTimer = 0;
              } else {
                // Recharge in pod - use actual pod positions
                const podObjects = INTERACTIVE_OBJECTS.recharge;
                const targetObj = podObjects[(idSum + index) % podObjects.length];
                newPos.targetX = targetObj.x;
                newPos.targetY = targetObj.y;
                newPos.state = 'walking';
                newPos.targetState = 'recharging';
                newPos.zone = 'recharge';
                newPos.activityTimer = 0;
              }
              
              next.set(node.id, newPos);
            } else {
              next.set(node.id, newPos);
            }
            return;
          }
          
          if (pos.state === 'walking' && pos.targetX !== undefined && pos.targetY !== undefined) {
            const newPos = { ...pos };
            const dx = pos.targetX - pos.x;
            const dy = pos.targetY - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 3) {
              // Arrived at destination - transition to target state or idle
              newPos.state = pos.targetState || 'idle';
              newPos.targetState = undefined;
              newPos.targetX = undefined;
              newPos.targetY = undefined;
              // Set Z based on state - use furniture Z when at furniture
              if (newPos.state === 'sitting' && newPos.zone === 'lounge') {
                newPos.z = 350; // Between couch back (300) and seat (380)
              } else if (newPos.state === 'sitting' && newPos.zone === 'coffee') {
                newPos.z = 360; // At stool height
              } else if (newPos.state === 'working' && newPos.zone === 'desk') {
                newPos.z = 340; // At desk chair height
              } else if (newPos.state === 'recharging' && newPos.zone === 'recharge') {
                newPos.z = 350; // Inside pod
              } else {
                newPos.z = pos.y; // Default: Z follows Y
              }
            } else {
              // Calculate new position
              let newX = pos.x + (dx / dist) * ANIMATION_SPEED;
              let newY = pos.y + (dy / dist) * ANIMATION_SPEED;
              
              // Keep within room bounds
              newX = Math.max(20, Math.min(980, newX));
              newY = Math.max(280, Math.min(580, newY));
              
              newPos.x = newX;
              newPos.y = newY;
              newPos.z = newY;  // Z follows Y for depth
              newPos.facing = dx > 0 ? 'right' : 'left';
            }
            next.set(node.id, newPos);
          }
        });
        return next;
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayNodes.length, agentPositions.size]);
  
  useEffect(() => {
    fetchTopology();
    const interval = setInterval(fetchTopology, 10000);
    return () => clearInterval(interval);
  }, [fetchTopology]);
  
  const handleNodeClick = useCallback((node: GhostNode) => setSelectedNode(node), []);
  
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
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[#00ff41] font-mono text-xs">MAINFRAME ONLINE</span>
          </div>
          <div className="bg-bg-card/80 border border-[#00ff41]/30 px-3 py-2 flex items-center gap-2">
            <Cpu className="w-3 h-3 text-[#00ff41]" aria-hidden="true" />
            <span className="text-[#00ff41] font-mono text-xs">{displayNodes.filter(n => n.status === 'active').length} ACTIVE</span>
          </div>
        </div>
        
        {/* Room SVG - Single unified layer with Z-depth */}
        <svg 
          width={ROOM_WIDTH} 
          height={ROOM_HEIGHT} 
          viewBox={`0 0 ${ROOM_WIDTH} ${ROOM_HEIGHT}`} 
          className="min-w-[1000px] min-h-[600px]" 
          style={{ fontFamily: 'monospace' }}
          role="img" 
          aria-label="Ghost Network visualization showing AI agents in a cyberpunk room"
        >
          {/* Background room elements */}
          <RoomBackLayer />
          
          {/* All objects and agents in one unified layer sorted by Z */}
          <UnifiedLayer 
            nodes={displayNodes} 
            positions={agentPositions}
            selectedNode={selectedNode}
            onNodeClick={handleNodeClick}
          />
        </svg>
      </div>
      
      {/* Terminal Popup */}
      {selectedNode && <RetroTerminalPopup node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
  );
}
