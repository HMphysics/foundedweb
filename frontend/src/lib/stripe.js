import { supabase } from './supabase';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export async function startCheckout(planType) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  
  if (!token) {
    alert('You must be logged in');
    return;
  }
  
  const res = await fetch(`${BACKEND_URL}/api/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan_type: planType }),
  });
  
  if (!res.ok) {
    const err = await res.json();
    alert('Error: ' + (err.detail || 'Could not start checkout'));
    return;
  }
  
  const { url } = await res.json();
  window.location.href = url;
}

export async function openCustomerPortal() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  
  if (!token) return;
  
  const res = await fetch(`${BACKEND_URL}/api/portal`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
    alert('Error opening portal');
    return;
  }
  
  const { url } = await res.json();
  window.location.href = url;
}
