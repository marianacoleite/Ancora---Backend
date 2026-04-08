import { Timestamp } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";

import {
  sectionToFirestore,
  subspaceToFirestore,
  taskToFirestore,
  workspaceToFirestore,
} from "../types/firestore.js";

const ts = Timestamp.fromMillis(1_700_000_000_000);

describe("conversores modelo → Firestore", () => {
  it("workspaceToFirestore separa id e dados", () => {
    const w = {
      id: "ws-1",
      name: "Meu espaço",
      userId: "user-a",
      order: 2,
      createdAt: ts,
    };
    const { id, data } = workspaceToFirestore(w);
    expect(id).toBe("ws-1");
    expect(data).toEqual({
      name: "Meu espaço",
      userId: "user-a",
      order: 2,
      createdAt: ts,
    });
  });

  it("subspaceToFirestore separa id e dados", () => {
    const s = {
      id: "sub-1",
      workspaceId: "ws-1",
      userId: "user-a",
      name: "Sub",
      order: 0,
      createdAt: ts,
    };
    const { id, data } = subspaceToFirestore(s);
    expect(id).toBe("sub-1");
    expect(data.workspaceId).toBe("ws-1");
    expect(data.userId).toBe("user-a");
  });

  it("sectionToFirestore separa id e dados", () => {
    const s = {
      id: "sec-1",
      subspaceId: "sub-1",
      workspaceId: "ws-1",
      userId: "user-a",
      name: "Secção",
      order: 1,
      createdAt: ts,
    };
    const { id, data } = sectionToFirestore(s);
    expect(id).toBe("sec-1");
    expect(data.subspaceId).toBe("sub-1");
  });

  it("taskToFirestore preserva campos e tipos", () => {
    const t = {
      id: "task-1",
      sectionId: "sec-1",
      subspaceId: "sub-1",
      workspaceId: "ws-1",
      userId: "user-a",
      title: "Fazer X",
      status: "pending" as const,
      tags: ["a", "b"],
      assigneeName: null,
      dueDate: null,
      order: 3,
      createdAt: ts,
    };
    const { id, data } = taskToFirestore(t);
    expect(id).toBe("task-1");
    expect(data.title).toBe("Fazer X");
    expect(data.status).toBe("pending");
    expect(data.tags).toEqual(["a", "b"]);
    expect(data.assigneeName).toBeNull();
    expect(data.dueDate).toBeNull();
  });
});
