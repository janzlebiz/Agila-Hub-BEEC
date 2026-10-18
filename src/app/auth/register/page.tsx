"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Shield,
  Lock,
  Mail,
  User,
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

  // Claim mode fields
  const [memberNumber, setMemberNumber] = useState("AGILA-2024-001");
  const [verifyLastName, setVerifyLastName] = useState("Dela Cruz");

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
        // Step 1: Verify pre-seeded member record in public.members
        const { data: memberRecord, error: verifyError } = await supabase
          .from("members")
          .select("id, email, first_name, last_name, member_number, membership_status, user_id")
          .ilike("member_number", memberNumber.trim())
          .ilike("last_name", verifyLastName.trim())
          .maybeSingle();

        if (verifyError || !memberRecord) {
          setErrorMsg(
            "Membership record not found. Please verify your official Member ID (e.g., AGILA-2024-001) and Last Name."
          );
          setLoading(false);
          return;
        }

        if (memberRecord.user_id) {
          setErrorMsg(
            "This Membership ID has already been claimed. If this is your account, please sign in instead."
          );
          setLoading(false);
          return;
        }

        // Step 2: Sign up with Supabase Auth using the member's registered email or specified email
        const targetEmail = email.trim() || memberRecord.email;
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: targetEmail,
          password,
          options: {
            data: {
              first_name: memberRecord.first_name,
              last_name: memberRecord.last_name,
              member_number: memberRecord.member_number,
              claimed_member_id: memberRecord.id,
            },
          },
        });

        if (authError) {
          setErrorMsg(authError.message);
          setLoading(false);
          return;
        }

        // Step 3: Link user_id directly to the member record if session created
        if (authData.user) {
          await supabase
            .from("members")
            .update({ user_id: authData.user.id })
            .eq("id", memberRecord.id);
        }

        setSuccessMsg(
          `Official ID ${memberRecord.member_number} verified! Welcome Kuya/Ate ${memberRecord.first_name}. Redirecting to hub...`
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
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient liquid orbs */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-eagle-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-forest-green/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Navigation */}
      <div className="w-full max-w-lg flex items-center justify-between mb-6 z-10">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-eagle-blue dark:hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Already have an account? Sign In
        </Link>
        <Badge variant="gold" size="sm">
          Fraternal Order of Eagles
        </Badge>
      </div>

      {/* Registration Card */}
      <div className="w-full max-w-lg z-10">
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
                  Member Onboarding & Identification
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

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 mb-6 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode("claim");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                mode === "claim"
                  ? "bg-eagle-blue text-white shadow-md font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <QrCode className="h-3.5 w-3.5" /> Claim Official ID
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("new");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition ${
                mode === "new"
                  ? "bg-eagle-blue text-white shadow-md font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-bumblebee-yellow" /> New Applicant
            </button>
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
          <form onSubmit={handleRegisterOrClaim} className="space-y-4">
            {mode === "claim" ? (
              <>
                <div className="p-3.5 rounded-xl bg-eagle-blue/5 dark:bg-eagle-blue/10 border border-eagle-blue/20 text-xs text-slate-600 dark:text-slate-300">
                  <p className="font-semibold text-eagle-blue dark:text-eagle-blue-light mb-1">
                    Direct Directory Matching:
                  </p>
                  Already pre-registered with Bantayog Elite or National Eagles? Enter your Member Number and Last Name to link your digital badge.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Member ID Number
                    </label>
                    <input
                      type="text"
                      required
                      value={memberNumber}
                      onChange={(e) => setMemberNumber(e.target.value)}
                      placeholder="AGILA-2024-001"
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Last Name (Verification)
                    </label>
                    <input
                      type="text"
                      required
                      value={verifyLastName}
                      onChange={(e) => setVerifyLastName(e.target.value)}
                      placeholder="Dela Cruz"
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Login Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. juan@agilahub.example"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Emilio"
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Aguinaldo"
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="emilio@example.com"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Mobile Phone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+63 917 123 4567"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Chapter / Club
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={chapter}
                      onChange={(e) => setChapter(e.target.value)}
                      placeholder="Bantayog Elite Eagles Club"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-100/90 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-eagle-blue/50 focus:border-eagle-blue transition"
                    />
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              variant="primary"
              className="w-full h-11 text-xs font-bold shadow-lg shadow-eagle-blue/20 mt-2"
            >
              {loading
                ? "Processing..."
                : mode === "claim"
                ? "Verify & Claim Membership ID"
                : "Submit Membership Application"}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Already claimed or have an active account?
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-eagle-blue hover:text-eagle-blue-dark dark:hover:text-eagle-blue-light transition"
            >
              Sign In to Your Account
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
