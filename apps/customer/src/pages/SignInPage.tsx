import { ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { AuthCard, Divider, FormError, GoogleButton } from '../components/AuthCard';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../lib/authErrors';
import { auth } from '../lib/firebase';
import { env } from '../lib/env';

type Method = 'email' | 'phone';

function EmailSignIn() {
  const { signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
      navigate('/account', { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      {error && <FormError message={error} />}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className="input" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-gray-700">Password</label>
          <Link to="/forgot-password" className="text-xs font-bold text-accent hover:underline">
            Forgot password?
          </Link>
        </div>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className="input" />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

function PhoneSignIn() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
    };
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\+\d{8,15}$/.test(phone.trim())) {
      setError('Enter your phone number in international format, e.g. +27821234567.');
      return;
    }
    setSubmitting(true);
    try {
      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const result = await signInWithPhoneNumber(auth, phone.trim(), verifierRef.current);
      setConfirmation(result);
    } catch (err) {
      setError(authErrorMessage(err));
      verifierRef.current?.clear();
      verifierRef.current = null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmation) return;
    setError('');
    setSubmitting(true);
    try {
      await confirmation.confirm(code.trim());
      navigate('/account', { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <form onSubmit={handleVerifyCode} className="flex flex-col gap-3.5">
        {error && <FormError message={error} />}
        <p className="text-xs text-gray-500 text-center">Enter the 6-digit code we texted to {phone}.</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          className="input text-center tracking-[0.5em] text-lg"
        />
        <button
          type="submit"
          disabled={submitting}
          className="py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Verifying…' : 'Verify & continue'}
        </button>
        <button type="button" onClick={() => setConfirmation(null)} className="text-xs font-bold text-gray-500 hover:text-gray-800">
          Use a different number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendCode} className="flex flex-col gap-3.5">
      {error && <FormError message={error} />}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">Phone number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+27 82 123 4567"
          autoComplete="tel"
          required
          className="input"
        />
        <p className="text-[11px] text-gray-500 mt-1">Use international format, starting with +27 for South Africa.</p>
      </div>
      <div id="recaptcha-container" />
      <button
        type="submit"
        disabled={submitting}
        className="py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Sending code…' : 'Send verification code'}
      </button>
    </form>
  );
}

export function SignInPage() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const method: Method = searchParams.get('method') === 'phone' ? 'phone' : 'email';
  const [error, setError] = useState('');
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const setMethod = (m: Method) => setSearchParams(m === 'email' ? {} : { method: m });

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
      title="Sign in to StoreDash"
      subtitle="Welcome back — sign in to order and track your purchases."
      footer={
        <div className="flex flex-col items-center gap-3">
          <p className="text-center text-sm text-gray-500">
            New here?{' '}
            <Link to="/sign-up" className="font-bold text-accent hover:underline">
              Create an account
            </Link>
          </p>
          {env.adminUrl && (
            <a
              href={env.adminUrl}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 border border-gray-200 rounded-full px-3.5 py-1.5"
            >
              <ShieldCheck className="size-3.5" /> Store owner or admin? Sign in here
            </a>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl">
        <button
          type="button"
          onClick={() => setMethod('email')}
          className={`py-2 rounded-lg text-xs font-bold transition-colors ${method === 'email' ? 'bg-surface text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setMethod('phone')}
          className={`py-2 rounded-lg text-xs font-bold transition-colors ${method === 'phone' ? 'bg-surface text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Phone
        </button>
      </div>

      {error && <FormError message={error} />}

      {method === 'email' ? <EmailSignIn /> : <PhoneSignIn />}

      <Divider label="or" />
      <GoogleButton onClick={handleGoogle} disabled={googleSubmitting} label={googleSubmitting ? 'Signing in…' : 'Continue with Google'} />
    </AuthCard>
  );
}
