import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "interactive" | "glow-blue" | "glow-yellow" | "glow-green";
  className?: string;
}

export function GlassCard({
  children,
  variant = "default",
  className,
  ...props
}: GlassCardProps) {
  const variantStyles = {
    default:
      "bg-white/75 dark:bg-white/[0.05] border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-glass",
    elevated:
      "bg-white/90 dark:bg-white/[0.09] border-slate-300/80 dark:border-white/15 text-slate-900 dark:text-white shadow-[0_10px_35px_rgba(0,0,0,0.07)] dark:shadow-glass",
    interactive:
      "bg-white/75 dark:bg-white/[0.05] hover:bg-white/95 dark:hover:bg-white/[0.09] border-slate-200 dark:border-white/10 hover:border-eagle-blue/40 dark:hover:border-white/25 active:scale-[0.99] text-slate-900 dark:text-white transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-glass",
    "glow-blue":
      "bg-gradient-to-b from-blue-50/90 via-white/80 to-white/60 dark:from-eagle-blue/10 dark:via-white/[0.05] dark:to-transparent border-eagle-blue/30 text-slate-900 dark:text-white shadow-[0_0_25px_-5px_rgba(0,123,254,0.15)] dark:shadow-glow-blue",
    "glow-yellow":
      "bg-gradient-to-b from-amber-50/90 via-white/80 to-white/60 dark:from-bumblebee-yellow/10 dark:via-white/[0.05] dark:to-transparent border-bumblebee-yellow/40 text-slate-900 dark:text-white shadow-[0_0_25px_-5px_rgba(254,194,1,0.15)] dark:shadow-glow-yellow",
    "glow-green":
      "bg-gradient-to-b from-emerald-50/90 via-white/80 to-white/60 dark:from-forest-light/10 dark:via-white/[0.05] dark:to-transparent border-forest-light/40 text-slate-900 dark:text-white shadow-[0_0_25px_-5px_rgba(76,175,80,0.15)] dark:shadow-glow-green",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border backdrop-blur-glass p-5 transition-all",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/40 dark:before:from-white/[0.08] before:to-transparent before:pointer-events-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
