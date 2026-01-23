"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { ExecutionStats } from "@/lib/types";

interface StatusDistributionChartProps {
  stats: ExecutionStats | undefined;
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  Success: "#22c55e",
  Error: "#ef4444",
  Running: "#3b82f6",
  Waiting: "#f59e0b",
  Canceled: "#6b7280",
};

export function StatusDistributionChart({
  stats,
  isLoading,
}: StatusDistributionChartProps) {
  if (isLoading || !stats) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-[350px] flex items-center justify-center">
        <p className="text-muted-foreground">Loading chart...</p>
      </div>
    );
  }

  const data = [
    { name: "Success", value: stats.successCount },
    { name: "Error", value: stats.errorCount },
    { name: "Running", value: stats.runningCount },
    { name: "Waiting", value: stats.waitingCount },
    { name: "Canceled", value: stats.canceledCount },
  ].filter((entry) => entry.value > 0);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-[350px] flex items-center justify-center">
        <p className="text-muted-foreground">No execution data</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">
        Status Distribution
      </h3>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={STATUS_COLORS[entry.name] || "#6b7280"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--card-foreground))",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
