import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';

interface DataDeckProps {
  onClose: () => void;
}

const DataDeck: React.FC<DataDeckProps> = ({ onClose }) => {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Network Graph Animation ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.offsetWidth || 800;
    let height = canvas.height = canvas.parentElement?.offsetHeight || 400;

    const resize = () => {
        width = canvas.width = canvas.parentElement?.offsetWidth || 800;
        height = canvas.height = canvas.parentElement?.offsetHeight || 400;
    };
    window.addEventListener('resize', resize);

    // Node Setup
    const nodes: any[] = [];
    for(let i=0; i<30; i++) {
        nodes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            size: Math.random() * 3 + 1
        });
    }

    let animationFrameId: number;

    const draw = () => {
        // Trail effect
        ctx.fillStyle = 'rgba(10, 15, 25, 0.2)';
        ctx.fillRect(0, 0, width, height);

        // Update Nodes
        nodes.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;

            // Bounce
            if(node.x < 0 || node.x > width) node.vx *= -1;
            if(node.y < 0 || node.y > height) node.vy *= -1;

            // Draw Node
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.size, 0, Math.PI*2);
            ctx.fillStyle = '#06b6d4'; // Cyan
            ctx.fill();
        });

        // Draw Connections
        ctx.lineWidth = 0.5;
        for(let i=0; i<nodes.length; i++) {
            for(let j=i+1; j<nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if(dist < 150) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(6, 182, 212, ${1 - dist/150})`;
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }

        animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-50 bg-[#050910] text-cyan-500 font-mono overflow-hidden flex flex-col transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* Background Grids */}
      <div className="absolute inset-0 bg-grid-advanced opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-scanlines opacity-5 pointer-events-none"></div>

      {/* --- HEADER --- */}
      <header className="h-16 border-b border-cyan-900/50 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500 rounded flex items-center justify-center animate-pulse">
                  <Icons.Activity size={18} />
              </div>
              <div>
                  <h1 className="text-xl font-display font-bold text-white tracking-widest">SYSTEM DIAGNOSTIC</h1>
                  <div className="flex items-center gap-2 text-[10px] text-cyan-600 uppercase">
                      <span>Core_V2.5</span>
                      <span>::</span>
                      <span>Mode: Deep_Scan</span>
                  </div>
              </div>
          </div>
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 border border-red-900/50 text-red-400 hover:bg-red-900/20 hover:text-red-200 transition-colors uppercase text-xs tracking-widest rounded"
          >
              <Icons.XCircle size={16} /> Close Deck
          </button>
      </header>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-y-auto">
          
          {/* COLUMN 1: METRICS (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
              
              {/* CPU Core Stats */}
              <div className="bg-black/40 border border-cyan-900/30 p-4 rounded-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-50">
                      <Icons.Cpu size={40} className="text-cyan-900" />
                  </div>
                  <h3 className="text-xs text-slate-500 uppercase tracking-widest mb-4 font-bold">Processing Cores</h3>
                  <div className="space-y-3">
                      {[1,2,3,4].map(core => (
                          <div key={core} className="space-y-1">
                              <div className="flex justify-between text-[10px] text-cyan-400">
                                  <span>CORE_0{core}</span>
                                  <span>{Math.floor(Math.random() * 40 + 50)}%</span>
                              </div>
                              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-cyan-500 shadow-[0_0_10px_currentColor] animate-pulse" 
                                    style={{ width: `${Math.random() * 40 + 50}%`, animationDuration: `${Math.random() + 0.5}s` }}
                                  ></div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Memory & Storage */}
              <div className="bg-black/40 border border-cyan-900/30 p-4 rounded-xl flex-1 flex flex-col justify-center items-center relative">
                  <h3 className="absolute top-4 left-4 text-xs text-slate-500 uppercase tracking-widest font-bold">Memory Load</h3>
                  <div className="relative w-48 h-48 flex items-center justify-center mt-4">
                       <svg className="w-full h-full transform -rotate-90">
                           <circle cx="96" cy="96" r="80" stroke="#1e293b" strokeWidth="12" fill="transparent" />
                           <circle 
                                cx="96" cy="96" r="80" 
                                stroke="#06b6d4" strokeWidth="12" 
                                fill="transparent" 
                                strokeDasharray="502" 
                                strokeDashoffset="100"
                                className="drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                           >
                                <animate attributeName="stroke-dashoffset" values="502; 100; 150; 100" dur="4s" repeatCount="indefinite" />
                           </circle>
                       </svg>
                       <div className="absolute text-center">
                           <span className="text-4xl font-display font-bold text-white block">128</span>
                           <span className="text-xs text-cyan-500 uppercase">Terabytes</span>
                       </div>
                  </div>
              </div>

          </div>

          {/* COLUMN 2: VISUALIZER (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
               <div className="flex-1 bg-black/60 border border-cyan-500/30 rounded-2xl relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                   <div className="absolute top-4 left-6 z-10">
                       <h3 className="text-sm font-display font-bold text-white tracking-widest flex items-center gap-2">
                           <span className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></span>
                           LIVE NEURAL TOPOLOGY
                       </h3>
                   </div>
                   
                   {/* Interactive Canvas Graph */}
                   <canvas ref={canvasRef} className="w-full h-full opacity-80" />

                   <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-950/50 to-transparent pointer-events-none"></div>
                   
                   <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                       <div className="font-mono text-[10px] text-cyan-400 space-y-1">
                           <div>NODES_ACTIVE: 3,402</div>
                           <div>PACKET_LOSS: 0.00%</div>
                           <div>LATENCY: 14ms</div>
                       </div>
                       <div className="flex gap-1">
                           {[...Array(10)].map((_, i) => (
                               <div key={i} className="w-1 h-8 bg-slate-800 rounded-sm flex items-end">
                                   <div 
                                    className="w-full bg-cyan-500 animate-[bounce_1s_infinite]" 
                                    style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}
                                   ></div>
                               </div>
                           ))}
                       </div>
                   </div>
               </div>
          </div>

          {/* COLUMN 3: LOGS & SECURITY (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Security Status */}
              <div className="bg-gradient-to-br from-green-900/20 to-slate-900/50 border border-green-900/50 p-6 rounded-xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h3 className="text-green-400 font-bold tracking-widest text-xs uppercase">Security Shield</h3>
                          <div className="text-2xl font-display text-white mt-1">ARMED</div>
                      </div>
                      <Icons.ShieldCheck className="text-green-500" size={32} />
                  </div>
                  <div className="w-full h-1 bg-slate-800">
                      <div className="h-full bg-green-500 w-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                  </div>
                  <p className="mt-3 text-[10px] text-slate-400 font-mono">
                      No intrusions detected. Perimeter secure. Firewall operating at 100% efficiency.
                  </p>
              </div>

              {/* Streaming Logs */}
              <div className="flex-1 bg-[#020408] border border-slate-800 rounded-xl p-4 font-mono text-[10px] overflow-hidden flex flex-col">
                  <h3 className="text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex justify-between">
                      <span>System Log</span>
                      <span className="text-cyan-500 animate-pulse">● REC</span>
                  </h3>
                  <div className="flex-1 overflow-y-hidden relative space-y-2">
                       {/* Animated scrolling log simulation */}
                       <div className="absolute inset-x-0 bottom-0 animate-[moveUp_10s_linear_infinite]">
                           {[...Array(20)].map((_, i) => (
                               <div key={i} className="mb-2 flex gap-2 opacity-70">
                                   <span className="text-slate-600">{new Date().toLocaleTimeString()}</span>
                                   <span className={i % 3 === 0 ? 'text-cyan-400' : i % 3 === 1 ? 'text-purple-400' : 'text-slate-300'}>
                                       {i % 3 === 0 ? '>> PACKET_RECEIVED' : i % 3 === 1 ? '>> OPTIMIZING_SHARD' : '>> KERNEL_UPDATE'}
                                   </span>
                                   <span className="text-slate-500 truncate">Hash: {Math.random().toString(36).substring(7)}</span>
                               </div>
                           ))}
                           {[...Array(20)].map((_, i) => (
                               <div key={`dup-${i}`} className="mb-2 flex gap-2 opacity-70">
                                   <span className="text-slate-600">{new Date().toLocaleTimeString()}</span>
                                   <span className={i % 3 === 0 ? 'text-cyan-400' : i % 3 === 1 ? 'text-purple-400' : 'text-slate-300'}>
                                       {i % 3 === 0 ? '>> PACKET_RECEIVED' : i % 3 === 1 ? '>> OPTIMIZING_SHARD' : '>> KERNEL_UPDATE'}
                                   </span>
                                   <span className="text-slate-500 truncate">Hash: {Math.random().toString(36).substring(7)}</span>
                               </div>
                           ))}
                       </div>
                  </div>
              </div>

          </div>

      </div>

      <style>{`
        @keyframes moveUp {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
};

export default DataDeck;