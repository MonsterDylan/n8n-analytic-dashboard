"use client";

import { useState, useEffect } from "react";
import { X, Loader2, ExternalLink, GitBranch } from "lucide-react";
import { ChatInterface } from "./chat-interface";
import type { ChatMessage, SelectedWorkflow, ImageAttachment } from "@/lib/types";
import type { N8nWorkflow } from "@/lib/n8n";

interface WorkflowEditorPanelProps {
  selectedWorkflow: SelectedWorkflow;
  onClose: () => void;
  n8nUrl: string;
}

export function WorkflowEditorPanel({
  selectedWorkflow,
  onClose,
  n8nUrl,
}: WorkflowEditorPanelProps) {
  const [workflow, setWorkflow] = useState<N8nWorkflow | null>(null);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [modifiedWorkflow, setModifiedWorkflow] = useState<Record<string, unknown> | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Fetch workflow on mount
  useEffect(() => {
    async function fetchWorkflow() {
      setIsLoadingWorkflow(true);
      setError(null);
      try {
        const res = await fetch(`/api/workflows/${selectedWorkflow.id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch workflow");
        }
        const data = await res.json();
        setWorkflow(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workflow");
      } finally {
        setIsLoadingWorkflow(false);
      }
    }
    fetchWorkflow();
  }, [selectedWorkflow.id]);

  const handleSendMessage = async (userMessage: string, images?: ImageAttachment[]) => {
    if (!workflow) return;

    const newUserMessage: ChatMessage = { role: "user", content: userMessage, images };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoadingChat(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: modifiedWorkflow || workflow,
          messages,
          userMessage,
          images,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = { role: "assistant", content: data.response };
      setMessages((prev) => [...prev, assistantMessage]);

      if (data.modifiedWorkflow) {
        setModifiedWorkflow(data.modifiedWorkflow);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process message";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${errorMessage}` },
      ]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!modifiedWorkflow || !workflow) return;

    setIsApplying(true);
    try {
      // Always include the original workflow name (required by n8n API)
      const workflowToSave = {
        ...modifiedWorkflow,
        name: workflow.name,
      };

      const res = await fetch(`/api/workflows/${selectedWorkflow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflowToSave),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update workflow");
      }

      const updatedWorkflow = await res.json();
      setWorkflow(updatedWorkflow);
      setModifiedWorkflow(null);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Changes applied successfully! The workflow has been updated in n8n." },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to apply changes";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error applying changes: ${errorMessage}` },
      ]);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-semibold text-foreground">{selectedWorkflow.name}</h2>
            <p className="text-xs text-muted-foreground">
              {workflow ? `${workflow.nodes?.length || 0} nodes` : "Loading..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`${n8nUrl}/workflow/${selectedWorkflow.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Open in n8n"
          >
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoadingWorkflow ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Loading workflow...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-red-500 font-medium">Error</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Workflow Summary */}
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="text-sm font-medium text-foreground mb-2">Nodes</h3>
            <div className="flex flex-wrap gap-2">
              {workflow?.nodes?.slice(0, 10).map((node) => (
                <span
                  key={node.id}
                  className="px-2 py-1 bg-background border border-border rounded text-xs text-foreground"
                >
                  {node.name}
                </span>
              ))}
              {(workflow?.nodes?.length || 0) > 10 && (
                <span className="px-2 py-1 text-xs text-muted-foreground">
                  +{(workflow?.nodes?.length || 0) - 10} more
                </span>
              )}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoadingChat || isApplying}
              hasModifiedWorkflow={!!modifiedWorkflow}
              onApplyChanges={handleApplyChanges}
            />
          </div>
        </>
      )}
    </div>
  );
}
