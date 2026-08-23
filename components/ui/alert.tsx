import * as React from "react";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success";
}
export function Alert({ className = "", variant = "default", children, ...props }: AlertProps) {
  const variants: Record<string, string> = {
    default: "bg-blue-50 border-blue-200 text-blue-800",
    destructive: "bg-red-50 border-red-200 text-red-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };
  return <div className={`relative w-full rounded-lg border p-4 ${variants[variant]} ${className}`} {...props}>{children}</div>;
}
export function AlertDescription({ className = "", children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm ${className}`} {...props}>{children}</p>;
}
