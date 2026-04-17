import type { GhostNode } from '../../stores/useGhostStore';

// Character type based on agent role
export type CharacterType = 
  | 'barista'      // Café worker
  | 'tech'         // Tech/repair
  | 'analyst'      // Workstation
  | 'hacker'       // Mainframe
  | 'lounger'      // Chill area
  | 'runner'       // Generic agent
  | 'netrunner'    // Deep dive specialist
  | 'mercenary'    // Security
  | 'corporate'    // Management
  | 'mechanic';    // Infrastructure

export interface CharacterSpriteProps {
  node: GhostNode;
  position: { x: number; y: number; facing: 'left' | 'right'; activity?: string };
  state: string;
  isSelected: boolean;
  onClick: () => void;
}

// Squad-based character types
export function getCharacterType(node: GhostNode): CharacterType {
  if (node.squad?.includes('Content')) return 'barista';
  if (node.squad?.includes('Development')) return 'tech';
  if (node.squad?.includes('Intelligence')) return 'analyst';
  if (node.squad?.includes('Security')) return 'mercenary';
  if (node.squad?.includes('Infrastructure')) return 'mechanic';
  if (node.type === 'core') return 'hacker';
  if (node.model === 'sonnet') return 'netrunner';
  if (node.model === 'haiku') return 'corporate';
  return 'runner';
}

