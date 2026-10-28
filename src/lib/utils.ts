import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

export function formatDate(
  dateStr: string | Date | number,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "TBA";
    return new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(
  dateStr: string | Date | number,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "TBA";
    return new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      ...options,
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

/**
 * Returns date components in Philippine timezone (Asia/Manila)
 */
export function getManilaDateParts(date: Date = new Date()): { year: number; month: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);
  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
  };
}

/**
 * Checks if a date falls on today in Philippine timezone
 */
export function isDateTodayManila(dateInput: string | Date | number): boolean {
  try {
    const target = new Date(dateInput);
    if (isNaN(target.getTime())) return false;
    const targetParts = getManilaDateParts(target);
    const nowParts = getManilaDateParts(new Date());
    return (
      targetParts.year === nowParts.year &&
      targetParts.month === nowParts.month &&
      targetParts.day === nowParts.day
    );
  } catch {
    return false;
  }
}

/**
 * Checks if a meeting date has passed (prior to today in Philippine timezone)
 */
export function isMeetingPastManila(dateInput: string | Date | number): boolean {
  try {
    const target = new Date(dateInput);
    if (isNaN(target.getTime())) return false;
    const targetParts = getManilaDateParts(target);
    const nowParts = getManilaDateParts(new Date());

    if (targetParts.year < nowParts.year) return true;
    if (targetParts.year > nowParts.year) return false;
    if (targetParts.month < nowParts.month) return true;
    if (targetParts.month > nowParts.month) return false;
    return targetParts.day < nowParts.day;
  } catch {
    return false;
  }
}

/**
 * Formats time in Philippine timezone (Asia/Manila)
 */
export function formatTime(
  dateStr: string | Date | number,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "TBA";
    return new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      ...options,
    }).format(d);
  } catch {
    return "";
  }
}

/**
 * Converts a 24-hour time string (e.g. "17:00", "09:30") or ISO string to 12-hour format (e.g. "5:00 PM", "9:30 AM")
 * without redundant timezone labels.
 */
export function formatTimeTo12Hour(timeStr?: string | null): string {
  if (!timeStr) return "TBA";
  const trimmed = timeStr.trim();
  if (/am|pm/i.test(trimmed)) {
    return trimmed.replace(/\s*\((ph\s*time|pst)\)/gi, "").replace(/\s*(ph\s*time|pst)/gi, "").trim();
  }
  const parts = trimmed.split(":");
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const period = hours >= 12 ? "PM" : "AM";
      const h12 = hours % 12 || 12;
      const mm = minutes.toString().padStart(2, "0");
      return `${h12}:${mm} ${period}`;
    }
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return formatTime(d);
  }
  return trimmed;
}


