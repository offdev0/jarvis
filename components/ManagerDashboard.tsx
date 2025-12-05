import React from 'react';
import { AgentConfig } from '../types';
import * as Icons from 'lucide-react';

interface ManagerDashboardProps {
  agent: AgentConfig;
  onToolClick: (prompt: string) => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ agent, onToolClick }) => {
  // Extract base color for dynamic classes
  const colorName = agent.color.split('-')[1];

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
      
      {/* Dashboard Header */}
      <div className="text-center mb-12 relative">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-${colorName}-500/10 blur-[80px] rounded-full pointer-events-none`}></div>
        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500 mb-4 relative z-10 drop-shadow-lg">
          {agent.name}
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm font-mono tracking-widest uppercase">
          <span className={`text-${colorName}-400`}>Dashboard Online</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">v2.4.1</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-12">
        {agent.stats.map((stat, idx) => (
          <div 
            key={idx}
            className="bg-slate-900/40 border border-slate-800 p-5 rounded-xl backdrop-blur-sm group hover:border-slate-600 transition-colors relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-${colorName}-500/50 to-transparent opacity-50`}></div>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
               <span className="text-2xl font-display font-bold text-white">{stat.value}</span>
               <div className={`flex items-center text-xs font-mono ${stat.trend === 'up' ? 'text-green-400' : stat.trend === 'down' ? 'text-red-400' : 'text-slate-400'}`}>
                  {stat.trend === 'up' && <Icons.TrendingUp size={14} className="mr-1" />}
                  {stat.trend === 'down' && <Icons.TrendingDown size={14} className="mr-1" />}
                  {stat.change || 'Stable'}
               </div>
            </div>
            {/* Background Glow on Hover */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${colorName}-500/5 rounded-full blur-xl group-hover:bg-${colorName}-500/10 transition-all`}></div>
          </div>
        ))}
      </div>

      {/* Tools Section */}
      <div className="w-full max-w-4xl">
         <div className="flex items-center gap-3 mb-6">
            <Icons.Terminal size={18} className={`text-${colorName}-400`} />
            <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest">Quick Actions / Tools</h3>
            <div className="flex-1 h-[1px] bg-slate-800"></div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agent.tools.map((tool) => {
              const IconComponent = (Icons as any)[tool.icon] || Icons.Command;
              
              return (
                <button
                  key={tool.id}
                  onClick={() => onToolClick(tool.prompt)}
                  className={`flex flex-col items-start p-5 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-800/50 hover:border-${colorName}-500/50 transition-all duration-300 group text-left relative overflow-hidden`}
                >
                  <div className={`p-2 rounded-lg bg-slate-800/50 mb-3 text-${colorName}-400 group-hover:bg-${colorName}-500 group-hover:text-white transition-colors shadow-lg`}>
                     <IconComponent size={20} />
                  </div>
                  <h4 className="font-display font-bold text-slate-200 text-lg mb-1 group-hover:text-white">{tool.name}</h4>
                  <p className="text-xs text-slate-500 font-mono leading-relaxed line-clamp-2 group-hover:text-slate-400">
                    {tool.prompt}
                  </p>
                  
                  {/* Corner Accent */}
                  <div className={`absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-transparent border-r-slate-800 group-hover:border-r-${colorName}-500/50 transition-all`}></div>
                </button>
              );
            })}
         </div>
      </div>

    </div>
  );
};

export default ManagerDashboard;