import type {
  CollectionReference,
  DocumentReference,
  Firestore,
} from "firebase-admin/firestore";

import { getFirestoreDb } from "../config/firebase.js";
import {
  FIRESTORE_COLLECTIONS,
  type FirestoreSectionData,
  type FirestoreSubspaceData,
  type FirestoreTaskData,
  type FirestoreWorkspaceData,
} from "../types/firestore.js";

function col<T>(
  db: Firestore,
  name: (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS]
): CollectionReference<T> {
  return db.collection(name) as CollectionReference<T>;
}

export function getWorkspaceRef(
  db: Firestore,
  id: string
): DocumentReference<FirestoreWorkspaceData> {
  return col<FirestoreWorkspaceData>(db, FIRESTORE_COLLECTIONS.workspaces).doc(
    id
  ) as DocumentReference<FirestoreWorkspaceData>;
}

export function getSubspaceRef(
  db: Firestore,
  id: string
): DocumentReference<FirestoreSubspaceData> {
  return col<FirestoreSubspaceData>(db, FIRESTORE_COLLECTIONS.subspaces).doc(
    id
  ) as DocumentReference<FirestoreSubspaceData>;
}

export function getSectionRef(
  db: Firestore,
  id: string
): DocumentReference<FirestoreSectionData> {
  return col<FirestoreSectionData>(db, FIRESTORE_COLLECTIONS.sections).doc(
    id
  ) as DocumentReference<FirestoreSectionData>;
}

export function getTaskRef(
  db: Firestore,
  id: string
): DocumentReference<FirestoreTaskData> {
  return col<FirestoreTaskData>(db, FIRESTORE_COLLECTIONS.tasks).doc(
    id
  ) as DocumentReference<FirestoreTaskData>;
}

/** Instância Firestore já ligada à app Admin inicializada. */
export function getAncoraFirestore(): Firestore {
  return getFirestoreDb();
}
