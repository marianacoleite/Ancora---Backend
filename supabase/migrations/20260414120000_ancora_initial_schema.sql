-- Ancora — esquema completo (PostgreSQL / Supabase)
-- Executar uma vez no SQL Editor (Dashboard → SQL → New query) ou: supabase db push
--
-- Inclui: enum task_status, 4 tabelas, índices, RLS, GRANTs para authenticated e service_role.

-- Estado da tarefa (TaskStatus no TypeScript)
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'done');

-- ---------------------------------------------------------------------------
-- ancora_workspaces
-- ---------------------------------------------------------------------------
CREATE TABLE public.ancora_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ancora_workspaces_user_id_idx ON public.ancora_workspaces (user_id);

-- ---------------------------------------------------------------------------
-- ancora_subspaces
-- ---------------------------------------------------------------------------
CREATE TABLE public.ancora_subspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.ancora_workspaces (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ancora_subspaces_user_id_idx ON public.ancora_subspaces (user_id);
CREATE INDEX ancora_subspaces_workspace_id_idx ON public.ancora_subspaces (workspace_id);

-- ---------------------------------------------------------------------------
-- ancora_sections
-- ---------------------------------------------------------------------------
CREATE TABLE public.ancora_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subspace_id uuid NOT NULL REFERENCES public.ancora_subspaces (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.ancora_workspaces (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ancora_sections_user_id_idx ON public.ancora_sections (user_id);
CREATE INDEX ancora_sections_workspace_id_idx ON public.ancora_sections (workspace_id);
CREATE INDEX ancora_sections_subspace_id_idx ON public.ancora_sections (subspace_id);

-- ---------------------------------------------------------------------------
-- ancora_tasks
-- ---------------------------------------------------------------------------
CREATE TABLE public.ancora_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.ancora_sections (id) ON DELETE CASCADE,
  subspace_id uuid NOT NULL REFERENCES public.ancora_subspaces (id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.ancora_workspaces (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  status public.task_status NOT NULL DEFAULT 'pending',
  tags text[] NOT NULL DEFAULT '{}',
  assignee_name text,
  due_date timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ancora_tasks_user_id_idx ON public.ancora_tasks (user_id);
CREATE INDEX ancora_tasks_workspace_id_idx ON public.ancora_tasks (workspace_id);
CREATE INDEX ancora_tasks_subspace_id_idx ON public.ancora_tasks (subspace_id);
CREATE INDEX ancora_tasks_section_id_idx ON public.ancora_tasks (section_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (só o dono: auth.uid() = user_id)
-- ---------------------------------------------------------------------------
ALTER TABLE public.ancora_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ancora_subspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ancora_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ancora_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ancora_workspaces_owner_isolation"
  ON public.ancora_workspaces
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ancora_subspaces_owner_isolation"
  ON public.ancora_subspaces
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ancora_sections_owner_isolation"
  ON public.ancora_sections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ancora_tasks_owner_isolation"
  ON public.ancora_tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Permissões (PostgREST / cliente com JWT)
-- ---------------------------------------------------------------------------
GRANT USAGE ON TYPE public.task_status TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ancora_workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ancora_subspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ancora_sections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ancora_tasks TO authenticated;

GRANT ALL ON public.ancora_workspaces TO service_role;
GRANT ALL ON public.ancora_subspaces TO service_role;
GRANT ALL ON public.ancora_sections TO service_role;
GRANT ALL ON public.ancora_tasks TO service_role;

-- Opcional: Realtime (descomenta se precisares de subscriptions no cliente)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.ancora_workspaces;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.ancora_subspaces;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.ancora_sections;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.ancora_tasks;
