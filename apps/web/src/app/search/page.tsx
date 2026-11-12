
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  LoaderCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  SearchX,
} from "lucide-react";

import ProtectedRoute from "@/components/auth/protected-route";
import { apiRequest } from "@/lib/api";

type SearchResult = {
  chunkId: string;
  content: string;
  chunkIndex: number;
  document: {
    id: string;
    title: string;
    originalName: string;
  };
  embeddingModel: string;
  similarity: number;
};

type SearchResponse = {
  query: string;
  embeddingModel: string;
  totalMatches: number;
  results: SearchResult[];
};

function SearchContent() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [embeddingModel, setEmbeddingModel] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);
      setHasSearched(false);

      const response = await apiRequest<SearchResponse>("/search", {
        method: "POST",
        body: JSON.stringify({
          query: trimmedQuery,
          limit: 5,
        }),
      });

      setResults(response.results);
      setTotalMatches(response.totalMatches);
      setEmbeddingModel(response.embeddingModel);
      setSearchedQuery(response.query);
      setHasSearched(true);
    } catch (err) {
      setResults([]);
      setTotalMatches(0);
      setHasSearched(false);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while searching.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2 text-indigo-600">
          <Sparkles size={20} />
          <span className="text-sm font-semibold">KnowledgeHub Search</span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          Search your knowledge
        </h1>

        <p className="mt-2 text-slate-500">
          Find information across your uploaded documents.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <form onSubmit={handleSearch}>
          <label
            htmlFor="search-query"
            className="mb-3 block text-sm font-semibold text-slate-700"
          >
            What are you looking for?
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="search-query"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="e.g. IELTS writing task 2 essay"
                maxLength={2000}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Search size={18} />
              )}

              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        <p className="mt-3 text-xs text-slate-400">
          Search across your processed and embedded documents.
        </p>
      </section>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="mt-10 flex flex-col items-center justify-center py-12">
          <LoaderCircle
            size={32}
            className="animate-spin text-indigo-600"
          />
          <p className="mt-3 text-sm text-slate-500">
            Searching your documents...
          </p>
        </div>
      )}

      {!isLoading && hasSearched && (
        <section className="mt-8">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Search results
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Results for &quot;{searchedQuery}&quot;
              </p>
            </div>

            <span className="text-sm font-medium text-slate-500">
              {totalMatches} matching chunks
            </span>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
              <SearchX
                size={38}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 font-semibold text-slate-800">
                No matching documents found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try another search phrase or embed more documents.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <article
                  key={result.chunkId}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                        <FileText size={22} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words font-bold text-slate-900">
                          {result.document.title}
                        </h3>

                        <p className="mt-1 break-all text-xs text-slate-500">
                          {result.document.originalName}
                        </p>

                        <p className="mt-2 text-xs text-slate-400">
                          Result {index + 1} · Chunk{" "}
                          {result.chunkIndex + 1}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-lg bg-slate-100 px-3 py-2">
                      <p className="text-xs text-slate-500">
                        Cosine similarity
                      </p>

                      <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-800">
                        {result.similarity.toFixed(6)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {result.content}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <span className="break-all text-xs text-slate-400">
                      Model: {result.embeddingModel}
                    </span>

                    <Link
                      href={`/documents/${result.document.id}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      View document
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          <p className="mt-5 text-xs text-slate-400">
            Embedding model: {embeddingModel}
          </p>
        </section>
      )}

      {!isLoading && !hasSearched && !error && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Search
            size={38}
            className="mx-auto text-slate-300"
          />

          <h3 className="mt-4 font-semibold text-slate-800">
            Search your uploaded documents
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Enter a question or phrase above to find matching sections
            from your document collection.
          </p>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[#f7f8fc] px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <Link
              href="/documents"
              className="text-sm font-medium text-slate-500 transition hover:text-indigo-600"
            >
              ← Back to documents
            </Link>
          </div>

          <SearchContent />
        </div>
      </main>
    </ProtectedRoute>
  );
}
