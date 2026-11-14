
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  FileText,
  LoaderCircle,
  MessageSquare,
  Send,
  Sparkles,
  User,
  AlertCircle,
  BookOpen,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/protected-route";
import { apiRequest } from "@/lib/api";

type Citation = {
  sourceNumber: number;
  chunkId: string;
  documentId: string;
  documentTitle: string;
  originalName: string;
  chunkIndex: number;
  similarity: number;
  content: string;
};

type QaResponse = {
  question: string;
  answer: string;
  provider: "mock" | "openai" | "none";
  model?: string;
  embeddingModel: string;
  citations: Citation[];
};

type ChatMessage = {
  id: string;
  question: string;
  response: QaResponse;
};

const exampleQuestions = [
  "What IELTS Writing Task 2 questions are available?",
  "What topics are covered in my documents?",
  "Summarize the main information in my uploaded documents.",
];

function ChatContent() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiRequest<QaResponse>("/qa/ask", {
        method: "POST",
        body: JSON.stringify({
          question: trimmedQuestion,
          limit: 5,
        }),
      });

      setMessages((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          question: trimmedQuestion,
          response,
        },
      ]);

      setQuestion("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating your answer.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleExampleQuestion(example: string) {
    setQuestion(example);
  }

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
          >
            <ArrowLeft size={16} />
            Back to documents
          </Link>
        </div>

        <header className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-indigo-600">
            <Sparkles size={20} />
            <span className="text-sm font-semibold">
              KnowledgeHub AI Assistant
            </span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900">
            Ask your documents
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ask questions about your uploaded documents and get answers
            with supporting source references.
          </p>
        </header>

        {messages.length === 0 && (
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mx-auto flex max-w-xl flex-col items-center text-center">
              <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600">
                <Bot size={32} />
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                How can I help you today?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Ask a question and KnowledgeHub will search your
                documents for relevant information.
              </p>
            </div>

            <div className="mx-auto mt-7 grid max-w-2xl gap-3 sm:grid-cols-2">
              {exampleQuestions.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => handleExampleQuestion(example)}
                  className="rounded-xl border border-slate-200 p-4 text-left text-sm text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <MessageSquare
                    size={17}
                    className="mb-2 text-indigo-500"
                  />
                  {example}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          {messages.map((message) => (
            <article key={message.id} className="space-y-5">
              {/* User question */}
              <div className="flex justify-end">
                <div className="flex max-w-[90%] items-start gap-3 sm:max-w-[80%]">
                  <div className="rounded-2xl bg-indigo-600 px-5 py-4 text-sm leading-7 text-white shadow-sm">
                    {message.question}
                  </div>

                  <div className="shrink-0 rounded-xl bg-indigo-100 p-2 text-indigo-600">
                    <User size={20} />
                  </div>
                </div>
              </div>

              {/* Assistant answer */}
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-xl bg-white p-2 text-indigo-600 shadow-sm">
                  <Bot size={21} />
                </div>

                <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={17} className="text-indigo-600" />
                      <h3 className="font-semibold text-slate-900">
                        KnowledgeHub Answer
                      </h3>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {message.response.provider}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {message.response.answer}
                  </p>

                  {message.response.citations.length > 0 && (
                    <div className="mt-6 border-t border-slate-100 pt-5">
                      <div className="mb-4 flex items-center gap-2">
                        <BookOpen
                          size={18}
                          className="text-indigo-600"
                        />
                        <h4 className="font-semibold text-slate-800">
                          Sources ({message.response.citations.length})
                        </h4>
                      </div>

                      <div className="space-y-4">
                        {message.response.citations.map((citation) => (
                          <div
                            key={citation.chunkId}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                              <div className="flex min-w-0 items-start gap-2">
                                <FileText
                                  size={19}
                                  className="mt-0.5 shrink-0 text-indigo-600"
                                />

                                <div className="min-w-0">
                                  <h5 className="break-words text-sm font-semibold text-slate-800">
                                    [Source {citation.sourceNumber}]{" "}
                                    {citation.documentTitle}
                                  </h5>

                                  <p className="mt-1 break-all text-xs text-slate-500">
                                    {citation.originalName}
                                  </p>
                                </div>
                              </div>

                              <span className="shrink-0 text-xs text-slate-500">
                                Chunk {citation.chunkIndex + 1}
                              </span>
                            </div>

                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                              {citation.content}
                            </p>

                            <div className="mt-3 flex justify-end">
                              <Link
                                href={`/documents/${citation.documentId}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                              >
                                View document
                                <ArrowRight size={14} />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="mt-5 text-xs text-slate-400">
                    Embedding model: {message.response.embeddingModel}
                    {message.response.model &&
                      ` · AI model: ${message.response.model}`}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </section>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5">
            <LoaderCircle
              size={21}
              className="animate-spin text-indigo-600"
            />
            <p className="text-sm text-slate-600">
              Searching your documents and preparing an answer...
            </p>
          </div>
        )}

        <section className="sticky bottom-0 mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:p-5">
          <form onSubmit={handleAsk}>
            <label
              htmlFor="chat-question"
              className="mb-3 block text-sm font-semibold text-slate-700"
            >
              Ask a question
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                id="chat-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask something about your uploaded documents..."
                rows={2}
                maxLength={2000}
                disabled={isLoading}
                className="min-h-14 flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={!question.trim() || isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}

                Ask AI
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              KnowledgeHub uses your indexed documents to provide
              context-based answers.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}
