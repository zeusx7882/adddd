import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
}

export function Button({ className = "", variant = "default", size = "default", children, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    default: "bg-[#3b82f6] text-white hover:bg-blue-600",
    outline: "border border-[#2a2a2a] bg-[#111111] hover:bg-[#1a1a1a] text-[#f3f4f6]",
    ghost: "hover:bg-[#1a1a1a] text-[#f3f4f6]",
    destructive: "bg-[#ef4444] text-white hover:bg-red-600",
  };
  const sizes: Record<string, string> = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-6 text-base",
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
