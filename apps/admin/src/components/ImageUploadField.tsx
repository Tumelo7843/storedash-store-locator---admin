import { ImageOff, Loader2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { uploadImage } from '../lib/upload';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: 'stores' | 'products' | 'services';
}

// Text input stays alongside the uploader so pasting an existing/external
// URL (e.g. a CDN link) keeps working exactly as it did before uploads existed.
export function ImageUploadField({ label, value, onChange, folder }: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <div className="size-14 shrink-0 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
          {value ? (
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImageOff className="size-5 text-gray-300" />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" className="input" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              {uploading ? 'Uploading…' : 'Upload image'}
            </button>
            {error && <span className="text-xs font-semibold text-rose-600">{error}</span>}
          </div>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelect} className="hidden" />
    </div>
  );
}
