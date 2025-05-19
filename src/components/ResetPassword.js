import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(''); // For accessibility hidden field

  const handleReset = async (e) => {
    e.preventDefault();
    // Supabase auth client will detect session from URL hash
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMessage(error.message);
    else {
      setMessage('Password updated! Please log in with your new password.');
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
      }, 1500);
    }
  };

  return (
    <form onSubmit={handleReset} className="max-w-md mx-auto mt-10 p-6 bg-surface rounded-lg shadow-card border border-border font-sans">
      <h2 className="text-h1 font-semibold mb-4 font-sans">Set a new password</h2>
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
        className="w-full border border-border rounded-lg p-2 mb-4 bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder focus:border-primary focus:ring-2 focus:ring-primary transition-all font-sans"
        required
        autoComplete="new-password"
      />
      <button type="submit" className="w-full rounded-full bg-primary text-white font-medium shadow-soft hover:bg-primaryHover transition-all border border-primary py-3 text-button font-sans">Set new password</button>
      {message && <div className="mt-4 text-accent font-medium">{message}</div>}
    </form>
  );
}
