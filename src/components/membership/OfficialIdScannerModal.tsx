"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { 
  Camera, 
  Upload, 
  X, 
  Check, 
  RotateCw, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  IdCard,
  RefreshCw,
  Eye
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface OfficialIdScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId?: string;
  memberName?: string;
  currentIdUrl?: string | null;
  onIdUpdated: (newIdUrl: string, frontUrl?: string, backUrl?: string) => void;
}

export function OfficialIdScannerModal({
  isOpen,
  onClose,
  memberId,
  memberName = "Kuya/Ate Member",
  currentIdUrl,
  onIdUpdated,
}: OfficialIdScannerModalProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "preset">("camera");

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Capture / Upload state
  const [capturedFront, setCapturedFront] = useState<string | null>(null);
  const [capturedBack, setCapturedBack] = useState<string | null>(null);
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [fileFront, setFileFront] = useState<File | null>(null);
  const [fileBack, setFileBack] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Initialize camera stream when camera tab is active
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    if (isOpen && activeTab === "camera") {
      setCameraError(null);
      navigator.mediaDevices
        ?.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        .then((stream) => {
          currentStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setStreamActive(true);
          }
        })
        .catch((err) => {
          console.warn("Camera access failed:", err);
          setCameraError("Camera unavailable or permission denied. Please use the Upload tab.");
          setStreamActive(false);
        });
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      setStreamActive(false);
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Capture snapshot from video feed
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    if (activeSide === "front") {
      setCapturedFront(dataUrl);
      setActiveSide("back");
    } else {
      setCapturedBack(dataUrl);
    }
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (side === "front") {
        setCapturedFront(reader.result as string);
        setFileFront(file);
      } else {
        setCapturedBack(reader.result as string);
        setFileBack(file);
      }
    };
    reader.readAsDataURL(file);
  };

  // Use Official Preset (e.g. Bantayog Elite Official Crest / ID)
  const handleUsePreset = () => {
    const officialSealUrl = "/assets/BEEC_official_crest.jpg";
    setCapturedFront(officialSealUrl);
    setSuccessMsg("Official Bantayog Elite Crest selected as Physical Credential!");
  };

  // Convert base64 dataUrl to blob for uploading
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Submit and replace ID in app
  const handleSaveAndReplaceId = async () => {
    if (!capturedFront) {
      setErrorMsg("Please scan or upload at least the Front of your Official Eagles ID.");
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let finalFrontUrl = capturedFront;
      let finalBackUrl = capturedBack || undefined;

      const { data: { user } } = await supabase.auth.getUser();
      const userFolder = user?.id || "guest";

      // If it's a data URL, upload to private member-ids storage bucket
      if (capturedFront.startsWith("data:")) {
        const frontBlob = dataUrlToBlob(capturedFront);
        const fileName = `${userFolder}/official_id_${Date.now()}_front.jpg`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("member-ids")
          .upload(fileName, frontBlob, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (!uploadErr && uploadData) {
          const { data: signedData } = await supabase.storage
            .from("member-ids")
            .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7-day signed URL
          if (signedData?.signedUrl) {
            finalFrontUrl = signedData.signedUrl;
          }
        }
      }

      if (capturedBack && capturedBack.startsWith("data:")) {
        const backBlob = dataUrlToBlob(capturedBack);
        const fileName = `${userFolder}/official_id_${Date.now()}_back.jpg`;
        const { data: uploadBackData, error: uploadBackErr } = await supabase.storage
          .from("member-ids")
          .upload(fileName, backBlob, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (!uploadBackErr && uploadBackData) {
          const { data: signedBackData } = await supabase.storage
            .from("member-ids")
            .createSignedUrl(fileName, 60 * 60 * 24 * 7);
          if (signedBackData?.signedUrl) {
            finalBackUrl = signedBackData.signedUrl;
          }
        }
      }

      // Authoritative database update with server-side validation
      if (memberId) {
        const { data: rpcData, error: rpcError } = await supabase.rpc("update_member_official_id", {
          p_member_id: memberId,
          p_id_url: finalFrontUrl,
          p_front_url: finalFrontUrl,
          p_back_url: finalBackUrl || null,
        });

        if (rpcError) throw rpcError;
        if (rpcData && !(rpcData as { success?: boolean; message?: string }).success) {
          throw new Error((rpcData as { success?: boolean; message?: string }).message || "Failed to update official ID in database.");
        }
      }

      // Trigger callback to replace ID in the app only upon verified success
      onIdUpdated(finalFrontUrl, finalFrontUrl, finalBackUrl);
      setSuccessMsg("Official Eagles ID replaced and verified successfully!");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      console.error("Failed to save official Eagles ID:", err);
      const msg = err instanceof Error ? err.message : "Failed to upload ID. Please try again.";
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/15 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <IdCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                Scan Official Eagles ID
                <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  TFOE-PE
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Replace your app ID with your official physical Eagles card
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-300 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 my-4 border border-slate-200/80 dark:border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("camera")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "camera"
                ? "bg-white dark:bg-canvas-dark text-eagle-blue dark:text-amber-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Camera className="h-3.5 w-3.5" /> Camera Scanner
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "upload"
                ? "bg-white dark:bg-canvas-dark text-eagle-blue dark:text-amber-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Upload className="h-3.5 w-3.5" /> Upload Photo
          </button>
          <button
            id="tab-scanner-preset"
            type="button"
            onClick={() => setActiveTab("preset")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === "preset"
                ? "bg-white dark:bg-canvas-dark text-eagle-blue dark:text-amber-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Official Crest
          </button>
        </div>

        {/* Active Tab Body */}
        {activeTab === "camera" && (
          <div className="space-y-3">
            {cameraError ? (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs">
                <p className="font-semibold mb-2">{cameraError}</p>
                <button
                  onClick={() => setActiveTab("upload")}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs"
                >
                  Switch to Upload Photo
                </button>
              </div>
            ) : (
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-amber-400/80 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* ID Card Alignment Reticle */}
                <div className="absolute inset-4 rounded-xl border-2 border-white/60 pointer-events-none flex flex-col justify-between p-3">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-white/90 bg-black/40 px-2 py-0.5 rounded backdrop-blur">
                    <span>ALIGN OFFICIAL CARD</span>
                    <span className="uppercase text-amber-300">
                      Capturing: {activeSide}
                    </span>
                  </div>
                  <div className="text-center text-[10px] font-bold text-white/80 bg-black/40 py-1 rounded backdrop-blur">
                    Keep card steady inside the box
                  </div>
                </div>

                {/* Capture Shutter Button */}
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 h-14 w-14 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 p-1 shadow-lg hover:scale-105 active:scale-95 transition flex items-center justify-center"
                  title="Capture snapshot"
                >
                  <div className="h-11 w-11 rounded-full bg-white flex items-center justify-center">
                    <Camera className="h-6 w-6 text-slate-900" />
                  </div>
                </button>
              </div>
            )}

            {/* Toggle Front / Back Capture */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 px-1">
              <span>Card Side:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSide("front")}
                  className={`px-3 py-1 rounded-lg border text-xs font-bold transition ${
                    activeSide === "front"
                      ? "bg-amber-500 text-white border-amber-500"
                      : "border-slate-300 dark:border-white/20"
                  }`}
                >
                  Front {capturedFront && "✓"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSide("back")}
                  className={`px-3 py-1 rounded-lg border text-xs font-bold transition ${
                    activeSide === "back"
                      ? "bg-amber-500 text-white border-amber-500"
                      : "border-slate-300 dark:border-white/20"
                  }`}
                >
                  Back (Optional) {capturedBack && "✓"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "upload" && (
          <div className="space-y-3">
            {/* Front Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Official Card - Front <span className="text-red-500">*</span>
              </label>
              <div className="relative border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-4 text-center hover:border-amber-400 transition bg-slate-50 dark:bg-white/5">
                {capturedFront ? (
                  <div className="relative aspect-[16/10] max-h-44 w-full mx-auto rounded-xl overflow-hidden shadow">
                    <Image
                      src={capturedFront}
                      alt="Front of Official ID"
                      fill
                      className="object-contain bg-slate-950"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedFront(null);
                        setFileFront(null);
                      }}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-4">
                    <Upload className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white block">
                      Choose Photo of Official Eagles ID (Front)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      PNG, JPG, or WEBP up to 10MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "front")}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Back Upload (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Official Card - Back <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-3 text-center hover:border-amber-400 transition bg-slate-50 dark:bg-white/5">
                {capturedBack ? (
                  <div className="relative aspect-[16/10] max-h-36 w-full mx-auto rounded-xl overflow-hidden shadow">
                    <Image
                      src={capturedBack}
                      alt="Back of Official ID"
                      fill
                      className="object-contain bg-slate-950"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedBack(null);
                        setFileBack(null);
                      }}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Upload Back of Card (Optional)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "back")}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "preset" && (
          <div className="space-y-4 py-2 text-center">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-canvas-dark dark:to-[#1a233a] border border-amber-300/80 dark:border-amber-400/30 text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative h-14 w-14 rounded-2xl bg-slate-900 border border-amber-400 p-1 shrink-0 shadow flex items-center justify-center">
                  <Image
                    src="/assets/BEEC_official_crest.jpg"
                    alt="Official Bantayog Elite Crest"
                    width={52}
                    height={52}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-slate-900 dark:text-white">
                    Bantayog Elite Eagles Club Crest
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                    The Fraternal Order of Eagles - PE, Inc.
                  </p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    High-resolution official heraldic emblem
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                Use the verified chapter crest as your primary high-fidelity official credential image immediately.
              </p>
              <button
                id="btn-use-official-crest"
                type="button"
                onClick={handleUsePreset}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs shadow hover:brightness-110 flex items-center justify-center gap-1.5"
              >
                <Check className="h-4 w-4" /> Use Bantayog Elite Official Crest
              </button>
            </div>
          </div>
        )}

        {/* Preview of captured images if any */}
        {(capturedFront || capturedBack) && (
          <div className="mt-4 p-3 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-2">
              Ready to Replace App ID:
            </span>
            <div className="flex gap-2">
              {capturedFront && (
                <div className="relative h-20 w-32 rounded-lg overflow-hidden border border-amber-400/60 shadow shrink-0">
                  <Image
                    src={capturedFront}
                    alt="Front preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <span className="absolute bottom-1 left-1 text-[9px] font-black bg-black/70 text-amber-300 px-1 rounded">
                    FRONT
                  </span>
                </div>
              )}
              {capturedBack && (
                <div className="relative h-20 w-32 rounded-lg overflow-hidden border border-slate-300 dark:border-white/20 shadow shrink-0">
                  <Image
                    src={capturedBack}
                    alt="Back preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <span className="absolute bottom-1 left-1 text-[9px] font-black bg-black/70 text-slate-200 px-1 rounded">
                    BACK
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feedback messages */}
        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            id="btn-replace-id-save"
            type="button"
            disabled={!capturedFront || uploading}
            onClick={handleSaveAndReplaceId}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-eagle-blue via-eagle-blue to-eagle-blue-dark text-white text-xs font-bold shadow-lg shadow-eagle-blue/20 hover:brightness-110 active:scale-95 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving ID...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-amber-300" /> Replace ID in App
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
