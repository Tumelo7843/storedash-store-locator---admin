import { useState } from 'react';

interface RejectDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

// Shared by every approve/reject queue (applications, stores, products,
// services) — the owner always gets to see this reason on their own item.
export function RejectDialog({ title, description, confirmLabel, onCancel, onConfirm }: RejectDialogProps) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 flex flex-col gap-3">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          autoFocus
          placeholder="e.g. Business address could not be verified."
          className="input resize-none"
        />
        <div className="flex items-center justify-end gap-2 mt-1">
          <button onClick={onCancel} className="px-3.5 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="px-3.5 py-2 rounded-lg text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
