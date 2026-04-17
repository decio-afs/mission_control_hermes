
import { useMemo } from 'react';
import { ZONES, WINDOW, ROOM_WIDTH, FURNITURE_OBJECTS } from './constants';

// Cyberpunk color palette
const COLORS = {
  wall: '#0f0f1a',
  wallDark: '#050510',
  floor: '#1a1a24',
  floorDark: '#12121a',
  couch: '#3d2f4a',
  couchDark: '#2d1f3a',
  couchAccent: '#5c4d6e',
  wood: '#4a332a',
  woodDark: '#3d2a22',
  woodLight: '#5c4033',
  neonPink: '#ff0080',
  neonBlue: '#00d4ff',
  neonGreen: '#00ff41',
  neonAmber: '#ffb000',
  neonPurple: '#a855f7',
  metal: '#374151',
  metalDark: '#1f2937',
  metalLight: '#4b5563',
  screenGreen: '#00ff41',
  screenAmber: '#ffb000',
  glass: 'rgba(0, 255, 200, 0.25)',
  darkGlass: 'rgba(0, 255, 200, 0.08)',
};

// Background only - wall, floor, window
export function RoomBackground() {
  return (
    <g>
      <defs>
        <pattern id="floorTiles" width="40" height="20" patternUnits="userSpaceOnUse">
          <rect width="40" height="20" fill={COLORS.floor} />
          <rect x="0" y="0" width="38" height="18" fill={COLORS.floorDark} />
          <rect x="2" y="2" width="36" height="16" fill={COLORS.floor} />
          <line x1="0" y1="19" x2="40" y2="19" stroke="#0a0a0f" strokeWidth="0.5" />
          <line x1="39" y1="0" x2="39" y2="20" stroke="#0a0a0f" strokeWidth="0.5" />
        </pattern>

        <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={COLORS.wallDark} />
          <stop offset="100%" stopColor={COLORS.wall} />
        </linearGradient>

        <linearGradient id="floorReflect" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,212,255,0.03)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>

        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <radialGradient id="windowGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2d0050" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#050510" stopOpacity="1" />
        </radialGradient>

        <linearGradient id="glassSheen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="50%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
      </defs>

      {/* Wall */}
      <rect x="0" y="0" width={ROOM_WIDTH} height="270" fill="url(#wallGrad)" />

      {/* Wall panel lines */}
      <g stroke="#1a1a2e" strokeWidth="2">
        <line x1="200" y1="0" x2="200" y2="270" />
        <line x1="500" y1="0" x2="500" y2="270" />
        <line x1="750" y1="0" x2="750" y2="270" />
        <line x1="0" y1="135" x2={ROOM_WIDTH} y2="135" />
      </g>

      {/* Floor */}
      <rect x="0" y="270" width={ROOM_WIDTH} height="330" fill="url(#floorTiles)" />
      <rect x="0" y="270" width={ROOM_WIDTH} height="330" fill="url(#floorReflect)" />

      {/* Floor perspective lines */}
      <g stroke="#0f0f1a" strokeWidth="1" opacity="0.6">
        {[330, 380, 430, 480, 530, 580].map(y => (
          <line key={y} x1="0" y1={y} x2={ROOM_WIDTH} y2={y} />
        ))}
      </g>

      {/* Floor cables */}
      <g stroke="#0f0f1a" strokeWidth="3" fill="none" opacity="0.7">
        <path d="M 100 350 Q 250 380 300 320" />
        <path d="M 350 450 Q 500 480 600 400" />
        <path d="M 650 520 Q 800 550 900 480" />
        <path d="M 200 580 Q 450 600 700 560" />
      </g>
      <g stroke="#1a1a24" strokeWidth="1" fill="none" opacity="0.5">
        <path d="M 100 350 Q 250 380 300 320" />
        <path d="M 350 450 Q 500 480 600 400" />
        <path d="M 650 520 Q 800 550 900 480" />
        <path d="M 200 580 Q 450 600 700 560" />
      </g>

      {/* Window */}
      <g transform={`translate(${WINDOW.x}, ${WINDOW.y})`}>
        <rect x="-10" y="-10" width={WINDOW.w + 20} height={WINDOW.h + 20} fill="#050508" stroke="#1f1f2e" strokeWidth="8" />
        <rect x="0" y="0" width={WINDOW.w} height={WINDOW.h} fill="url(#windowGlow)" />

        {/* Cityscape */}
        <g opacity="0.85">
          <rect x="20" y="120" width="40" height="100" fill="#08080f" />
          <rect x="70" y="80" width="30" height="140" fill="#0f0f1a" />
          <rect x="110" y="140" width="50" height="80" fill="#08080f" />
          <rect x="170" y="60" width="35" height="160" fill="#0f0f1a" />
          <rect x="220" y="100" width="45" height="120" fill="#08080f" />
          <rect x="280" y="40" width="40" height="180" fill="#0f0f1a" />
          <rect x="340" y="90" width="35" height="130" fill="#08080f" />
          <rect x="390" y="70" width="45" height="150" fill="#0f0f1a" />
          <rect x="450" y="110" width="35" height="110" fill="#08080f" />

          <g filter="url(#neonGlow)">
            <rect x="50" y="50" width="8" height="60" fill={COLORS.neonPink} opacity="0.9">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            </rect>
            <text x="54" y="80" textAnchor="middle" fontSize="8" fill={COLORS.neonPink} fontFamily="monospace" writingMode="tb">CYBER</text>
            <rect x="200" y="40" width="35" height="12" fill={COLORS.neonAmber} rx="2" opacity="0.9">
              <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
            </rect>
            <text x="217.5" y="49" textAnchor="middle" fontSize="8" fill="#000" fontFamily="monospace">24H</text>
            <rect x="350" y="55" width="30" height="10" fill={COLORS.neonGreen} rx="1" opacity="0.9">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
            </rect>
            <text x="365" y="62" textAnchor="middle" fontSize="6" fill="#000" fontFamily="monospace">OPEN</text>
          </g>

          <g fill="#fbbf24" opacity="0.6">
            <rect x="75" y="90" width="4" height="4" />
            <rect x="85" y="110" width="4" height="4" />
            <rect x="75" y="130" width="4" height="4" />
            <rect x="180" y="80" width="4" height="4" />
            <rect x="190" y="100" width="4" height="4" />
            <rect x="290" y="60" width="4" height="4" />
            <rect x="300" y="80" width="4" height="4" />
            <rect x="400" y="90" width="4" height="4" />
          </g>
        </g>

        <g stroke="#1f1f2e" strokeWidth="3">
          <line x1={WINDOW.w / 3} y1="0" x2={WINDOW.w / 3} y2={WINDOW.h} />
          <line x1={WINDOW.w * 2 / 3} y1="0" x2={WINDOW.w * 2 / 3} y2={WINDOW.h} />
          <line x1="0" y1={WINDOW.h / 2} x2={WINDOW.w} y2={WINDOW.h / 2} />
        </g>
        <rect x="0" y="0" width={WINDOW.w} height={WINDOW.h} fill="url(#windowGlow)" opacity="0.1" />
      </g>

      {/* CHILL area - String lights */}
      <g transform={`translate(${ZONES.lounge.x}, ${ZONES.lounge.y - 50})`}>
        <path d="M 10,10 Q 100,-20 190,10" fill="none" stroke="#2d3748" strokeWidth="2" />
        {[20, 40, 60, 80, 100, 120, 140, 160, 180].map((lx, i) => (
          <circle key={i} cx={lx} cy={5 + Math.sin(i * 0.7) * 8} r="4" fill="#fbbf24" opacity="0.9">
            <animate attributeName="opacity" values="0.6;1;0.6" dur={`${1.5 + i * 0.15}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </g>

      {/* CHILL area - Posters */}
      <g transform={`translate(${ZONES.lounge.x + 10}, ${ZONES.lounge.y - 10})`}>
        {/* PHREAK poster */}
        <rect x="0" y="0" width="35" height="50" fill="#0f0f1a" stroke="#1f2937" strokeWidth="2" />
        <rect x="2" y="2" width="31" height="46" fill="#050510" />
        <circle cx="17" cy="20" r="10" fill="#dc2626" opacity="0.8" />
        <text x="17" y="38" textAnchor="middle" fontSize="6" fill="#9ca3af" fontFamily="monospace">PHREAK</text>
        <text x="17" y="44" textAnchor="middle" fontSize="5" fill="#4b5563" fontFamily="monospace">WANTED</text>
      </g>

      <g transform={`translate(${ZONES.lounge.x + 150}, ${ZONES.lounge.y - 10})`}>
        {/* HACKER poster */}
        <rect x="0" y="0" width="35" height="50" fill="#0f0f1a" stroke="#1f2937" strokeWidth="2" />
        <rect x="2" y="2" width="31" height="46" fill="#050510" />
        <rect x="10" y="8" width="15" height="20" fill="#374151" rx="2" />
        <rect x="12" y="10" width="11" height="8" fill="#00ff41" opacity="0.5" />
        <text x="17" y="38" textAnchor="middle" fontSize="6" fill={COLORS.neonPink} fontFamily="monospace">HACKER</text>
        <text x="17" y="44" textAnchor="middle" fontSize="5" fill="#4b5563" fontFamily="monospace">WARNING</text>
      </g>

      {/* Zone signs */}
      <g transform={`translate(${ZONES.lounge.x + 100}, ${ZONES.lounge.y - -300})`} filter="url(#neonGlow)">
        <rect x="-50" y="-20" width="100" height="30" fill="none" stroke={COLORS.neonBlue} strokeWidth="3" rx="4" />
        <text x="0" y="2" textAnchor="middle" fontSize="16" fontFamily="monospace" fontWeight="bold" fill={COLORS.neonBlue}>CHILL</text>
      </g>

      <g transform={`translate(${ZONES.coffee.x + 100}, ${ZONES.coffee.y - -300})`} filter="url(#neonGlow)">
        <rect x="-40" y="-18" width="80" height="26" fill="none" stroke={COLORS.neonAmber} strokeWidth="3" rx="4" />
        <text x="0" y="0" textAnchor="middle" fontSize="14" fontFamily="monospace" fontWeight="bold" fill={COLORS.neonAmber}>CAFÉ</text>
      </g>

      <g transform={`translate(${ZONES.recharge.x + 100}, ${ZONES.recharge.y - -300})`} filter="url(#neonGlow)">
        <rect x="-65" y="-18" width="130" height="26" fill="none" stroke={COLORS.neonGreen} strokeWidth="3" rx="4" />
        <text x="0" y="0" textAnchor="middle" fontSize="12" fontFamily="monospace" fontWeight="bold" fill={COLORS.neonGreen}>RECHARGE BAY</text>
      </g>

      <g transform={`translate(${ZONES.mainframe.x + 115}, ${ZONES.mainframe.y - 25})`} filter="url(#neonGlow)">
        <rect x="-50" y="-15" width="100" height="22" fill="none" stroke={COLORS.neonGreen} strokeWidth="2" rx="2" />
        <text x="0" y="2" textAnchor="middle" fontSize="10" fontFamily="monospace" fontWeight="bold" fill={COLORS.neonGreen}>MAINFRAME</text>
      </g>

      <g transform={`translate(${ZONES.desk.x + 150}, ${ZONES.desk.y - -300})`} filter="url(#neonGlow)">
        <rect x="-55" y="-15" width="110" height="26" fill="none" stroke="#38bdf8" strokeWidth="3" rx="4" />
        <text x="0" y="2" textAnchor="middle" fontSize="12" fontFamily="monospace" fontWeight="bold" fill="#38bdf8">
          WORKSTATIONS
        </text>
      </g>
    </g>
  );
}

// Individual furniture components - SOLID objects (not layered)

// Main couch (horizontal 3-seater, facing left)
export function CouchMain({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx="0" cy="28" rx="58" ry="12" fill="#000" opacity="0.5" />

      {/* Legs */}
      <rect x="-45" y="18" width="8" height="12" fill="#2d1f3a" rx="2" />
      <rect x="37" y="18" width="8" height="12" fill="#2d1f3a" rx="2" />

      {/* Main body - horizontal couch facing left */}
      <rect x="-52" y="-15" width="104" height="40" fill={COLORS.couchDark} rx="6" />
      <rect x="-48" y="-11" width="96" height="32" fill={COLORS.couch} rx="4" />
      {/* Body shading */}
      <rect x="-48" y="-11" width="96" height="32" fill="url(#glassSheen)" rx="4" opacity="0.3" />

      {/* Backrest */}
      <rect x="-52" y="-38" width="104" height="28" fill={COLORS.couchDark} rx="5" />
      <rect x="-48" y="-34" width="96" height="20" fill={COLORS.couch} rx="3" />
      <rect x="-48" y="-34" width="96" height="20" fill="url(#glassSheen)" rx="3" opacity="0.2" />

      {/* Seat cushions */}
      <rect x="-44" y="-2" width="30" height="22" fill={COLORS.couchAccent} rx="3" />
      <rect x="-12" y="-2" width="30" height="22" fill={COLORS.couchAccent} rx="3" />
      <rect x="20" y="-2" width="24" height="22" fill={COLORS.couchAccent} rx="3" />
      {/* Cushion seams */}
      <line x1="-14" y1="-2" x2="-14" y2="20" stroke="#2d1f3a" strokeWidth="1" opacity="0.5" />
      <line x1="18" y1="-2" x2="18" y2="20" stroke="#2d1f3a" strokeWidth="1" opacity="0.5" />

      {/* Pillows */}
      <rect x="-36" y="-12" width="20" height="16" fill="#5c4033" rx="3" opacity="0.95" />
      <rect x="-36" y="-12" width="20" height="16" fill="url(#glassSheen)" rx="3" opacity="0.2" />
      
      <rect x="0" y="-10" width="18" height="15" fill="#6b4423" rx="3" opacity="0.95" />
      <rect x="0" y="-10" width="18" height="15" fill="url(#glassSheen)" rx="3" opacity="0.2" />
      
      <rect x="26" y="-12" width="16" height="16" fill="#7c4f3a" rx="3" opacity="0.95" />
      <rect x="26" y="-12" width="16" height="16" fill="url(#glassSheen)" rx="3" opacity="0.2" />

      {/* Throw blanket */}
      <path d="M -20 -15 Q 0 -8 20 -15 L 18 -5 Q 0 2 -18 -5 Z" fill="#1f2937" opacity="0.4" />
    </g>
  );
}

// Side couch (2-seater, on the left side, facing right)
export function CouchSide({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx="0" cy="24" rx="40" ry="10" fill="#000" opacity="0.5" />

      {/* Legs */}
      <rect x="-30" y="16" width="6" height="10" fill="#2d1f3a" rx="1" />
      <rect x="24" y="16" width="6" height="10" fill="#2d1f3a" rx="1" />

      {/* Main body */}
      <rect x="-37" y="-12" width="74" height="34" fill={COLORS.couchDark} rx="5" />
      <rect x="-33" y="-8" width="66" height="26" fill={COLORS.couch} rx="3" />
      <rect x="-33" y="-8" width="66" height="26" fill="url(#glassSheen)" rx="3" opacity="0.3" />

      {/* Backrest */}
      <rect x="-37" y="-34" width="74" height="25" fill={COLORS.couchDark} rx="4" />
      <rect x="-33" y="-30" width="66" height="18" fill={COLORS.couch} rx="2" />

      {/* Seat cushions */}
      <rect x="-30" y="-2" width="28" height="20" fill={COLORS.couchAccent} rx="3" />
      <rect x="0" y="-2" width="28" height="20" fill={COLORS.couchAccent} rx="3" />
      <line x1="-2" y1="-2" x2="-2" y2="18" stroke="#2d1f3a" strokeWidth="1" opacity="0.5" />

      {/* Pillows */}
      <rect x="-24" y="-10" width="16" height="13" fill="#5c4033" rx="2" opacity="0.95" />
      <rect x="6" y="-8" width="16" height="13" fill="#6b4423" rx="2" opacity="0.95" />
    </g>
  );
}

// Bottom couch (facing upward/backward)
export function CouchBottom({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx="0" cy="40" rx="58" ry="10" fill="#000" opacity="0.5" />

      {/* Legs */}
      <rect x="-45" y="22" width="8" height="12" fill="#2d1f3a" rx="2" />
      <rect x="37" y="22" width="8" height="12" fill="#2d1f3a" rx="2" />

      {/* Main body */}
      <rect x="-52" y="-12" width="104" height="34" fill={COLORS.couchDark} rx="5" />
      <rect x="-48" y="-8" width="96" height="26" fill={COLORS.couch} rx="3" />
      <rect x="-48" y="-8" width="96" height="26" fill="url(#glassSheen)" rx="3" opacity="0.3" />

      {/* Backrest - at the bottom */}
      <rect x="-52" y="20" width="104" height="22" fill={COLORS.couchDark} rx="4" />
      <rect x="-48" y="23" width="96" height="16" fill={COLORS.couch} rx="2" />

      {/* Seat cushions */}
      <rect x="-42" y="-2" width="26" height="20" fill={COLORS.couchAccent} rx="3" />
      <rect x="-14" y="-2" width="26" height="20" fill={COLORS.couchAccent} rx="3" />
      <rect x="14" y="-2" width="26" height="20" fill={COLORS.couchAccent} rx="3" />
      <line x1="-16" y1="-2" x2="-16" y2="18" stroke="#2d1f3a" strokeWidth="1" opacity="0.5" />
      <line x1="12" y1="-2" x2="12" y2="18" stroke="#2d1f3a" strokeWidth="1" opacity="0.5" />

      {/* Pillows */}
      <rect x="-34" y="-8" width="18" height="14" fill="#5c4033" rx="2" opacity="0.95" />
      <rect x="-10" y="-6" width="18" height="14" fill="#6b4423" rx="2" opacity="0.95" />
      <rect x="16" y="-8" width="18" height="14" fill="#7c4f3a" rx="2" opacity="0.95" />
    </g>
  );
}

export function CoffeeTable({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx="0" cy="20" rx="36" ry="10" fill="#000" opacity="0.4" />

      {/* Legs */}
      <rect x="-26" y="16" width="5" height="12" fill={COLORS.woodDark} rx="1" />
      <rect x="21" y="16" width="5" height="12" fill={COLORS.woodDark} rx="1" />
      <rect x="-7" y="16" width="4" height="10" fill={COLORS.woodDark} rx="1" />
      <rect x="3" y="16" width="4" height="10" fill={COLORS.woodDark} rx="1" />

      {/* Lower shelf */}
      <rect x="-24" y="12" width="48" height="4" fill={COLORS.woodDark} rx="1" />

      {/* Table top */}
      <rect x="-30" y="-2" width="60" height="20" fill={COLORS.woodDark} rx="4" />
      <rect x="-26" y="0" width="52" height="16" fill={COLORS.wood} rx="2" />
      <rect x="-26" y="0" width="52" height="16" fill="url(#glassSheen)" rx="2" opacity="0.15" />
      {/* Wood grain lines */}
      <line x1="-20" y1="2" x2="-20" y2="14" stroke="#3d2a22" strokeWidth="0.5" opacity="0.5" />
      <line x1="0" y1="2" x2="0" y2="14" stroke="#3d2a22" strokeWidth="0.5" opacity="0.5" />
      <line x1="20" y1="2" x2="20" y2="14" stroke="#3d2a22" strokeWidth="0.5" opacity="0.5" />

      {/* Coffee mugs with handles */}
      <g transform="translate(-14, 4)">
        <rect x="0" y="0" width="7" height="8" fill="#e5e7eb" rx="1" />
        <rect x="1" y="1" width="5" height="6" fill="#374151" rx="0.5" opacity="0.1" />
        <path d="M 7 2 Q 9 2 9 4 Q 9 6 7 6" stroke="#e5e7eb" strokeWidth="1" fill="none" />
      </g>
      <g transform="translate(10, 5)">
        <rect x="0" y="0" width="7" height="8" fill="#e5e7eb" rx="1" />
        <rect x="1" y="1" width="5" height="6" fill="#5c4033" rx="0.5" opacity="0.3" />
        <path d="M 7 2 Q 9 2 9 4 Q 9 6 7 6" stroke="#e5e7eb" strokeWidth="1" fill="none" />
      </g>

      {/* Magazine/tablet */}
      <rect x="-6" y="7" width="12" height="7" fill="#1f2937" rx="1" opacity="0.8" />
      <rect x="-5" y="8" width="10" height="5" fill="#0f0f1a" rx="0.5" />

      {/* Small snack plate */}
      <ellipse cx="6" cy="10" rx="5" ry="3" fill="#e5e7eb" opacity="0.9" />
      <circle cx="5" cy="9" r="1.5" fill="#8b4513" />
      <circle cx="7" cy="10" r="1.5" fill="#8b4513" />
    </g>
  );
}

export function SideTable({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx="0" cy="22" rx="20" ry="7" fill="#000" opacity="0.4" />

      {/* Table top */}
      <ellipse cx="0" cy="0" rx="22" ry="9" fill={COLORS.woodDark} />
      <ellipse cx="0" cy="-2" rx="20" ry="7" fill={COLORS.wood} />
      <ellipse cx="0" cy="-2" rx="20" ry="7" fill="url(#glassSheen)" opacity="0.2" />

      {/* Leg */}
      <rect x="-3" y="2" width="6" height="20" fill={COLORS.woodDark} />
      <ellipse cx="0" cy="22" rx="14" ry="5" fill={COLORS.woodDark} opacity="0.6" />

      {/* Small plant */}
      <ellipse cx="0" cy="-4" rx="4" ry="2" fill="#374151" />
      <path d="M -2 -4 Q -4 -12 0 -16 Q 4 -12 2 -4" fill="#10b981" opacity="0.8" />
      <path d="M -1 -4 Q -3 -10 -6 -8" stroke="#10b981" strokeWidth="2" fill="none" />
      <path d="M 1 -4 Q 3 -10 6 -8" stroke="#10b981" strokeWidth="2" fill="none" />
    </g>
  );
}

export function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Base */}
      <ellipse cx="0" cy="62" rx="16" ry="5" fill="#1f2937" />
      <ellipse cx="0" cy="60" rx="12" ry="3" fill="#374151" />
      {/* Stand */}
      <rect x="-2.5" y="15" width="5" height="45" fill="#4b5563" />
      <rect x="-1" y="15" width="2" height="45" fill="#6b7280" opacity="0.5" />
      {/* Lamp shade */}
      <path d="M -14 15 L 14 15 L 9 0 L -9 0 Z" fill={COLORS.woodDark} />
      <path d="M -14 15 L 14 15 L 9 0 L -9 0 Z" fill="url(#glassSheen)" opacity="0.2" />
      <ellipse cx="0" cy="0" rx="11" ry="4" fill={COLORS.wood} />
      <ellipse cx="0" cy="0" rx="9" ry="3" fill="#fbbf24" opacity="0.3" />
      {/* Light glow cone */}
      <ellipse cx="0" cy="38" rx="35" ry="40" fill="#fbbf24" opacity="0.12" />
      <ellipse cx="0" cy="38" rx="25" ry="30" fill="#fbbf24" opacity="0.08" />
      {/* Bulb */}
      <ellipse cx="0" cy="8" rx="4" ry="3" fill="#fbbf24" opacity="0.9" />
    </g>
  );
}

export function Pod({ x, y, isOccupied }: { x: number; y: number; isOccupied?: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Base platform */}
      <ellipse cx="0" cy="78" rx="28" ry="9" fill="#0f0f1a" />
      <ellipse cx="0" cy="76" rx="24" ry="7" fill="#1f2937" />
      
      {/* Energy glow when occupied */}
      {isOccupied && (
        <ellipse cx="0" cy="38" rx="32" ry="42" fill={COLORS.neonGreen} opacity="0.12">
          <animate attributeName="opacity" values="0.08;0.2;0.08" dur="0.5s" repeatCount="indefinite" />
          <animate attributeName="rx" values="32;34;32" dur="0.5s" repeatCount="indefinite" />
        </ellipse>
      )}

      {/* Main frame outer */}
      <rect x="-22" y="-2" width="44" height="80" fill={COLORS.metalDark} rx="22" />
      {/* Frame highlight */}
      <rect x="-22" y="-2" width="44" height="80" fill="url(#glassSheen)" rx="22" opacity="0.15" />
      
      {/* Neon border */}
      <rect x="-20" y="0" width="40" height="76" fill="none" stroke={COLORS.neonGreen} strokeWidth="2" rx="20" opacity={isOccupied ? "0.9" : "0.3"}>
        {isOccupied && (
          <>
            <animate attributeName="opacity" values="0.3;1;0.3" dur="0.4s" repeatCount="indefinite" />
            <animate attributeName="stroke-width" values="2;3;2" dur="0.4s" repeatCount="indefinite" />
          </>
        )}
      </rect>

      {/* Glass */}
      <rect x="-16" y="4" width="32" height="68" fill={isOccupied ? COLORS.glass : COLORS.darkGlass} rx="16" />
      <rect x="-16" y="4" width="32" height="68" fill="url(#glassSheen)" rx="16" opacity="0.2" />
      
      {/* Glass reflection streak */}
      <path d="M -12 8 L -8 8 L -4 68 L -8 68 Z" fill="rgba(255,255,255,0.1)" rx="16" />
      
      {/* Electric energy inside pod */}
      {isOccupied && (
        <g opacity="0.9">
          <path d="M -8 15 L -3 25 L -6 25 L -1 35" stroke={COLORS.neonGreen} strokeWidth="2" fill="none">
            <animate attributeName="opacity" values="0;1;0" dur="0.3s" repeatCount="indefinite" />
          </path>
          <path d="M 8 20 L 3 30 L 6 30 L 1 40" stroke={COLORS.neonGreen} strokeWidth="2" fill="none">
            <animate attributeName="opacity" values="0;1;0" dur="0.3s" begin="0.15s" repeatCount="indefinite" />
          </path>
          <path d="M -5 40 L 0 50 L -3 50 L 3 60" stroke="#fbbf24" strokeWidth="2" fill="none">
            <animate attributeName="opacity" values="0;1;0" dur="0.4s" begin="0.1s" repeatCount="indefinite" />
          </path>
        </g>
      )}

      {/* Lightning bolt */}
      <path d="M -5 25 L 2 40 L -2 40 L 5 55 L -2 40 L 2 40 Z" fill={isOccupied ? COLORS.neonGreen : '#1f2937'} opacity={isOccupied ? "0.95" : "0.3"}>
        {isOccupied && (
          <>
            <animate attributeName="opacity" values="0.2;1;0.2" dur="0.2s" repeatCount="indefinite" />
            <animate attributeName="fill" values="#00ff41;#fbbf24;#00ff41" dur="0.4s" repeatCount="indefinite" />
          </>
        )}
      </path>

      {/* Top cap */}
      <ellipse cx="0" cy="-2" rx="22" ry="5" fill="#1f2937" />
      <ellipse cx="0" cy="-2" rx="18" ry="3" fill="#374151" />

      {/* Status light */}
      <circle cx="0" cy="68" r="5" fill={isOccupied ? COLORS.neonGreen : '#4b5563'}>
        {isOccupied && (
          <>
            <animate attributeName="opacity" values="0.3;1;0.3" dur="0.3s" repeatCount="indefinite" />
            <animate attributeName="r" values="5;6;5" dur="0.3s" repeatCount="indefinite" />
          </>
        )}
      </circle>
      
      {/* Side control panel */}
      <rect x="14" y="20" width="4" height="20" fill="#1f2937" rx="1" />
      <rect x="15" y="22" width="2" height="3" fill={isOccupied ? COLORS.neonGreen : '#374151'} />
      <rect x="15" y="28" width="2" height="3" fill={isOccupied ? '#fbbf24' : '#374151'} />
      <rect x="15" y="34" width="2" height="3" fill={isOccupied ? COLORS.neonGreen : '#374151'} />
      
      {/* Sparks */}
      {isOccupied && (
        <>
          <circle cx="-24" cy="22" r="2" fill="#fbbf24" opacity="0">
            <animate attributeName="opacity" values="0;0.8;0" dur="0.6s" repeatCount="indefinite" />
          </circle>
          <circle cx="24" cy="52" r="1.5" fill="#00ff41" opacity="0">
            <animate attributeName="opacity" values="0;0.8;0" dur="0.6s" begin="0.3s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </g>
  );
}

export function Counter({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <rect x="-5" y="72" width="170" height="10" fill="#000" opacity="0.4" rx="3" />

      {/* Body */}
      <rect x="0" y="0" width="160" height="70" fill={COLORS.wood} rx="3" />
      <rect x="4" y="4" width="152" height="62" fill={COLORS.woodDark} rx="2" />
      {/* Wood panels */}
      <line x1="40" y1="4" x2="40" y2="66" stroke="#3d2a22" strokeWidth="1" opacity="0.5" />
      <line x1="80" y1="4" x2="80" y2="66" stroke="#3d2a22" strokeWidth="1" opacity="0.5" />
      <line x1="120" y1="4" x2="120" y2="66" stroke="#3d2a22" strokeWidth="1" opacity="0.5" />

      {/* Counter top */}
      <rect x="-5" y="-8" width="170" height="16" fill="#5c4033" rx="3" />
      <rect x="-3" y="-6" width="166" height="12" fill="#6b4423" rx="2" />
      <rect x="-3" y="-6" width="166" height="12" fill="url(#glassSheen)" rx="2" opacity="0.15" />

      {/* Espresso Machine */}
      <g transform="translate(8, -42)">
        <rect x="0" y="0" width="38" height="42" fill={COLORS.metalDark} rx="3" />
        <rect x="2" y="2" width="34" height="10" fill={COLORS.metalLight} rx="2" />
        <rect x="5" y="16" width="28" height="14" fill="#0f0f1a" rx="1" />
        <rect x="7" y="18" width="10" height="4" fill={COLORS.screenGreen} opacity="0.8" />
        <rect x="20" y="18" width="10" height="4" fill={COLORS.screenGreen} opacity="0.5" />
        {/* Portafilter */}
        <rect x="12" y="30" width="14" height="8" fill="#1f2937" rx="2" />
        <rect x="15" y="38" width="8" height="4" fill="#374151" rx="1" />
        {/* Steam */}
        <circle cx="19" cy="-2" r="3" fill="#fff" opacity="0.3">
          <animate attributeName="cy" values="0;-10" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="15" cy="-1" r="2" fill="#fff" opacity="0.2">
          <animate attributeName="cy" values="0;-8" dur="1.8s" begin="0.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0" dur="1.8s" begin="0.5s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Coffee grinder */}
      <g transform="translate(52, -32)">
        <rect x="0" y="0" width="22" height="32" fill={COLORS.metalDark} rx="2" />
        <rect x="2" y="4" width="18" height="12" fill="#0f0f1a" rx="1" />
        <rect x="4" y="18" width="14" height="10" fill="#1f2937" rx="1" />
        <rect x="6" y="20" width="10" height="2" fill={COLORS.neonAmber} opacity="0.6" />
      </g>

      {/* Cups on shelf */}
      <g transform="translate(85, -28)">
        <rect x="0" y="0" width="6" height="8" fill="#e5e7eb" rx="1" />
        <rect x="8" y="0" width="6" height="8" fill="#e5e7eb" rx="1" />
        <rect x="16" y="0" width="6" height="8" fill="#e5e7eb" rx="1" />
        <rect x="4" y="10" width="6" height="8" fill="#e5e7eb" rx="1" />
        <rect x="12" y="10" width="6" height="8" fill="#e5e7eb" rx="1" />
      </g>

      {/* Menu board */}
      <g transform="translate(125, -65)">
        <rect x="0" y="0" width="28" height="65" fill={COLORS.woodDark} rx="2" />
        <rect x="2" y="2" width="24" height="61" fill="#0a0a0f" rx="1" />
        <text x="14" y="14" textAnchor="middle" fontSize="6" fill={COLORS.neonAmber} fontFamily="monospace">MENU</text>
        <line x1="4" y1="18" x2="24" y2="18" stroke={COLORS.neonAmber} strokeWidth="0.5" opacity="0.5" />
        <text x="14" y="28" textAnchor="middle" fontSize="5" fill="#e2e8f0" fontFamily="monospace">COFFEE</text>
        <text x="14" y="38" textAnchor="middle" fontSize="5" fill="#9ca3af" fontFamily="monospace">TEA</text>
        <text x="14" y="48" textAnchor="middle" fontSize="5" fill="#9ca3af" fontFamily="monospace">ENERGY</text>
        <text x="14" y="58" textAnchor="middle" fontSize="5" fill="#9ca3af" fontFamily="monospace">SYRUP</text>
      </g>

      {/* Syrup bottles on counter */}
      <g transform="translate(130, 8)">
        <rect x="0" y="0" width="5" height="12" fill="#dc2626" rx="1" opacity="0.8" />
        <rect x="6" y="0" width="5" height="12" fill="#7c3aed" rx="1" opacity="0.8" />
        <rect x="12" y="0" width="5" height="12" fill="#059669" rx="1" opacity="0.8" />
      </g>
    </g>
  );
}

export function Stool({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Seat */}
      <ellipse cx="0" cy="0" rx="15" ry="7" fill={COLORS.woodDark} />
      <ellipse cx="0" cy="-3" rx="13" ry="5" fill={COLORS.wood} />
      <ellipse cx="0" cy="-3" rx="13" ry="5" fill="url(#glassSheen)" opacity="0.2" />
      {/* Seat rim */}
      <ellipse cx="0" cy="-3" rx="13" ry="5" fill="none" stroke="#3d2a22" strokeWidth="0.5" opacity="0.5" />

      {/* Legs */}
      <line x1="-9" y1="3" x2="-11" y2="38" stroke={COLORS.metalLight} strokeWidth="2.5" />
      <line x1="9" y1="3" x2="11" y2="38" stroke={COLORS.metalLight} strokeWidth="2.5" />
      <line x1="0" y1="3" x2="0" y2="38" stroke={COLORS.metal} strokeWidth="2" opacity="0.5" />

      {/* Foot rest */}
      <ellipse cx="0" cy="22" rx="11" ry="3" fill="none" stroke={COLORS.metalDark} strokeWidth="2.5" />
      <ellipse cx="0" cy="22" rx="11" ry="3" fill="none" stroke={COLORS.metalLight} strokeWidth="1" />

      {/* Base */}
      <ellipse cx="0" cy="38" rx="12" ry="4" fill={COLORS.metalDark} />
      <ellipse cx="0" cy="38" rx="10" ry="3" fill={COLORS.metal} />
    </g>
  );
}

export function Desk({ x, y }: { x: number; y: number }) {
  const screenColor = ['#00ff41', '#ffb000', '#3b82f6', '#ff0080', '#00ff41'][Math.floor(x / 100) % 5];

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <rect x="-5" y="78" width="90" height="10" fill="#000" opacity="0.4" rx="3" />

      {/* Back legs */}
      <rect x="2" y="32" width="5" height="46" fill={COLORS.woodDark} rx="1" />
      <rect x="73" y="32" width="5" height="46" fill={COLORS.woodDark} rx="1" />

      {/* Desk top */}
      <rect x="-2" y="28" width="84" height="8" fill={COLORS.woodLight} rx="1" />
      <rect x="0" y="30" width="80" height="45" fill={COLORS.wood} rx="2" />
      <rect x="3" y="33" width="74" height="39" fill={COLORS.woodDark} rx="1" />
      {/* Drawer */}
      <rect x="55" y="36" width="20" height="12" fill={COLORS.wood} rx="1" />
      <circle cx="65" cy="42" r="1.5" fill="#1f2937" />

      {/* Front legs */}
      <rect x="2" y="75" width="5" height="8" fill={COLORS.woodDark} rx="1" />
      <rect x="73" y="75" width="5" height="8" fill={COLORS.woodDark} rx="1" />

      {/* Monitor - CRT style */}
      <g transform="translate(15, -8)">
        {/* Bezel */}
        <rect x="-2" y="-2" width="54" height="44" fill={COLORS.metalDark} rx="4" />
        <rect x="0" y="0" width="50" height="40" fill="#0a0a0f" rx="3" />
        {/* Screen */}
        <rect x="3" y="3" width="44" height="30" fill="#000" rx="2" />
        <rect x="4" y="4" width="42" height="28" fill={screenColor} opacity="0.15" rx="1">
          <animate attributeName="opacity" values="0.1;0.25;0.1" dur={`${0.8 + (x % 3) * 0.2}s`} repeatCount="indefinite" />
        </rect>
        {/* Code lines */}
        <g fill={screenColor} opacity="0.8">
          <rect x="6" y="7" width="18" height="2" />
          <rect x="6" y="12" width="28" height="2" />
          <rect x="6" y="17" width="22" height="2" />
          <rect x="6" y="22" width="14" height="2" />
          <rect x="6" y="27" width="20" height="2" opacity="0.5" />
        </g>
        {/* Scanline */}
        <rect x="4" y="4" width="42" height="1" fill="#fff" opacity="0.1">
          <animate attributeName="y" values="4;32;4" dur="2s" repeatCount="indefinite" />
        </rect>
        {/* Stand */}
        <rect x="18" y="38" width="14" height="8" fill={COLORS.metal} />
        <rect x="14" y="44" width="22" height="4" fill={COLORS.metalDark} rx="1" />
      </g>

      {/* Keyboard */}
      <rect x="22" y="36" width="32" height="7" fill="#1a1a2e" rx="1" />
      <g fill="#4b5563">
        <rect x="24" y="38" width="3" height="2" />
        <rect x="28" y="38" width="3" height="2" />
        <rect x="32" y="38" width="3" height="2" />
        <rect x="36" y="38" width="3" height="2" />
        <rect x="40" y="38" width="3" height="2" />
        <rect x="44" y="38" width="3" height="2" />
        <rect x="26" y="40.5" width="3" height="1.5" />
        <rect x="30" y="40.5" width="3" height="1.5" />
        <rect x="34" y="40.5" width="3" height="1.5" />
        <rect x="38" y="40.5" width="3" height="1.5" />
        <rect x="42" y="40.5" width="3" height="1.5" />
      </g>

      {/* Mouse */}
      <ellipse cx="60" cy="40" rx="3" ry="4" fill="#1f2937" />
      <ellipse cx="60" cy="40" rx="3" ry="4" fill="url(#glassSheen)" opacity="0.2" />
      <line x1="60" y1="37" x2="60" y2="39" stroke="#4b5563" strokeWidth="0.5" />

      {/* Coffee cup on desk */}
      <g transform="translate(8, 34)">
        <rect x="0" y="0" width="5" height="6" fill="#e5e7eb" rx="1" />
        <path d="M 5 1 Q 6 1 6 3 Q 6 5 5 5" stroke="#e5e7eb" strokeWidth="0.8" fill="none" />
      </g>

      {/* Papers */}
      <rect x="58" y="52" width="10" height="7" fill="#d1d5db" opacity="0.7" rx="0.5" />
      <rect x="59" y="53" width="8" height="1" fill="#9ca3af" />
      <rect x="59" y="55" width="8" height="1" fill="#9ca3af" />
    </g>
  );
}

export function OfficeChair({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Shadow */}
      <ellipse cx="0" cy="22" rx="16" ry="5" fill="#000" opacity="0.4" />

      {/* Wheels */}
      <circle cx="-10" cy="24" r="2" fill="#1f2937" />
      <circle cx="10" cy="24" r="2" fill="#1f2937" />
      <circle cx="0" cy="26" r="2" fill="#1f2937" />

      {/* Base */}
      <path d="M -12 22 L 0 14 L 12 22" stroke="#374151" strokeWidth="3" fill="none" />
      <rect x="-2" y="14" width="4" height="10" fill="#4b5563" />

      {/* Chair back */}
      <rect x="-11" y="-16" width="22" height="28" fill={COLORS.metalDark} rx="4" />
      <rect x="-9" y="-14" width="18" height="24" fill="#374151" rx="3" />
      <rect x="-9" y="-14" width="18" height="24" fill="url(#glassSheen)" rx="3" opacity="0.15" />
      {/* Headrest */}
      <rect x="-8" y="-20" width="16" height="6" fill={COLORS.metalDark} rx="2" />

      {/* Seat */}
      <rect x="-11" y="6" width="22" height="9" fill={COLORS.metalDark} rx="3" />
      <rect x="-9" y="7" width="18" height="7" fill="#4b5563" rx="2" />

      {/* Armrests */}
      <path d="M -14 -8 L -14 4" stroke={COLORS.metalLight} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M -14 4 L -10 4" stroke={COLORS.metalLight} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 14 -8 L 14 4" stroke={COLORS.metalLight} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 14 4 L 10 4" stroke={COLORS.metalLight} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  );
}

export function Mainframe({ x, y }: { x: number; y: number }) {
  const seed = useMemo(() => Math.random(), []);

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Floor glow */}
      <rect x="-130" y="-10" width="260" height="190" fill={COLORS.neonGreen} opacity="0.04" rx="5" />
      
      {/* Cables */}
      <path d="M -100 170 Q -120 200 -80 220" stroke="#1f2937" strokeWidth="4" fill="none" />
      <path d="M -80 170 Q -90 210 -40 230" stroke="#1f2937" strokeWidth="3" fill="none" />
      <path d="M 80 170 Q 100 200 60 220" stroke="#1f2937" strokeWidth="4" fill="none" />
      <path d="M 100 170 Q 120 210 140 230" stroke="#1f2937" strokeWidth="3" fill="none" />

      {/* Rack 1 */}
      <g transform="translate(-115, 0)">
        <rect x="0" y="0" width="110" height="170" fill={COLORS.metalDark} stroke={COLORS.neonGreen} strokeWidth="2" rx="3" />
        {/* Rack frame details */}
        <rect x="5" y="5" width="100" height="160" fill="none" stroke="#374151" strokeWidth="1" rx="1" />
        {Array.from({ length: 8 }).map((_, row) => (
          <g key={row} transform={`translate(10, ${10 + row * 20})`}>
            <rect x="0" y="0" width="90" height="15" fill="#0a0a0f" rx="1" />
            <rect x="0" y="0" width="90" height="15" fill="url(#glassSheen)" rx="1" opacity="0.1" />
            {/* Server vents */}
            <line x1="70" y1="3" x2="82" y2="3" stroke="#1f2937" strokeWidth="1" />
            <line x1="70" y1="6" x2="82" y2="6" stroke="#1f2937" strokeWidth="1" />
            <line x1="70" y1="9" x2="82" y2="9" stroke="#1f2937" strokeWidth="1" />
            <line x1="70" y1="12" x2="82" y2="12" stroke="#1f2937" strokeWidth="1" />
            {Array.from({ length: 5 }).map((__, col) => {
              const isActive = (seed * 1000 + row * 10 + col) % 3 !== 0;
              return (
                <circle
                  key={col}
                  cx={10 + col * 10}
                  cy="7.5"
                  r="2"
                  fill={isActive ? COLORS.neonGreen : '#1f2937'}
                  opacity={isActive ? 0.9 : 0.3}
                >
                  {isActive && (
                    <animate
                      attributeName="opacity"
                      values="0.5;1;0.5"
                      dur={`${0.5 + ((seed * 10 + row + col) % 5) * 0.2}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
              );
            })}
          </g>
        ))}
      </g>

      {/* Rack 2 */}
      <g transform="translate(5, 0)">
        <rect x="0" y="0" width="110" height="170" fill={COLORS.metalDark} stroke={COLORS.neonGreen} strokeWidth="2" rx="3" />
        <rect x="5" y="5" width="100" height="160" fill="none" stroke="#374151" strokeWidth="1" rx="1" />
        {Array.from({ length: 8 }).map((_, row) => (
          <g key={row} transform={`translate(10, ${10 + row * 20})`}>
            <rect x="0" y="0" width="90" height="15" fill="#0a0a0f" rx="1" />
            <rect x="0" y="0" width="90" height="15" fill="url(#glassSheen)" rx="1" opacity="0.1" />
            <line x1="70" y1="3" x2="82" y2="3" stroke="#1f2937" strokeWidth="1" />
            <line x1="70" y1="6" x2="82" y2="6" stroke="#1f2937" strokeWidth="1" />
            <line x1="70" y1="9" x2="82" y2="9" stroke="#1f2937" strokeWidth="1" />
            <line x1="70" y1="12" x2="82" y2="12" stroke="#1f2937" strokeWidth="1" />
            {Array.from({ length: 5 }).map((__, col) => {
              const isActive = (seed * 1000 + row * 10 + col + 50) % 3 !== 0;
              return (
                <circle
                  key={col}
                  cx={10 + col * 10}
                  cy="7.5"
                  r="2"
                  fill={isActive ? COLORS.neonGreen : '#1f2937'}
                  opacity={isActive ? 0.9 : 0.3}
                >
                  {isActive && (
                    <animate
                      attributeName="opacity"
                      values="0.5;1;0.5"
                      dur={`${0.5 + ((seed * 10 + row + col) % 5) * 0.2}s`}
                      repeatCount="indefinite"
                    />
                  )}
                </circle>
              );
            })}
          </g>
        ))}
      </g>

      {/* Terminal */}
      <g transform="translate(-80, -50)">
        <rect x="-2" y="-2" width="164" height="59" fill={COLORS.metalDark} rx="3" />
        <rect x="0" y="0" width="160" height="55" fill="#050508" stroke={COLORS.neonGreen} strokeWidth="2" rx="3" />
        <rect x="5" y="5" width="150" height="45" fill="#000" rx="2" />
        {/* Screen glow */}
        <rect x="5" y="5" width="150" height="45" fill={COLORS.neonGreen} opacity="0.03" rx="2" />
        <text x="80" y="18" textAnchor="middle" fontSize="8" fill={COLORS.neonGreen} fontFamily="monospace" opacity="0.9">SYSTEM ACTIVE</text>
        <text x="10" y="32" fontSize="6" fill={COLORS.neonGreen} fontFamily="monospace" opacity="0.8">CPU: 98.7%</text>
        <text x="80" y="32" fontSize="6" fill={COLORS.neonGreen} fontFamily="monospace" opacity="0.8">MEM: 64.2TB</text>
        <text x="10" y="42" fontSize="6" fill={COLORS.neonGreen} fontFamily="monospace" opacity="0.8">NODES: 24/24</text>
        <text x="140" y="48" fontSize="8" fill={COLORS.neonGreen}>
          <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite">_</animate>
        </text>
      </g>
    </g>
  );
}

