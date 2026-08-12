import {
  Bell,
  Check,
  CheckSquare,
  ClipboardList,
  Lock,
  LogOut,
  Moon,
  Palette,
  ShieldCheck,
  Store as StoreIcon,
  Sun,
  User,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApprovalBadge } from '../components/ApprovalBadge';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { updateMyProfile } from '../lib/api';

type Section = 'account' | 'security' | 'store' | 'notifications' | 'appearance' | 'platform';

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

function AccountSection() {
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  if (!profile) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await updateMyProfile({ name: name.trim() || undefined, phone: phone.trim() || undefined });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card title="Profile">
        <div className="flex items-center gap-4 pb-2">
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
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
              <ShieldCheck className="size-3" /> {profile.role === 'super_admin' ? 'Platform Admin' : 'Store Admin'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4 pt-2 border-t border-gray-100">
          {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Display name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="Optional" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saved && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                <Check className="size-3.5" /> Saved
              </span>
            )}
          </div>
        </form>
      </Card>

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

function SecuritySection() {
  const { changePassword, providerHasPassword, sendPasswordReset, profile } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!providerHasPassword) {
    return (
      <Card title="Password" description="Your account signs in with Google, not a password.">
        <button
          onClick={async () => {
            setBusy(true);
            setError('');
            setSuccess('');
            try {
              await sendPasswordReset(profile!.email);
              setSuccess('Password setup email sent — check your inbox.');
            } catch (err: any) {
              setError(err.message || 'Failed to send email');
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
          className="self-start px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold disabled:opacity-50"
        >
          {busy ? 'Sending…' : 'Email me a link to set a password'}
        </button>
        {success && <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-lg">{success}</p>}
        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg">{error}</p>}
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (next.length < 7) {
      setError('New password must be at least 7 characters.');
      return;
    }
    if (next !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setSuccess('Password updated.');
    } catch (err: any) {
      setError(err.code === 'auth/wrong-password' ? 'Current password is incorrect.' : err.message || 'Failed to update password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Change password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg">{error}</p>}
        {success && <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-lg">{success}</p>}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Current password</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">New password</label>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm new password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="input" />
        </div>
        <button type="submit" disabled={busy} className="self-start px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-bold disabled:opacity-50">
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </Card>
  );
}

function StoreSection() {
  const { stores } = useStore();
  return (
    <div className="flex flex-col gap-6">
      <Card title="Your stores" description="Store details, hours, and images live on the dedicated Store Settings page.">
        <div className="flex flex-col gap-2">
          {stores.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border border-gray-100">
              <span className="text-sm font-semibold text-gray-900">{s.name}</span>
              <ApprovalBadge status={s.approvalStatus} />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
          <Link to="/store-settings" className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold">
            Manage store details
          </Link>
          <Link to="/admins" className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold">
            Manage store admins
          </Link>
        </div>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  const { profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!profile) return null;

  const toggle = async () => {
    setBusy(true);
    try {
      await updateMyProfile({ showApprovalBadges: !profile.showApprovalBadges });
      await refreshProfile();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Pending request badges" description="Shown next to Approvals and Applications in the sidebar.">
      <label className="flex items-center justify-between gap-4 cursor-pointer">
        <span className="text-sm text-gray-700">Show a count badge when there are stores, products, services, or applications awaiting your review</span>
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          aria-pressed={profile.showApprovalBadges}
          className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${profile.showApprovalBadges ? 'bg-primary' : 'bg-gray-300'}`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${profile.showApprovalBadges ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </button>
      </label>
    </Card>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  return (
    <Card title="Theme" description="Choose how StoreDash Admin looks on this device.">
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

function PlatformSection() {
  const links = [
    { to: '/approvals', label: 'Store, product & service approvals', icon: CheckSquare },
    { to: '/applications', label: 'Store-owner applications', icon: ClipboardList },
    { to: '/store-owners', label: 'Store owners', icon: Users },
  ];
  return (
    <Card title="Platform management" description="Quick links to the platform-wide review queues.">
      <div className="flex flex-col gap-2">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 text-sm font-semibold text-gray-800">
            <l.icon className="size-4 text-gray-400" />
            {l.label}
          </Link>
        ))}
      </div>
    </Card>
  );
}

export function SettingsPage() {
  const { profile } = useAuth();
  const { stores } = useStore();
  const [section, setSection] = useState<Section>('account');
  const isSuperAdmin = profile?.role === 'super_admin';

  const TABS: Array<{ key: Section; label: string; icon: typeof User }> = [
    { key: 'account', label: 'Account', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    ...(stores.length > 0 ? [{ key: 'store' as Section, label: 'Store', icon: StoreIcon }] : []),
    ...(isSuperAdmin ? [{ key: 'notifications' as Section, label: 'Notifications', icon: Bell }] : []),
    { key: 'appearance', label: 'Appearance', icon: Palette },
    ...(isSuperAdmin ? [{ key: 'platform' as Section, label: 'Platform', icon: ShieldCheck }] : []),
  ];

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 max-w-3xl">
      <div className="pb-4 border-b border-gray-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account, appearance, and preferences.</p>
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

      {section === 'account' && <AccountSection />}
      {section === 'security' && <SecuritySection />}
      {section === 'store' && <StoreSection />}
      {section === 'notifications' && <NotificationsSection />}
      {section === 'appearance' && <AppearanceSection />}
      {section === 'platform' && <PlatformSection />}
    </div>
  );
}
