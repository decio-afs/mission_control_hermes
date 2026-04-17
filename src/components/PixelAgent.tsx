import type { GhostNode } from '../stores/useGhostStore';
import { SQUAD_COLORS } from '../pages/GhostNetwork/constants';
import type { AgentPosition } from '../pages/GhostNetwork/types';

interface PixelAgentProps {
  node: GhostNode;
  position: AgentPosition;
  isSelected: boolean;
  onClick: () => void;
}

export function PixelAgent({ node, position, isSelected, onClick }: PixelAgentProps) {
  // Base colors by type
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
  
  // Hair colors
  const hairColors = ['#1f2937', '#451a03', '#dc2626', '#f59e0b', '#7c3aed', '#0ea5e9'];
  const hairColor = hairColors[idHash % hairColors.length];
  
  // Skin tones
  const skinTones = ['#fcd34d', '#f5d0b0', '#e8c4a0', '#d4a574', '#8d5524', '#5c3a21'];
  const skinTone = skinTones[idHash % skinTones.length];
  
  // Height variation (subtle)
  const heightOffset = (idHash % 2) * -2;
  
  // Accessories
  const hasGlasses = idHash % 5 === 0;
  const hasHeadset = idHash % 7 === 0 && node.type !== 'core';
  
  // Walking animation uses position-based pseudo-random value instead of Date.now
  // This avoids impure function calls during render while maintaining visual variety
  const walkSeed = position.x + position.y;
  const walkCycle = position.state === 'walking' ? Math.sin(walkSeed / 50) : 0;
  const bounceY = position.state === 'walking' ? Math.abs(walkCycle) * 1.5 : 0;
  
  return (
    <g 
      transform={`translate(${position.x}, ${position.y + bounceY + heightOffset})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Selection glow */}
      {isSelected && (
        <circle cx="0" cy="-10" r="22" fill="none" stroke="#f64e6e" strokeWidth="2" strokeDasharray="4 2">
          <animateTransform attributeName="transform" type="rotate" from="0 0 -10" to="360 0 -10" dur="3s" repeatCount="indefinite" />
        </circle>
      )}
      
      {/* Status glow for active agents */}
      {isActive && (
        <circle cx="0" cy="-10" r="18" fill={baseColor} opacity="0.15">
          <animate attributeName="r" values="18;22;18" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      
      {/* Drop shadow under agent */}
      <ellipse cx="0" cy="28" rx="14" ry="5" fill="#000" opacity="0.3" filter="url(#dropShadow)" />
      
      {/* Agent sprite based on state */}
      {position.state === 'working' ? (
        // Working pose - typing at desk
        <g>
          {/* Chair back */}
          <rect x="-14" y="-28" width="28" height="25" fill="#4b5563" rx="4" />
          <rect x="-12" y="-26" width="24" height="20" fill="#374151" rx="3" />
          
          {/* Head */}
          <rect x="-8" y="-34" width="16" height="14" fill={skinTone} rx="2" />
          {/* Hair */}
          <rect x="-9" y="-37" width="18" height="7" fill={hairColor} rx="2" />
          {/* Eyes */}
          <rect x={position.facing === 'right' ? "2" : "-6"} y="-30" width="3" height="3" fill={isOffline ? '#1f2937' : '#fff'} />
          <rect x={position.facing === 'right' ? "3" : "-5"} y="-29" width="1.5" height="1.5" fill="#000" />
          
          {/* Body */}
          <rect x="-11" y="-22" width="22" height="20" fill={finalColor} rx="3" />
          <rect x="-8" y="-20" width="16" height="12" fill="#1f2937" opacity="0.2" rx="2" />
          
          {/* Arms positioned for typing */}
          <rect x="-16" y="-18" width="6" height="14" fill={finalColor} rx="2" />
          <rect x="10" y="-18" width="6" height="14" fill={finalColor} rx="2" />
          {/* Forearms angled toward keyboard */}
          <rect x="-12" y="-8" width="5" height="10" fill={finalColor} opacity="0.8" rx="1" />
          <rect x="7" y="-8" width="5" height="10" fill={finalColor} opacity="0.8" rx="1" />
          {/* Hands on keyboard */}
          <rect x="-10" y="0" width="5" height="4" fill={skinTone} rx="1" />
          <rect x="5" y="0" width="5" height="4" fill={skinTone} rx="1" />
          
          {/* Legs bent for sitting */}
          <rect x="-10" y="-2" width="7" height="12" fill="#1e3a5f" rx="2" />
          <rect x="3" y="-2" width="7" height="12" fill="#1e3a5f" rx="2" />
          {/* Lower legs */}
          <rect x="-10" y="8" width="6" height="8" fill="#1e3a5f" rx="1" />
          <rect x="4" y="8" width="6" height="8" fill="#1e3a5f" rx="1" />
        </g>
      ) : position.state === 'sitting' ? (
        // Sitting pose - relaxed on couch/stool
        <g>
          {/* Head */}
          <rect x="-8" y="-30" width="16" height="14" fill={skinTone} rx="2" />
          {/* Hair */}
          <rect x="-9" y="-33" width="18" height="7" fill={hairColor} rx="2" />
          {/* Eyes */}
          <rect x={position.facing === 'right' ? "2" : "-6"} y="-26" width="3" height="3" fill={isOffline ? '#1f2937' : '#fff'} />
          <rect x={position.facing === 'right' ? "3" : "-5"} y="-25" width="1.5" height="1.5" fill="#000" />
          
          {/* Body - leaning back slightly */}
          <rect x="-11" y="-18" width="22" height="22" fill={finalColor} rx="3" />
          <rect x="-8" y="-16" width="16" height="14" fill="#1f2937" opacity="0.2" rx="2" />
          
          {/* Arms - relaxed at sides or holding drink */}
          <rect x="-17" y="-15" width="6" height="16" fill={finalColor} rx="2" />
          <rect x="11" y="-15" width="6" height="16" fill={finalColor} rx="2" />
          {/* Hands */}
          <rect x="-18" y="-2" width="5" height="5" fill={skinTone} rx="1" />
          <rect x="13" y="-2" width="5" height="5" fill={skinTone} rx="1" />
          
          {/* Legs - relaxed sitting (extended forward) */}
          {/* Thighs */}
          <rect x="-10" y="2" width="7" height="12" fill="#1e3a5f" rx="2" />
          <rect x="3" y="2" width="7" height="12" fill="#1e3a5f" rx="2" />
          {/* Lower legs hanging down/forward */}
          <rect x="-10" y="12" width="6" height="10" fill="#1e3a5f" rx="1" />
          <rect x="4" y="12" width="6" height="10" fill="#1e3a5f" rx="1" />
          {/* Shoes */}
          <rect x="-11" y="20" width="8" height="5" fill="#374151" rx="1" />
          <rect x="3" y="20" width="8" height="5" fill="#374151" rx="1" />
        </g>
      ) : position.state === 'recharging' ? (
        // In pod pose - recharging
        <g>
          {/* Body - floating in pod */}
          <rect x="-9" y="-38" width="18" height="32" fill={finalColor} rx="3" />
          <rect x="-7" y="-35" width="14" height="18" fill="#1f2937" opacity="0.2" rx="2" />
          
          {/* Head */}
          <rect x="-7" y="-45" width="14" height="12" fill={skinTone} rx="2" />
          {/* Hair */}
          <rect x="-8" y="-48" width="16" height="6" fill={hairColor} rx="2" />
          {/* Eyes closed/sleeping */}
          <rect x={position.facing === 'right' ? "1" : "-5"} y="-41" width="4" height="1" fill="#00ff41" opacity="0.7" />
          
          {/* Arms at sides */}
          <rect x="-13" y="-32" width="4" height="22" fill={finalColor} rx="2" />
          <rect x="9" y="-32" width="4" height="22" fill={finalColor} rx="2" />
          
          {/* Energy glow effect around body - ONLY when in recharge zone */}
          {position.zone === 'recharge' && (
            <g>
              <rect x="-11" y="-8" width="22" height="5" fill="#00ff41" opacity="0.4" rx="2">
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="0.8s" repeatCount="indefinite" />
              </rect>
              {/* Floating particles */}
              <circle cx="-15" cy="-25" r="2" fill="#00ff41" opacity="0.5">
                <animate attributeName="cy" values="-25;-35;-25" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="15" cy="-15" r="2" fill="#00ff41" opacity="0.5">
                <animate attributeName="cy" values="-15;-25;-15" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
              </circle>
            </g>
          )}
        </g>
      ) : (
        // Standing/Walking pose - enhanced with hair and clothing
        <g>
          {/* Hair - varies by agent */}
          <rect x="-9" y="-35" width="18" height="8" fill={hairColor} rx="2" />
          <rect x={position.facing === 'right' ? "-2" : "-6"} y="-33" width="8" height="4" fill={hairColor} opacity="0.7" rx="1" />
          
          {/* Head */}
          <rect x="-8" y="-32" width="16" height="14" fill={skinTone} rx="2" />
          {/* Eyes */}
          <rect x={position.facing === 'right' ? "2" : "-6"} y="-28" width="3" height="3" fill={isOffline ? '#1f2937' : '#fff'} />
          <rect x={position.facing === 'right' ? "3" : "-5"} y="-27" width="1.5" height="1.5" fill="#000" />
          
          {/* Body/Hoodie */}
          <rect x="-11" y="-19" width="22" height="22" fill={finalColor} rx="3" />
          {/* Hoodie detail */}
          <rect x="-8" y="-17" width="16" height="12" fill="#1f2937" opacity="0.2" rx="2" />
          {/* Hoodie pocket */}
          <rect x="-6" y="-8" width="12" height="8" fill="#0f172a" opacity="0.3" rx="2" />
          
          {/* Arms with hands - animate when walking */}
          {position.state === 'walking' ? (
            <g>
              {/* Left arm swinging */}
              <rect x="-17" y="-16" width="6" height="15" fill={finalColor} opacity="0.9" rx="2">
                <animateTransform attributeName="transform" type="rotate" values="10 -14 -8;-10 -14 -8;10 -14 -8" dur="0.4s" repeatCount="indefinite" />
              </rect>
              {/* Right arm swinging (opposite) */}
              <rect x="11" y="-16" width="6" height="15" fill={finalColor} opacity="0.9" rx="2">
                <animateTransform attributeName="transform" type="rotate" values="-10 14 -8;10 14 -8;-10 14 -8" dur="0.4s" repeatCount="indefinite" />
              </rect>
              {/* Hands */}
              <rect x="-18" y="-2" width="5" height="5" fill={skinTone} rx="1">
                <animateTransform attributeName="transform" type="rotate" values="10 -14 -8;-10 -14 -8;10 -14 -8" dur="0.4s" repeatCount="indefinite" />
              </rect>
              <rect x="13" y="-2" width="5" height="5" fill={skinTone} rx="1">
                <animateTransform attributeName="transform" type="rotate" values="-10 14 -8;10 14 -8;-10 14 -8" dur="0.4s" repeatCount="indefinite" />
              </rect>
            </g>
          ) : (
            <g>
              {/* Static arms when not walking */}
              <rect x="-17" y="-16" width="6" height="15" fill={finalColor} opacity="0.9" rx="2" />
              <rect x="11" y="-16" width="6" height="15" fill={finalColor} opacity="0.9" rx="2" />
              <rect x="-18" y="-2" width="5" height="5" fill={skinTone} rx="1" />
              <rect x="13" y="-2" width="5" height="5" fill={skinTone} rx="1" />
            </g>
          )}
          
          {/* Accessories */}
          {hasGlasses && (
            <g>
              <rect x={position.facing === 'right' ? "0" : "-8"} y="-30" width="6" height="4" fill="#1f2937" rx="1" />
              <rect x={position.facing === 'right' ? "2" : "-6"} y="-29" width="4" height="2" fill="#000" opacity="0.7" />
            </g>
          )}
          {hasHeadset && (
            <g>
              <rect x={position.facing === 'right' ? "6" : "-10"} y="-32" width="4" height="8" fill="#374151" rx="1" />
              <line x1={position.facing === 'right' ? "6" : "-6"} y1="-28" x2={position.facing === 'right' ? "2" : "-2"} y2="-26" stroke="#374151" strokeWidth="1" />
            </g>
          )}
          
          {/* Legs/Jeans with walking animation */}
          {position.state === 'walking' ? (
            <g>
              {/* Left leg - walking cycle */}
              <g>
                {/* Upper leg */}
                <rect x="-10" y="2" width="7" height="10" fill="#1e3a5f" rx="2" transform="rotate(0 -6.5 7)">
                  <animateTransform attributeName="transform" type="rotate" values="-15 -6.5 7;15 -6.5 7;-15 -6.5 7" dur="0.4s" repeatCount="indefinite" />
                </rect>
                {/* Lower leg */}
                <rect x="-10" y="10" width="6" height="10" fill="#1e3a5f" rx="2" transform="rotate(0 -7 15)">
                  <animateTransform attributeName="transform" type="rotate" values="10 -7 15;-20 -7 15;10 -7 15" dur="0.4s" repeatCount="indefinite" />
                </rect>
                {/* Shoe */}
                <rect x="-11" y="18" width="8" height="4" fill="#374151" rx="1" transform="rotate(0 -7 20)">
                  <animateTransform attributeName="transform" type="rotate" values="10 -7 20;-20 -7 20;10 -7 20" dur="0.4s" repeatCount="indefinite" />
                </rect>
              </g>
              
              {/* Right leg - opposite walking cycle */}
              <g>
                {/* Upper leg */}
                <rect x="3" y="2" width="7" height="10" fill="#1e3a5f" rx="2" transform="rotate(0 6.5 7)">
                  <animateTransform attributeName="transform" type="rotate" values="15 6.5 7;-15 6.5 7;15 6.5 7" dur="0.4s" repeatCount="indefinite" />
                </rect>
                {/* Lower leg */}
                <rect x="4" y="10" width="6" height="10" fill="#1e3a5f" rx="2" transform="rotate(0 7 15)">
                  <animateTransform attributeName="transform" type="rotate" values="-20 7 15;10 7 15;-20 7 15" dur="0.4s" repeatCount="indefinite" />
                </rect>
                {/* Shoe */}
                <rect x="3" y="18" width="8" height="4" fill="#374151" rx="1" transform="rotate(0 7 20)">
                  <animateTransform attributeName="transform" type="rotate" values="-20 7 20;10 7 20;-20 7 20" dur="0.4s" repeatCount="indefinite" />
                </rect>
              </g>
            </g>
          ) : (
            <g>
              {/* Static legs when not walking */}
              <rect x="-10" y="2" width="8" height="18" fill="#1e3a5f" rx="2" />
              <rect x="2" y="2" width="8" height="18" fill="#1e3a5f" rx="2" />
              <rect x="-11" y="18" width="9" height="5" fill="#374151" rx="1" />
              <rect x="2" y="18" width="9" height="5" fill="#374151" rx="1" />
            </g>
          )}
        </g>
      )}
      
      {/* Activity indicators based on state and zone */}
      
      {/* Working at computer indicator */}
      {position.state === 'working' && position.zone === 'desk' && (
        <g transform="translate(0, -50)">
          <rect x="-10" y="0" width="20" height="8" fill="#00ff41" rx="2" opacity="0.9">
            <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite" />
          </rect>
          <text x="0" y="6" textAnchor="middle" fontSize="6" fill="#000" fontFamily="monospace" fontWeight="bold">💻</text>
        </g>
      )}
      
      {/* Sitting on couch/chair indicator */}
      {position.state === 'sitting' && position.zone === 'lounge' && (
        <g transform="translate(0, -50)">
          <rect x="-10" y="0" width="20" height="8" fill="#a855f7" rx="2" opacity="0.9">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          </rect>
          <text x="0" y="6" textAnchor="middle" fontSize="6" fill="#fff" fontFamily="monospace">🛋️</text>
        </g>
      )}
      
      {/* Sitting at café stool indicator */}
      {position.state === 'sitting' && position.zone === 'coffee' && (
        <g transform="translate(0, -50)">
          <rect x="-10" y="0" width="20" height="8" fill="#f59e0b" rx="2" opacity="0.9">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          </rect>
          <text x="0" y="6" textAnchor="middle" fontSize="6" fill="#000" fontFamily="monospace">☕</text>
        </g>
      )}
      
      {/* Recharging in pod indicator */}
      {position.state === 'recharging' && position.zone === 'recharge' && (
        <g transform="translate(0, -55)">
          <rect x="-12" y="0" width="24" height="10" fill="#00ff41" stroke="#00ff41" strokeWidth="2" rx="3">
            <animate attributeName="fill-opacity" values="0.2;0.8;0.2" dur="1s" repeatCount="indefinite" />
          </rect>
          <text x="0" y="7" textAnchor="middle" fontSize="7" fill="#000" fontFamily="monospace" fontWeight="bold">⚡ CHARGING</text>
        </g>
      )}
      
      {/* Plugged into mainframe indicator */}
      {position.state === 'plugged' && (
        <g transform="translate(0, -55)">
          <rect x="-12" y="0" width="24" height="10" fill="#10b981" rx="3" opacity="0.9">
            <animate attributeName="opacity" values="0.7;1;0.7" dur="0.5s" repeatCount="indefinite" />
          </rect>
          <text x="0" y="7" textAnchor="middle" fontSize="6" fill="#000" fontFamily="monospace" fontWeight="bold">🔗 PLUGGED</text>
        </g>
      )}
      
      {/* Hover highlight box */}
      <rect 
        x="-20" y="-45" 
        width="40" height="85" 
        fill={isSelected ? '#f64e6e' : 'transparent'} 
        opacity={isSelected ? "0.1" : "0"}
        rx="4"
        style={{ transition: 'all 0.2s' }}
      />
      
      {/* Name label */}
      <text y="32" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#e5e7eb" style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
        {node.name.length > 12 ? node.name.slice(0, 10) + '..' : node.name}
      </text>
      
      {/* State label */}
      <text y="42" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#6b7280" style={{ pointerEvents: 'none' }}>
        {position.state.toUpperCase()}
      </text>
    </g>
  );
}

export default PixelAgent;
