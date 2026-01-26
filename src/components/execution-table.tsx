"use client";

import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, themeQuartz } from "ag-grid-community";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import { ExternalLink, Pencil } from "lucide-react";
import type { ExecutionLog, SelectedWorkflow } from "@/lib/types";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

interface ExecutionTableProps {
  data: ExecutionLog[];
  isLoading?: boolean;
  onEditWorkflow?: (workflow: SelectedWorkflow) => void;
}

function formatDuration(ms: number | null): string {
  if (ms == null) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function StatusBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    running: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    waiting: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    canceled: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[value] || colors.canceled}`}
    >
      {value}
    </span>
  );
}

export function ExecutionTable({ data, isLoading, onEditWorkflow }: ExecutionTableProps) {
  const { resolvedTheme } = useTheme();
  const n8nUrl = process.env.NEXT_PUBLIC_N8N_URL || "https://djwconsulting.app.n8n.cloud";

  const theme = useMemo(() => {
    return themeQuartz.withParams(
      resolvedTheme === "dark"
        ? {
            backgroundColor: "#18181b",
            headerBackgroundColor: "#27272a",
            oddRowBackgroundColor: "#18181b",
            rowHoverColor: "#27272a",
            borderColor: "#3f3f46",
            foregroundColor: "#fafafa",
            fontSize: 14,
            headerFontSize: 13,
            rowHeight: 48,
            headerHeight: 48,
          }
        : {
            backgroundColor: "#ffffff",
            headerBackgroundColor: "#f4f4f5",
            oddRowBackgroundColor: "#ffffff",
            rowHoverColor: "#f4f4f5",
            borderColor: "#e4e4e7",
            foregroundColor: "#09090b",
            fontSize: 14,
            headerFontSize: 13,
            rowHeight: 48,
            headerHeight: 48,
          }
    );
  }, [resolvedTheme]);

  const columnDefs: ColDef<ExecutionLog>[] = useMemo(
    () => [
      {
        headerName: "Open",
        width: 80,
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: (params: { data: ExecutionLog }) => {
          if (!params.data) return null;
          const url = `${n8nUrl}/workflow/${params.data.workflow_id}/executions/${params.data.execution_id}`;
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-primary" />
            </a>
          );
        },
      },
      {
        headerName: "Edit",
        width: 80,
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: (params: { data: ExecutionLog }) => {
          if (!params.data || !onEditWorkflow) return null;
          return (
            <button
              onClick={() => onEditWorkflow({
                id: params.data.workflow_id,
                name: params.data.workflow_name,
              })}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
              title="Edit workflow with AI"
            >
              <Pencil className="w-4 h-4 text-primary" />
            </button>
          );
        },
      },
      {
        headerName: "Workflow",
        field: "workflow_name",
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: "Status",
        field: "status",
        width: 120,
        cellRenderer: (params: { value: string }) => (
          <StatusBadge value={params.value} />
        ),
      },
      {
        headerName: "Started",
        field: "started_at",
        width: 170,
        valueFormatter: (params: { value: string | null }) =>
          params.value ? format(new Date(params.value), "MMM d, HH:mm:ss") : "-",
      },
      {
        headerName: "Finished",
        field: "finished_at",
        width: 170,
        valueFormatter: (params: { value: string | null }) =>
          params.value ? format(new Date(params.value), "MMM d, HH:mm:ss") : "-",
      },
      {
        headerName: "Duration",
        field: "duration_ms",
        width: 110,
        valueFormatter: (params: { value: number | null }) =>
          formatDuration(params.value),
      },
      {
        headerName: "Mode",
        field: "mode",
        width: 100,
      },
      {
        headerName: "Nodes",
        field: "node_count",
        width: 80,
      },
      {
        headerName: "Error",
        field: "error_message",
        flex: 1,
        minWidth: 200,
        cellClass: "text-red-500",
      },
    ],
    [n8nUrl, onEditWorkflow]
  );

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-[500px] flex items-center justify-center">
        <p className="text-muted-foreground">Loading executions...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">
        Execution Logs
      </h3>
      <div className="h-[500px] w-full">
        <AgGridReact
          theme={theme}
          rowData={data}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 25, 50, 100]}
          animateRows={true}
          getRowClass={(params) =>
            params.data?.status === "error"
              ? "bg-red-50 dark:bg-red-950/20"
              : undefined
          }
        />
      </div>
    </div>
  );
}
