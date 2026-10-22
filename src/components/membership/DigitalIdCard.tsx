"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { 
  ShieldCheck, 
  QrCode, 
  Copy, 
  Check, 
  X, 
  Award,
  Camera,
  RotateCw,
  Maximize2,
  MapPin,
  Heart,
  Droplet
} from "lucide-react";

interface DigitalIdCardProps {
  memberNumber?: string;
  fullName?: string;
  nickname?: string;
  role?: "admin" | "officer" | "member";
  status?: "active" | "pending" | "suspended" | "inactive";
  clubName?: string;
  region?: string;
  avatarUrl?: string | null;
  bloodType?: string;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  officialIdUrl?: string | null;
  idCardBackUrl?: string | null;
  onOpenScanModal?: () => void;
  onUploadSelfieClick?: () => void;
}

export function DigitalIdCard({
  memberNumber = "BEEC-2024-001",
  fullName = "Kuya Juan Dela Cruz",
  nickname = "Juan",
  role = "admin",
  status = "active",
  clubName = "Bantayog Elite Eagles Club",
  region = "Region V - Bicol Region",
  avatarUrl,
  bloodType = "O+",
  emergencyContactName,
  emergencyContactPhone,
  officialIdUrl,
  idCardBackUrl,
  onOpenScanModal,
  onUploadSelfieClick,
}: DigitalIdCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const [cardSide, setCardSide] = useState<"front" | "back">("front");
  const [digitalFlipped, setDigitalFlipped] = useState(false);
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
    admin: "Club President",
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
        {/* Controls Above Card: Flip Card & Scan Toggle */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-1.5">
            {officialIdUrl && (
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-white/10 p-0.5 border border-slate-200 dark:border-white/10 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode("physical")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    viewMode === "physical"
                      ? "bg-white dark:bg-canvas-dark text-eagle-blue dark:text-amber-300 shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Physical Card
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
                  Digital ID
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "digital" && (
              <button
                type="button"
                onClick={() => setDigitalFlipped(!digitalFlipped)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-white/10 dark:hover:bg-white/15 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 transition shadow-sm active:scale-95"
                title="Flip 3D Card"
              >
                <RotateCw className="h-3.5 w-3.5 text-eagle-blue dark:text-amber-300" />
                <span>{digitalFlipped ? "Show Front" : "Flip Details"}</span>
              </button>
            )}

            {onOpenScanModal && (
              <button
                id="btn-scan-official-id"
                type="button"
                onClick={onOpenScanModal}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-400/10 dark:hover:bg-amber-400/20 px-3 py-1.5 rounded-xl border border-amber-300/80 dark:border-amber-400/30 transition shadow-sm active:scale-95"
                title="Scan or upload your official physical Eagles ID card"
              >
                <Camera className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>{officialIdUrl ? "Replace ID" : "Scan ID"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient subtle glow matching current theme */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-eagle-blue/10 via-amber-400/15 to-emerald-500/10 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500 -z-10" />

        {/* ============================================================== */}
        {/* OPTION A: SCANNED OFFICIAL PHYSICAL EAGLES ID CARD VIEW        */}
        {/* ============================================================== */}
        {viewMode === "physical" && officialIdUrl ? (
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1424] p-5 shadow-lg transition-all text-slate-900 dark:text-white">
            <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
                  Official Eagles Physical ID
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {idCardBackUrl && (
                  <button
                    type="button"
                    onClick={() => setCardSide(cardSide === "front" ? "back" : "front")}
                    className="text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 px-2 py-1 rounded-lg transition"
                  >
                    View {cardSide === "front" ? "Back" : "Front"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFullscreenModal(true)}
                  className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white flex items-center justify-center transition"
                  title="Fullscreen Inspection"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="relative my-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow bg-slate-950 aspect-[16/10] flex items-center justify-center">
              <Image
                src={currentScannedImage!}
                alt={`Official Eagles Card - ${cardSide}`}
                fill
                className="object-contain"
                unoptimized
              />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                <span className="text-[9px] font-mono font-bold bg-black/70 text-amber-300 px-2 py-0.5 rounded backdrop-blur">
                  {cardSide.toUpperCase()} VIEW
                </span>
                <span className="text-[9px] font-mono font-bold bg-black/70 text-white px-2 py-0.5 rounded backdrop-blur">
                  {memberNumber}
                </span>
              </div>
            </div>

            <div className="relative z-10 pt-2 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Holder:</span>
                <span className="font-display font-extrabold text-slate-900 dark:text-white text-xs">
                  {fullName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenScanModal}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-bold"
                >
                  Replace Scan
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 flex items-center justify-center"
                  title="Show QR Code"
                >
                  <QrCode className="h-4 w-4 text-slate-800 dark:text-amber-300" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* OPTION B: MINIMALIST & CLEAN DIGITAL EAGLE ID CARD (3D FLIP)   */
          /* ============================================================== */
          <div
            className="perspective-1000 cursor-pointer"
            onClick={() => setDigitalFlipped(!digitalFlipped)}
            title="Click to Flip Card"
          >
            <div
              className={`relative transition-transform duration-700 transform-style-3d ${
                digitalFlipped ? "rotate-y-180" : ""
              }`}
            >
              {/* ----------------- FRONT SIDE ----------------- */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0c1424] p-5 sm:p-6 shadow-xl transition-all backface-hidden text-slate-900 dark:text-white">
                {/* Top Subtle Metallic Gold Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />

                {/* Top Header: AGILA Hub Logo + Titles + Crest */}
                <div className="relative z-10 flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-10 w-10 rounded-xl bg-slate-50 dark:bg-white/5 p-1 shadow-sm flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10">
                      <Image
                        src="/assets/AGILA Hub.png"
                        alt="AGILA Hub"
                        width={36}
                        height={36}
                        className="object-contain"
                        priority
                      />
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white leading-tight">
                        AGILA Hub
                      </h4>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                        TFOE-PE, INC.
                      </p>
                    </div>
                  </div>

                  <div className="relative h-10 w-10 rounded-xl bg-black p-0.5 shadow-sm border border-amber-400/50 shrink-0 overflow-hidden flex items-center justify-center">
                    <Image
                      src="/assets/BEEC_official_crest.jpg"
                      alt="BEEC Crest"
                      width={38}
                      height={38}
                      className="object-contain"
                      priority
                      unoptimized
                    />
                  </div>
                </div>

                {/* Center: Clean Member Layout (Photo on left, Details on right) */}
                <div className="relative z-10 py-4 flex items-center gap-3.5 sm:gap-4">
                  {/* Photo Section with Camera Action */}
                  <div className="relative shrink-0">
                    <div className="relative h-18 w-18 sm:h-20 sm:w-20 rounded-2xl bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-white/15 overflow-hidden flex items-center justify-center shadow-sm">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={fullName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="font-display text-2xl font-black text-slate-700 dark:text-slate-200">
                          {nickname.charAt(0)}
                        </span>
                      )}
                    </div>
                    {onUploadSelfieClick && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUploadSelfieClick();
                        }}
                        title="Upload Selfie or Photo"
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-eagle-blue dark:bg-amber-500 text-white shadow-md flex items-center justify-center transition active:scale-90 border-2 border-white dark:border-[#0c1424]"
                      >
                        <Camera className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Clean Member Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-eagle-blue border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                        <ShieldCheck className="h-3 w-3 shrink-0" />
                        {roleLabels[role]}
                      </span>
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                        {statusLabels[status]}
                      </span>
                    </div>

                    <h3 className="font-display font-black text-base sm:text-lg text-slate-900 dark:text-white truncate leading-snug">
                      {fullName}
                    </h3>
                    
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                      {clubName}
                    </p>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate font-medium">
                      <MapPin className="h-3 w-3 shrink-0 text-amber-500" />
                      {region}
                    </p>
                  </div>
                </div>

                {/* Bottom Bar: Member ID & QR Code Button */}
                <div className="relative z-10 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                      Member ID
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="group/id inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-eagle-blue dark:hover:text-amber-300 transition-colors"
                      title="Click to copy official Member ID"
                    >
                      <span>{memberNumber}</span>
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-slate-400 group-hover/id:text-slate-700 dark:group-hover/id:text-white" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                      Blood: {bloodType}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQrModal(true);
                      }}
                      title="Tap to show verification QR code"
                      className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 flex items-center justify-center transition active:scale-95"
                    >
                      <QrCode className="h-4 w-4 text-slate-800 dark:text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ----------------- BACK SIDE (3D Flip) ----------------- */}
              <div className="absolute inset-0 overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0c1424] p-5 sm:p-6 shadow-xl text-slate-900 dark:text-white backface-hidden rotate-y-180 flex flex-col justify-between">
                {/* Gold Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />

                <div className="relative z-10 flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="relative h-7 w-7 rounded-lg bg-black border border-amber-400/50 p-0.5 flex items-center justify-center">
                      <Image
                        src="/assets/BEEC_official_crest.jpg"
                        alt="BEEC Crest"
                        width={24}
                        height={24}
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <span className="font-display font-extrabold text-xs text-amber-600 dark:text-amber-400 tracking-wider uppercase">
                      Credential Details
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold">
                    {memberNumber}
                  </span>
                </div>

                {/* Back Details List */}
                <div className="relative z-10 py-3 space-y-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Eagles Region
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {region}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-1.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Club Affiliation
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {clubName}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-400/5 border border-amber-200/80 dark:border-amber-400/20">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
                      <Heart className="h-3 w-3 text-red-500" />
                      <span>Emergency Fraternal Contact</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Contact:</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate block">
                          {emergencyContactName || "Club Secretariat"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Phone:</span>
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {emergencyContactPhone || "+63 9XX XXX XXXX"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back Footer */}
                <div className="relative z-10 pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="italic font-serif">Deo Et Patria</span>
                  <span className="text-eagle-blue dark:text-amber-400 font-bold">Tap to Flip Front</span>
                </div>
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
          </div>
        </div>
      )}

      {/* QR Code Inspection Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200 dark:border-white/10 p-6 shadow-2xl flex flex-col items-center text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-3">
              <QrCode className="h-7 w-7 text-eagle-blue dark:text-amber-300" />
            </div>

            <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">
              Official Eagles QR Passcode
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Present this pass at official assemblies and fraternal functions
            </p>

            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-inner mb-4">
              <div className="relative h-44 w-44 flex items-center justify-center">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    `TFOE-PE:${memberNumber}:${fullName}:${clubName}`
                  )}`}
                  alt="Member QR Code"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>

            <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
              {memberNumber}
            </span>
            <span className="text-xs text-slate-500 font-medium mt-0.5">
              {fullName}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
