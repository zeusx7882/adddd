"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportsData {
  topUser: { discordId: string; count: number } | null;
  topGame: { name: string; count: number } | null;
  topDays: { date: string; count: number }[];
}

export default function ReportsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/reports")
        .then((response) => response.json())
        .then(setData)
        .finally(() => setLoading(false));
    }
  }, [status, router]);

  async function downloadCsv() {
    setDownloading(true);
    try {
      const res = await fetch("/api/reports?format=csv");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `keys-${Date.now()}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#f3f4f6]">Relatórios</h1>
        <Button
          onClick={downloadCsv}
          disabled={downloading}
          className="bg-[#10b981] hover:bg-emerald-600 text-white"
        >
          {downloading ? "Baixando..." : "Exportar CSV"}
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 animate-pulse h-32"
            />
          ))}
        </div>
      ) : !data ? (
        <p className="text-[#9ca3af]">Erro ao carregar relatórios.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-[#f3f4f6] text-base">
                👤 Usuário que mais resgatou
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topUser ? (
                <div>
                  <p className="text-[#f3f4f6] font-mono text-sm">{data.topUser.discordId}</p>
                  <p className="text-[#9ca3af] text-sm mt-1">{data.topUser.count} resgate(s)</p>
                </div>
              ) : (
                <p className="text-[#9ca3af] text-sm">Nenhum resgate ainda.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-[#f3f4f6] text-base">🎮 Jogo mais resgatado</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topGame ? (
                <div>
                  <p className="text-[#f3f4f6]">{data.topGame.name}</p>
                  <p className="text-[#9ca3af] text-sm mt-1">{data.topGame.count} resgate(s)</p>
                </div>
              ) : (
                <p className="text-[#9ca3af] text-sm">Nenhum resgate ainda.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a] md:col-span-2">
            <CardHeader>
              <CardTitle className="text-[#f3f4f6] text-base">📅 Dias com mais resgates</CardTitle>
            </CardHeader>
            <CardContent>
              {data.topDays.length === 0 ? (
                <p className="text-[#9ca3af] text-sm">Nenhum resgate ainda.</p>
              ) : (
                <div className="space-y-2">
                  {data.topDays.map((day) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-[#9ca3af] text-sm w-24">{day.date}</span>
                      <div className="flex-1 bg-[#252525] rounded-full h-2">
                        <div
                          className="bg-[#3b82f6] h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (day.count / (data.topDays[0]?.count || 1)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[#f3f4f6] text-sm w-8 text-right">{day.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
