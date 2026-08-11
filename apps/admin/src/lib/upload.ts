import { auth } from './firebase';
import { env } from './env';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export class UploadError extends Error {}

// Uploads go through the backend (POST /api/admin/uploads), which pushes the
// file to Supabase Storage using a service-role key that only ever lives
// server-side, then hands back a public URL. The browser never talks to
// Supabase directly and never sees any Supabase credentials.
export async function uploadImage(file: File, folder: 'stores' | 'products' | 'services'): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError('Please choose a JPEG, PNG, WebP, or GIF image.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new UploadError('Image must be smaller than 5MB.');
  }

  const user = auth.currentUser;
  if (!user) throw new UploadError('You must be signed in to upload images.');
  const token = await user.getIdToken();

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${env.apiUrl}/api/admin/uploads?folder=${folder}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    let message = `Upload failed (${res.status})`;
    try {
      const body = await res.json();
      message = body?.error?.message || message;
    } catch {
      // non-JSON error response
    }
    throw new UploadError(message);
  }

  const body: { data: { url: string } } = await res.json();
  return body.data.url;
}
