export interface ExecutionLog {
  id: string;
  execution_id: string;
  workflow_id: string;
  workflow_name: string;
  status: "success" | "error" | "running" | "waiting" | "canceled";
  finished: boolean;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  mode: string | null;
  node_count: number | null;
  error_message: string | null;
  execution_data: Record<string, unknown> | null;
  workflow_data: Record<string, unknown> | null;
  created_at: string;
}

export interface ExecutionStats {
  totalExecutions: number;
  successCount: number;
  errorCount: number;
  runningCount: number;
  waitingCount: number;
  canceledCount: number;
  avgDurationMs: number;
  successRate: number;
}

export interface DailyStats {
  date: string;
  total: number;
  success: number;
  error: number;
}
