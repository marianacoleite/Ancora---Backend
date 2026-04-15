/**
 * Exemplo para o frontend (Vite/React, etc.).
 * Copiar `url` e `anon` de Project Settings → API no dashboard Supabase.
 *
 * No browser usa-se a chave `anon` + RLS; nunca expor `service_role`.
 */
export const supabaseWebConfig = {
  url: "https://SEU_PROJETO.supabase.co",
  anonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....",
} as const;
