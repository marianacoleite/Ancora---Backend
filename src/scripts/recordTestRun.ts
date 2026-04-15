import "dotenv/config";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

import { getSupabaseAdmin } from "../config/supabase.js";

const { Client } = pg;

const MAX_VITEST_OUTPUT = 100_000;

const MIGRATION_REL = join(
  "supabase",
  "migrations",
  "20260414183000_ancora_backend_test_runs.sql"
);

function assertEnv(): void {
  if (!process.env.SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.error(
      "Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env (Project Settings → API no Supabase)."
    );
    process.exit(1);
  }
}

/**
 * Constrói URI direta (porta 5432, host db.<ref>.supabase.co) a partir da API URL e da password
 * na connection string do pooler — necessário para DDL fora do SQL Editor.
 */
function deriveDirectPostgresUrl(): string | null {
  const apiUrl = process.env.SUPABASE_URL?.trim();
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!apiUrl || !dbUrl) return null;
  const refMatch = apiUrl.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i);
  if (!refMatch) return null;
  const ref = refMatch[1];
  try {
    const u = new URL(dbUrl);
    const pass = u.password;
    if (!pass) return null;
    const encodedPass = encodeURIComponent(decodeURIComponent(pass));
    const base = `postgresql://postgres:${encodedPass}@db.${ref}.supabase.co:5432/postgres?sslmode=require`;
    return base;
  } catch {
    return null;
  }
}

/** URL para DDL: direta (5432) ou derivada do pooler; evita pooler transacional (6543). */
function ddlConnectionString(): string | null {
  const prefer = process.env.SUPABASE_DIRECT_DATABASE_URL?.trim();
  if (prefer) return prefer;
  const fallback = process.env.DATABASE_URL?.trim();
  if (fallback) {
    const looksPooler =
      fallback.includes(":6543") ||
      fallback.includes("pgbouncer=true") ||
      fallback.includes("pooler.supabase.com");
    if (!looksPooler) return fallback;
  }
  return deriveDirectPostgresUrl();
}

async function applyMigrationIfNeeded(): Promise<void> {
  const conn = ddlConnectionString();
  const path = join(process.cwd(), MIGRATION_REL);
  const sql = readFileSync(path, "utf8");
  if (!conn) {
    console.warn(
      "Sem URI Postgres direta (5432): não aplico CREATE TABLE automaticamente. Cola supabase/migrations/20260414183000_ancora_backend_test_runs.sql no SQL Editor do Supabase (uma vez)."
    );
    return;
  }
  const u = new URL(conn);
  const client = new Client({
    host: u.hostname,
    port: Number(u.port) || 5432,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, "") || "postgres",
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Migração ancora_backend_test_runs aplicada (ou já existia).");
  } finally {
    await client.end();
  }
}

function runVitest(): { stdout: string; code: number } {
  try {
    const stdout = execSync("npx vitest run", {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      cwd: process.cwd(),
      env: process.env,
    });
    return { stdout, code: 0 };
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: Buffer; stderr?: Buffer };
    const out = [
      err.stdout?.toString("utf8") ?? "",
      err.stderr?.toString("utf8") ?? "",
    ].join("\n");
    return { stdout: out, code: err.status ?? 1 };
  }
}

async function main(): Promise<void> {
  assertEnv();
  await applyMigrationIfNeeded();

  const { stdout, code } = runVitest();
  const ok = code === 0;
  const summary = ok
    ? `Vitest OK (exit ${code})`
    : `Vitest falhou (exit ${code})`;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ancora_backend_test_runs")
    .insert({
      success: ok,
      summary,
      vitest_output: stdout.slice(0, MAX_VITEST_OUTPUT),
    })
    .select("id, ran_at, success, summary")
    .single();

  if (error) {
    console.error("Erro ao gravar no Supabase:", error.message);
    process.exit(1);
  }
  console.log("Registo guardado em ancora_backend_test_runs:", data);
  if (!ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
