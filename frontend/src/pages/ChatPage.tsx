import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { chatWithPDF, fetchRAGDocuments } from "../api";
import type { RAGDocument, RAGChatSource } from "../types";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: RAGChatSource[];
}

function SourcePreview({ sources }: { sources: RAGChatSource[] }) {
  const [open, setOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-accent-soft hover:text-white transition"
      >
        {open ? "Hide" : "Show"} sources ({sources.length})
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-2">
          {sources.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border border-white/5 bg-white/5 p-3 text-xs text-slate-400"
            >
              <p className="mb-1 font-medium text-slate-300">
                {s.filename}
                {s.page ? ` — Page ${s.page}` : ""}
              </p>
              <p className="leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-accent/20 text-white"
            : "border border-white/10 bg-white/5 text-slate-200"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {msg.content}
        </p>
        {!isUser && msg.sources && <SourcePreview sources={msg.sources} />}
      </div>
    </motion.div>
  );
}

export default function ChatPage() {
  const { docId } = useParams<{ docId: string }>();
  const [doc, setDoc] = useState<RAGDocument | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchRAGDocuments().then((docs) => {
      const found = docs.find((d) => d.doc_id === docId);
      setDoc(found || null);
    });
  }, [docId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const result = await chatWithPDF(q, docId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.answer, sources: result.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't process that question. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, docId]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          to="/upload"
          className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          &larr; Documents
        </Link>
        <div className="h-4 w-px bg-white/10" />
        <div className="min-w-0">
          <h1 className="truncate text-base font-medium text-white">
            {doc ? doc.filename : "Loading..."}
          </h1>
          {doc && (
            <p className="text-xs text-slate-500">
              Evidence score:{" "}
              <span
                className={
                  doc.evidence_score !== null && doc.evidence_score >= 70
                    ? "text-emerald-400"
                    : doc.evidence_score !== null && doc.evidence_score >= 45
                    ? "text-amber-400"
                    : "text-rose-400"
                }
              >
                {doc.evidence_score ?? "N/A"}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        {messages.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-slate-500">
              Ask a question about this document.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <div className="h-3 w-3 animate-spin rounded-full border border-accent border-t-transparent" />
            Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask a question about this document..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-accent/50 transition"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-accent/20 px-5 text-sm font-medium text-accent-soft hover:bg-accent/30 transition disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
