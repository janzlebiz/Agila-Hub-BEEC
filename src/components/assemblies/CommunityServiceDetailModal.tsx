"use client";

import React, { useState } from "react";
import { 
  X, 
  HeartHandshake, 
  Calendar, 
  Users, 
  Edit3, 
  Trash2, 
  Save, 
  Clock, 
  MapPin, 
  DollarSign, 
  Globe, 
  CreditCard,
  UserCheck,
  UserPlus,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface CommunityServiceItem {
  id: string;
  title: string;
  description: string;
  status: string;
  proponent?: string;
  project_scope?: "Region" | "Club" | "Combined with other Club" | string;
  projectScope?: "Region" | "Club" | "Combined with other Club" | string;
  schedule_from?: string;
  schedule_to?: string;
  schedule_time?: string;
  schedule_date?: string;
  scheduleFrom?: string;
  scheduleTo?: string;
  assemblyTime?: string;
  projectDate?: string;
  contribution_amount?: number;
  contributionAmount?: number;
  location?: string;
  lead_committee?: string;
  leadCommittee?: string;
  beneficiaries?: string;
  targetBeneficiaries?: string;
  mission?: string;
  paid_members?: string[];
  volunteersList?: any[];
  contributionsList?: any[];
}

interface CommunityServiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: CommunityServiceItem | null;
  canEdit?: boolean;
  isNew?: boolean;
  onSave?: (service: CommunityServiceItem) => void;
  onDelete?: (id: string) => void;
  onRecordContributionPayment?: (activityId: string, memberId: string, memberName: string, amount: number) => void;
  membersList?: Array<{ id: string; first_name: string; last_name: string; member_number?: string | null }>;
  isVolunteered?: boolean;
  onToggleVolunteer?: (serviceId: string) => void;
  currentMember?: { id: string; name?: string; first_name?: string; last_name?: string } | null;
}

