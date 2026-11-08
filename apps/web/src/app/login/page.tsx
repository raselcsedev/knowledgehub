"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

interface LoginResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const authenticatedUser = await refreshUser();

      if (!authenticatedUser) {
        throw new Error("Unable to restore your login session");
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-600 p-2.5 text-white">
            <Sparkles size={23} />
          </div>

          <div>
            <h1 className="text-lg font-bold text-slate-900">KnowledgeHub</h1>
            <p className="text-xs text-slate-400">AI Document Assistant</p>
          </div>
        </Link>

        <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>

        <p className="mt-2 text-sm text-slate-500">
          Sign in to continue to your workspace.
        </p>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email address
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 focus-within:border-indigo-500">
              <Mail size={18} className="text-slate-400" />

              <input
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full py-3 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 focus-within:border-indigo-500">
              <Lock size={18} className="text-slate-400" />

              <input
                type="password"
                required
                minLength={8}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full py-3 text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
