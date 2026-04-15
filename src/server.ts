import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import yaml from "js-yaml";

import { getSupabaseAdmin } from "./config/supabase.js";
import {
  type SectionRow,
  type SubspaceRow,
  TABLES,
  type TaskRow,
  type TaskStatus,
  type TaskUpdateFields,
  type WorkspaceRow,
  rowToSection,
  rowToSubspace,
  rowToTask,
  rowToWorkspace,
} from "./types/database.js";

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json());

function loadOpenApiSpec(): Record<string, unknown> {
  const openApiPath = path.resolve(process.cwd(), "contracts", "openapi.yaml");
  const fileContent = fs.readFileSync(openApiPath, "utf8");
  const parsed = yaml.load(fileContent);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Arquivo OpenAPI inválido.");
  }
  return parsed as Record<string, unknown>;
}

const openApiSpec = loadOpenApiSpec();

function normalizeOrigin(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed || null;
}

/** Origens permitidas: CORS_ORIGIN + FRONTEND_URL + FRONTEND_LOCAL_URL (sem duplicar). */
function collectCorsOrigins(): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (o: string | null): void => {
    if (!o || seen.has(o)) return;
    seen.add(o);
    out.push(o);
  };
  for (const part of (process.env.CORS_ORIGIN || "").split(",")) {
    push(normalizeOrigin(part));
  }
  push(normalizeOrigin(process.env.FRONTEND_URL));
  push(normalizeOrigin(process.env.FRONTEND_LOCAL_URL));
  return out;
}

