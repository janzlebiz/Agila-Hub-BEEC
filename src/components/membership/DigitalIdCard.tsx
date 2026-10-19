"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { 
  ShieldCheck, 
  QrCode, 
  Sparkles, 
  Copy, 
  Check, 
  X, 
  Shield, 
  Award,
  Camera,
  RotateCw,
  Maximize2,
  RefreshCw,
  IdCard,
  Layers
} from "lucide-react";

interface DigitalIdCardProps {
  memberNumber?: string;
  fullName?: string;
  nickname?: string;
  role?: "admin" | "officer" | "member";
  status?: "active" | "pending" | "suspended" | "inactive";
  clubName?: string;
  region?: string;
  avatarUrl?: string;
  bloodType?: string;
  officialIdUrl?: string | null;
  idCardBackUrl?: string | null;
  onOpenScanModal?: () => void;
}

export function DigitalIdCard({
  memberNumber = "AGILA-2024-001",
  fullName = "Kuya Juan Dela Cruz",
  nickname = "Juan",
  role = "admin",
  status = "active",
  clubName = "Bantayog Elite Eagles Club",
  region = "National Executive / Bicol Region",
  bloodType = "O+",
  officialIdUrl,
  idCardBackUrl,
  onOpenScanModal,
}: DigitalIdCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [cardSide, setCardSide] = useState<"front" | "back">("front");
  const [viewMode, setViewMode] = useState<"physical" | "digital">(
    officialIdUrl ? "physical" : "digital"
  );

  React.useEffect(() => {
    if (officialIdUrl) {
      setViewMode("physical");
    }
  }, [officialIdUrl]);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(memberNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleLabels = {
    admin: "National Directorate",
    officer: "Club Officer",
    member: "Charter Member",
  };

  const statusLabels = {
    active: "Good Standing",
    pending: "Candidate Pending Review",
    suspended: "Inactive Status",
    inactive: "Alumnus",
  };

  const currentScannedImage = cardSide === "front" ? officialIdUrl : (idCardBackUrl || officialIdUrl);

  return (
    <>
      <div className="relative w-full max-w-md mx-auto group select-none">
        {/* Mode Toggle & Scan Trigger (Above Card) */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-1.5">
            {officialIdUrl && (
              <div className="inline-flex rounded-xl bg-slate-200/80 dark:bg-white/10 p-0.5 border border-slate-300 dark:border-white/10 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode("physical")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    viewMode === "physical"
                      ? "bg-white dark:bg-canvas-dark text-eagle-blue dark:text-amber-300 shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Official Card Scan
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("digital")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    viewMode === "digital"
                      ? "bg-white dark:bg-canvas-dark text-eagle-blue dark:text-amber-300 shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Digital Smart Pass
                </button>
              </div>
            )}
          </div>

          {onOpenScanModal && (
            <button
              id="btn-scan-official-id"
              type="button"
              onClick={onOpenScanModal}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-400/10 hover:bg-amber-200/90 dark:hover:bg-amber-400/20 px-2.5 py-1 rounded-xl border border-amber-300/80 dark:border-amber-400/30 transition shadow-sm"
              title="Scan or upload your official physical Eagles ID card"
            >
              <Camera className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>{officialIdUrl ? "Replace ID Scan" : "Scan Official ID"}</span>
            </button>
          )}
        </div>

        {/* Ambient pearlescent aura */}
        <div className="absolute -inset-1 bg-gradient-to-r from-eagle-blue/20 via-bumblebee-yellow/25 to-forest-light/20 dark:from-eagle-blue/30 dark:via-bumblebee-yellow/20 dark:to-forest-light/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-700 -z-10" />

        {/* ============================================================== */}
        {/* OPTION A: SCANNED OFFICIAL PHYSICAL EAGLES ID CARD VIEW        */}
        {/* ============================================================== */}
        {viewMode === "physical" && officialIdUrl ? (
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-400/70 bg-gradient-to-b from-slate-950 via-[#0a1020] to-slate-900 p-5 shadow-2xl transition-all">
            {/* Gold foil metallic accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 shadow-sm" />

            {/* Header info */}
            <div className="relative z-10 flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="relative h-9 w-9 rounded-lg bg-slate-900 border border-amber-400/60 p-0.5 shadow flex items-center justify-center overflow-hidden">
                  <Image
                    src="/assets/BEEC_official_crest.jpg"
                    alt="BEEC Official Crest"
                    width={36}
                    height={36}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <h4 className="font-display font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    Official Eagles Card
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                      Physical Scan
                    </span>
                  </h4>
                  <p className="text-[10px] text-amber-300/90 font-medium">
                    The Fraternal Order of Eagles • Philippine Eagles
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {idCardBackUrl && (
                  <button
                    type="button"
                    onClick={() => setCardSide(cardSide === "front" ? "back" : "front")}
                    className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 flex items-center justify-center transition border border-white/10"
                    title="Flip Card (Front/Back)"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFullscreenModal(true)}
                  className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/10"
                  title="Fullscreen Inspection"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scanned Card Display Area */}
            <div className="relative my-3 rounded-2xl overflow-hidden border border-amber-400/40 shadow-2xl bg-black aspect-[16/10] flex items-center justify-center group/card">
              <Image
                src={currentScannedImage!}
                alt={`Official Eagles Card - ${cardSide}`}
                fill
                className="object-contain"
                unoptimized
              />

              {/* Holographic Sheen Animation */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-40 pointer-events-none group-hover/card:opacity-70 transition duration-700" />

              {/* Badge overlay on bottom */}
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                <span className="text-[9px] font-mono font-bold bg-black/70 text-amber-300 px-2 py-0.5 rounded backdrop-blur border border-amber-400/30">
                  {cardSide.toUpperCase()} VIEW
                </span>
                <span className="text-[9px] font-mono font-bold bg-black/70 text-white px-2 py-0.5 rounded backdrop-blur">
                  {memberNumber}
                </span>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="relative z-10 pt-2 flex items-center justify-between text-xs text-slate-300">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Holder:</span>
                <span className="font-display font-extrabold text-white text-xs">
                  {fullName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenScanModal}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-bold"
                >
                  Replace Scan
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white"
                  title="Show QR Code"
                >
                  <QrCode className="h-5 w-5 text-amber-300" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* OPTION B: EXECUTIVE POLYCARBONATE DIGITAL SMART PASS            */
          /* ============================================================== */
          <div className="relative overflow-hidden rounded-3xl border border-slate-300/90 dark:border-white/15 bg-gradient-to-b from-white via-slate-50/95 to-slate-100/90 dark:from-canvas-slate dark:via-[#0c1424] dark:to-canvas-dark p-6 shadow-2xl transition-all">
            {/* Guilloché / Security Watermark Pattern Overlay */}
            <div 
              className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06] pointer-events-none mix-blend-multiply dark:mix-blend-screen"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, #05379E 1px, transparent 1px), radial-gradient(circle at 0% 100%, #FEC201 1px, transparent 1px)`,
                backgroundSize: "16px 16px, 24px 24px"
              }}
            />

            {/* Top Edge Metallic Micro-Highlight */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

            {/* Top Header: Official Seals & Fraternal Affiliation */}
            <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-3">
                {/* AGILA Hub Official Insignia */}
                <div className="relative h-12 w-12 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 border border-slate-200/90 dark:border-white/20">
                  <Image
                    src="/assets/AGILA_Hub_official.jpg"
                    alt="AGILA Hub Official Logo"
                    width={44}
                    height={44}
                    className="object-contain"
                    priority
                    unoptimized
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                      AGILA Hub
                    </span>
                    <span className="text-[10px] text-amber-900 dark:text-amber-300 font-bold tracking-wide bg-amber-100/80 dark:bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-300/60 dark:border-amber-400/20">
                      Official Credential
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                    The Fraternal Order of Eagles
                  </p>
                </div>
              </div>

              {/* Bantayog Elite Crest Badge with Gold Foil Border */}
              <div className="relative h-12 w-12 rounded-xl bg-slate-900 p-1 shadow-md border border-amber-400/60 shrink-0 overflow-hidden flex items-center justify-center">
                <Image
                  src="/assets/BEEC_official_crest.jpg"
                  alt="Bantayog Elite Eagles Club Crest"
                  width={46}
                  height={46}
                  className="object-contain scale-105"
                  priority
                  unoptimized
                />
              </div>
            </div>

            {/* Center: Member Profile & Smart Security Elements */}
            <div className="relative z-10 py-5 flex items-start gap-4">
              {/* Avatar Frame with Gold Contact Chip Motif */}
              <div className="relative h-20 w-20 rounded-2xl p-1 bg-gradient-to-tr from-amber-400 via-eagle-blue to-emerald-500 shrink-0 shadow-lg">
                <div className="h-full w-full rounded-[14px] bg-slate-100 dark:bg-canvas-slate flex items-center justify-center overflow-hidden border border-white dark:border-white/20">
                  <span className="font-display text-2xl font-black text-slate-900 dark:text-white">
                    {nickname.charAt(0)}
                  </span>
                </div>
                {/* Online Verified Seal */}
                <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white dark:bg-canvas-dark border-2 border-white dark:border-canvas-dark flex items-center justify-center shadow">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>

              {/* Member Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge variant={role === "admin" ? "gold" : role === "officer" ? "blue" : "neutral"} size="sm">
                    <ShieldCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                    {roleLabels[role]}
                  </Badge>
                  <Badge variant={status === "active" ? "green" : "yellow"} size="sm">
                    {statusLabels[status]}
                  </Badge>
                  <span className="text-[10px] font-mono font-bold bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                    Blood: {bloodType}
                  </span>
                </div>

                <h3 className="font-display font-black text-lg text-slate-900 dark:text-white truncate leading-tight tracking-tight">
                  {fullName}
                </h3>
                <p className="text-xs text-eagle-blue-dark dark:text-amber-300 font-bold mt-0.5">
                  {clubName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">
                  {region}
                </p>
              </div>
            </div>

            {/* Callout to Scan Official Physical ID if not yet scanned */}
            {onOpenScanModal && (
              <div className="relative z-10 mb-4 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                    Have an official physical Eagles ID card?
                  </span>
                </div>
                <button
                  id="btn-scan-and-replace-callout"
                  type="button"
                  onClick={onOpenScanModal}
                  className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-extrabold shadow transition active:scale-95 shrink-0"
                >
                  Scan & Replace
                </button>
              </div>
            )}

            {/* Bottom Bar: Secure RFID & QR Passcode Trigger */}
            <div className="relative z-10 pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase block">
                  Official Member ID
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="group/id inline-flex items-center gap-1.5 font-mono text-sm font-black text-slate-900 dark:text-white hover:text-eagle-blue dark:hover:text-amber-300 transition-colors mt-0.5"
                  title="Click to copy official Member ID"
                >
                  <span>{memberNumber}</span>
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-400 group-hover/id:text-slate-700 dark:group-hover/id:text-white" />
                  )}
                </button>
              </div>

              {/* Interactive QR Passcode & Latin Motto */}
              <div className="flex items-center gap-2.5">
                <div className="flex flex-col items-end">
                  <span className="font-serif italic text-[11px] text-slate-600 dark:text-slate-300 font-semibold tracking-wide">
                    Deo Et Patria
                  </span>
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5 text-amber-500" /> Verified Pass
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  title="Tap to show high-resolution verification QR code"
                  className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-300 dark:border-white/20 flex items-center justify-center cursor-pointer transition shadow-sm active:scale-95 group/qr"
                >
                  <QrCode className="h-6 w-6 text-slate-800 dark:text-white group-hover/qr:scale-110 transition" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal for Physical Card Scan */}
      {showFullscreenModal && officialIdUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-amber-400/40 p-4 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-400" />
                <h3 className="font-display font-black text-sm text-white">
                  Official Physical Eagles Credential
                </h3>
              </div>
              <button
                onClick={() => setShowFullscreenModal(false)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative aspect-[16/10] w-full max-h-[70vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <Image
                src={currentScannedImage!}
                alt="Fullscreen Official Eagles ID"
                fill
                className="object-contain"
                unoptimized
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold text-white">
                {fullName} • {memberNumber}
              </span>
              {idCardBackUrl && (
                <button
                  type="button"
                  onClick={() => setCardSide(cardSide === "front" ? "back" : "front")}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold flex items-center gap-1.5"
                >
                  <RotateCw className="h-3.5 w-3.5" /> Flip to {cardSide === "front" ? "Back" : "Front"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution QR Event Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/20 p-6 shadow-2xl text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="inline-flex p-3 rounded-2xl bg-amber-50 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 mb-3">
              <Award className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>

            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              Official Verification Pass
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Present this pass to the Secretariat during General Membership Assemblies or Chapter Events.
            </p>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-inner flex flex-col items-center justify-center mx-auto mb-4">
              <QrCode className="h-40 w-40 text-slate-900" />
              <span className="font-mono font-bold text-xs text-slate-800 mt-2">
                {memberNumber}
              </span>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              {fullName} • {clubName}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition hover:opacity-90"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </>
  );
}
