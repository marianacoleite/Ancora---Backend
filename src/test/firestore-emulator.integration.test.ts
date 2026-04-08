import { Timestamp } from "firebase-admin/firestore";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!emulatorHost)("Firestore (emulador)", () => {
  let getAncoraFirestore: () => import("firebase-admin/firestore").Firestore;
  let getWorkspaceRef: (
    db: import("firebase-admin/firestore").Firestore,
    id: string
  ) => import("firebase-admin/firestore").DocumentReference<
    import("../types/firestore.js").FirestoreWorkspaceData
  >;

  beforeAll(async () => {
    process.env.FIREBASE_PROJECT_ID =
      process.env.FIREBASE_PROJECT_ID ?? "demo-ancora-test";
    const admin = await import("../services/firestoreAdmin.js");
    getAncoraFirestore = admin.getAncoraFirestore;
    getWorkspaceRef = admin.getWorkspaceRef;
  });

  it("escreve e lê um workspace", async () => {
    const db = getAncoraFirestore();
    const id = `test-ws-${Date.now()}`;
    const ref = getWorkspaceRef(db, id);
    const payload = {
      name: "Teste integração",
      userId: "test-user",
      order: 0,
      createdAt: Timestamp.now(),
    };
    await ref.set(payload);
    const snap = await ref.get();
    expect(snap.exists).toBe(true);
    expect(snap.data()?.name).toBe("Teste integração");
    expect(snap.data()?.userId).toBe("test-user");
    await ref.delete();
  });

  afterAll(async () => {
    const { getApps, deleteApp } = await import("firebase-admin/app");
    for (const app of getApps()) {
      await deleteApp(app);
    }
  });
});
