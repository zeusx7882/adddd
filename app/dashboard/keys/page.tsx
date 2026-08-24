"use client";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ActivationKey, Game } from "@/types";

type Tab = "list" | "generate";

export default function KeysPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("list");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") return <div className="text-[#9ca3af] p-4">Carregando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#f3f4f6] mb-6">Keys</h1>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("list")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "list"
              ? "bg-[#3b82f6] text-white"
              : "bg-[#1a1a1a] text-[#9ca3af] border border-[#2a2a2a] hover:bg-[#252525]"
          }`}
        >
          Gerenciar Keys
        </button>
        <button
          onClick={() => setTab("generate")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "generate"
              ? "bg-[#3b82f6] text-white"
              : "bg-[#1a1a1a] text-[#9ca3af] border border-[#2a2a2a] hover:bg-[#252525]"
          }`}
        >
          Gerar Keys
        </button>
      </div>
      {tab === "list" ? <KeysList /> : <GenerateKeys />}
    </div>
  );
}

function KeysList() {
  const router = useRouter();
  const [keys, setKeys] = useState<ActivationKey[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        filter,
        page: String(page),
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/keys?${params}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setKeys(data.keys ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [filter, page, search, router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadKeys();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadKeys]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/keys/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: "Key deletada com sucesso." });
        setDeleteId(null);
        loadKeys();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error ?? "Erro ao deletar." });
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "success"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2">
          {["all", "available", "used"].map((value) => (
            <button
              key={value}
              onClick={() => {
                setFilter(value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filter === value
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#1a1a1a] text-[#9ca3af] border border-[#2a2a2a] hover:bg-[#252525]"
              }`}
            >
              {value === "all" ? "Todas" : value === "available" ? "Disponíveis" : "Usadas"}
            </button>
          ))}
        </div>
        <Input
          placeholder="Buscar por key ou jogo..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="max-w-xs bg-[#1a1a1a] border-[#2a2a2a] text-[#f3f4f6] placeholder-[#9ca3af]"
        />
        <span className="text-sm text-[#9ca3af]">{total} key(s)</span>
        <Button
          variant="outline"
          size="sm"
          onClick={loadKeys}
          className="border-[#2a2a2a] text-[#9ca3af]"
        >
          ↻
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#2a2a2a]">
        <table className="w-full text-sm">
          <thead className="bg-[#1a1a1a]">
            <tr className="text-left text-[#d1d5db]">
              <th className="px-4 py-3 font-medium">Key</th>
              <th className="px-4 py-3 font-medium">Jogo</th>
              <th className="px-4 py-3 font-medium">App ID</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Usado por</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, rowIndex) => (
                <tr key={rowIndex} className="border-t border-[#2a2a2a]">
                  {[...Array(7)].map((__, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3">
                      <div className="h-4 bg-[#252525] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[#9ca3af]">
                  Nenhuma key encontrada.
                </td>
              </tr>
            ) : (
              keys.map((key) => (
                <tr key={key.id} className="border-t border-[#2a2a2a] hover:bg-[#252525]">
                  <td className="px-4 py-3 font-mono text-xs text-[#9ca3af]">{key.key}</td>
                  <td className="px-4 py-3 text-[#f3f4f6]">{key.gameName ?? "—"}</td>
                  <td className="px-4 py-3 text-[#9ca3af]">{key.appId}</td>
                  <td className="px-4 py-3">
                    <Badge variant={key.used ? "destructive" : "success"}>
                      {key.used ? "Usada" : "Disponível"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#9ca3af] text-xs">{key.usedBy ?? "—"}</td>
                  <td className="px-4 py-3 text-[#9ca3af] text-xs">
                    {key.usedAt ? new Date(key.usedAt).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleteId(key.id)}
                      className="text-[#ef4444] hover:text-red-400 text-xs font-medium"
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((currentPage) => currentPage - 1)}
            className="border-[#2a2a2a] text-[#9ca3af]"
          >
            ← Anterior
          </Button>
          <span className="px-3 py-1.5 text-sm text-[#9ca3af]">
            {page} / {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === pages}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            className="border-[#2a2a2a] text-[#9ca3af]"
          >
            Próxima →
          </Button>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-[#f3f4f6] font-semibold mb-2">Confirmar exclusão</h3>
            <p className="text-[#9ca3af] text-sm mb-4">
              Tem certeza que deseja deletar esta key? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="border-[#2a2a2a] text-[#9ca3af]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-[#ef4444] hover:bg-red-600 text-white"
              >
                {deleting ? "Deletando..." : "Deletar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GenerateKeys() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [loading, setLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/games")
      .then((response) => {
        if (response.status === 401) {
          router.push("/login");
          return null;
        }
        return response.json();
      })
      .then((data) => data && setGames(data.games ?? []));
  }, [router]);

  async function handleGenerate() {
    const qty = parseInt(quantity, 10);
    if (!selectedGame || Number.isNaN(qty) || qty < 1 || qty > 100) {
      setMessage({
        type: "error",
        text: "Selecione um jogo e informe uma quantidade entre 1 e 100.",
      });
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

  const selectedGameObj = games.find((game) => game.id === selectedGame);

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-[#f3f4f6]">Configurar Geração</CardTitle>
          <CardDescription className="text-[#9ca3af]">
            Escolha o jogo e a quantidade de keys a gerar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "success"}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1">Jogo</label>
            <Select
              value={selectedGame}
              onChange={(event) => setSelectedGame(event.target.value)}
              disabled={loading}
              className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f3f4f6]"
            >
              <option value="">Selecione um jogo...</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name} (App ID: {game.appId})
                </option>
              ))}
            </Select>
          </div>
          {selectedGameObj && (
            <div className="flex gap-4 text-sm">
              <span className="text-[#9ca3af]">
                App ID: <span className="text-[#f3f4f6]">{selectedGameObj.appId}</span>
              </span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1">
              Quantidade (1–100)
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              disabled={loading}
              className="max-w-xs bg-[#0a0a0a] border-[#2a2a2a] text-[#f3f4f6]"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading || !selectedGame}
            className="bg-[#3b82f6] hover:bg-blue-600 text-white"
          >
            {loading ? "Gerando..." : "Gerar Keys"}
          </Button>
        </CardContent>
      </Card>

      {generatedKeys.length > 0 && (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-[#f3f4f6]">Keys Geradas</CardTitle>
              <CardDescription className="text-[#9ca3af]">
                {generatedKeys.length} key(s)
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyAll}
              className="border-[#2a2a2a] text-[#9ca3af]"
            >
              {copied === "__all__" ? "Copiado!" : "Copiar Todas"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-sm">
              {generatedKeys.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-[#0a0a0a] rounded px-3 py-1.5 group border border-[#2a2a2a]"
                >
                  <span className="text-[#9ca3af]">{key}</span>
                  <button
                    onClick={() => copyKey(key)}
                    className="text-xs text-[#9ca3af] hover:text-[#3b82f6] ml-4 opacity-0 group-hover:opacity-100 transition-opacity"
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
