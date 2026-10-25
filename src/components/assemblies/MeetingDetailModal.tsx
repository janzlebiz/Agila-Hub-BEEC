"use client";

import React, { useState } from "react";
import { X, Calendar, MapPin, Clock, Edit3, Trash2, Check, QrCode, Save, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export interface MeetingItem {
  id: string;
  title: string;
  description?: string | null;
  event_date: string;
  location?: string | null;
  checkin_code?: string | null;
  checkin_open?: boolean | null;
  status?: string | null;
}

interface MeetingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingItem | null;
  canEdit?: boolean;
  isNew?: boolean;
  onSave?: (meeting: MeetingItem) => void;
  onDelete?: (id: string) => void;
}

export function MeetingDetailModal({
  isOpen,
  onClose,
  meeting,
  canEdit = false,
  isNew = false,
  onSave,
  onDelete,
}: MeetingDetailModalProps) {
  const [isEditing, setIsEditing] = useState(isNew);
  const [title, setTitle] = useState(meeting?.title || "");
  const [description, setDescription] = useState(meeting?.description || "");
  const [eventDate, setEventDate] = useState(meeting?.event_date ? meeting.event_date.split("T")[0] : "");
  const [location, setLocation] = useState(meeting?.location || "Agila Clubhouse & Conference Hall");
  const [checkinCode, setCheckinCode] = useState(meeting?.checkin_code || "");
  const [checkinOpen, setCheckinOpen] = useState(meeting?.checkin_open ?? true);

  React.useEffect(() => {
    if (meeting) {
      setTitle(meeting.title.replace("[SEED] ", ""));
      setDescription(meeting.description || "");
      setEventDate(meeting.event_date ? meeting.event_date.split("T")[0] : "");
      setLocation(meeting.location || "Agila Clubhouse & Conference Hall");
      setCheckinCode(meeting.checkin_code || "");
      setCheckinOpen(meeting.checkin_open ?? true);
      setIsEditing(isNew);
    }
  }, [meeting, isNew]);

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
        location: location.trim(),
        checkin_code: checkinCode.trim().toUpperCase(),
        checkin_open: checkinOpen,
      });
    }
    setIsEditing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        id="meeting-detail-modal"
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/10 p-6 shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-eagle-blue dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                {isNew ? "Schedule Assembly" : isEditing ? "Edit Assembly Meeting" : "Assembly Meeting Details"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                General Membership Meeting & Fraternal Assembly
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
            <form id="form-meeting" onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assembly Title
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Event Date
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Check-In Passcode
                  </label>
                  <input
                    type="text"
                    value={checkinCode}
                    onChange={(e) => setCheckinCode(e.target.value)}
                    placeholder="e.g. AGILA-GMM-2026"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Venue / Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Agila Clubhouse & Conference Hall, QC"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Agenda & Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Official agenda, meeting decorum, roll call, and committee updates..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="checkin-open-toggle"
                  checked={checkinOpen}
                  onChange={(e) => setCheckinOpen(e.target.checked)}
                  className="h-4 w-4 rounded text-eagle-blue"
                />
                <label htmlFor="checkin-open-toggle" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Allow Quorum Attendance Check-In (Check-In Active)
                </label>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    meeting.checkin_open
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300"
                  }`}
                >
                  {meeting.checkin_open ? "Quorum Check-in Active" : "Scheduled Assembly"}
                </span>

                {canEdit && meeting.checkin_code && (
                  <span className="text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-lg border border-amber-300 dark:border-amber-400/30 text-amber-800 dark:text-amber-300">
                    Passkey: {meeting.checkin_code}
                  </span>
                )}
              </div>

              <h4 className="font-display font-black text-lg text-slate-900 dark:text-white">
                {title}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 text-eagle-blue shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Date</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {eventDate ? formatDate(eventDate, { month: "long" }) : "TBA"}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Location</span>
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {location || "Club Clubhouse"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Agenda & Instructions
                </span>
                {description || "Regular club meeting agenda and matters of importance to the fraternity."}
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
                <Edit3 className="h-3.5 w-3.5" /> Edit Details
              </Button>
              {onDelete && !isNew && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to remove this assembly meeting?")) {
                      onDelete(meeting.id);
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
