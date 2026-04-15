import { describe, expect, it } from "vitest";

import { getSupabaseAdmin } from "../config/supabase.js";
import { TABLES } from "../types/database.js";

const hasCredentials =
  Boolean(process.env.SUPABASE_URL?.trim()) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

describe.skipIf(!hasCredentials)("Supabase — ligação", () => {
  it("cria o cliente e lê da tabela ancora_workspaces (ou tabela vazia)", async () => {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from(TABLES.workspaces)
      .select("id")
      .limit(1);

    // Se falhar: credenciais erradas, URL inválida ou tabela ainda não criada (corre a migração SQL).
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
