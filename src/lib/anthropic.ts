import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export function getAnthropicClient(): Anthropic {
  if (!ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return new Anthropic({
    apiKey: ANTHROPIC_API_KEY,
  });
}

export const N8N_SYSTEM_PROMPT = `You are an expert n8n workflow developer. You help users understand and modify their n8n workflows.

When the user asks about a workflow:
1. Analyze the current workflow structure (nodes, connections, parameters)
2. Provide clear explanations of what each part does
3. Suggest improvements or changes when asked

When the user wants to make changes:
1. Explain what changes you'll make and why
2. Ask for confirmation if the change is significant
3. When ready to apply, output the complete modified workflow JSON

## Workflow Structure
- **nodes**: Array of node objects with id, name, type, typeVersion, position, parameters
- **connections**: Object mapping source node names to their output connections
- **settings**: Workflow-level settings (execution order, timezone, etc.)

## Important Rules
- ALWAYS preserve node IDs - never change them
- ALWAYS preserve credential references - never remove or modify them
- Maintain existing connections unless explicitly asked to change them
- Keep node positions reasonable (don't stack nodes on top of each other)

## Output Format for Changes
When outputting a modified workflow, wrap it in these tags:
<workflow_json>
{
  "nodes": [...],
  "connections": {...},
  "settings": {...}
}
</workflow_json>

Only include the workflow JSON inside the tags, no other text.`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithWorkflow(
  workflow: Record<string, unknown>,
  messages: ChatMessage[],
  userMessage: string
): Promise<{ response: string; modifiedWorkflow?: Record<string, unknown> }> {
  const client = getAnthropicClient();

  // Build the conversation with workflow context
  const workflowContext = `Here is the current workflow JSON:\n\`\`\`json\n${JSON.stringify(workflow, null, 2)}\n\`\`\``;

  const conversationMessages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: workflowContext,
    },
    {
      role: "assistant",
      content: "I've analyzed this workflow. How can I help you with it?",
    },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user",
      content: userMessage,
    },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: N8N_SYSTEM_PROMPT,
    messages: conversationMessages,
  });

  const assistantResponse = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  // Check if the response contains a modified workflow
  const workflowMatch = assistantResponse.match(/<workflow_json>([\s\S]*?)<\/workflow_json>/);
  let modifiedWorkflow: Record<string, unknown> | undefined;

  if (workflowMatch) {
    try {
      modifiedWorkflow = JSON.parse(workflowMatch[1].trim());
    } catch {
      console.error("Failed to parse workflow JSON from response");
    }
  }

  // Clean the response (remove the JSON tags for display)
  const cleanResponse = assistantResponse
    .replace(/<workflow_json>[\s\S]*?<\/workflow_json>/g, "[Workflow JSON ready to apply]")
    .trim();

  return {
    response: cleanResponse,
    modifiedWorkflow,
  };
}
