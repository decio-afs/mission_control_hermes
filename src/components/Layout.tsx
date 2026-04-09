import { NavLink, Outlet } from 'react-router-dom';
import { Network, Activity, Calendar, LineChart, Cpu, FileText, Radio, Menu, X } from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState } from 'react';

// Utility for tailwind classes merging
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { path: '/network', icon: Network, label: 'Ghost Network' },
  { path: '/war-room', icon: Activity, label: 'War Room' },
  { path: '/operations', icon: Calendar, label: 'Operations Center' },
  { path: '/intelligence', icon: LineChart, label: 'Intelligence Deck' },
  { path: '/factory', icon: Cpu, label: 'Content Factory' },
  { path: '/briefing', icon: FileText, label: 'Briefing Terminal' },
  { path: '/broadcast', icon: Radio, label: 'Broadcast Uplink' },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-bg-deep text-text-primary overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-bg-card border-r border-border-subtle flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-brand-start to-brand-end">
            <img src="/daos_emblem.png" alt="Mission Control" className="w-8 h-8 rounded-full shadow-[0_0_10px_rgba(246,78,110,0.4)]" />
            <h1 className="text-lg font-black tracking-tighter uppercase whitespace-nowrap">Mission Control</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-text-secondary hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-3 transition-all duration-200 group text-sm font-bold uppercase tracking-wider rounded-lg lg:rounded-none lg:py-2.5",
                    isActive 
                      ? "bg-[#f64e6e]/10 text-brand-end lg:shadow-[inset_2px_0_0_0_#f64e6e] max-lg:border max-lg:border-[#f64e6e]/30" 
                      : "text-text-secondary hover:bg-border-subtle-subtle/50 hover:text-white"
                  )
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border-subtle text-xs text-text-secondary text-center mt-auto font-mono shrink-0">
          Director Interface v1.0
          <br/>
          System: <span className="text-emerald-400 font-bold">ONLINE</span>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Status Bar */}
        <header className="h-16 shrink-0 bg-bg-deep border-b border-border-subtle flex justify-between items-center px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-white rounded-md hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-text-secondary">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Gateway Connected
              </div>
              <div className="w-px h-4 bg-border-subtle-subtle"></div>
              <div>Active Runners: 3/17</div>
              <div className="w-px h-4 bg-border-subtle-subtle"></div>
              <div className="flex gap-2">Latency: <span className="text-emerald-400">24ms</span></div>
            </div>
            
            {/* Mobile simplified status */}
            <div className="sm:hidden flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Gateway Online
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-bg-deep">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
