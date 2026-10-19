"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  CreditCard,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  FileCheck,
} from "lucide-react";

interface SubmitContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId?: string;
  memberName?: string;
  onContributionSubmitted?: () => void;
}

export function SubmitContributionModal({
  isOpen,
  onClose,
  memberId,
  memberName = "Kuya Juan Dela Cruz",
  onContributionSubmitted,
}: SubmitContributionModalProps) {
  const supabase = createClient();

  const [title, setTitle] = useState("2026 Annual Membership Dues");
  const [category, setCategory] = useState("Monthly Dues");
  const [amount, setAmount] = useState("2400");
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Handle local image upload to private Supabase Storage 'receipts' bucket
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    setFeedback(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ownerFolder = user?.id || "unassigned";

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `${ownerFolder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("receipts")
        .upload(filePath, file, { upsert: true });

      if (error) {
        setFeedback({
          success: false,
          message: `Receipt upload failed: ${error.message}. Please retry with a valid image.`,
        });
        setReceiptUrl(null);
        setUploadingReceipt(false);
        return;
      }

      if (data) {
        // Generate secure private 7-day signed URL (never use public URLs for private receipts)
        const { data: signedData, error: signError } = await supabase.storage
          .from("receipts")
          .createSignedUrl(filePath, 60 * 60 * 24 * 7);

        if (signError || !signedData?.signedUrl) {
          throw new Error("Receipt uploaded to private storage, but failed to create secure signed URL.");
        }

        setReceiptUrl(signedData.signedUrl);
        setUploadingReceipt(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Receipt upload failed.";
      setFeedback({ success: false, message: msg });
      setReceiptUrl(null);
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setFeedback({ success: false, message: "Please specify a valid contribution amount." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      // Derive member identity strictly server-side from auth.uid()
      const { data, error } = await supabase.rpc("submit_self_contribution", {
        p_title: title.trim(),
        p_category: category,
        p_amount: Number(amount),
        p_payment_method: paymentMethod,
        p_reference_number: referenceNumber.trim() || `REF-${Date.now().toString().slice(-6)}`,
        p_proof_receipt_url: receiptUrl,
      });

      if (error) {
        // Fallback to submit_member_contribution if migration is pending
        const { data: fallbackData, error: fallbackError } = await supabase.rpc("submit_member_contribution", {
          p_title: title.trim(),
          p_category: category,
          p_amount: Number(amount),
          p_payment_method: paymentMethod,
          p_reference_number: referenceNumber.trim() || `REF-${Date.now().toString().slice(-6)}`,
          p_proof_receipt_url: receiptUrl,
        });

        if (fallbackError) {
          setFeedback({ success: false, message: fallbackError.message });
          return;
        }
        setFeedback({
          success: true,
          message: (fallbackData as { message?: string })?.message || "Contribution record submitted successfully!",
        });
      } else if (data) {
        const res = data as { success?: boolean; message?: string };
        if (res.success === false) {
          setFeedback({ success: false, message: res.message || "Failed to submit contribution." });
          return;
        }
        setFeedback({
          success: true,
          message: res.message || "Contribution record submitted successfully!",
        });
      }

      setTimeout(() => {
        if (onContributionSubmitted) onContributionSubmitted();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error submitting record.";
      setFeedback({ success: false, message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/20 p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">
                Submit Dues & Contribution
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Member: {memberName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold animate-fadeIn ${
              feedback.success
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/30 border-rose-300 text-rose-800 dark:text-rose-300"
            }`}
          >
            {feedback.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Title / Description
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Monthly Dues">Monthly Dues</option>
                <option value="Annual Dues">Annual Dues</option>
                <option value="Building Assessment">Building Assessment</option>
                <option value="Community Outreach">Community Outreach</option>
                <option value="Emergency Relief">Emergency Relief</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Amount (PHP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">
                  ₱
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-10 pl-7 pr-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 font-mono text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="GCash">GCash</option>
                <option value="Maya">Maya</option>
                <option value="Bank Transfer">Bank Transfer (BDO/BPI)</option>
                <option value="Cash">Cash to Treasurer</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Ref / Transaction No.
              </label>
              <input
                type="text"
                placeholder="e.g. GCASH-123456"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 font-mono text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
              />
            </div>
          </div>

          {/* Receipt Proof Upload */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Payment Screenshot / Receipt Proof
            </label>
            <div className="relative border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-4 text-center hover:border-eagle-blue transition">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {uploadingReceipt ? (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin text-eagle-blue" />
                  Uploading receipt proof...
                </div>
              ) : receiptUrl ? (
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <FileCheck className="h-4 w-4" />
                  Receipt Attached (Ready to submit)
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-500">
                  <Upload className="h-6 w-6 text-slate-400" />
                  <span className="text-xs font-semibold">Tap or drag receipt image here</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, PDF up to 5MB</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || uploadingReceipt}
              className="flex-1 h-11 text-xs font-bold"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Contribution"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
