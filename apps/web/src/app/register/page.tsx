"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  User,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

import { apiRequest } from "@/lib/api";

interface RegisterResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await apiRequest<RegisterResponse>(
        "/users/register",
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
          }),
        },
      );

      setSuccess(result.message);

      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed",
      );
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
            <h1 className="text-lg font-bold text-slate-900">
              KnowledgeHub
            </h1>
            <p className="text-xs text-slate-400">
              AI Document Assistant
            </p>
          </div>
        </Link>

        <h2 className="text-2xl font-bold text-slate-900">
          Create your account
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Start organizing your knowledge with AI.
        </p>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Full name
            </label>

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 focus-within:border-indigo-500">
              <User size={18} className="text-slate-400" />

              <input
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full py-3 text-sm outline-none"
              />
            </div>
          </div>

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
                placeholder="Minimum 8 characters"
                className="w-full py-3 text-sm outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
            {!loading && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Sign in
          </Link>
        </p>

      </div>
    </main>
  );
}