import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authErrorMessage } from '../lib/authErrors';
import { isValidEmail } from '../lib/validation';

export function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md p-8 flex flex-col items-center gap-5">
        <div className="size-16 rounded-full bg-blue-50 text-primary flex items-center justify-center">
          <ShieldCheck className="size-8" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-extrabold text-gray-900">Reset your password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email and we'll send a reset link. This also works to add a password to an account you created with Google.
          </p>
        </div>

        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg px-3 py-2 w-full text-center">{error}</p>}

        {sent ? (
          <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2.5 w-full text-center">
            If an account exists for {email}, a password reset link is on its way. Check your inbox and spam folder.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus className="input" />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <Link to="/login" className="text-xs font-bold text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
