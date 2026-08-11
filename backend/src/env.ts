import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  // Single connection string, e.g.
  // postgresql://user:password@host:5432/dbname?sslmode=require
  databaseUrl: required('DATABASE_URL'),

  // Comma-separated list of allowed browser origins for CORS, e.g.
  // https://storedash-customer.vercel.app,https://storedash-admin.vercel.app
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  firebaseProjectId: required('FIREBASE_PROJECT_ID'),
  // Base64-encoded service account JSON. Required off-GCP (e.g. Render).
  // On GCP compute this can be omitted in favor of Application Default Credentials.
  firebaseServiceAccountBase64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '',

  // Supabase Storage for product/service/store images (see README "Image uploads").
  // Optional at startup (not `required()`) so the rest of the app keeps working
  // without it configured — the uploads route itself rejects with a clear error
  // if these are missing when someone actually tries to upload.
  supabaseUrl: process.env.SUPABASE_URL || '',
  // Service role key only — never the anon/public key. It bypasses Row Level
  // Security, which is fine here because it's used exclusively server-side,
  // behind this app's own requireAuth/requireRole checks.
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'images',
};
