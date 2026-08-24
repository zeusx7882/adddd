"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NavProps {
  user: { name?: string | null; image?: string | null };
}

export function DashboardNav({ user }: NavProps) {
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/dashboard", label: "Início" },
    { href: "/dashboard/games", label: "Jogos" },
    { href: "/dashboard/keys", label: "Keys" },
    { href: "/dashboard/reports", label: "Relatórios" },
  ];

  return (
    <header className="bg-[#1a1a1a] border-b border-[#2a2a2a] shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg text-[#3b82f6]">🎮 Free Drop Keys</span>
          <nav className="hidden md:flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  path === link.href
                    ? "bg-[#3b82f6]/20 text-[#3b82f6]"
                    : "text-[#9ca3af] hover:bg-[#252525] hover:text-[#f3f4f6]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="avatar" className="w-8 h-8 rounded-full" />
          )}
          <span className="text-sm text-[#9ca3af] hidden sm:block">{user.name}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="border-[#2a2a2a] text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#252525]"
          >
            Sair
          </Button>
          <button
            className="md:hidden p-2 text-[#9ca3af]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="md:hidden bg-[#1a1a1a] border-t border-[#2a2a2a] px-4 py-2 flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                path === link.href ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "text-[#9ca3af]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
