"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessageAction } from "@/actions/services/messages";
import {
  Loader2,
  Send,
  MessageCircle,
  Paperclip,
  X,
  FileText,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string | Date;
  senderId: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMime?: string | null;
  attachmentSize?: number | null;
  sender: { id: string; name: string; role: string };
};

type Props = {
  requestId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  otherPartyName: string;
};

function formatSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(mime?: string | null) {
  return !!mime && mime.startsWith("image/");
}

export function ChatThread({
  requestId,
  currentUserId,
  initialMessages,
  otherPartyName,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) return;
    if (selected.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      clearFile();
      return;
    }
    setError(null);
    setFile(selected);
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if ((!body && !file) || isPending) return;

    setError(null);
    const fd = new FormData();
    fd.set("requestId", requestId);
    fd.set("body", body);
    if (file) fd.set("file", file);

    const tempId = `temp-${Date.now()}`;
    const optimisticPreview = previewUrl;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        body,
        createdAt: new Date(),
        senderId: currentUserId,
        attachmentUrl: file ? optimisticPreview ?? "#" : null,
        attachmentName: file?.name ?? null,
        attachmentMime: file?.type ?? null,
        attachmentSize: file?.size ?? null,
        sender: { id: currentUserId, name: "You", role: "" },
      },
    ]);
    setText("");
    clearFile();

    startTransition(async () => {
      const res = await sendMessageAction(fd);
      if (!res.success) {
        setError(res.message ?? "Failed to send.");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setText(body);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex h-[min(70vh,640px)] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
          {otherPartyName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{otherPartyName}</p>
          <p className="text-xs text-gray-400">Direct message · attachments up to 5 MB</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
            <MessageCircle className="mb-3 h-10 w-10 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">No messages yet</p>
            <p className="mt-1 text-xs">Send a message or attach a file to start.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            const hasAttachment = !!m.attachmentUrl;
            const image = isImageMime(m.attachmentMime);
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    mine
                      ? "rounded-br-md bg-violet-600 text-white"
                      : "rounded-bl-md bg-gray-100 text-gray-800"
                  )}
                >
                  {!mine && (
                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      {m.sender.name.split(" — ")[0]}
                    </p>
                  )}

                  {hasAttachment && image && m.attachmentUrl && m.attachmentUrl !== "#" && (
                    <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="mb-2 block overflow-hidden rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.attachmentUrl}
                        alt={m.attachmentName ?? "attachment"}
                        className="max-h-56 w-full object-cover"
                      />
                    </a>
                  )}

                  {hasAttachment && !image && (
                    <a
                      href={m.attachmentUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium",
                        mine ? "bg-violet-500/40 text-white" : "bg-white text-gray-700 border border-gray-200"
                      )}
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{m.attachmentName ?? "Attachment"}</span>
                      <span className="shrink-0 opacity-70">{formatSize(m.attachmentSize)}</span>
                      <Download className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  )}

                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}

                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      mine ? "text-violet-200" : "text-gray-400"
                    )}
                  >
                    {new Date(m.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">{error}</p>
      )}

      {file && (
        <div className="flex items-center gap-3 border-t border-gray-100 bg-violet-50/60 px-4 py-2.5">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="preview" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-violet-600">
              <FileText className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-700"
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-gray-100 p-3">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-violet-600 disabled:opacity-50"
          aria-label="Attach file"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${otherPartyName.split(" — ")[0]}…`}
          disabled={isPending}
          className="h-11 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={isPending || (!text.trim() && !file)}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send
        </button>
      </form>
    </div>
  );
}
