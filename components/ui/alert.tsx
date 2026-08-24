import * as React from "react";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success";
}
export function Alert({ className = "", variant = "default", children, ...props }: AlertProps) {
  const variants: Record<string, string> = {
    default: "bg-[#0f172a] border-[#1e3a8a] text-[#e0e7ff]",
    destructive: "bg-[#3f1113] border-[#7f1d1d] text-[#fee2e2]",
    success: "bg-[#052e1f] border-[#065f46] text-[#d1fae5]",
  };
  return (
    <div className={`relative w-full rounded-lg border p-4 ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
export function AlertDescription({ className = "", children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm ${className}`} {...props}>{children}</p>;
}
