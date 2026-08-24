"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsData {
  total: number;
  available: number;
  used: number;
  uniqueUsers: number;
  recentRedemptions: {
    key: string;
    gameName: string | null;
    usedBy: string | null;
    usedAt: string | null;
  }[];
  chart: { date: string; generated: number; used: number }[];
}

export function DashboardStats() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((response) => response.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 animate-pulse h-24"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-[#9ca3af]">Erro ao carregar estatísticas.</p>;

  const maxGenerated = Math.max(...data.chart.map((chartItem) => chartItem.generated), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#f3f4f6]">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de Keys" value={data.total} color="text-[#3b82f6]" />
        <StatCard label="Disponíveis" value={data.available} color="text-[#10b981]" />
        <StatCard label="Usadas" value={data.used} color="text-[#ef4444]" />
        <StatCard
          label="Usuários Únicos"
          value={data.uniqueUsers}
          color="text-[#f59e0b]"
        />
      </div>

      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-[#f3f4f6] text-base">
            Keys geradas vs usadas (7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-32">
            {data.chart.map((chartItem) => (
              <div key={chartItem.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end h-24">
                  <div
                    className="flex-1 bg-[#3b82f6] rounded-t"
                    style={{
                      height: `${Math.round((chartItem.generated / maxGenerated) * 96)}px`,
                    }}
                    title={`Geradas: ${chartItem.generated}`}
                  />
                  <div
                    className="flex-1 bg-[#ef4444] rounded-t"
                    style={{ height: `${Math.round((chartItem.used / maxGenerated) * 96)}px` }}
                    title={`Usadas: ${chartItem.used}`}
                  />
                </div>
                <span className="text-[10px] text-[#6b7280]">{chartItem.date.slice(5)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-[#9ca3af]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-[#3b82f6] inline-block" />Geradas
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-[#ef4444] inline-block" />Usadas
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-[#f3f4f6] text-base">Últimos 10 resgates</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentRedemptions.length === 0 ? (
            <p className="text-[#6b7280] text-sm">Nenhum resgate ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#6b7280]">
                    <th className="pb-2 pr-4 font-medium">Key</th>
                    <th className="pb-2 pr-4 font-medium">Jogo</th>
                    <th className="pb-2 pr-4 font-medium">Discord ID</th>
                    <th className="pb-2 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentRedemptions.map((redemption, index) => (
                    <tr key={index} className="border-t border-[#2a2a2a] hover:bg-[#252525]">
                      <td className="py-2 pr-4 font-mono text-xs text-[#9ca3af]">
                        {redemption.key}
                      </td>
                      <td className="py-2 pr-4 text-[#f3f4f6]">
                        {redemption.gameName ?? "—"}
                      </td>
                      <td className="py-2 pr-4 text-[#9ca3af]">{redemption.usedBy ?? "—"}</td>
                      <td className="py-2 text-[#6b7280] text-xs">
                        {redemption.usedAt
                          ? new Date(redemption.usedAt).toLocaleString("pt-BR")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4">
      <p className="text-[#9ca3af] text-xs mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value.toLocaleString("pt-BR")}</p>
    </div>
  );
}
