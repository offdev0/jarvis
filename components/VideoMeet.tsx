import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface VideoMeetProps {
  onLeave: () => void;
}

interface PeerStream {
  peerId: string;
  stream: MediaStream;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

interface TranscriptItem {
  senderId: string;
  text: string;
  timestamp: number;
}

type FilterType = 'none' | 'cyber' | 'terminator' | 'matrix' | 'blur' | 'mono' | 'rgb' | 'starfield';

const VideoMeet: React.FC<VideoMeetProps> = ({ onLeave }) => {
  // Connection State
  const [peerId, setPeerId] = useState<string>('');
  const [roomId, setRoomId] = useState(''); 
  const [isInCall, setIsInCall] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Media State
  const [processedStream, setProcessedStream] = useState<MediaStream | null>(null); // The stream sent to peers (from canvas)
  const [remoteStreams, setRemoteStreams] = useState<PeerStream[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Filter State
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [hasUnreadMsg, setHasUnreadMsg] = useState(false);

  // Read AI / Transcription State
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptItem[]>([]);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Refs for WebRTC & Canvas Processing
  const peerRef = useRef<any>(null);
  const rawVideoRef = useRef<HTMLVideoElement>(document.createElement('video')); // Hidden video for raw input
  const canvasRef = useRef<HTMLCanvasElement>(null); // The processor canvas
  const requestRef = useRef<number>(0); // Animation frame ID
  const localStreamRef = useRef<MediaStream | null>(null); 
  const callsRef = useRef<any[]>([]); 
  const dataConnsRef = useRef<any[]>([]); 
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const connectedPeersRef = useRef<Set<string>>(new Set()); 

  // --- Initialization & Media Pipeline ---
  useEffect(() => {
    const initMedia = async () => {
      try {
        setStatusMsg("Initializing Camera...");
        
        // 1. Get Raw Webcam with fallback constraints
        let rawStream: MediaStream;
        try {
            // Try HD first
            rawStream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
                audio: true 
            });
        } catch (e) {
            console.warn("HD constraints failed, falling back to basic config.", e);
            // Fallback to basic
            rawStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }

        // 2. Set up Raw Video Source (Hidden)
        if (rawVideoRef.current) {
            rawVideoRef.current.srcObject = rawStream;
            rawVideoRef.current.muted = true;
            rawVideoRef.current.playsInline = true;
            await rawVideoRef.current.play();
        }

        // 3. Set up Canvas Processing
        if (canvasRef.current) {
            // Initialize canvas size based on video
            // Wait a bit for metadata or just use loop to catch up
            
            const stream = canvasRef.current.captureStream(30); // 30 FPS
            
            // Merge the Audio from raw stream with Video from canvas
            const audioTrack = rawStream.getAudioTracks()[0];
            if (audioTrack) stream.addTrack(audioTrack);

            setProcessedStream(stream);
            localStreamRef.current = stream;
        }

        // 4. Start Processing Loop
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(processCanvasLoop);
        
        setStatusMsg("");

      } catch (err: any) {
        console.error("Failed to get local stream", err);
        setStatusMsg(`Error: ${err.name} - ${err.message}. Check camera permissions.`);
      }
    };

    initMedia();

    const handleBeforeUnload = () => {
       if (peerRef.current) peerRef.current.destroy();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (rawVideoRef.current && rawVideoRef.current.srcObject) {
         const stream = rawVideoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) peerRef.current.destroy();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // --- Canvas Effect Loop ---
  const processCanvasLoop = () => {
    if (!canvasRef.current || !rawVideoRef.current) {
        requestRef.current = requestAnimationFrame(processCanvasLoop);
        return;
    }
    
    const ctx = canvasRef.current.getContext('2d');
    const video = rawVideoRef.current;
    
    if (ctx && video.readyState >= 2) { // HAVE_CURRENT_DATA
        // Match canvas size to video if changed
        if (canvasRef.current.width !== video.videoWidth || canvasRef.current.height !== video.videoHeight) {
             canvasRef.current.width = video.videoWidth || 640;
             canvasRef.current.height = video.videoHeight || 480;
        }
        
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;

        // 1. Draw Base Video
        ctx.drawImage(video, 0, 0, width, height);
        
        // 2. Apply Active Filter
        applyFilterEffects(ctx, width, height);
    }

    requestRef.current = requestAnimationFrame(processCanvasLoop);
  };

  const applyFilterEffects = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const time = Date.now();

      switch (activeFilter) {
          case 'cyber':
              // Blue/Cyan Tint
              ctx.globalCompositeOperation = 'overlay';
              ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
              ctx.fillRect(0, 0, width, height);
              ctx.globalCompositeOperation = 'source-over';
              
              // Scanlines
              ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
              for (let i = 0; i < height; i += 4) {
                 if ((i + Math.floor(time / 10)) % 8 === 0) {
                     ctx.fillRect(0, i, width, 2);
                 }
              }
              
              // HUD Corners
              ctx.strokeStyle = '#00ffff';
              ctx.lineWidth = 5;
              ctx.strokeRect(50, 50, 50, 50); 
              ctx.beginPath();
              ctx.moveTo(50, 50); ctx.lineTo(100, 50); ctx.lineTo(50, 100);
              ctx.stroke();
              break;

          case 'terminator':
              // Red Tint
              ctx.globalCompositeOperation = 'multiply';
              ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
              ctx.fillRect(0, 0, width, height);
              ctx.globalCompositeOperation = 'source-over';
              
              // Text Overlay
              ctx.font = '30px monospace';
              ctx.fillStyle = 'red';
              ctx.fillText('TARGET: LOCKED', 50, 50);
              ctx.fillText(`THREAT: ${(Math.sin(time / 500) * 100).toFixed(0)}%`, 50, 90);
              
              // Crosshair
              ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(width/2, height/2, 50, 0, Math.PI * 2);
              ctx.moveTo(width/2 - 70, height/2); ctx.lineTo(width/2 + 70, height/2);
              ctx.moveTo(width/2, height/2 - 70); ctx.lineTo(width/2, height/2 + 70);
              ctx.stroke();
              break;

          case 'matrix':
              // Green Code Rain Effect
              ctx.globalCompositeOperation = 'source-over';
              ctx.fillStyle = 'rgba(0, 50, 0, 0.3)'; // Darken background slightly
              ctx.fillRect(0, 0, width, height);
              
              ctx.font = '20px monospace';
              ctx.fillStyle = '#0f0';
              for (let x = 0; x < width; x += 30) {
                  // Pseudo-random rain based on time and x pos
                  const offset = (x * 7) % height;
                  const speed = ((x % 5) + 2);
                  const y = (time / 5 * speed + offset) % height;
                  
                  const char = String.fromCharCode(0x30A0 + (Math.floor(time/100 + x) % 96));
                  ctx.fillText(char, x, y);
                  
                  // Trail
                  ctx.globalAlpha = 0.5;
                  ctx.fillText(char, x, y - 20);
                  ctx.globalAlpha = 1.0;
              }
              break;
          
          case 'mono':
              // Grayscale via Global Composite
              ctx.globalCompositeOperation = 'saturation';
              ctx.fillStyle = '#000';
              ctx.fillRect(0, 0, width, height);
              ctx.globalCompositeOperation = 'source-over';
              break;

          case 'blur':
             // Privacy Blur (Pixelation)
             const size = 15;
             // We can't easily do full Gaussian blur in real-time on 2D context without big perf hit.
             // Pixelation is a cool "Privacy" effect.
             
             // Create a temporary canvas or just draw small then scale up?
             // Actually, a simple overlay pattern works too.
             // Let's do a "Frosted Glass" simulation by drawing white with opacity
             ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
             ctx.fillRect(0, 0, width, height);
             ctx.font = '40px sans-serif';
             ctx.fillStyle = '#000';
             ctx.textAlign = 'center';
             ctx.fillText("PRIVACY MODE", width/2, height/2);
             break;
             
          case 'rgb':
              // RGB Split / Glitch
              const offsetR = Math.sin(time / 200) * 10;
              const offsetG = Math.cos(time / 200) * 10;
              
              // We need to access image data to do this properly, which is slow.
              // Fake it by drawing the video multiple times with composite operations.
              
              ctx.globalCompositeOperation = 'screen';
              
              // Red channel shift
              ctx.globalAlpha = 0.5;
              ctx.drawImage(rawVideoRef.current!, offsetR, 0, width, height);
              
              // Blue channel shift
              ctx.drawImage(rawVideoRef.current!, -offsetR, 0, width, height);
              
              ctx.globalAlpha = 1.0;
              ctx.globalCompositeOperation = 'source-over';
              break;

          case 'starfield':
              // Space Background simulation (Additive)
              ctx.globalCompositeOperation = 'lighter';
              ctx.fillStyle = '#fff';
              for (let i = 0; i < 50; i++) {
                  const x = (Math.sin(i * 123 + time / 1000) * width + width) % width;
                  const y = (Math.cos(i * 321 + time / 1000) * height + height) % height;
                  const s = (i % 3) + 1;
                  ctx.fillRect(x, y, s, s);
              }
              ctx.globalCompositeOperation = 'source-over';
              break;
      }
  };

  // --- Speech Recognition Setup (Read AI) ---
  useEffect(() => {
    if (isInCall && !recognitionRef.current) {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false; // Only send final results to reduce noise
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                const lastResultIndex = event.results.length - 1;
                const transcript = event.results[lastResultIndex][0].transcript;
                
                if (transcript.trim()) {
                    const item: TranscriptItem = {
                        senderId: peerId || 'Me',
                        text: transcript,
                        timestamp: Date.now()
                    };
                    setTranscriptHistory(prev => [...prev, item]);
                    broadcastData({ type: 'transcript', payload: item });
                }
            };
            
            recognition.onend = () => {
                if (isInCall) {
                    try { recognition.start(); } catch(e) {}
                }
            };

            try {
                recognition.start();
                recognitionRef.current = recognition;
            } catch (e) {
                console.error("Speech Rec start failed", e);
            }
        }
    }
  }, [isInCall, peerId]);


