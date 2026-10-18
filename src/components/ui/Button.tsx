import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass" | "outline" | "danger" | "gold";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-canvas-dark";

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-eagle-blue to-eagle-blue-dark text-white shadow-md hover:shadow-glow-blue hover:from-blue-600 hover:to-eagle-blue-dark border border-blue-400/30",
    secondary:
      "bg-gradient-to-r from-forest to-forest-dark text-white shadow-md hover:shadow-glow-green hover:from-forest-light hover:to-forest border border-emerald-400/30",
    gold: "bg-gradient-to-r from-bumblebee-yellow to-bumblebee-gold text-slate-950 font-bold shadow-md hover:shadow-glow-yellow hover:brightness-105 border border-yellow-300/60",
    glass:
      "bg-white/80 hover:bg-white text-slate-800 border border-slate-200/80 shadow-sm dark:bg-white/[0.08] dark:hover:bg-white/[0.14] dark:text-white dark:border-white/20 dark:shadow-glass backdrop-blur-md",
    outline:
      "bg-transparent border border-slate-300 dark:border-white/25 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08]",
    danger:
      "bg-gradient-to-r from-red-600 to-rose-700 text-white hover:from-red-500 hover:to-rose-600 border border-red-400/30 shadow-md",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5",
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
