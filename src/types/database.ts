import type {
  AppData,
  Section,
  Subspace,
  Task,
  TaskStatus,
  Workspace,
} from "./models.js";

/** Nomes das tabelas públicas (espelham a migração SQL). */
export const TABLES = {
  workspaces: "ancora_workspaces",
  subspaces: "ancora_subspaces",
  sections: "ancora_sections",
  tasks: "ancora_tasks",
} as const;

export const DB_USER_ID_FIELD = "user_id" as const;

/** Linha `ancora_workspaces` (Postgres). */
export interface WorkspaceRow {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

/** Linha `ancora_subspaces`. */
export interface SubspaceRow {
  id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

/** Linha `ancora_sections`. */
export interface SectionRow {
  id: string;
  subspace_id: string;
  workspace_id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

/** Linha `ancora_tasks`. */
export interface TaskRow {
  id: string;
  section_id: string;
  subspace_id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  status: TaskStatus;
  tags: string[];
  assignee_name: string | null;
  due_date: string | null;
  sort_order: number;
  created_at: string;
}

/** Payload de inserção/atualização parcial de tarefas. */
export type TaskUpdateFields = Partial<
  Pick<
    TaskRow,
    | "title"
    | "status"
    | "tags"
    | "assignee_name"
    | "due_date"
    | "sort_order"
    | "section_id"
    | "subspace_id"
    | "workspace_id"
  >
>;

export function workspaceToRow(
  w: Workspace
): { id: string; row: Omit<WorkspaceRow, "id"> } {
  const { id, ...rest } = w;
  return {
    id,
    row: {
      user_id: rest.userId,
      name: rest.name,
      sort_order: rest.order,
      created_at: new Date(rest.createdAt).toISOString(),
    },
  };
}

export function subspaceToRow(
  s: Subspace
): { id: string; row: Omit<SubspaceRow, "id"> } {
  const { id, ...rest } = s;
  return {
    id,
    row: {
      workspace_id: rest.workspaceId,
      user_id: rest.userId,
      name: rest.name,
      sort_order: rest.order,
      created_at: new Date(rest.createdAt).toISOString(),
    },
  };
}

export function sectionToRow(
  s: Section
): { id: string; row: Omit<SectionRow, "id"> } {
  const { id, ...rest } = s;
  return {
    id,
    row: {
      subspace_id: rest.subspaceId,
      workspace_id: rest.workspaceId,
      user_id: rest.userId,
      name: rest.name,
      sort_order: rest.order,
      created_at: new Date(rest.createdAt).toISOString(),
    },
  };
}

export function taskToRow(t: Task): { id: string; row: Omit<TaskRow, "id"> } {
  const { id, ...rest } = t;
  return {
    id,
    row: {
      section_id: rest.sectionId,
      subspace_id: rest.subspaceId,
      workspace_id: rest.workspaceId,
      user_id: rest.userId,
      title: rest.title,
      status: rest.status,
      tags: rest.tags,
      assignee_name: rest.assigneeName,
      due_date: rest.dueDate,
      sort_order: rest.order,
      created_at: new Date(rest.createdAt).toISOString(),
    },
  };
}

export function rowToWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    userId: row.user_id,
    order: row.sort_order,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function rowToSubspace(row: SubspaceRow): Subspace {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    name: row.name,
    order: row.sort_order,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function rowToSection(row: SectionRow): Section {
  return {
    id: row.id,
    subspaceId: row.subspace_id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    name: row.name,
    order: row.sort_order,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    sectionId: row.section_id,
    subspaceId: row.subspace_id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    title: row.title,
    status: row.status,
    tags: row.tags ?? [],
    assigneeName: row.assignee_name,
    dueDate: row.due_date,
    order: row.sort_order,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export type {
  AppData,
  Section,
  Subspace,
  Task,
  TaskStatus,
  Workspace,
};
