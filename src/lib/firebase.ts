import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export async function clearAllClientData() {
  const { collection, getDocs, deleteDoc, doc, query, where } = await import('firebase/firestore');
  for (const collName of ['analysisResults', 'jobs']) {
    const q = query(collection(db, collName), where('ownerId', '==', clientId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, collName, d.id));
    }
  }
}
(window as any).__clearAll = clearAllClientData;

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
