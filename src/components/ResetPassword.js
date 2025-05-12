import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.hash.replace('#', '?'));
    const access_token = params.get('access_token');
    if (!access_token) {
      setMessage('Invalid or missing token');
      return;
    }
    const { error } = await supabase.auth.updateUser(
      { password },
      { accessToken: access_token }
    );
    if (error) setMessage(error.message);
    else setMessage('Password updated! You can now log in.');
  };

  return (
    <form onSubmit={handleReset} className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Set a new password</h2>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full border rounded p-2 mb-4"
        required
      />
      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">Set new password</button>
      {message && <div className="mt-4 text-blue-700">{message}</div>}
    </form>
  );
}
