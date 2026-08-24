import * as React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "destructive";
}
export function Badge({ className = "", variant = "default", children, ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-[#1e3a8a] text-[#dbeafe]",
    secondary: "bg-[#1f2937] text-[#d1d5db]",
    success: "bg-[#064e3b] text-[#d1fae5]",
    destructive: "bg-[#7f1d1d] text-[#fee2e2]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
