import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { ExecutionLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "14", 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch both started_at and created_at to handle NULL started_at values
    // Use a large limit to ensure we get all executions in the date range
    const { data, error } = await supabase
      .from("n8n_execution_logs")
      .select("status, started_at, created_at")
      .gte("created_at", startDate.toISOString())
      .limit(10000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const executions = (data || []) as Pick<ExecutionLog, "status" | "started_at" | "created_at">[];

    // Helper to format date consistently (UTC-based to avoid timezone issues)
    const formatDateKey = (d: Date): string => {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
    };

    // Initialize all dates in range using UTC
    const dailyMap = new Map<string, { total: number; success: number; error: number }>();
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1 - i)));
      const key = formatDateKey(d);
      dailyMap.set(key, { total: 0, success: 0, error: 0 });
    }

    // Aggregate executions into daily buckets
    // Use started_at if available, otherwise fall back to created_at
    for (const exec of executions) {
      const dateStr = exec.started_at || exec.created_at;
      if (!dateStr) continue;
      const date = new Date(dateStr);
      const key = formatDateKey(date);
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
