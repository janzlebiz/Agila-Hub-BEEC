"use client";

import React, { useState } from "react";
import { Calendar, CheckCircle2, Clock, AlertCircle, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface ContributionRecordLike {
  id: string;
  member_id?: string | null;
  title: string;
  category: string;
  amount: number;
  payment_method?: string | null;
  status: string;
  contribution_date: string;
  reference_number?: string | null;
}

interface AnnualContributionsTableProps {
  defaultRate?: number;
  contributions: ContributionRecordLike[];
  memberId?: string | null;
}

export function AnnualContributionsTable({
  defaultRate = 400,
  contributions,
  memberId,
}: AnnualContributionsTableProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const months = [
    { name: "January", monthIndex: 1, dueDay: 25 },
    { name: "February", monthIndex: 2, dueDay: 25 },
    { name: "March", monthIndex: 3, dueDay: 25 },
    { name: "April", monthIndex: 4, dueDay: 25 },
    { name: "May", monthIndex: 5, dueDay: 25 },
    { name: "June", monthIndex: 6, dueDay: 25 },
    { name: "July", monthIndex: 7, dueDay: 25 },
    { name: "August", monthIndex: 8, dueDay: 25 },
    { name: "September", monthIndex: 9, dueDay: 25 },
    { name: "October", monthIndex: 10, dueDay: 25 },
    { name: "November", monthIndex: 11, dueDay: 25 },
    { name: "December", monthIndex: 12, dueDay: 25 },
  ];

  // Map member contributions to months in selectedYear
  const monthlyRows = months.map((m) => {
    const monthStr = String(m.monthIndex).padStart(2, "0");
    const dueDate = `${selectedYear}-${monthStr}-${String(m.dueDay).padStart(2, "0")}`;

    // Look for matching contribution in that month/year
    const match = contributions.find((c) => {
      if (!c.contribution_date) return false;
      const cDate = new Date(c.contribution_date);
      const isDues = c.category.toLowerCase().includes("dues") || c.category.toLowerCase().includes("monthly");
      return (
        cDate.getFullYear() === selectedYear &&
        cDate.getMonth() + 1 === m.monthIndex &&
        (isDues || c.amount >= defaultRate)
      );
    });

    let status: "Paid" | "Pending" | "Overdue" = "Pending";
    let amountPaid = 0;
    let datePaid = "—";

    const now = new Date("2026-10-22");
    const dueDateTime = new Date(dueDate);

    if (match && (match.status === "verified" || match.status === "approved")) {
      status = "Paid";
      amountPaid = match.amount || defaultRate;
      datePaid = new Date(match.contribution_date).toLocaleDateString("en-GB");
    } else if (now > dueDateTime) {
      status = "Overdue";
    }

    return {
      month: `${m.name} ${selectedYear}`,
      amount: defaultRate,
      dueDate: new Date(dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status,
      amountPaid,
      datePaid,
    };
  });

  const totalAssessed = monthlyRows.reduce((acc, r) => acc + r.amount, 0);
  const totalPaid = monthlyRows.reduce((acc, r) => acc + r.amountPaid, 0);
  const totalBalance = Math.max(0, totalAssessed - totalPaid);

  return (
    <div className="rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden text-slate-900 dark:text-white transition-colors">
      {/* Top Header & Year Selector */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-eagle-blue dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-display font-black text-sm tracking-wide text-slate-900 dark:text-white">
              Annual Club Contributions & Dues Summary
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Default Club Contribution: ₱{defaultRate.toLocaleString(undefined, { minimumFractionDigits: 2 })} / month
            </span>
          </div>
        </div>

        {/* Year Dropdown / Tabs */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Year:</span>
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-white/10 p-1 border border-slate-200 dark:border-white/10 text-xs font-bold">
            {[2026, 2025, 2024].map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1 rounded-lg transition ${
                  selectedYear === year
                    ? "bg-eagle-blue text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards Strip */}
      <div className="grid grid-cols-3 border-b border-slate-100 dark:border-white/5 divide-x divide-slate-100 dark:divide-white/5 bg-slate-50/60 dark:bg-white/[0.02] text-xs">
        <div className="p-3 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Assessed</span>
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5 block">
            ₱{totalAssessed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="p-3 text-center">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Amount Settled</span>
          <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm mt-0.5 block">
            ₱{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="p-3 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Balance Due</span>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm mt-0.5 block">
            ₱{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Structured Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/[0.04] text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              <th className="py-3 px-4">Month</th>
              <th className="py-3 px-3">Assessed Amount</th>
              <th className="py-3 px-3">Due Date</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Amount Paid</th>
              <th className="py-3 px-4 text-right">Date Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
            {monthlyRows.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                  {row.month}
                </td>
                <td className="py-3 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                  ₱{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                  {row.dueDate}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      row.status === "Paid"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                        : row.status === "Overdue"
                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                    }`}
                  >
                    {row.status === "Paid" && <CheckCircle2 className="h-3 w-3" />}
                    {row.status === "Overdue" && <AlertCircle className="h-3 w-3" />}
                    {row.status === "Pending" && <Clock className="h-3 w-3" />}
                    {row.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                  ₱{row.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                  {row.datePaid}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
