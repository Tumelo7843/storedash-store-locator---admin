import { LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AccountPage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  if (!profile) return null;

  return (
    <div className="flex-1 p-4 md:p-8 max-w-md flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Account</h1>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-4">
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
          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-primary text-[10px] font-bold border border-blue-100">
            <ShieldCheck className="size-3" /> {profile.role === 'super_admin' ? 'Platform Admin' : 'Store Admin'}
          </span>
        </div>
      </div>

      <button
        onClick={async () => {
          await signOut();
          navigate('/login');
        }}
        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold"
      >
        <LogOut className="size-4" /> Sign out
      </button>
    </div>
  );
}
