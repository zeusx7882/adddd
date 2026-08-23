"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const errorMessages: Record<string, string> = {
  AccessDenied: "Acesso negado. Este Discord não tem permissão de administrador.",
  OAuthSignin: "Erro ao iniciar autenticação. Tente novamente.",
  OAuthCallback: "Erro no retorno do Discord. Tente novamente.",
  Default: "Ocorreu um erro. Tente novamente.",
};

function LoginContent() {
  const params = useSearchParams();
  const error = params.get("error");
  const errorMsg = error ? (errorMessages[error] ?? errorMessages.Default) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-4xl mb-2">🎮</div>
          <CardTitle className="text-2xl font-bold">Free Drop Keys</CardTitle>
          <CardDescription>Painel Administrativo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMsg && (
            <div className="rounded-lg border bg-red-50 border-red-200 text-red-800 p-4 text-sm">
              {errorMsg}
            </div>
          )}
          <Button
            onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 127.14 96.36" fill="currentColor">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            Entrar com Discord
          </Button>
          <p className="text-center text-xs text-gray-500">
            Acesso restrito ao administrador autorizado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
