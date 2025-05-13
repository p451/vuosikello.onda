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
    <div className="flex min-h-screen items-center justify-center bg-sakura">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-surface p-6 shadow-soft">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-textPrimary">
            Create a new account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="organization-name" className="block text-sm font-medium text-gray-700">
                Organization Name
              </label>
              <input
                id="organization-name"
                name="organization"
                type="text"
                required
                className="mt-1 block w-full rounded-md border border-metal px-3 py-2 shadow-sm focus:border-accentPink focus:outline-none focus:ring-accentPink"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <div className="w-1/2">
                <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                  First name
                </label>
                <input
                  id="first-name"
                  name="first-name"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-metal px-3 py-2 shadow-sm focus:border-accentPink focus:outline-none focus:ring-accentPink"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                />
              </div>
              <div className="w-1/2">
                <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
                  Last name
                </label>
                <input
                  id="last-name"
                  name="last-name"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-metal px-3 py-2 shadow-sm focus:border-accentPink focus:outline-none focus:ring-accentPink"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="mt-1 block w-full rounded-md border border-metal px-3 py-2 shadow-sm focus:border-accentPink focus:outline-none focus:ring-accentPink"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border border-metal px-3 py-2 shadow-sm focus:border-accentPink focus:outline-none focus:ring-accentPink"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-md border border-metal px-3 py-2 shadow-sm focus:border-accentPink focus:outline-none focus:ring-accentPink"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div className="rounded-md bg-blue-50 p-4">
              <div className="text-sm text-blue-700">{message}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-accentPink px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-accentPink focus:ring-offset-2"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}