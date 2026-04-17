import type { GhostNode } from '../../stores/useGhostStore';
import type { AgentPosition } from './types';

interface SimplePixelAgentProps {
  node: GhostNode;
  position: AgentPosition;
  isSelected: boolean;
  onClick: () => void;
}

// Squad colors
const SQUAD_COLORS: Record<string, string> = {
  'Ghost Legion - Content': '#f59e0b',
  'Ghost Legion - Development': '#3b82f6',
  'Ghost Legion - Security': '#ef4444',
  'Ghost Legion - Intelligence': '#8b5cf6',
  'Ghost Legion - Infrastructure': '#10b981',
  'Ghost Director': '#ec4899',
};

export function SimplePixelAgent({ node, position, isSelected, onClick }: SimplePixelAgentProps) {
  // Determine base color
  const baseColor = node.type === 'core' ? '#f64e6e' : 
                    node.type === 'squad' ? '#38bdf8' :
                    node.squad && SQUAD_COLORS[node.squad] ? SQUAD_COLORS[node.squad] :
                    node.model === 'sonnet' ? '#a855f7' :
                    node.model === 'haiku' ? '#10b981' : '#64748b';
  
  const isActive = node.status === 'active';
  const isOffline = !node.status || node.status === 'offline';
  const finalColor = isOffline ? '#4b5563' : baseColor;
  
  // Generate consistent variation based on agent ID
  const idHash = node.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const hairColors = ['#1f2937', '#451a03', '#dc2626', '#f59e0b', '#7c3aed', '#0ea5e9'];
  const hairColor = hairColors[idHash % hairColors.length];
  const skinTones = ['#fcd34d', '#f5d0b0', '#e8c4a0', '#d4a574', '#8d5524', '#5c3a21'];
  const skinTone = skinTones[idHash % skinTones.length];
  
  // Animation offset for walking
  const bobOffset = position.state === 'walking' ? Math.sin(Date.now() / 100) * 2 : 0;
  
  return (
    <g 
      transform={`translate(${position.x}, ${position.y + bobOffset})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Selection ring */}
      {isSelected && (
        <circle cx="0" cy="-15" r="25" fill="none" stroke="#f64e6e" strokeWidth="2" strokeDasharray="4 2">
          <animateTransform attributeName="transform" type="rotate" from="0 0 -15" to="360 0 -15" dur="3s" repeatCount="indefinite" />
        </circle>
      )}
      
      {/* Status glow for active agents */}
      {isActive && (
        <circle cx="0" cy="-15" r="20" fill={baseColor} opacity="0.15">
          <animate attributeName="r" values="18;22;18" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      
      {/* Shadow */}
      <ellipse cx="0" cy="25" rx="12" ry="4" fill="#000" opacity="0.3" />
      
      {/* Agent sprite based on state */}
      {position.state === 'working' ? (
        // Working at desk - sitting with hands on keyboard
        <g>
          {/* Body */}
          <rect x="-10" y="-20" width="20" height="25" fill={finalColor} rx="3" />
          <rect x="-7" y="-18" width="14" height="15" fill="#1f2937" opacity="0.3" rx="2" />
          {/* Head */}
          <rect x="-8" y="-32" width="16" height="14" fill={skinTone} rx="2" />
          <rect x="-9" y="-35" width="18" height="7" fill={hairColor} rx="2" />
          {/* Eyes */}
          <rect x={position.facing === 'right' ? "2" : "-5"} y="-28" width="3" height="3" fill="#fff" />
          <rect x={position.facing === 'right' ? "3" : "-4"} y="-27" width="1.5" height="1.5" fill="#000" />
          {/* Arms typing */}
          <rect x="-14" y="-15" width="5" height="15" fill={finalColor} rx="2" />
          <rect x="9" y="-15" width="5" height="15" fill={finalColor} rx="2" />
          <rect x="-12" y="-5" width="4" height="8" fill={skinTone} rx="1" />
          <rect x="8" y="-5" width="4" height="8" fill={skinTone} rx="1" />
          {/* Sitting legs */}
          <rect x="-8" y="0" width="6" height="12" fill="#1e3a5f" rx="2" />
          <rect x="2" y="0" width="6" height="12" fill="#1e3a5f" rx="2" />
          <rect x="-8" y="10" width="5" height="8" fill="#1e3a5f" rx="1" />
          <rect x="3" y="10" width="5" height="8" fill="#1e3a5f" rx="1" />
          
          {/* 💻 indicator */}
          <g transform="translate(0, -45)">
            <rect x="-8" y="0" width="16" height="8" fill="#00ff41" rx="2" opacity="0.9">
              <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite" />
            </rect>
            <text x="0" y="6" textAnchor="middle" fontSize="6" fill="#000" fontFamily="monospace">💻</text>
          </g>
        </g>
      ) : position.state === 'sitting' ? (
        // Sitting relaxed
        <g>
          {/* Body */}
          <rect x="-10" y="-18" width="20" height="25" fill={finalColor} rx="3" />
          <rect x="-7" y="-16" width="14" height="15" fill="#1f2937" opacity="0.3" rx="2" />
          {/* Head */}
          <rect x="-8" y="-30" width="16" height="14" fill={skinTone} rx="2" />
          <rect x="-9" y="-33" width="18" height="7" fill={hairColor} rx="2" />
          {/* Eyes */}
          <rect x={position.facing === 'right' ? "2" : "-5"} y="-26" width="3" height="3" fill="#fff" />
          <rect x={position.facing === 'right' ? "3" : "-4"} y="-25" width="1.5" height="1.5" fill="#000" />
          {/* Arms relaxed */}
          <rect x="-14" y="-12" width="5" height="18" fill={finalColor} rx="2" />
          <rect x="9" y="-12" width="5" height="18" fill={finalColor} rx="2" />
          <rect x="-15" y="2" width="4" height="5" fill={skinTone} rx="1" />
          <rect x="11" y="2" width="4" height="5" fill={skinTone} rx="1" />
          {/* Sitting legs extended */}
          <rect x="-8" y="5" width="6" height="12" fill="#1e3a5f" rx="2" />
          <rect x="2" y="5" width="6" height="12" fill="#1e3a5f" rx="2" />
          <rect x="-8" y="15" width="5" height="10" fill="#1e3a5f" rx="1" />
          <rect x="3" y="15" width="5" height="10" fill="#1e3a5f" rx="1" />
          {/* 🛋️ indicator */}
          <g transform="translate(0, -42)">
            <rect x="-8" y="0" width="16" height="8" fill="#a855f7" rx="2" opacity="0.9" />
            <text x="0" y="6" textAnchor="middle" fontSize="6" fill="#fff" fontFamily="monospace">🛋️</text>
          </g>
        </g>
      ) : position.state === 'recharging' ? (
        // In recharge pod
        <g>
          {/* Body floating */}
          <rect x="-9" y="-38" width="18" height="30" fill={finalColor} rx="3" />
          <rect x="-7" y="-35" width="14" height="18" fill="#1f2937" opacity="0.3" rx="2" />
          {/* Head */}
          <rect x="-7" y="-48" width="14" height="12" fill={skinTone} rx="2" />
          <rect x="-8" y="-51" width="16" height="6" fill={hairColor} rx="2" />
          {/* Closed eyes */}
          <rect x={position.facing === 'right' ? "1" : "-5"} y="-44" width="4" height="1" fill="#00ff41" opacity="0.7" />
          {/* Arms at sides */}
          <rect x="-13" y="-35" width="4" height="22" fill={finalColor} rx="2" />
          <rect x="9" y="-35" width="4" height="22" fill={finalColor} rx="2" />
          
          {/* Energy glow */}
          <rect x="-11" y="-15" width="22" height="5" fill="#00ff41" opacity="0.4" rx="2">
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="0.8s" repeatCount="indefinite" />
          </rect>
          
          {/* ⚡ indicator */}
          <g transform="translate(0, -58)">
            <rect x="-10" y="0" width="20" height="10" fill="#00ff41" stroke="#00ff41" strokeWidth="2" rx="3">
              <animate attributeName="fill-opacity" values="0.2;0.8;0.2" dur="1s" repeatCount="indefinite" />
            </rect>
            <text x="0" y="7" textAnchor="middle" fontSize="7" fill="#000" fontFamily="monospace" fontWeight="bold">⚡</text>
          </g>
        </g>
      ) : position.state === 'plugged' ? (
        // Plugged into mainframe
        <g>
          {/* Body */}
          <rect x="-9" y="-35" width="18" height="28" fill={finalColor} rx="3" />
          <rect x="-7" y="-32" width="14" height="16" fill="#1f2937" opacity="0.3" rx="2" />
          {/* Head */}
          <rect x="-7" y="-45" width="14" height="12" fill={skinTone} rx="2" />
          <rect x="-8" y="-48" width="16" height="6" fill={hairColor} rx="2" />
          {/* Eyes - glowing */}
          <rect x={position.facing === 'right' ? "1" : "-4"} y="-41" width="3" height="3" fill="#00ff41" />
          {/* Cable connection */}
          <line x1="0" y1="-5" x2="0" y2="-25" stroke="#00ff41" strokeWidth="2" opacity="0.6" />
          <circle cx="0" cy="-15" r="3" fill="#00ff41" opacity="0.8">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="0.5s" repeatCount="indefinite" />
          </circle>
          
          {/* 🔗 indicator */}
          <g transform="translate(0, -55)">
            <rect x="-10" y="0" width="20" height="10" fill="#10b981" rx="3" opacity="0.9">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="0.5s" repeatCount="indefinite" />
            </rect>
            <text x="0" y="7" textAnchor="middle" fontSize="6" fill="#000" fontFamily="monospace" fontWeight="bold">🔗</text>
          </g>
        </g>
      ) : (
        // Standing/Walking
        <g>
          {/* Hair */}
          <rect x="-9" y="-35" width="18" height="8" fill={hairColor} rx="2" />
          <rect x={position.facing === 'right' ? "-2" : "-6"} y="-33" width="8" height="4" fill={hairColor} opacity="0.7" rx="1" />
          
          {/* Head */}
          <rect x="-8" y="-32" width="16" height="14" fill={skinTone} rx="2" />
          {/* Eyes */}
          <rect x={position.facing === 'right' ? "2" : "-5"} y="-28" width="3" height="3" fill="#fff" />
          <rect x={position.facing === 'right' ? "3" : "-4"} y="-27" width="1.5" height="1.5" fill="#000" />
          
          {/* Body */}
          <rect x="-10" y="-19" width="20" height="24" fill={finalColor} rx="3" />
          <rect x="-7" y="-17" width="14" height="14" fill="#1f2937" opacity="0.3" rx="2" />
          
          {/* Walking animation */}
          {position.state === 'walking' ? (
            <g>
              {/* Arms swinging */}
              <rect x="-16" y="-16" width="5" height="16" fill={finalColor} opacity="0.9" rx="2">
                <animateTransform attributeName="transform" type="rotate" values="15 -13 -8;-15 -13 -8;15 -13 -8" dur="0.3s" repeatCount="indefinite" />
              </rect>
              <rect x="11" y="-16" width="5" height="16" fill={finalColor} opacity="0.9" rx="2">
                <animateTransform attributeName="transform" type="rotate" values="-15 13 -8;15 13 -8;-15 13 -8" dur="0.3s" repeatCount="indefinite" />
              </rect>
              {/* Walking legs */}
              <rect x="-9" y="3" width="6" height="12" fill="#1e3a5f" rx="2">
                <animateTransform attributeName="transform" type="rotate" values="-20 -6 9;20 -6 9;-20 -6 9" dur="0.3s" repeatCount="indefinite" />
              </rect>
              <rect x="3" y="3" width="6" height="12" fill="#1e3a5f" rx="2">
                <animateTransform attributeName="transform" type="rotate" values="20 6 9;-20 6 9;20 6 9" dur="0.3s" repeatCount="indefinite" />
              </rect>
            </g>
          ) : (
            <g>
              {/* Static arms */}
              <rect x="-15" y="-15" width="5" height="16" fill={finalColor} opacity="0.9" rx="2" />
              <rect x="10" y="-15" width="5" height="16" fill={finalColor} opacity="0.9" rx="2" />
              {/* Static legs */}
              <rect x="-9" y="3" width="7" height="18" fill="#1e3a5f" rx="2" />
              <rect x="2" y="3" width="7" height="18" fill="#1e3a5f" rx="2" />
            </g>
          )}
        </g>
      )}
      
      {/* Name label */}
      <text 
        y="35" 
        textAnchor="middle" 
        fontSize="8" 
        fontFamily="monospace" 
        fill="#e5e7eb" 
        style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
      >
        {node.name.length > 10 ? node.name.slice(0, 8) + '..' : node.name}
      </text>
      
      {/* State label */}
      <text 
        y="44" 
        textAnchor="middle" 
        fontSize="6" 
        fontFamily="monospace" 
        fill="#6b7280" 
        style={{ pointerEvents: 'none' }}
      >
        {position.state.toUpperCase()}
      </text>
    </g>
  );
}

export default SimplePixelAgent;
