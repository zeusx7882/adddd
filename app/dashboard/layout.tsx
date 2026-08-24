import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DashboardNav user={session.user ?? {}} />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
