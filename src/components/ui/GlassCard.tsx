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
    default: "bg-white/[0.05] border-white/10 shadow-glass",
    elevated: "bg-white/[0.09] border-white/15 shadow-glass",
    interactive:
      "bg-white/[0.05] hover:bg-white/[0.08] border-white/10 hover:border-white/25 active:scale-[0.99] transition-all duration-200 cursor-pointer shadow-glass",
    "glow-blue":
      "bg-gradient-to-b from-eagle-blue/10 via-white/[0.05] to-transparent border-eagle-blue/30 shadow-glow-blue",
    "glow-yellow":
      "bg-gradient-to-b from-bumblebee-yellow/10 via-white/[0.05] to-transparent border-bumblebee-yellow/30 shadow-glow-yellow",
    "glow-green":
      "bg-gradient-to-b from-forest-light/10 via-white/[0.05] to-transparent border-forest-light/30 shadow-glow-green",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border backdrop-blur-glass p-5 transition-all text-white",
        "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/[0.08] before:to-transparent before:pointer-events-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
