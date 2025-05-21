import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [message, setMessage] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // First create a new tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([{ name: tenantName }])
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Sign up the user
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            tenant_id: tenant.id,
            first_name: firstName,
            last_name: lastName,
            phone: phone
          }
        }
      });

      if (signUpError) throw signUpError;

      // Create initial admin role for the user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: user.id,
          tenant_id: tenant.id,
          role: 'admin'  // First user is always admin
        }]);

      if (roleError) throw roleError;
      
      setMessage('Check your email for the confirmation link.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-surface p-6 shadow-card border border-border font-sans">
        <div>
          <h2 className="text-center text-h1 font-semibold text-textPrimary font-sans">
            Create a new account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="organization-name" className="block text-sm font-medium text-textSecondary font-sans">
                Organization Name
              </label>
              <input
                id="organization-name"
                name="organization"
                type="text"
                required
                className="mt-1 block w-full rounded-lg border border-border px-3 py-2 bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder shadow-card focus:border-primary focus:ring-2 focus:ring-primary transition-all font-sans"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="w-1/2">
                <label htmlFor="first-name" className="block text-sm font-medium text-textSecondary font-sans">
                  First name
                </label>
                <input
                  id="first-name"
                  name="first-name"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-2 bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder shadow-card focus:border-primary focus:ring-2 focus:ring-primary transition-all font-sans"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                />
              </div>
              <div className="w-1/2">
                <label htmlFor="last-name" className="block text-sm font-medium text-textSecondary font-sans">
                  Last name
                </label>
                <input
                  id="last-name"
                  name="last-name"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-border px-3 py-2 bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder shadow-card focus:border-primary focus:ring-2 focus:ring-primary transition-all font-sans"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-textSecondary font-sans">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-lg border border-border px-3 py-2 bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder shadow-card focus:border-primary focus:ring-2 focus:ring-primary transition-all font-sans"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-textSecondary font-sans">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="mt-1 block w-full rounded-lg border border-border px-3 py-2 bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder shadow-card focus:border-primary focus:ring-2 focus:ring-primary transition-all font-sans"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-textSecondary font-sans">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 block w-full rounded-lg border border-border px-3 py-2 bg-white/80 backdrop-blur-sm text-textPrimary placeholder-placeholder shadow-card focus:border-primary focus:ring-2 focus:ring-primary transition-all font-sans"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-primary text-white font-medium py-3 px-6 shadow-soft hover:bg-primaryHover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all text-button font-sans"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
          {message && <div className="mt-4 text-accent font-medium">{message}</div>}
        </form>
      </div>
    </div>
  );
}