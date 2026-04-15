import { describe, expect, it } from "vitest";

import {
  sectionToRow,
  subspaceToRow,
  taskToRow,
  workspaceToRow,
} from "../types/database.js";

const ts = 1_700_000_000_000;
const uid = "550e8400-e29b-41d4-a716-446655440000";

describe("conversores modelo → linhas Postgres", () => {
  it("workspaceToRow separa id e dados (snake_case)", () => {
    const w = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Meu espaço",
      userId: uid,
      order: 2,
      createdAt: ts,
    };
    const { id, row } = workspaceToRow(w);
    expect(id).toBe("550e8400-e29b-41d4-a716-446655440001");
    expect(row).toEqual({
      name: "Meu espaço",
      user_id: uid,
      sort_order: 2,
      created_at: new Date(ts).toISOString(),
    });
  });

  it("subspaceToRow separa id e dados", () => {
    const s = {
      id: "550e8400-e29b-41d4-a716-446655440002",
      workspaceId: "550e8400-e29b-41d4-a716-446655440001",
      userId: uid,
      name: "Sub",
      order: 0,
      createdAt: ts,
    };
    const { id, row } = subspaceToRow(s);
    expect(id).toBe("550e8400-e29b-41d4-a716-446655440002");
    expect(row.workspace_id).toBe("550e8400-e29b-41d4-a716-446655440001");
    expect(row.user_id).toBe(uid);
  });

  it("sectionToRow separa id e dados", () => {
    const s = {
      id: "550e8400-e29b-41d4-a716-446655440003",
      subspaceId: "550e8400-e29b-41d4-a716-446655440002",
      workspaceId: "550e8400-e29b-41d4-a716-446655440001",
      userId: uid,
      name: "Secção",
      order: 1,
      createdAt: ts,
    };
    const { id, row } = sectionToRow(s);
    expect(id).toBe("550e8400-e29b-41d4-a716-446655440003");
    expect(row.subspace_id).toBe("550e8400-e29b-41d4-a716-446655440002");
  });

  it("taskToRow preserva campos e tipos", () => {
    const t = {
      id: "550e8400-e29b-41d4-a716-446655440004",
      sectionId: "550e8400-e29b-41d4-a716-446655440003",
      subspaceId: "550e8400-e29b-41d4-a716-446655440002",
      workspaceId: "550e8400-e29b-41d4-a716-446655440001",
      userId: uid,
      title: "Fazer X",
      status: "pending" as const,
      tags: ["a", "b"],
      assigneeName: null,
      dueDate: null,
      order: 3,
      createdAt: ts,
    };
    const { id, row } = taskToRow(t);
    expect(id).toBe("550e8400-e29b-41d4-a716-446655440004");
    expect(row.title).toBe("Fazer X");
    expect(row.status).toBe("pending");
    expect(row.tags).toEqual(["a", "b"]);
    expect(row.assignee_name).toBeNull();
    expect(row.due_date).toBeNull();
  });
});
