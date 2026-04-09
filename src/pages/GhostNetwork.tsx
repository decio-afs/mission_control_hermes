import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Terminal, Cpu } from 'lucide-react';
import { useGhostStore } from '../stores/useGhostStore';
import type { GhostNode } from '../stores/useGhostStore';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type AgentState = 'idle' | 'walking' | 'sitting' | 'working' | 'recharging' | 'plugged';
type ActivityZone = 'lounge' | 'coffee' | 'recharge' | 'desk' | 'mainframe';

interface AgentPosition {
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  state: AgentState;
  facing: 'left' | 'right';
  zone?: ActivityZone;
  activityTimer: number;
}

const ROOM_WIDTH = 1000;
const ROOM_HEIGHT = 600;

// Zone positions - adjusted for new layout
const ZONES = {
  lounge: { x: 20, y: 280, w: 200, h: 280 },
  coffee: { x: 240, y: 280, w: 200, h: 280 },
  recharge: { x: 460, y: 280, w: 200, h: 280 },
  desk: { x: 680, y: 280, w: 300, h: 280 },
  mainframe: { x: 750, y: 50, w: 230, h: 200 },
};

// Window/cityscape area
const WINDOW = { x: 200, y: 20, w: 520, h: 240 };

// Mainframe plug positions
const MAINFRAME_PLUGS = [
  { x: 760, y: 180 }, { x: 780, y: 180 }, { x: 800, y: 180 },
  { x: 930, y: 180 }, { x: 950, y: 180 }, { x: 970, y: 180 },
];

// Mock agents
const MOCK_AGENTS: GhostNode[] = [
  { id: 'core-1', name: 'Kate', type: 'core', val: 6, status: 'active', tasks_running: 5, queue_depth: 2, has_active_work: true, last_active: new Date() },
  { id: 'agent-1', name: 'Silicon-Sage', type: 'runner', model: 'cyan', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'agent-2', name: 'The-Eraser', type: 'runner', model: 'purple', val: 4, status: 'active', tasks_running: 2, queue_depth: 1, has_active_work: true },
  { id: 'agent-3', name: 'Code-Yakuza', type: 'fixer', model: 'cyan', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'agent-4', name: 'Ghost-in-Shell', type: 'runner', model: 'haiku', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'agent-5', name: 'The-Debugger', type: 'fixer', model: 'sonnet', val: 4, status: 'active', tasks_running: 3, queue_depth: 0, has_active_work: true },
  { id: 'agent-6', name: 'Data-Miner', type: 'runner', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'agent-7', name: 'The-Splicer', type: 'runner', model: 'cyan', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'agent-8', name: 'Test-Drone', type: 'runner', val: 4, status: 'offline', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'agent-9', name: 'Blackwatch', type: 'runner', model: 'sonnet', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
  { id: 'agent-10', name: 'VJ-Ripper', type: 'runner', val: 4, status: 'active', tasks_running: 1, queue_depth: 2, has_active_work: true },
  { id: 'agent-11', name: 'The-Architect', type: 'fixer', model: 'purple', val: 4, status: 'idle', tasks_running: 0, queue_depth: 0, has_active_work: false },
];

// ============================================================================
// NEON SIGNS
// ============================================================================

function NeonSign({ x, y, text, color = '#00ff41', width = 80 }: { x: number; y: number; text: string; color?: string; width?: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Sign background */}
      <rect x="-5" y="-20" width={width} height="28" fill="#1a1a2e" stroke={color} strokeWidth="2" rx="2" />
      {/* Glow effect */}
      <rect x="-3" y="-18" width={width - 4} height="24" fill={color} opacity="0.1">
        <animate attributeName="opacity" values="0.1;0.3;0.1" dur="2s" repeatCount="indefinite" />
      </rect>
      {/* Text */}
      <text x={width / 2 - 5} y="-2" textAnchor="middle" fontSize="12" fontFamily="monospace" fontWeight="bold" fill={color} style={{ filter: `drop-shadow(0 0 5px ${color})` }}>
        {text}
      </text>
    </g>
  );
}

// ============================================================================
// PIXEL AGENT WITH DIFFERENT POSES
// ============================================================================

