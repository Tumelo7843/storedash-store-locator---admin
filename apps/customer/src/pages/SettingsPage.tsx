import { LogOut, Moon, Palette, ShieldCheck, Sun, User } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Spinner } from '../components/ui/States';

type Section = 'appearance' | 'account' | 'security';

const ROLE_LABEL: Record<string, string> = {
  store_admin: 'Store Owner',
  super_admin: 'Platform Admin',
};

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  return (
    <Card title="Theme" description="Choose how StoreDash looks on this device.">
      <div className="grid grid-cols-2 gap-3 max-w-sm">
        <button
          onClick={() => setTheme('light')}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
            theme === 'light' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Sun className="size-6 text-gray-700" />
          <span className="text-sm font-bold text-gray-900">Light</span>
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
            theme === 'dark' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Moon className="size-6 text-gray-700" />
          <span className="text-sm font-bold text-gray-900">Dark</span>
        </button>
      </div>
    </Card>
  );
}

function AccountSection({ profile }: { profile: NonNullable<ReturnType<typeof useAuth>['profile']> }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <Card title="Profile">
        <div className="flex items-center gap-4">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="" className="size-14 rounded-full object-cover" />
          ) : (
            <div className="size-14 rounded-full bg-primary/15 text-primary flex items-center justify-center font-extrabold text-xl">
              {(profile.name || profile.email).charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-gray-900">{profile.name || profile.email}</p>
            <p className="text-xs text-gray-500">{profile.email}</p>
            {profile.role !== 'customer' && (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold border border-accent/30">
                <ShieldCheck className="size-3" /> {ROLE_LABEL[profile.role]}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          To change your name, phone number, email, or password, visit{' '}
          <Link to="/account/manage" className="text-primary font-semibold hover:underline">
            Manage Profile
          </Link>
          .
        </p>
      </Card>

      <button
        onClick={async () => {
          await signOut();
          navigate('/');
        }}
        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold"
      >
        <LogOut className="size-4" /> Sign out
      </button>
    </div>
  );
}

function SecuritySection() {
  return (
    <Card title="Password, email & account deletion" description="These live on the Manage Profile page, alongside your other identity details.">
      <Link
        to="/account/manage"
        className="self-start px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold"
      >
        Go to Manage Profile
      </Link>
    </Card>
  );
}

export function SettingsPage() {
  const { profile, loading } = useAuth();
  const [section, setSection] = useState<Section>('appearance');

  if (loading) return <Spinner />;

  const TABS: Array<{ key: Section; label: string; icon: typeof Palette }> = [
    { key: 'appearance', label: 'Appearance', icon: Palette },
    ...(profile ? ([{ key: 'account', label: 'Account', icon: User }, { key: 'security', label: 'Privacy & Security', icon: ShieldCheck }] as const) : []),
  ];

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-10 flex flex-col gap-6">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-extrabold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your appearance and account preferences.</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSection(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${
              section === t.key ? 'bg-primary text-white' : 'bg-surface border border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <t.icon className="size-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {section === 'appearance' && <AppearanceSection />}
      {section === 'account' && profile && <AccountSection profile={profile} />}
      {section === 'security' && profile && <SecuritySection />}
    </div>
  );
}
