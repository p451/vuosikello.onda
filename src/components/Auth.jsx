import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-surface/90 p-8 shadow-modal border border-border backdrop-blur-sm">
        <div>
          <h2 className="text-center text-h1 font-semibold text-primary mb-2 font-sans">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-lg bg-error/10 p-4 border border-error/20">
              <div className="text-sm text-error font-medium">{error}</div>
            </div>
          )}
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="relative block w-full appearance-none rounded-lg border border-border px-4 py-3 text-textPrimary placeholder-placeholder bg-white/80 backdrop-blur-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all sm:text-base font-sans"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="relative block w-full appearance-none rounded-lg border border-border px-4 py-3 text-textPrimary placeholder-placeholder bg-white/80 backdrop-blur-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all sm:text-base font-sans"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full rounded-full bg-primary text-white font-medium py-3 px-6 shadow-soft hover:bg-primaryHover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all text-button font-sans"
            >
              Sign in
            </button>
          </div>
        </form>
        <div className="text-center text-base font-sans mt-6">
          <span className="text-textSecondary">Don't have an account? </span>
          <Link to="/signup" className="font-medium text-primary hover:text-primaryHover transition-all text-button font-sans">
            Sign up here
          </Link>
        </div>
        <div className="text-center text-sm mt-8 pt-6 border-t border-border">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!resetEmail) {
                setResetMessage('Enter your email to reset password.');
                return;
              }
              const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: 'https://ondacalendar.netlify.app/reset-password'
              });
              setResetMessage(error ? error.message : 'Reset link sent! Check your email.');
            }}
          >
            <input
              type="email"
              className="mt-2 w-full border border-border rounded-lg px-4 py-3 text-textPrimary placeholder-placeholder bg-white/80 backdrop-blur-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all font-sans"
              placeholder="Enter your email for reset"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              required
            />
            <button type="submit" className="w-full mt-2 rounded-full bg-secondary text-white font-medium py-2 px-6 shadow-soft hover:bg-primaryHover focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-opacity-50 transition-all text-button font-sans">Send reset link</button>
            {resetMessage && <div className="mt-2 text-accent font-medium">{resetMessage}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}