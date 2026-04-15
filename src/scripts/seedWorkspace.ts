import "dotenv/config";

import { randomUUID } from "node:crypto";

import { getSupabaseAdmin } from "../config/supabase.js";
import { TABLES, workspaceToRow } from "../types/database.js";
import type { Workspace } from "../types/models.js";

function assertSupabaseEnv(): void {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env (Project Settings → API no Supabase)."
    );
    process.exit(1);
  }
}

const WORKSPACE_ID = randomUUID();

/**
 * Insere um workspace de exemplo em `ancora_workspaces`.
 * `ANCORA_SEED_USER_ID` deve ser o UUID de um utilizador em Authentication (auth.users).
 */
async function main(): Promise<void> {
  assertSupabaseEnv();
  const userId = process.env.ANCORA_SEED_USER_ID?.trim();
  if (!userId) {
    console.error(
      "Defina ANCORA_SEED_USER_ID com o UUID de um utilizador Supabase Auth (Authentication → Users)."
    );
    process.exit(1);
  }

  const supabase = getSupabaseAdmin();
  const now = Date.now();
  const w: Workspace = {
    id: WORKSPACE_ID,
    name: "Workspace Ancora (seed)",
    userId,
    order: 0,
    createdAt: now,
  };
  const { id, row } = workspaceToRow(w);
  const payload = { id, ...row };

  const { error } = await supabase.from(TABLES.workspaces).upsert(payload);

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log(`Gravado em Supabase: ${TABLES.workspaces} (${id})`);
  console.log({
    id,
    name: w.name,
    userId: w.userId,
    order: w.order,
    createdAt: new Date(w.createdAt).toISOString(),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
