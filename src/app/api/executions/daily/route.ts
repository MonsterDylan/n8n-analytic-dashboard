import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { ExecutionLog } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "14", 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("n8n_execution_logs")
      .select("status, created_at")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const executions = (data || []) as Pick<ExecutionLog, "status" | "created_at">[];

    // Initialize all dates in range
    const dailyMap = new Map<string, { total: number; success: number; error: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailyMap.set(key, { total: 0, success: 0, error: 0 });
    }

    // Aggregate executions into daily buckets
    for (const exec of executions) {
      const date = new Date(exec.created_at);
      const key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const bucket = dailyMap.get(key);
      if (bucket) {
        bucket.total++;
        if (exec.status === "success") bucket.success++;
        if (exec.status === "error") bucket.error++;
      }
    }

    const result = Array.from(dailyMap.entries()).map(([date, stats]) => ({
      date,
      ...stats,
    }));

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
