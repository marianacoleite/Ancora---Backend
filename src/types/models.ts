/** Estado da tarefa no Postgres (enum `task_status`) e no domínio. */
export type TaskStatus = "pending" | "in_progress" | "done";

export interface Workspace {
  id: string;
  name: string;
  userId: string;
  order: number;
  createdAt: number;
}

export interface Subspace {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  order: number;
  createdAt: number;
}

export interface Section {
  id: string;
  subspaceId: string;
  workspaceId: string;
  userId: string;
  name: string;
  order: number;
  createdAt: number;
}

export interface Task {
  id: string;
  sectionId: string;
  subspaceId: string;
  workspaceId: string;
  userId: string;
  title: string;
  status: TaskStatus;
  tags: string[];
  assigneeName: string | null;
  dueDate: string | null;
  order: number;
  createdAt: number;
}

/** Snapshot agregado do app (útil para import/export ou cache). */
export interface AppData {
  workspaces: Workspace[];
  subspaces: Subspace[];
  sections: Section[];
  tasks: Task[];
}
