import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard, Divider, FormError, GoogleButton } from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../lib/authErrors';
import { isValidEmail, passwordError, passwordStrength } from '../lib/validation';

const STRENGTH_STYLES: Record<ReturnType<typeof passwordStrength>, { width: string; color: string; label: string }> = {
  weak: { width: 'w-1/3', color: 'bg-rose-500', label: 'Weak' },
  medium: { width: 'w-2/3', color: 'bg-amber-500', label: 'Medium' },
  strong: { width: 'w-full', color: 'bg-emerald-500', label: 'Strong' },
};

export function SignUpPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailInUse, setEmailInUse] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const strength = form.password ? passwordStrength(form.password) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailInUse(false);

    if (!form.name.trim()) return setError('Please enter your name.');
    if (!isValidEmail(form.email)) return setError('Please enter a valid email address.');
    const pwError = passwordError(form.password);
    if (pwError) return setError(pwError);
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      await signUpWithEmail({ name: form.name.trim(), email: form.email.trim(), password: form.password, phone: form.phone.trim() || undefined });
      navigate('/account', { replace: true });
    } catch (err) {
      // Firebase's own createUserWithEmailAndPassword is the duplicate-account
      // check — auth/email-already-in-use means it refused to create a second
      // account, not that ours failed to catch one. Give the user a way
      // forward instead of just an error string.
      if ((err as { code?: string })?.code === 'auth/email-already-in-use') {
        setEmailInUse(true);
      } else {
        setError(authErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      navigate('/account', { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Sign up to place orders and track them across every store."
      footer={
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/sign-in" className="font-bold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {error && <FormError message={error} />}
      {emailInUse && (
        <div className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2.5 flex flex-col gap-2 text-center">
          <span>An account with {form.email.trim()} already exists.</span>
          <div className="flex items-center justify-center gap-2">
            <Link to="/sign-in" className="px-3 py-1.5 rounded-lg bg-primary text-white font-bold">
              Sign in
            </Link>
            <Link to="/forgot-password" className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-900 font-bold">
              Reset password
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Full name *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Thandiwe Nkosi"
            autoComplete="name"
            required
            className="input"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="input"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Phone number (optional)</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+27 82 123 4567"
            autoComplete="tel"
            className="input"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Password *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 7 characters"
              autoComplete="new-password"
              required
              className="input pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.password && strength && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${STRENGTH_STYLES[strength].width} ${STRENGTH_STYLES[strength].color}`} />
              </div>
              <span className="text-[10px] font-bold text-gray-500 shrink-0">{STRENGTH_STYLES[strength].label}</span>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm password *</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            required
            className="input"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <Divider label="or" />
      <GoogleButton onClick={handleGoogle} disabled={googleSubmitting} label={googleSubmitting ? 'Signing up…' : 'Sign up with Google'} />

      <p className="text-center text-[11px] text-gray-500">
        Prefer a code by text?{' '}
        <Link to="/sign-in?method=phone" className="font-bold text-accent hover:underline">
          Continue with phone
        </Link>
      </p>
    </AuthCard>
  );
}
