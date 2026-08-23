"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Game } from "@/types";

export default function GamesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [name, setName] = useState("");
  const [appId, setAppId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      loadGames();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function loadGames() {
    setFetching(true);
    try {
      const res = await fetch("/api/games");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setGames(data.games ?? []);
    } catch {
      setMessage({ type: "error", text: "Erro ao carregar jogos." });
    } finally {
      setFetching(false);
    }
  }

  async function handleCreate() {
    const trimName = name.trim();
    const trimAppId = appId.trim();
    if (!trimName || !trimAppId) {
      setMessage({ type: "error", text: "Preencha o nome e o App ID do jogo." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimName, appId: trimAppId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Jogo cadastrado com sucesso!" });
        setName("");
        setAppId("");
        loadGames();
      } else if (res.status === 401) {
        router.push("/login?error=SessionExpired");
      } else {
        setMessage({ type: "error", text: data.error ?? "Erro ao cadastrar jogo." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de rede. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gerenciar Jogos</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Adicionar Jogo</CardTitle>
          <CardDescription>Cadastre um novo jogo para gerar keys.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "success"}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Jogo</label>
            <Input
              placeholder="Ex: Counter-Strike 2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Steam App ID</label>
            <Input
              placeholder="Ex: 730"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button onClick={handleCreate} disabled={loading || !name.trim() || !appId.trim()}>
            {loading ? "Cadastrando..." : "Cadastrar Jogo"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jogos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {fetching ? (
            <p className="text-gray-500 text-sm">Carregando...</p>
          ) : games.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum jogo cadastrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 pr-4 font-medium">Nome</th>
                    <th className="pb-2 pr-4 font-medium">App ID</th>
                    <th className="pb-2 font-medium">Keys</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((g) => (
                    <tr key={g.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 pr-4">{g.name}</td>
                      <td className="py-2 pr-4 text-gray-500">{g.appId}</td>
                      <td className="py-2">{g._count?.keys ?? 0}</td>
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