export function CommunityServiceDetailModal({
  isOpen,
  onClose,
  service,
  canEdit = false,
  isNew = false,
  onSave,
  onDelete,
  onRecordContributionPayment,
  membersList = [],
  isVolunteered = false,
  onToggleVolunteer,
  currentMember,
}: CommunityServiceDetailModalProps) {
  const [isEditing, setIsEditing] = useState(isNew);
  const [title, setTitle] = useState(service?.title || "");
  const [description, setDescription] = useState(service?.description || "");
  const [status, setStatus] = useState(service?.status || "Active Community Mission");
  const [proponent, setProponent] = useState(service?.proponent || "Secretariat & Directorate");
  const [projectScope, setProjectScope] = useState<string>(
    service?.project_scope || service?.projectScope || "Club"
  );
  const [scheduleFrom, setScheduleFrom] = useState(service?.schedule_from || new Date().toISOString().split("T")[0]);
  const [scheduleTo, setScheduleTo] = useState(service?.schedule_to || new Date().toISOString().split("T")[0]);
  const [scheduleTime, setScheduleTime] = useState(service?.schedule_time || "08:00 AM");
  const [contributionAmount, setContributionAmount] = useState<number>(service?.contribution_amount ?? 0);
  const [location, setLocation] = useState(service?.location || "Camarines Norte Sector");
  const [leadCommittee, setLeadCommittee] = useState(service?.lead_committee || "Community Service & Outreach");
  const [beneficiaries, setBeneficiaries] = useState(service?.beneficiaries || "Community Residents");

  const [selectedPayMemberId, setSelectedPayMemberId] = useState("");

  React.useEffect(() => {
    if (!isOpen) return;

    if (isNew) {
      // Pristine reset on new activity creation - never carry over prior activity inputs
      setTitle("");
      setDescription("");
      setStatus("Active Community Mission");
      setProponent("");
      setProjectScope("Club");
      setScheduleFrom(new Date().toISOString().split("T")[0]);
      setScheduleTo(new Date().toISOString().split("T")[0]);
      setScheduleTime("08:00 AM");
      setContributionAmount(0);
      setLocation("");
      setLeadCommittee("Community Service & Outreach");
      setBeneficiaries("");
      setIsEditing(true);
      setSelectedPayMemberId("");
    } else if (service) {
      setTitle(service.title.replace("[ACTIVITY] ", ""));
      setDescription(service.description);
      setStatus(service.status || "Active Community Mission");
      setProponent(service.proponent || "Secretariat & Directorate");
      setProjectScope(service.project_scope || service.projectScope || "Club");
      setScheduleFrom(service.schedule_from || new Date().toISOString().split("T")[0]);
      setScheduleTo(service.schedule_to || new Date().toISOString().split("T")[0]);
      setScheduleTime(service.schedule_time || "08:00 AM");
      setContributionAmount(service.contribution_amount ?? 0);
      setLocation(service.location || "Camarines Norte Sector");
      setLeadCommittee(service.lead_committee || "Community Service & Outreach");
      setBeneficiaries(service.beneficiaries || "Community Residents");
      setIsEditing(isNew);
      setSelectedPayMemberId("");
    }
  }, [service, isNew, isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !service) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (onSave) {
      onSave({
        ...service,
        title: title.trim(),
        description: description.trim(),
        status,
        proponent: proponent.trim(),
        project_scope: projectScope,
        schedule_from: scheduleFrom,
        schedule_to: scheduleTo,
        schedule_time: scheduleTime.trim(),
        schedule_date: `${scheduleFrom} to ${scheduleTo} (${scheduleTime})`,
        contribution_amount: Number(contributionAmount) || 0,
        location: location.trim(),
        lead_committee: leadCommittee.trim(),
        beneficiaries: beneficiaries.trim(),
      });
    }
    setIsEditing(false);
    onClose();
  };

  const handlePayActivity = () => {
    if (!selectedPayMemberId || !onRecordContributionPayment) return;
    const mem = membersList.find((m) => m.id === selectedPayMemberId);
    if (!mem) return;
    const memberName = `${mem.first_name} ${mem.last_name}`;
    onRecordContributionPayment(service.id, mem.id, memberName, contributionAmount || 0);
    setSelectedPayMemberId("");
  };

  const paidMembers = service.paid_members || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                {isNew ? "Add Community Activity" : isEditing ? "Edit Activity Project" : "Community Outreach Details"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Bantayog Elite Eagles Club • Humanitarian Service Mission
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

        {/* Content View or Edit Form */}
        <div className="py-4 overflow-y-auto space-y-4 text-xs pr-1">
          {isEditing ? (
            <form id="form-service" onSubmit={handleSave} className="space-y-3.5">
              {/* Project Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Activity / Project Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Camarines Norte Medical & Dental Outreach"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Proponent & Project Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Proponent / Lead Organizer *
                  </label>
                  <input
                    type="text"
                    value={proponent}
                    onChange={(e) => setProponent(e.target.value)}
                    placeholder="e.g. Kuya Chester Jan Camacho / Secretariat"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Project Scope *
                  </label>
                  <select
                    value={projectScope}
                    onChange={(e) => setProjectScope(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="Club">Club Level (BEEC)</option>
                    <option value="Region">Region Level (Bantayog Region 1)</option>
                    <option value="Combined with other Club">Combined with other Club</option>
                  </select>
                </div>
              </div>

              {/* Schedule: From, To & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Schedule From *
                  </label>
                  <input
                    type="date"
                    value={scheduleFrom}
                    onChange={(e) => setScheduleFrom(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Schedule To *
                  </label>
                  <input
                    type="date"
                    value={scheduleTo}
                    onChange={(e) => setScheduleTo(e.target.value)}
                    required
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assembly Time *
                  </label>
                  <input
                    type="text"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    placeholder="e.g. 08:00 AM"
                    required
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Contribution / Assessment & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contribution / Assessment (PHP)
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
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Location / Venue *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Barangay Hall, Basud"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Activity Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Active Community Mission">Active Community Mission</option>
                  <option value="Scheduled Outreach">Scheduled Outreach</option>
                  <option value="Mobilizing Volunteers">Mobilizing Volunteers</option>
                  <option value="Completed Project">Completed Project</option>
                </select>
              </div>

              {/* Scope & Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Humanitarian Details & Logistics
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Outline community beneficiaries, mission objectives, assigned Kuyas, and supplies needed..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {status}
                </span>

                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-blue-500" />
                  Scope: <strong className="text-slate-800 dark:text-slate-200">{projectScope}</strong>
                </span>
              </div>

              <h4 className="font-display font-black text-lg text-slate-900 dark:text-white">
                {title}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Schedule</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {scheduleFrom} to {scheduleTo}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Time: {scheduleTime}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Proponent</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                    {proponent}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Venue: {location}
                  </span>
                </div>
              </div>

              {contributionAmount > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                      Activity Contribution Assessment
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ₱{contributionAmount.toLocaleString()} per Kuya (Linked to Financials)
                    </span>
                  </div>
                  <span className="font-mono text-xs font-black text-emerald-600 bg-white dark:bg-black/30 px-2 py-1 rounded-md">
                    {paidMembers.length} Paid
                  </span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                  Activity Details & Plan:
                </span>
                {description || "Community service and humanitarian outreach mission for the welfare of the public."}
              </div>

              {/* Enrolled Mission Volunteers Roster (Transparent to all members) */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                    <Users className="h-4 w-4" />
                    <span>Enrolled Mission Volunteers ({(service.volunteersList || []).length})</span>
                  </div>
                  {onToggleVolunteer && currentMember && (
                    <button
                      type="button"
                      onClick={() => onToggleVolunteer(service.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                        isVolunteered
                          ? "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {isVolunteered ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>✓ Enrolled as Volunteer</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Enroll as Volunteer</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {(service.volunteersList || []).length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">
                    No volunteer registrations yet. Be the first Kuya to volunteer for this outreach mission!
                  </p>
                ) : (
                  <ul className="space-y-1.5 text-[11px] max-h-36 overflow-y-auto pr-1">
                    {(service.volunteersList || []).map((vol: any, idx: number) => {
                      const volName = vol.memberName || vol.name || (vol.first_name ? `${vol.first_name} ${vol.last_name}` : `Kuya Volunteer #${idx + 1}`);
                      const isCurrentUser = currentMember && (vol.memberId === currentMember.id || vol.id === currentMember.id);
                      return (
                        <li
                          key={vol.memberId || vol.id || idx}
                          className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/10 text-slate-800 dark:text-slate-200"
                        >
                          <span className="font-semibold flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            Kuya {volName.replace(/^Kuya\s+/i, "")}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-white dark:bg-black/40 px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Contribution payment recording for officers */}
              {contributionAmount > 0 && canEdit && (
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
                  <span className="font-black text-xs text-eagle-blue dark:text-blue-400 uppercase flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" /> Record Activity Fund Contribution
                  </span>
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
                      onClick={handlePayActivity}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition active:scale-95 shrink-0 text-center flex items-center justify-center"
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
                <Edit3 className="h-3.5 w-3.5" /> Edit Project
              </Button>
              {onDelete && !isNew && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this community activity?")) {
                      onDelete(service.id);
                      onClose();
                    }
                  }}
                  className="h-8 px-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Activity
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
                form="form-service"
                type="submit"
                className="text-xs font-bold flex items-center gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="h-3.5 w-3.5" /> {isNew ? "Add Activity" : "Save Changes"}
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
