"use client";

import React, { useState } from "react";
import { 
  HeartHandshake, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  User, 
  Heart 
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface AlalayangGrantRecord {
  id: string;
  recipientName: string;
  recipientRelationship: "Member (Kuya)" | "Spouse" | "Child" | "Parent" | "Community Family";
  chapterOrAffiliation: string;
  contactNumber?: string;
  reason: string;
  category: "Medical & Hospitalization" | "Bereavement & Memorial" | "Calamity & Disaster Relief" | "Family & Livelihood Aid";
  amount: number;
  grantDate: string;
  voucherNumber: string;
  approvedBy: string;
  status: "disbursed" | "approved";
}

interface RecordAlalayangGrantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrantRecorded: (grant: AlalayangGrantRecord) => void;
  onSaveGrant?: (grant: AlalayangGrantRecord) => Promise<{ success: boolean; error?: string }>;
  currentRole: "admin" | "officer" | "member";
}

export function RecordAlalayangGrantModal({
  isOpen,
  onClose,
  onGrantRecorded,
  onSaveGrant,
  currentRole,
}: RecordAlalayangGrantModalProps) {
  const [recipientName, setRecipientName] = useState("");
  const [recipientRelationship, setRecipientRelationship] = useState<AlalayangGrantRecord["recipientRelationship"]>(
    "Member (Kuya)"
  );
  const [chapterOrAffiliation, setChapterOrAffiliation] = useState("Bantayog Elite Eagles Club");
  const [contactNumber, setContactNumber] = useState("");
  const [category, setCategory] = useState<AlalayangGrantRecord["category"]>("Medical & Hospitalization");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState<string>("10000");
  const [grantDate, setGrantDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [voucherNumber, setVoucherNumber] = useState<string>(
    `AA-GRANT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid grant amount greater than 0.");
      return;
    }
    if (!recipientName.trim()) {
      setError("Please enter the name of the beneficiary / recipient.");
      return;
    }
    if (!reason.trim()) {
      setError("Please specify the fraternal reason or medical/bereavement background.");
      return;
    }

    setSubmitting(true);

    const newGrant: AlalayangGrantRecord = {
      id: `grant-${Date.now()}`,
      recipientName: recipientName.trim(),
      recipientRelationship,
      chapterOrAffiliation: chapterOrAffiliation.trim() || "Bantayog Elite Eagles Club",
      contactNumber: contactNumber.trim() || undefined,
      category,
      reason: reason.trim(),
      amount: parsedAmount,
      grantDate,
      voucherNumber: voucherNumber.trim(),
      approvedBy: currentRole === "admin" ? "President Juan Dela Cruz & Alalayang Agila Committee" : "Club Directorate",
      status: "disbursed",
    };

    try {
      if (onSaveGrant) {
        const res = await onSaveGrant(newGrant);
        if (!res.success) {
          setError(res.error || "Failed to persist Alalayang Agila grant transaction to backend database.");
          setSubmitting(false);
          return;
        }
      }
      onGrantRecorded(newGrant);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving grant record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/15 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                Record Alalayang Agila Grant
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Fraternal benevolence, medical & emergency relief disbursement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-300 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Alalayang Agila grant recorded and added to fraternal roster!</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Recipient Name & Relationship */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Recipient / Beneficiary Full Name
              </label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g. Kuya Juan Santos"
                className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Relationship to Fraternity
              </label>
              <select
                value={recipientRelationship}
                onChange={(e) => setRecipientRelationship(e.target.value as AlalayangGrantRecord["recipientRelationship"])}
                className="w-full h-10 px-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Member (Kuya)">Member (Kuya)</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Community Family">Community Family</option>
              </select>
            </div>
          </div>

          {/* Chapter & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Club / Branch
              </label>
              <input
                type="text"
                value={chapterOrAffiliation}
                onChange={(e) => setChapterOrAffiliation(e.target.value)}
                placeholder="Bantayog Elite Eagles Club"
                className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Contact Phone (Optional)
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+63 9XX XXX XXXX"
                className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Assistance Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AlalayangGrantRecord["category"])}
                className="w-full h-10 px-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Medical & Hospitalization">Medical & Hospitalization</option>
                <option value="Bereavement & Memorial">Bereavement & Memorial</option>
                <option value="Calamity & Disaster Relief">Calamity & Disaster Relief</option>
                <option value="Family & Livelihood Aid">Family & Livelihood Aid</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Amount Granted (PHP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">
                  ₱
                </span>
                <input
                  type="number"
                  required
                  min="500"
                  step="500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-10 pl-7 pr-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 font-mono text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
                />
              </div>
            </div>
          </div>

          {/* Reason / Circumstances */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Reason / Fraternal Cause for Grant
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Hospitalization and emergency surgery assistance for acute cardiac procedure at provincial hospital."
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
            />
          </div>

          {/* Date & Voucher No */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Disbursement Date
              </label>
              <input
                type="date"
                required
                value={grantDate}
                onChange={(e) => setGrantDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Voucher / Grant Ref No.
              </label>
              <input
                type="text"
                required
                value={voucherNumber}
                onChange={(e) => setVoucherNumber(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-save-alalayang-grant"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <HeartHandshake className="h-4 w-4" />
            )}
            <span>Confirm & Disburse Alalayang Agila Grant</span>
          </button>
        </form>
      </div>
    </div>
  );
}
