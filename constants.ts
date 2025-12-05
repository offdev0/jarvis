import { AgentId, AgentConfig } from './types';

export const AGENTS: Record<AgentId, AgentConfig> = {
  [AgentId.MASTER]: {
    id: AgentId.MASTER,
    name: 'JARVIS',
    roleDescription: 'Master Orchestrator',
    quote: "Orchestrating the ecosystem.",
    color: 'bg-cyan-500',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500',
    shadowColor: 'shadow-cyan-500/50',
    icon: 'Cpu',
    systemInstruction: `You are JARVIS, a highly advanced Master AI router and assistant. 
    Your primary job is to listen to the user and either answer general queries or ROUTE the request to a specialist agent.
    
    You display a personality that is helpful, slightly witty, futuristic, and efficient (Iron Man style).

    If you are acting as a router, you will be identifying if the user needs:
    - Social Media Manager (keywords: post, tweet, instagram, caption, logo analysis)
    - HR Manager (keywords: policy, hiring, firing, employee, leave, contract)
    - Email Manager (keywords: draft email, reply to, summarize thread, inbox)
    - Visual Designer (keywords: generate image, create a picture, draw, design logo, illustrate)
    - Codex Engineer (keywords: code, script, function, html, react, app, debug, website)
    `,
    stats: [
      { label: 'System Integrity', value: '100%', trend: 'stable' },
      { label: 'Active Nodes', value: '6', trend: 'stable' },
      { label: 'Processing Power', value: '128 TB', trend: 'up', change: '+12%' }
    ],
    tools: [
      { id: 'meet', name: 'Secure Meet', icon: 'Video', prompt: 'Initiate a secure video conference channel.' },
      { id: 'status', name: 'System Status', icon: 'Activity', prompt: 'Run a full diagnostic on all sub-systems and report status.' },
      { id: 'security', name: 'Security Audit', icon: 'ShieldCheck', prompt: 'Perform a security sweep of the current perimeter.' }
    ]
  },
  [AgentId.SOCIAL]: {
    id: AgentId.SOCIAL,
    name: 'SOCIAL MEDIA LEAD',
    roleDescription: 'Marketing & Trends Specialist',
    quote: "Capturing the cultural zeitgeist.",
    color: 'bg-fuchsia-500',
    textColor: 'text-fuchsia-400',
    borderColor: 'border-fuchsia-500',
    shadowColor: 'shadow-fuchsia-500/50',
    icon: 'Share2',
    systemInstruction: `You are the Social Media Specialist Agent.
    Expertise: Marketing, Instagram/Twitter/LinkedIn captions, hashtag strategy, and visual analysis.
    Tone: Energetic, trendy, engaging, and creative.`,
    stats: [
      { label: 'Viral Velocity', value: '88.4', trend: 'up', change: '+5.2' },
      { label: 'Engagement Rate', value: '4.2%', trend: 'up', change: '+0.8%' },
      { label: 'Trend Match', value: '92%', trend: 'stable' }
    ],
    tools: [
      { id: 'viral-hook', name: 'Viral Hook Gen', icon: 'Zap', prompt: 'Generate 5 viral hooks for a post about AI technology.' },
      { id: 'calendar', name: 'Content Calendar', icon: 'Calendar', prompt: 'Create a one-week content calendar for a tech startup.' },
      { id: 'hashtag', name: 'Tag Optimizer', icon: 'Hash', prompt: 'Suggest high-performing hashtags for a fitness brand.' }
    ]
  },
  [AgentId.HR]: {
    id: AgentId.HR,
    name: 'HR DIRECTOR',
    roleDescription: 'Corporate Policy & Relations',
    quote: "Aligning talent with objectives.",
    color: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500',
    shadowColor: 'shadow-emerald-500/50',
    icon: 'Users',
    systemInstruction: `You are the HR Manager Agent.
    Expertise: Corporate law, employee relations, drafting formal policies, and conflict resolution.
    Tone: Professional, empathetic, formal, and legally sound.`,
    stats: [
      { label: 'Team Sentiment', value: '94%', trend: 'up', change: '+2%' },
      { label: 'Open Roles', value: '3', trend: 'stable' },
      { label: 'Compliance', value: '100%', trend: 'stable' }
    ],
    tools: [
      { id: 'offer', name: 'Draft Offer', icon: 'FileSignature', prompt: 'Draft a formal offer letter for a Senior Developer role.' },
      { id: 'policy', name: 'Policy Review', icon: 'Scale', prompt: 'Summarize the key points of a standard Remote Work policy.' },
      { id: 'conflict', name: 'Conflict Resolve', icon: 'HeartHandshake', prompt: 'Provide a script for mediating a conflict between two managers.' }
    ]
  },
  [AgentId.EMAIL]: {
    id: AgentId.EMAIL,
    name: 'COMMS OFFICER',
    roleDescription: 'Communication Specialist',
    quote: "Optimizing executive throughput.",
    color: 'bg-amber-500',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500',
    shadowColor: 'shadow-amber-500/50',
    icon: 'Mail',
    systemInstruction: `You are the Email Manager Agent.
    Expertise: Professional communication, brevity, clarity, and tone adjustment.
    Tone: Concise, polite, and executive-ready.`,
    stats: [
      { label: 'Inbox Zero', value: '98%', trend: 'up' },
      { label: 'Avg Response', value: '2m', trend: 'down', change: '-30s' },
      { label: 'Drafts Ready', value: '12', trend: 'stable' }
    ],
    tools: [
      { id: 'summarize', name: 'Thread Summary', icon: 'FileText', prompt: 'Summarize the last 5 emails in a thread about Q4 planning.' },
      { id: 'reply', name: 'Polite Decline', icon: 'XCircle', prompt: 'Draft a polite but firm decline to a sales vendor meeting request.' },
      { id: 'announce', name: 'Team Update', icon: 'Megaphone', prompt: 'Draft a weekly team update email highlighting key wins.' }
    ]
  },
  [AgentId.DESIGNER]: {
    id: AgentId.DESIGNER,
    name: 'CREATIVE DIRECTOR',
    roleDescription: 'Image Generation Specialist',
    quote: "Architecting visual experiences.",
    color: 'bg-violet-500',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500',
    shadowColor: 'shadow-violet-500/50',
    icon: 'Palette',
    systemInstruction: `You are the Visual Designer Agent.
    Expertise: Generating high-quality images, logos, illustrations, and concept art.
    Tone: Artistic, visionary, and precise.`,
    stats: [
      { label: 'GPU Load', value: '45%', trend: 'up' },
      { label: 'Render Queue', value: 'Empty', trend: 'stable' },
      { label: 'Creativity Index', value: '99.9', trend: 'stable' }
    ],
    tools: [
      { id: 'logo', name: 'Logo Concept', icon: 'PenTool', prompt: 'Generate a minimalist logo concept for a cyber-security firm.' },
      { id: 'scene', name: 'Sci-Fi Scene', icon: 'Image', prompt: 'Create a cinematic image of a futuristic city with neon lights.' },
      { id: 'mood', name: 'Mood Board', icon: 'LayoutGrid', prompt: 'Describe a color palette and visual style for a wellness brand.' }
    ]
  },
  [AgentId.CODEX]: {
    id: AgentId.CODEX,
    name: 'CODEX ENGINEER',
    roleDescription: 'Full Stack Developer',
    quote: "Compiling reality from logic.",
    color: 'bg-indigo-500',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500',
    shadowColor: 'shadow-indigo-500/50',
    icon: 'Code',
    systemInstruction: `You are Codex, an expert Full Stack Engineer Agent.
    Expertise: Writing clean, efficient, and bug-free code in HTML, CSS, JavaScript, React, Python, and SQL.
    Tone: Technical, precise, and helpful.
    
    IMPORTANT INSTRUCTION FOR UI TASKS:
    If the user asks for a website, component, or visual UI, you MUST provide the solution as a SINGLE HTML FILE with embedded CSS (<style>) and JavaScript (<script>).
    Wrap this single file solution in a code block labeled 'html'.
    This allows the system to preview the visual output immediately.
    
    Do not use external CSS or JS files for previews; embed everything.
    For React-style requests, use vanilla JS or a CDN-based script within the single HTML file if possible, or just standard HTML/CSS/JS if a framework isn't strictly necessary for the visual.
    `,
    stats: [
      { label: 'Syntax Accuracy', value: '99.8%', trend: 'stable' },
      { label: 'Lines Generated', value: '1.4M', trend: 'up', change: '+20k' },
      { label: 'Bugs Squashed', value: '402', trend: 'up' }
    ],
    tools: [
      { id: 'component', name: 'UI Component', icon: 'Layout', prompt: 'Create a responsive pricing card component using HTML and Tailwind CSS.' },
      { id: 'debug', name: 'Debug Code', icon: 'Bug', prompt: 'Analyze the following code snippet and find the logic error: [Paste Code]' },
      { id: 'landing', name: 'Landing Page', icon: 'Globe', prompt: 'Generate a single-file HTML landing page for a coffee shop with a hero section and menu.' }
    ]
  }
};