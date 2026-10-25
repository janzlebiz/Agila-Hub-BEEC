"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DirectoryMember } from "@/components/directory/MemberDirectoryModal";

interface EventItem {
  id: string;
  title: string;
  event_date: string;
  location?: string | null;
  status?: string | null;
}

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
  members: DirectoryMember[];
  recordingOfficerName: string;
  recordingOfficerRole: string;
  onRecordAttendance: (
    eventId: string,
    memberId: string,
    memberNumber: string,
    status: string
  ) => Promise<void>;
}

export function ManualAttendanceModal({
  isOpen,
  onClose,
  events,
  members,
  recordingOfficerName,
  recordingOfficerRole,
  onRecordAttendance,
}: ManualAttendanceModalProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    events[0]?.id || ""
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [memberSearch, setMemberSearch] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState<"present" | "late" | "excused">("present");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (events.length > 0 && !selectedEventId) {
        setSelectedEventId(events[0].id);
      }
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, events, selectedEventId]);

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const memNum = (m.member_number || "").toLowerCase();
    return fullName.includes(q) || memNum.includes(q);
  });

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedEventId) {
      setErrorMsg("Please select an assembly or meeting.");
      return;
    }
    if (!selectedMemberId || !selectedMember) {
      setErrorMsg("Please select a club member to check in.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onRecordAttendance(
        selectedEventId,
        selectedMemberId,
        selectedMember.member_number || `BEEC-${selectedMemberId.substring(0, 6)}`,
        attendanceStatus
      );
      setSuccessMsg(
        `Attendance recorded: ${selectedMember.first_name} ${selectedMember.last_name} marked as ${attendanceStatus}.`
      );
      // Reset selection for next entry
      setSelectedMemberId("");
      setMemberSearch("");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to persist attendance record to backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-attendance-modal-title"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 p-6 shadow-2xl space-y-5 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-eagle-blue/10 text-eagle-blue dark:text-blue-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="manual-attendance-modal-title"
                className="font-display font-black text-base text-slate-900 dark:text-white"
              >
                Manual Attendance Check
              </h3>
              <p className="text-xs text-slate-500">
                Official Quorum Record • President & Secretary Verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Verification Authority Banner */}
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300/40 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">Verifying Officer: </span>
            <span>{recordingOfficerName} ({recordingOfficerRole})</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Meeting */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-eagle-blue" />
              <span>Select Assembly / Meeting:</span>
            </label>
            <select
              id="attendance-meeting-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title.replace("[SEED] ", "")} ({evt.event_date})
                </option>
              ))}
            </select>
          </div>

          {/* Member Search & Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-amber-500" />
              <span>Select Club Member:</span>
            </label>
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search member by name or ID..."
              className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white mb-1.5 focus:outline-none focus:ring-1 focus:ring-eagle-blue"
            />
            <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-white/10 rounded-xl divide-y divide-slate-100 dark:divide-white/5">
              {filteredMembers.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  No members found matching &quot;{memberSearch}&quot;
                </div>
              ) : (
                filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMemberId(m.id);
                      setMemberSearch(`${m.first_name} ${m.last_name}`);
                    }}
                    className={`w-full p-2.5 text-left text-xs flex items-center justify-between transition ${
                      selectedMemberId === m.id
                        ? "bg-eagle-blue/10 text-eagle-blue dark:text-blue-300 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div>
                      <span>{m.first_name} {m.last_name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {m.member_number || "BEEC Member"} • {m.role}
                      </span>
                    </div>
                    {selectedMemberId === m.id && (
                      <CheckCircle2 className="h-4 w-4 text-eagle-blue shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Attendance Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Attendance Status:</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["present", "late", "excused"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setAttendanceStatus(st)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition ${
                    attendanceStatus === st
                      ? "bg-eagle-blue text-white border-eagle-blue shadow-sm"
                      : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || !selectedMemberId || !selectedEventId}
              className="flex items-center gap-1.5 font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Record Attendance</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
