/**
 * Configuração do cliente web (Firebase JS SDK) — referência para alinhar o frontend.
 * Não uses a conta de serviço no browser; a apiKey é pública por desenho do Firebase.
 *
 * Copiar para o projeto web como `firebaseConfig` e usar `initializeApp` do pacote `firebase/app`.
 */
export const firebaseWebConfig = {
  apiKey: "AIzaSyC62YLQCl7jwaYnd71LNqsVx4lEElm19xo",
  authDomain: "lampiao-30f17.firebaseapp.com",
  projectId: "lampiao-30f17",
  storageBucket: "lampiao-30f17.firebasestorage.app",
  messagingSenderId: "290865285295",
  appId: "1:290865285295:web:bc652d512ecc671c966c5a",
} as const;
