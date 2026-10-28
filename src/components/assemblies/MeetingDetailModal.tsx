"use client";

import React, { useState } from "react";
import { 
  X, 
  Calendar, 
  MapPin, 
  Clock, 
  Edit3, 
  Trash2, 
  Check, 
  Save, 
  Shield, 
  DollarSign, 
  Shirt, 
  FileText, 
  UserCheck, 
  UserX,
  CreditCard,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate, formatTimeTo12Hour } from "@/lib/utils";

export interface MeetingItem {
  id: string;
  title: string;
  description?: string | null;
  event_date: string;
  event_time?: string | null;
  location?: string | null;
  address?: string | null;
  attire?: string | null;
  contribution_amount?: number | null;
  checkin_code?: string | null;
  checkin_open?: boolean | null;
  status?: string | null;
  what?: string | null;
  when?: string | null;
  where?: string | null;
  meetingContribution?: number | null;
  agenda?: string | null;
  rsvpsList?: any[];
  paymentsList?: any[];
  rsvps?: {
    [memberId: string]: {
      status: "attending" | "declined";
      memberName: string;
      reason?: string;
      timestamp: string;
    };
  };
  paid_members?: string[];
}

interface MeetingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingItem | null;
  canEdit?: boolean;
  isNew?: boolean;
  initialEditMode?: boolean;
  currentMember?: { id: string; name?: string; first_name?: string; last_name?: string } | null;
  onSave?: (meeting: MeetingItem) => void;
  onDelete?: (id: string) => void;
  onRsvp?: (meetingId: string, status: "attending" | "declined" | "cancelled", reason?: string) => void;
  onRecordContributionPayment?: (meetingId: string, memberId: string, memberName: string, amount: number) => void;
  membersList?: Array<{ id: string; first_name: string; last_name: string; member_number?: string | null }>;
  attendanceRecords?: Array<{ event_id: string; member_id: string; status: string; notes?: string }>;
}

