"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Lock, Mail, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.replace("/");
      }
    });
  }, [supabase, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setSuccessMsg("Welcome back, Eagle! Redirecting to hub...");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-slate-950 text-white">
      {/* Background ambient liquid orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-eagle-blue/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Navigation */}
      <div className="w-full max-w-md flex items-center justify-between mb-8 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4 text-amber-400" /> Back to Home
        </Link>
        <span className="text-[10px] font-mono tracking-wider text-slate-400 font-semibold">
          TFOE-PE, INC.
        </span>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md z-10">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl relative backdrop-blur-xl">
          {/* Header Logos: AGILA Hub Logo and BEEC Official Crest on Black Background */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white p-1.5 shadow-md border border-slate-200 dark:border-white/20 flex items-center justify-center">
                <Image
                  src="/assets/AGILA Hub.png"
                  alt="AGILA Hub"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
              <div>
                <h1 className="text-xl font-black font-display text-white tracking-tight">
                  AGILA Hub
                </h1>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Authorized Member Portal
                </p>
              </div>
            </div>

            {/* BEEC Logo: Black Background with Amber Foil Border */}
            <div className="h-12 w-12 rounded-xl bg-black p-1 shadow-md border border-amber-400/60 flex items-center justify-center overflow-hidden">
              <Image
                src="/assets/BEEC_official_crest.jpg"
                alt="BEEC Official Crest"
                width={40}
                height={40}
                className="object-contain scale-105"
                priority
                unoptimized
              />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Sign In to Your Account</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your registered Eagle credentials to access assemblies, finance, and member services.
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400 font-medium animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-400 font-medium animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agilahub.ph"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-11 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full h-11 text-xs font-bold shadow-lg shadow-eagle-blue/30 mt-2 bg-gradient-to-r from-eagle-blue to-eagle-blue-dark hover:brightness-110"
            >
              {loading ? "Authenticating..." : "Sign In to AGILA Hub"}
            </Button>
          </form>

          {/* Registration / Claim link */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">
              New member or haven&apos;t claimed your official ID?
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-bumblebee-yellow" />
              Claim Membership ID / Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
