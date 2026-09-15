export interface InteractionStep {
  type: string;
  signature?: string;
  summary?: string;
  thought?: string;
  content?: Array<{
    type: string;
    text?: string;
    data?: string;
    mime_type?: string;
    uri?: string;
  }>;
  // Function / tool call fields
  id?: string;
  name?: string;
  arguments?: Record<string, any>;
  call_id?: string;
  result?: any;
  // Specific tool calls
  call?: any;
  output?: string;
  [key: string]: any;
}

export interface InteractionUsage {
  total_tokens?: number;
  prompt_tokens?: number;
  candidates_tokens?: number;
}

export interface InteractionState {
  id: string;
  status: "in_progress" | "completed" | "failed" | "cancelled" | "idle";
  prompt: string;
  environment_id?: string;
  previous_interaction_id?: string;
  steps: InteractionStep[];
  output_text?: string | null;
  fullOutput: string;
  error?: any;
  usage?: InteractionUsage | null;
  startedAt: number;
  finishedAt?: number;
}

export interface RunHistoryItem {
  id: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  environmentId?: string;
  previousInteractionId?: string;
  summary?: string;
}

export interface AgentToolsConfig {
  code_execution: boolean;
  google_search: boolean;
  url_context: boolean;
}

export interface AgentEnvironmentConfig {
  type: "remote";
  networkAllowlistGoogleGenAI: boolean;
  customDomain?: string;
}
