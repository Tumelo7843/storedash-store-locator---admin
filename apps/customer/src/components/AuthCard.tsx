import type { ReactNode } from 'react';

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10 sd-animate-in">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="bg-surface border border-gray-200 rounded-2xl p-6 sm:p-8 flex flex-col gap-5 shadow-xl shadow-black/20">
          <div className="text-center">
            <h1 className="text-xl font-extrabold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-1.5">{subtitle}</p>}
          </div>
          {children}
        </div>

        {footer}
      </div>
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return <p className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5 text-center">{message}</p>;
}

export function FormSuccess({ message }: { message: string }) {
  return (
    <p className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2.5 text-center">{message}</p>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

export function GoogleButton({ onClick, disabled, label = 'Continue with Google' }: { onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-gray-100 hover:bg-gray-200/70 text-gray-900 font-bold text-sm flex items-center justify-center gap-3 disabled:opacity-50 transition-colors"
    >
      <svg className="size-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      {label}
    </button>
  );
}
