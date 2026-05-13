import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Values injected by Vite at build time from env vars (VITE_FIREBASE_*)
// These are set in deploy.sh before gcloud run deploy
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

function getOrCreateClientId(): string {
  const key = 'st_resume_client_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = 'cli_' + crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export const clientId = getOrCreateClientId();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    clientId,
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}
