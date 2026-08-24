"use client";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Game } from "@/types";

type GameWithCounts = Omit<Game, "_count"> & {
  _count?: { available: number; used: number; total: number };
};

export default function GamesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [games, setGames] = useState<GameWithCounts[]>([]);
  const [name, setName] = useState("");
  const [appId, setAppId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAppId, setEditAppId] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editing, setEditing] = useState(false);

  const loadGames = useCallback(async () => {
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
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      const timeout = setTimeout(() => {
        void loadGames();
      }, 0);

      return () => clearTimeout(timeout);
    }
  }, [status, router, loadGames]);

  async function handleCreate() {
    const trimName = name.trim();
    const trimAppId = appId.trim();
    if (!trimName || !trimAppId) {
      setMessage({ type: "error", text: "Preencha o nome e o App ID do jogo." });
      return;
    }
    if (!/^\d+$/.test(trimAppId)) {
      setMessage({ type: "error", text: "App ID deve ser numérico." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimName, appId: trimAppId, imageUrl: imageUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Jogo cadastrado com sucesso!" });
        setName("");
        setAppId("");
        setImageUrl("");
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

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/games/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setMessage({ type: "success", text: "Jogo deletado." });
        setDeleteId(null);
        loadGames();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error ?? "Erro ao deletar." });
      }
    } finally {
      setDeleting(false);
    }
  }

  function startEdit(game: GameWithCounts) {
    setEditId(game.id);
    setEditName(game.name);
    setEditAppId(game.appId);
    setEditImageUrl(game.imageUrl ?? "");
  }

  async function handleEdit() {
    if (!editId) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/games/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, appId: editAppId, imageUrl: editImageUrl }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Jogo atualizado." });
        setEditId(null);
        loadGames();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error ?? "Erro ao editar." });
      }
    } finally {
      setEditing(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#f3f4f6] mb-6">Gerenciar Jogos</h1>

      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : "success"}
          className="mb-4"
        >
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-8 bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-[#f3f4f6]">Adicionar Jogo</CardTitle>
          <CardDescription className="text-[#9ca3af]">
            Cadastre um novo jogo para gerar keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1">Nome do Jogo</label>
            <Input
              placeholder="Ex: Counter-Strike 2"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={loading}
              className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f3f4f6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1">
              Steam App ID (numérico)
            </label>
            <Input
              placeholder="Ex: 730"
              value={appId}
              onChange={(event) => setAppId(event.target.value)}
              disabled={loading}
              className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f3f4f6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#9ca3af] mb-1">
              URL da imagem (opcional)
            </label>
            <Input
              placeholder="https://..."
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              disabled={loading}
              className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f3f4f6]"
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={loading || !name.trim() || !appId.trim()}
            className="bg-[#3b82f6] hover:bg-blue-600 text-white"
          >
            {loading ? "Cadastrando..." : "Cadastrar Jogo"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="text-[#f3f4f6]">Jogos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {fetching ? (
            <p className="text-[#9ca3af] text-sm">Carregando...</p>
          ) : games.length === 0 ? (
            <p className="text-[#9ca3af] text-sm">Nenhum jogo cadastrado ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#6b7280]">
                    <th className="pb-2 pr-4 font-medium">Imagem</th>
                    <th className="pb-2 pr-4 font-medium">Nome</th>
                    <th className="pb-2 pr-4 font-medium">App ID</th>
                    <th className="pb-2 pr-4 font-medium">Total</th>
                    <th className="pb-2 pr-4 font-medium">Disponíveis</th>
                    <th className="pb-2 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game.id} className="border-t border-[#2a2a2a] hover:bg-[#252525]">
                      <td className="py-2 pr-4">
                        {game.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={game.imageUrl}
                            alt={game.name}
                            className="w-10 h-10 rounded object-cover bg-[#252525]"
                            onError={(event) => {
                              event.currentTarget.src = "";
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-[#252525] flex items-center justify-center text-[#6b7280]">
                            🎮
                          </div>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-[#f3f4f6]">{game.name}</td>
                      <td className="py-2 pr-4 text-[#9ca3af]">{game.appId}</td>
                      <td className="py-2 pr-4 text-[#9ca3af]">{game._count?.total ?? 0}</td>
                      <td className="py-2 pr-4 text-[#10b981]">{game._count?.available ?? 0}</td>
                      <td className="py-2 flex gap-2">
                        <button
                          onClick={() => startEdit(game)}
                          className="text-[#3b82f6] hover:text-blue-400 text-xs font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteId(game.id)}
                          className="text-[#ef4444] hover:text-red-400 text-xs font-medium"
                        >
                          Deletar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-[#f3f4f6] font-semibold mb-2">Confirmar exclusão</h3>
            <p className="text-[#9ca3af] text-sm mb-4">
              Tem certeza que deseja deletar este jogo?
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

      {editId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-[#f3f4f6] font-semibold">Editar Jogo</h3>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-1">Nome</label>
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f3f4f6]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-1">App ID</label>
              <Input
                value={editAppId}
                onChange={(event) => setEditAppId(event.target.value)}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f3f4f6]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#9ca3af] mb-1">URL da imagem</label>
              <Input
                value={editImageUrl}
                onChange={(event) => setEditImageUrl(event.target.value)}
                className="bg-[#0a0a0a] border-[#2a2a2a] text-[#f3f4f6]"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditId(null)}
                disabled={editing}
                className="border-[#2a2a2a] text-[#9ca3af]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEdit}
                disabled={editing}
                className="bg-[#3b82f6] hover:bg-blue-600 text-white"
              >
                {editing ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
