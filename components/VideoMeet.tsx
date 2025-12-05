import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';

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

const VideoMeet: React.FC<VideoMeetProps> = ({ onLeave }) => {
  // Connection State
  const [peerId, setPeerId] = useState<string>('');
  const [roomId, setRoomId] = useState(''); // User entered room ID
  const [isInCall, setIsInCall] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Media State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<PeerStream[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [hasUnreadMsg, setHasUnreadMsg] = useState(false);

  // Refs
  const peerRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null); 
  const callsRef = useRef<any[]>([]); // Track active media calls
  const dataConnsRef = useRef<any[]>([]); // Track active data connections
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // Host Management
  const connectedPeersRef = useRef<Set<string>>(new Set()); 

  // --- Initialization ---
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setLocalStream(stream);
      } catch (err) {
        console.error("Failed to get local stream", err);
        setStatusMsg("Error: Camera/Mic access denied.");
      }
    };
    initMedia();

    // Handle abrupt tab closures to notify peers
    const handleBeforeUnload = () => {
       if (peerRef.current) {
          peerRef.current.destroy();
       }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Cleanup tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  // Sync Video Ref - FIXED: Added isInCall dependency to re-attach stream on view switch
  useEffect(() => {
    localStreamRef.current = localStream;
    if (localVideoRef.current && localStream) {
       localVideoRef.current.srcObject = localStream;
       localVideoRef.current.play().catch(e => console.log('Autoplay blocked:', e));
    }
  }, [localStream, isInCall]);

  // --- Mesh Network Logic ---

  // 1. Join Room Trigger
  const joinRoom = () => {
    if (!roomId || !localStream) return;
    setIsLoading(true);
    setStatusMsg("Connecting to Secure Channel...");

    // Try to become the HOST first by claiming the Room ID
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
      // We successfully claimed the ID -> We are HOST
      console.log('Opened as Host:', id);
      setPeerId(id);
      setIsInCall(true);
      setIsLoading(false);
      setupHostLogic(peer);
    });

    peer.on('error', (err: any) => {
      if (err.type === 'unavailable-id') {
        // ID taken -> Host exists -> We are GUEST
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
    // Create a random ID
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

      // Connect to Host for discovery
      const conn = peer.connect(roomId);
      setupDataConnection(conn);

      // Listen for 'welcome' message from Host containing peer list
      conn.on('open', () => {
         // Maybe send a 'hello'? Host should auto-send welcome on connection
      });
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
    
    // As Host, when someone connects via Data, we send them the list of current peers
    peer.on('connection', (conn: any) => {
       conn.on('open', () => {
          // Send current list (including myself) to the new user
          const peersList = Array.from(connectedPeersRef.current);
          // Add host (me) to list if not present, though guest handles connecting to me via this connection
          // Actually, Guest needs to call Me (Media).
          
          conn.send({
             type: 'room-info',
             peers: peersList // Send existing peers to new guy
          });

          // Add new guy to my registry
          connectedPeersRef.current.add(conn.peer);
          setupDataConnection(conn);
       });
    });
  };

  // 4. Common Events (Calls & Data)
  const setupCommonPeerEvents = (peer: any) => {
    // Handle Incoming Media Calls
    peer.on('call', (call: any) => {
      console.log('Incoming call from:', call.peer);
      call.answer(localStreamRef.current); // Answer with audio/video
      callsRef.current.push(call);
      
      // Subscribe to all health events
      subscribeToCallEvents(call);
    });

    // Handle Incoming Data Connections (Chat & Signaling)
    peer.on('connection', (conn: any) => {
      setupDataConnection(conn);
    });
  };

  // 4.5 Robust Call Event Subscription (Centralized logic for cleanup)
  const subscribeToCallEvents = (call: any) => {
      call.on('stream', (remoteStream: MediaStream) => {
        handleRemoteStream(call.peer, remoteStream);
      });

      // Standard Close
      call.on('close', () => {
          console.log('Call closed:', call.peer);
          removePeer(call.peer);
      });
      
      call.on('error', (err: any) => {
          console.error('Call error:', err);
          removePeer(call.peer);
      });

      // ICE State Monitoring (Critical for detecting tab closures)
      if (call.peerConnection) {
          call.peerConnection.oniceconnectionstatechange = () => {
              const state = call.peerConnection.iceConnectionState;
              if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                  console.log(`Peer ${call.peer} ICE state: ${state} -> removing`);
                  removePeer(call.peer);
              }
          };
      }
  };

  // 5. Data Connection Handler (Chat & Signaling)
  const setupDataConnection = (conn: any) => {
    dataConnsRef.current.push(conn);
    
    conn.on('data', (data: any) => {
      // Handle Chat
      if (data.type === 'chat') {
        setChatMessages(prev => [...prev, data.payload]);
        if (!showChat) setHasUnreadMsg(true);
      }

      // Handle Signaling (Guest receiving peer list)
      if (data.type === 'room-info' && data.peers) {
         // I am a guest, and I just got the list of other people in the room.
         // I need to connect to all of them.
         console.log('Received peer list:', data.peers);
         connectToPeers(data.peers);
         
         // Also call the sender (Host) if not already calling?
         // Note: We are already connected via Data to Host (conn).
         // We need to initiate Media call to Host.
         initiateMediaCall(conn.peer);
      }
    });

    conn.on('close', () => removePeer(conn.peer));
    conn.on('error', () => removePeer(conn.peer));

    // Monitor Data ICE state too
    if (conn.peerConnection) {
       conn.peerConnection.oniceconnectionstatechange = () => {
          const state = conn.peerConnection.iceConnectionState;
          if (state === 'disconnected' || state === 'failed' || state === 'closed') {
             removePeer(conn.peer);
          }
       };
    }
  };

  // 6. Connect to Mesh (Guest Logic)
  const connectToPeers = (peers: string[]) => {
     peers.forEach(targetId => {
         // Don't connect to self
         if (targetId === peerId) return;
         // Check if already connected
         if (callsRef.current.find(c => c.peer === targetId)) return;

         // Connect Data
         const conn = peerRef.current.connect(targetId);
         setupDataConnection(conn);

         // Connect Media
         initiateMediaCall(targetId);
     });
  };

  const initiateMediaCall = (targetId: string) => {
     if (!localStreamRef.current) return;
     // Check if call exists
     if (callsRef.current.find(c => c.peer === targetId)) return;

     console.log('Calling:', targetId);
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
    console.log(`Removing peer: ${id}`);
    setRemoteStreams(prev => prev.filter(p => p.peerId !== id));
    callsRef.current = callsRef.current.filter(c => c.peer !== id);
    dataConnsRef.current = dataConnsRef.current.filter(c => c.peer !== id);
    if (connectedPeersRef.current.has(id)) {
        connectedPeersRef.current.delete(id);
    }
  };

  // --- Features ---
  
  const stopScreenSharing = async () => {
    try {
      if (localStreamRef.current) {
         localStreamRef.current.getVideoTracks().forEach(track => track.stop());
      }
      const userStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = userStream.getVideoTracks()[0];
      
      callsRef.current.forEach(call => {
         const sender = call.peerConnection.getSenders().find((s:any) => s.track?.kind === 'video');
         if (sender) sender.replaceTrack(videoTrack);
      });

      setLocalStream(prev => {
         if (!prev) return userStream;
         return new MediaStream([videoTrack, ...prev.getAudioTracks()]);
      });

      setIsScreenSharing(false);
      setIsVideoOff(false); 
    } catch (err) {
      console.error("Failed to stop screen share", err);
    }
  };

  const toggleScreenShare = async () => {
    if (!localStream) return;
    if (isScreenSharing) {
      await stopScreenSharing();
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];

        screenTrack.onended = () => {
            stopScreenSharing();
        };

        const currentVideoTrack = localStream.getVideoTracks()[0];
        if (currentVideoTrack) currentVideoTrack.stop();

        callsRef.current.forEach(call => {
          const sender = call.peerConnection.getSenders().find((s:any) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });
        
        setLocalStream(prev => {
           if (!prev) return displayStream;
           return new MediaStream([screenTrack, ...prev.getAudioTracks()]);
        });

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
    
    // Broadcast to ALL connected peers (Mesh)
    dataConnsRef.current.forEach(conn => {
       if (conn.open) {
         conn.send({ type: 'chat', payload: msg });
       }
    });

    setChatInput("");
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoOff(!isVideoOff);
    }
  };

  // Scroll chat
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
           <span className="font-mono text-xs text-slate-400 hidden md:inline">{new Date().toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left: Video Area */}
        <div className="flex-1 flex flex-col relative p-4 gap-4 overflow-hidden">
             
             {/* LOBBY / JOIN SCREEN */}
             {!isInCall ? (
                <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                   <div className="flex flex-col lg:flex-row gap-12 w-full max-w-6xl items-center justify-center px-4">
                      
                      {/* Preview Card */}
                      <div className="relative w-full max-w-lg aspect-video bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-2xl shadow-cyan-900/20 group">
                         <video 
                           ref={localVideoRef} 
                           autoPlay 
                           muted 
                           playsInline
                           className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} 
                         />
                         
                         {isVideoOff && (
                             <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center">
                                   <Icons.User className="w-10 h-10 text-slate-600" />
                                </div>
                             </div>
                         )}

                         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                            <button 
                              onClick={toggleMute}
                              className={`p-4 rounded-full border transition-all ${isMuted ? 'bg-red-500 border-red-500 text-white' : 'bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700'}`}
                            >
                              {isMuted ? <Icons.MicOff size={20} /> : <Icons.Mic size={20} />}
                            </button>
                            <button 
                              onClick={toggleVideo}
                              className={`p-4 rounded-full border transition-all ${isVideoOff ? 'bg-red-500 border-red-500 text-white' : 'bg-slate-800/80 border-slate-600 text-white hover:bg-slate-700'}`}
                            >
                              {isVideoOff ? <Icons.VideoOff size={20} /> : <Icons.Video size={20} />}
                            </button>
                         </div>
                      </div>

                      {/* Join Controls */}
                      <div className="flex flex-col gap-6 w-full max-w-sm">
                         <div className="space-y-2">
                            <h2 className="text-3xl font-display font-bold text-white">Join Channel</h2>
                            <p className="text-slate-400 text-sm">Enter a channel name to create or join a secure mesh network.</p>
                         </div>

                         {isLoading ? (
                            <div className="flex flex-col gap-4 p-6 bg-slate-900/50 border border-slate-700 rounded-xl">
                               <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm animate-pulse">
                                  <Icons.Loader2 className="animate-spin" /> {statusMsg || "Establishing Uplink..."}
                               </div>
                               <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                                  <div className="h-full bg-cyan-500 animate-progress"></div>
                               </div>
                            </div>
                         ) : (
                            <div className="space-y-6">
                               <div className="flex gap-2">
                                  <div className="relative flex-1 group">
                                     <Icons.Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
                                     <input 
                                       type="text" 
                                       placeholder="e.g. DailyStandup" 
                                       value={roomId}
                                       onChange={(e) => setRoomId(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                                       onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
                                       className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                                     />
                                  </div>
                                  <button 
                                    onClick={joinRoom}
                                    disabled={!roomId}
                                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] whitespace-nowrap"
                                  >
                                    Join
                                  </button>
                               </div>
                               {statusMsg && <p className="text-red-400 text-xs font-mono">{statusMsg}</p>}
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             ) : (
                /* ACTIVE CALL GRID */
                <div className="flex-1 flex flex-col gap-4 relative z-10 w-full h-full">
                   
                   <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[minmax(200px,1fr)]">
                        {/* Local Video */}
                        <div className="relative bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-lg aspect-video md:aspect-auto">
                          <video 
                            ref={localVideoRef} 
                            autoPlay 
                            muted 
                            playsInline
                            className={`w-full h-full object-cover transform ${isScreenSharing ? '' : 'scale-x-[-1]'} ${isVideoOff ? 'opacity-0' : 'opacity-100'}`} 
                          />
                          <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur rounded text-white text-xs font-bold flex items-center gap-2">
                              <span>You</span>
                              {isScreenSharing && <Icons.Monitor className="w-3 h-3 text-green-400" />}
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
                      <div className="flex items-center gap-2 px-6 py-3 bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-full shadow-2xl">
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

// Helper component
const VideoFrame = ({ stream, peerId }: { stream: MediaStream, peerId: string }) => {
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