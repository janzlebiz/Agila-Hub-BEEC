/**
 * AGILA Hub - Financial Calculation & Treasury Reconciliation Utilities
 * 
 * Provides decimal-safe monetary arithmetic, server/Philippine timezone due date evaluation,
 * payment allocation logic (advance payments, partial payments, overpayments),
 * and authoritative balance sheet reconciliation.
 */

export interface ContributionRecordLike {
  id: string;
  member_id?: string | null;
  title: string;
  category: string;
  amount: number;
  payment_method?: string | null;
  status: string;
  contribution_date: string;
  reference_number?: string | null;
  transaction_type?: "inflow" | "outflow";
}

export interface ExpenseRecordLike {
  id: string;
  title: string;
  category: string;
  amount: number;
  disbursedTo: string;
  disbursementDate: string;
  voucherNumber: string;
  approvedBy: string;
  status: string;
  notes?: string;
}

export type PaymentStatusType =
  | "Paid"
  | "Paid (Advance)"
  | "Overpaid"
  | "Partially Paid"
  | "Partially Paid (Overdue)"
  | "Pending"
  | "Overdue";

export interface MonthlyDuesScheduleItem {
  monthIndex: number; // 1 = January, 12 = December
  monthName: string; // e.g. "October 2026"
  shortMonthName: string; // e.g. "Oct 2026"
  assessedAmount: number; // e.g. 400.00
  dueDateISO: string; // e.g. "2026-10-25"
  dueDateFormatted: string; // e.g. "Oct 25, 2026"
  isPastDue: boolean;
  isDueToday: boolean;
  directPaidAmount: number; // Raw receipts received in this month
  allocatedPaidAmount: number; // Amount applied towards this month's obligation (up to assessedAmount)
  advanceCreditCovered: number; // Amount covered by an earlier advance payment
  status: PaymentStatusType;
  datePaid: string;
  paymentMethod?: string;
  referenceNumber?: string;
  receiptCount: number;
  allocationNote?: string;
  excessAdvanceCarriedOver?: number;
}

export interface AnnualDuesReconciliationResult {
  year: number;
  monthlyRate: number;
  totalAssessed: number; // e.g. 4800.00 (12 * 400)
  totalSettled: number; // e.g. 1900.00 (All verified payments)
  totalCoveredObligation: number; // Dues obligation cleared (e.g. 1600.00)
  totalAdvanceCreditCarriedForward: number; // Excess advance credit (e.g. 300.00)
  balanceDue: number; // e.g. 2900.00 (4800 - 1900)
  hasAdvancePayments: boolean;
  totalMonthsCoveredInAdvance: number;
  months: MonthlyDuesScheduleItem[];
  allReceiptsCount: number;
  verifiedReceiptsCount: number;
}

export interface BalanceSheetReconciliationResult {
  openingBalance: number;
  totalVerifiedReceiptsCount: number;
  totalReleasedVouchersCount: number;
  totalPendingPledgesCount: number;
  totalVerifiedDuesInflow: number;
  totalVerifiedDonationsInflow: number;
  totalVerifiedInflow: number;
  totalPendingPledgesAmount: number;
  totalAuditedDisbursements: number;
  calculatedReserves: number;
  reportedVaultReserves: number;
  discrepancy: number;
  isBalanced: boolean;
  reportingPeriod: string;
  lastReconciliationTimestamp: string;
}

// -----------------------------------------------------------------------------
// 1. DECIMAL-SAFE MONETARY ARITHMETIC
// -----------------------------------------------------------------------------

export function toCents(amount: number): number {
  return Math.round((Number(amount) || 0) * 100);
}

export function fromCents(cents: number): number {
  return (Math.round(cents) || 0) / 100;
}

