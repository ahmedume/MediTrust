import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { uploadPDF, fetchRAGDocuments, deleteRAGDocument } from "../api";
import type { RAGDocument, RAGUploadResponse } from "../types";

function scoreColor(score: number | null): string {
  if (score === null) return "text-slate-500";
  if (score >= 70) return "text-emerald-400";
  if (score >= 45) return "text-amber-400";
  return "text-rose-400";
}

function FileCard({ doc, onDeleted }: { doc: RAGDocument; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRAGDocument(doc.doc_id);
      onDeleted();
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-white truncate">
            {doc.filename}
          </span>
          <span className="text-xs text-slate-500">
            {doc.page_count} page{doc.page_count !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>{doc.chunk_count} chunks</span>
          <span>
            Score:{" "}
            <span className={scoreColor(doc.evidence_score)}>
              {doc.evidence_score ?? "N/A"}
            </span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to={`/chat/${doc.doc_id}`}
          className="rounded-lg bg-accent/20 px-3 py-1.5 text-xs font-medium text-accent-soft hover:bg-accent/30 transition"
        >
          Chat
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50"
        >
          {deleting ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}

export default function UploadPage() {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<RAGUploadResponse | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadDocs = useCallback(async () => {
    const docs = await fetchRAGDocuments();
    setDocuments(docs);
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported.");
      return;
    }
    setError("");
    setUploadResult(null);
    setUploading(true);
    try {
      const result = await uploadPDF(file);
      setUploadResult(result);
      loadDocs();
    } catch (e: any) {
      setError(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
          Upload Documents
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Upload PDFs to analyze evidence quality and ask questions via AI.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 transition ${
          dragging
            ? "border-accent bg-accent/10"
            : "border-white/10 bg-white/5 hover:border-white/20"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-sm text-slate-400">Processing PDF...</p>
          </div>
        ) : (
          <>
            <svg
              className="h-10 w-10 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm text-slate-300">
              <span className="text-accent-soft">Click to upload</span> or drag
              and drop
            </p>
            <p className="text-xs text-slate-500">PDF files only</p>
          </>
        )}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg bg-rose-500/10 px-4 py-2 text-sm text-rose-400"
        >
          {error}
        </motion.p>
      )}

      {/* Upload result */}
      {uploadResult && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4"
        >
          <p className="text-sm font-medium text-emerald-400">
            Upload successful!
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {uploadResult.filename} &mdash; {uploadResult.page_count} pages,{" "}
            {uploadResult.chunk_count} chunks &mdash; Evidence score:{" "}
            <span className={scoreColor(uploadResult.evidence_score)}>
              {uploadResult.evidence_score}
            </span>
          </p>
          {uploadResult.evidence_explanation && (
            <p className="mt-1 text-xs text-slate-500">
              {uploadResult.evidence_explanation}
            </p>
          )}
          <Link
            to={`/chat/${uploadResult.doc_id}`}
            className="mt-3 inline-block rounded-lg bg-accent/20 px-4 py-1.5 text-xs font-medium text-accent-soft hover:bg-accent/30 transition"
          >
            Open Chat
          </Link>
        </motion.div>
      )}

      {/* Document list */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-white">
          Uploaded Documents
          <span className="ml-2 text-sm text-slate-500">
            ({documents.length})
          </span>
        </h2>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-500">
            No documents uploaded yet.
          </p>
        ) : (
          documents.map((doc) => (
            <FileCard
              key={doc.doc_id}
              doc={doc}
              onDeleted={loadDocs}
            />
          ))
        )}
      </div>
    </div>
  );
}
