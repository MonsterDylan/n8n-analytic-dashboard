import { NextRequest, NextResponse } from "next/server";
import { chatWithWorkflow, ChatMessage } from "@/lib/anthropic";

export const dynamic = "force-dynamic";

interface ChatRequestBody {
  workflow: Record<string, unknown>;
  messages: ChatMessage[];
  userMessage: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();

    if (!body.workflow) {
      return NextResponse.json({ error: "Workflow is required" }, { status: 400 });
    }

    if (!body.userMessage) {
      return NextResponse.json({ error: "User message is required" }, { status: 400 });
    }

    const result = await chatWithWorkflow(
      body.workflow,
      body.messages || [],
      body.userMessage
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process chat";
    console.error("POST /api/chat error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
