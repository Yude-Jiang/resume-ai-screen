import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
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