const corsOrigins = collectCorsOrigins();
if (corsOrigins.length > 0) {
  app.use((req, res, next) => {
    const requestOrigin = req.header("origin");
    const allowed =
      requestOrigin && corsOrigins.includes(requestOrigin) ? requestOrigin : null;

    if (allowed) {
      res.setHeader("Access-Control-Allow-Origin", allowed);
      res.setHeader("Vary", "Origin");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Accept"
      );
    }

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
}

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "ancora-backend" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/docs/openapi.json", (_req, res) => {
  res.status(200).json(openApiSpec);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

type AuthRequest = Request & { userId?: string };
const STATUS_VALUES: TaskStatus[] = ["pending", "in_progress", "done"];
let authClient: SupabaseClient | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente em falta: ${name}`);
  }
  return value;
}

function getSupabaseAuth(): SupabaseClient {
  if (authClient) return authClient;
  const url = requireEnv("SUPABASE_URL");
  const key =
    process.env.SUPABASE_ANON_KEY?.trim() || requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  authClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return authClient;
}

function toJsonError(
  res: Response,
  status: number,
  message: string,
  extra?: Record<string, unknown>
): void {
  res.status(status).json({ message, ...extra });
}

function normalizeTaskStatus(value: unknown): TaskStatus | null {
  if (typeof value !== "string") return null;
  return STATUS_VALUES.includes(value as TaskStatus) ? (value as TaskStatus) : null;
}

function normalizeDueDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.header("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    toJsonError(res, 401, "Token ausente.");
    return;
  }
  getSupabaseAdmin()
    .auth.getUser(token)
    .then(({ data, error }) => {
      if (error || !data.user?.id) {
        toJsonError(res, 401, "Token inválido.");
        return;
      }
      req.userId = data.user.id;
      next();
    })
    .catch((err) => {
      const message = err instanceof Error ? err.message : "Falha na autenticação.";
      toJsonError(res, 401, message);
    });
}

app.post("/api/v1/auth/login", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) {
    toJsonError(res, 400, "email e password são obrigatórios.");
    return;
  }
  const { data, error } = await getSupabaseAuth().auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session?.access_token || !data.user?.id || !data.user.email) {
    toJsonError(res, 401, error?.message || "Credenciais inválidas.");
    return;
  }
  res.status(200).json({
    token: data.session.access_token,
    user: { id: data.user.id, email: data.user.email },
  });
});

app.post("/api/v1/auth/register", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) {
    toJsonError(res, 400, "email e password são obrigatórios.");
    return;
  }
  const admin = getSupabaseAdmin();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) {
    toJsonError(res, 400, createError.message);
    return;
  }
  const { data, error } = await getSupabaseAuth().auth.signInWithPassword({ email, password });
  if (error || !data.session?.access_token || !data.user?.id || !data.user.email) {
    toJsonError(res, 400, error?.message || "Usuário criado, mas login falhou.");
    return;
  }
  res.status(200).json({
    token: data.session.access_token,
    user: { id: data.user.id, email: data.user.email },
  });
});

app.get("/api/v1/auth/me", authMiddleware, async (req: AuthRequest, res) => {
  const { data, error } = await getSupabaseAdmin().auth.admin.getUserById(req.userId!);
  if (error || !data.user?.id || !data.user.email) {
    toJsonError(res, 404, error?.message || "Usuário não encontrado.");
    return;
  }
  res.status(200).json({ user: { id: data.user.id, email: data.user.email } });
});

app.post("/api/v1/auth/logout", authMiddleware, (_req, res) => {
  res.sendStatus(204);
});

app.get("/api/v1/app-data", authMiddleware, async (req: AuthRequest, res) => {
  const supabase = getSupabaseAdmin();
  const userId = req.userId!;
  const [workspaces, subspaces, sections, tasks] = await Promise.all([
    supabase.from(TABLES.workspaces).select("*").eq("user_id", userId).order("sort_order"),
    supabase.from(TABLES.subspaces).select("*").eq("user_id", userId).order("sort_order"),
    supabase.from(TABLES.sections).select("*").eq("user_id", userId).order("sort_order"),
    supabase.from(TABLES.tasks).select("*").eq("user_id", userId).order("sort_order"),
  ]);
  const firstError = workspaces.error || subspaces.error || sections.error || tasks.error;
  if (firstError) {
    toJsonError(res, 500, firstError.message);
    return;
  }
  res.status(200).json({
    workspaces: (workspaces.data as WorkspaceRow[]).map(rowToWorkspace),
    subspaces: (subspaces.data as SubspaceRow[]).map(rowToSubspace),
    sections: (sections.data as SectionRow[]).map(rowToSection),
    tasks: (tasks.data as TaskRow[]).map(rowToTask),
  });
});

app.post("/api/v1/workspaces", authMiddleware, async (req: AuthRequest, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const order = Number(req.body?.order ?? 0);
  if (!name || Number.isNaN(order)) {
    toJsonError(res, 400, "name e order são obrigatórios.");
    return;
  }
  const payload = { user_id: req.userId!, name, sort_order: order };
  const { data, error } = await getSupabaseAdmin()
    .from(TABLES.workspaces)
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) {
    toJsonError(res, 400, error?.message || "Falha ao criar workspace.");
    return;
  }
  res.status(200).json(rowToWorkspace(data as WorkspaceRow));
});

app.patch("/api/v1/workspaces/:id", authMiddleware, async (req: AuthRequest, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    toJsonError(res, 400, "name é obrigatório.");
    return;
  }
  const { data, error } = await getSupabaseAdmin()
    .from(TABLES.workspaces)
    .update({ name })
    .eq("id", req.params.id)
    .eq("user_id", req.userId!)
    .select("*")
    .maybeSingle();
  if (error) {
    toJsonError(res, 400, error.message);
    return;
  }
  if (!data) {
    toJsonError(res, 404, "Workspace não encontrado.");
    return;
  }
  res.status(200).json(rowToWorkspace(data as WorkspaceRow));
});

app.delete("/api/v1/workspaces/:id", authMiddleware, async (req: AuthRequest, res) => {
  const { error } = await getSupabaseAdmin()
    .from(TABLES.workspaces)
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId!);
  if (error) {
    toJsonError(res, 400, error.message);
    return;
  }
  res.sendStatus(204);
});

app.post("/api/v1/subspaces", authMiddleware, async (req: AuthRequest, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const workspaceId =
    typeof req.body?.workspaceId === "string" ? req.body.workspaceId.trim() : "";
  const order = Number(req.body?.order ?? 0);
  if (!name || !workspaceId || Number.isNaN(order)) {
    toJsonError(res, 400, "workspaceId, name e order são obrigatórios.");
    return;
  }
  const { data, error } = await getSupabaseAdmin()
    .from(TABLES.subspaces)
    .insert({
      workspace_id: workspaceId,
      user_id: req.userId!,
      name,
      sort_order: order,
    })
    .select("*")
    .single();
  if (error || !data) {
    toJsonError(res, 400, error?.message || "Falha ao criar subspace.");
    return;
  }
  res.status(200).json(rowToSubspace(data as SubspaceRow));
});

app.patch("/api/v1/subspaces/:id", authMiddleware, async (req: AuthRequest, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    toJsonError(res, 400, "name é obrigatório.");
    return;
  }
  const { data, error } = await getSupabaseAdmin()
    .from(TABLES.subspaces)
    .update({ name })
    .eq("id", req.params.id)
    .eq("user_id", req.userId!)
    .select("*")
    .maybeSingle();
  if (error) {
    toJsonError(res, 400, error.message);
    return;
  }
  if (!data) {
    toJsonError(res, 404, "Subspace não encontrado.");
    return;
  }
  res.status(200).json(rowToSubspace(data as SubspaceRow));
});

app.delete("/api/v1/subspaces/:id", authMiddleware, async (req: AuthRequest, res) => {
  const { error } = await getSupabaseAdmin()
    .from(TABLES.subspaces)
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId!);
  if (error) {
    toJsonError(res, 400, error.message);
    return;
  }
  res.sendStatus(204);
});

app.post("/api/v1/sections", authMiddleware, async (req: AuthRequest, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const workspaceId =
    typeof req.body?.workspaceId === "string" ? req.body.workspaceId.trim() : "";
  const subspaceId =
    typeof req.body?.subspaceId === "string" ? req.body.subspaceId.trim() : "";
  const order = Number(req.body?.order ?? 0);
  if (!name || !workspaceId || !subspaceId || Number.isNaN(order)) {
    toJsonError(res, 400, "workspaceId, subspaceId, name e order são obrigatórios.");
    return;
  }
  const { data, error } = await getSupabaseAdmin()
    .from(TABLES.sections)
    .insert({
      workspace_id: workspaceId,
      subspace_id: subspaceId,
      user_id: req.userId!,
      name,
      sort_order: order,
    })
    .select("*")
    .single();
  if (error || !data) {
    toJsonError(res, 400, error?.message || "Falha ao criar seção.");
    return;
  }
  res.status(200).json(rowToSection(data as SectionRow));
});

app.patch("/api/v1/sections/:id", authMiddleware, async (req: AuthRequest, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    toJsonError(res, 400, "name é obrigatório.");
    return;
  }
  const { data, error } = await getSupabaseAdmin()
    .from(TABLES.sections)
    .update({ name })
    .eq("id", req.params.id)
    .eq("user_id", req.userId!)
    .select("*")
    .maybeSingle();
  if (error) {
    toJsonError(res, 400, error.message);
    return;
  }
  if (!data) {
    toJsonError(res, 404, "Seção não encontrada.");
    return;
  }
  res.status(200).json(rowToSection(data as SectionRow));
});

app.delete("/api/v1/sections/:id", authMiddleware, async (req: AuthRequest, res) => {
  const { error } = await getSupabaseAdmin()
    .from(TABLES.sections)
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId!);
  if (error) {
    toJsonError(res, 400, error.message);
    return;
  }
  res.sendStatus(204);
});

app.post("/api/v1/tasks", authMiddleware, async (req: AuthRequest, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const workspaceId =
    typeof req.body?.workspaceId === "string" ? req.body.workspaceId.trim() : "";
  const subspaceId =
    typeof req.body?.subspaceId === "string" ? req.body.subspaceId.trim() : "";
  const sectionId =
    typeof req.body?.sectionId === "string" ? req.body.sectionId.trim() : "";
  const status = normalizeTaskStatus(req.body?.status);
  const order = Number(req.body?.order ?? 0);
  const assigneeName =
    req.body?.assigneeName === null || req.body?.assigneeName === undefined
      ? null
      : String(req.body.assigneeName);
  const dueDate = normalizeDueDate(req.body?.dueDate);
  const tags = Array.isArray(req.body?.tags) ? req.body.tags.filter((t: unknown) => typeof t === "string") : [];
  if (!title || !workspaceId || !subspaceId || !sectionId || !status || Number.isNaN(order)) {
    toJsonError(res, 400, "Payload de criação de tarefa inválido.");
    return;
  }
  const { data, error } = await getSupabaseAdmin()
    .from(TABLES.tasks)
    .insert({
      title,
      workspace_id: workspaceId,
      subspace_id: subspaceId,
      section_id: sectionId,
      user_id: req.userId!,
      status,
      tags,
      assignee_name: assigneeName,
      due_date: dueDate,
      sort_order: order,
    })
    .select("*")
    .single();
  if (error || !data) {
    toJsonError(res, 400, error?.message || "Falha ao criar tarefa.");
    return;
  }
  res.status(200).json(rowToTask(data as TaskRow));
});

app.patch("/api/v1/tasks/:id", authMiddleware, async (req: AuthRequest, res) => {
  const patch: TaskUpdateFields = {};
  if (typeof req.body?.title === "string") patch.title = req.body.title.trim();
  if (req.body?.status !== undefined) {
    const status = normalizeTaskStatus(req.body.status);
    if (!status) {
      toJsonError(res, 400, "status inválido.");
      return;
    }
    patch.status = status;
  }
  if (Array.isArray(req.body?.tags)) {
    patch.tags = req.body.tags.filter((t: unknown) => typeof t === "string");
  }
  if (req.body?.assigneeName !== undefined) {
    patch.assignee_name = req.body.assigneeName === null ? null : String(req.body.assigneeName);
  }
  if (req.body?.dueDate !== undefined) {
    patch.due_date = normalizeDueDate(req.body.dueDate);
  }
  if (req.body?.order !== undefined) {
    const order = Number(req.body.order);
    if (Number.isNaN(order)) {
      toJsonError(res, 400, "order inválido.");
      return;
    }
    patch.sort_order = order;
  }
  if (typeof req.body?.sectionId === "string") patch.section_id = req.body.sectionId.trim();
  if (typeof req.body?.subspaceId === "string") patch.subspace_id = req.body.subspaceId.trim();
  if (typeof req.body?.workspaceId === "string") patch.workspace_id = req.body.workspaceId.trim();

  if (!Object.keys(patch).length) {
    toJsonError(res, 400, "Nenhum campo enviado para atualização.");
    return;
  }
  const { data, error } = await getSupabaseAdmin()
    .from(TABLES.tasks)
    .update(patch)
    .eq("id", req.params.id)
    .eq("user_id", req.userId!)
    .select("*")
    .maybeSingle();
  if (error) {
    toJsonError(res, 400, error.message);
    return;
  }
  if (!data) {
    toJsonError(res, 404, "Tarefa não encontrada.");
    return;
  }
  res.status(200).json(rowToTask(data as TaskRow));
});

app.delete("/api/v1/tasks/:id", authMiddleware, async (req: AuthRequest, res) => {
  const { error } = await getSupabaseAdmin()
    .from(TABLES.tasks)
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId!);
  if (error) {
    toJsonError(res, 400, error.message);
    return;
  }
  res.sendStatus(204);
});

/** Verifica variáveis e criação do cliente Supabase. */
app.get("/health/supabase", (_req, res) => {
  try {
    getSupabaseAdmin();
    res.status(200).json({ status: "ok", supabase: "client_ready" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(503).json({ status: "error", supabase: "failed", message });
  }
});

/**
 * Confirma ligação real ao Postgres (leitura na tabela de workspaces).
 * Requer `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
 */
app.get("/health/db", async (_req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from(TABLES.workspaces)
      .select("id")
      .limit(1);
    if (error) {
      res.status(503).json({ status: "error", db: "query_failed", message: error.message });
      return;
    }
    res.status(200).json({ status: "ok", db: "read_ok" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(503).json({ status: "error", db: "failed", message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ancora-backend listening on ${PORT}`);
});
