import { NextRequest, NextResponse } from "next/server";
import { n8nClient } from "@/lib/n8n";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 });
    }

    const workflow = await n8nClient.getWorkflow(id);
    return NextResponse.json(workflow);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch workflow";
    console.error("GET /api/workflows/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 });
    }

    const body = await request.json();

    if (!body.nodes || !body.connections) {
      return NextResponse.json(
        { error: "Invalid workflow: nodes and connections are required" },
        { status: 400 }
      );
    }

    const updatedWorkflow = await n8nClient.updateWorkflow(id, body);
    return NextResponse.json(updatedWorkflow);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update workflow";
    console.error("PUT /api/workflows/[id] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
