import React from 'react';
import * as Icons from 'lucide-react';

interface PulsingMicProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
  accentColor: string; 
  ringColor: string;
}

const PulsingMic: React.FC<PulsingMicProps> = ({ isListening, isProcessing, onClick, accentColor, ringColor }) => {
  // Parse color for shadow effects (e.g. text-cyan-400)
  // This is a bit hacky but works for the limited set of Tailwind colors we use.
  const shadowColor = isListening ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.1)';
  
  return (
    <button
      onClick={onClick}
      disabled={isProcessing}
      className={`relative group w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 border ${isListening ? 'border-white bg-white text-black' : 'border-slate-700 bg-black/80 text-slate-400 hover:border-slate-500 hover:text-white'}`}
      style={{
         boxShadow: isListening ? '0 0 20px 5px rgba(255,255,255,0.3)' : 'none'
      }}
    >
      {isProcessing ? (
          <Icons.Loader2 className="w-5 h-5 animate-spin" />
      ) : (
          <Icons.Mic className="w-5 h-5 relative z-10" />
      )}
      
      {/* Reactor Core Animation */}
      {isListening && (
        <>
           <span className="absolute inset-0 rounded-full animate-ping bg-white opacity-20"></span>
           <span className="absolute -inset-1 rounded-full border border-white/30 animate-pulse-slow"></span>
        </>
      )}
      
      {!isListening && (
         <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      )}
    </button>
  );
};

export default PulsingMic;