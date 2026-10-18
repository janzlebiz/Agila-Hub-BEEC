"use client";

import React from "react";
import { Calendar, CreditCard, FileText, HeartHandshake } from "lucide-react";

interface MobileNavBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileNavBar({ activeTab, onTabChange }: MobileNavBarProps) {
  const tabs = [
    { id: "assemblies", label: "Assemblies", icon: Calendar },
    { id: "ledger", label: "Ledger", icon: CreditCard },
    { id: "documents", label: "Vault", icon: FileText },
    { id: "community", label: "Outreach", icon: HeartHandshake },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden border-t border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-canvas-dark/90 backdrop-blur-deep px-2 pb-safe-offset transition-colors">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all duration-200 relative ${
                isActive
                  ? "text-eagle-blue-dark dark:text-bumblebee-yellow font-extrabold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-eagle-blue via-bumblebee-yellow to-forest-light rounded-full shadow-sm" />
              )}
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? "bg-slate-100 dark:bg-white/10 scale-110 shadow-sm" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
