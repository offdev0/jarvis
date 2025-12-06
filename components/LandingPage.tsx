import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { AGENTS } from '../constants';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLogin();
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030303] text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans cursor-crosshair">
      
      {/* --- HUD OVERLAYS --- */}
      <div className="fixed inset-0 pointer-events-none z-50 bg-scanlines opacity-[0.03]"></div>
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_800px_at_50%_50%,rgba(6,182,212,0.1),transparent)]"></div>
      
      {/* Dynamic Grid Floor */}
      <div className="fixed inset-0 z-0 perspective-grid opacity-20 pointer-events-none"></div>

      {/* Mouse Follower Glow */}
      <div 
        className="fixed w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none z-0 transition-transform duration-75 ease-out will-change-transform"
        style={{ transform: `translate(${mousePos.x - 250}px, ${mousePos.y - 250}px)` }}
      ></div>

      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#030303]/80 backdrop-blur-md">
         <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4 group cursor-pointer">
               <div className="relative w-12 h-12 flex items-center justify-center bg-cyan-900/20 border border-cyan-500/30 rounded-br-xl group-hover:bg-cyan-500/20 transition-all overflow-hidden">
                  <Icons.Cpu size={24} className="text-cyan-400 relative z-10" />
                  <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-500"></div>
               </div>
               <div className="flex flex-col">
                  <span className="font-display font-bold text-2xl tracking-widest leading-none text-white glitch-text" data-text="JARVIS">JARVIS</span>
                  <span className="text-[10px] font-mono text-cyan-500 tracking-[0.4em] uppercase">SYSTEM_V2.5</span>
               </div>
            </div>

            <div className="hidden md:flex items-center gap-12">
               {['Logic_Flow', 'Neural_Net', 'Sectors', 'Clearance'].map((item) => (
                 <a key={item} href={`#${item.toLowerCase().split('_')[0]}`} className="text-[10px] font-mono font-bold text-slate-400 tracking-[0.2em] uppercase hover:text-cyan-400 transition-colors relative group">
                    <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-1 bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {item}
                 </a>
               ))}
            </div>

            <button 
               onClick={handleLogin}
               className="group relative px-8 py-2 bg-transparent border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold tracking-widest uppercase hover:bg-cyan-500/10 transition-all clip-path-button"
            >
               <span className="relative z-10 group-hover:text-white transition-colors">Initialize</span>
               <div className="absolute inset-0 bg-cyan-500/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
         </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-48 pb-32 px-6 z-10 flex flex-col items-center text-center min-h-screen justify-center overflow-hidden">
        
        {/* Decorative Lines */}
        <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent"></div>
        <div className="absolute bottom-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent"></div>
        <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-900/20 to-transparent dashed-line"></div>
        <div className="absolute right-10 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-900/20 to-transparent dashed-line"></div>

        <div className="inline-flex items-center gap-3 px-4 py-2 bg-cyan-950/20 border border-cyan-500/30 rounded-none mb-10 backdrop-blur-sm relative">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>
            <span className="w-2 h-2 bg-cyan-500 animate-pulse"></span>
            <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-[0.2em]">Neural Mesh Online</span>
        </div>

        <h1 className="text-6xl md:text-9xl font-display font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600 mb-8 relative z-20 glitch-container">
          <span className="glitch-layer" data-text="ORCHESTRATE">ORCHESTRATE</span>
          <span className="relative">ORCHESTRATE</span>
        </h1>
        
        <h2 className="text-2xl md:text-4xl font-display font-bold tracking-[0.5em] text-cyan-500/80 mb-12 uppercase text-glow">
           Digital Reality
        </h2>

        <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-16 leading-relaxed font-mono border-l-2 border-cyan-500/20 pl-6 text-left">
           >> INITIATING GEMINI 2.5 PROTOCOL<br/>
           >> LOADING AGENT SWARM<br/>
           >> SYSTEM READY FOR COMPLEX REASONING TASKS ACROSS ALL DOMAINS.
        </p>

        <div className="flex flex-col md:flex-row gap-8 w-full justify-center items-center">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="group relative w-64 h-16 bg-cyan-600/10 border border-cyan-500 text-cyan-400 font-bold tracking-[0.2em] uppercase clip-path-slant hover:bg-cyan-500 hover:text-black transition-all duration-300"
          >
             <div className="absolute -inset-1 bg-cyan-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <span className="relative flex items-center justify-center gap-3">
                {isLoading ? <Icons.Loader2 className="animate-spin" /> : <Icons.Terminal size={20} />}
                {isLoading ? 'Uplinking...' : 'Access Terminal'}
             </span>
          </button>
        </div>
      </section>

      {/* --- INFINITE TICKER --- */}
      <div className="w-full bg-[#050505] border-y border-white/5 py-4 relative z-20 overflow-hidden">
         <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(8)].map((_, i) => (
               <div key={i} className="flex items-center gap-16 mx-8">
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                     <Icons.Cpu size={12} className="text-cyan-500" /> GEMINI-2.5-FLASH: <span className="text-cyan-400">ONLINE</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                     <Icons.Shield size={12} className="text-cyan-500" /> ENCRYPTION: <span className="text-cyan-400">AES-256</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                     <Icons.Activity size={12} className="text-cyan-500" /> LATENCY: <span className="text-cyan-400">12ms</span>
                  </span>
               </div>
            ))}
         </div>
      </div>

      {/* --- WORKFLOW VISUALIZATION --- */}
      <section id="workflow" className="relative py-40 px-6 bg-[#030303] border-b border-white/5 overflow-hidden">
         <div className="absolute inset-0 bg-grid-advanced opacity-10"></div>
         <div className="max-w-7xl mx-auto relative z-10">
             
             <div className="flex items-end justify-between mb-24 border-b border-white/10 pb-6">
                <div>
                   <h2 className="text-5xl md:text-7xl font-display font-bold text-white mb-2">LOGIC <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">FLOW</span></h2>
                   <p className="font-mono text-cyan-500 tracking-widest uppercase text-xs">Architecture_Overview // v2.5</p>
                </div>
                <div className="hidden md:block font-mono text-xs text-slate-500 text-right">
                   <div>PACKET_LOSS: 0.00%</div>
                   <div>THROUGHPUT: 100GB/s</div>
                </div>
             </div>

             <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4">
                 {/* Connection Line */}
                 <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-slate-800 -translate-y-1/2 z-0">
                    <div className="absolute inset-0 bg-cyan-500 w-[20%] animate-stream z-10"></div>
                 </div>

                 {[
                     { title: 'INPUT', icon: 'Keyboard', sub: 'Raw Data Ingestion' },
                     { title: 'ANALYSIS', icon: 'Cpu', sub: 'Gemini Inference' },
                     { title: 'ROUTING', icon: 'Network', sub: 'Agent Allocation' },
                     { title: 'EXECUTION', icon: 'Zap', sub: 'Task Resolution' }
                 ].map((step, i) => {
                     const isActive = activeStep === i;
                     const IconComponent = (Icons as any)[step.icon] || Icons.Circle;

                     return (
                         <div key={i} className="relative z-10 group">
                             <div className={`
                                w-full aspect-square bg-[#0a0a0a] border border-slate-800 relative flex flex-col items-center justify-center
                                transition-all duration-500 clip-path-card
                                ${isActive ? 'border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.15)]' : 'hover:border-slate-600'}
                             `}>
                                {/* Corner Accents */}
                                <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${isActive ? 'border-cyan-400' : 'border-slate-700'}`}></div>
                                <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${isActive ? 'border-cyan-400' : 'border-slate-700'}`}></div>

                                <div className={`
                                   w-20 h-20 flex items-center justify-center rounded-full mb-6 relative
                                   ${isActive ? 'bg-cyan-900/20' : 'bg-slate-900'}
                                `}>
                                   <IconComponent size={32} className={`relative z-10 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                                   {isActive && <div className="absolute inset-0 border border-cyan-500 rounded-full animate-ping opacity-20"></div>}
                                </div>

                                <h3 className={`text-2xl font-display font-bold tracking-widest ${isActive ? 'text-white' : 'text-slate-500'}`}>{step.title}</h3>
                                <p className="font-mono text-[10px] text-slate-500 uppercase mt-2">{step.sub}</p>
                                
                                <div className="absolute top-4 right-4 font-mono text-xs text-slate-700">0{i+1}</div>
                             </div>
                         </div>
                     )
                 })}
             </div>
         </div>
      </section>

      {/* --- TERMINAL --- */}
      <section className="py-32 px-6 bg-[#020202] relative">
          <div className="max-w-5xl mx-auto">
             <div className="border border-slate-800 bg-[#050505] p-1 relative shadow-2xl">
                 {/* Terminal Header */}
                 <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a] border-b border-slate-800">
                    <div className="flex gap-2">
                       <span className="w-3 h-3 bg-red-900/50 border border-red-500/50 rounded-full"></span>
                       <span className="w-3 h-3 bg-yellow-900/50 border border-yellow-500/50 rounded-full"></span>
                       <span className="w-3 h-3 bg-green-900/50 border border-green-500/50 rounded-full"></span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">root@jarvis-core:~/system_logs</div>
                 </div>
                 {/* Terminal Content */}
                 <div className="p-8 h-96 font-mono text-xs md:text-sm text-slate-400 relative overflow-hidden bg-scanlines bg-opacity-5">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                       <Icons.Cpu size={120} />
                    </div>
                    <div className="space-y-3 relative z-10">
                        <div className="flex gap-4"><span className="text-slate-600">00:01:22</span> <span className="text-cyan-500">>> SYSTEM_INIT</span> <span className="text-slate-300">Loading Neural Mesh...</span></div>
                        <div className="flex gap-4"><span className="text-slate-600">00:01:24</span> <span className="text-cyan-500">>> MODULE_LOAD</span> <span className="text-slate-300">Importing Gemini 2.5 Flash API... [DONE]</span></div>
                        <div className="flex gap-4"><span className="text-slate-600">00:01:25</span> <span className="text-cyan-500">>> AGENT_SPAWN</span> <span className="text-slate-300">Initializing Sub-Routines:</span></div>
                        <div className="pl-24 text-slate-500 grid grid-cols-2 gap-2 max-w-md">
                           <span>[OK] Social_Lead</span>
                           <span>[OK] HR_Director</span>
                           <span>[OK] Code_Engineer</span>
                           <span>[OK] Visual_Artist</span>
                        </div>
                        <div className="flex gap-4"><span className="text-slate-600">00:01:28</span> <span className="text-green-500">>> READY</span> <span className="text-white animate-pulse">Awaiting User Input_</span></div>
                    </div>
                 </div>
             </div>
          </div>
      </section>

      {/* --- SECTORS --- */}
      <section id="sectors" className="py-32 bg-[#030303] border-t border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
             <div className="mb-20">
                <h2 className="text-6xl font-display font-bold text-white mb-4">DEPLOYMENT <span className="text-stroke-cyan text-transparent">ZONES</span></h2>
                <div className="w-24 h-1 bg-cyan-500"></div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {[
                    { name: 'STARTUP_GRID', desc: 'Rapid prototyping and automated legal/HR infrastructure for lean teams.', color: 'blue' },
                    { name: 'DEV_MATRIX', desc: 'Real-time code debugging, refactoring, and full-stack generation.', color: 'indigo' },
                    { name: 'CORP_NEXUS', desc: 'Secure, SOC2-ready on-premise style deployments with full audit trails.', color: 'emerald' }
                 ].map((zone, i) => (
                    <div key={i} className="group relative p-1 bg-gradient-to-b from-slate-800 to-slate-900 clip-path-card hover:to-cyan-900/50 transition-all duration-500">
                       <div className="absolute inset-0 bg-[#050505] m-[1px] clip-path-card">
                          <div className="p-8 h-full flex flex-col relative z-10">
                             <div className="mb-6 flex justify-between items-start">
                                <Icons.Hexagon size={40} className={`text-${zone.color}-500`} />
                                <span className="font-mono text-xs text-slate-600">0{i+1}</span>
                             </div>
                             <h3 className="text-2xl font-display font-bold text-white mb-4 tracking-wider">{zone.name}</h3>
                             <p className="font-mono text-sm text-slate-400 leading-relaxed mb-8">{zone.desc}</p>
                             <div className="mt-auto pt-6 border-t border-dashed border-slate-800 flex items-center justify-between text-xs font-mono text-cyan-500 uppercase">
                                <span>Status: Active</span>
                                <Icons.ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
             </div>
          </div>
      </section>

      {/* --- AGENTS --- */}
      <section id="agents" className="py-32 bg-black relative">
         <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-center text-4xl font-mono font-bold text-slate-600 mb-20 tracking-[0.5em] uppercase">Neural_Network_Nodes</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {Object.values(AGENTS).map((agent, idx) => {
                  const colorName = agent.color.split('-')[1];
                  const IconComponent = (Icons as any)[agent.icon];

                  return (
                     <div key={idx} className="relative group">
                        {/* Hover Glow */}
                        <div className={`absolute -inset-0.5 bg-gradient-to-r from-${colorName}-500 to-transparent opacity-0 group-hover:opacity-50 blur transition duration-500`}></div>
                        
                        <div className="relative h-full bg-[#080808] border border-slate-800 p-8 flex flex-col clip-path-card transition-transform group-hover:-translate-y-1">
                           <div className="flex items-center justify-between mb-8">
                              <div className={`p-3 bg-${colorName}-900/20 border border-${colorName}-500/30 rounded-none`}>
                                 <IconComponent size={24} className={`text-${colorName}-400`} />
                              </div>
                              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">{agent.id}</span>
                           </div>

                           <h3 className="text-xl font-display font-bold text-white mb-2">{agent.name}</h3>
                           <p className="text-xs font-mono text-slate-400 mb-6">{agent.roleDescription}</p>

                           <div className="mt-auto space-y-2">
                              {agent.tools.slice(0, 2).map((tool, tIdx) => (
                                 <div key={tIdx} className="flex items-center gap-2 text-[10px] font-mono text-slate-500 border border-slate-800 px-2 py-1 bg-black">
                                    <span className={`w-1 h-1 bg-${colorName}-500`}></span>
                                    {tool.name}
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-32 px-6 bg-[#020202] border-t border-white/5">
         <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* Tier 1 */}
               <div className="border border-slate-800 bg-[#050505] p-10 flex flex-col items-center relative group">
                  <h3 className="font-mono text-slate-500 tracking-[0.3em] text-xs uppercase mb-4">Level 1 // Observer</h3>
                  <div className="text-5xl font-display font-bold text-white mb-8">FREE</div>
                  <ul className="w-full space-y-4 font-mono text-xs text-slate-400 mb-10">
                     <li className="flex justify-between border-b border-dashed border-slate-800 pb-2"><span>Routing</span> <span>Basic</span></li>
                     <li className="flex justify-between border-b border-dashed border-slate-800 pb-2"><span>Requests</span> <span>5/Day</span></li>
                     <li className="flex justify-between border-b border-dashed border-slate-800 pb-2"><span>Agents</span> <span>Social Only</span></li>
                  </ul>
                  <button onClick={handleLogin} className="w-full py-4 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-mono text-xs uppercase tracking-widest">
                     Initialize
                  </button>
               </div>

               {/* Tier 2 */}
               <div className="border border-cyan-500/50 bg-[#080808] p-10 flex flex-col items-center relative shadow-[0_0_50px_rgba(6,182,212,0.05)] scale-105 z-10">
                  <div className="absolute top-0 inset-x-0 h-1 bg-cyan-500"></div>
                  <h3 className="font-mono text-cyan-400 tracking-[0.3em] text-xs uppercase mb-4">Level 2 // Operator</h3>
                  <div className="text-5xl font-display font-bold text-white mb-2">$29<span className="text-xl text-slate-500">/mo</span></div>
                  <div className="text-[10px] font-mono text-cyan-500 mb-8 uppercase">Recommended Clearance</div>
                  
                  <ul className="w-full space-y-4 font-mono text-xs text-slate-300 mb-10">
                     <li className="flex justify-between border-b border-dashed border-slate-700 pb-2"><span>Routing</span> <span className="text-cyan-400">Unlimited</span></li>
                     <li className="flex justify-between border-b border-dashed border-slate-700 pb-2"><span>Requests</span> <span className="text-cyan-400">Unlimited</span></li>
                     <li className="flex justify-between border-b border-dashed border-slate-700 pb-2"><span>Agents</span> <span className="text-cyan-400">Full Suite</span></li>
                     <li className="flex justify-between border-b border-dashed border-slate-700 pb-2"><span>Logic</span> <span className="text-cyan-400">Gemini 2.5</span></li>
                  </ul>
                  <button onClick={handleLogin} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white transition-all font-mono text-xs uppercase tracking-widest font-bold">
                     Request Access
                  </button>
               </div>

               {/* Tier 3 */}
               <div className="border border-slate-800 bg-[#050505] p-10 flex flex-col items-center relative group">
                  <h3 className="font-mono text-purple-500 tracking-[0.3em] text-xs uppercase mb-4">Level 3 // Architect</h3>
                  <div className="text-5xl font-display font-bold text-white mb-8">CUSTOM</div>
                  <ul className="w-full space-y-4 font-mono text-xs text-slate-400 mb-10">
                     <li className="flex justify-between border-b border-dashed border-slate-800 pb-2"><span>Private Mesh</span> <span>Included</span></li>
                     <li className="flex justify-between border-b border-dashed border-slate-800 pb-2"><span>Custom Agents</span> <span>Included</span></li>
                     <li className="flex justify-between border-b border-dashed border-slate-800 pb-2"><span>API Access</span> <span>Full</span></li>
                  </ul>
                  <button className="w-full py-4 border border-purple-900/50 text-purple-400 hover:bg-purple-900/20 transition-all font-mono text-xs uppercase tracking-widest">
                     Contact Command
                  </button>
               </div>
            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 bg-[#010101] py-12 relative z-10">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
               <Icons.Cpu size={20} className="text-cyan-500" />
               <span className="font-display font-bold text-lg tracking-widest text-white">JARVIS HUB</span>
            </div>
            <div className="font-mono text-[10px] text-slate-600 uppercase tracking-widest flex items-center gap-4">
               <span>Status: Nominal</span>
               <span>Encryption: Active</span>
               <span>© 2024</span>
            </div>
         </div>
      </footer>

      <style>{`
         @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');

         .font-display { font-family: 'Rajdhani', sans-serif; }
         .font-mono { font-family: 'Share Tech Mono', monospace; }

         .clip-path-slant {
            clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
         }
         .clip-path-button {
             clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
         }
         .clip-path-card {
            clip-path: polygon(0 0, 100% 0, 100% 85%, 90% 100%, 0 100%);
         }
         
         .bg-scanlines {
            background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
            background-size: 100% 4px;
         }

         .perspective-grid {
             background-image: linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px),
             linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px);
             background-size: 40px 40px;
             transform: perspective(500px) rotateX(60deg);
             transform-origin: top center;
             height: 100vh;
         }

         @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
         }
         .animate-marquee {
            animation: marquee 20s linear infinite;
         }

         @keyframes stream {
            0% { left: -20%; opacity: 0; }
            50% { opacity: 1; }
            100% { left: 120%; opacity: 0; }
         }
         .animate-stream {
            animation: stream 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
         }

         .text-stroke-cyan {
            -webkit-text-stroke: 1px rgba(6,182,212,0.5);
         }
         
         .dashed-line {
            background-image: linear-gradient(to bottom, rgba(6,182,212,0.2) 50%, transparent 50%);
            background-size: 2px 20px;
         }

         /* Glitch Effect */
         .glitch-text {
            position: relative;
         }
         .glitch-text::before, .glitch-text::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.8;
         }
         .glitch-text::before {
            color: #0ff;
            z-index: -1;
            animation: glitch-anim-1 0.4s infinite linear alternate-reverse;
         }
         .glitch-text::after {
            color: #f0f;
            z-index: -2;
            animation: glitch-anim-2 0.4s infinite linear alternate-reverse;
         }
         
         @keyframes glitch-anim-1 {
            0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 0); }
            20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, 0); }
            40% { clip-path: inset(10% 0 50% 0); transform: translate(-2px, 0); }
            60% { clip-path: inset(80% 0 5% 0); transform: translate(2px, 0); }
            80% { clip-path: inset(30% 0 40% 0); transform: translate(-2px, 0); }
            100% { clip-path: inset(50% 0 30% 0); transform: translate(2px, 0); }
         }
         @keyframes glitch-anim-2 {
            0% { clip-path: inset(10% 0 60% 0); transform: translate(2px, 0); }
            20% { clip-path: inset(30% 0 20% 0); transform: translate(-2px, 0); }
            40% { clip-path: inset(70% 0 10% 0); transform: translate(2px, 0); }
            60% { clip-path: inset(20% 0 50% 0); transform: translate(-2px, 0); }
            80% { clip-path: inset(60% 0 30% 0); transform: translate(2px, 0); }
            100% { clip-path: inset(40% 0 70% 0); transform: translate(-2px, 0); }
         }
      `}</style>

    </div>
  );
};

export default LandingPage;