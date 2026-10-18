"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Camera,
  X,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Volume2,
  VolumeX,
} from "lucide-react";

interface QrAttendanceScannerProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onAttendanceRecorded?: () => void;
}

interface ScanResult {
  success: boolean;
  message: string;
  already_checked_in?: boolean;
  member?: {
    id?: string;
    name: string;
    role: string;
    status: string;
    club?: string;
    member_number?: string;
  };
}

export function QrAttendanceScanner({
  eventId,
  eventTitle,
  isOpen,
  onClose,
  onAttendanceRecorded,
}: QrAttendanceScannerProps) {
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [latestResult, setLatestResult] = useState<ScanResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Synthesize instant audio feedback (0 external dependencies)
  const playAudioCue = useCallback((type: "success" | "warn") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      if (type === "success") {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Audio autoplay policy handled silently
    }
  }, [soundEnabled]);

  // Execute check-in RPC with scanned member number
  const handleProcessCode = useCallback(async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || processing) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc("record_officer_attendance", {
        p_event_id: eventId,
        p_member_number: cleanCode,
      });

      if (error) {
        setLatestResult({
          success: false,
          message: error.message,
        });
        playAudioCue("warn");
      } else if (data) {
        setLatestResult(data as ScanResult);
        if (data.success) {
          playAudioCue("success");
          if (onAttendanceRecorded) onAttendanceRecorded();
        } else {
          playAudioCue("warn");
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error processing attendance.";
      setLatestResult({
        success: false,
        message,
      });
      playAudioCue("warn");
    } finally {
      setProcessing(false);
    }
  }, [eventId, processing, playAudioCue, onAttendanceRecorded, supabase]);

  // Initialize device camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera access is not supported on this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to access device camera.";
      setCameraError(`${message} (Use manual check-in or simulator presets below).`);
      setCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setLatestResult(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/20 p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-eagle-blue/10 dark:bg-eagle-blue/20 text-eagle-blue flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">
                Secretariat QR Attendance Scanner
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                {eventTitle.replace("[SEED] ", "")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute Check-in Sound" : "Enable Sound"}
              className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder Area */}
        <div className="my-4 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video flex items-center justify-center shadow-inner">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
            playsInline
            muted
          />

          {!cameraActive && (
            <div className="p-6 text-center text-slate-400 space-y-2">
              <QrCode className="h-12 w-12 mx-auto text-slate-600 animate-pulse" />
              <p className="text-xs font-semibold">
                {cameraError || "Camera standby. Ready for QR credential scanning."}
              </p>
              <Button size="sm" variant="outline" onClick={startCamera} className="text-xs mt-2">
                <RefreshCw className="h-3 w-3 mr-1" /> Retry Camera
              </Button>
            </div>
          )}

          {/* Targeting Laser Overlay & Frame */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-amber-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(254,194,1,0.3)]">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1 rounded-tl" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1 rounded-br" />
                {/* Animated horizontal laser beam */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Verified Result Card */}
        {latestResult && (
          <div
            className={`mb-4 p-4 rounded-2xl border transition-all animate-fadeIn ${
              latestResult.success
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                : latestResult.already_checked_in
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-200"
                : "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/30 text-rose-900 dark:text-rose-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {latestResult.success ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm block">
                  {latestResult.message}
                </span>

                {latestResult.member && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold block text-slate-900 dark:text-white">
                        {latestResult.member.name}
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300">
                        {latestResult.member.club || "Bantayog Elite Eagles Club"}
                      </span>
                    </div>
                    <Badge variant={latestResult.success ? "green" : "gold"} size="sm">
                      {latestResult.member.role.toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual Passcode / Simulation Trigger */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-3">
          <div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
              Manual Member ID Input / Barcode Scanner:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="e.g. AGILA-2024-001"
                className="flex-1 h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 font-mono text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleProcessCode(manualCode);
                }}
              />
              <Button
                size="sm"
                variant="primary"
                disabled={processing || !manualCode.trim()}
                onClick={() => handleProcessCode(manualCode)}
                className="h-10 px-4 text-xs font-bold"
              >
                Verify Pass
              </Button>
            </div>
          </div>

          {/* Quick Roster Simulation Buttons */}
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Quick Test Credentials:
            </span>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: "AGILA-2024-001", name: "Kuya Juan" },
                { id: "AGILA-2024-002", name: "Ate Maria" },
                { id: "AGILA-2024-003", name: "Kuya Pedro" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleProcessCode(m.id)}
                  disabled={processing}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/10 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 transition"
                >
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {m.id} ({m.name})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
