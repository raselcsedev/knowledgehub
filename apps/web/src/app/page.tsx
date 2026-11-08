"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  Search,
  Bell,
  Plus,
  Upload,
  MoreHorizontal,
  File,
  FileType,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import ProtectedRoute from "@/components/auth/protected-route";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

const documents = [
  {
    id: 1,
    name: "Software Requirements Specification",
    type: "PDF",
    size: "2.4 MB",
    date: "Nov 08, 2026",
    status: "Ready",
  },
  {
    id: 2,
    name: "Project Architecture Document",
    type: "DOCX",
    size: "1.8 MB",
    date: "Nov 07, 2026",
    status: "Ready",
  },
  {
    id: 3,
    name: "Database Design and Schema",
    type: "PDF",
    size: "3.1 MB",
    date: "Nov 06, 2026",
    status: "Processing",
  },
  {
    id: 4,
    name: "Technical Documentation",
    type: "DOCX",
    size: "980 KB",
    date: "Nov 05, 2026",
    status: "Ready",
  },
];

const navigation = [
  { name: "Overview", icon: LayoutDashboard, href: "/" },
  { name: "My Documents", icon: FileText, href: "/documents" },
  { name: "AI Chat", icon: MessageSquare, href: "/chat" },
];

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState("");

  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const filteredDocuments = useMemo(
    () =>
      documents.filter((doc) =>
        doc.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#f7f8fc] text-slate-800">
        {/* Mobile overlay */}
        {mobileMenu && (
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setMobileMenu(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
            mobileMenu ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Sparkles size={22} />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  KnowledgeHub
                </h1>
                <p className="text-xs text-slate-400">AI Document Assistant</p>
              </div>
            </div>

            <button
              className="lg:hidden"
              onClick={() => setMobileMenu(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="px-4 py-7">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Workspace
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenu(false)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Icon size={19} />
                    {item.name}

                    {item.name === "AI Chat" && (
                      <span className="ml-auto rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                        AI
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <p className="mb-3 mt-9 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Preferences
            </p>

            <button
              onClick={() => setActiveNav("Settings")}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                activeNav === "Settings"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Settings size={19} />
              Settings
            </button>
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white">
              <Sparkles size={20} />
              <h3 className="mt-3 font-semibold">AI-powered knowledge</h3>
              <p className="mt-1 text-xs leading-5 text-indigo-100">
                Ask questions and get answers directly from your documents.
              </p>
              <button
                onClick={() => setActiveNav("AI Chat")}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Start chatting <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-3 px-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {user?.name || "KnowledgeHub User"}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {user?.email}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Log out
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-h-screen lg:ml-[260px]">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden"
                onClick={() => setMobileMenu(true)}
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  {activeNav}
                </h2>
                <p className="hidden text-xs text-slate-400 sm:block">
                  Manage your knowledge workspace
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:flex">
                <Search size={16} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents..."
                  className="w-44 bg-transparent text-xs outline-none placeholder:text-slate-400"
                />
                <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
                  /
                </kbd>
              </div>

              <button
                aria-label="Notifications"
                className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"
              >
                <Bell size={18} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-600" />
              </button>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                U
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] space-y-8 p-5 md:p-8">
            {/* Welcome */}
            <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-medium text-indigo-600">
                  Sunday, November 8, 2026
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  Welcome to KnowledgeHub 👋
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Organize your documents and discover knowledge with AI.
                </p>
              </div>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700">
                <Upload size={17} />
                Upload document
                <input
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) =>
                    setSelectedFile(e.target.files?.[0]?.name || "")
                  }
                />
              </label>
            </section>

            {selectedFile && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-700">
                Selected file: {selectedFile}. Upload API integration is coming
                next.
              </div>
            )}

            {/* Statistics */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: "Total Documents",
                  value: "24",
                  change: "Your document library",
                  icon: FileText,
                  color: "bg-indigo-50 text-indigo-600",
                },
                {
                  title: "Ready Documents",
                  value: "20",
                  change: "Ready for AI chat",
                  icon: CheckCircle2,
                  color: "bg-emerald-50 text-emerald-600",
                },
                {
                  title: "Processing",
                  value: "02",
                  change: "Being analyzed",
                  icon: Clock,
                  color: "bg-amber-50 text-amber-600",
                },
                {
                  title: "AI Conversations",
                  value: "12",
                  change: "Your chat sessions",
                  icon: MessageSquare,
                  color: "bg-violet-50 text-violet-600",
                },
              ].map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">{stat.title}</p>
                      <div className={`rounded-xl p-2.5 ${stat.color}`}>
                        <Icon size={19} />
                      </div>
                    </div>
                    <h3 className="mt-5 text-3xl font-bold text-slate-900">
                      {stat.value}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">{stat.change}</p>
                  </div>
                );
              })}
            </section>

            {/* AI banner */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white md:p-8">
              <div className="relative z-10 max-w-xl">
                <div className="flex items-center gap-2 text-sm font-medium text-indigo-100">
                  <Sparkles size={17} />
                  Your AI knowledge assistant
                </div>
                <h2 className="mt-3 text-2xl font-bold md:text-3xl">
                  Your documents. Your knowledge. One conversation.
                </h2>
                <p className="mt-3 text-sm leading-6 text-indigo-100">
                  Ask questions about your uploaded documents and get contextual
                  answers with relevant sources.
                </p>
                <button
                  onClick={() => setActiveNav("AI Chat")}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                >
                  Explore AI Chat <ArrowUpRight size={16} />
                </button>
              </div>
              <Sparkles
                size={180}
                className="absolute -right-5 -top-8 text-white/10"
              />
            </section>

            {/* Documents */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center md:px-6">
                <div>
                  <h2 className="font-bold text-slate-900">Recent Documents</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    Your recently uploaded files
                  </p>
                </div>

                <div className="flex gap-2">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 md:hidden">
                    <Search size={15} className="text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full text-xs outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setActiveNav("My Documents")}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    View all
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4 font-semibold">Document</th>
                      <th className="px-6 py-4 font-semibold">Size</th>
                      <th className="px-6 py-4 font-semibold">Upload date</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredDocuments.map((doc) => (
                      <tr
                        key={doc.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-xl p-2.5 ${
                                doc.type === "PDF"
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {doc.type === "PDF" ? (
                                <FileText size={19} />
                              ) : (
                                <FileType size={19} />
                              )}
                            </div>
                            <div>
                              <p className="max-w-[270px] truncate text-sm font-semibold text-slate-700">
                                {doc.name}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                {doc.type} document
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-500">
                          {doc.size}
                        </td>

                        <td className="px-6 py-4 text-xs text-slate-500">
                          {doc.date}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              doc.status === "Ready"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                doc.status === "Ready"
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            {doc.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            aria-label={`Actions for ${doc.name}`}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredDocuments.length === 0 && (
                  <div className="p-10 text-center">
                    <File size={30} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-semibold">
                      No documents found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Try a different search term.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <p className="text-xs text-slate-400">
                  Showing {filteredDocuments.length} documents
                </p>
                <button
                  onClick={() => setActiveNav("My Documents")}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  View document library <ArrowUpRight size={14} />
                </button>
              </div>
            </section>

            {/* Quick actions */}
            <section className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                  <Upload size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">Upload documents</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Add PDF and DOCX files to your library.
                  </p>
                </div>
                <Plus size={18} className="text-slate-400" />
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                  <MessageSquare size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">Ask your documents</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Get answers using AI-powered search.
                  </p>
                </div>
                <ChevronDown size={18} className="text-slate-400" />
              </div>
            </section>

            <footer className="pb-3 text-center text-xs text-slate-400">
              © 2026 KnowledgeHub. Your knowledge, organized.
            </footer>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
