"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Lock,
  Mail,
  Phone,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  QrCode,
  Building,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"claim" | "new">("claim");
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

  // Claim mode fields (issued privately by club Secretariat)
  const [memberNumber, setMemberNumber] = useState("");
  const [claimToken, setClaimToken] = useState("");

  // Common & New applicant fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [chapter, setChapter] = useState("Bantayog Elite Eagles Club");
  const [password, setPassword] = useState("");

  const handleRegisterOrClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === "claim") {
        if (!memberNumber.trim() || !claimToken.trim()) {
          setErrorMsg("Both Member ID and Official Claim Token are required.");
          setLoading(false);
          return;
        }

        // Step 1: Create Supabase Auth account / authenticate
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              member_number: memberNumber.trim(),
            },
          },
        });

        if (authError) {
          setErrorMsg(authError.message);
          setLoading(false);
          return;
        }

        // If email confirmation is required by Supabase auth configuration
        if (!authData.session && !authData.user) {
          setSuccessMsg("Account created! Please verify your email before claiming.");
          setLoading(false);
          return;
        }

        // Step 2: Atomic database token consumption & authoritative account binding
        const { data: claimData, error: claimError } = await supabase.rpc("claim_member_account", {
          p_member_number: memberNumber.trim(),
          p_claim_token: claimToken.trim(),
        });

        if (claimError) {
          setErrorMsg(claimError.message || "Failed to execute authoritative account claim.");
          setLoading(false);
          return;
        }

        if (claimData && !claimData.success) {
          setErrorMsg(claimData.message || "Claim verification failed.");
          setLoading(false);
          return;
        }

        setSuccessMsg(
          claimData?.message ||
            `Official ID ${memberNumber} verified and claimed! Redirecting to hub...`
        );
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1200);
      } else {
        // Mode: New Applicant Registration
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              phone: phone.trim(),
              chapter_or_branch: chapter.trim(),
            },
          },
        });

        if (authError) {
          setErrorMsg(authError.message);
          setLoading(false);
          return;
        }

        setSuccessMsg(
          "Application submitted successfully! Your membership status is set to PENDING for Club Officer review."
        );
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden bg-slate-950 text-white">
      {/* Background ambient liquid orbs */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-eagle-blue/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Navigation */}
      <div className="w-full max-w-lg flex items-center justify-between mb-6 z-10">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4 text-amber-400" /> Already have an account? Sign In
        </Link>
        <Badge variant="gold" size="sm">
          TFOE-PE, INC.
        </Badge>
      </div>

      {/* Registration Card */}
      <div className="w-full max-w-lg z-10">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl relative backdrop-blur-xl">
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
                <h1 className="text-xl font-black font-display text-white tracking-tight">
                  AGILA Hub
                </h1>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Member Onboarding & Identification
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

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-bold">
            <button
              type="button"
              id="tab-claim-id"
              onClick={() => {
                setMode("claim");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                mode === "claim"
                  ? "bg-eagle-blue text-white shadow-md font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <QrCode className="h-3.5 w-3.5" /> Claim Official ID
            </button>
            <button
              type="button"
              id="tab-new-applicant"
              onClick={() => {
                setMode("new");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                mode === "new"
                  ? "bg-eagle-blue text-white shadow-md font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-bumblebee-yellow" /> New Applicant
            </button>
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
          <form onSubmit={handleRegisterOrClaim} className="space-y-4">
            {mode === "claim" ? (
              <>
                <div className="p-3.5 rounded-xl bg-eagle-blue/10 border border-eagle-blue/30 text-xs text-slate-300">
                  <p className="font-semibold text-eagle-blue-light mb-1">
                    Authorized One-Time Claim Token:
                  </p>
                  Already pre-registered with Bantayog Elite or National Eagles? Enter your Member ID and the claim token issued by the Secretariat to claim your digital portal.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Member ID Number
                    </label>
                    <input
                      type="text"
                      required
                      value={memberNumber}
                      onChange={(e) => setMemberNumber(e.target.value)}
                      placeholder="e.g. BEEC-2024-001"
                      className="w-full h-11 px-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-mono font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      One-Time Claim Token
                    </label>
                    <input
                      type="text"
                      required
                      value={claimToken}
                      onChange={(e) => setClaimToken(e.target.value)}
                      placeholder="e.g. 32-hex claim token"
                      className="w-full h-11 px-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-mono font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Your Login Email
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
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Create Portal Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First Name"
                      className="w-full h-11 px-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className="w-full h-11 px-3.5 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@agilahub.ph"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Mobile Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+63 917 123 4567"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Target Eagles Club
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="Bantayog Elite Eagles Club"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full h-11 text-xs font-bold shadow-lg shadow-eagle-blue/30 mt-2 bg-gradient-to-r from-eagle-blue to-eagle-blue-dark hover:brightness-110"
            >
              {loading
                ? "Processing..."
                : mode === "claim"
                ? "Verify & Claim Membership ID"
                : "Submit Membership Application"}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center">
            <p className="text-xs text-slate-400">
              Already claimed or have an active account?
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
