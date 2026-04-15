import "dotenv/config";

import { randomUUID } from "node:crypto";
import pg from "pg";

const { Client } = pg;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variavel de ambiente em falta: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const email = (process.env.ANCORA_SEED_USER_EMAIL || "admancora@ancora.com").trim();
  const databaseUrl = requiredEnv("DATABASE_URL");

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    const userResult = await client.query<{ id: string }>(
      "select id from auth.users where email = $1 limit 1",
      [email]
    );
    const userId = userResult.rows[0]?.id;
    if (!userId) {
      throw new Error(`Usuario nao encontrado em auth.users para o email: ${email}`);
    }

    const nowIso = new Date().toISOString();
    const workspaceId = randomUUID();
    const subspaceId = randomUUID();
    const sectionId = randomUUID();
    const taskId = randomUUID();

    await client.query("begin");
    await client.query(
      "insert into public.ancora_workspaces (id, user_id, name, sort_order, created_at) values ($1, $2, $3, $4, $5)",
      [workspaceId, userId, "Workspace Seed ADM", 999, nowIso]
    );
    await client.query(
      "insert into public.ancora_subspaces (id, workspace_id, user_id, name, sort_order, created_at) values ($1, $2, $3, $4, $5, $6)",
      [subspaceId, workspaceId, userId, "Subspace Seed ADM", 999, nowIso]
    );
    await client.query(
      "insert into public.ancora_sections (id, subspace_id, workspace_id, user_id, name, sort_order, created_at) values ($1, $2, $3, $4, $5, $6, $7)",
      [sectionId, subspaceId, workspaceId, userId, "Section Seed ADM", 999, nowIso]
    );
    await client.query(
      "insert into public.ancora_tasks (id, section_id, subspace_id, workspace_id, user_id, title, status, tags, assignee_name, due_date, sort_order, created_at) values ($1, $2, $3, $4, $5, $6, $7, $8::text[], $9, $10, $11, $12)",
      [
        taskId,
        sectionId,
        subspaceId,
        workspaceId,
        userId,
        "Tarefa Seed ADM",
        "pending",
        ["seed", "admancora"],
        "admancora",
        null,
        999,
        nowIso,
      ]
    );
    await client.query("commit");

    console.log(
      JSON.stringify(
        {
          ok: true,
          email,
          userId,
          workspaceId,
          subspaceId,
          sectionId,
          taskId,
        },
        null,
        2
      )
    );
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
