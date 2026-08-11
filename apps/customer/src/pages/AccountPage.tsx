import { LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/States';

export function AccountPage() {
  const { profile, loading, signInWithGoogle, signOut } = useAuth();

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
        <button onClick={signInWithGoogle} className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold">
          Sign in with Google
        </button>
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
        <div>
          <h2 className="text-base font-bold text-gray-900">{profile.name || profile.email}</h2>
          <p className="text-xs text-gray-500">{profile.email}</p>
          {profile.role !== 'customer' && (
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold border border-accent/30">
              <ShieldCheck className="size-3" /> {profile.role === 'store_admin' ? 'Store Admin' : 'Platform Admin'}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={signOut}
        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold"
      >
        <LogOut className="size-4" /> Sign out
      </button>
    </div>
  );
}
