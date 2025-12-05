import React, { useState } from 'react';
import * as Icons from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    // Simulate network delay for authentication
    setTimeout(() => {
      onLogin();
    }, 2000);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#02040a] text-white selection:bg-cyan-500/30">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-advanced opacity-20 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-[#02040a]/50 to-[#02040a] pointer-events-none"></div>
      
      {/* Ambient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>

      {/* Main Content Card */}
      <div className="relative z-10 flex flex-col items-center p-12 max-w-lg w-full">
        
        {/* Logo / Core Animation */}
        <div className="relative mb-12 group">
          <div className="absolute inset-0 bg-cyan-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full"></div>
          <div className="relative w-24 h-24 flex items-center justify-center bg-black border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 backdrop-blur-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent"></div>
            <Icons.Cpu className="w-10 h-10 text-cyan-400 animate-float" />
            
            {/* Scanning line */}
            <div className="absolute top-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-[scan_3s_ease-in-out_infinite]"></div>
          </div>
        </div>

        {/* Typography */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-slate-500 drop-shadow-lg">
            JARVIS
          </h1>
          <div className="flex items-center justify-center gap-4">
             <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-cyan-500/50"></div>
             <p className="text-cyan-400 font-mono text-xs tracking-[0.3em] uppercase text-glow">
               Multi-Agent Orchestration
             </p>
             <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-cyan-500/50"></div>
          </div>
        </div>

        {/* Login Button Area */}
        <div className="w-full relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="relative w-full flex items-center justify-center gap-4 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-lg border border-slate-700 hover:border-cyan-500/50 transition-all duration-300 shadow-xl disabled:opacity-80 disabled:cursor-wait"
          >
            {isLoading ? (
              <>
                 <Icons.Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                 <span className="font-mono text-sm tracking-widest text-cyan-200 animate-pulse">INITIALIZING SECURE LINK...</span>
              </>
            ) : (
              <>
                {/* Google SVG Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="font-sans font-medium tracking-wide">Sign in with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-8 flex flex-col items-center gap-2 text-[10px] text-slate-600 font-mono uppercase tracking-widest">
           <span>Secure Access Required</span>
           <div className="flex gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
             <span>System Status: Online</span>
           </div>
        </div>

      </div>

      {/* Decorative HUD Lines */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-900 to-transparent"></div>
      <div className="absolute top-10 left-10 w-32 h-32 border-l border-t border-white/5 rounded-tl-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 border-r border-b border-white/5 rounded-br-3xl pointer-events-none"></div>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;