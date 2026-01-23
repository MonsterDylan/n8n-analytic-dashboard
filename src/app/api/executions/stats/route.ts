import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { ExecutionLog } from "@/lib/types";

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("n8n_execution_logs")
      .select("status, duration_ms");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const executions = (data || []) as Pick<ExecutionLog, "status" | "duration_ms">[];

    const totalExecutions = executions.length;
    const successCount = executions.filter((e) => e.status === "success").length;
    const errorCount = executions.filter((e) => e.status === "error").length;
    const runningCount = executions.filter((e) => e.status === "running").length;
    const waitingCount = executions.filter((e) => e.status === "waiting").length;
    const canceledCount = executions.filter((e) => e.status === "canceled").length;

    const durationsMs = executions
      .filter((e) => e.duration_ms != null)
      .map((e) => e.duration_ms as number);

    const avgDurationMs =
      durationsMs.length > 0
        ? durationsMs.reduce((sum, d) => sum + d, 0) / durationsMs.length
        : 0;

    const successRate =
      totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;

    return NextResponse.json({
      totalExecutions,
      successCount,
      errorCount,
      runningCount,
      waitingCount,
      canceledCount,
      avgDurationMs,
      successRate,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
