
"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Upload,
  FileText,
  File,
  Trash2,
  MoreVertical,
  CheckCircle2,
  Clock3,
  AlertCircle,
  X,
  FileUp,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/protected-route";

type DocumentStatus = "Ready" | "Processing" | "Failed";
type DocumentType = "PDF" | "DOCX";

interface DocumentItem {
  id: number;
  name: string;
  type: DocumentType;
  size: string;
  uploadedAt: string;
  status: DocumentStatus;
}

const initialDocuments: DocumentItem[] = [
  {
    id: 1,
    name: "Project Requirements.pdf",
    type: "PDF",
    size: "2.4 MB",
    uploadedAt: "Nov 08, 2026",
    status: "Ready",
  },
  {
    id: 2,
    name: "Technical Documentation.docx",
    type: "DOCX",
    size: "1.2 MB",
    uploadedAt: "Nov 07, 2026",
    status: "Ready",
  },
  {
    id: 3,
    name: "Research Notes.pdf",
    type: "PDF",
    size: "3.1 MB",
    uploadedAt: "Nov 06, 2026",
    status: "Processing",
  },
  {
    id: 4,
    name: "Software Architecture.pdf",
    type: "PDF",
    size: "4.8 MB",
    uploadedAt: "Nov 05, 2026",
    status: "Ready",
  },
  {
    id: 5,
    name: "API Specification.docx",
    type: "DOCX",
    size: "890 KB",
    uploadedAt: "Nov 04, 2026",
    status: "Failed",
  },
];

const filters = ["All", "Ready", "Processing", "Failed"] as const;

export default function DocumentsPage() {
  const [documents, setDocuments] = useState(initialDocuments);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<(typeof filters)[number]>("All");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        activeFilter === "All" || doc.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [documents, search, activeFilter]);

  const readyCount = documents.filter(
    (doc) => doc.status === "Ready"
  ).length;

  const processingCount = documents.filter(
    (doc) => doc.status === "Processing"
  ).length;

  const failedCount = documents.filter(
    (doc) => doc.status === "Failed"
  ).length;

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const validExtensions = [".pdf", ".docx"];
    const extension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(extension)) {
      alert("Only PDF and DOCX files are supported.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  function handleDelete() {
    if (deleteId === null) return;

    setDocuments((current) =>
      current.filter((doc) => doc.id !== deleteId)
    );

    setDeleteId(null);
  }

  function getStatusStyle(status: DocumentStatus) {
    switch (status) {
      case "Ready":
        return "bg-emerald-50 text-emerald-700";
      case "Processing":
        return "bg-amber-50 text-amber-700";
      case "Failed":
        return "bg-red-50 text-red-700";
    }
  }

  function getStatusIcon(status: DocumentStatus) {
    switch (status) {
      case "Ready":
        return <CheckCircle2 size={14} />;
      case "Processing":
        return <Clock3 size={14} />;
      case "Failed":
        return <AlertCircle size={14} />;
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#f7f8fc] px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  My Documents
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Manage and organize your knowledge base documents.
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <Upload size={17} />
                Upload Document
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Documents"
              value={documents.length}
              icon={<FileText size={20} />}
              color="indigo"
            />
            <StatCard
              label="Ready"
              value={readyCount}
              icon={<CheckCircle2 size={20} />}
              color="emerald"
            />
            <StatCard
              label="Processing"
              value={processingCount}
              icon={<Clock3 size={20} />}
              color="amber"
            />
            <StatCard
              label="Failed"
              value={failedCount}
              icon={<AlertCircle size={20} />}
              color="red"
            />
          </div>

          {/* Upload selection */}
          <div className="mb-6 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-5">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white p-3 text-indigo-600 shadow-sm">
                  <FileUp size={23} />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">
                    Add documents to your knowledge base
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    PDF and DOCX files are supported.
                  </p>
                </div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
              >
                Choose file
              </button>
            </div>

            {selectedFile && (
              <div className="mt-4 flex items-center justify-between rounded-lg bg-white p-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText size={18} className="shrink-0 text-indigo-600" />
                  <span className="truncate text-sm text-slate-700">
                    {selectedFile.name}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="ml-2 text-slate-400 hover:text-red-600"
                  aria-label="Remove selected file"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Document list */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900">
                All Documents
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search and manage your uploaded files.
              </p>

              <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-sm">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search documents..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        activeFilter === filter
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Document</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Size</th>
                    <th className="px-6 py-4 font-semibold">Uploaded</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                            <FileText size={19} />
                          </div>
                          <span className="text-sm font-medium text-slate-800">
                            {doc.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {doc.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {doc.size}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {doc.uploadedAt}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(doc.status)}`}>
                          {getStatusIcon(doc.status)}
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteId(doc.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${doc.name}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-4">
                  <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
                    <FileText size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {doc.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {doc.type} · {doc.size}
                    </p>
                    <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${getStatusStyle(doc.status)}`}>
                      {getStatusIcon(doc.status)}
                      {doc.status}
                    </span>
                  </div>

                  <button
                    onClick={() => setDeleteId(doc.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${doc.name}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>

            {filteredDocuments.length === 0 && (
              <div className="px-5 py-16 text-center">
                <File size={35} className="mx-auto text-slate-300" />
                <h3 className="mt-3 font-semibold text-slate-700">
                  No documents found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Try another search or filter.
                </p>
              </div>
            )}

            <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
              Showing {filteredDocuments.length} of {documents.length} documents
            </div>
          </section>
        </div>

        {/* Delete confirmation */}
        {deleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Trash2 size={22} />
              </div>

              <h3 className="mt-4 text-center text-lg font-bold text-slate-900">
                Delete document?
              </h3>
              <p className="mt-2 text-center text-sm text-slate-500">
                This will remove the document from this demo list.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "indigo" | "emerald" | "amber" | "red";
}) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`rounded-xl p-2.5 ${styles[color]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
