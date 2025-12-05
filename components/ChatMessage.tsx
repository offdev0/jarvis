import React, { useState } from 'react';
import { Message } from '../types';
import * as Icons from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
  agentColorClass: string;
}

const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const isHtml = language === 'html' || language === 'xml'; 
  const content = String(children).replace(/\n$/, '');
  
  const [showPreview, setShowPreview] = useState(false);

  if (!inline && isHtml) {
     return (
       <div className="my-4 w-full max-w-full rounded-lg border border-slate-700/80 overflow-hidden bg-[#0d1117] shadow-lg">
          {/* Header with Toggles */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700 backdrop-blur-sm">
             <div className="flex items-center gap-2 min-w-0">
               <div className="flex gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
               </div>
               <span className="text-[10px] font-mono text-slate-400 ml-2 uppercase tracking-wider truncate">HTML Preview</span>
             </div>
             
             <div className="flex bg-black/50 rounded p-0.5 border border-slate-700/50 shrink-0">
                <button 
                  onClick={() => setShowPreview(false)} 
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${!showPreview ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                   <Icons.Code2 size={12} />
                   Code
                </button>
                <button 
                  onClick={() => setShowPreview(true)} 
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${showPreview ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                   <Icons.Eye size={12} />
                   Preview
                </button>
             </div>
          </div>
          
          {showPreview ? (
             <div className="relative w-full h-[500px] bg-white transition-all duration-300">
               <iframe 
                 srcDoc={content} 
                 className="w-full h-full border-none" 
                 sandbox="allow-scripts allow-modals"
                 title="Preview"
               />
             </div>
          ) : (
             <div className="w-full overflow-x-auto custom-scrollbar">
                <pre className="p-4 text-sm text-slate-300 font-mono leading-relaxed bg-[#0d1117] min-w-full w-fit">
                    <code className={className} {...props}>
                    {children}
                    </code>
                </pre>
             </div>
          )}
       </div>
     )
  }

  return !inline ? (
    <div className="w-full my-4 overflow-hidden rounded-lg border border-slate-700 bg-[#0d1117] shadow-inner">
       <div className="w-full overflow-x-auto custom-scrollbar">
          <pre className="p-4 text-sm text-slate-300 min-w-full w-fit">
            <code className={className} {...props}>
                {children}
            </code>
          </pre>
       </div>
    </div>
  ) : (
    <code className="bg-slate-800/80 text-cyan-200 px-1.5 py-0.5 rounded text-xs font-mono border border-white/10 break-all" {...props}>
      {children}
    </code>
  );
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, agentColorClass }) => {
  const isUser = message.role === 'user';
  
  // Extract color code roughly (e.g. text-cyan-400 -> cyan)
  const colorName = agentColorClass.split('-')[1] || 'cyan';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      <div className={`flex max-w-[95%] md:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-4 min-w-0`}>
        
        {/* Avatar Area */}
        <div className={`w-10 h-10 flex items-center justify-center shrink-0 border rounded-xl relative overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105 ${
            isUser 
              ? 'bg-slate-800/80 border-slate-600 shadow-black/50' 
              : `bg-black/60 border-${colorName}-500/50 shadow-${colorName}-500/20`
          }`}>
           {!isUser && <div className={`absolute inset-0 opacity-40 bg-gradient-to-br from-${colorName}-600/30 to-transparent`}></div>}
           
           {isUser ? (
            <Icons.User className="w-5 h-5 text-slate-300" />
           ) : (
            <Icons.Bot className={`w-5 h-5 text-${colorName}-400 relative z-10`} />
           )}
        </div>

        {/* Message Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full min-w-0`}>
          
          <div className="flex items-center gap-3 mb-2 opacity-80 pl-1">
            <span className={`text-[10px] font-display font-bold uppercase tracking-widest ${isUser ? 'text-slate-400' : `text-${colorName}-400 drop-shadow-[0_0_8px_currentColor]`}`}>
              {message.senderName}
            </span>
            <span className="text-[9px] text-slate-600 font-mono">
              [{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]
            </span>
          </div>

          <div 
            className={`relative p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 w-full overflow-hidden ${
              isUser 
                ? 'bg-slate-800/60 border-slate-600/50 text-slate-100 rounded-tr-sm shadow-xl' 
                : `bg-slate-900/60 border-${colorName}-500/30 text-slate-100 shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)] rounded-tl-sm`
            }`}
          >
            {/* Tech Decoration for Bot Messages */}
            {!isUser && (
               <>
                 <div className={`absolute -top-[1px] -left-[1px] w-3 h-3 border-t border-l border-${colorName}-400`}></div>
                 <div className={`absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b border-r border-${colorName}-400`}></div>
                 <div className={`absolute top-0 right-0 w-40 h-40 bg-${colorName}-500/5 rounded-full blur-3xl pointer-events-none`}></div>
               </>
            )}

            {/* Generated Image Display */}
            {message.imageUrl && (
              <div className="mb-4 rounded-lg overflow-hidden border border-slate-700 relative group-image shadow-lg max-w-sm">
                 <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-30 z-10"></div>
                 <img src={message.imageUrl} alt="Content" className="w-full h-auto object-cover" />
              </div>
            )}
            
            {/* Content Rendering with Custom Code Block */}
            <div className="prose prose-invert prose-sm max-w-none font-sans leading-relaxed text-slate-200 
                break-words
                prose-p:my-2
                prose-strong:text-white 
                prose-headings:text-white prose-headings:font-display prose-headings:tracking-wide
                prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                [&_iframe]:max-w-full
            ">
                 <ReactMarkdown 
                    components={{
                      code: CodeBlock
                    }}
                 >
                    {message.content}
                 </ReactMarkdown>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;