import { useMemo } from 'react';
import { PixelAgent } from '../../components/PixelAgent';
import { MAINFRAME_PLUGS } from './constants';
import type { GhostNode } from '../../stores/useGhostStore';
import type { AgentPosition } from './types';

type UnifiedItem = 
  | { type: 'agent'; z: number; node: GhostNode; pos: AgentPosition }
  | { type: 'furniture'; z: number; element: React.ReactNode; key: string };

interface UnifiedLayerProps {
  nodes: GhostNode[];
  positions: Map<string, AgentPosition>;
  selectedNode: GhostNode | null;
  onNodeClick: (node: GhostNode) => void;
}

export function UnifiedLayer({ nodes, positions, selectedNode, onNodeClick }: UnifiedLayerProps) {
  const sortedItems = useMemo(() => {
    const items: UnifiedItem[] = [];
    
    // We only need to render dynamic elements (agents and active cables)
    // The static furniture is now baked into the pixel art background image!

    nodes.forEach(node => {
      const pos = positions.get(node.id);
      if (!pos) return;
      
      // 1. Add Agent
      items.push({ type: 'agent', z: pos.z, node, pos });
      
      // 2. Add dynamic active cable if plugged into mainframe
      if (pos.state === 'plugged') {
        const plugIndex = Math.abs(parseInt(node.id.slice(-2) || '0', 16)) % MAINFRAME_PLUGS.length;
        const plug = MAINFRAME_PLUGS[plugIndex];
        if (plug) {
          items.push({
            type: 'furniture',
            z: pos.z - 10,  // Draw cable slightly behind the agent
            key: `cable-${node.id}`,
            element: (
              <g>
                <line x1={pos.x + 10} y1={pos.y - 10} x2={plug.x} y2={plug.y} stroke="#00ff41" strokeWidth="2" opacity="0.6" />
                <circle cx="0" cy="0" r="3" fill="#00ff41">
                  <animateMotion dur="0.8s" repeatCount="indefinite" path={`M${pos.x + 10},${pos.y - 10} L${plug.x},${plug.y}`} />
                </circle>
              </g>
            )
          });
        }
      }
    });
    
    // Sort by Z (painter's algorithm - draw back to front)
    return items.sort((a, b) => a.z - b.z);
  }, [nodes, positions]);

  return (
    <g>
      {sortedItems.map((item) => {
        if (item.type === 'agent') {
          return (
            <PixelAgent 
              key={item.node.id}
              node={item.node}
              position={item.pos}
              isSelected={selectedNode?.id === item.node.id}
              onClick={() => onNodeClick(item.node)}
            />
          );
        }
        return <g key={item.key}>{item.element}</g>;
      })}
    </g>
  );
}

export default UnifiedLayer;
