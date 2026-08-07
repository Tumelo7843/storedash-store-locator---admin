import { AlertTriangle, Loader2, type LucideIcon, PackageSearch } from 'lucide-react';
import type { ReactNode } from 'react';

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
      <div className="p-3 rounded-full bg-rose-50 text-rose-500">
        <AlertTriangle className="size-6" />
      </div>
      <p className="text-sm font-semibold text-gray-700 max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-1 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon = PackageSearch,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-4">
      <div className="p-3 rounded-full bg-gray-100 text-gray-400 mb-1">
        <Icon className="size-6" />
      </div>
      <p className="text-sm font-bold text-gray-700">{title}</p>
      {description && <p className="text-xs text-gray-500 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
