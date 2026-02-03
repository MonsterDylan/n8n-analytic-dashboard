"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, ImagePlus, X } from "lucide-react";
import type { ChatMessage, ImageAttachment } from "@/lib/types";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string, images?: ImageAttachment[]) => void;
  isLoading: boolean;
  hasModifiedWorkflow: boolean;
  onApplyChanges: () => void;
}

export function ChatInterface({
  messages,
  onSendMessage,
  isLoading,
  hasModifiedWorkflow,
  onApplyChanges,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<ImageAttachment[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        continue;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 data (remove "data:image/...;base64," prefix)
        const base64Data = result.split(",")[1];
        const mediaType = file.type as ImageAttachment["media_type"];

        setPendingImages((prev) => [
          ...prev,
          { type: "base64", media_type: mediaType, data: base64Data },
        ]);
        setImagePreviews((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || pendingImages.length > 0) && !isLoading) {
      onSendMessage(input.trim(), pendingImages.length > 0 ? pendingImages : undefined);
      setInput("");
      setPendingImages([]);
      setImagePreviews([]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">Start a conversation about this workflow.</p>
            <p className="text-xs mt-2">
              Try: &quot;What does this workflow do?&quot; or &quot;Add a 5 second wait after the first node&quot;
            </p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              You can also attach screenshots to help explain issues.
            </p>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {/* Show images if present */}
              {message.images && message.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {message.images.map((img, imgIndex) => (
                    <img
                      key={imgIndex}
                      src={`data:${img.media_type};base64,${img.data}`}
                      alt={`Attachment ${imgIndex + 1}`}
                      className="max-w-[150px] max-h-[100px] rounded object-cover"
                    />
                  ))}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Apply Changes Button */}
      {hasModifiedWorkflow && (
        <div className="px-4 py-2 border-t border-border">
          <button
            onClick={onApplyChanges}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Apply Changes to Workflow
          </button>
        </div>
      )}

      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="px-4 py-2 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-16 h-16 object-cover rounded border border-border"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            className="hidden"
          />

          {/* Image upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-3 py-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Attach image"
          >
            <ImagePlus className="w-4 h-4 text-muted-foreground" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about or modify this workflow..."
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={(!input.trim() && pendingImages.length === 0) || isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