export function addMoney(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

export function subtractMoney(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}

export function formatPeso(amount: number): string {
  const safe = Number(amount) || 0;
  return `₱${safe.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// -----------------------------------------------------------------------------
// 2. TIMEZONE & SERVER-AUTHORITATIVE DATE HELPERS
// -----------------------------------------------------------------------------

/**
 * Returns current date components strictly in Philippine timezone (Asia/Manila, UTC+8)
 */
export function getManilaNowParts(): { year: number; month: number; day: number } {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = formatter.formatToParts(new Date());
    const getPart = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);
    return {
      year: getPart("year") || 2026,
      month: getPart("month") || 10,
      day: getPart("day") || 25,
    };
  } catch {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }
}

export function getManilaTodayISO(): string {
  const { year, month, day } = getManilaNowParts();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isSameMemberId(id1?: string | null, id2?: string | null): boolean {
  if (!id1 || !id2) return false;
  if (id1 === id2) return true;

  const aliases: string[][] = [
    ["m-01", "00000000-0000-0000-0000-000000000001", "47d9bdfb-2e98-4c1d-83ad-9e758d0c816e"],
    ["m-02", "00000000-0000-0000-0000-000000000002", "2d58317c-aab0-4fcc-ac0e-080ea54e2679"],
    ["m-03", "00000000-0000-0000-0000-000000000003", "87989d1c-6d8a-4554-95a0-9a96e5a06ded"],
    ["m-04", "00000000-0000-0000-0000-000000000004", "211c406b-6a98-482c-8c9e-a50be7fdad55"],
  ];

  for (const group of aliases) {
    if (group.includes(id1) && group.includes(id2)) {
      return true;
    }
  }
  return false;
}

// -----------------------------------------------------------------------------
// 3. ANNUAL DUES & PAYMENT ALLOCATION ENGINE
// -----------------------------------------------------------------------------

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface CalculateDuesParams {
  year?: number;
  monthlyRate?: number;
  contributions: ContributionRecordLike[];
  memberId?: string | null;
  dueDay?: number;
  asOfDateISO?: string;
}

/**
 * Calculates a verified, non-distorting annual dues schedule supporting:
 * - Advance payments
 * - Partial payments
 * - Overpayments
 * - Payment allocation across months
 * - Explicit distinction between payment status and deadline expiration
 * - Duplicate receipt prevention
 */
export function calculateAnnualDuesSchedule({
  year = 2026,
  monthlyRate = 400,
  contributions = [],
  memberId,
  dueDay = 25,
  asOfDateISO,
}: CalculateDuesParams): AnnualDuesReconciliationResult {
  const todayISO = asOfDateISO || getManilaTodayISO();
  const safeRate = monthlyRate > 0 ? monthlyRate : 400;

  // 1. Filter verified dues contributions for the target member and year
  const rawMemberVerifiedDues = contributions.filter((c) => {
    if (!c.contribution_date) return false;
    const isVerified = c.status === "verified" || c.status === "approved";
    if (!isVerified) return false;

    // Filter by member if specified (supporting alias normalization)
    if (memberId && c.member_id && !isSameMemberId(memberId, c.member_id)) {
      return false;
    }

    const cDate = new Date(c.contribution_date);
    if (isNaN(cDate.getTime())) return false;
    const cYear = cDate.getFullYear();

    // Dues category matching
    const cat = (c.category || "").toLowerCase();
    const isDuesCategory =
      cat.includes("dues") ||
      cat.includes("monthly") ||
      cat.includes("annual") ||
      cat.includes("membership");

    return cYear === year && isDuesCategory;
  });

  // Deduplicate receipts to prevent duplicate payment allocations (Section A)
  const seenRefs = new Set<string>();
  const seenIds = new Set<string>();
  const memberVerifiedDues = rawMemberVerifiedDues.filter((c) => {
    if (c.id && seenIds.has(c.id)) return false;
    if (c.reference_number && seenRefs.has(c.reference_number)) return false;
    if (c.id) seenIds.add(c.id);
    if (c.reference_number) seenRefs.add(c.reference_number);
    return true;
  });

  // Sort chronologically
  memberVerifiedDues.sort((a, b) => new Date(a.contribution_date).getTime() - new Date(b.contribution_date).getTime());

  // 2. Compute Direct Payments per month
  const monthlyDirectReceipts: Map<number, ContributionRecordLike[]> = new Map();
  for (let m = 1; m <= 12; m++) {
    monthlyDirectReceipts.set(m, []);
  }

  for (const c of memberVerifiedDues) {
    const cDate = new Date(c.contribution_date);
    const mIndex = cDate.getMonth() + 1;
    if (mIndex >= 1 && mIndex <= 12) {
      monthlyDirectReceipts.get(mIndex)?.push(c);
    }
  }

  // 3. Payment Allocation Logic (Advance & Partial Payments)
  // Total assessed annual dues
  const totalAssessed = safeRate * 12;

  // Sum total payments received across all verified dues receipts for this year
  const totalSettledCents = memberVerifiedDues.reduce((acc, c) => acc + toCents(c.amount), 0);
  const totalSettled = fromCents(totalSettledCents);

  // Pool of available funds for FIFO allocation across the year's 12 months
  let remainingSettledCents = totalSettledCents;

  const monthItems: MonthlyDuesScheduleItem[] = [];

  for (let m = 1; m <= 12; m++) {
    const mStr = String(m).padStart(2, "0");
    const dStr = String(dueDay).padStart(2, "0");
    const dueDateISO = `${year}-${mStr}-${dStr}`;
    const monthName = `${MONTH_NAMES[m - 1]} ${year}`;
    const shortMonthName = `${MONTH_NAMES[m - 1].substring(0, 3)} ${year}`;

    // Deadline check
    const isPastDue = todayISO > dueDateISO;
    const isDueToday = todayISO === dueDateISO;

    const receipts = monthlyDirectReceipts.get(m) || [];
    const directPaidCents = receipts.reduce((acc, r) => acc + toCents(r.amount), 0);
    const directPaidAmount = fromCents(directPaidCents);

    // Primary receipt metadata if available
    const primaryReceipt = receipts[0];
    const datePaidFormatted = primaryReceipt
      ? new Date(primaryReceipt.contribution_date).toLocaleDateString("en-PH", {
          timeZone: "Asia/Manila",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";

    // Allocation calculation for this month
    const assessedCents = toCents(safeRate);
    const allocatedCents = Math.min(remainingSettledCents, assessedCents);
    const allocatedPaidAmount = fromCents(allocatedCents);
    remainingSettledCents = Math.max(0, remainingSettledCents - allocatedCents);

    // Determine status
    let status: PaymentStatusType = "Pending";
    let allocationNote: string | undefined = undefined;
    let advanceCreditCovered = 0;

    if (allocatedPaidAmount >= safeRate) {
      // Month obligation is fully covered
      if (directPaidAmount >= safeRate) {
        if (directPaidAmount > safeRate) {
          status = "Overpaid";
          const excess = subtractMoney(directPaidAmount, safeRate);
          allocationNote = `Includes ${formatPeso(excess)} advance credit allocated to subsequent dues`;
        } else {
          status = "Paid";
        }
      } else {
        // Covered by advance payment from an earlier month
        status = "Paid (Advance)";
        advanceCreditCovered = allocatedPaidAmount;
        allocationNote = "Covered in advance by earlier lump-sum payment";
      }
    } else if (allocatedPaidAmount > 0) {
      // Partially paid
      status = isPastDue ? "Partially Paid (Overdue)" : "Partially Paid";
      allocationNote = `${formatPeso(allocatedPaidAmount)} of ${formatPeso(safeRate)} settled`;
    } else {
      // Zero paid
      status = isPastDue ? "Overdue" : "Pending";
    }

    monthItems.push({
      monthIndex: m,
      monthName,
      shortMonthName,
      assessedAmount: safeRate,
      dueDateISO,
      dueDateFormatted: new Date(dueDateISO).toLocaleDateString("en-PH", {
        timeZone: "Asia/Manila",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      isPastDue,
      isDueToday,
      directPaidAmount,
      allocatedPaidAmount,
      advanceCreditCovered,
      status,
      datePaid: datePaidFormatted,
      paymentMethod: primaryReceipt?.payment_method || undefined,
      referenceNumber: primaryReceipt?.reference_number || undefined,
      receiptCount: receipts.length,
      allocationNote,
    });
  }

  // Calculate annual balances
  const totalCoveredObligation = fromCents(
    Math.min(totalSettledCents, toCents(totalAssessed))
  );
  const totalAdvanceCreditCarriedForward = fromCents(
    Math.max(0, totalSettledCents - toCents(totalAssessed))
  );
  const balanceDue = fromCents(
    Math.max(0, toCents(totalAssessed) - totalSettledCents)
  );

  const totalMonthsCoveredInAdvance = monthItems.filter((m) => m.status === "Paid (Advance)").length;
  const hasAdvancePayments = totalMonthsCoveredInAdvance > 0 || totalAdvanceCreditCarriedForward > 0;

  return {
    year,
    monthlyRate: safeRate,
    totalAssessed,
    totalSettled,
    totalCoveredObligation,
    totalAdvanceCreditCarriedForward,
    balanceDue,
    hasAdvancePayments,
    totalMonthsCoveredInAdvance,
    months: monthItems,
    allReceiptsCount: contributions.length,
    verifiedReceiptsCount: memberVerifiedDues.length,
  };
}

// -----------------------------------------------------------------------------
// 4. TREASURY BALANCE SHEET RECONCILIATION ENGINE
// -----------------------------------------------------------------------------

export function calculateTreasuryReconciliation({
  openingBalance = 0,
  contributions = [],
  expenses = [],
  reportedVaultReserves,
}: {
  openingBalance?: number;
  contributions: ContributionRecordLike[];
  expenses: ExpenseRecordLike[];
  reportedVaultReserves?: number;
}): BalanceSheetReconciliationResult {
  // Helper to identify outflows/disbursements (expenses and grants)
  const isOutflowRecord = (c: ContributionRecordLike) => {
    if (c.transaction_type === "outflow") return true;
    if (c.title?.startsWith("[EXPENSE]") || c.title?.startsWith("[GRANT]")) return true;
    if (c.category?.startsWith("Expense - ") || c.category === "Alalayang Agila") return true;
    return false;
  };

  // Deduplicate verified receipts by id and reference_number to prevent double-counting
  const seenIds = new Set<string>();
  const seenRefs = new Set<string>();
  const verifiedContributions = contributions.filter((c) => {
    const isVerified = c.status === "verified" || c.status === "approved";
    if (!isVerified) return false;
    // Strict accounting remediation: Outflows/grants/expenses MUST NOT be counted as inflows
    if (isOutflowRecord(c)) return false;
    if (c.id && seenIds.has(c.id)) return false;
    if (c.reference_number && seenRefs.has(c.reference_number)) return false;
    if (c.id) seenIds.add(c.id);
    if (c.reference_number) seenRefs.add(c.reference_number);
    return true;
  });
  const pendingContributions = contributions.filter(
    (c) => c.status === "pending" && !isOutflowRecord(c)
  );

  // Released expense vouchers and grants count strictly as disbursements
  const seenExpenseIds = new Set<string>();
  const seenExpenseRefs = new Set<string>();
  const allDisbursements: ExpenseRecordLike[] = [];

  // 1. From expenses array
  for (const e of expenses) {
    if (e.status === "released") {
      if (e.id && seenExpenseIds.has(e.id)) continue;
      if (e.voucherNumber && seenExpenseRefs.has(e.voucherNumber)) continue;
      if (e.id) seenExpenseIds.add(e.id);
      if (e.voucherNumber) seenExpenseRefs.add(e.voucherNumber);
      allDisbursements.push(e);
    }
  }

  // 2. From contributions table where transaction_type === 'outflow' or startsWith [EXPENSE]/[GRANT]
  for (const c of contributions) {
    if (
      isOutflowRecord(c) &&
      (c.status === "verified" || c.status === "approved" || c.status === "released")
    ) {
      const ref = c.reference_number || "";
      if (c.id && seenExpenseIds.has(c.id)) continue;
      if (ref && seenExpenseRefs.has(ref)) continue;
      if (c.id) seenExpenseIds.add(c.id);
      if (ref) seenExpenseRefs.add(ref);
      allDisbursements.push({
        id: c.id,
        title: c.title,
        category: c.category,
        amount: Number(c.amount),
        disbursedTo: "Beneficiary / Payee",
        disbursementDate: c.contribution_date,
        voucherNumber: ref,
        approvedBy: "Treasurer / Directorate",
        status: "released",
      });
    }
  }

  const releasedExpenses = allDisbursements;

  // 1. Total Verified Dues Inflow
  const verifiedDuesCents = verifiedContributions
    .filter((c) => {
      const cat = (c.category || "").toLowerCase();
      return (
        cat.includes("dues") ||
        cat.includes("monthly") ||
        cat.includes("annual") ||
        cat.includes("membership")
      );
    })
    .reduce((acc, c) => acc + toCents(c.amount), 0);

  // 2. Total Verified Donations Inflow (Liquid Gifts)
  const verifiedDonationsCents = verifiedContributions
    .filter((c) => {
      const cat = (c.category || "").toLowerCase();
      const title = (c.title || "").toLowerCase();
      return (
        cat.includes("donation") ||
        cat.includes("pledge") ||
        cat.includes("relief") ||
        title.includes("donation") ||
        title.includes("pledge")
      );
    })
    .reduce((acc, c) => acc + toCents(c.amount), 0);

  // Total Verified Inflow (Liquid Receipts)
  const totalVerifiedInflowCents = verifiedContributions.reduce((acc, c) => acc + toCents(c.amount), 0);
  const totalVerifiedInflow = fromCents(totalVerifiedInflowCents);

  // Pending Pledges (Non-cash commitments)
  const pendingPledgesCents = pendingContributions.reduce((acc, c) => acc + toCents(c.amount), 0);
  const totalPendingPledgesAmount = fromCents(pendingPledgesCents);

  // Total Audited Disbursements
  const auditedDisbursementsCents = releasedExpenses.reduce((acc, e) => acc + toCents(e.amount), 0);
  const totalAuditedDisbursements = fromCents(auditedDisbursementsCents);

  // Calculated Reserves = Opening Balance + Verified Inflow - Audited Disbursements
  const calculatedReservesCents = toCents(openingBalance) + totalVerifiedInflowCents - auditedDisbursementsCents;
  const calculatedReserves = fromCents(calculatedReservesCents);

  const vaultReserves = reportedVaultReserves !== undefined ? reportedVaultReserves : calculatedReserves;
  const discrepancy = Math.abs(subtractMoney(vaultReserves, calculatedReserves));
  const isBalanced = discrepancy === 0;

  const nowParts = getManilaNowParts();
  const quarter = Math.ceil(nowParts.month / 3);
  const reportingPeriod = `Fiscal Year ${nowParts.year} (Audit Cycle: Q${quarter} ${MONTH_NAMES[nowParts.month - 1]} ${nowParts.year})`;

  const lastReconciliationTimestamp = new Date().toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }) + " PHT";

  return {
    openingBalance,
    totalVerifiedReceiptsCount: verifiedContributions.length,
    totalReleasedVouchersCount: releasedExpenses.length,
    totalPendingPledgesCount: pendingContributions.length,
    totalVerifiedDuesInflow: fromCents(verifiedDuesCents),
    totalVerifiedDonationsInflow: fromCents(verifiedDonationsCents),
    totalVerifiedInflow,
    totalPendingPledgesAmount,
    totalAuditedDisbursements,
    calculatedReserves,
    reportedVaultReserves: vaultReserves,
    discrepancy,
    isBalanced,
    reportingPeriod,
    lastReconciliationTimestamp,
  };
}