// Furniture renderer that picks the right component
export function FurnitureObject({ type, x, y, isOccupied }: { type: string; x: number; y: number; isOccupied?: boolean }) {
  switch (type) {
    case 'couch': return <CouchMain x={x} y={y} />;
    case 'couchMain': return <CouchMain x={x} y={y} />;
    case 'couchSide': return <CouchSide x={x} y={y} />;
    case 'couchLeft': return <CouchSide x={x} y={y} />;
    case 'couchRight': return <CouchMain x={x} y={y} />;
    case 'couchBottom': return <CouchBottom x={x} y={y} />;
    case 'coffeeTable': return <CoffeeTable x={x} y={y} />;
    case 'sideTable': return <SideTable x={x} y={y} />;
    case 'lamp': return <Lamp x={x} y={y} />;
    case 'pod': return <Pod x={x} y={y} isOccupied={isOccupied} />;
    case 'counter': return <Counter x={x} y={y} />;
    case 'stool': return <Stool x={x} y={y} />;
    case 'desk': return <Desk x={x} y={y} />;
    case 'officeChair': return <OfficeChair x={x} y={y} />;
    case 'mainframe': return <Mainframe x={x} y={y} />;
    default: return null;
  }
}

// Draggable collision box component
export function DraggableCollisionBox({
  x,
  y,
  width = 160,
  height = 50,
  onMouseDown,
  isDragging,
}: {
  x: number;
  y: number;
  width?: number;
  height?: number;
  onMouseDown?: (e: React.MouseEvent) => void;
  isDragging?: boolean;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Collision box background */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={isDragging ? 'rgba(0, 255, 65, 0.4)' : 'rgba(0, 255, 65, 0.15)'}
        stroke="#00ff41"
        strokeWidth={isDragging ? 3 : 2}
        strokeDasharray="5 3"
        style={{ cursor: onMouseDown ? 'move' : 'default' }}
        onMouseDown={onMouseDown}
      />
      {/* Corner handles */}
      <circle cx={0} cy={0} r={4} fill="#00ff41" pointerEvents="none" />
      <circle cx={width} cy={0} r={4} fill="#00ff41" pointerEvents="none" />
      <circle cx={0} cy={height} r={4} fill="#00ff41" pointerEvents="none" />
      <circle cx={width} cy={height} r={4} fill="#00ff41" pointerEvents="none" />
      {/* Label */}
      <text
        x={width / 2}
        y={height / 2 + 4}
        textAnchor="middle"
        fontSize="10"
        fill="#00ff41"
        fontFamily="monospace"
        fontWeight="bold"
        pointerEvents="none"
      >
        {isDragging ? 'DRAGGING...' : 'DRAG ME'}
      </text>
      {/* Position indicator */}
      <text
        x={width / 2}
        y={height + 15}
        textAnchor="middle"
        fontSize="8"
        fill="#00ff41"
        fontFamily="monospace"
        opacity={0.8}
        pointerEvents="none"
      >
        x:{Math.round(x)} y:{Math.round(y)}
      </text>
    </g>
  );
}

// Legacy export for compatibility
export function RoomScene() {
  return (
    <g>
      <RoomBackground />
      {FURNITURE_OBJECTS.map(f => (
        <FurnitureObject key={f.id} type={f.type} x={f.x} y={f.y} />
      ))}
    </g>
  );
}

export default RoomScene;
