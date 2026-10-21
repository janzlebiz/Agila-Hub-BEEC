"use client";

import React from "react";
import { Calendar, CreditCard, FileText, Home, Users } from "lucide-react";

interface MobileNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileNavBar({ activeTab, onTabChange }: MobileNavBarProps) {
  const tabs = [
    { id: "assemblies", label: "Assemblies", icon: Calendar, isCenter: false },
    { id: "ledger", label: "Finance", icon: CreditCard, isCenter: false },
    { id: "home", label: "Home", icon: Home, isCenter: true },
    { id: "directory", label: "Roster", icon: Users, isCenter: false },
    { id: "documents", label: "Vault", icon: FileText, isCenter: false },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-canvas-dark/95 backdrop-blur-deep px-2 pb-safe-offset transition-colors">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center justify-center -mt-5 relative group"
                aria-label="Home"
              >
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-tr from-eagle-blue via-eagle-blue-dark to-bumblebee-yellow text-white scale-110 shadow-eagle-blue/30 ring-2 ring-amber-400"
                      : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 tracking-tight ${
                    isActive
                      ? "text-eagle-blue dark:text-amber-300 font-extrabold"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all duration-200 relative ${
                isActive
                  ? "text-eagle-blue dark:text-amber-300 font-extrabold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-eagle-blue via-bumblebee-yellow to-emerald-500 rounded-full shadow-sm" />
              )}
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? "bg-slate-100 dark:bg-white/10 scale-105 shadow-sm" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
