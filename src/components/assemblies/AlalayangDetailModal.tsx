"use client";

import React, { useState } from "react";
import { X, HeartHandshake, Calendar, DollarSign, Edit3, Trash2, Save, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface AlalayangItem {
  id: string;
  beneficiaryName?: string;
  recipientName?: string;
  relationship?: string;
  recipientRelationship?: string;
  reason: string;
  amount: number;
  dateGranted?: string;
  grantDate?: string;
  status: "disbursed" | "approved" | "pending";
  approvedByName?: string;
  approvedBy?: string;
  chapterOrAffiliation?: string;
  contactNumber?: string;
  voucherNumber?: string;
  category?: string;
}

interface AlalayangDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  grant: AlalayangItem | null;
  canEdit?: boolean;
  onSave?: (grant: AlalayangItem) => void;
  onDelete?: (id: string) => void;
}

export function AlalayangDetailModal({
  isOpen,
  onClose,
  grant,
  canEdit = false,
  onSave,
  onDelete,
}: AlalayangDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState(grant?.beneficiaryName || grant?.recipientName || "");
  const [relationship, setRelationship] = useState(grant?.relationship || grant?.recipientRelationship || "");
  const [reason, setReason] = useState(grant?.reason || "");
  const [amount, setAmount] = useState(grant?.amount || 0);
  const [status, setStatus] = useState<"disbursed" | "approved" | "pending">(grant?.status || "disbursed");
  const [dateGranted, setDateGranted] = useState(grant?.dateGranted || grant?.grantDate || "");

  React.useEffect(() => {
    if (grant) {
      setBeneficiaryName(grant.beneficiaryName || grant.recipientName || "");
      setRelationship(grant.relationship || grant.recipientRelationship || "");
      setReason(grant.reason || "");
      setAmount(grant.amount || 0);
      setStatus(grant.status || "disbursed");
      setDateGranted(grant.dateGranted || grant.grantDate || "");
      setIsEditing(false);
    }
  }, [grant]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !grant) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!beneficiaryName.trim()) return;

    if (onSave) {
      onSave({
        ...grant,
        beneficiaryName: beneficiaryName.trim(),
        recipientName: beneficiaryName.trim(),
        relationship: relationship.trim(),
        recipientRelationship: relationship.trim(),
        reason: reason.trim(),
        amount: Number(amount),
        status,
        dateGranted,
        grantDate: dateGranted,
      });
    }
    setIsEditing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                {isEditing ? "Edit Alalayang Agila Record" : "Alalayang Agila Grant Details"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fraternal Benevolent Assistance & Mutual Aid
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            data-close-modal="true"
            className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content View or Edit Form */}
        <div className="py-4 overflow-y-auto space-y-4 text-xs">
          {isEditing ? (
            <form id="form-alalayang" onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Beneficiary Name
                </label>
                <input
                  type="text"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fraternal Relationship
                  </label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="e.g. Charter Member / Eagle Widow"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Grant Amount (₱)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min={0}
                    step={100}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Disbursement Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "disbursed" | "approved" | "pending")}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  >
                    <option value="disbursed">Disbursed Voucher</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date Released
                  </label>
                  <input
                    type="date"
                    value={dateGranted}
                    onChange={(e) => setDateGranted(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason & Assistance Purpose
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  placeholder="Details of emergency hospitalization, calamity assistance, bereavement support..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 uppercase tracking-wide">
                  {grant.status === "disbursed" ? "Disbursed" : grant.status}
                </span>

                <span className="font-mono font-black text-lg text-emerald-600 dark:text-emerald-400">
                  ₱{grant.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <h4 className="font-display font-black text-lg text-slate-900 dark:text-white">
                  {grant.beneficiaryName || grant.recipientName}
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Affiliation: {grant.relationship || grant.recipientRelationship} • {grant.chapterOrAffiliation || "Bantayog Elite Eagles Club"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-500/10 border border-amber-300/40 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block mb-1">
                  Assistance Reason & Details
                </span>
                {grant.reason}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500">
                <span>Date Granted: <b className="text-slate-800 dark:text-slate-200">{grant.dateGranted || grant.grantDate}</b></span>
                <span>Approved by: <b className="text-slate-800 dark:text-slate-200">{grant.approvedByName || grant.approvedBy}</b></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
          {canEdit && !isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold flex items-center gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Record
              </Button>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this Alalayang Agila record?")) {
                      onDelete(grant.id);
                      onClose();
                    }
                  }}
                  className="h-8 px-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              )}
            </div>
          ) : isEditing ? (
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <Button
                size="sm"
                variant="primary"
                form="form-alalayang"
                type="submit"
                className="text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="h-3.5 w-3.5" /> Save Changes
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={onClose} className="text-xs font-bold ml-auto">
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
