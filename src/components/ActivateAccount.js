import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ActivateAccount() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace('#', '?'));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token });
      navigate('/reset-password');
    }
  }, [navigate]);

  return <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">Activating account...</div>;
}
