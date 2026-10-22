"use client";

import React from "react";
import Image from "next/image";
import { Calendar, CreditCard, FileText, Users } from "lucide-react";

interface MobileNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileNavBar({ activeTab, onTabChange }: MobileNavBarProps) {
  const tabs = [
    {
      id: "assemblies",
      label: "Assemblies",
      icon: Calendar,
      isCenter: false,
      activeColor: "text-eagle-blue dark:text-blue-400",
      activeBg: "bg-blue-500/15 dark:bg-blue-500/25",
      badgeColor: "text-eagle-blue bg-blue-500/10",
    },
    {
      id: "ledger",
      label: "Finance",
      icon: CreditCard,
      isCenter: false,
      activeColor: "text-emerald-600 dark:text-emerald-400",
      activeBg: "bg-emerald-500/15 dark:bg-emerald-500/25",
      badgeColor: "text-emerald-600 bg-emerald-500/10",
    },
    {
      id: "home",
      label: "Home",
      icon: null,
      isCenter: true,
      activeColor: "",
      activeBg: "",
      badgeColor: "",
    },
    {
      id: "directory",
      label: "Roster",
      icon: Users,
      isCenter: false,
      activeColor: "text-amber-600 dark:text-amber-400",
      activeBg: "bg-amber-500/15 dark:bg-amber-500/25",
      badgeColor: "text-amber-600 bg-amber-500/10",
    },
    {
      id: "documents",
      label: "Vault",
      icon: FileText,
      isCenter: false,
      activeColor: "text-purple-600 dark:text-purple-400",
      activeBg: "bg-purple-500/15 dark:bg-purple-500/25",
      badgeColor: "text-purple-600 bg-purple-500/10",
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-canvas-dark/95 backdrop-blur-deep px-2 pb-safe-offset transition-colors">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          // Center Action Button: AGILA Hub Eagle Vector Emblem, NO text label below
          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                type="button"
                data-tab="home"
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center -mt-5 relative group focus:outline-none"
                aria-label="Home Dashboard"
              >
                <div
                  className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 p-1.5 bg-black border-2 transition ${
                    isActive
                      ? "border-amber-400 scale-110 shadow-amber-500/40 ring-2 ring-amber-400"
                      : "border-slate-300 dark:border-white/20 shadow-md hover:scale-105"
                  }`}
                >
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center">
                    <Image
                      src="/assets/eagle_vector.jpg"
                      alt="Home Eagle Emblem"
                      width={40}
                      height={40}
                      className="object-contain"
                      priority
                      unoptimized
                    />
                  </div>
                </div>
              </button>
            );
          }

          const Icon = tab.icon!;

          return (
            <button
              key={tab.id}
              type="button"
              data-tab={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all duration-200 relative focus:outline-none ${
                isActive
                  ? `${tab.activeColor} font-extrabold`
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-eagle-blue via-amber-400 to-emerald-500 rounded-full shadow-sm" />
              )}
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? `${tab.activeBg} scale-110 shadow-sm`
                    : "hover:bg-slate-100 dark:hover:bg-white/5"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? tab.activeColor : ""}`} />
              </div>
              <span className="text-[10px] font-bold tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
