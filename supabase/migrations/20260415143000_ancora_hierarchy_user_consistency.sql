-- Garante consistência de hierarquia por utilizador.
-- Evita gravar subspace/section/task com referências de outro user_id.

ALTER TABLE public.ancora_workspaces
  ADD CONSTRAINT IF NOT EXISTS ancora_workspaces_id_user_unique UNIQUE (id, user_id);

ALTER TABLE public.ancora_subspaces
  ADD CONSTRAINT IF NOT EXISTS ancora_subspaces_id_user_unique UNIQUE (id, user_id);

ALTER TABLE public.ancora_sections
  ADD CONSTRAINT IF NOT EXISTS ancora_sections_id_user_unique UNIQUE (id, user_id);

-- ---------------------------------------------------------------------------
-- ancora_subspaces -> ancora_workspaces (mesmo user_id)
-- ---------------------------------------------------------------------------
ALTER TABLE public.ancora_subspaces
  DROP CONSTRAINT IF EXISTS ancora_subspaces_workspace_id_fkey;

ALTER TABLE public.ancora_subspaces
  ADD CONSTRAINT ancora_subspaces_workspace_user_fkey
  FOREIGN KEY (workspace_id, user_id)
  REFERENCES public.ancora_workspaces (id, user_id)
  ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- ancora_sections -> workspaces/subspaces (mesmo user_id)
-- ---------------------------------------------------------------------------
ALTER TABLE public.ancora_sections
  DROP CONSTRAINT IF EXISTS ancora_sections_workspace_id_fkey;

ALTER TABLE public.ancora_sections
  DROP CONSTRAINT IF EXISTS ancora_sections_subspace_id_fkey;

ALTER TABLE public.ancora_sections
  ADD CONSTRAINT ancora_sections_workspace_user_fkey
  FOREIGN KEY (workspace_id, user_id)
  REFERENCES public.ancora_workspaces (id, user_id)
  ON DELETE CASCADE;

ALTER TABLE public.ancora_sections
  ADD CONSTRAINT ancora_sections_subspace_user_fkey
  FOREIGN KEY (subspace_id, user_id)
  REFERENCES public.ancora_subspaces (id, user_id)
  ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- ancora_tasks -> workspaces/subspaces/sections (mesmo user_id)
-- ---------------------------------------------------------------------------
ALTER TABLE public.ancora_tasks
  DROP CONSTRAINT IF EXISTS ancora_tasks_workspace_id_fkey;

ALTER TABLE public.ancora_tasks
  DROP CONSTRAINT IF EXISTS ancora_tasks_subspace_id_fkey;

ALTER TABLE public.ancora_tasks
  DROP CONSTRAINT IF EXISTS ancora_tasks_section_id_fkey;

ALTER TABLE public.ancora_tasks
  ADD CONSTRAINT ancora_tasks_workspace_user_fkey
  FOREIGN KEY (workspace_id, user_id)
  REFERENCES public.ancora_workspaces (id, user_id)
  ON DELETE CASCADE;

ALTER TABLE public.ancora_tasks
  ADD CONSTRAINT ancora_tasks_subspace_user_fkey
  FOREIGN KEY (subspace_id, user_id)
  REFERENCES public.ancora_subspaces (id, user_id)
  ON DELETE CASCADE;

ALTER TABLE public.ancora_tasks
  ADD CONSTRAINT ancora_tasks_section_user_fkey
  FOREIGN KEY (section_id, user_id)
  REFERENCES public.ancora_sections (id, user_id)
  ON DELETE CASCADE;
