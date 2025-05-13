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

  return (    <div className="flex min-h-screen items-center justify-center bg-sakura bg-opacity-40">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-surface p-8 shadow-glass backdrop-blur-sm">
        <div>
          <h2 className="text-center text-3xl font-serif tracking-elegant text-textPrimary">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-error/10 p-4 border border-error/20">
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
              className="relative block w-full appearance-none rounded-md border border-metal px-3 py-2 text-textPrimary placeholder-placeholder bg-white/80 backdrop-blur-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all sm:text-sm"              placeholder="Email address"
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
              className="relative block w-full appearance-none rounded-md border border-metal px-3 py-2 text-textPrimary placeholder-placeholder bg-white/80 backdrop-blur-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md border border-primary bg-primary py-2 px-4 text-sm font-serif tracking-elegant text-white hover:bg-primaryHover transition-all shadow-soft hover:shadow-softHover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Sign in
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm font-sans">
          <span className="text-textSecondary">Don't have an account? </span>
          <Link to="/signup" className="font-medium text-primary hover:text-primaryHover transition-all">
            Sign up here
          </Link>
        </div>        <div className="text-center text-sm mt-8 pt-6 border-t border-metal">
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
              className="mt-2 w-full border border-metal rounded-md px-3 py-2 text-textPrimary placeholder-placeholder bg-white/80 backdrop-blur-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              placeholder="Enter your email for reset"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="mt-4 w-full bg-secondary text-textPrimary font-serif tracking-elegant py-2 rounded-md shadow-soft hover:shadow-softHover hover:bg-primary hover:text-white transition-all border border-metal"
            >
              Send reset link
            </button>
            {resetMessage && <div className="text-primary font-medium mt-2">{resetMessage}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}