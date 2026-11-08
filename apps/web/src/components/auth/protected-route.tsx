"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle size={32} className="animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Checking your session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
