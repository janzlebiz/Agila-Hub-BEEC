"use client";

import React, { useState } from "react";
import { 
  Receipt, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Upload, 
  ArrowUpRight, 
  HeartHandshake, 
  RefreshCw 
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ExpenseRecord {
  id: string;
  title: string;
  category: "Membership Renewal" | "Community Service" | "Alalayang Agila" | "Club Operations" | "Chapter Operations" | "Assembly Logistics";
  amount: number;
  disbursedTo: string;
  disbursementDate: string;
  voucherNumber: string;
  approvedBy: string;
  status: "released" | "pending";
  notes?: string;
  created_at?: string;
}

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseRecorded: (expense: ExpenseRecord) => void;
  currentRole: "admin" | "officer" | "member";
}

export function RecordExpenseModal({
  isOpen,
  onClose,
  onExpenseRecorded,
  currentRole,
}: RecordExpenseModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseRecord["category"]>("Membership Renewal");
  const [amount, setAmount] = useState<string>("5000");
  const [disbursedTo, setDisbursedTo] = useState("");
  const [disbursementDate, setDisbursementDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [voucherNumber, setVoucherNumber] = useState<string>(
    `EXP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid expense amount greater than 0.");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a description for the expense release.");
      return;
    }
    if (!disbursedTo.trim()) {
      setError("Please specify the payee, recipient, or institution disbursed to.");
      return;
    }

    setSubmitting(true);

    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      title: title.trim(),
      category,
      amount: parsedAmount,
      disbursedTo: disbursedTo.trim(),
      disbursementDate,
      voucherNumber: voucherNumber.trim(),
      approvedBy: currentRole === "admin" ? "President Juan Dela Cruz" : "Treasurer Maria Santos",
      status: "released",
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    onExpenseRecorded(newExpense);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/15 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                Record Expense Release
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Track disbursed funds for renewal, community service & welfare
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
            <span>Expense release voucher recorded and treasury updated!</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Expense Description / Purpose
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. National Secretariat Membership Renewal Remittance (Q4)"
              className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseRecord["category"])}
                className="w-full h-10 px-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Membership Renewal">Membership Renewal</option>
                <option value="Community Service">Community Service</option>
                <option value="Alalayang Agila">Alalayang Agila</option>
                <option value="Assembly Logistics">Assembly Logistics</option>
                <option value="Club Operations">Club Operations</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Amount Released (PHP)
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

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Disbursed To (Payee / Recipient)
            </label>
            <input
              type="text"
              required
              value={disbursedTo}
              onChange={(e) => setDisbursedTo(e.target.value)}
              placeholder="e.g. TFOE-PE National Directorate / Tree Nursery Supplier"
              className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Disbursement Date
              </label>
              <input
                type="date"
                required
                value={disbursementDate}
                onChange={(e) => setDisbursementDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Voucher / Check Ref No.
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

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Additional Notes / Resolution Reference (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Authorized by BEEC Executive Council Resolution No. 12"
              className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            id="btn-save-expense-release"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:brightness-110 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUpRight className="h-4 w-4" />
            )}
            <span>Confirm & Record Expense Disbursement</span>
          </button>
        </form>
      </div>
    </div>
  );
}
