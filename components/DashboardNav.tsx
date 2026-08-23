"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface NavProps {
  user: { name?: string | null; image?: string | null };
}

export function DashboardNav({ user }: NavProps) {
  const path = usePathname();

  const links = [
    { href: "/dashboard", label: "Início" },
    { href: "/dashboard/games", label: "Jogos" },
    { href: "/dashboard/keys", label: "Keys" },
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg text-indigo-700">🎮 Free Drop Keys</span>
          <nav className="flex gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  path === l.href
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="avatar" className="w-8 h-8 rounded-full" />
          )}
          <span className="text-sm text-gray-700 hidden sm:block">{user.name}</span>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
