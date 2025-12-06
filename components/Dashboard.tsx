import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import ChatMessage from './ChatMessage';
import PulsingMic from './PulsingMic';
import ManagerDashboard from './ManagerDashboard';
import VideoMeet from './VideoMeet';
import { useSpeech } from '../hooks/useSpeech';
import { routeRequest, generateAgentResponse } from '../services/geminiService';
import { AgentId, Message } from '../types';
import { AGENTS } from '../constants';
import * as Icons from 'lucide-react';

const LOCAL_STORAGE_KEY = 'jarvis_hub_chat_history_v1';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [currentAgentId, setCurrentAgentId] = useState<AgentId>(AgentId.MASTER);
  const [viewMode, setViewMode] = useState<'dashboard' | 'meeting'>('dashboard');
  const [isChatView, setIsChatView] = useState(false);

  // Centralized Chat History State
  const [chatHistory, setChatHistory] = useState<Record<AgentId, Message[]>>(() => {
    const defaultHistory = {
      [AgentId.MASTER]: [],
      [AgentId.SOCIAL]: [],
      [AgentId.HR]: [],
      [AgentId.EMAIL]: [],
      [AgentId.DESIGNER]: [],
      [AgentId.CODEX]: [],
    };

    try {
      const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        Object.keys(parsedHistory).forEach(key => {
          parsedHistory[key] = parsedHistory[key].map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        });
        return { ...defaultHistory, ...parsedHistory };
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
    return defaultHistory;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chatHistory));
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  }, [chatHistory]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ base64: string, mimeType: string } | null>(null);

  const { isListening, transcript, startListening, stopListening, resetTranscript, speak } = useSpeech();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null); 

  const currentAgent = AGENTS[currentAgentId];
  const messages = chatHistory[currentAgentId];

  useEffect(() => {
    if (isChatView) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, isChatView]);

  useEffect(() => {
    if (!isListening && transcript) {
      handleUserSubmit(transcript);
      resetTranscript();
    }
  }, [isListening, transcript]);
  
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleToolClick = (prompt: string) => {
    if (prompt === 'Initiate a secure video conference channel.') {
        setViewMode('meeting');
        return;
    }
    setInputText(prompt);
    inputRef.current?.focus();
  };

  const handleAgentSelect = (id: AgentId) => {
    if (id !== currentAgentId) {
        setCurrentAgentId(id);
        setIsChatView(false); 
    }
    setSidebarOpen(false);
  };

  const handleUserSubmit = async (text: string) => {
    if (!text.trim() && !uploadedImage) return;

    setIsChatView(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      senderName: 'You',
      timestamp: new Date(),
      imageUrl: uploadedImage ? `data:${uploadedImage.mimeType};base64,${uploadedImage.base64}` : undefined
    };

    const originAgentId = currentAgentId;
    setChatHistory(prev => ({
      ...prev,
      [originAgentId]: [...prev[originAgentId], userMsg]
    }));

    setInputText('');
    setUploadedImage(null);
    setIsProcessing(true);

    try {
      let targetAgentId = originAgentId;
      let prompt = text;

      // Routing Logic
      if (originAgentId === AgentId.MASTER) {
        const routeResult = await routeRequest(text);
        targetAgentId = routeResult.targetAgentId;
        
        if (targetAgentId !== AgentId.MASTER) {
            setCurrentAgentId(targetAgentId);
            setChatHistory(prev => ({
              ...prev,
              [targetAgentId]: [...prev[targetAgentId], userMsg]
            }));
        }
      }

      // Generate Response
      const { text: responseText, generatedImageUrl } = await generateAgentResponse(
        targetAgentId,
        prompt,
        uploadedImage?.base64,
        uploadedImage?.mimeType
      );

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        senderName: AGENTS[targetAgentId].name,
        timestamp: new Date(),
        imageUrl: generatedImageUrl
      };

      setChatHistory(prev => ({
        ...prev,
        [targetAgentId]: [...prev[targetAgentId], botMsg]
      }));
      
      speak(responseText);

    } catch (error) {
      console.error("Interaction failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setUploadedImage({
          base64: base64String,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (viewMode === 'meeting') {
      return <VideoMeet onLeave={() => setViewMode('dashboard')} />;
  }

  return (
    <div className="flex h-screen bg-background text-slate-100 overflow-hidden font-sans relative selection:bg-cyan-500/30 selection:text-cyan-200 animate-in fade-in duration-1000">
      
      {/* AMBIENT LIGHTING */}
      <div className="absolute top-[-30%] left-[-10%] w-[1000px] h-[1000px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-30%] right-[-10%] w-[1000px] h-[1000px] bg-indigo-900/10 rounded-full blur-[150px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute inset-0 bg-grid-advanced pointer-events-none z-0 opacity-30"></div>
      <div className="scanlines z-10 opacity-[0.03]"></div>

      {/* Decorative HUD Corners */}
      <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-xl pointer-events-none z-20"></div>
      <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-xl pointer-events-none z-20"></div>
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-xl pointer-events-none z-20"></div>
      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-cyan-500/30 rounded-br-xl pointer-events-none z-20"></div>

      <button 
        className="md:hidden fixed top-6 left-6 z-50 p-2 bg-slate-900/90 border border-slate-700 backdrop-blur rounded-lg text-white shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Icons.Menu size={20} />
      </button>

      <Sidebar 
        currentAgent={currentAgentId} 
        onSelectAgent={handleAgentSelect}
        isOpen={sidebarOpen}
      />

      <div className="flex-1 flex flex-col md:ml-72 relative z-10 h-full p-4 md:p-8 min-w-0">
        <div className="flex-1 flex flex-col bg-[#0b101b]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative min-w-0">
            
            <header className="h-24 flex items-center justify-between px-8 border-b border-white/5 bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-6">
                  <div className={`w-3 h-3 rounded-full ${currentAgent.color} shadow-[0_0_15px_currentColor] animate-pulse`}></div>
                  <div className="flex flex-col gap-1">
                      <h2 className="text-xl font-display font-bold tracking-widest text-white uppercase drop-shadow-md">
                        {currentAgent.name}
                      </h2>
                      <div className="flex items-center gap-2">
                         <span className={`text-[11px] font-mono ${currentAgent.textColor} font-bold opacity-90 tracking-wider uppercase border-l-2 border-current pl-2`}>
                            "{currentAgent.quote}"
                         </span>
                      </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 md:gap-6">
                    {messages.length > 0 && (
                       <button 
                          onClick={() => setIsChatView(!isChatView)}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800 transition-all text-[10px] font-mono uppercase tracking-wider text-cyan-400 group"
                       >
                          {isChatView ? (
                             <>
                               <Icons.LayoutDashboard size={14} className="group-hover:text-cyan-300" />
                               <span className="hidden md:inline">Dashboard</span>
                             </>
                          ) : (
                             <>
                               <Icons.History size={14} className="group-hover:text-cyan-300" />
                               <span className="hidden md:inline">History</span>
                             </>
                          )}
                       </button>
                    )}

                    <button 
                        onClick={onLogout}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                        title="Disconnect"
                    >
                        <Icons.Power size={18} />
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto relative scroll-smooth custom-scrollbar">
              {!isChatView ? (
                <ManagerDashboard 
                  agent={currentAgent} 
                  onToolClick={handleToolClick} 
                />
              ) : (
                <div className="p-6 md:p-12 space-y-8 min-h-full">
                  {messages.map((msg) => (
                    <ChatMessage 
                      key={msg.id} 
                      message={msg} 
                      agentColorClass={AGENTS[Object.values(AGENTS).find(a => a.name === msg.senderName)?.id || AgentId.MASTER].textColor}
                    />
                  ))}
                  {isListening && (
                      <div className="flex justify-center mt-6">
                         <span className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-xs font-mono text-cyan-300 animate-pulse shadow-[0_0_20px_rgba(8,145,178,0.1)]">
                            <Icons.Radio className="w-3.5 h-3.5" /> RECEIVING AUDIO STREAM...
                         </span>
                      </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="p-6 md:p-10 bg-gradient-to-t from-[#050508]/90 via-[#050508]/50 to-transparent shrink-0">
              <div className="max-w-4xl mx-auto relative">
                <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 transform hover:scale-110 transition-transform duration-200">
                  <PulsingMic 
                    isListening={isListening} 
                    isProcessing={isProcessing} 
                    onClick={handleMicClick}
                    accentColor={currentAgent.textColor}
                    ringColor={currentAgent.borderColor}
                  />
                </div>

                <div className="relative flex items-center bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 focus-within:border-cyan-500/30 focus-within:shadow-[0_0_40px_-10px_rgba(34,211,238,0.1)] focus-within:bg-slate-900/90 group backdrop-blur-md">
                  <div className="w-1.5 h-full absolute left-0 bg-slate-700/50 group-focus-within:bg-cyan-500 transition-all duration-500 shadow-[0_0_15px_currentColor]"></div>
                  <div className="pl-5">
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-3 rounded-lg hover:bg-white/5 transition-colors ${uploadedImage ? 'text-green-400' : 'text-slate-400 hover:text-white'}`}
                      >
                        <Icons.Paperclip size={20} />
                      </button>
                  </div>

                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleUserSubmit(inputText);
                      }
                    }}
                    placeholder="ENTER COMMAND OR SELECT TOOL..."
                    className="flex-1 bg-transparent border-none text-slate-200 placeholder-slate-600 px-6 py-6 focus:outline-none focus:ring-0 resize-none h-[4.5rem] max-h-32 font-mono text-sm tracking-widest"
                  />
                  <div className="w-24"></div>
                </div>
                
                <div className="mt-4 flex justify-between px-2 opacity-50 hover:opacity-100 transition-opacity">
                   <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest">Input Stream: Secure</span>
                   <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-widest">Jarvis v2.4</span>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;