export function MeetingDetailModal({
  isOpen,
  onClose,
  meeting,
  canEdit = false,
  isNew = false,
  initialEditMode = false,
  currentMember,
  onSave,
  onDelete,
  onRsvp,
  onRecordContributionPayment,
  membersList = [],
  attendanceRecords = [],
}: MeetingDetailModalProps) {
  const [isEditing, setIsEditing] = useState(isNew || initialEditMode);
  const [title, setTitle] = useState(meeting?.title || "");
  const [description, setDescription] = useState(meeting?.description || "");
  const [eventDate, setEventDate] = useState(meeting?.event_date ? meeting.event_date.split("T")[0] : "");
  const [eventTime, setEventTime] = useState(meeting?.event_time || "09:00");
  const [location, setLocation] = useState(meeting?.location || "");
  const [address, setAddress] = useState(meeting?.address || "");
  const [attire, setAttire] = useState(meeting?.attire || "");
  const [contributionAmount, setContributionAmount] = useState<number>(meeting?.contribution_amount ?? 500);

  // RSVP decline flow state
  const [isDeclining, setIsDeclining] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [rsvpFeedback, setRsvpFeedback] = useState<string | null>(null);

  // Payment recording state
  const [selectedPayMemberId, setSelectedPayMemberId] = useState("");

  React.useEffect(() => {
    if (!isOpen) return;

    if (isNew) {
      // Pristine reset on new meeting creation - never carry over prior meeting inputs
      setTitle("");
      setDescription("");
      setEventDate(new Date().toISOString().split("T")[0]);
      setEventTime("09:00");
      setLocation("");
      setAddress("");
      setAttire("");
      setContributionAmount(500);
      setIsEditing(true);
      setIsDeclining(false);
      setDeclineReason("");
      setRsvpFeedback(null);
      setSelectedPayMemberId("");
    } else if (meeting) {
      setTitle(meeting.title.replace("[SEED] ", ""));
      setDescription(meeting.agenda || meeting.description || "");
      setEventDate(meeting.event_date ? meeting.event_date.split("T")[0] : "");
      setEventTime(meeting.event_time || "09:00");
      setLocation(meeting.where || meeting.location || "");
      setAddress(meeting.address || "");
      setAttire(meeting.attire || "");
      setContributionAmount(typeof meeting.contribution_amount === "number" ? meeting.contribution_amount : (typeof meeting.meetingContribution === "number" ? meeting.meetingContribution : 500));
      setIsEditing(isNew || Boolean(initialEditMode));
      setIsDeclining(false);
      setDeclineReason("");
      setRsvpFeedback(null);
      setSelectedPayMemberId("");
    }
  }, [meeting, isNew, initialEditMode, isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !meeting) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (onSave) {
      onSave({
        ...meeting,
        title: title.trim(),
        description: description.trim(),
        event_date: eventDate,
        event_time: eventTime,
        location: location.trim(),
        address: address.trim(),
        attire: attire.trim(),
        contribution_amount: Number(contributionAmount) || 0,
        what: title.trim(),
        when: eventDate,
        where: location.trim(),
        meetingContribution: Number(contributionAmount) || 0,
        agenda: description.trim(),
        status: "scheduled",
      });
    }
    setIsEditing(false);
    onClose();
  };

  const handleAttendingRsvp = () => {
    if (!currentMember || !onRsvp) return;
    onRsvp(meeting.id, "attending");
    setRsvpFeedback("You are confirmed attending this meeting!");
    setTimeout(() => setRsvpFeedback(null), 3000);
  };

  const handleWithdrawRsvp = () => {
    if (!currentMember || !onRsvp) return;
    onRsvp(meeting.id, "cancelled");
    setRsvpFeedback("Your RSVP has been removed.");
    setTimeout(() => setRsvpFeedback(null), 3000);
  };

  const handleDeclineRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember || !onRsvp) return;
    if (!declineReason.trim()) {
      alert("Please state your reason for being unable to attend.");
      return;
    }
    onRsvp(meeting.id, "declined", declineReason.trim());
    setIsDeclining(false);
    setDeclineReason("");
    setRsvpFeedback("Your regrets and reason have been recorded for the Secretariat.");
    setTimeout(() => setRsvpFeedback(null), 3000);
  };

  const handlePayContribution = () => {
    if (!selectedPayMemberId || !onRecordContributionPayment) return;
    const mem = membersList.find((m) => m.id === selectedPayMemberId);
    if (!mem) return;
    const memberName = `${mem.first_name} ${mem.last_name}`;
    onRecordContributionPayment(meeting.id, mem.id, memberName, contributionAmount || 0);
    setSelectedPayMemberId("");
  };

  // Compile synchronized attendance and RSVP rosters
  const meetingAttRecords = (attendanceRecords || []).filter((r) => r.event_id === meeting.id);
  const rsvps = meeting.rsvps || {};

  interface AttendeeEntry {
    id: string;
    name: string;
    isVerified: boolean;
  }

  interface DeclinedEntry {
    id: string;
    name: string;
    reason: string;
    isSecretariatExcused: boolean;
  }

  const attendingMap = new Map<string, AttendeeEntry>();
  const declinedMap = new Map<string, DeclinedEntry>();

  // 1. Process Secretariat / Officer Manual Attendance Checks
  meetingAttRecords.forEach((att) => {
    const mem = membersList.find((m) => m.id === att.member_id);
    const memName = mem ? `${mem.first_name} ${mem.last_name}` : `Kuya Member`;
    const st = (att.status || "").toLowerCase();
    if (st === "excused" || st === "declined") {
      declinedMap.set(att.member_id, {
        id: att.member_id,
        name: memName,
        reason: att.notes || "Excused by Secretariat",
        isSecretariatExcused: true,
      });
    } else if (st === "present" || st === "late" || st === "attended" || !st) {
      attendingMap.set(att.member_id, {
        id: att.member_id,
        name: memName,
        isVerified: true,
      });
    }
  });

  // 2. Process Member RSVPs (fill in intent to attend or regrets)
  Object.entries(rsvps).forEach(([memId, rsvp]) => {
    const mem = membersList.find((m) => m.id === memId);
    const memName = rsvp.memberName || (mem ? `${mem.first_name} ${mem.last_name}` : `Kuya Member`);
    if (rsvp.status === "attending") {
      if (!attendingMap.has(memId) && !declinedMap.has(memId)) {
        attendingMap.set(memId, {
          id: memId,
          name: memName,
          isVerified: false,
        });
      }
    } else if (rsvp.status === "declined") {
      if (!declinedMap.has(memId) && !attendingMap.has(memId)) {
        declinedMap.set(memId, {
          id: memId,
          name: memName,
          reason: rsvp.reason || "Regrets filed",
          isSecretariatExcused: false,
        });
      }
    }
  });

  const attendingList = Array.from(attendingMap.values());
  const declinedList = Array.from(declinedMap.values());

  const userAtt = currentMember ? meetingAttRecords.find((r) => r.member_id === currentMember.id) : null;
  const userRsvp = currentMember ? rsvps[currentMember.id] : null;
  const isUserAttending = Boolean(
    (userAtt && (userAtt.status === "present" || userAtt.status === "late" || userAtt.status === "attended")) ||
    (userRsvp && userRsvp.status === "attending")
  );
  const isUserExcused = Boolean(
    (userAtt && (userAtt.status === "excused" || userAtt.status === "declined")) ||
    (userRsvp && userRsvp.status === "declined")
  );
  const paidMembers = meeting.paid_members || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="meeting-detail-modal"
        className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-eagle-blue/10 text-eagle-blue dark:text-blue-400 border border-eagle-blue/20 flex items-center justify-center font-bold">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                {isNew ? "Schedule Club Meeting" : isEditing ? "Edit Meeting Details" : "Official Meeting Notice"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Bantayog Elite Eagles Club • General Assemblies & Meetings
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

        {/* Modal Body */}
        <div className="py-4 overflow-y-auto space-y-4 text-xs pr-1">
          {isEditing ? (
            <form id="form-meeting" onSubmit={handleSave} className="space-y-3.5">
              {/* Meeting Title (What) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  What: Meeting Title / Agenda Topic *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Monthly General Membership Meeting (GMM)"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                />
              </div>

              {/* When: Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    When: Date *
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      When: Time *
                    </label>
                    <span className="text-[11px] font-bold text-eagle-blue dark:text-amber-400">
                      ({formatTimeTo12Hour(eventTime)})
                    </span>
                  </div>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>

              {/* Where & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Where: Venue Name *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Daet Clubhouse"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Address: Exact Location / Hall *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Laniton, Basud, Camarines Norte"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>

              {/* Attire & Meeting Contribution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Attire: Meeting Decorum *
                  </label>
                  <input
                    type="text"
                    value={attire}
                    onChange={(e) => setAttire(e.target.value)}
                    placeholder="e.g. Club Uniform / Type A, Eagle Polo Shirt"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Meeting Assessment / Contribution (PHP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-slate-500">
                      ₱
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(Number(e.target.value))}
                      placeholder="200"
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Agenda & Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Agenda: Discussion Points & Business
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="1. Roll Call of Officers & Members&#10;2. Treasury Financial Report&#10;3. Upcoming Community Outreach Projects&#10;4. Fraternal Matters & Other Business"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-eagle-blue font-mono"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Formatted Meeting Notice per User Specification */}
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-slate-900 dark:text-slate-100 space-y-3.5 shadow-sm">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-black text-sm tracking-wide uppercase border-b border-amber-500/20 pb-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Attention All Club Members!</span>
                </div>

                <div className="space-y-2 text-xs leading-relaxed">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                    <span className="font-black text-slate-600 dark:text-slate-400 min-w-[70px] uppercase text-[11px]">
                      What:
                    </span>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {title}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                    <span className="font-black text-slate-600 dark:text-slate-400 min-w-[70px] uppercase text-[11px]">
                      When:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {eventDate ? formatDate(eventDate, { month: "long", day: "numeric", year: "numeric" }) : "TBA"} • {formatTimeTo12Hour(eventTime)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                    <span className="font-black text-slate-600 dark:text-slate-400 min-w-[70px] uppercase text-[11px]">
                      Where:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {location || "Club Clubhouse"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                    <span className="font-black text-slate-600 dark:text-slate-400 min-w-[70px] uppercase text-[11px]">
                      Address:
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {address || "Laniton, Basud, Camarines Norte"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                    <span className="font-black text-slate-600 dark:text-slate-400 min-w-[70px] uppercase text-[11px]">
                      Attire:
                    </span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {attire || "Type B / Eagle Decorum"}
                    </span>
                  </div>

                  {contributionAmount > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                      <span className="font-black text-slate-600 dark:text-slate-400 min-w-[70px] uppercase text-[11px]">
                        Fee / Dues:
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                        ₱{contributionAmount.toLocaleString()} per Kuya
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-amber-500/20">
                    <span className="font-black text-slate-600 dark:text-slate-400 block mb-1 uppercase text-[11px]">
                      Agenda:
                    </span>
                    <div className="p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-slate-200 dark:border-white/10 font-mono text-xs whitespace-pre-wrap">
                      {description || "1. Call to Order\n2. Roll Call & Verification of Attendance\n3. Financial & Treasury Status\n4. Community Projects & Fraternal Decorum"}
                    </div>
                  </div>
                </div>
              </div>

              {/* RSVP Feedback Notification */}
              {rsvpFeedback && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>{rsvpFeedback}</span>
                </div>
              )}

              {/* Member RSVP Interaction Panel */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                    Your Assembly RSVP
                  </span>
                  {(isUserAttending || isUserExcused) && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        isUserAttending
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                      }`}
                    >
                      {isUserAttending ? "Confirmed Attending" : "Regrets Recorded"}
                    </span>
                  )}
                </div>

                {!isDeclining ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    {isUserAttending ? (
                      <>
                        <button
                          type="button"
                          onClick={handleWithdrawRsvp}
                          className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                        >
                          <UserX className="h-4 w-4" /> Cancel / Withdraw RSVP
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsDeclining(true)}
                          className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-xs transition"
                        >
                          Change to Not Able to Attend
                        </button>
                      </>
                    ) : isUserExcused ? (
                      <>
                        <button
                          type="button"
                          onClick={handleAttendingRsvp}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
                        >
                          <UserCheck className="h-4 w-4" /> Change to Attending
                        </button>
                        <button
                          type="button"
                          onClick={handleWithdrawRsvp}
                          className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 font-bold text-xs transition"
                        >
                          Clear Regrets
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={handleAttendingRsvp}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95"
                        >
                          <UserCheck className="h-4 w-4" /> RSVP / Attending
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsDeclining(true)}
                          className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
                        >
                          <UserX className="h-4 w-4" /> Not Able to Attend
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleDeclineRsvpSubmit} className="space-y-2 pt-1 border-t border-slate-200 dark:border-white/10">
                    <label className="text-xs font-bold text-rose-600 dark:text-rose-400 block">
                      State Reason for Inability to Attend * (Required)
                    </label>
                    <input
                      type="text"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="e.g. Official Work Travel, Family Emergency, Medical Checkup..."
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-slate-300 dark:border-white/20 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition"
                      >
                        Submit Reason & Regrets
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDeclining(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-bold text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Attendees & Regrets Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Attending */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4" /> Confirmed Attendees
                    </span>
                    <span className="font-mono bg-emerald-500/20 px-2 py-0.5 rounded-md text-[11px]">
                      {attendingList.length}
                    </span>
                  </div>
                  {attendingList.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No confirmed attendees or RSVPs yet.</p>
                  ) : (
                    <ul className="space-y-1 text-[11px] max-h-32 overflow-y-auto pr-1">
                      {attendingList.map((entry) => (
                        <li key={entry.id} className="flex items-center justify-between py-1 border-b border-emerald-500/10">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            Kuya {entry.name.replace(/^Kuya\s+/i, "")}
                          </span>
                          <div className="flex items-center gap-1">
                            {entry.isVerified ? (
                              <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded">
                                Present
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 px-1.5 py-0.2 rounded">
                                RSVP'd
                              </span>
                            )}
                            {paidMembers.includes(entry.id) && (
                              <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded">
                                Paid
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Regrets */}
                <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                  <div className="flex items-center justify-between font-bold text-rose-800 dark:text-rose-300">
                    <span className="flex items-center gap-1.5">
                      <UserX className="h-4 w-4" /> Regrets / Excused
                    </span>
                    <span className="font-mono bg-rose-500/20 px-2 py-0.5 rounded-md text-[11px]">
                      {declinedList.length}
                    </span>
                  </div>
                  {declinedList.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No regrets filed.</p>
                  ) : (
                    <ul className="space-y-1.5 text-[11px] max-h-32 overflow-y-auto pr-1">
                      {declinedList.map((entry) => (
                        <li key={entry.id} className="py-1 border-b border-rose-500/10">
                          <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                            <span>Kuya {entry.name.replace(/^Kuya\s+/i, "")}</span>
                            <span className="text-[9px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.2 rounded">
                              {entry.isSecretariatExcused ? "Excused" : "Regrets"}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                            Reason: {entry.reason || "Unspecified"}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Meeting Contribution Payment Recording (Linked to Financials) */}
              {contributionAmount > 0 && canEdit && (
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-eagle-blue dark:text-blue-400 uppercase flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4" /> Record Meeting Contribution (₱{contributionAmount.toLocaleString()})
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {paidMembers.length} Paid
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Recorded payments automatically post to Financials under Inflows.
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={selectedPayMemberId}
                      onChange={(e) => setSelectedPayMemberId(e.target.value)}
                      className="w-full min-w-0 flex-1 px-3 py-2 rounded-xl bg-white dark:bg-canvas-slate border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white truncate"
                    >
                      <option value="">-- Select Member to Record Payment --</option>
                      {membersList.map((m) => {
                        const isPaid = paidMembers.includes(m.id);
                        return (
                          <option key={m.id} value={m.id} disabled={isPaid}>
                            Kuya {m.first_name} {m.last_name} ({m.member_number}) {isPaid ? "✓ Paid" : ""}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedPayMemberId}
                      onClick={handlePayContribution}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-eagle-blue hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition active:scale-95 shrink-0 text-center flex items-center justify-center"
                    >
                      Record Inflow
                    </button>
                  </div>
                </div>
              )}
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
                <Edit3 className="h-3.5 w-3.5" /> Edit Details
              </Button>
              {onDelete && !isNew && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this scheduled meeting?")) {
                      onDelete(meeting.id);
                      onClose();
                    }
                  }}
                  className="h-8 px-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Meeting
                </button>
              )}
            </div>
          ) : isEditing ? (
            <div className="flex items-center gap-2 ml-auto">
              {!isNew && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
              )}
              <Button
                size="sm"
                variant="primary"
                form="form-meeting"
                type="submit"
                className="text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="h-3.5 w-3.5" /> {isNew ? "Schedule Meeting" : "Save Changes"}
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
