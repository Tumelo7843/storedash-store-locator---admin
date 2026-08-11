import { AlertTriangle, CheckCircle2, Mail, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormError, FormSuccess } from '../components/AuthCard';
import { Spinner } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../lib/authErrors';
import { updateMyProfile } from '../lib/api';
import { isValidEmail, passwordError } from '../lib/validation';

// Google/password/phone need different re-proof-of-identity flows for
// sensitive actions (change email, change password, delete account) — see
// AuthContext.reauthenticate. This resolves which one applies once, up front,
// so each section below can just call `ensureReauthed()`.
function useProvider() {
  const { firebaseUser } = useAuth();
  return firebaseUser?.providerData[0]?.providerId ?? null;
}

function ReauthGate({ onVerified }: { onVerified: () => void }) {
  const { reauthenticate } = useAuth();
  const provider = useProvider();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handlePasswordReauth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await reauthenticate(password);
      onVerified();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleReauth = async () => {
    setError('');
    setBusy(true);
    try {
      await reauthenticate();
      onVerified();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (provider === 'google.com') {
    return (
      <div className="flex flex-col gap-2">
        {error && <FormError message={error} />}
        <p className="text-xs text-gray-500">For your security, please re-verify with Google before continuing.</p>
        <button
          type="button"
          onClick={handleGoogleReauth}
          disabled={busy}
          className="self-start px-3.5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold disabled:opacity-50"
        >
          {busy ? 'Verifying…' : 'Verify with Google'}
        </button>
      </div>
    );
  }

  if (provider === 'phone') {
    return (
      <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
        For your security, please sign out and sign back in with your phone number, then return here to continue.
      </p>
    );
  }

  return (
    <form onSubmit={handlePasswordReauth} className="flex flex-col gap-2">
      {error && <FormError message={error} />}
      <p className="text-xs text-gray-500">For your security, confirm your current password to continue.</p>
      <div className="flex items-center gap-2">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Current password"
          autoComplete="current-password"
          className="input"
        />
        <button type="submit" disabled={busy} className="shrink-0 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold disabled:opacity-50">
          {busy ? 'Verifying…' : 'Verify'}
        </button>
      </div>
    </form>
  );
}

function ProfileInfoSection({ onSaved }: { onSaved: () => void }) {
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    if (!name.trim()) return setError('Name cannot be empty.');
    setSaving(true);
    try {
      await updateMyProfile({ name: name.trim(), phone: phone.trim() });
      setSaved(true);
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-gray-200 rounded-2xl p-5 flex flex-col gap-3">
      <h2 className="text-sm font-bold text-gray-900">Profile information</h2>
      {error && <FormError message={error} />}
      {saved && <FormSuccess message="Profile updated." />}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Phone number</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 82 123 4567" className="input" />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="self-start px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function EmailVerificationBanner() {
  const { firebaseUser, resendVerificationEmail } = useAuth();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  if (!firebaseUser || firebaseUser.emailVerified || !firebaseUser.email) return null;

  const handleResend = async () => {
    setError('');
    setSending(true);
    try {
      await resendVerificationEmail();
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-start gap-3">
      <Mail className="size-4 text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs font-bold text-gray-900">Verify your email</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {sent ? 'Verification email sent — check your inbox and spam folder.' : `We sent a verification link to ${firebaseUser.email} when you signed up.`}
        </p>
        {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
        {!sent && (
          <button onClick={handleResend} disabled={sending} className="mt-2 text-xs font-bold text-amber-400 hover:underline disabled:opacity-50">
            {sending ? 'Sending…' : 'Resend verification email'}
          </button>
        )}
      </div>
    </div>
  );
}

function ChangeEmailSection() {
  const { firebaseUser, changeEmail } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [needsReauth, setNeedsReauth] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const attempt = async () => {
    setError('');
    setSubmitting(true);
    try {
      await changeEmail(newEmail.trim());
      setSent(true);
      setNeedsReauth(false);
    } catch (err) {
      if ((err as { code?: string })?.code === 'auth/requires-recent-login') {
        setNeedsReauth(true);
      } else {
        setError(authErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(newEmail)) return setError('Please enter a valid email address.');
    if (newEmail.trim() === firebaseUser?.email) return setError('That is already your current email.');
    await attempt();
  };

  return (
    <div className="bg-surface border border-gray-200 rounded-2xl p-5 flex flex-col gap-3">
      <h2 className="text-sm font-bold text-gray-900">Change email</h2>
      <p className="text-xs text-gray-500 -mt-1">Current: {firebaseUser?.email}</p>
      {error && <FormError message={error} />}
      {sent ? (
        <FormSuccess message={`We sent a confirmation link to ${newEmail.trim()}. Your email changes once you click it.`} />
      ) : needsReauth ? (
        <ReauthGate onVerified={attempt} />
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new-email@example.com"
            className="input"
          />
          <button type="submit" disabled={submitting} className="shrink-0 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold disabled:opacity-50">
            {submitting ? 'Sending…' : 'Update'}
          </button>
        </form>
      )}
    </div>
  );
}

function ChangePasswordSection() {
  const { firebaseUser, changePassword, sendPasswordReset } = useAuth();
  const provider = useProvider();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [needsReauth, setNeedsReauth] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (provider !== 'password') {
    const handleSetPassword = async () => {
      setError('');
      setSuccess('');
      if (!firebaseUser?.email) return;
      try {
        await sendPasswordReset(firebaseUser.email);
        setSuccess(`We sent a link to ${firebaseUser.email} to set a password for this account.`);
      } catch (err) {
        setError(authErrorMessage(err));
      }
    };
    return (
      <div className="bg-surface border border-gray-200 rounded-2xl p-5 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-gray-900">Password</h2>
        <p className="text-xs text-gray-500">
          You sign in with {provider === 'google.com' ? 'Google' : 'your phone number'} — there's no password to change. You can add one so you
          can also sign in with email + password.
        </p>
        {error && <FormError message={error} />}
        {success && <FormSuccess message={success} />}
        <button onClick={handleSetPassword} className="self-start px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold">
          Email me a link to set a password
        </button>
      </div>
    );
  }

  const attempt = async () => {
    setError('');
    setSubmitting(true);
    try {
      await changePassword(newPassword);
      setSuccess('Password changed.');
      setNeedsReauth(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if ((err as { code?: string })?.code === 'auth/requires-recent-login') {
        setNeedsReauth(true);
      } else {
        setError(authErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const pwError = passwordError(newPassword);
    if (pwError) return setError(pwError);
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    await attempt();
  };

  return (
    <div className="bg-surface border border-gray-200 rounded-2xl p-5 flex flex-col gap-3">
      <h2 className="text-sm font-bold text-gray-900">Change password</h2>
      {error && <FormError message={error} />}
      {success && <FormSuccess message={success} />}
      {needsReauth ? (
        <ReauthGate onVerified={attempt} />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min. 7 characters)"
            autoComplete="new-password"
            className="input"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            className="input"
          />
          <button
            type="submit"
            disabled={submitting}
            className="self-start px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Change password'}
          </button>
        </form>
      )}
    </div>
  );
}

function DeleteAccountSection() {
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [needsReauth, setNeedsReauth] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const attempt = async () => {
    setError('');
    setBusy(true);
    try {
      await deleteAccount();
      navigate('/', { replace: true });
    } catch (err) {
      if ((err as { code?: string })?.code === 'auth/requires-recent-login') {
        setNeedsReauth(true);
      } else {
        setError(authErrorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 flex flex-col gap-3">
      <h2 className="text-sm font-bold text-rose-400 flex items-center gap-2">
        <AlertTriangle className="size-4" /> Delete account
      </h2>
      {!open ? (
        <>
          <p className="text-xs text-gray-500">
            Permanently delete your StoreDash account. This cannot be undone. Order history is kept for the store's records, but your name, email,
            and phone are removed from it.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="self-start flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
          >
            <Trash2 className="size-3.5" /> Delete my account
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {error && <FormError message={error} />}
          {needsReauth ? (
            <ReauthGate onVerified={attempt} />
          ) : (
            <>
              <p className="text-xs text-gray-500">
                This is permanent. Type <strong>DELETE</strong> to confirm.
              </p>
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" className="input" />
              <div className="flex items-center gap-2">
                <button
                  onClick={attempt}
                  disabled={confirmText !== 'DELETE' || busy}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-40"
                >
                  {busy ? 'Deleting…' : 'Permanently delete my account'}
                </button>
                <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold">
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ManageProfilePage() {
  const { profile, loading, refreshProfile } = useAuth();

  if (loading) return <Spinner />;
  if (!profile) return null;

  return (
    <div className="max-w-lg mx-auto w-full py-10 px-4 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" /> Manage Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">Update your details, change your password, or delete your account.</p>
      </div>

      <EmailVerificationBanner />
      <ProfileInfoSection onSaved={refreshProfile} />
      <ChangeEmailSection />
      <ChangePasswordSection />
      <DeleteAccountSection />

      <p className="text-[11px] text-gray-500 flex items-center gap-1.5 justify-center mt-2">
        <CheckCircle2 className="size-3.5" /> Sensitive changes require re-confirming your identity.
      </p>
    </div>
  );
}
