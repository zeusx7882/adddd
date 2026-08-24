import { Prisma } from "@prisma/client";
import { z } from "zod";
import { isValidGameImageUrl } from "@/lib/game-url";

export const DB_SETUP_MESSAGE =
  "Banco de dados indisponível ou desatualizado. Verifique DATABASE_URL e execute `npx prisma db push`.";

export function getPrismaErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return DB_SETUP_MESSAGE;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return DB_SETUP_MESSAGE;
    }
  }

  return fallback;
}

export const optionalImageUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => isValidGameImageUrl(value),
    "URL da imagem deve ser válida e começar com http:// ou https://"
  )
  .optional();
