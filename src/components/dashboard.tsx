"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { StatCard } from "./stat-card";
import { ExecutionChart } from "./execution-chart";
import { StatusDistributionChart } from "./status-distribution-chart";
import { ExecutionTable } from "./execution-table";
import { ThemeToggle } from "./theme-toggle";
import { WorkflowEditorPanel } from "./workflow-editor-panel";
import type { ExecutionLog, ExecutionStats, DailyStats, SelectedWorkflow } from "@/lib/types";

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

export function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedWorkflow, setSelectedWorkflow] = useState<SelectedWorkflow | null>(null);
  const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL || "https://djwconsulting.app.n8n.cloud";

  const {
    data: executions,
    isLoading: executionsLoading,
    error: executionsError,
  } = useQuery<ExecutionLog[]>({
    queryKey: ["executions"],
    queryFn: () => fetchJson("/api/executions"),
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ExecutionStats>({
    queryKey: ["stats"],
    queryFn: () => fetchJson("/api/executions/stats"),
  });

  const { data: dailyStats, isLoading: dailyLoading } = useQuery<DailyStats[]>(
    {
      queryKey: ["daily"],
      queryFn: () => fetchJson("/api/executions/daily"),
    }
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["executions"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    queryClient.invalidateQueries({ queryKey: ["daily"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                n8n Execution Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Monitor your workflow executions in real-time
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
              aria-label="Refresh data"
            >
              <RefreshCw className="w-5 h-5 text-foreground" />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Error Banner */}
        {executionsError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400">
              Failed to load execution data. Check your Supabase connection.
            </p>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Executions"
            value={stats?.totalExecutions ?? "-"}
            description={`${stats?.successRate.toFixed(1) ?? 0}% success rate`}
            icon={Activity}
            variant="default"
          />
          <StatCard
            title="Successful"
            value={stats?.successCount ?? "-"}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Failed"
            value={stats?.errorCount ?? "-"}
            icon={XCircle}
            variant="error"
          />
          <StatCard
            title="Avg Duration"
            value={stats ? formatDuration(stats.avgDurationMs) : "-"}
            icon={Clock}
            variant="warning"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2">
            <ExecutionChart
              data={dailyStats || []}
              isLoading={dailyLoading}
            />
          </div>
          <div>
            <StatusDistributionChart
              stats={stats}
              isLoading={statsLoading}
            />
          </div>
        </div>

        {/* Execution Table */}
        <ExecutionTable
          data={executions || []}
          isLoading={executionsLoading}
          onEditWorkflow={setSelectedWorkflow}
        />
      </div>

      {/* Workflow Editor Panel */}
      {selectedWorkflow && (
        <WorkflowEditorPanel
          selectedWorkflow={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          n8nUrl={n8nUrl}
        />
      )}
    </div>
  );
}
