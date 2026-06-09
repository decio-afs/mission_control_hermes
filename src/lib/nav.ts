// Single source of truth for the primary navigation modules.
// Consumed by Layout.tsx (sidebar) and CommandPalette.tsx (⌘K jump-to).
export interface NavModule {
  id: string;
  path: string;
  label: string;
  short: string;
  num: string;
}

export const MODULES: NavModule[] = [
  { id: 'command',      path: '/command',      label: 'Hermes Command',  short: 'Command',   num: '00' },
  { id: 'network',      path: '/network',      label: 'Ghost Network',   short: 'Network',   num: '01' },
  { id: 'agenthub',     path: '/agent-hub',    label: 'Agent Hub',       short: 'Agents',    num: '02' },
  { id: 'warroom',      path: '/war-room',     label: 'War Room',        short: 'War Room',  num: '03' },
  { id: 'operations',   path: '/operations',   label: 'Operations',      short: 'Ops',       num: '04' },
  { id: 'chat',         path: '/chat',         label: 'Ghost Comms',     short: 'Chat',      num: '05' },
  { id: 'intelligence', path: '/intelligence', label: 'Intel Deck',      short: 'Intel',     num: '06' },
  { id: 'factory',      path: '/factory',      label: 'Content Factory', short: 'Factory',   num: '07' },
  { id: 'briefing',     path: '/briefing',     label: 'Briefing',        short: 'Brief',     num: '08' },
  { id: 'builder',      path: '/builder',      label: 'Workflow Builder',short: 'Builder',   num: '09' },
  { id: 'archives',     path: '/archives',     label: 'Archives',        short: 'Archives',  num: '10' },
  { id: 'broadcast',    path: '/broadcast',    label: 'Broadcast Uplink',short: 'Broadcast', num: '11' },
  { id: 'leads',        path: '/leads',        label: 'Lead Tracker',    short: 'Leads',     num: '12' },
];
