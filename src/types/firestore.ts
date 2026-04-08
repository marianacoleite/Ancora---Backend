import type { Timestamp } from "firebase-admin/firestore";

import type {
  AppData,
  Section,
  Subspace,
  Task,
  TaskStatus,
  Workspace,
} from "./models.js";

/** Nomes das coleções — espelham o cliente; o `id` da entidade é sempre o document id. */
export const FIRESTORE_COLLECTIONS = {
  workspaces: "ancora_workspaces",
  subspaces: "ancora_subspaces",
  sections: "ancora_sections",
  tasks: "ancora_tasks",
} as const;

/** Campo usado nas queries do cliente para filtrar por utilizador. */
export const FIRESTORE_USER_ID_FIELD = "userId" as const;

/** Payload gravado em `ancora_workspaces/{id}` (sem `id` no corpo). */
export interface FirestoreWorkspaceData {
  name: string;
  userId: string;
  order: number;
  createdAt: Timestamp;
}

/** Payload gravado em `ancora_subspaces/{id}`. */
export interface FirestoreSubspaceData {
  workspaceId: string;
  userId: string;
  name: string;
  order: number;
  createdAt: Timestamp;
}

/** Payload gravado em `ancora_sections/{id}`. */
export interface FirestoreSectionData {
  subspaceId: string;
  workspaceId: string;
  userId: string;
  name: string;
  order: number;
  createdAt: Timestamp;
}

/** Payload gravado em `ancora_tasks/{id}`. */
export interface FirestoreTaskData {
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

/** Campos permitidos em atualização parcial de tarefas (`updateDoc`). */
export type FirestoreTaskUpdateFields = Partial<
  Pick<
    FirestoreTaskData,
    | "title"
    | "status"
    | "tags"
    | "assigneeName"
    | "dueDate"
    | "order"
    | "sectionId"
    | "subspaceId"
    | "workspaceId"
  >
>;

export function workspaceToFirestore(
  w: Workspace
): { id: string; data: FirestoreWorkspaceData } {
  const { id, ...data } = w;
  return { id, data };
}

export function subspaceToFirestore(
  s: Subspace
): { id: string; data: FirestoreSubspaceData } {
  const { id, ...data } = s;
  return { id, data };
}

export function sectionToFirestore(
  s: Section
): { id: string; data: FirestoreSectionData } {
  const { id, ...data } = s;
  return { id, data };
}

export function taskToFirestore(
  t: Task
): { id: string; data: FirestoreTaskData } {
  const { id, ...data } = t;
  return { id, data };
}

export type {
  AppData,
  Section,
  Subspace,
  Task,
  TaskStatus,
  Workspace,
};
