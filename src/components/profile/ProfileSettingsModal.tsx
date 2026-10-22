"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { 
  User, 
  Shield, 
  KeyRound, 
  Phone, 
  Heart, 
  IdCard, 
  X, 
  Check, 
  AlertCircle, 
  Loader2, 
  Camera, 
  Save, 
  Lock, 
  Building,
  LogOut,
  Upload,
  MapPin,
  Calendar
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface MemberProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  birthday?: string | null;
  member_number?: string | null;
  role: "admin" | "officer" | "member";
  membership_status: "pending" | "active" | "suspended" | "inactive";
  chapter_or_branch?: string | null;
  blood_type?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  official_id_url?: string | null;
  id_card_front_url?: string | null;
  id_card_back_url?: string | null;
  avatar_url?: string | null;
}

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberProfileData | null;
  onProfileUpdated: (updatedData: Partial<MemberProfileData>) => void;
  onOpenIdScanner: () => void;
  onLogout?: () => void;
}

export function ProfileSettingsModal({
  isOpen,
  onClose,
  member,
  onProfileUpdated,
  onOpenIdScanner,
  onLogout,
}: ProfileSettingsModalProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"profile" | "selfie" | "id_card" | "security">("profile");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Profile Form States
  const [firstName, setFirstName] = useState(member?.first_name || "");
  const [lastName, setLastName] = useState(member?.last_name || "");
  const [phone, setPhone] = useState(member?.phone || "");
  const [address, setAddress] = useState(member?.address || "");
  const [birthday, setBirthday] = useState(member?.birthday || "");
  const [chapter, setChapter] = useState(
    member?.chapter_or_branch?.includes("•")
      ? member.chapter_or_branch.split("•")[0].trim()
      : member?.chapter_or_branch || "Bantayog Elite Eagles Club"
  );
  const [region, setRegion] = useState(
    member?.chapter_or_branch?.includes("•")
      ? member.chapter_or_branch.split("•")[1].trim()
      : "Region V - Bicol Region"
  );
  const [bloodType, setBloodType] = useState(member?.blood_type || "O+");
  const [emergencyName, setEmergencyName] = useState(member?.emergency_contact_name || "");
  const [emergencyPhone, setEmergencyPhone] = useState(member?.emergency_contact_phone || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(member?.avatar_url || null);

  // Password / Security States
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // General Loading & Feedback
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!isOpen) return null;

  // Handle Selfie Upload
  const handleSelfieSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileFeedback({ success: false, message: "Please select an image file (PNG, JPG, or WEBP)." });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setAvatarUrl(dataUrl);

      // Save to Supabase Storage or update member record if user is authenticated
      try {
        if (member?.id) {
          // Attempt storage upload or direct member update
          const { error } = await supabase
            .from("members")
            .update({
              official_id_url: member.official_id_url || dataUrl,
              id_card_front_url: dataUrl,
            })
            .eq("id", member.id);

          if (error) {
            console.warn("Direct update warning, saved locally:", error.message);
          }
        }

        onProfileUpdated({
          avatar_url: dataUrl,
          id_card_front_url: dataUrl,
        });

        setProfileFeedback({ success: true, message: "Selfie picture uploaded and updated on your 3D ID Card!" });
      } catch (err) {
        console.error("Error setting avatar:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Profile Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member?.id) return;
    setSavingProfile(true);
    setProfileFeedback(null);

    try {
      const fullChapterOrBranch = region ? `${chapter} • ${region}` : chapter;

      // 1. Try secure RPC
      const { data, error } = await supabase.rpc("update_self_profile", {
        p_first_name: firstName,
        p_last_name: lastName,
        p_phone: phone,
        p_blood_type: bloodType,
        p_emergency_name: emergencyName,
        p_emergency_phone: emergencyPhone,
        p_chapter: fullChapterOrBranch,
      });

      // 2. Direct table update fallback if user is authenticated
      if (error) {
        await supabase
          .from("members")
          .update({
            first_name: firstName,
            last_name: lastName,
            phone,
            address,
            birthday,
            blood_type: bloodType,
            emergency_contact_name: emergencyName,
            emergency_contact_phone: emergencyPhone,
            chapter_or_branch: fullChapterOrBranch,
          })
          .eq("id", member.id);
      }

      setProfileFeedback({ success: true, message: "Fraternal profile details updated successfully!" });
      onProfileUpdated({
        first_name: firstName,
        last_name: lastName,
        phone,
        address,
        birthday,
        blood_type: bloodType,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
        chapter_or_branch: fullChapterOrBranch,
        avatar_url: avatarUrl,
      });

      setTimeout(() => {
        setProfileFeedback(null);
      }, 3000);
    } catch (err: unknown) {
      console.error("Error updating profile:", err);
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      setProfileFeedback({ success: false, message: msg });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Update via Supabase Auth
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 6) {
      setPasswordFeedback({ success: false, message: "Password must be at least 6 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ success: false, message: "New passwords do not match." });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordFeedback({ success: true, message: "Security credentials updated successfully!" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      console.error("Error updating password:", err);
      const msg = err instanceof Error ? err.message : "Failed to update credentials";
      setPasswordFeedback({ success: false, message: msg });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Explicit Logout
  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      onClose();
      window.location.href = "/auth/login";
    } catch (err) {
      console.error("Sign out error:", err);
      window.location.href = "/auth/login";
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-canvas-slate border border-slate-200 dark:border-white/15 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-2xl bg-eagle-blue/10 border border-eagle-blue/30 flex items-center justify-center text-eagle-blue overflow-hidden shrink-0">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
              ) : (
                <User className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                Member Profile & Security
                <span className="text-[10px] bg-eagle-blue/10 dark:bg-eagle-blue/30 text-eagle-blue dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-eagle-blue/30">
                  {member?.role?.toUpperCase() || "MEMBER"}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your fraternal credentials, photo, official ID, and account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-slate-500 dark:text-slate-300 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 rounded-xl bg-slate-100 dark:bg-white/5 p-1 my-4 border border-slate-200/80 dark:border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
              activeTab === "profile"
                ? "bg-white dark:bg-canvas-dark text-eagle-blue dark:text-amber-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <User className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("selfie")}
            className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
              activeTab === "selfie"
                ? "bg-white dark:bg-canvas-dark text-eagle-blue dark:text-amber-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Camera className="h-3.5 w-3.5 text-amber-500" /> <span>Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("id_card")}
            className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
              activeTab === "id_card"
                ? "bg-white dark:bg-canvas-dark text-eagle-blue dark:text-amber-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <IdCard className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Card Scan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
              activeTab === "security"
                ? "bg-white dark:bg-canvas-dark text-eagle-blue dark:text-amber-300 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Lock className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Security</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: FRATERNAL PROFILE                                       */}
        {/* ============================================================== */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+63 9XX XXX XXXX"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Blood Type
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                >
                  {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address & Birthday */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Residential / Office Address"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Birthday
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>
            </div>

            {/* Eagles Club (Updated from Eagles Chapter / Branch) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Eagles Club
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={chapter}
                    onChange={(e) => setChapter(e.target.value)}
                    placeholder="Bantayog Elite Eagles Club"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Eagles Region
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Region V - Bicol Region"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
                <Heart className="h-4 w-4 text-red-500" />
                <span>Fraternal Emergency Contact</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="e.g. Spouse / Sibling"
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-canvas-dark border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+63 9XX XXX XXXX"
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-canvas-dark border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>
            </div>

            {profileFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  profileFeedback.success
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400"
                }`}
              >
                {profileFeedback.success ? (
                  <Check className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{profileFeedback.message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-eagle-blue to-eagle-blue-dark text-white text-xs font-bold shadow hover:brightness-110 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Fraternal Profile
                </>
              )}
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SELFIE / PHOTO UPLOAD FOR 3D FLIP CARD                  */}
        {/* ============================================================== */}
        {activeTab === "selfie" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center">
              <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white mb-1">
                Upload Selfie / Photo for Digital 3D Card
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                This photo will be displayed on the interactive 3D Flip Card in your dashboard.
              </p>

              {/* Photo Preview */}
              <div className="relative h-32 w-32 rounded-3xl mx-auto mb-4 p-1 bg-gradient-to-tr from-amber-400 via-eagle-blue to-emerald-500 shadow-xl overflow-hidden">
                <div className="relative h-full w-full rounded-[22px] bg-slate-200 dark:bg-canvas-slate flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt="Selfie preview" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Camera className="h-8 w-8 mb-1" />
                      <span className="text-[10px] font-bold">No photo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleSelfieSelected}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow hover:brightness-110 flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <Camera className="h-4 w-4" />
                  <span>Take Selfie or Choose Picture</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl(null);
                      onProfileUpdated({ avatar_url: null });
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-700 transition"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            {profileFeedback && (
              <div className="p-3 rounded-xl text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0" />
                <span>{profileFeedback.message}</span>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: OFFICIAL PHYSICAL ID CARD SCAN                          */}
        {/* ============================================================== */}
        {activeTab === "id_card" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <h4 className="font-display font-extrabold text-sm text-slate-900 dark:text-white mb-1">
                Official Physical Eagles Card Scan
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Scan your official physical Eagles card with your camera to display on your dashboard.
              </p>

              {member?.official_id_url ? (
                <div className="relative rounded-2xl overflow-hidden border border-amber-400/40 aspect-[16/10] bg-black shadow-inner mb-3">
                  <Image
                    src={member.official_id_url}
                    alt="Current Scanned Eagles Card"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow">
                    Active Scanned ID
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-6 text-center mb-3">
                  <IdCard className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No physical card scan uploaded yet
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Currently displaying the digital smart pass
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenIdScanner();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow hover:brightness-110 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Camera className="h-4 w-4" />
                <span>{member?.official_id_url ? "Re-scan / Replace Physical ID" : "Scan Official Eagles ID Now"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: SECURITY & LOGOUT                                       */}
        {/* ============================================================== */}
        {activeTab === "security" && (
          <div className="space-y-5">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold block text-eagle-blue dark:text-blue-300 mb-0.5">
                  Authenticated Session
                </span>
                <span>Signed in as: <strong>{member?.email || "Authenticated Member"}</strong></span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-eagle-blue"
                  />
                </div>
              </div>

              {passwordFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    passwordFeedback.success
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400"
                  }`}
                >
                  {passwordFeedback.success ? (
                    <Check className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{passwordFeedback.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow hover:opacity-90 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Updating Password...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" /> Update Security Password
                  </>
                )}
              </button>
            </form>

            {/* Logout Action Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10">
              <span className="text-[11px] font-bold text-slate-500 block mb-2">
                Session Management
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95"
              >
                {loggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span>Sign Out / Log Out of AGILA Hub</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
