import "dotenv/config";
import { Timestamp } from "firebase-admin/firestore";
import express from "express";
import { getFirebaseApp } from "./config/firebase.js";
import { getAncoraFirestore } from "./services/firestoreAdmin.js";

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json());

const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin) {
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", corsOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
}

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "ancora-backend" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

/** Verifica se o Admin SDK inicializa (útil após deploy). */
app.get("/health/firebase", (_req, res) => {
  try {
    getFirebaseApp();
    res.status(200).json({ status: "ok", firebase: "initialized" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(503).json({ status: "error", firebase: "failed", message });
  }
});

/**
 * Escreve, lê e apaga um documento de teste (confirma gravação real no Firestore).
 * Requer `FIREBASE_SERVICE_ACCOUNT` ou `GOOGLE_APPLICATION_CREDENTIALS`.
 */
app.get("/health/firestore", async (_req, res) => {
  try {
    getFirebaseApp();
    const db = getAncoraFirestore();
    const id = `ping-${Date.now()}`;
    const ref = db.collection("_health_checks").doc(id);
    await ref.set({ at: Timestamp.now(), source: "ancora-backend" });
    const snap = await ref.get();
    await ref.delete();
    if (!snap.exists) {
      res.status(503).json({ status: "error", firestore: "read_after_write_failed" });
      return;
    }
    res.status(200).json({ status: "ok", firestore: "write_read_delete_ok" });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(503).json({ status: "error", firestore: "failed", message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ancora-backend listening on ${PORT}`);
});