// Color schemes for different character types
const CHARACTER_COLORS: Record<CharacterType, {
  primary: string;
  secondary: string;
  accent: string;
  glow?: string;
}> = {
  barista: { primary: '#5c4033', secondary: '#8b6914', accent: '#d4a574' },
  tech: { primary: '#2d3748', secondary: '#4a5568', accent: '#00ff41', glow: '#00ff41' },
  analyst: { primary: '#1a365d', secondary: '#2c5282', accent: '#38bdf8', glow: '#38bdf8' },
  hacker: { primary: '#0f0f1a', secondary: '#1a1a2e', accent: '#00ff41', glow: '#00ff41' },
  lounger: { primary: '#4a3b5c', secondary: '#6b5b7d', accent: '#ec4899' },
  runner: { primary: '#374151', secondary: '#4b5563', accent: '#f59e0b' },
  netrunner: { primary: '#1e1b4b', secondary: '#312e81', accent: '#a855f7', glow: '#a855f7' },
  mercenary: { primary: '#451a03', secondary: '#78350f', accent: '#ef4444' },
  corporate: { primary: '#1e293b', secondary: '#334155', accent: '#10b981' },
  mechanic: { primary: '#292524', secondary: '#44403c', accent: '#f59e0b' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Appearance generation with high diversity
// ═══════════════════════════════════════════════════════════════════════════════

function getAppearance(node: GhostNode, charType: CharacterType) {
  const idHash = node.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  
  // Expanded palettes inspired by reference images
  const hairColors = [
    '#1f2937', '#451a03', '#dc2626', '#7c3aed', '#0ea5e9', '#059669',
    '#ec4899', '#06b6d4', '#f59e0b', '#84cc16', '#e2e8f0', '#000000',
    '#9f1239', '#4338ca', '#ea580c', '#14b8a6'
  ];
  const skinTones = [
    '#ffebee', '#fcd34d', '#f5d0b0', '#e8c4a0', '#d4a574', 
    '#8d5524', '#5c3a21', '#3e2723', '#c58c85', '#a67c52'
  ];
  const eyeColors = [
    '#1f2937', '#1e3a8a', '#047857', '#b45309', '#7f1d1d', 
    '#6b21a8', '#0ea5e9', '#dc2626', '#059669', '#f59e0b'
  ];
  
  // Body shape influenced by character type + hash
  const shapePool = (
    charType === 'mercenary' ? ['bulky', 'bulky', 'normal'] :
    charType === 'netrunner' || charType === 'corporate' ? ['slim', 'slim', 'normal'] :
    charType === 'hacker' ? ['slim', 'normal', 'normal'] :
    charType === 'tech' || charType === 'mechanic' ? ['normal', 'bulky', 'normal'] :
    ['normal', 'slim', 'normal', 'bulky']
  );
  
  // Hair style influenced by type
  let hairStyle = idHash % 10;
  if (charType === 'hacker' && idHash % 3 !== 0) hairStyle = 4; // hood
  if (charType === 'mercenary' && idHash % 4 === 0) hairStyle = 5; // helmet
  
  // Accessory influenced by type + hash
  const accessoryPool = (
    charType === 'mercenary' ? [3, 1, 5, 0, 7] :
    charType === 'netrunner' ? [5, 7, 8, 0, 2] :
    charType === 'tech' ? [7, 8, 5, 0, 6] :
    charType === 'analyst' ? [7, 0, 0, 6, 8] :
    charType === 'hacker' ? [1, 4, 2, 0, 8] :
    charType === 'corporate' ? [6, 8, 0, 7, 0] :
    charType === 'barista' ? [6, 0, 8, 0, 2] :
    [0, 1, 2, 3, 4, 5, 6, 7, 8]
  );
  
  return {
    hairColor: hairColors[idHash % hairColors.length],
    skinTone: skinTones[(idHash + 3) % skinTones.length],
    eyeColor: eyeColors[(idHash + 7) % eyeColors.length],
    hairStyle,
    bodyShape: shapePool[idHash % shapePool.length] as 'normal' | 'slim' | 'bulky',
    accessory: accessoryPool[idHash % accessoryPool.length],
    hasGlasses: idHash % 3 === 0, // increased chance
    hasHeadset: idHash % 4 === 0,
    hasMask: idHash % 5 === 0 && charType !== 'netrunner',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main sprite component
// ═══════════════════════════════════════════════════════════════════════════════

export function CharacterSprite({ node, position, state, isSelected, onClick }: CharacterSpriteProps) {
  const charType = getCharacterType(node);
  const colors = CHARACTER_COLORS[charType];
  const isActive = node.status === 'active';
  const app = getAppearance(node, charType);
  
  // No bounce while walking/wandering
  const bobOffset = 0;
  
  return (
    <g 
      transform={`translate(${position.x}, ${position.y + bobOffset})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Selection indicator */}
      {isSelected && (
        <circle cx="0" cy="-20" r="28" fill="none" stroke="#f64e6e" strokeWidth="2" strokeDasharray="4 2">
          <animateTransform attributeName="transform" type="rotate" from="0 0 -20" to="360 0 -20" dur="3s" repeatCount="indefinite" />
        </circle>
      )}
      
      {/* Status glow */}
      {isActive && (
        <circle cx="0" cy="-20" r="22" fill={colors.accent} opacity="0.2">
          <animate attributeName="r" values="20;24;20" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      
      {/* Shadow scaled by body shape */}
      <ellipse cx="0" cy="28" rx={app.bodyShape === 'bulky' ? 18 : app.bodyShape === 'slim' ? 11 : 14} ry="5" fill="#000" opacity="0.4" />
      
      {/* Render character based on type and state */}
      {state === 'plugged' ? (
        <PluggedCharacter colors={colors} app={app} facing={position.facing} />
      ) : state === 'recharging' ? (
        <RechargingCharacter colors={colors} app={app} facing={position.facing} />
      ) : state === 'working' ? (
        <WorkingCharacter charType={charType} colors={colors} app={app} facing={position.facing} />
      ) : state === 'sitting' ? (
        <SittingCharacter charType={charType} colors={colors} app={app} facing={position.facing} />
      ) : state === 'wandering' ? (
        <WalkingCharacter charType={charType} colors={colors} app={app} facing={position.facing} speed="slow" />
      ) : state === 'waiting' ? (
        <WaitingCharacter colors={colors} app={app} facing={position.facing} />
      ) : (
        <StandingCharacter charType={charType} colors={colors} app={app} facing={position.facing} isWalking={state === 'walking'} />
      )}
      
      {/* Waiting indicator - hourglass above head */}
      {state === 'waiting' && (
        <g transform="translate(0, -55)">
          <rect x="-6" y="0" width="12" height="16" fill="#f59e0b" rx="2" opacity="0.9" />
          <rect x="-4" y="2" width="8" height="5" fill="#1f2937" />
          <rect x="-4" y="9" width="8" height="5" fill="#1f2937" />
          <text x="0" y="24" textAnchor="middle" fontSize="7" fill="#f59e0b" fontFamily="monospace">QUEUE</text>
        </g>
      )}
      
      {/* Chat bubble for agents sitting on sofas */}
      {state === 'sitting' && position.activity === 'lounge_sit' && (
        <g transform="translate(0, -70)">
          <ellipse cx="0" cy="0" rx="14" ry="9" fill="#1f2937" stroke="#38bdf8" strokeWidth="1.2" opacity="0.95" />
          <path d="M -3 8 L 0 12 L 3 8 Z" fill="#1f2937" stroke="#38bdf8" strokeWidth="1.2" />
          <circle cx="-5" cy="0" r="1.2" fill="#38bdf8">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="0" cy="0" r="1.2" fill="#38bdf8">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="0.8s" begin="0.27s" repeatCount="indefinite" />
          </circle>
          <circle cx="5" cy="0" r="1.2" fill="#38bdf8">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="0.8s" begin="0.54s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
      
      {/* Coffee cup for agents at café */}
      {state === 'sitting' && position.activity === 'café_sit' && (
        <g transform="translate(0, -65)">
          <g opacity="0.7">
            <path d="M -3 -8 Q 0 -12 3 -8" stroke="#e5e7eb" strokeWidth="1.5" fill="none">
              <animate attributeName="d" values="M -3 -8 Q 0 -12 3 -8;M -3 -12 Q 0 -16 3 -12" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0" dur="1.5s" repeatCount="indefinite" />
            </path>
            <path d="M 0 -6 Q 3 -10 0 -14" stroke="#e5e7eb" strokeWidth="1.5" fill="none">
              <animate attributeName="d" values="M 0 -6 Q 3 -10 0 -14;M 0 -10 Q 3 -14 0 -18" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
            </path>
          </g>
          <rect x="-5" y="-6" width="10" height="8" fill="#fff" rx="1" />
          <rect x="-4" y="-5" width="8" height="6" fill="#5c4033" rx="0.5" />
          <path d="M 5 -4 Q 8 -4 8 -1 Q 8 2 5 2" stroke="#fff" strokeWidth="1.5" fill="none" />
        </g>
      )}
      
      {/* Name label */}
      <text y="38" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#e5e7eb" style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>
        {node.name.length > 10 ? node.name.slice(0, 8) + '..' : node.name}
      </text>
      
      {/* State indicator */}
      <text y="48" textAnchor="middle" fontSize="6" fontFamily="monospace" fill="#6b7280" style={{ pointerEvents: 'none' }}>
        {state.toUpperCase()}
      </text>
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shared anime head primitive with 10 hair styles
// ═══════════════════════════════════════════════════════════════════════════════

function AnimeHead({ app, facing, expression = 'neutral', extra }: { app: ReturnType<typeof getAppearance>; facing: 'left' | 'right'; expression?: 'neutral' | 'sleep' | 'focus'; extra?: 'vr' | 'none' }) {
  const fx = facing === 'right' ? 1 : -1;
  const eyeX = 3.5 * fx;
  const browY = expression === 'focus' ? -40 : -39;
  const { skinTone, hairColor, hairStyle, eyeColor, hasGlasses, hasHeadset, hasMask } = app;
  
  return (
    <g>
      {/* Hair back - style dependent */}
      {hairStyle === 0 && (
        <>
          <path d="M -12,-50 Q -16,-32 -12,-24 L -8,-28 Z" fill={hairColor} />
          <path d="M 12,-50 Q 16,-32 12,-24 L 8,-28 Z" fill={hairColor} />
        </>
      )}
      {hairStyle === 1 && (
        <>
          <ellipse cx="0" cy="-52" rx="15" ry="8" fill={hairColor} />
          <path d="M -14,-48 Q -18,-28 -12,-24 L -9,-28 Z" fill={hairColor} />
          <path d="M 14,-48 Q 18,-28 12,-24 L 9,-28 Z" fill={hairColor} />
        </>
      )}
      {hairStyle === 2 && (
        <>
          <path d="M -14,-48 Q -18,-20 -12,-18 L -9,-24 Z" fill={hairColor} />
          <path d="M 14,-48 Q 18,-20 12,-18 L 9,-24 Z" fill={hairColor} />
          <ellipse cx="0" cy="-50" rx="14" ry="7" fill={hairColor} />
        </>
      )}
      {hairStyle === 3 && (
        <>
          <ellipse cx="0" cy="-48" rx="12" ry="5" fill={hairColor} />
          <path d="M -12,-46 Q -14,-26 -10,-22 L -8,-26 Z" fill={hairColor} />
          <path d="M 12,-46 Q 14,-26 10,-22 L 8,-26 Z" fill={hairColor} />
        </>
      )}
      {hairStyle === 4 && (
        <>
          {/* Hood back */}
          <path d="M -14,-48 Q -18,-18 0,-16 Q 18,-18 14,-48 Z" fill={hairColor} />
          <ellipse cx="0" cy="-50" rx="13" ry="7" fill={hairColor} opacity="0.5" />
        </>
      )}
      {hairStyle === 5 && (
        <>
          {/* Helmet */}
          <path d="M -14,-50 Q -14,-28 0,-26 Q 14,-28 14,-50 Z" fill="#374151" />
          <path d="M -12,-48 Q -12,-30 0,-28 Q 12,-30 12,-48 Z" fill={hairColor} />
          <rect x="-14" y="-40" width="28" height="4" fill="#1f2937" rx="1" />
        </>
      )}
      {hairStyle === 6 && (
        <>
          {/* Mohawk */}
          <path d="M -3,-55 L 0,-18 L 3,-55 Z" fill={hairColor} />
          <ellipse cx="0" cy="-48" rx="12" ry="5" fill={hairColor} />
          <path d="M -12,-46 Q -14,-26 -10,-22 L -8,-26 Z" fill={hairColor} />
          <path d="M 12,-46 Q 14,-26 10,-22 L 8,-26 Z" fill={hairColor} />
        </>
      )}
      {hairStyle === 7 && (
        <>
          {/* Ponytail */}
          <ellipse cx="0" cy="-50" rx="14" ry="7" fill={hairColor} />
          <path d="M -14,-48 Q -16,-28 -10,-24 L -8,-28 Z" fill={hairColor} />
          <path d="M 14,-48 Q 16,-28 10,-24 L 8,-28 Z" fill={hairColor} />
          <path d="M 8,-28 Q 16,-20 14,-10 Q 10,-8 8,-14 Z" fill={hairColor} />
        </>
      )}
      {hairStyle === 8 && (
        <>
          {/* Bald - just shadow */}
          <ellipse cx="0" cy="-48" rx="10" ry="4" fill={hairColor} opacity="0.3" />
        </>
      )}
      {hairStyle === 9 && (
        <>
          {/* Curly/wavy */}
          <path d="M -14,-50 Q -10,-35 -14,-25 Q -8,-20 -4,-28 Q 0,-20 4,-28 Q 8,-20 14,-25 Q 10,-35 14,-50 Z" fill={hairColor} />
        </>
      )}

      {/* Face */}
      <ellipse cx="0" cy="-34" rx="10" ry="12" fill={skinTone} />
      
      {/* Hair front / bangs */}
      {hairStyle === 0 && (
        <path d="M -12,-46 Q -6,-36 0,-40 Q 6,-36 12,-46 L 12,-50 Q 0,-54 -12,-50 Z" fill={hairColor} />
      )}
      {hairStyle === 1 && (
        <path d="M -13,-48 Q -5,-34 0,-38 Q 5,-34 13,-48 L 13,-52 Q 0,-56 -13,-52 Z" fill={hairColor} />
      )}
      {hairStyle === 2 && (
        <path d="M -12,-46 Q -4,-32 0,-36 Q 4,-32 12,-46 L 12,-50 Q 0,-53 -12,-50 Z" fill={hairColor} />
      )}
      {hairStyle === 3 && (
        <path d="M -11,-46 Q -3,-34 0,-38 Q 3,-34 11,-46 L 11,-49 Q 0,-51 -11,-49 Z" fill={hairColor} />
      )}
      {hairStyle === 4 && (
        <path d="M -13,-46 Q -6,-32 0,-36 Q 6,-32 13,-46 L 13,-50 Q 0,-52 -13,-50 Z" fill={hairColor} />
      )}
      {hairStyle === 5 && (
        <>
          <path d="M -13,-46 Q -6,-32 0,-36 Q 6,-32 13,-46 L 13,-50 Q 0,-52 -13,-50 Z" fill={hairColor} />
          {/* Visor */}
          <rect x={facing === 'right' ? -2 : -8} y="-42" width="10" height="6" fill="#0f0f1a" rx="1" opacity="0.9" />
          <rect x={facing === 'right' ? -1 : -7} y="-41" width="8" height="2" fill="#00ff41" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.2s" repeatCount="indefinite" />
          </rect>
        </>
      )}
      {hairStyle === 6 && (
        <path d="M -12,-46 Q -6,-36 0,-40 Q 6,-36 12,-46 L 12,-50 Q 0,-54 -12,-50 Z" fill={hairColor} />
      )}
      {hairStyle === 7 && (
        <path d="M -12,-46 Q -5,-34 0,-38 Q 5,-34 12,-46 L 12,-50 Q 0,-53 -12,-50 Z" fill={hairColor} />
      )}
      {hairStyle === 8 && (
        <></>
      )}
      {hairStyle === 9 && (
        <path d="M -12,-46 Q -6,-34 0,-38 Q 6,-34 12,-46 L 12,-50 Q 0,-52 -12,-50 Z" fill={hairColor} />
      )}

      {/* Eyebrows */}
      <path d={`M ${eyeX - 3.5 * fx},${browY} L ${eyeX + 2.5 * fx},${browY}`} stroke={hairColor} strokeWidth="1.2" fill="none" />

      {/* Eyes */}
      {expression === 'sleep' ? (
        <path d={`M ${eyeX - 3.5 * fx},${-35} L ${eyeX + 2.5 * fx},${-35}`} stroke={hairColor} strokeWidth="1" fill="none" />
      ) : (
        <g>
          <ellipse cx={eyeX} cy="-35" rx="4" ry="4.5" fill="#fff" />
          <ellipse cx={eyeX} cy="-35" rx="2.5" ry="3" fill={eyeColor} />
          <circle cx={eyeX + 1 * fx} cy="-36.5" r="1.3" fill="#fff" />
          <circle cx={eyeX - 0.5 * fx} cy="-33.5" r="0.6" fill="#fff" opacity="0.7" />
        </g>
      )}

      {/* Face mask */}
      {hasMask && (
        <rect x={facing === 'right' ? -1 : -7} y="-36" width="8" height="6" fill="#1f2937" rx="1" opacity="0.9" />
      )}

      {/* Glasses */}
      {hasGlasses && !hasMask && (
        <rect x={facing === 'right' ? 0 : -8} y="-39" width="8" height="5" fill="none" stroke="#374151" strokeWidth="1.2" rx="1" />
      )}

      {/* Goggles variant */}
      {app.accessory === 7 && !hasMask && (
        <>
          <rect x={facing === 'right' ? -1 : -9} y="-40" width="10" height="6" fill="none" stroke="#b45309" strokeWidth="1.5" rx="2" />
          <line x1="-1" y1="-37" x2="1" y2="-37" stroke="#b45309" strokeWidth="1" />
        </>
      )}

      {/* Headset */}
      {hasHeadset && (
        <>
          <rect x={facing === 'right' ? 8 : -11} y="-46" width="3" height="12" fill="#374151" rx="1" />
          <path d={`M ${facing === 'right' ? 8 : -8},-42 L ${facing === 'right' ? 5 : -5},-42`} stroke="#374151" strokeWidth="1.5" />
        </>
      )}

      {/* VR mask */}
      {extra === 'vr' && (
        <>
          <rect x={facing === 'right' ? -1 : -7} y="-42" width="8" height="7" fill="#0f0f1a" rx="1" />
          <rect x={facing === 'right' ? 0 : -6} y="-40" width="4" height="3" fill="#00ff41" opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
          </rect>
        </>
      )}

      {/* Mouth */}
      {expression === 'sleep' ? (
        <circle cx="0" cy="-27" r="0.8" fill="#8d5524" opacity="0.6" />
      ) : (
        <path d="M -2,-28 Q 0,-26 2,-28" stroke="#8d5524" strokeWidth="0.8" fill="none" />
      )}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Body base with shape variations + accessories
// ═══════════════════════════════════════════════════════════════════════════════

function BodyBase({ app, colors }: { app: ReturnType<typeof getAppearance>; colors: typeof CHARACTER_COLORS['runner'] }) {
  const { bodyShape } = app;
  const w = bodyShape === 'bulky' ? 26 : bodyShape === 'slim' ? 18 : 22;
  const x = -w / 2;
  
  return (
    <g>
      <rect x={x} y="-20" width={w} height="32" fill={colors.primary} rx={bodyShape === 'bulky' ? 5 : 4} />
      {bodyShape === 'bulky' && (
        <>
          {/* Shoulder pads */}
          <ellipse cx={x - 2} cy="-16" rx="5" ry="6" fill="#374151" />
          <ellipse cx={-x + 2} cy="-16" rx="5" ry="6" fill="#374151" />
        </>
      )}
    </g>
  );
}

function Accessories({ app, colors, facing }: { app: ReturnType<typeof getAppearance>; colors: typeof CHARACTER_COLORS['runner']; facing: 'left' | 'right' }) {
  const fx = facing === 'right' ? 1 : -1;
  const { bodyShape, accessory } = app;
  const shoulderX = bodyShape === 'bulky' ? (bodyShape === 'bulky' ? -15 : -13) : -12;
  
  return (
    <g>
      {/* Accessory 1: Face mask - rendered in head */}
      {/* Accessory 2: Scarf */}
      {accessory === 2 && (
        <path d={`M -8,-18 Q 0,-12 8,-18 L 6,-14 Q 0,-8 -6,-14 Z`} fill={colors.accent} opacity="0.7" />
      )}
      {/* Accessory 3: Shoulder pad (one side) */}
      {accessory === 3 && (
        <ellipse cx={shoulderX * fx} cy="-16" rx="5" ry="6" fill="#374151" />
      )}
      {/* Accessory 4: Backpack/pouch */}
      {accessory === 4 && (
        <>
          <rect x={-8} y="-18" width="16" height="18" fill="#1f2937" rx="2" opacity="0.9" />
          <rect x={-6} y="-16" width="12" height="6" fill="#374151" rx="1" />
          <rect x={-6} y="-8" width="12" height="6" fill="#374151" rx="1" />
        </>
      )}
      {/* Accessory 5: Cyber arm */}
      {accessory === 5 && (
        <>
          <rect x={facing === 'right' ? 10 : -15} y="-18" width="5" height="20" fill="#1f2937" rx="2" />
          <rect x={facing === 'right' ? 11 : -14} y="-14" width="3" height="4" fill={colors.accent} opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
          </rect>
          <rect x={facing === 'right' ? 11 : -14} y="-6" width="3" height="4" fill={colors.accent} opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" begin="0.5s" repeatCount="indefinite" />
          </rect>
        </>
      )}
      {/* Accessory 6: Cap - rendered as part of body background */}
      {accessory === 6 && (
        <>
          <path d="M -12,-48 L 12,-48 L 14,-44 L -14,-44 Z" fill={colors.secondary} />
          <rect x="-12" y="-48" width="24" height="5" fill={colors.secondary} rx="1" />
        </>
      )}
      {/* Accessory 8: Ear piece */}
      {accessory === 8 && (
        <>
          <rect x={facing === 'right' ? 9 : -12} y="-38" width="3" height="5" fill="#374151" rx="1" />
          <circle cx={facing === 'right' ? 10.5 : -10.5} cy="-35.5" r="1" fill={colors.accent}>
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Outfit details per character type
// ═══════════════════════════════════════════════════════════════════════════════

function OutfitDetails({ charType, colors, app }: { charType: CharacterType; colors: typeof CHARACTER_COLORS['runner']; app: ReturnType<typeof getAppearance> }) {
  const { bodyShape } = app;
  const w = bodyShape === 'bulky' ? 26 : bodyShape === 'slim' ? 18 : 22;
  const x = -w / 2;
  
  switch (charType) {
    case 'barista':
      return (
        <g>
          <path d={`M ${x + 2},-18 L ${x + 2},8 L ${-x - 2},8 L ${-x - 2},-18 L ${-x / 2},-18 L ${-x / 2},-10 L ${x / 2},-10 L ${x / 2},-18 Z`} fill="#5c4033" opacity="0.95" />
          <rect x={-w / 4} y="-18" width={w / 2} height="3" fill="#e5e7eb" opacity="0.9" />
          <rect x="-3" y="-8" width="6" height="5" fill="#3d2a22" rx="1" />
          <text x="0" y="-4" textAnchor="middle" fontSize="2.5" fill="#d4a574" fontFamily="monospace">CAFE</text>
        </g>
      );
    case 'tech':
      return (
        <g>
          <path d={`M ${x},-20 L ${x},12 L ${x + 4},12 L ${x + 4},-20 Z`} fill={colors.secondary} />
          <path d={`M ${-x},-20 L ${-x},12 L ${-x - 4},12 L ${-x - 4},-20 Z`} fill={colors.secondary} />
          <line x1="0" y1="-18" x2="0" y2="8" stroke={colors.accent} strokeWidth="0.8" opacity="0.6" />
          <path d="M -6,-12 L -6,-6 L -2,-4" stroke={colors.accent} strokeWidth="1" fill="none" opacity="0.7" />
          <circle cx="-2" cy="-4" r="1.2" fill={colors.accent} />
          {/* Tool belt */}
          <rect x={-w / 2 + 2} y="2" width={w - 4} height="3" fill="#1f2937" rx="1" />
          <rect x="-4" y="1" width="3" height="5" fill="#374151" rx="0.5" />
          <rect x="1" y="1" width="3" height="5" fill="#374151" rx="0.5" />
        </g>
      );
    case 'analyst':
      return (
        <g>
          <path d={`M ${x},-20 L ${x / 3},-8 L ${x / 3},12 L ${x},12 Z`} fill={colors.secondary} opacity="0.7" />
          <path d={`M ${-x},-20 L ${-x / 3},-8 L ${-x / 3},12 L ${-x},12 Z`} fill={colors.secondary} opacity="0.7" />
          <rect x="-2" y="-18" width="4" height="14" fill="#fff" opacity="0.9" />
          <rect x="-1" y="-16" width="2" height="10" fill={colors.accent} />
          {/* Lab coat bottom */}
          <path d={`M ${x + 2},8 L ${x + 2},16 L ${-x - 2},16 L ${-x - 2},8 Z`} fill="#e5e7eb" opacity="0.3" />
        </g>
      );
    case 'hacker':
      return (
        <g>
          <path d={`M ${x - 1},-22 L ${x - 1},12 L ${x + 5},12 L ${x + 5},-18 L ${-x - 5},-18 L ${-x - 5},12 L ${-x + 1},12 L ${-x + 1},-22 Q 0,-26 ${x - 1},-22 Z`} fill="#1a1a1a" />
          <path d="M -5,-18 L 0,-8 L 5,-18" stroke="#374151" strokeWidth="1" fill="none" />
          <path d={`M ${x + 3},-15 L ${x + 3},-5`} stroke={colors.accent} strokeWidth="0.6" opacity="0.5" />
          <path d={`M ${-x - 3},-15 L ${-x - 3},-5`} stroke={colors.accent} strokeWidth="0.6" opacity="0.5" />
        </g>
      );
    case 'lounger':
      return (
        <g>
          <path d="M -7,-5 L 7,-5 L 5,5 L -5,5 Z" fill={colors.secondary} opacity="0.6" />
          <line x1="-3" y1="-18" x2="-3" y2="-10" stroke="#fff" strokeWidth="0.6" opacity="0.5" />
          <line x1="3" y1="-18" x2="3" y2="-10" stroke="#fff" strokeWidth="0.6" opacity="0.5" />
        </g>
      );
    case 'runner':
      return (
        <g>
          <rect x={-w / 2 + 1} y="-16" width={w - 2} height="18" fill="#37474f" rx="2" />
          <rect x={-w / 2 + 3} y="-14" width="5" height="5" fill="#263238" rx="1" />
          <rect x={w / 2 - 8} y="-14" width="5" height="5" fill="#263238" rx="1" />
          <rect x={-w / 2 + 3} y="-6" width="5" height="5" fill="#263238" rx="1" />
          <rect x={w / 2 - 8} y="-6" width="5" height="5" fill="#263238" rx="1" />
          <rect x={-w / 2 + 1} y="2" width={w - 2} height="3" fill="#1a1a1a" />
        </g>
      );
    case 'netrunner':
      return (
        <g>
          <line x1={x + 1} y1="-12" x2={-x - 1} y2="-12" stroke={colors.accent} strokeWidth="0.8" opacity="0.5" />
          <line x1={x + 1} y1="-4" x2={-x - 1} y2="-4" stroke={colors.accent} strokeWidth="0.8" opacity="0.5" />
          <circle cx={-6} cy="-8" r="1.5" fill={colors.accent} opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx={6} cy="-8" r="1.5" fill={colors.accent} opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
          </circle>
          {/* Spine cable */}
          <line x1="0" y1="-18" x2="0" y2="8" stroke={colors.accent} strokeWidth="1" opacity="0.4" strokeDasharray="2 1" />
        </g>
      );
    case 'mercenary':
      return (
        <g>
          <path d={`M ${x},-20 L ${x},-5 L ${x + 7},-5 L ${x + 7},-20 Z`} fill="#4e342e" />
          <path d={`M ${-x},-20 L ${-x},-5 L ${-x - 7},-5 L ${-x - 7},-20 Z`} fill="#4e342e" />
          <rect x={-w / 4} y="-18" width={w / 2} height="12" fill="#3e2723" rx="1" />
          <rect x={-3} y="-16" width="6" height="8" fill={colors.accent} opacity="0.7" rx="1" />
          {/* Ammo belt */}
          <rect x={-w / 2 + 2} y="0" width={w - 4} height="3" fill="#1f2937" rx="1" />
          <rect x={-6} y="-1" width="3" height="5" fill="#374151" rx="0.5" />
          <rect x={3} y="-1" width="3" height="5" fill="#374151" rx="0.5" />
        </g>
      );
    case 'corporate':
      return (
        <g>
          <path d={`M ${x},-20 L ${x / 3},-8 L ${x / 3},12 L ${x},12 Z`} fill={colors.secondary} opacity="0.8" />
          <path d={`M ${-x},-20 L ${-x / 3},-8 L ${-x / 3},12 L ${-x},12 Z`} fill={colors.secondary} opacity="0.8" />
          <rect x="-2" y="-18" width="4" height="14" fill="#fff" opacity="0.95" />
          <rect x="-1" y="-16" width="2" height="10" fill={colors.accent} />
        </g>
      );
    case 'mechanic':
      return (
        <g>
          <rect x="-4" y="-20" width="3" height="20" fill="#5c4033" />
          <rect x="1" y="-20" width="3" height="20" fill="#5c4037" opacity="0.4" />
          <rect x="-5" y="-8" width="10" height="8" fill="#4e342e" rx="1" />
          {/* Oil stains */}
          <circle cx="-3" cy="-2" r="1.5" fill="#1f2937" opacity="0.4" />
          <circle cx="4" cy="2" r="1" fill="#1f2937" opacity="0.4" />
        </g>
      );
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// State-specific characters
// ═══════════════════════════════════════════════════════════════════════════════

function PluggedCharacter({ colors, app, facing }: { colors: typeof CHARACTER_COLORS['runner']; app: ReturnType<typeof getAppearance>; facing: 'left' | 'right' }) {
  return (
    <g>
      <line x1="0" y1="0" x2="0" y2="-150" stroke={colors.accent} strokeWidth="2" opacity="0.5" />
      <circle cx="0" cy="-75" r="3" fill={colors.accent}>
        <animate attributeName="cy" values="0;-140;0" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;1;0.5" dur="0.5s" repeatCount="indefinite" />
      </circle>
      <BodyBase app={app} colors={colors} />
      <OutfitDetails charType="hacker" colors={colors} app={app} />
      <AnimeHead app={app} facing={facing} expression="focus" extra="vr" />
      <Accessories app={app} colors={colors} facing={facing} />
      <ArmsAndLegsStatic app={app} colors={colors} />
    </g>
  );
}

function RechargingCharacter({ colors, app, facing }: { colors: typeof CHARACTER_COLORS['runner']; app: ReturnType<typeof getAppearance>; facing: 'left' | 'right' }) {
  return (
    <g>
      <ellipse cx="0" cy="-15" rx="20" ry="30" fill={colors.accent} opacity="0.12">
        <animate attributeName="opacity" values="0.08;0.2;0.08" dur="2s" repeatCount="indefinite" />
      </ellipse>
      <g transform="translate(0, -75)">
        <path d="M -3 0 L 2 8 L -1 8 L 4 16 L -2 8 L 1 8 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="0.3s" repeatCount="indefinite" />
        </path>
        <circle cx="-6" cy="4" r="1.5" fill="#fbbf24" opacity="0.8">
          <animate attributeName="opacity" values="0;1;0" dur="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="6" cy="8" r="1.5" fill="#fbbf24" opacity="0.8">
          <animate attributeName="opacity" values="0;1;0" dur="0.5s" begin="0.25s" repeatCount="indefinite" />
        </circle>
      </g>
      <BodyBase app={app} colors={colors} />
      <OutfitDetails charType="tech" colors={colors} app={app} />
      <AnimeHead app={app} facing={facing} expression="sleep" />
      <Accessories app={app} colors={colors} facing={facing} />
      <ArmsAndLegsStatic app={app} colors={colors} relaxed />
      <rect x="-14" y="-8" width="28" height="3" fill={colors.accent} opacity="0.5">
        <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.5s" repeatCount="indefinite" />
      </rect>
    </g>
  );
}

function WorkingCharacter({ charType, colors, app, facing }: { charType: CharacterType; colors: typeof CHARACTER_COLORS['runner']; app: ReturnType<typeof getAppearance>; facing: 'left' | 'right' }) {
  return (
    <g>
      <rect x="-13" y="-35" width="26" height="22" fill="#2d3748" rx="3" />
      <BodyBase app={app} colors={colors} />
      <OutfitDetails charType={charType} colors={colors} app={app} />
      <AnimeHead app={app} facing={facing} expression="focus" />
      <Accessories app={app} colors={colors} facing={facing} />
      <ArmsTyping app={app} colors={colors} skinTone={app.skinTone} />
      <LegsSitting app={app} colors={colors} />

      {/* Matrix rain */}
      <g transform="translate(0, -55)">
        {[-8, -4, 0, 4, 8].map((colX, colIndex) => (
          <g key={colIndex} transform={`translate(${colX}, 0)`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <text key={i} x="0" y={i * 6} fontSize="5" fontFamily="monospace" fill="#00ff41" opacity={1 - i * 0.15}>
                <animate attributeName="y" values={`${-20};${40}`} dur={`${1 + colIndex * 0.2}s`} repeatCount="indefinite" begin={`${colIndex * 0.15}s`} />
                <animate attributeName="opacity" values="1;0.8;1;0" dur={`${1 + colIndex * 0.2}s`} repeatCount="indefinite" begin={`${colIndex * 0.15}s`} />
                {String.fromCharCode(0x30 + Math.floor(Math.random() * 10))}
              </text>
            ))}
          </g>
        ))}
      </g>
    </g>
  );
}

function SittingCharacter({ charType, colors, app, facing }: { charType: CharacterType; colors: typeof CHARACTER_COLORS['runner']; app: ReturnType<typeof getAppearance>; facing: 'left' | 'right' }) {
  const isLounging = charType === 'lounger' || charType === 'runner';
  return (
    <g>
      <BodyBase app={app} colors={colors} />
      <OutfitDetails charType={charType} colors={colors} app={app} />
      <AnimeHead app={app} facing={facing} />
      <Accessories app={app} colors={colors} facing={facing} />
      <ArmsSitting app={app} colors={colors} isLounging={isLounging} />
      <LegsSitting app={app} colors={colors} />
    </g>
  );
}

function WalkingCharacter({ charType, colors, app, facing, speed = 'slow' }: { charType: CharacterType; colors: typeof CHARACTER_COLORS['runner']; app: ReturnType<typeof getAppearance>; facing: 'left' | 'right'; speed?: 'slow' | 'fast' }) {
  const dur = speed === 'slow' ? '0.45s' : '0.28s';
  const armRange = speed === 'slow' ? '6' : '10';
  const legRange = speed === 'slow' ? '8' : '12';
  const { bodyShape } = app;
  const armW = bodyShape === 'bulky' ? 6 : bodyShape === 'slim' ? 4 : 5;
  const armX = bodyShape === 'bulky' ? 14 : bodyShape === 'slim' ? 9 : 11;
  const legW = bodyShape === 'bulky' ? 8 : bodyShape === 'slim' ? 6 : 7;
  const legX = bodyShape === 'bulky' ? 4 : bodyShape === 'slim' ? 2.5 : 3;
  
  return (
    <g>
      <AnimeHead app={app} facing={facing} />
      <BodyBase app={app} colors={colors} />
      <OutfitDetails charType={charType} colors={colors} app={app} />
      <Accessories app={app} colors={colors} facing={facing} />
      
      {/* Arms */}
      <rect x={-armX - armW} y="-20" width={armW} height="20" fill={colors.primary} rx="2">
        <animateTransform attributeName="transform" type="rotate" values={`${armRange} ${-armX + armW/2} -10;0 ${-armX + armW/2} -10;-${armRange} ${-armX + armW/2} -10;0 ${-armX + armW/2} -10;${armRange} ${-armX + armW/2} -10`} dur={dur} repeatCount="indefinite" />
      </rect>
      <rect x={armX} y="-20" width={armW} height="20" fill={colors.primary} rx="2">
        <animateTransform attributeName="transform" type="rotate" values={`-${armRange} ${armX + armW/2} -10;0 ${armX + armW/2} -10;${armRange} ${armX + armW/2} -10;0 ${armX + armW/2} -10;-${armRange} ${armX + armW/2} -10`} dur={dur} repeatCount="indefinite" />
      </rect>

      {/* Legs */}
      <rect x={-legX - legW} y="4" width={legW} height="18" fill={colors.secondary} rx="2">
        <animateTransform attributeName="transform" type="rotate" values={`-${legRange} ${-legX + legW/2} 13;0 ${-legX + legW/2} 13;${legRange} ${-legX + legW/2} 13;0 ${-legX + legW/2} 13;-${legRange} ${-legX + legW/2} 13`} dur={dur} repeatCount="indefinite" />
      </rect>
      <rect x={legX} y="4" width={legW} height="18" fill={colors.secondary} rx="2">
        <animateTransform attributeName="transform" type="rotate" values={`${legRange} ${legX + legW/2} 13;0 ${legX + legW/2} 13;-${legRange} ${legX + legW/2} 13;0 ${legX + legW/2} 13;${legRange} ${legX + legW/2} 13`} dur={dur} repeatCount="indefinite" />
      </rect>
    </g>
  );
}

function WaitingCharacter({ colors, app, facing }: { colors: typeof CHARACTER_COLORS['runner']; app: ReturnType<typeof getAppearance>; facing: 'left' | 'right' }) {
  const bobOffset = Math.sin(Date.now() / 200) * 1;
  return (
    <g transform={`translate(0, ${bobOffset})`}>
      <AnimeHead app={app} facing={facing} />
      <BodyBase app={app} colors={colors} />
      <OutfitDetails charType="runner" colors={colors} app={app} />
      <Accessories app={app} colors={colors} facing={facing} />
      <ArmsAndLegsStatic app={app} colors={colors} />
    </g>
  );
}

function StandingCharacter({ charType, colors, app, facing, isWalking }: { charType: CharacterType; colors: typeof CHARACTER_COLORS['runner']; app: ReturnType<typeof getAppearance>; facing: 'left' | 'right'; isWalking?: boolean }) {
  if (isWalking) {
    return <WalkingCharacter charType={charType} colors={colors} app={app} facing={facing} speed="fast" />;
  }
  return (
    <g>
      <AnimeHead app={app} facing={facing} />
      <BodyBase app={app} colors={colors} />
      <OutfitDetails charType={charType} colors={colors} app={app} />
      <Accessories app={app} colors={colors} facing={facing} />

      {(charType === 'tech' || charType === 'netrunner' || charType === 'hacker') && (
        <>
          <rect x="-10" y="-14" width="3" height="6" fill={colors.accent} opacity="0.6" rx="0.5" />
          <circle cx="-8.5" cy="-9" r="1.2" fill={colors.accent}>
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      <ArmsAndLegsStatic app={app} colors={colors} />
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Limb helpers
// ═══════════════════════════════════════════════════════════════════════════════

function ArmsAndLegsStatic({ app, colors, relaxed }: { app: ReturnType<typeof getAppearance>; colors: typeof CHARACTER_COLORS['runner']; relaxed?: boolean }) {
  const { bodyShape } = app;
  const armW = bodyShape === 'bulky' ? 6 : bodyShape === 'slim' ? 4 : 5;
  const armX = bodyShape === 'bulky' ? 14 : bodyShape === 'slim' ? 9 : 11;
  const legW = bodyShape === 'bulky' ? 8 : bodyShape === 'slim' ? 6 : 7;
  const legX = bodyShape === 'bulky' ? 4 : bodyShape === 'slim' ? 2.5 : 3;
  return (
    <>
      <rect x={-armX - armW} y="-20" width={armW} height={relaxed ? 28 : 20} fill={colors.primary} rx="2" />
      <rect x={armX} y="-20" width={armW} height={relaxed ? 28 : 20} fill={colors.primary} rx="2" />
      <rect x={-legX - legW} y="4" width={legW} height="20" fill={colors.secondary} rx="2" />
      <rect x={legX} y="4" width={legW} height="20" fill={colors.secondary} rx="2" />
    </>
  );
}

function ArmsTyping({ app, colors, skinTone }: { app: ReturnType<typeof getAppearance>; colors: typeof CHARACTER_COLORS['runner']; skinTone: string }) {
  const { bodyShape } = app;
  const armW = bodyShape === 'bulky' ? 6 : bodyShape === 'slim' ? 4 : 5;
  const armX = bodyShape === 'bulky' ? 14 : bodyShape === 'slim' ? 9 : 11;
  return (
    <>
      <rect x={-armX - armW} y="-18" width={armW} height="18" fill={colors.primary} rx="2" />
      <rect x={armX} y="-18" width={armW} height="18" fill={colors.primary} rx="2" />
      <rect x={-armX - armW + 1} y="-5" width={armW - 2} height="10" fill={skinTone} rx="1" />
      <rect x={armX + 1} y="-5" width={armW - 2} height="10" fill={skinTone} rx="1" />
    </>
  );
}

function ArmsSitting({ app, colors, isLounging }: { app: ReturnType<typeof getAppearance>; colors: typeof CHARACTER_COLORS['runner']; isLounging: boolean }) {
  const fill = isLounging ? '#4a3b5c' : colors.primary;
  const { bodyShape } = app;
  const armW = bodyShape === 'bulky' ? 6 : bodyShape === 'slim' ? 4 : 5;
  const armX = bodyShape === 'bulky' ? 14 : bodyShape === 'slim' ? 9 : 11;
  return (
    <>
      <rect x={-armX - armW} y="-14" width={armW} height="22" fill={fill} rx="2" />
      <rect x={armX} y="-14" width={armW} height="22" fill={fill} rx="2" />
    </>
  );
}

function LegsSitting({ app, colors }: { app: ReturnType<typeof getAppearance>; colors: typeof CHARACTER_COLORS['runner'] }) {
  const { bodyShape } = app;
  const legW = bodyShape === 'bulky' ? 8 : bodyShape === 'slim' ? 6 : 7;
  const legX = bodyShape === 'bulky' ? 4 : bodyShape === 'slim' ? 2.5 : 3;
  return (
    <>
      <rect x={-legX - legW} y="0" width={legW} height="14" fill={colors.secondary} rx="2" />
      <rect x={legX} y="0" width={legW} height="14" fill={colors.secondary} rx="2" />
      <rect x={-legX - legW + 1} y="12" width={legW - 2} height="10" fill="#1f2937" rx="1" />
      <rect x={legX + 1} y="12" width={legW - 2} height="10" fill="#1f2937" rx="1" />
    </>
  );
}

export default CharacterSprite;
