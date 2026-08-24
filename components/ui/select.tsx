import * as React from "react";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select
      className={`flex h-10 w-full rounded-md border border-[#2a2a2a] bg-[#111111] px-3 py-2 text-sm text-[#f3f4f6] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