function PixelAgent({ node, position, isSelected, onClick }: { 
  node: GhostNode; 
  position: AgentPosition;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = node.type === 'core' ? '#f64e6e' : 
                node.type === 'squad' ? '#38bdf8' :
                node.model === 'sonnet' ? '#a855f7' :
                node.model === 'haiku' ? '#10b981' : '#64748b';
  
  const isActive = node.status === 'active';
  const isOffline = !node.status || node.status === 'offline';
  const finalColor = isOffline ? '#4b5563' : color;
  
  // Walking bounce
  const bounceY = position.state === 'walking' ? Math.sin(Date.now() / 80) * 2 : 0;
  
  return (
    <g 
      transform={`translate(${position.x}, ${position.y + bounceY})`}
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
        <circle cx="0" cy="-10" r="18" fill={color} opacity="0.15">
          <animate attributeName="r" values="18;22;18" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      
      {/* Agent sprite based on state */}
      {position.state === 'sitting' || position.state === 'working' ? (
        // Sitting pose
        <g>
          {/* Chair back */}
          <rect x="-12" y="-25" width="24" height="20" fill="#374151" rx="2" />
          {/* Body */}
          <rect x="-10" y="-20" width="20" height="18" fill={finalColor} rx="2" />
          {/* Head */}
          <rect x="-8" y="-32" width="16" height="14" fill={finalColor} rx="2" />
          {/* Eye */}
          <rect x={position.facing === 'right' ? "2" : "-6"} y="-28" width="4" height="4" fill={isOffline ? '#1f2937' : '#fff'} />
          {/* Arms on desk/chair */}
          <rect x="-14" y="-12" width="6" height="12" fill={finalColor} opacity="0.7" />
          <rect x="8" y="-12" width="6" height="12" fill={finalColor} opacity="0.7" />
          {/* Legs sitting */}
          <rect x="-8" y="-2" width="6" height="10" fill={finalColor} opacity="0.8" />
          <rect x="2" y="-2" width="6" height="10" fill={finalColor} opacity="0.8" />
        </g>
      ) : position.state === 'recharging' ? (
        // In pod pose
        <g>
          <rect x="-10" y="-35" width="20" height="30" fill={finalColor} rx="2" />
          <rect x="-8" y="-32" width="16" height="12" fill={finalColor} opacity="0.9" rx="1" />
          <rect x={position.facing === 'right' ? "2" : "-6"} y="-28" width="3" height="3" fill="#00ff41" />
          {/* Energy effect */}
          <rect x="-12" y="-5" width="24" height="4" fill="#00ff41" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="0.5s" repeatCount="indefinite" />
          </rect>
        </g>
      ) : (
        // Standing/Walking pose
        <g>
          {/* Head */}
          <rect x="-8" y="-32" width="16" height="14" fill={finalColor} rx="2" />
          {/* Eye */}
          <rect x={position.facing === 'right' ? "2" : "-6"} y="-28" width="4" height="4" fill={isOffline ? '#1f2937' : '#fff'} />
          {/* Body */}
          <rect x="-10" y="-18" width="20" height="20" fill={finalColor} rx="2" />
          {/* Arms */}
          <rect x="-16" y="-16" width="5" height="14" fill={finalColor} opacity="0.8" rx="1" />
          <rect x="11" y="-16" width="5" height="14" fill={finalColor} opacity="0.8" rx="1" />
          {/* Legs */}
          <rect x="-9" y="2" width="7" height="16" fill={finalColor} opacity="0.7" rx="1" />
          <rect x="2" y="2" width="7" height="16" fill={finalColor} opacity="0.7" rx="1" />
        </g>
      )}
      
      {/* Working indicator */}
      {position.state === 'working' && (
        <g transform="translate(0, -45)">
          <rect x="-8" y="0" width="16" height="6" fill="#00ff41" rx="1">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" />
          </rect>
        </g>
      )}
      
      {/* Name label */}
      <text y="28" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#e5e7eb" style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
        {node.name.length > 12 ? node.name.slice(0, 10) + '..' : node.name}
      </text>
      
      {/* State label */}
      <text y="38" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#6b7280" style={{ pointerEvents: 'none' }}>
        {position.state.toUpperCase()}
      </text>
    </g>
  );
}

// ============================================================================
// DETAILED ROOM BACKGROUND
// ============================================================================

function RoomBackground() {
  return (
    <g>
      <defs>
        {/* Floor pattern */}
        <pattern id="floorGrid" width="30" height="30" patternUnits="userSpaceOnUse">
          <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1f2937" strokeWidth="0.5"/>
        </pattern>
        
        {/* Wall gradient */}
        <linearGradient id="wallGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#111827" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
        
        {/* Floor gradient */}
        <linearGradient id="floorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        
        {/* Neon glow filter */}
        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Mainframe glow */}
        <linearGradient id="mainframeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00ff41" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#00ff41" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00ff41" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      
      {/* Wall */}
      <rect x="0" y="0" width={ROOM_WIDTH} height={270} fill="url(#wallGradient)" />
      
      {/* Floor */}
      <rect x="0" y={270} width={ROOM_WIDTH} height={330} fill="url(#floorGradient)" />
      <rect x="0" y={270} width={ROOM_WIDTH} height={330} fill="url(#floorGrid)" opacity="0.3" />
      
      {/* Floor line */}
      <line x1="0" y1="270" x2={ROOM_WIDTH} y2="270" stroke="#374151" strokeWidth="2" />
      
      {/* CITYSCAPE WINDOW */}
      <g transform={`translate(${WINDOW.x}, ${WINDOW.y})`}>
        {/* Window frame */}
        <rect x="-5" y="-5" width={WINDOW.w + 10} height={WINDOW.h + 10} fill="#0f172a" stroke="#374151" strokeWidth="4" />
        
        {/* Night sky gradient */}
        <defs>
          <linearGradient id="nightSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={WINDOW.w} height={WINDOW.h} fill="url(#nightSky)" />
        
        {/* Distant city buildings */}
        <g opacity="0.6">
          <rect x="20" y="120" width="40" height="120" fill="#1e293b" />
          <rect x="70" y="80" width="30" height="160" fill="#0f172a" />
          <rect x="110" y="140" width="50" height="100" fill="#1e293b" />
          <rect x="180" y="60" width="35" height="180" fill="#0f172a" />
          <rect x="230" y="100" width="45" height="140" fill="#1e293b" />
          <rect x="290" y="130" width="40" height="110" fill="#0f172a" />
          <rect x="350" y="90" width="50" height="150" fill="#1e293b" />
          <rect x="420" y="140" width="30" height="100" fill="#0f172a" />
          <rect x="470" y="70" width="40" height="170" fill="#1e293b" />
        </g>
        
        {/* Building windows with lights */}
        <g fill="#fbbf24" opacity="0.6">
          <rect x="85" y="90" width="4" height="6" />
          <rect x="95" y="100" width="4" height="6" />
          <rect x="85" y="120" width="4" height="6" />
          <rect x="195" y="80" width="4" height="6" />
          <rect x="205" y="110" width="4" height="6" />
          <rect x="245" y="120" width="4" height="6" />
          <rect x="365" y="110" width="4" height="6" />
          <rect x="385" y="140" width="4" height="6" />
        </g>
        
        {/* Neon signs in city */}
        <rect x="100" y="70" width="4" height="40" fill="#ec4899" opacity="0.7">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite" />
        </rect>
        <rect x="200" y="50" width="4" height="30" fill="#00ff41" opacity="0.7">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.5s" repeatCount="indefinite" />
        </rect>
        <rect x="400" y="80" width="4" height="50" fill="#3b82f6" opacity="0.7">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2.5s" repeatCount="indefinite" />
        </rect>
        
        {/* Window grid lines */}
        <line x1={WINDOW.w / 2} y1="0" x2={WINDOW.w / 2} y2={WINDOW.h} stroke="#374151" strokeWidth="2" />
        <line x1="0" y1={WINDOW.h / 2} x2={WINDOW.w} y2={WINDOW.h / 2} stroke="#374151" strokeWidth="2" />
      </g>
      
      {/* LOUNGE AREA */}
      <g transform={`translate(${ZONES.lounge.x}, ${ZONES.lounge.y})`}>
        {/* Zone floor */}
        <rect x="0" y="0" width={ZONES.lounge.w} height={ZONES.lounge.h} fill="#1f2937" opacity="0.3" />
        
        {/* CHILL Neon Sign */}
        <g transform="translate(100, -20)">
          <rect x="-45" y="-25" width="90" height="35" fill="#1e1b4b" stroke="#ec4899" strokeWidth="3" rx="4" filter="url(#neonGlow)" />
          <text x="0" y="-5" textAnchor="middle" fontSize="16" fontFamily="monospace" fontWeight="bold" fill="#ec4899" style={{ filter: 'drop-shadow(0 0 8px #ec4899)' }}>
            CHILL
          </text>
        </g>
        
        {/* String lights */}
        <path d="M 10,-50 Q 100,-70 190,-50" fill="none" stroke="#374151" strokeWidth="2" />
        {[20, 50, 80, 110, 140, 170].map((x, i) => (
          <g key={i} transform={`translate(${x}, ${-55 + Math.sin(i) * 5})`}>
            <circle r="3" fill="#fbbf24">
              <animate attributeName="opacity" values="0.6;1;0.6" dur={`${1 + i * 0.2}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
        
        {/* Couch */}
        <rect x="20" y="80" width="80" height="40" fill="#4c1d95" rx="5" />
        <rect x="20" y="70" width="80" height="20" fill="#5b21b6" rx="5" />
        <rect x="25" y="85" width="15" height="15" fill="#7c3aed" rx="2" />
        <rect x="80" y="85" width="15" height="15" fill="#7c3aed" rx="2" />
        {/* Coffee table */}
        <rect x="30" y="140" width="60" height="35" fill="#374151" rx="3" />
        <rect x="35" y="145" width="20" height="8" fill="#6b7280" rx="1" />
        {/* Mug */}
        <rect x="75" y="150" width="8" height="10" fill="#f3f4f6" rx="1" />
        
        {/* Poster */}
        <rect x="130" y="20" width="50" height="70" fill="#1f2937" stroke="#374151" strokeWidth="2" />
        <text x="155" y="55" textAnchor="middle" fontSize="8" fill="#ec4899" fontFamily="monospace">HACKER</text>
        <text x="155" y="70" textAnchor="middle" fontSize="6" fill="#6b7280" fontFamily="monospace">WANTED</text>
        
        {/* Lamp */}
        <rect x="150" y="100" width="8" height="60" fill="#4b5563" />
        <path d="M 140 100 L 168 100 L 162 80 L 146 80 Z" fill="#374151" />
        <ellipse cx="154" cy="110" rx="15" ry="8" fill="#fbbf24" opacity="0.3">
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" />
        </ellipse>
      </g>
      
      {/* CAFÉ AREA */}
      <g transform={`translate(${ZONES.coffee.x}, ${ZONES.coffee.y})`}>
        <rect x="0" y="0" width={ZONES.coffee.w} height={ZONES.coffee.h} fill="#1f2937" opacity="0.3" />
        
        {/* CAFÉ Neon Sign */}
        <g transform="translate(100, -20)">
          <rect x="-40" y="-22" width="80" height="30" fill="#451a03" stroke="#f59e0b" strokeWidth="3" rx="4" filter="url(#neonGlow)" />
          <text x="0" y="-3" textAnchor="middle" fontSize="14" fontFamily="monospace" fontWeight="bold" fill="#f59e0b" style={{ filter: 'drop-shadow(0 0 8px #f59e0b)' }}>
            CAFÉ
          </text>
        </g>
        
        {/* Coffee counter */}
        <rect x="20" y="60" width="160" height="50" fill="#78350f" rx="3" />
        <rect x="20" y="60" width="160" height="10" fill="#92400e" rx="3" />
        
        {/* Coffee machines */}
        <rect x="30" y="30" width="40" height="35" fill="#374151" rx="2" />
        <rect x="35" y="40" width="30" height="15" fill="#1f2937" rx="1" />
        <rect x="45" y="50" width="10" height="8" fill="#000" rx="1" />
        {/* Steam */}
        <circle cx="50" cy="25" r="3" fill="#fff" opacity="0.3">
          <animate attributeName="cy" values="25;15" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0" dur="2s" repeatCount="indefinite" />
        </circle>
        
        <rect x="80" y="35" width="35" height="30" fill="#374151" rx="2" />
        <rect x="85" y="45" width="25" height="12" fill="#1f2937" rx="1" />
        <circle cx="95" cy="55" r="4" fill="#00ff41" opacity="0.5" />
        
        {/* Menu board */}
        <rect x="130" y="20" width="40" height="50" fill="#1f2937" stroke="#78350f" strokeWidth="2" />
        <text x="150" y="38" textAnchor="middle" fontSize="6" fill="#f59e0b" fontFamily="monospace">COFFEE</text>
        <text x="150" y="50" textAnchor="middle" fontSize="6" fill="#9ca3af" fontFamily="monospace">TEA</text>
        <text x="150" y="62" textAnchor="middle" fontSize="6" fill="#9ca3af" fontFamily="monospace">ENERGY</text>
        
        {/* Stools */}
        {[40, 90, 140].map((x, i) => (
          <g key={i} transform={`translate(${x}, 120)`}>
            <rect x="-8" y="0" width="16" height="25" fill="#4b5563" rx="2" />
            <rect x="-10" y="-3" width="20" height="6" fill="#6b7280" rx="3" />
          </g>
        ))}
      </g>
      
      {/* RECHARGE BAY */}
      <g transform={`translate(${ZONES.recharge.x}, ${ZONES.recharge.y})`}>
        <rect x="0" y="0" width={ZONES.recharge.w} height={ZONES.recharge.h} fill="#1f2937" opacity="0.3" />
        
        {/* RECHARGE BAY Neon Sign */}
        <g transform="translate(100, -20)">
          <rect x="-65" y="-22" width="130" height="30" fill="#0f172a" stroke="#00ff41" strokeWidth="3" rx="4" filter="url(#neonGlow)" />
          <text x="0" y="-3" textAnchor="middle" fontSize="12" fontFamily="monospace" fontWeight="bold" fill="#00ff41" style={{ filter: 'drop-shadow(0 0 8px #00ff41)' }}>
            RECHARGE BAY
          </text>
        </g>
        
        {/* Recharge pods */}
        {[30, 100, 160].map((x, i) => (
          <g key={i} transform={`translate(${x}, 60)`}>
            {/* Pod base */}
            <rect x="0" y="0" width="35" height="120" fill="#1e293b" stroke="#00ff41" strokeWidth="2" rx="17" />
            {/* Glass effect */}
            <rect x="3" y="10" width="29" height="100" fill={i === 1 ? '#0f766e' : '#0f172a'} opacity="0.6" rx="14" />
            {/* Lightning bolt */}
            <path d="M 17 30 L 12 50 L 20 50 L 15 70 L 25 45 L 17 45 Z" fill={i === 1 ? '#00ff41' : '#065f46'} stroke={i === 1 ? '#00ff41' : 'none'} strokeWidth="1">
              {i === 1 && <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />}
            </path>
            {/* Status light */}
            <circle cx="17" cy="105" r="4" fill={i === 1 ? '#00ff41' : '#374151'}>
              {i === 1 && <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" />}
            </circle>
          </g>
        ))}
        
        {/* Cables from pods */}
        <path d="M 50 180 Q 50 220 100 250" fill="none" stroke="#374151" strokeWidth="3" />
        <path d="M 120 180 Q 120 200 100 250" fill="none" stroke="#374151" strokeWidth="3" />
        <path d="M 180 180 Q 180 220 150 250" fill="none" stroke="#374151" strokeWidth="3" />
      </g>
      
      {/* WORKSTATIONS */}
      <g transform={`translate(${ZONES.desk.x}, ${ZONES.desk.y})`}>
        <rect x="0" y="0" width={ZONES.desk.w} height={ZONES.desk.h} fill="#1f2937" opacity="0.3" />
        
        {/* Zone label */}
        <text x="150" y="-10" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="monospace">WORKSTATIONS</text>
        
        {/* Desks and computers */}
        {[
          { x: 20, y: 40, screenColor: '#00ff41' },
          { x: 120, y: 40, screenColor: '#f59e0b' },
          { x: 210, y: 40, screenColor: '#3b82f6' },
          { x: 20, y: 140, screenColor: '#ec4899' },
          { x: 120, y: 140, screenColor: '#00ff41' },
        ].map((desk, i) => (
          <g key={i} transform={`translate(${desk.x}, ${desk.y})`}>
            {/* Desk */}
            <rect x="0" y="30" width="80" height="40" fill="#4b5563" rx="2" />
            <rect x="0" y="30" width="80" height="8" fill="#6b7280" rx="2" />
            {/* Monitor */}
            <rect x="15" y="0" width="50" height="35" fill="#1f2937" stroke="#374151" strokeWidth="2" rx="2" />
            <rect x="18" y="5" width="44" height="25" fill="#000" rx="1" />
            {/* Screen glow */}
            <rect x="20" y="8" width="40" height="20" fill={desk.screenColor} opacity="0.3">
              <animate attributeName="opacity" values="0.2;0.5;0.2" dur={`${0.5 + i * 0.1}s`} repeatCount="indefinite" />
            </rect>
            {/* Code lines on screen */}
            <rect x="22" y="10" width="25" height="2" fill={desk.screenColor} opacity="0.8" />
            <rect x="22" y="15" width="30" height="2" fill={desk.screenColor} opacity="0.6" />
            <rect x="22" y="20" width="20" height="2" fill={desk.screenColor} opacity="0.7" />
            {/* Chair */}
            <rect x="25" y="75" width="30" height="35" fill="#374151" rx="3" />
            <rect x="25" y="75" width="30" height="25" fill="#1f2937" rx="3" />
            {/* Keyboard */}
            <rect x="20" y="38" width="40" height="6" fill="#1f2937" rx="1" />
          </g>
        ))}
      </g>
      
      {/* MAINFRAME */}
      <g transform={`translate(${ZONES.mainframe.x}, ${ZONES.mainframe.y})`}>
        {/* Background glow */}
        <rect x="-10" y="-10" width={ZONES.mainframe.w + 20} height={ZONES.mainframe.h + 20} fill="url(#mainframeGlow)" opacity="0.5" />
        
        {/* Server racks */}
        <rect x="0" y="0" width={100} height={180} fill="#0f172a" stroke="#00ff41" strokeWidth="2" rx="2" />
        <rect x="130" y="0" width="100" height="180" fill="#0f172a" stroke="#00ff41" strokeWidth="2" rx="2" />
        
        {/* MAINFRAME Neon */}
        <g transform="translate(115, -25)">
          <rect x="-50" y="-20" width="100" height="28" fill="#000" stroke="#00ff41" strokeWidth="2" rx="2" filter="url(#neonGlow)" />
          <text x="0" y="-2" textAnchor="middle" fontSize="11" fontFamily="monospace" fontWeight="bold" fill="#00ff41" style={{ filter: 'drop-shadow(0 0 5px #00ff41)' }}>
            MAINFRAME
          </text>
        </g>
        
        {/* Server lights */}
        {Array.from({ length: 8 }).map((_, row) => (
          <g key={row}>
            {[15, 145].map((x, i) => (
              <g key={i}>
                {Array.from({ length: 4 }).map((_, col) => (
                  <circle 
                    key={col} 
                    cx={x + col * 18} 
                    cy={20 + row * 20} 
                    r="4" 
                    fill="#00ff41"
                    opacity={0.3 + (Math.sin(row + col + i) + 1) * 0.35}
                  >
                    <animate 
                      attributeName="opacity" 
                      values={`${0.3 + Math.random() * 0.4};1;${0.3 + Math.random() * 0.4}`} 
                      dur={`${0.3 + Math.random() * 0.5}s`} 
                      repeatCount="indefinite" 
                    />
                  </circle>
                ))}
              </g>
            ))}
          </g>
        ))}
        
        {/* Matrix code display */}
        <rect x="30" y="200" width="170" height="50" fill="#000" stroke="#00ff41" strokeWidth="1" rx="2" />
        <text x="115" y="220" textAnchor="middle" fontSize="8" fill="#00ff41" fontFamily="monospace" opacity="0.8">
          SYSTEM ACTIVE
        </text>
        <text x="115" y="235" textAnchor="middle" fontSize="6" fill="#00ff41" fontFamily="monospace" opacity="0.6">
          PROCESSING: 99.9%
        </text>
        
        {/* Digital rain */}
        <g opacity="0.15">
          {Array.from({ length: 15 }).map((_, i) => (
            <text 
              key={i}
              x={35 + (i % 5) * 30}
              y={210 + Math.floor(i / 5) * 12}
              fill="#00ff41" 
              fontSize="8" 
              fontFamily="monospace"
            >
              {String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))}
            </text>
          ))}
        </g>
      </g>
      
      {/* Floor cables */}
      <g stroke="#374151" strokeWidth="2" fill="none" opacity="0.5">
        <path d="M 250 300 Q 300 350 400 320" />
        <path d="M 450 350 Q 500 400 600 380" />
        <path d="M 700 400 Q 750 450 800 420" />
        <path d="M 350 450 Q 450 480 550 460" />
      </g>
      
      {/* Footer labels */}
      <text x="100" y={ROOM_HEIGHT - 15} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="monospace">1: LOUNGE</text>
      <text x="330" y={ROOM_HEIGHT - 15} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="monospace">2: CAFÉ</text>
      <text x="560" y={ROOM_HEIGHT - 15} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="monospace">3: RECHARGE</text>
      <text x="830" y={ROOM_HEIGHT - 15} textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="monospace">4: WORKSTATIONS</text>
    </g>
  );
}

// ============================================================================
// RETRO TERMINAL POPUP
// ============================================================================

function RetroTerminalPopup({ node, onClose }: { node: GhostNode; onClose: () => void; }) {
  const color = node.type === 'core' ? '#f64e6e' : 
                node.type === 'squad' ? '#38bdf8' :
                node.model === 'sonnet' ? '#a855f7' :
                node.model === 'haiku' ? '#10b981' : '#94a3b8';
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border-2 border-[#00ff41] w-full max-w-md relative overflow-hidden shadow-[0_0_50px_rgba(0,255,65,0.4)]">
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff41 2px, #00ff41 4px)'
        }} />
        
        {/* Terminal header */}
        <div className="bg-[#00ff41] text-black p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            <span className="font-mono font-bold text-sm">AGENT_PROFILE.exe</span>
          </div>
          <button onClick={onClose} className="hover:bg-black/20 px-2 font-mono font-bold">[X]</button>
        </div>
        
        {/* Terminal content */}
        <div className="p-6 font-mono text-[#00ff41]">
          {/* ASCII Art header */}
          <pre className="text-xs text-[#00ff41]/50 mb-4 overflow-hidden">
{`  _____   _____    ___  _______
 /  _  \\ |  _  \\  /   ||__   __|
 |  |_|  || |_|  ||  _ |   | |
 |   _   ||    _/ | |_| |   | |
 |__| |__||_|\\_\\  |_____|   |_|`}
          </pre>
          
          <div className="space-y-4">
            {/* Agent ID */}
            <div className="border border-[#00ff41]/30 p-3">
              <div className="text-xs text-[#00ff41]/50 mb-1">AGENT_IDENTITY</div>
              <div className="text-xl font-bold" style={{ color }}>{node.name}</div>
              <div className="text-xs mt-1">TYPE: {node.type.toUpperCase()}</div>
              {node.model && <div className="text-xs">MODEL: {node.model.toUpperCase()}</div>}
            </div>
            
            {/* Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#00ff41]/30 p-3">
                <div className="text-xs text-[#00ff41]/50 mb-1">STATUS</div>
                <div className={`text-sm font-bold ${
                  node.status === 'active' ? 'text-emerald-400' :
                  node.status === 'idle' ? 'text-amber-400' : 'text-gray-400'
                }`}>
                  {node.status?.toUpperCase() || 'OFFLINE'}
                </div>
              </div>
              <div className="border border-[#00ff41]/30 p-3">
                <div className="text-xs text-[#00ff41]/50 mb-1">LAST_ACTIVE</div>
                <div className="text-sm">
                  {node.last_active
                    ? formatDistanceToNow(new Date(node.last_active), { addSuffix: true })
                    : 'UNKNOWN'}
                </div>
              </div>
            </div>
            
            {/* Tasks */}
            <div className="border border-[#00ff41]/30 p-3">
              <div className="text-xs text-[#00ff41]/50 mb-2">WORKLOAD_METRICS</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>ACTIVE_TASKS:</span>
                  <span className={node.has_active_work ? 'text-emerald-400' : ''}>{node.tasks_running || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>QUEUE_DEPTH:</span>
                  <span className="text-amber-400">{node.queue_depth || 0}</span>
                </div>
                <div className="w-full h-2 bg-[#00ff41]/20 mt-2">
                  <div 
                    className="h-full bg-[#00ff41] transition-all"
                    style={{ width: `${Math.min(100, ((node.queue_depth || 0) + (node.tasks_running || 0)) * 10)}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button className="flex-1 border border-[#00ff41] text-[#00ff41] py-2 text-sm hover:bg-[#00ff41] hover:text-black transition-colors font-mono">
                [EXECUTE_TASK]
              </button>
              {node.type !== 'core' && (
                <button className="flex-1 border border-red-500 text-red-500 py-2 text-sm hover:bg-red-500 hover:text-black transition-colors font-mono">
                  [TERMINATE]
                </button>
              )}
            </div>
          </div>
          
          {/* Blinking cursor */}
          <div className="mt-4 text-sm">{'>'}<span className="animate-pulse">_</span></div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function GhostNetwork() {
  const { nodes, fetchTopology } = useGhostStore();
  const [selectedNode, setSelectedNode] = useState<GhostNode | null>(null);
  const [agentPositions, setAgentPositions] = useState<Map<string, AgentPosition>>(new Map());
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const displayNodes = nodes.length > 0 ? nodes : MOCK_AGENTS;
  
  // Initialize agent positions on mount
  useEffect(() => {
    if (agentPositions.size > 0) return;
    const initial = new Map<string, AgentPosition>();
    const nodesToInit = MOCK_AGENTS; // Always use mock agents for initial positions
    nodesToInit.forEach((node, i) => {
      const zoneNames: ActivityZone[] = ['lounge', 'coffee', 'desk', 'recharge'];
      const zone = zoneNames[i % 4];
      const zoneData = ZONES[zone];
      initial.set(node.id, {
        x: zoneData.x + 40 + (i % 3) * 50,
        y: zoneData.y + 60 + Math.floor(i / 4) * 50,
        state: 'idle',
        facing: 'right',
        zone,
        activityTimer: i * 10,
      });
    });
    setAgentPositions(initial);
  }, []); // Empty dependency array - run once on mount
  
  // Animation loop
  useEffect(() => {
    // Don't start until positions are initialized
    if (agentPositions.size === 0) return;
    
    const SPEED = 0.6;
    const ACTIVITY_DURATION = 180;
    
    const animate = () => {
      setAgentPositions(prev => {
        const next = new Map(prev);
        
        // Get current nodes to animate
        const currentNodes = nodes.length > 0 ? nodes : MOCK_AGENTS;
        
        currentNodes.forEach((node, index) => {
          let pos = next.get(node.id);
          
          // Initialize position if not exists
          if (!pos) {
            const zoneNames: ActivityZone[] = ['lounge', 'coffee', 'desk', 'recharge'];
            const zone = zoneNames[index % 4];
            const zoneData = ZONES[zone];
            pos = {
              x: zoneData.x + 40 + (index % 3) * 50,
              y: zoneData.y + 60 + Math.floor(index / 4) * 50,
              state: 'idle',
              facing: 'right',
              zone,
              activityTimer: index * 10,
            };
            next.set(node.id, pos);
          }
          
          // Create a new position object to avoid mutation
          let newPos = { ...pos };
          const isActive = node.status === 'active';
          const isCore = node.type === 'core';
          
          if (isCore) {
            newPos.x = ZONES.mainframe.x + ZONES.mainframe.w / 2;
            newPos.y = ZONES.mainframe.y + 120;
            newPos.state = 'plugged';
            next.set(node.id, newPos);
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
              
              if (dist < 5) {
                newPos.state = 'plugged';
                newPos.x = targetX;
                newPos.y = targetY;
              } else {
                newPos.x = pos.x + (dx / dist) * SPEED * 1.5;
                newPos.y = pos.y + (dy / dist) * SPEED * 1.5;
                newPos.state = 'walking';
                newPos.facing = dx > 0 ? 'right' : 'left';
              }
              next.set(node.id, newPos);
            }
            return;
          }
          
          if (!isActive && pos.state === 'plugged') {
            const zones: ActivityZone[] = ['lounge', 'coffee', 'desk', 'recharge'];
            const zone = zones[Math.floor(Math.random() * zones.length)];
            const z = ZONES[zone];
            if (z) {
              newPos.targetX = z.x + 30 + Math.random() * (z.w - 60);
              newPos.targetY = z.y + 40 + Math.random() * (z.h - 80);
              newPos.state = 'walking';
              newPos.zone = zone;
              newPos.activityTimer = 0;
              next.set(node.id, newPos);
            }
            return;
          }
          
          if (pos.state === 'idle' || pos.state === 'sitting' || pos.state === 'working' || pos.state === 'recharging') {
            newPos.activityTimer = (pos.activityTimer || 0) + 1;
            if (newPos.activityTimer > ACTIVITY_DURATION) {
              const roll = Math.random();
              let newState: AgentState = 'idle';
              
              if (roll < 0.25) {
                newState = 'walking';
                const zones: ActivityZone[] = ['lounge', 'coffee', 'desk', 'recharge'];
                const zone = zones[Math.floor(Math.random() * zones.length)];
                const z = ZONES[zone];
                if (z) {
                  newPos.targetX = z.x + 30 + Math.random() * (z.w - 60);
                  newPos.targetY = z.y + 40 + Math.random() * (z.h - 80);
                  newPos.state = newState;
                  newPos.zone = zone;
                  newPos.activityTimer = 0;
                }
              } else if (roll < 0.5) {
                newPos.state = 'sitting';
                newPos.activityTimer = 0;
              } else if (roll < 0.75) {
                newPos.state = 'working';
                newPos.activityTimer = 0;
              } else {
                newPos.state = 'recharging';
                newPos.activityTimer = 0;
              }
              
              next.set(node.id, newPos);
            } else {
              next.set(node.id, newPos);
            }
            return;
          }
          
          if (pos.state === 'walking' && pos.targetX !== undefined && pos.targetY !== undefined) {
            const dx = pos.targetX - pos.x;
            const dy = pos.targetY - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 3) {
              newPos.state = 'idle';
              newPos.targetX = undefined;
              newPos.targetY = undefined;
            } else {
              newPos.x = pos.x + (dx / dist) * SPEED;
              newPos.y = pos.y + (dy / dist) * SPEED;
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
  }, [nodes.length, agentPositions.size]);
  
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
          <button onClick={() => fetchTopology()} className="rounded bg-bg-card border border-[#00ff41] p-2 hover:bg-[#00ff41]/10 text-[#00ff41] transition-colors font-mono text-xs" title="Refresh">
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
            <Cpu className="w-3 h-3 text-[#00ff41]" />
            <span className="text-[#00ff41] font-mono text-xs">{displayNodes.filter(n => n.status === 'active').length} ACTIVE</span>
          </div>
        </div>
        
        {/* Room SVG */}
        <svg width={ROOM_WIDTH} height={ROOM_HEIGHT} viewBox={`0 0 ${ROOM_WIDTH} ${ROOM_HEIGHT}`} className="min-w-[1000px] min-h-[600px]" style={{ fontFamily: 'monospace' }}>
          <RoomBackground />
          
          {/* Cables for plugged agents */}
          {displayNodes.map(node => {
            const pos = agentPositions.get(node.id);
            if (!pos || pos.state !== 'plugged') return null;
            const plugIndex = Math.abs(parseInt(node.id.slice(-2) || '0', 16)) % MAINFRAME_PLUGS.length;
            const plug = MAINFRAME_PLUGS[plugIndex];
            if (!plug) return null;
            return (
              <g key={`cable-${node.id}`}>
                <line x1={pos.x + 10} y1={pos.y - 10} x2={plug.x} y2={plug.y} stroke="#00ff41" strokeWidth="2" opacity="0.6" />
                <circle r="3" fill="#00ff41">
                  <animateMotion dur="0.8s" repeatCount="indefinite" path={`M${pos.x + 10},${pos.y - 10} L${plug.x},${plug.y}`} />
                </circle>
              </g>
            );
          })}
          
          {/* Agents */}
          {displayNodes.map(node => {
            const pos = agentPositions.get(node.id);
            if (!pos) return null;
            return <PixelAgent key={node.id} node={node} position={pos} isSelected={selectedNode?.id === node.id} onClick={() => handleNodeClick(node)} />;
          })}
        </svg>
      </div>
      
      {/* Terminal Popup */}
      {selectedNode && <RetroTerminalPopup node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </div>
  );
}
