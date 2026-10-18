import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "yellow" | "green" | "red" | "gold" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "blue",
  size = "md",
  className,
}: BadgeProps) {
  const variantStyles = {
    blue: "bg-eagle-blue/15 text-blue-300 border-eagle-blue/30 shadow-[0_0_10px_rgba(0,123,254,0.2)]",
    yellow:
      "bg-bumblebee-yellow/15 text-amber-300 border-bumblebee-yellow/40 shadow-[0_0_10px_rgba(254,194,1,0.2)]",
    green:
      "bg-forest-light/15 text-emerald-300 border-forest-light/40 shadow-[0_0_10px_rgba(76,175,80,0.2)]",
    red: "bg-eagle-red/15 text-rose-300 border-eagle-red/30 shadow-[0_0_10px_rgba(252,2,1,0.2)]",
    gold: "bg-bumblebee-gold/15 text-yellow-200 border-bumblebee-gold/40 shadow-[0_0_10px_rgba(216,154,35,0.2)]",
    neutral: "bg-white/10 text-slate-200 border-white/20",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium tracking-wide",
    md: "px-2.5 py-1 text-xs font-semibold tracking-wide",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md transition-colors font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
