export interface Task {
  id: number;
  title: string;
  status: string;
  domain: string;
  source: string;
  notes: string | null;
  sprint_id: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface Sprint {
  id: number;
  task_id: number;
  status: string;
  mission: string | null;
  current_step: string | null;
  steps_completed: number;
  total_steps: number;
  created_at: string;
  completed_at: string | null;
}

export interface Correction {
  id: number;
  description: string;
  corrected_behavior: string | null;
  domain: string;
  created_at: string;
}

export interface AgentLog {
  id: number;
  event_type: string;
  status: string;
  details: string | null;
  tokens_used: number;
  cost_usd: number;
  created_at: string;
}

export interface DashboardData {
  agent: {
    status: string;
    last_active: string | null;
    crons_ok: boolean;
  };
  costs: {
    today_usd: number;
    week_usd: number;
    month_usd: number;
    today_tokens: number;
  };
  tasks: {
    pending: Task[];
    in_progress: Task[];
    completed: Task[];
  };
  sprint: Sprint | null;
  corrections: Correction[];
  recent_log: AgentLog[];
}
