import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

import { getSupabaseAdmin } from "../config/supabase.js";
import { TABLES, workspaceToRow } from "../types/database.js";
import type { Workspace } from "../types/models.js";

const hasSupabase =
  Boolean(process.env.SUPABASE_URL?.trim()) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
const seedUserId = process.env.ANCORA_SEED_USER_ID?.trim();

describe.skipIf(!hasSupabase || !seedUserId)("Supabase (integração)", () => {
  beforeAll(() => {
    process.env.SUPABASE_URL = process.env.SUPABASE_URL!;
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY!;
  });

  it("insere e remove um workspace", async () => {
    const supabase = getSupabaseAdmin();
    const id = randomUUID();
    const now = Date.now();
    const w: Workspace = {
      id,
      name: "Teste integração",
      userId: seedUserId!,
      order: 0,
      createdAt: now,
    };
    const { id: wid, row } = workspaceToRow(w);
    const { error: insErr } = await supabase
      .from(TABLES.workspaces)
      .insert({ id: wid, ...row });
    expect(insErr).toBeNull();

    const { data, error: selErr } = await supabase
      .from(TABLES.workspaces)
      .select("name, user_id")
      .eq("id", id)
      .maybeSingle();
    expect(selErr).toBeNull();
    expect(data?.name).toBe("Teste integração");
    expect(data?.user_id).toBe(seedUserId);

    const { error: delErr } = await supabase
      .from(TABLES.workspaces)
      .delete()
      .eq("id", id);
    expect(delErr).toBeNull();
  });
});
