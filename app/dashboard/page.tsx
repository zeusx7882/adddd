import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Bem-vindo ao painel administrativo Free Drop Keys.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/games">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="text-3xl mb-1">🎮</div>
              <CardTitle>Jogos</CardTitle>
              <CardDescription>Cadastrar e gerenciar jogos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Adicione novos jogos com nome e Steam App ID.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/keys">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <div className="text-3xl mb-1">🔑</div>
              <CardTitle>Keys</CardTitle>
              <CardDescription>Gerar keys para jogos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Gere até 100 keys criptograficamente seguras por vez.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
