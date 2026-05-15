// Client ID — localStorage-based identity, no Firebase Auth needed
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
  console.error('API Error: ', JSON.stringify(errInfo));
}

// ── REST API helpers (replaces Firestore SDK) ──

async function apiFetch(method: string, path: string, body?: unknown): Promise<any> {
  const opts: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': clientId,
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API ${method} ${path} failed: ${res.status}`);
  }
  return res.json();
}

// Jobs
export const api = {
  getJobs: () => apiFetch('GET', '/api/jobs'),
  createJob: (data: Record<string, unknown>) => apiFetch('POST', '/api/jobs', data),
  updateJob: (id: string, data: Record<string, unknown>) => apiFetch('PATCH', `/api/jobs/${id}`, data),
  deleteJob: (id: string) => apiFetch('DELETE', `/api/jobs/${id}`),

  getResults: (jobId?: string) => {
    const qs = jobId ? `?jobId=${encodeURIComponent(jobId)}` : '';
    return apiFetch('GET', `/api/results${qs}`);
  },
  createResult: (data: Record<string, unknown>) => apiFetch('POST', '/api/results', data),
  updateResult: (id: string, data: Record<string, unknown>) => apiFetch('PATCH', `/api/results/${id}`, data),
  deleteResult: (id: string) => apiFetch('DELETE', `/api/results/${id}`),
  deleteResultsByJob: (jobId: string) => apiFetch('DELETE', `/api/results?jobId=${encodeURIComponent(jobId)}`),

  // Share
  createShare: (jobId: string) => apiFetch('POST', `/api/jobs/${encodeURIComponent(jobId)}/share`),
  revokeShare: (jobId: string, token: string) => apiFetch('DELETE', `/api/jobs/${encodeURIComponent(jobId)}/share/${token}`),
  getShared: (token: string) => fetch(`/api/share/${token}`).then(r => r.ok ? r.json() : r.json().then(e => { throw new Error(e.error); })),
};
