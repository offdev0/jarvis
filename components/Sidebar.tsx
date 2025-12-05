import React from 'react';
import { AgentId } from '../types';
import { AGENTS } from '../constants';
import * as Icons from 'lucide-react';

interface SidebarProps {
  currentAgent: AgentId;
  onSelectAgent: (id: AgentId) => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentAgent, onSelectAgent, isOpen }) => {
  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-[#06090e]/95 backdrop-blur-xl border-r border-slate-800 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col shadow-2xl`}>
      
      {/* Sidebar Header */}
      <div className="h-24 flex items-center px-8 border-b border-slate-800/50 bg-black/40">
         <div className="flex items-center gap-4">
             <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">
                 <Icons.Cpu className="text-white w-6 h-6" />
             </div>
             <div>
                <h1 className="text-white font-display font-bold tracking-widest text-xl">JARVIS</h1>
                <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.2em] text-glow">Neural Network</p>
             </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        
        {/* Connection Status Mockup */}
        <div className="p-4 border border-slate-800/80 rounded-lg bg-slate-900/30 backdrop-blur-sm shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="flex justify-between items-center mb-3 relative z-10">
                <span className="text-[10px] font-mono text-slate-400 font-bold tracking-wider">SYSTEM LOAD</span>
                <span className="text-[10px] font-mono text-cyan-400 animate-pulse">34%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative z-10">
                <div className="w-[34%] h-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
            </div>
        </div>

        {/* Modules List */}
        <div>
          <div className="flex items-center gap-2 mb-4 px-2">
             <Icons.Zap size={14} className="text-cyan-400" />
             <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest font-bold">Active Nodes</span>
          </div>
          
          <div className="space-y-3">
            {Object.values(AGENTS).map((agent) => {
              // Robustly resolve the icon component
              const iconName = agent.icon;
              const IconComponent = (Icons as any)[iconName] || Icons.Circle || (() => <div className="w-4 h-4 bg-gray-500" />);
              
              const isActive = currentAgent === agent.id;
              
              // Extract color name for gradients
              const colorName = agent.color.split('-')[1];

              return (
                <button
                  key={agent.id}
                  onClick={() => onSelectAgent(agent.id)}
                  className={`relative w-full flex items-center group overflow-hidden transition-all duration-300 rounded-lg border ${
                    isActive 
                      ? `border-${colorName}-500/50 bg-gradient-to-r from-${colorName}-900/20 to-transparent` 
                      : 'border-transparent hover:bg-slate-800/50 hover:border-slate-700/50'
                  }`}
                >
                  {/* Left Accent Bar for Active State */}
                  {isActive && (
                      <div className={`absolute inset-y-0 left-0 w-1 bg-${colorName}-500 shadow-[0_0_15px_currentColor]`}></div>
                  )}

                  <div className="flex items-center w-full px-5 py-4 gap-4">
                      <div className={`p-2 rounded-md transition-all duration-300 ${isActive ? `bg-${colorName}-500 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)]` : 'bg-slate-800/50 text-slate-600 group-hover:text-slate-300 group-hover:bg-slate-700'}`}>
                         <IconComponent size={18} />
                      </div>
                      
                      <div className="flex flex-col items-start">
                         <span className={`text-sm font-display font-bold tracking-wider transition-colors duration-300 ${isActive ? 'text-white text-glow' : 'text-slate-500 group-hover:text-slate-200'}`}>
                            {agent.name.split(' ')[0]}
                         </span>
                         <span className={`text-[9px] font-mono uppercase tracking-wide ${isActive ? `text-${colorName}-400` : 'text-slate-700'}`}>
                            {isActive ? '● ONLINE' : '○ STANDBY'}
                         </span>
                      </div>
                  </div>
                  
                  {/* Right-side glow effect */}
                  {isActive && (
                      <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-8 h-16 bg-${colorName}-500/10 blur-xl rounded-full`}></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-6 border-t border-slate-800/50 bg-black/40">
         <div className="flex justify-between items-end">
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">Uptime</span>
                <span className="text-sm font-mono text-slate-300 tracking-widest">14:02:59</span>
             </div>
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;