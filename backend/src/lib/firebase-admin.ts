import { cert, getApps, initializeApp, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { env } from '../env.js';

// On GCP compute (Cloud Run, App Engine, GCE), Application Default Credentials
// let the Admin SDK authenticate with just a project ID. Off-GCP (e.g. Render),
// there is no ambient credential, so a service account key must be supplied
// explicitly via FIREBASE_SERVICE_ACCOUNT_BASE64 (the service account JSON,
// base64-encoded so it survives as a single-line env var).
function loadCredential(): ServiceAccount | undefined {
  if (!env.firebaseServiceAccountBase64) return undefined;
  const json = Buffer.from(env.firebaseServiceAccountBase64, 'base64').toString('utf-8');
  return JSON.parse(json) as ServiceAccount;
}

if (!getApps().length) {
  const serviceAccount = loadCredential();
  initializeApp({
    projectId: env.firebaseProjectId,
    ...(serviceAccount ? { credential: cert(serviceAccount) } : {}),
  });
}

export const adminAuth = getAuth();
