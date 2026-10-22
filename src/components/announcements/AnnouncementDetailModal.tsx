"use client";

import React, { useState } from "react";
import { X, Calendar, Edit3, Trash2, Check, Bell, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  target_role?: string;
  is_pinned?: boolean;
  published_at?: string | null;
}

interface AnnouncementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: AnnouncementItem | null;
  canEdit?: boolean;
  isNew?: boolean;
  onSave?: (announcement: AnnouncementItem) => void;
  onDelete?: (id: string) => void;
}

export function AnnouncementDetailModal({
  isOpen,
  onClose,
  announcement,
  canEdit = false,
  isNew = false,
  onSave,
  onDelete,
}: AnnouncementDetailModalProps) {
  const [isEditing, setIsEditing] = useState(isNew);
  const [title, setTitle] = useState(announcement?.title || "");
  const [content, setContent] = useState(announcement?.content || "");
  const [category, setCategory] = useState(announcement?.category || "General");
  const [priority, setPriority] = useState(announcement?.priority || "normal");

  React.useEffect(() => {
    if (announcement) {
      setTitle(announcement.title.replace("[SEED] ", ""));
      setContent(announcement.content);
      setCategory(announcement.category);
      setPriority(announcement.priority);
      setIsEditing(isNew);
    }
  }, [announcement, isNew]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !announcement) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (onSave) {
      onSave({
        ...announcement,
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
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
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-slate-900 dark:text-white">
                {isNew ? "Post Announcement" : isEditing ? "Edit Announcement" : "Announcement Details"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official Fraternal Notice & Club Circular
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
            <form id="form-announcement" onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 General Assembly Meeting Notice"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  >
                    <option value="General">General Notice</option>
                    <option value="Finance">Finance & Dues</option>
                    <option value="Assemblies">Assemblies & Meetings</option>
                    <option value="Community">Community Service</option>
                    <option value="Benevolence">Alalayang Agila</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Circular</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Circular Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  placeholder="Provide comprehensive instructions, agenda items, remittance guidelines, or fraternal details..."
                  required
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-normal leading-relaxed focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    announcement.priority === "urgent" || announcement.priority === "high"
                      ? "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                      : announcement.category === "Finance"
                      ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                      : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                  }`}
                >
                  {announcement.priority === "urgent"
                    ? "Urgent Circular"
                    : announcement.priority === "high"
                    ? "High Priority"
                    : "Official Notice"}{" "}
                  • {announcement.category}
                </span>

                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {announcement.published_at
                    ? new Date(announcement.published_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Active Notice"}
                </span>
              </div>

              <h4 className="font-display font-black text-lg text-slate-900 dark:text-white leading-snug">
                {title}
              </h4>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {content}
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
                    if (confirm("Are you sure you want to delete this announcement?")) {
                      onDelete(announcement.id);
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
                form="form-announcement"
                type="submit"
                className="text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="h-3.5 w-3.5" /> {isNew ? "Publish Notice" : "Save Changes"}
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
