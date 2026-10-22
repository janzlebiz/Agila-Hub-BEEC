"use client";

import React, { useState } from "react";
import { X, HeartHandshake, Calendar, Users, Edit3, Trash2, Save, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface CommunityServiceItem {
  id: string;
  title: string;
  description: string;
  status: string;
  target?: string;
  lead_committee?: string;
  schedule_date?: string;
  beneficiaries?: string;
  mission?: string;
  targetBeneficiaries?: string;
  leadCommittee?: string;
  projectDate?: string;
  location?: string;
}

interface CommunityServiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: CommunityServiceItem | null;
  canEdit?: boolean;
  isNew?: boolean;
  onSave?: (service: CommunityServiceItem) => void;
  onDelete?: (id: string) => void;
}

export function CommunityServiceDetailModal({
  isOpen,
  onClose,
  service,
  canEdit = false,
  isNew = false,
  onSave,
  onDelete,
}: CommunityServiceDetailModalProps) {
  const [isEditing, setIsEditing] = useState(isNew);
  const [title, setTitle] = useState(service?.title || "");
  const [description, setDescription] = useState(service?.description || "");
  const [status, setStatus] = useState(service?.status || "Active Community Mission");
  const [target, setTarget] = useState(service?.target || "1,000 Hardwood Saplings");
  const [leadCommittee, setLeadCommittee] = useState(service?.lead_committee || "Humanitarian & Ecology");
  const [scheduleDate, setScheduleDate] = useState(service?.schedule_date || "November 2026");
  const [beneficiaries, setBeneficiaries] = useState(service?.beneficiaries || "Local Community Residents");

  React.useEffect(() => {
    if (service) {
      setTitle(service.title);
      setDescription(service.description);
      setStatus(service.status || service.mission || "Active Community Mission");
      setTarget(service.target || service.targetBeneficiaries || "");
      setLeadCommittee(service.lead_committee || service.leadCommittee || "Humanitarian & Ecology");
      setScheduleDate(service.schedule_date || service.projectDate || "November 2026");
      setBeneficiaries(service.beneficiaries || service.targetBeneficiaries || "Community Residents");
      setIsEditing(isNew);
    }
  }, [service, isNew]);

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
        target: target.trim(),
        lead_committee: leadCommittee.trim(),
        schedule_date: scheduleDate.trim(),
        beneficiaries: beneficiaries.trim(),
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
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center font-bold">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                {isNew ? "Propose Service Mission" : isEditing ? "Edit Community Service" : "Community Service Details"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Civic Humanitarian Project • Bantayog Elite Eagles Club
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
            <form id="form-service" onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Free Medical & Dental Mission"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Project Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  >
                    <option value="Active Community Mission">Active Community Mission</option>
                    <option value="Scheduled Outreach">Scheduled Outreach</option>
                    <option value="Mobilizing Volunteers">Mobilizing Volunteers</option>
                    <option value="Completed Project">Completed Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Output / Goal
                  </label>
                  <input
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="e.g. 500+ Patients Treated"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lead Committee / Chairperson
                  </label>
                  <input
                    type="text"
                    value={leadCommittee}
                    onChange={(e) => setLeadCommittee(e.target.value)}
                    placeholder="e.g. Community Service Chairman"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Schedule / Month
                  </label>
                  <input
                    type="text"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    placeholder="e.g. November 2026"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Scope & Humanitarian Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the beneficiaries, project logistics, partnered organizations, and goals..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-eagle-blue"
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
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {scheduleDate}
                </span>
              </div>

              <h4 className="font-display font-black text-lg text-slate-900 dark:text-white">
                {title}
              </h4>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {description}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Target Goal</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {target || "Community Impact"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Lead Committee</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                    {leadCommittee || "Club Officers"}
                  </span>
                </div>
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
                <Edit3 className="h-3.5 w-3.5" /> Edit Project
              </Button>
              {onDelete && !isNew && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to remove this community outreach project?")) {
                      onDelete(service.id);
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
                className="text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="h-3.5 w-3.5" /> {isNew ? "Post Project" : "Save Changes"}
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
