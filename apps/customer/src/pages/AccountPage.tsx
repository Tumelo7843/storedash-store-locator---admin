import { LogIn, LogOut, Mail, Phone, Settings, ShieldCheck, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/States';
import { env } from '../lib/env';

const ROLE_LABEL: Record<string, string> = {
  store_admin: 'Store Owner',
  super_admin: 'Platform Admin',
};

export function AccountPage() {
  const { profile, loading } = useAuth();

  if (loading) return <Spinner />;

  if (!profile) {
    return (
      <div className="max-w-md mx-auto w-full py-16 px-4 flex flex-col items-center text-center gap-4">
        <div className="size-16 rounded-full bg-primary/15 text-primary flex items-center justify-center">
          <LogIn className="size-8" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Sign in to StoreDash</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to place orders and view your order history.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/sign-in" className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold">
            Sign in
          </Link>
          <Link to="/sign-up" className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-bold">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full py-16 px-4 flex flex-col gap-6">
      <div className="bg-surface border border-gray-200 rounded-2xl p-6 flex items-center gap-4">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="" className="size-14 rounded-full object-cover" />
        ) : (
          <div className="size-14 rounded-full bg-primary/15 text-primary flex items-center justify-center font-extrabold text-xl">
            {(profile.name || profile.email).charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-900 truncate">{profile.name || profile.email}</h2>
          <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
            <Mail className="size-3 shrink-0" /> {profile.email}
          </p>
          {profile.phone && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Phone className="size-3 shrink-0" /> {profile.phone}
            </p>
          )}
          {profile.role !== 'customer' && (
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold border border-accent/30">
              <ShieldCheck className="size-3" /> {ROLE_LABEL[profile.role]}
            </span>
          )}
        </div>
      </div>

      {profile.role === 'customer' ? (
        <Link
          to="/become-a-store-owner"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary text-sm font-bold border border-primary/30"
        >
          <Store className="size-4" /> Become a store owner
        </Link>
      ) : (
        env.adminUrl && (
          <a
            href={env.adminUrl}
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary text-sm font-bold border border-primary/30"
          >
            <ShieldCheck className="size-4" /> Go to admin dashboard
          </a>
        )
      )}

      <Link
        to="/account/manage"
        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-bold"
      >
        <Settings className="size-4" /> Manage Profile
      </Link>

      <SignOutButton />
    </div>
  );
}

function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <button
      onClick={signOut}
      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold"
    >
      <LogOut className="size-4" /> Sign out
    </button>
  );
}
