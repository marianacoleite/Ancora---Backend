import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Projeto Firebase (consola). O SDK web usa as mesmas credenciais de projeto;
 * no servidor usa-se Admin SDK com conta de serviço ou ADC.
 */
export const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ?? "lampiao-30f17";

let appInstance: App | null = null;

/**
 * Inicializa a app Admin uma vez. Preferir:
 * - `GOOGLE_APPLICATION_CREDENTIALS` apontando para JSON da conta de serviço, ou
 * - `FIREBASE_SERVICE_ACCOUNT` com o JSON inline (ex.: secret no hosting).
 */
export function getFirebaseApp(): App {
  if (appInstance) return appInstance;

  const existing = getApps()[0];
  if (existing) {
    appInstance = existing;
    return appInstance;
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (json) {
    const parsed = JSON.parse(json) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    appInstance = initializeApp({
      credential: cert({
        projectId: parsed.project_id ?? FIREBASE_PROJECT_ID,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key?.replace(/\\n/g, "\n"),
      }),
    });
    return appInstance;
  }

  appInstance = initializeApp({ projectId: FIREBASE_PROJECT_ID });
  return appInstance;
}

export function getFirestoreDb() {
  return getFirestore(getFirebaseApp());
}
