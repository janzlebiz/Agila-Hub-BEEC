"use client";

import React, { useState } from "react";
import {
  X,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit3,
  Trash2,
  Save,
  DollarSign,
  User,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface MonthDuesRowData {
  monthIndex: number;
  monthName: string;
  year: number;
  assessment: number;
  amountPaid: number;
  status: "paid" | "partial" | "unpaid" | "upcoming";
  matchingRecords: Array<{
    id: string;
    amount: number | string;
    payment_method: string;
    reference_number?: string | null;
    contribution_date?: string | null;
    status: string;
    title?: string;
  }>;
  member: {
    id: string;
    first_name: string;
    last_name: string;
    member_number?: string | null;
  } | null;
}

interface MonthlyDuesDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MonthDuesRowData | null;
  canManageFinance: boolean;
  onRecordPayment?: (monthName: string, memberId: string, remainingAmount: number) => void;
  onUpdateRecord?: (id: string, updates: { amount?: number; reference_number?: string; payment_method?: string; contribution_date?: string }) => Promise<void>;
  onDeleteRecord?: (id: string) => Promise<void>;
}

export function MonthlyDuesDetailModal({
  isOpen,
  onClose,
  data,
  canManageFinance,
  onRecordPayment,
  onUpdateRecord,
  onDeleteRecord,
}: MonthlyDuesDetailModalProps) {
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editRef, setEditRef] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [editMethod, setEditMethod] = useState<string>("GCash");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !data) return null;

  const remainingBalance = Math.max(0, data.assessment - data.amountPaid);
  const memberName = data.member
    ? `Kuya ${data.member.first_name} ${data.member.last_name}`
    : "Club Member";

  const handleStartEdit = (rec: any) => {
    setEditingRecordId(rec.id);
    setEditAmount(Number(rec.amount) || 0);
    setEditRef(rec.reference_number || "");
    setEditDate(rec.contribution_date || new Date().toISOString().split("T")[0]);
    setEditMethod(rec.payment_method || "GCash");
  };

  const handleCancelEdit = () => {
    setEditingRecordId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!onUpdateRecord) return;
    setIsSaving(true);
    try {
      await onUpdateRecord(id, {
        amount: Number(editAmount) || 0,
        reference_number: editRef.trim(),
        payment_method: editMethod,
        contribution_date: editDate,
      });
      setEditingRecordId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteRecord) return;
    if (confirm("Are you sure you want to delete this payment record? This will update the monthly dues balance.")) {
      await onDeleteRecord(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-eagle-blue/10 text-eagle-blue dark:text-blue-400 border border-eagle-blue/20 flex items-center justify-center font-bold">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                {data.monthName} {data.year} Monthly Dues
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {memberName} {data.member?.member_number ? `(${data.member.member_number})` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 overflow-y-auto space-y-4 text-xs pr-1">
          {/* Status and Assessment Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Assessment</span>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">
                ₱{data.assessment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Amount Paid</span>
              <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                ₱{data.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
              <div className="mt-1">
                {data.status === "paid" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> Paid
                  </span>
                )}
                {data.status === "partial" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    <AlertCircle className="h-3 w-3" /> Partial
                  </span>
                )}
                {data.status === "unpaid" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                    <Clock className="h-3 w-3" /> Unpaid
                  </span>
                )}
                {data.status === "upcoming" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400">
                    Upcoming
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Partial Balance Notification & Top-up Action */}
          {data.status === "partial" && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-amber-900 dark:text-amber-200 block text-xs">
                  Remaining Balance: ₱{remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  This month has been partially settled.
                </span>
              </div>
              {canManageFinance && onRecordPayment && data.member && (
                <button
                  type="button"
                  onClick={() => {
                    onRecordPayment(data.monthName, data.member!.id, remainingBalance);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition shrink-0"
                >
                  Complete Balance
                </button>
              )}
            </div>
          )}

          {/* Payment Records List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                Logged Payment Transactions ({data.matchingRecords.length})
              </span>
              {data.status !== "paid" && canManageFinance && onRecordPayment && data.member && (
                <button
                  type="button"
                  onClick={() => {
                    onRecordPayment(data.monthName, data.member!.id, remainingBalance || data.assessment);
                    onClose();
                  }}
                  className="text-xs font-bold text-eagle-blue dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Record Payment
                </button>
              )}
            </div>

            {data.matchingRecords.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-1">
                <CreditCard className="h-6 w-6 mx-auto text-slate-400" />
                <p className="text-xs text-slate-500">No payment transaction logged for this month.</p>
              </div>
            ) : (
              data.matchingRecords.map((rec) => {
                const isEditingThis = editingRecordId === rec.id;

                if (isEditingThis) {
                  return (
                    <div
                      key={rec.id}
                      className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border-2 border-eagle-blue/40 space-y-3 animate-fadeIn"
                    >
                      <div className="font-bold text-xs text-eagle-blue dark:text-blue-400 flex items-center justify-between">
                        <span>Edit Payment Details</span>
                        <span className="text-[10px] text-slate-400 font-normal">ID: {rec.id.slice(0, 8)}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">
                            Amount (PHP) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="50"
                            value={editAmount}
                            onChange={(e) => setEditAmount(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-canvas-slate border border-slate-300 dark:border-white/20 text-xs font-mono font-bold text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">
                            Payment Method
                          </label>
                          <select
                            value={editMethod}
                            onChange={(e) => setEditMethod(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-canvas-slate border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white"
                          >
                            <option value="GCash">GCash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash">Cash Remittance</option>
                            <option value="Check">Check</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">
                            Reference Number
                          </label>
                          <input
                            type="text"
                            value={editRef}
                            onChange={(e) => setEditRef(e.target.value)}
                            placeholder="e.g. 100234857"
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-canvas-slate border border-slate-300 dark:border-white/20 text-xs text-slate-900 dark:text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block mb-1">
                            Contribution Date
                          </label>
                          <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-canvas-slate border border-slate-300 dark:border-white/20 text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-white/10">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveEdit(rec.id)}
                          className="px-3 py-1.5 rounded-xl bg-eagle-blue text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                        >
                          <Save className="h-3.5 w-3.5" /> Save Changes
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                          ₱{Number(rec.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                          {rec.payment_method}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          Verified
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-1">
                        Ref: {rec.reference_number || "DIRECT"} • Date: {rec.contribution_date || "Recorded"}
                      </span>
                    </div>

                    {canManageFinance && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(rec)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-eagle-blue hover:bg-slate-100 dark:hover:bg-white/10 transition"
                          title="Edit Payment"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rec.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          title="Delete Record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end">
          <Button size="sm" variant="secondary" onClick={onClose} className="text-xs font-bold">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