  // --- Mesh Network Logic ---

  // 1. Join Room Trigger
  const joinRoom = () => {
    if (!roomId || !localStreamRef.current) return;
    setIsLoading(true);
    setStatusMsg("Connecting to Secure Channel...");

    const peer = new (window as any).Peer(roomId, { 
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('open', (id: string) => {
      console.log('Opened as Host:', id);
      setPeerId(id);
      setIsInCall(true);
      setIsLoading(false);
      setupHostLogic(peer);
    });

    peer.on('error', (err: any) => {
      if (err.type === 'unavailable-id') {
        console.log('Room ID taken, joining as Guest...');
        peer.destroy();
        initGuestMode();
      } else {
        console.error('Peer Error:', err);
        setStatusMsg(`Connection Error: ${err.type}`);
        setIsLoading(false);
      }
    });

    peerRef.current = peer;
  };

  // 2. Guest Mode Initialization
  const initGuestMode = () => {
    const peer = new (window as any).Peer(undefined, {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('open', (id: string) => {
      console.log('Opened as Guest:', id);
      setPeerId(id);
      setIsInCall(true);
      setIsLoading(false);
      const conn = peer.connect(roomId);
      setupDataConnection(conn);
    });

    peer.on('error', (err: any) => {
      console.error('Guest Peer Error:', err);
      setStatusMsg("Failed to join room.");
      setIsLoading(false);
    });

    setupCommonPeerEvents(peer);
    peerRef.current = peer;
  };

  // 3. Host Logic
  const setupHostLogic = (peer: any) => {
    setupCommonPeerEvents(peer);
    peer.on('connection', (conn: any) => {
       conn.on('open', () => {
          const peersList = Array.from(connectedPeersRef.current);
          conn.send({
             type: 'room-info',
             peers: peersList 
          });
          connectedPeersRef.current.add(conn.peer);
          setupDataConnection(conn);
       });
    });
  };

  // 4. Common Events (Calls & Data)
  const setupCommonPeerEvents = (peer: any) => {
    peer.on('call', (call: any) => {
      // Answer with the PROCESSED stream (Canvas)
      call.answer(localStreamRef.current); 
      callsRef.current.push(call);
      subscribeToCallEvents(call);
    });

    peer.on('connection', (conn: any) => {
      setupDataConnection(conn);
    });
  };

  const subscribeToCallEvents = (call: any) => {
      call.on('stream', (remoteStream: MediaStream) => {
        handleRemoteStream(call.peer, remoteStream);
      });
      call.on('close', () => removePeer(call.peer));
      call.on('error', () => removePeer(call.peer));
  };

  // 5. Data Connection Handler (Chat & Signaling)
  const setupDataConnection = (conn: any) => {
    dataConnsRef.current.push(conn);
    conn.on('data', (data: any) => {
      if (data.type === 'chat') {
        setChatMessages(prev => [...prev, data.payload]);
        if (!showChat) setHasUnreadMsg(true);
      }
      if (data.type === 'transcript') {
         setTranscriptHistory(prev => [...prev, data.payload]);
      }
      if (data.type === 'room-info' && data.peers) {
         connectToPeers(data.peers);
         initiateMediaCall(conn.peer);
      }
    });
    conn.on('close', () => removePeer(conn.peer));
  };

  const broadcastData = (data: any) => {
      dataConnsRef.current.forEach(conn => {
          if (conn.open) conn.send(data);
      });
  };

  const connectToPeers = (peers: string[]) => {
     peers.forEach(targetId => {
         if (targetId === peerId) return;
         if (callsRef.current.find(c => c.peer === targetId)) return;
         const conn = peerRef.current.connect(targetId);
         setupDataConnection(conn);
         initiateMediaCall(targetId);
     });
  };

  const initiateMediaCall = (targetId: string) => {
     if (!localStreamRef.current) return;
     if (callsRef.current.find(c => c.peer === targetId)) return;
     // Call with PROCESSED stream
     const call = peerRef.current.call(targetId, localStreamRef.current);
     callsRef.current.push(call);
     subscribeToCallEvents(call);
  };

  const handleRemoteStream = (peerId: string, stream: MediaStream) => {
    setRemoteStreams(prev => {
        if (prev.find(p => p.peerId === peerId)) return prev;
        return [...prev, { peerId, stream }];
    });
  };

  const removePeer = (id: string) => {
    setRemoteStreams(prev => prev.filter(p => p.peerId !== id));
    callsRef.current = callsRef.current.filter(c => c.peer !== id);
    dataConnsRef.current = dataConnsRef.current.filter(c => c.peer !== id);
    if (connectedPeersRef.current.has(id)) {
        connectedPeersRef.current.delete(id);
    }
  };

  // --- Features ---
  
  const generateMeetingSummary = async () => {
     if (transcriptHistory.length === 0) {
         setAiSummaryText("No transcription data available to summarize.");
         return;
     }

     setIsGeneratingSummary(true);
     setAiSummaryText("");
     
     try {
         const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
         const fullTranscript = transcriptHistory
            .map(t => `[${new Date(t.timestamp).toLocaleTimeString()} - ${t.senderId}]: ${t.text}`)
            .join('\n');

         const prompt = `
            You are 'Read AI', an intelligent meeting secretary. 
            Analyze the following meeting transcript and generate a structured report.
            TRANSCRIPT:
            ${fullTranscript}
         `;

         const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
         });
         
         setAiSummaryText(result.text || "No summary generated.");

     } catch (e) {
         console.error("AI Summary Gen failed", e);
         setAiSummaryText("Failed to generate summary. Please try again.");
     } finally {
         setIsGeneratingSummary(false);
     }
  };

  const stopScreenSharing = async () => {
    // Revert to canvas stream
    if (canvasRef.current) {
        const stream = canvasRef.current.captureStream(30);
        // Add Audio track back
        const rawVideo = rawVideoRef.current.srcObject as MediaStream;
        if(rawVideo) {
            const audioTrack = rawVideo.getAudioTracks()[0];
            if (audioTrack) stream.addTrack(audioTrack);
        }
        
        callsRef.current.forEach(call => {
           const sender = call.peerConnection.getSenders().find((s:any) => s.track?.kind === 'video');
           if (sender) sender.replaceTrack(stream.getVideoTracks()[0]);
        });

        setProcessedStream(stream);
        localStreamRef.current = stream;
        setIsScreenSharing(false);
    }
  };

  const toggleScreenShare = async () => {
    if (!processedStream) return;
    if (isScreenSharing) {
      await stopScreenSharing();
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];

        screenTrack.onended = () => {
            stopScreenSharing();
        };

        callsRef.current.forEach(call => {
          const sender = call.peerConnection.getSenders().find((s:any) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });
        
        // Temporarily bypass canvas for local view
        setProcessedStream(displayStream);
        localStreamRef.current = displayStream;

        setIsScreenSharing(true);
        setIsVideoOff(false);
      } catch (e) {
        console.error("Error starting screen share", e);
      }
    }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: peerId,
      text: chatInput,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, msg]);
    broadcastData({ type: 'chat', payload: msg });
    setChatInput("");
  };

  const toggleMute = () => {
    if (processedStream) {
      processedStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (processedStream) {
      // NOTE: For canvas stream, "disabling" track sends black frame but keeps timing. 
      // We can just stop drawing to canvas or overlay black.
      processedStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoOff(!isVideoOff);
    }
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
    if (showChat) {
      setHasUnreadMsg(false);
    }
  }, [chatMessages, showChat]);

  // --- Render ---

  return (
    <div className="flex flex-col h-full bg-[#0a0f16] relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      
      {/* HIDDEN RAW VIDEO (Source for Canvas) */}
      {/* We don't render this, but keep it in DOM just in case, or use ref directly. 
          Actually useRef does not need DOM attachment for video processing usually, 
          but attaching it helps debugging. Hidden. */}
      {/* Canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute inset-0 bg-grid-advanced opacity-20 pointer-events-none"></div>
      
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
             <Icons.Video className="text-cyan-400 w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-widest text-slate-200">SECURE MEET</span>
        </div>
        <div className="flex items-center gap-4">
           {isInCall && (
              <div className="px-3 py-1 bg-slate-800 rounded border border-slate-700 flex items-center gap-2">
                 <span className="text-[10px] text-slate-500 uppercase">Room:</span>
                 <span className="text-xs font-mono text-white font-bold">{roomId}</span>
              </div>
           )}
           <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${isInCall ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
             {isInCall ? 'Encrypted Mesh' : 'Offline'}
           </div>
           
           {/* READ AI STATUS */}
           {isInCall && (
               <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full">
                  <Icons.Bot className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] font-mono text-indigo-300">READ AI LISTENING</span>
               </div>
           )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left: Video Area */}
        <div className="flex-1 flex flex-col relative p-4 gap-4 overflow-hidden">
             
             {/* LOBBY / JOIN SCREEN */}
             {!isInCall ? (
                <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-6">
                    {/* Decorative background elements specific to lobby */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none"></div>

                    <div className="flex flex-col lg:flex-row gap-16 w-full max-w-7xl items-center justify-center">
                        
                        {/* LEFT: Video Preview Module */}
                        <div className="relative w-full max-w-2xl group perspective-1000">
                            {/* Holographic Frame */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/50 to-blue-600/50 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
                            
                            <div className="relative bg-[#050910] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                                {/* Header Strip */}
                                <div className="absolute top-0 left-0 right-0 h-8 bg-black/60 backdrop-blur-sm border-b border-white/10 z-20 flex items-center justify-between px-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                        <span className="text-[10px] font-mono text-slate-300 tracking-widest uppercase">Live Feed // Preview</span>
                                    </div>
                                    <Icons.Maximize2 size={12} className="text-slate-500" />
                                </div>

                                {/* Video Element (Canvas Stream) */}
                                <div className="relative aspect-video bg-black/80">
                                     <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none z-10"></div>
                                     
                                     {/* We render the PROCESSED stream here */}
                                     <VideoPreview stream={processedStream} isVideoOff={isVideoOff} />
                                     
                                     {/* Corner Reticles */}
                                     <div className="absolute top-10 left-4 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50 z-10"></div>
                                     <div className="absolute top-10 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50 z-10"></div>
                                     <div className="absolute bottom-20 left-4 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50 z-10"></div>
                                     <div className="absolute bottom-20 right-4 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50 z-10"></div>
                                </div>

                                {/* Bottom Controls Bar */}
                                <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-black/90 to-transparent z-20 flex items-center justify-center gap-6 pb-2">
                                     <button 
                                        onClick={toggleMute}
                                        className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-300 group/btn ${isMuted ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800/60 border-slate-600 text-slate-200 hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-cyan-300'}`}
                                     >
                                         {isMuted ? <Icons.MicOff size={20} /> : <Icons.Mic size={20} />}
                                     </button>
                                     
                                     <button 
                                        onClick={toggleVideo}
                                        className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-300 group/btn ${isVideoOff ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-800/60 border-slate-600 text-slate-200 hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-cyan-300'}`}
                                     >
                                         {isVideoOff ? <Icons.VideoOff size={20} /> : <Icons.Video size={20} />}
                                     </button>

                                     {/* EFFECTS TOGGLE */}
                                     <button 
                                        onClick={() => setShowEffectsPanel(!showEffectsPanel)}
                                        className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-300 group/btn ${showEffectsPanel ? 'bg-purple-500/20 border-purple-400 text-purple-300' : 'bg-slate-800/60 border-slate-600 text-slate-200 hover:bg-purple-500/20 hover:border-purple-400 hover:text-purple-300'}`}
                                     >
                                         <Icons.Wand2 size={20} />
                                     </button>
                                </div>
                            </div>
                            
                            {/* Effects Panel */}
                            {showEffectsPanel && (
                                <div className="absolute -bottom-24 left-0 right-0 bg-[#0a0f16] border border-slate-700 rounded-xl p-4 shadow-xl z-30 animate-in slide-in-from-top-2">
                                   <div className="flex justify-between items-center mb-2">
                                       <span className="text-xs font-mono uppercase text-slate-400">Visual Augmentation</span>
                                       <button onClick={() => setShowEffectsPanel(false)}><Icons.X size={14} /></button>
                                   </div>
                                   <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                       {[
                                           { id: 'none', label: 'None', color: 'slate' },
                                           { id: 'cyber', label: 'Holo', color: 'cyan' },
                                           { id: 'terminator', label: 'T-800', color: 'red' },
                                           { id: 'matrix', label: 'Matrix', color: 'green' },
                                           { id: 'rgb', label: 'Glitch', color: 'pink' },
                                           { id: 'starfield', label: 'Space', color: 'indigo' },
                                           { id: 'blur', label: 'Privacy', color: 'white' },
                                           { id: 'mono', label: 'B&W', color: 'gray' }
                                       ].map((filter) => (
                                           <button
                                               key={filter.id}
                                               onClick={() => setActiveFilter(filter.id as FilterType)}
                                               className={`px-3 py-2 rounded text-xs font-bold border transition-all whitespace-nowrap ${activeFilter === filter.id ? `bg-${filter.color}-500/20 border-${filter.color}-500 text-${filter.color}-400` : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                           >
                                               {filter.label}
                                           </button>
                                       ))}
                                   </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Login Form */}
                        <div className="w-full max-w-md">
                            <div className="bg-[#050910]/80 border border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-xl relative overflow-hidden">
                                {/* Decorative Top Line */}
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-2">
                                         <div className="p-2 bg-cyan-950/50 rounded border border-cyan-800 text-cyan-400">
                                             <Icons.ShieldCheck size={20} />
                                         </div>
                                         <h2 className="text-2xl font-display font-bold text-white tracking-wide">SECURE UPLINK</h2>
                                    </div>
                                    <p className="text-slate-400 text-sm font-light">
                                       Enter a channel frequency ID to establish a secure peer-to-peer mesh connection.
                                    </p>
                                </div>

                                {isLoading ? (
                                     <div className="py-10 flex flex-col items-center justify-center text-center">
                                         <div className="relative w-16 h-16 mb-6">
                                             <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                                             <div className="absolute inset-0 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
                                             <Icons.Cpu className="absolute inset-0 m-auto text-cyan-400 animate-pulse" size={24} />
                                         </div>
                                         <h3 className="text-lg font-display font-bold text-white mb-2">HANDSHAKING</h3>
                                         <p className="text-xs font-mono text-cyan-500 animate-pulse">{statusMsg || "Negotiating ICE Candidates..."}</p>
                                     </div>
                                ) : (
                                     <div className="space-y-6">
                                         <div className="space-y-2">
                                             <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest ml-1">Channel Frequency (Room ID)</label>
                                             <div className="relative group">
                                                 <div className="absolute inset-0 bg-cyan-500/20 rounded-lg blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                                                 <div className="relative flex items-center bg-[#0a0f16] border border-slate-700 rounded-lg overflow-hidden group-focus-within:border-cyan-500 transition-colors">
                                                     <div className="pl-4 pr-3 text-slate-500">
                                                        <Icons.Hash size={18} />
                                                     </div>
                                                     <input 
                                                        type="text" 
                                                        placeholder="ENTER_ID" 
                                                        value={roomId}
                                                        onChange={(e) => setRoomId(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                                                        onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                                                        className="w-full bg-transparent border-none py-4 text-white placeholder-slate-600 focus:ring-0 font-mono text-lg tracking-widest uppercase"
                                                     />
                                                 </div>
                                             </div>
                                         </div>

                                         <button 
                                            onClick={joinRoom}
                                            disabled={!roomId}
                                            className="w-full group relative overflow-hidden rounded-lg bg-cyan-600 p-[1px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                         >
                                            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2E8F0_0%,#06B6D4_50%,#E2E8F0_100%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-lg bg-slate-950 px-8 py-4 text-sm font-bold text-white backdrop-blur-3xl transition-all group-hover:bg-cyan-950/80">
                                               <Icons.Zap size={18} className="mr-2 text-cyan-400 group-hover:animate-pulse" />
                                               INITIATE CONNECTION
                                            </span>
                                         </button>

                                         {statusMsg && (
                                            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded flex items-center gap-2 text-red-400 text-xs font-mono">
                                               <Icons.AlertCircle size={14} />
                                               {statusMsg}
                                            </div>
                                         )}
                                     </div>
                                )}
                                
                                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
                                    <span>Encryption: AES-256</span>
                                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> System Ready</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             ) : (
                /* ACTIVE CALL GRID */
                <div className="flex-1 flex flex-col gap-4 relative z-10 w-full h-full">
                   
                   {/* Live Transcript Ticker Overlay */}
                   {transcriptHistory.length > 0 && (
                       <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
                           <div className="max-w-2xl mx-auto bg-black/60 backdrop-blur-md rounded-full px-6 py-2 border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                               <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                               <span className="text-[10px] font-mono text-indigo-300 whitespace-nowrap">{transcriptHistory[transcriptHistory.length - 1].senderId.substring(0,8)}:</span>
                               <span className="text-sm text-white truncate font-medium">{transcriptHistory[transcriptHistory.length - 1].text}</span>
                           </div>
                       </div>
                   )}

                   <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[minmax(200px,1fr)]">
                        {/* Local Video */}
                        <div className="relative bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-lg aspect-video md:aspect-auto">
                           {/* Using VideoPreview component for processed stream */}
                           <VideoPreview stream={processedStream} isVideoOff={isVideoOff} />
                          
                          <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur rounded text-white text-xs font-bold flex items-center gap-2">
                              <span>You</span>
                              {isScreenSharing && <Icons.Monitor className="w-3 h-3 text-green-400" />}
                              {activeFilter !== 'none' && <span className="text-[10px] text-cyan-400 font-mono">[{activeFilter.toUpperCase()}]</span>}
                          </div>
                          {isVideoOff && (
                              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                                    <Icons.User className="w-6 h-6 text-slate-600" />
                                  </div>
                              </div>
                          )}
                        </div>

                        {/* Remote Videos */}
                        {remoteStreams.map((peer) => (
                          <VideoFrame key={peer.peerId} stream={peer.stream} peerId={peer.peerId} />
                        ))}
                      </div>
                   </div>

                   {/* Controls Bar */}
                   <div className="h-20 flex items-center justify-center gap-4 shrink-0">
                      <div className="flex items-center gap-2 px-6 py-3 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full shadow-2xl relative">
                         
                         {/* Effects Popup (When active in call) */}
                         {showEffectsPanel && (
                                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#0a0f16] border border-slate-700 rounded-xl p-3 shadow-xl z-30 animate-in slide-in-from-bottom-2 w-max max-w-[90vw] overflow-x-auto">
                                   <div className="flex gap-2 custom-scrollbar">
                                       {[
                                           { id: 'none', label: 'None', color: 'slate' },
                                           { id: 'cyber', label: 'Holo', color: 'cyan' },
                                           { id: 'terminator', label: 'T-800', color: 'red' },
                                           { id: 'matrix', label: 'Matrix', color: 'green' },
                                           { id: 'rgb', label: 'Glitch', color: 'pink' },
                                           { id: 'starfield', label: 'Space', color: 'indigo' },
                                           { id: 'blur', label: 'Privacy', color: 'white' },
                                           { id: 'mono', label: 'B&W', color: 'gray' }
                                       ].map((filter) => (
                                           <button
                                               key={filter.id}
                                               onClick={() => setActiveFilter(filter.id as FilterType)}
                                               className={`px-3 py-2 rounded text-xs font-bold border transition-all whitespace-nowrap ${activeFilter === filter.id ? `bg-${filter.color}-500/20 border-${filter.color}-500 text-${filter.color}-400` : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                           >
                                               {filter.label}
                                           </button>
                                       ))}
                                   </div>
                                </div>
                         )}

                         <button 
                           onClick={toggleMute}
                           className={`p-3 rounded-full transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
                           title="Toggle Mute"
                         >
                            {isMuted ? <Icons.MicOff size={20} /> : <Icons.Mic size={20} />}
                         </button>
                         
                         <button 
                           onClick={toggleVideo}
                           className={`p-3 rounded-full transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
                           title="Toggle Camera"
                         >
                            {isVideoOff ? <Icons.VideoOff size={20} /> : <Icons.Video size={20} />}
                         </button>
                         
                         <button 
                            onClick={() => setShowEffectsPanel(!showEffectsPanel)}
                            className={`p-3 rounded-full transition-all ${showEffectsPanel ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-purple-500/50'}`}
                            title="Visual Effects"
                         >
                             <Icons.Wand2 size={20} />
                         </button>

                         <button 
                           onClick={toggleScreenShare}
                           className={`p-3 rounded-full transition-all ${isScreenSharing ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
                           title={isScreenSharing ? "Stop Sharing" : "Share Screen"}
                         >
                            <Icons.MonitorUp size={20} />
                         </button>
                         
                         <button 
                           onClick={() => setShowChat(!showChat)}
                           className={`p-3 rounded-full transition-all relative ${showChat ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
                           title="Chat"
                         >
                            <Icons.MessageSquare size={20} />
                            {hasUnreadMsg && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></span>}
                         </button>

                         {/* READ AI BUTTON */}
                         <button 
                           onClick={() => {
                               setShowAiSummary(true);
                               generateMeetingSummary();
                           }}
                           className="flex items-center gap-2 px-4 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all ml-2"
                           title="Generate Meeting Notes"
                         >
                            <Icons.Sparkles size={18} />
                            <span className="hidden md:inline text-sm">Read AI</span>
                         </button>

                         <div className="w-[1px] h-8 bg-slate-700 mx-2"></div>

                         <button 
                           onClick={onLeave}
                           className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-sm tracking-wide transition-colors flex items-center gap-2"
                         >
                            <Icons.PhoneOff size={18} />
                            Leave
                         </button>
                      </div>
                   </div>

                </div>
             )}
        </div>

        {/* Read AI Summary Modal / Slide-over */}
        {showAiSummary && (
             <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end">
                <div className="w-full max-w-lg bg-slate-900 h-full border-l border-indigo-500/30 flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-indigo-950/30">
                        <div className="flex items-center gap-3">
                             <div className="p-2 bg-indigo-500/20 rounded-lg">
                                 <Icons.Bot className="w-6 h-6 text-indigo-400" />
                             </div>
                             <div>
                                 <h2 className="text-xl font-display font-bold text-white">Read AI</h2>
                                 <p className="text-xs text-indigo-300 font-mono">INTELLIGENT MEETING NOTES</p>
                             </div>
                        </div>
                        <button onClick={() => setShowAiSummary(false)} className="text-slate-400 hover:text-white">
                            <Icons.X size={24} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {isGeneratingSummary ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-4">
                                <Icons.Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                                <p className="text-sm font-mono text-indigo-300 animate-pulse">ANALYZING AUDIO STREAMS...</p>
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-indigo max-w-none">
                                {aiSummaryText ? (
                                    <div className="whitespace-pre-wrap">{aiSummaryText}</div>
                                ) : (
                                    <p className="text-slate-500 italic">No summary generated yet.</p>
                                )}
                            </div>
                        )}
                        
                        {/* Transcript Raw Log */}
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Raw Transcript</h3>
                            <div className="space-y-2 text-xs font-mono text-slate-400 max-h-64 overflow-y-auto bg-black/30 p-4 rounded-lg">
                                {transcriptHistory.map((t, i) => (
                                    <div key={i}>
                                        <span className="text-indigo-400">[{new Date(t.timestamp).toLocaleTimeString()}] {t.senderId}:</span> {t.text}
                                    </div>
                                ))}
                                {transcriptHistory.length === 0 && <div>Waiting for speech...</div>}
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-4 border-t border-white/10 bg-black/20">
                         <button 
                            onClick={generateMeetingSummary} 
                            disabled={isGeneratingSummary}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold flex items-center justify-center gap-2"
                         >
                            <Icons.RefreshCw size={16} className={isGeneratingSummary ? 'animate-spin' : ''} />
                            Regenerate Summary
                         </button>
                    </div>
                </div>
             </div>
        )}

        {/* Right: Chat Sidebar */}
        <div className={`transition-all duration-300 ease-in-out border-l border-slate-800 bg-slate-900/95 backdrop-blur-xl flex flex-col ${showChat ? 'w-80 translate-x-0' : 'w-0 translate-x-full opacity-0 overflow-hidden'}`}>
             <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-black/20">
                <span className="font-display font-bold text-slate-200 tracking-wider">MESH CHAT</span>
                <button onClick={() => setShowChat(false)} className="text-slate-500 hover:text-white">
                   <Icons.X size={18} />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatScrollRef}>
                {chatMessages.length === 0 && (
                   <div className="text-center text-slate-600 text-xs font-mono mt-10">No messages yet.</div>
                )}
                {chatMessages.map((msg, idx) => (
                   <div key={idx} className={`flex flex-col ${msg.senderId === peerId ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-[10px] text-slate-500 font-mono">
                           {msg.senderId === peerId ? 'You' : `${msg.senderId.substring(0,4)}...`}
                         </span>
                         <span className="text-[9px] text-slate-700">{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className={`px-3 py-2 rounded-lg text-sm max-w-[90%] break-words ${msg.senderId === peerId ? 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-100' : 'bg-slate-800 border border-slate-700 text-slate-300'}`}>
                         {msg.text}
                      </div>
                   </div>
                ))}
             </div>

             <div className="p-4 border-t border-slate-800 bg-black/20">
                <div className="flex gap-2">
                   <input 
                     type="text" 
                     value={chatInput}
                     onChange={(e) => setChatInput(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                     placeholder="Type message..." 
                     className="flex-1 bg-slate-800 border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                   />
                   <button 
                     onClick={sendChat}
                     disabled={!chatInput.trim()}
                     className="p-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      <Icons.Send size={16} />
                   </button>
                </div>
             </div>
        </div>

      </div>
      
      <style>{`
         @keyframes progress {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
         }
         .animate-progress {
            animation: progress 2s ease-in-out infinite;
         }
      `}</style>
    </div>
  );
};

// Reusable Video Preview Component to handle refs and props cleanly
const VideoPreview: React.FC<{ stream: MediaStream | null; isVideoOff: boolean }> = ({ stream, isVideoOff }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline
            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} 
        />
    );
}

// Helper component
const VideoFrame: React.FC<{ stream: MediaStream; peerId: string }> = ({ stream, peerId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
       setIsMuted(!audioTrack.enabled);
    }
  }, [stream]);

  const toggleMute = (e: React.MouseEvent) => {
     e.stopPropagation();
     const audioTracks = stream.getAudioTracks();
     if (audioTracks.length === 0) return;
     
     const shouldEnable = isMuted; // Toggle: if muted(true), make enabled(true)
     audioTracks.forEach(track => {
         track.enabled = shouldEnable;
     });
     setIsMuted(!shouldEnable);
  };

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-lg group aspect-video md:aspect-auto">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline
        className="w-full h-full object-cover" 
      />
      <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur rounded text-white text-xs font-bold truncate max-w-[80%]">
        {peerId.substring(0, 6)}...
      </div>

      <button 
        onClick={toggleMute}
        className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all ${isMuted ? 'bg-red-500/80 text-white' : 'bg-black/40 text-white opacity-0 group-hover:opacity-100'}`}
        title={isMuted ? "Unmute" : "Mute"}
      >
         {isMuted ? <Icons.VolumeX size={16} /> : <Icons.Volume2 size={16} />}
      </button>
    </div>
  );
};

export default VideoMeet;