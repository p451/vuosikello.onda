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
    <div className="flex min-h-screen items-center justify-center bg-sakura">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-surface p-6 shadow-soft">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-textPrimary">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
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
              className="relative block w-full appearance-none rounded-md border border-metal px-3 py-2 text-textPrimary placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
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
              className="relative block w-full appearance-none rounded-md border border-metal px-3 py-2 text-textPrimary placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Sign in
            </button>
          </div>
        </form>
        
        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <Link to="/signup" className="font-medium text-accentPink hover:text-accentPink/80">
            Sign up here
          </Link>
        </div>

        <div className="text-center text-sm mt-4">
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
              className="mt-2 w-full border rounded p-2"
              placeholder="Enter your email for reset"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="mt-2 w-full bg-blue-600 text-white py-2 rounded"
            >
              Send reset link
            </button>
            {resetMessage && <div className="text-blue-700 mt-2">{resetMessage}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}