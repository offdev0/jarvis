export enum AgentId {
  MASTER = 'MASTER',
  SOCIAL = 'SOCIAL',
  HR = 'HR',
  EMAIL = 'EMAIL',
  DESIGNER = 'DESIGNER',
  CODEX = 'CODEX'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  senderName: string; // "Jarvis", "User", "Social AI", etc.
  timestamp: Date;
  imageUrl?: string;
}

export interface AgentTool {
  id: string;
  name: string;
  icon: string;
  prompt: string;
}

export interface AgentStat {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  change?: string;
}

export interface AgentConfig {
  id: AgentId;
  name: string;
  roleDescription: string;
  quote: string;
  color: string;
  textColor: string;
  borderColor: string;
  shadowColor: string;
  systemInstruction: string;
  icon: string;
  stats: AgentStat[];
  tools: AgentTool[];
}

export interface RouteTask {
  targetAgentId: AgentId;
  reasoning: string;
  specificInstruction: string;
}

export interface RoutingResult {
  tasks: RouteTask[];
}