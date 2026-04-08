import "dotenv/config";

import { Timestamp } from "firebase-admin/firestore";

import { getAncoraFirestore, getWorkspaceRef } from "../services/firestoreAdmin.js";
import { FIRESTORE_COLLECTIONS } from "../types/firestore.js";

const DOC_ID = "seed-ancora";

function assertCredentialsOrEmulator(): void {
  if (process.env.FIRESTORE_EMULATOR_HOST) return;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT)
    return;
  console.error(
    "Credenciais em falta: defina GOOGLE_APPLICATION_CREDENTIALS ou FIREBASE_SERVICE_ACCOUNT no .env, ou grave no emulador com: npm run seed:emulator"
  );
  process.exit(1);
}

/**
 * Grava um workspace de exemplo em Firestore (coleção `ancora_workspaces`).
 * Requer credenciais: `GOOGLE_APPLICATION_CREDENTIALS` ou `FIREBASE_SERVICE_ACCOUNT`.
 */
async function main(): Promise<void> {
  assertCredentialsOrEmulator();
  const userId = process.env.ANCORA_SEED_USER_ID ?? "seed-user";
  const db = getAncoraFirestore();
  const ref = getWorkspaceRef(db, DOC_ID);

  const data = {
    name: "Workspace Ancora (seed)",
    userId,
    order: 0,
    createdAt: Timestamp.now(),
  };

  await ref.set(data);

  console.log(
    `Gravado em Firestore: ${FIRESTORE_COLLECTIONS.workspaces}/${DOC_ID}`
  );
  console.log({
    id: DOC_ID,
    name: data.name,
    userId: data.userId,
    order: data.order,
    createdAt: data.createdAt.toDate().toISOString(),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
