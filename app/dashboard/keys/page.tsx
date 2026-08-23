"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Game } from "@/types";

export default function KeysPage() {
  const { status } = useSession();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [loading, setLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/games")
        .then((r) => {
          if (r.status === 401) { router.push("/login"); return null; }
          return r.json();
        })
        .then((d) => d && setGames(d.games ?? []));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleGenerate() {
    const qty = parseInt(quantity, 10);
    if (!selectedGame || isNaN(qty) || qty < 1 || qty > 100) {
      setMessage({ type: "error", text: "Selecione um jogo e informe uma quantidade entre 1 e 100." });
      return;
    }
    setLoading(true);
    setMessage(null);
    setGeneratedKeys([]);
    try {
      const res = await fetch("/api/keys/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: selectedGame, quantity: qty }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedKeys(data.keys ?? []);
        setMessage({ type: "success", text: `${data.generated} key(s) geradas com sucesso!` });
      } else if (res.status === 401) {
        router.push("/login?error=SessionExpired");
      } else {
        setMessage({ type: "error", text: data.error ?? "Erro ao gerar keys." });
      }
    } catch {
      setMessage({ type: "error", text: "Erro de rede. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  async function copyKey(key: string) {
    await navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  async function copyAll() {
    await navigator.clipboard.writeText(generatedKeys.join("\n"));
    setCopied("__all__");
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gerar Keys</h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Configurar Geração</CardTitle>
          <CardDescription>Escolha o jogo e a quantidade de keys a gerar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "success"}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jogo</label>
            <Select value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)} disabled={loading}>
              <option value="">Selecione um jogo...</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>{g.name} (App ID: {g.appId})</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade (1–100)</label>
            <Input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={loading}
              className="max-w-xs"
            />
          </div>
          <Button onClick={handleGenerate} disabled={loading || !selectedGame}>
            {loading ? "Gerando..." : "Gerar Keys"}
          </Button>
        </CardContent>
      </Card>

      {generatedKeys.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Keys Geradas</CardTitle>
              <CardDescription>{generatedKeys.length} key(s)</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={copyAll}>
              {copied === "__all__" ? "Copiado!" : "Copiar Todas"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-sm">
              {generatedKeys.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5 group"
                >
                  <span>{key}</span>
                  <button
                    onClick={() => copyKey(key)}
                    className="text-xs text-gray-400 hover:text-indigo-600 ml-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copied === key ? "✓" : "Copiar"}
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
