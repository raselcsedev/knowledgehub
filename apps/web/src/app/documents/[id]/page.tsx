"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Calendar,
  HardDrive,
  Layers,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Trash2,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/protected-route";
import { apiRequest } from "@/lib/api";

type DocumentStatus = "UPLOADED" | "PROCESSING" | "READY" | "FAILED";

type EmbeddingStatus =
  | "NOT_AVAILABLE"
  | "NOT_EMBEDDED"
  | "PARTIAL"
  | "COMPLETED";

type ApiDocument = {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  extractedText: string | null;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  chunkCount: number;
  embeddedChunkCount: number;
  embeddingStatus: EmbeddingStatus;
};

type DocumentResponse = {
  message: string;
  document: ApiDocument;
};

type DocumentChunk = {
  id: string;
  content: string;
  chunkIndex: number;
  charCount: number;
  createdAt: string;
  embeddingModel: string | null;
  embeddedAt: string | null;
  hasEmbedding: boolean;
};

type ChunksResponse = {
  message: string;
  document: {
    id: string;
    title: string;
  };
  chunkCount: number;
  chunks: DocumentChunk[];
};

type EmbedResponse = {
  message?: string;
  totalChunks: number;
  processedChunks: number;
  storedChunks: number;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString();
}

function getStatusStyle(status: DocumentStatus): string {
  const styles: Record<DocumentStatus, string> = {
    READY: "bg-emerald-50 text-emerald-700",
    PROCESSING: "bg-amber-50 text-amber-700",
    UPLOADED: "bg-blue-50 text-blue-700",
    FAILED: "bg-red-50 text-red-700",
  };

  return styles[status];
}

function getEmbeddingStatusStyle(status: EmbeddingStatus): string {
  const styles: Record<EmbeddingStatus, string> = {
    COMPLETED: "bg-emerald-50 text-emerald-700",
    PARTIAL: "bg-amber-50 text-amber-700",
    NOT_EMBEDDED: "bg-slate-100 text-slate-600",
    NOT_AVAILABLE: "bg-red-50 text-red-700",
  };

  return styles[status];
}

function getEmbeddingStatusLabel(status: EmbeddingStatus): string {
  const labels: Record<EmbeddingStatus, string> = {
    COMPLETED: "Completed",
    PARTIAL: "Partially embedded",
    NOT_EMBEDDED: "Not embedded",
    NOT_AVAILABLE: "Not available",
  };

  return labels[status];
}

function DocumentDetailsContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const documentId = params.id;
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [document, setDocument] = useState<ApiDocument | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [embedResult, setEmbedResult] = useState<EmbedResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDocument() {
      try {
        setIsLoading(true);
        setError(null);

        const [documentResponse, chunksResponse] = await Promise.all([
          apiRequest<DocumentResponse>(`/documents/${documentId}`),
          apiRequest<ChunksResponse>(`/documents/${documentId}/chunks`),
        ]);

        if (isMounted) {
          setDocument(documentResponse.document);
          setChunks(chunksResponse.chunks);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load document.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (documentId) {
      loadDocument();
    }

    return () => {
      isMounted = false;
    };
  }, [documentId]);

  async function handleGenerateEmbeddings() {
    if (isEmbedding || !document) return;

    try {
      setIsEmbedding(true);
      setError(null);
      setEmbedResult(null);

      const result = await apiRequest<EmbedResponse>(
        `/documents/${documentId}/embed`,
        { method: "POST" },
      );

      // Reload persistent document and chunk metadata.
      const [documentResponse, chunksResponse] = await Promise.all([
        apiRequest<DocumentResponse>(`/documents/${documentId}`),
        apiRequest<ChunksResponse>(`/documents/${documentId}/chunks`),
      ]);

      setDocument(documentResponse.document);
      setChunks(chunksResponse.chunks);
      setEmbedResult(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate embeddings.",
      );
    } finally {
      setIsEmbedding(false);
    }
  }

  async function handleDeleteDocument() {
    if (!document || isDeleting) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${document.title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      await apiRequest<{ message: string }>(`/documents/${documentId}`, {
        method: "DELETE",
      });

      router.push("/documents");
      router.refresh();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete document.",
      );
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 text-center text-slate-500">
        Loading document details...
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
        <button
          onClick={() => router.push("/documents")}
          className="mt-4 block font-semibold underline"
        >
          Back to documents
        </button>
      </div>
    );
  }

  if (!document) return null;

  return (
    <>
      <div className="mb-8">
        <Link
          href="/documents"
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft size={16} />
          Back to documents
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <FileText size={25} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {document.title}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {document.originalName}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${getStatusStyle(document.status)}`}
            >
              {document.status === "READY" && <CheckCircle2 size={16} />}
              {document.status === "PROCESSING" && <Clock3 size={16} />}
              {document.status === "UPLOADED" && <Clock3 size={16} />}
              {document.status === "FAILED" && <AlertCircle size={16} />}
              {document.status}
            </span>

            <button
              onClick={handleDeleteDocument}
              disabled={isDeleting || isEmbedding}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <Trash2 size={17} />
              )}
              {isDeleting ? "Deleting..." : "Delete document"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {deleteError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={<FileText size={19} />}
          label="File type"
          value={document.mimeType}
        />
        <InfoCard
          icon={<HardDrive size={19} />}
          label="File size"
          value={formatFileSize(document.sizeBytes)}
        />
        <InfoCard
          icon={<Calendar size={19} />}
          label="Uploaded"
          value={formatDate(document.createdAt)}
        />
        <InfoCard
          icon={<Layers size={19} />}
          label="Embedded chunks"
          value={`${document.embeddedChunkCount}/${document.chunkCount}`}
        />
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Document embeddings
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Generate and store vector representations of document chunks.
            </p>
          </div>

          <button
            onClick={handleGenerateEmbeddings}
            disabled={isEmbedding || chunks.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEmbedding ? (
              <RefreshCw size={17} className="animate-spin" />
            ) : (
              <Sparkles size={17} />
            )}
            {isEmbedding ? "Generating..." : "Generate embeddings"}
          </button>
        </div>
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Embedding status
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {document.embeddedChunkCount} of {document.chunkCount} chunks
                embedded
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${getEmbeddingStatusStyle(document.embeddingStatus)}`}
            >
              {getEmbeddingStatusLabel(document.embeddingStatus)}
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{
                width: `${
                  document.chunkCount > 0
                    ? (document.embeddedChunkCount / document.chunkCount) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
        {chunks.length === 0 && (
          <p className="text-sm text-slate-500">
            No chunks are available for this document.
          </p>
        )}

        {embedResult && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-semibold text-emerald-800">
              Embedding generation completed
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-emerald-700">Total</p>
                <p className="text-xl font-bold text-emerald-900">
                  {embedResult.totalChunks}
                </p>
              </div>
              <div>
                <p className="text-emerald-700">Processed</p>
                <p className="text-xl font-bold text-emerald-900">
                  {embedResult.processedChunks}
                </p>
              </div>
              <div>
                <p className="text-emerald-700">Stored</p>
                <p className="text-xl font-bold text-emerald-900">
                  {embedResult.storedChunks}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Extracted text</h2>
          <p className="mt-1 text-sm text-slate-500">
            Text extracted from the original document.
          </p>
        </div>

        {document.extractedText ? (
          <div className="max-h-125 overflow-y-auto rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            <pre className="whitespace-pre-wrap font-sans">
              {document.extractedText}
            </pre>
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
            No extracted text is available for this document.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Document chunks</h2>
          <p className="mt-1 text-sm text-slate-500">
            The extracted text is divided into smaller sections for retrieval.
          </p>
        </div>

        {chunks.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No chunks found.
          </p>
        ) : (
          <div className="space-y-3">
            {chunks.map((chunk) => (
              <details
                key={chunk.id}
                className="group rounded-xl border border-slate-200"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 hover:bg-slate-50">
                  <div>
                    <p className="font-semibold text-slate-800">
                      Chunk {chunk.chunkIndex + 1}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {chunk.charCount} characters
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          chunk.hasEmbedding
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {chunk.hasEmbedding ? "Embedded" : "Not embedded"}
                      </span>
                    </div>

                    {chunk.embeddingModel && (
                      <p className="mt-1 text-xs text-slate-400">
                        Model: {chunk.embeddingModel}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-indigo-600 group-open:rotate-180">
                    ▼
                  </span>
                </summary>

                <div className="border-t border-slate-100 p-4">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-600">
                    {chunk.content}
                  </pre>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-indigo-600">
        {icon}
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="wrap-break-word text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function DocumentDetailsPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#f7f8fc] px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <DocumentDetailsContent />
        </div>
      </main>
    </ProtectedRoute>
  );
}
