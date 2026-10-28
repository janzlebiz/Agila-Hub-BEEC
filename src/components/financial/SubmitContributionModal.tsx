"use client";

import React, { useState, useEffect } from "react";
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
  User,
  Building2,
  Calendar,
} from "lucide-react";

interface MemberItem {
  id: string;
  member_number?: string | null;
  first_name: string;
  last_name: string;
}

interface SubmitContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId?: string;
  memberName?: string;
  monthlyRateConfig?: {
    totalAmount: number;
    renewalAmount: number;
    alalayangAndServiceAmount: number;
  };
  onContributionSubmitted?: () => void;
  canManageFinance?: boolean;
  allMembers?: MemberItem[];
  initialCategory?: string;
  initialTargetMemberId?: string;
  initialMonth?: string;
}

const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function SubmitContributionModal({
  isOpen,
  onClose,
  memberId,
  memberName = "Kuya Chester Jan Camacho",
  monthlyRateConfig = {
    totalAmount: 400,
    renewalAmount: 100,
    alalayangAndServiceAmount: 300,
  },
  onContributionSubmitted,
  canManageFinance = false,
  allMembers = [],
  initialCategory,
  initialTargetMemberId,
  initialMonth,
}: SubmitContributionModalProps) {
  const supabase = createClient();

  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTH_OPTIONS[new Date().getMonth()];

  const [selectedTarget, setSelectedTarget] = useState<string>("self");
  const [title, setTitle] = useState("Monthly Fraternal Contribution");
  const [category, setCategory] = useState("Monthly Dues");
  const [amount, setAmount] = useState(monthlyRateConfig.totalAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState("GCash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [receiptStoragePath, setReceiptStoragePath] = useState<string | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Additional detail states
  const [outsideDonorName, setOutsideDonorName] = useState("");
  const [customPurpose, setCustomPurpose] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(`${initialMonth || currentMonthName} ${currentYear}`);
  const [contributionDate, setContributionDate] = useState(new Date().toISOString().split("T")[0]);

  // Sync initial props on open
  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        setCategory(initialCategory);
        handleCategoryChange(initialCategory);
      } else {
        setCategory("Monthly Dues");
        setTitle("Monthly Fraternal Contribution");
        setAmount(monthlyRateConfig.totalAmount.toString());
      }

      if (initialTargetMemberId) {
        setSelectedTarget(initialTargetMemberId);
      } else {
        setSelectedTarget("self");
      }

      if (initialMonth) {
        setSelectedMonth(`${initialMonth} ${currentYear}`);
      }

      setOutsideDonorName("");
      setCustomPurpose("");
      setFeedback(null);
      setReferenceNumber("");
      setReceiptStoragePath(null);
      setReceiptPreviewUrl(null);
    }
  }, [isOpen, initialCategory, initialTargetMemberId, initialMonth]);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (newCat === "Monthly Dues") {
      setTitle(`Monthly Dues - ${selectedMonth}`);
      setAmount(monthlyRateConfig.totalAmount.toString());
    } else if (newCat === "Meeting Contribution") {
      setTitle("General Assembly Meeting Contribution");
      setAmount("200");
    } else if (newCat === "Special Donation") {
      setTitle("Special Fraternal Donation");
      setAmount("1000");
    } else if (newCat === "Alalayang Agila Donation") {
      setTitle("Alalayang Agila Emergency Fund Donation");
      setAmount("500");
    } else if (newCat === "Community Service Support") {
      setTitle("Community Outreach Project Support");
      setAmount("500");
    } else if (newCat === "Outside Contribution") {
      setTitle("External Benefactor Contribution");
      setAmount("5000");
    } else if (newCat === "Others") {
      setTitle("Fraternal Contribution");
      setAmount("500");
    }
  };

  // Handle image upload to private Supabase Storage 'receipts' bucket
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    setFeedback(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.id) {
        setFeedback({
          success: false,
          message: "Authentication required: Please sign in to an active member account before uploading receipts.",
        });
        setUploadingReceipt(false);
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const storagePath = `${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("receipts")
        .upload(storagePath, file, { upsert: false });

      if (error) {
        setFeedback({
          success: false,
          message: `Receipt upload failed: ${error.message}. Please retry with a valid image.`,
        });
        setReceiptStoragePath(null);
        setReceiptPreviewUrl(null);
        setUploadingReceipt(false);
        return;
      }

      if (data) {
        setReceiptStoragePath(storagePath);
        const { data: signedData } = await supabase.storage
          .from("receipts")
          .createSignedUrl(storagePath, 3600);

        if (signedData) {
          setReceiptPreviewUrl(signedData.signedUrl);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload error.";
      setFeedback({ success: false, message: msg });
      setReceiptStoragePath(null);
      setReceiptPreviewUrl(null);
    } finally {
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
      const isOfficerRecording = canManageFinance;
      const isOutside = selectedTarget === "outside" || category === "Outside Contribution";

      // Build definitive title
      let finalTitle = title.trim();
      if (category === "Monthly Dues") {
        finalTitle = `Monthly Dues - ${selectedMonth}`;
      } else if (isOutside) {
        finalTitle = `[OUTSIDE] ${outsideDonorName.trim() || "External Sponsor"} - ${title.trim()}`;
      } else if (category === "Others" && customPurpose.trim()) {
        finalTitle = `[OTHERS] ${customPurpose.trim()}`;
      }

      // Determine target member ID
      let effectiveMemberId = memberId;
      if (isOfficerRecording) {
        if (selectedTarget === "outside") {
          effectiveMemberId = memberId; // Logged under officer as custodian
        } else if (selectedTarget !== "self" && selectedTarget) {
          effectiveMemberId = selectedTarget;
        }
      }

      if (!effectiveMemberId) {
        throw new Error("Unable to identify target member. Please ensure your account is authenticated.");
      }

      if (isOfficerRecording) {
        // Direct verified insertion by authorized finance officer (Treasurer or Secretary)
        if (category === "Monthly Dues" && Number(amount) > monthlyRateConfig.totalAmount) {
          // Multi-month automatic spillover: record exact assessment per month, spilling remaining to consecutive upcoming months
          let remainingAmount = Number(amount);
          const assessment = monthlyRateConfig.totalAmount;
          const [selMonthName, selYearStr] = selectedMonth.split(" ");
          let curMonthIdx = MONTH_OPTIONS.indexOf(selMonthName);
          if (curMonthIdx < 0) curMonthIdx = new Date().getMonth();
          let curYear = parseInt(selYearStr, 10) || currentYear;

          const recordsToInsert = [];
          const baseRef = referenceNumber.trim() || `VER-${Date.now().toString().slice(-6)}`;
          let partIndex = 1;

          while (remainingAmount > 0) {
            const chunkAmount = Math.min(assessment, remainingAmount);
            const mName = MONTH_OPTIONS[curMonthIdx];
            const titleForMonth = `Monthly Dues - ${mName} ${curYear}`;
            const refForMonth = partIndex === 1 ? baseRef : `${baseRef}-${mName.substring(0, 3).toUpperCase()}`;

            recordsToInsert.push({
              member_id: effectiveMemberId,
              title: titleForMonth,
              category: "Monthly Dues",
              amount: chunkAmount,
              payment_method: paymentMethod,
              reference_number: refForMonth,
              proof_receipt_url: receiptStoragePath,
              status: "verified",
              transaction_type: "inflow",
              contribution_date: contributionDate,
              verified_by: memberId,
              verified_at: new Date().toISOString(),
            });

            remainingAmount -= chunkAmount;
            curMonthIdx++;
            if (curMonthIdx >= 12) {
              curMonthIdx = 0;
              curYear++;
            }
            partIndex++;
          }

          const { error } = await supabase.from("contributions").insert(recordsToInsert as any);
          if (error) {
            throw new Error(error.message || "Failed to record multi-month verified contributions.");
          }

          setFeedback({
            success: true,
            message: `Successfully allocated ₱${Number(amount).toLocaleString()} across ${recordsToInsert.length} month(s) starting from ${selectedMonth}!`,
          });
        } else {
          const ref = referenceNumber.trim() || `VER-${Date.now().toString().slice(-6)}`;
          const { error } = await supabase.from("contributions").insert({
            member_id: effectiveMemberId,
            title: finalTitle,
            category: isOutside ? "Outside Contribution" : category,
            amount: Number(amount),
            payment_method: paymentMethod,
            reference_number: ref,
            proof_receipt_url: receiptStoragePath,
            status: "verified",
            transaction_type: "inflow",
            contribution_date: contributionDate,
            verified_by: memberId,
            verified_at: new Date().toISOString(),
          } as any);

          if (error) {
            throw new Error(error.message || "Failed to record verified contribution in ledger.");
          }

          setFeedback({
            success: true,
            message: `Successfully recorded and verified ₱${Number(amount).toLocaleString()} in Financials!`,
          });
        }
      } else {
        // Regular member self-service: submit through secure RPC for officer verification
        const { data, error } = await supabase.rpc("submit_self_contribution", {
          p_title: finalTitle,
          p_category: category,
          p_amount: Number(amount),
          p_payment_method: paymentMethod,
          p_reference_number: referenceNumber.trim() || `REF-${Date.now().toString().slice(-6)}`,
          p_proof_receipt_url: receiptStoragePath,
        });

        if (error) {
          throw new Error(error.message || "Failed to submit contribution.");
        }

        if (data) {
          const res = data as { success?: boolean; message?: string };
          if (res.success === false) {
            throw new Error(res.message || "Failed to submit contribution.");
          }
        }

        setFeedback({
          success: true,
          message: "Contribution record submitted for verification!",
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
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/20 p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-slate-900 dark:text-white">
                {canManageFinance ? "Record Dues & Contribution" : "Submit Dues & Contribution"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {canManageFinance ? "Financial Officer Entry (Auto-Verified Inflow)" : `Member: ${memberName}`}
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
          
          {/* Officer Target Member Selector */}
          {canManageFinance && allMembers.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Record Contribution For
              </label>
              <div className="relative">
                <select
                  value={selectedTarget}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTarget(val);
                    if (val === "outside") {
                      setCategory("Outside Contribution");
                      handleCategoryChange("Outside Contribution");
                    } else if (category === "Outside Contribution") {
                      setCategory("Monthly Dues");
                      handleCategoryChange("Monthly Dues");
                    }
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
                >
                  <option value="self">Myself ({memberName})</option>
                  <optgroup label="Club Members (Official 13)">
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        Kuya {m.first_name} {m.last_name} ({m.member_number})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="External Sources">
                    <option value="outside">Outside Contributor / Benefactor / Sponsor</option>
                  </optgroup>
                </select>
              </div>
            </div>
          )}

          {/* Outside Contributor Name (If Outside Selected) */}
          {(selectedTarget === "outside" || category === "Outside Contribution") && (
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-400/30 space-y-2 animate-fadeIn">
              <label className="text-xs font-bold text-purple-900 dark:text-purple-200 block">
                Outside Donor / Benefactor / Organization Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Office of Mayor / ABC Foundation / Rotary Club"
                value={outsideDonorName}
                onChange={(e) => setOutsideDonorName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-canvas-slate border border-purple-300 dark:border-purple-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <span className="text-[10px] text-purple-700 dark:text-purple-300 block">
                This external donation will be displayed publicly in the Outside Contributions section for all members to view.
              </span>
            </div>
          )}

          {/* Category & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full h-10 px-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Monthly Dues">Monthly Dues (₱{monthlyRateConfig.totalAmount})</option>
                <option value="Meeting Contribution">Meeting Contribution</option>
                <option value="Special Donation">Special Donation</option>
                <option value="Alalayang Agila Donation">Alalayang Agila Donation</option>
                <option value="Community Service Support">Community Service Support</option>
                <option value="Outside Contribution">Outside Contribution</option>
                <option value="Others">Others</option>
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

          {/* If Category is Monthly Dues, Show Month Picker */}
          {category === "Monthly Dues" && (
            <div className="grid grid-cols-2 gap-3 animate-fadeIn">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Applicable Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setTitle(`Monthly Dues - ${e.target.value}`);
                  }}
                  className="w-full h-10 px-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  {MONTH_OPTIONS.map((m) => (
                    <option key={m} value={`${m} ${currentYear}`}>
                      {m} {currentYear}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={contributionDate}
                  onChange={(e) => setContributionDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* If Category is Others, Free-Text Box */}
          {category === "Others" && (
            <div className="space-y-1 animate-fadeIn">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Specify Purpose / Allocation Details *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Building Fund Assessment / Anniversary Gala / Custom Pledge"
                value={customPurpose}
                onChange={(e) => {
                  setCustomPurpose(e.target.value);
                  setTitle(`[OTHERS] ${e.target.value}`);
                }}
                className="w-full h-10 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.08] border border-slate-300 dark:border-white/20 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue/50"
              />
            </div>
          )}

          {/* Title / Description */}
          {category !== "Monthly Dues" && category !== "Others" && (
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
          )}

          {/* Monthly Dues Allocation Breakdown */}
          {category === "Monthly Dues" && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-xs space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-200">
                <span>Monthly Fraternal Allocation Breakdown:</span>
                <span className="font-mono">₱{monthlyRateConfig.totalAmount.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="p-2 rounded-xl bg-white/80 dark:bg-canvas-slate/80 border border-amber-300/40">
                  <span className="text-slate-500 block text-[10px]">Renewal Remittance:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    ₱{monthlyRateConfig.renewalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/80 dark:bg-canvas-slate/80 border border-amber-300/40">
                  <span className="text-slate-500 block text-[10px]">Alalayang Agila & Service:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    ₱{monthlyRateConfig.alalayangAndServiceAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method & Reference Number */}
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
                <option value="Check">Manager's Check</option>
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
              ) : receiptStoragePath ? (
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
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : canManageFinance ? (
                "Record & Verify Inflow"
              ) : (
                "Submit Contribution"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
