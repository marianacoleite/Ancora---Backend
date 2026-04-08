import type { Timestamp } from "firebase-admin/firestore";

/** Estado da tarefa no Firestore e no domínio. */
export type TaskStatus = "pending" | "in_progress" | "done";

export interface Workspace {
  id: string;
  name: string;
  userId: string;
  order: number;
  createdAt: Timestamp;
}

export interface Subspace {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  order: number;
  createdAt: Timestamp;
}

export interface Section {
  id: string;
  subspaceId: string;
  workspaceId: string;
  userId: string;
  name: string;
  order: number;
  createdAt: Timestamp;
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
  dueDate: Timestamp | null;
  order: number;
  createdAt: Timestamp;
}

/** Snapshot agregado do app (útil para import/export ou cache). */
export interface AppData {
  workspaces: Workspace[];
  subspaces: Subspace[];
  sections: Section[];
  tasks: Task[];
}
