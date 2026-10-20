"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get("code");
      const next = searchParams.get("next") || "/";

      const supabase = createClient();

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace(next);
          return;
        }
        setErrorMsg(error.message);
      } else if (typeof window !== "undefined" && window.location.hash) {
        // Handle Implicit OAuth flow or email links passing tokens in URL hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) {
            router.replace(next);
            return;
          }
          setErrorMsg(error.message);
        } else {
          router.replace("/auth/login?error=auth-code-error");
        }
      } else {
        // In case session was already established or stored in local storage
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace(next);
          return;
        }
        router.replace("/auth/login?error=auth-code-error");
      }
    };

    handleAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white p-4">
      {errorMsg ? (
        <div className="max-w-md w-full p-6 bg-red-950/50 border border-red-500/30 rounded-2xl text-center space-y-4">
          <h2 className="text-lg font-bold text-red-400">Authentication Verification Failed</h2>
          <p className="text-xs text-slate-300">{errorMsg}</p>
          <button
            onClick={() => router.replace("/auth/login")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-white transition"
          >
            Back to Sign In
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-eagle-blue border-t-white" />
          <p className="text-xs font-medium text-slate-400">Verifying security session...</p>
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-eagle-blue border-t-white" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
