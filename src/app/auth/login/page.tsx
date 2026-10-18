"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Shield, Lock, Mail, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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

  // Quick autofill helper for seeded test accounts
  const autofill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient liquid orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-eagle-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-bumblebee-yellow/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Navigation */}
      <div className="w-full max-w-md flex items-center justify-between mb-8 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-eagle-blue dark:hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Hub Overview
        </Link>
        <span className="text-[10px] font-mono tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
          SEC Reg. No. 102422
        </span>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md z-10">
        <GlassCard variant="glow-blue" className="p-8 sm:p-10 shadow-2xl relative">
          {/* Header Logos */}
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
                <h1 className="text-xl font-black font-display text-slate-900 dark:text-white tracking-tight">
                  AGILA Hub
                </h1>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                  Authorized Member Portal
                </p>
              </div>
            </div>

            <div className="h-12 w-12 rounded-xl bg-white/90 dark:bg-canvas-slate p-1 shadow-md border border-slate-200 dark:border-white/20 flex items-center justify-center">
              <Image
                src="/assets/BEEC_vector.png"
                alt="BEEC Crest"
                width={38}
                height={38}
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Sign In to Your Account</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter your registered Eagle credentials to access meetings, dues, and member services.
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400 font-medium animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-forest-green/10 border border-forest-green/30 flex items-start gap-2.5 text-xs text-forest-green dark:text-forest-light font-medium animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kuya.juan@eagles.org.ph"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] font-semibold text-eagle-blue hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-11 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full h-11 text-xs font-bold shadow-lg shadow-eagle-blue/20 mt-2"
            >
              {loading ? "Authenticating..." : "Sign In to AGILA Hub"}
            </Button>
          </form>

          {/* Registration / Claim link */}
          <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              New member or haven&apos;t claimed your official ID?
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-eagle-blue hover:text-eagle-blue-dark dark:hover:text-eagle-blue-light transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-bumblebee-yellow" />
              Claim Membership ID / Register
            </Link>
          </div>
        </GlassCard>

        {/* Quick Demo Credentials Assistant */}
        <div className="mt-4 p-4 rounded-2xl bg-white/60 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-bumblebee-yellow" /> Demo Accounts Pre-seeded in Database:
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => autofill("juan@agilahub.example", "AgilaKuya2026!")}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-eagle-blue/10 border border-slate-200 dark:border-white/10 text-left transition"
            >
              <div className="font-bold text-slate-800 dark:text-white">Kuya Juan (Admin)</div>
              <div className="text-[10px] text-slate-500 font-mono">juan@agilahub.example</div>
            </button>
            <button
              type="button"
              onClick={() => autofill("applicant@agilahub.example", "AgilaApplicant2026!")}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-eagle-blue/10 border border-slate-200 dark:border-white/10 text-left transition"
            >
              <div className="font-bold text-slate-800 dark:text-white">Emilio (Applicant)</div>
              <div className="text-[10px] text-slate-500 font-mono">applicant@agilahub.example</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
