import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(''); // For accessibility hidden field

  const handleReset = async (e) => {
    e.preventDefault();
    let access_token = null;
    let refresh_token = null;
    // 1. Yritä hash-parametreista
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    access_token = hashParams.get('access_token');
    refresh_token = hashParams.get('refresh_token');
    // 2. Jos ei löydy, kokeile query-parametreista
    if (!access_token) {
      const searchParams = new URLSearchParams(window.location.search);
      access_token = searchParams.get('access_token');
      refresh_token = searchParams.get('refresh_token');
    }
    if (!access_token) {
      setMessage('Invalid or missing token');
      return;
    }
    const { error } = await supabase.auth.updateUser(
      { password },
      refresh_token ? { accessToken: access_token, refreshToken: refresh_token } : { accessToken: access_token }
    );
    if (error) setMessage(error.message);
    else setMessage('Password updated! You can now log in.');
  };

  return (
    <form onSubmit={handleReset} className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Set a new password</h2>
      {/* Hidden email field for accessibility and autofill */}
      <input
        type="email"
        name="email"
        autoComplete="username"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ display: 'none' }}
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full border rounded p-2 mb-4"
        required
        autoComplete="new-password"
      />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Set new password</button>
      {message && <div className="mt-4 text-blue-700">{message}</div>}
    </form>
  );
}
