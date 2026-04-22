import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const FREE_DEFAULT = {
  plan: 'free',
  status: 'active',
  features: {
    firms_allowed: ['apex_eod', 'topstep', 'ftmo'],
    modes: ['simple'],
    compare: false,
    export: false,
    post_pass: false,
    commissions: false,
    behavioral: false,
    save_configs: 0,
  },
};

export function useUserPlan() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(FREE_DEFAULT);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const lastUserId = useRef(null);

  useEffect(() => {
    // Don't fetch while auth is still loading
    if (authLoading) return;

    // No user = free plan, no fetch needed
    if (!user) {
      setData(FREE_DEFAULT);
      setLoading(false);
      hasFetched.current = false;
      lastUserId.current = null;
      return;
    }

    // Prevent duplicate fetches for the same user
    if (hasFetched.current && lastUserId.current === user.id) {
      return;
    }

    const fetchPlan = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (!token) {
          setData(FREE_DEFAULT);
          setLoading(false);
          return;
        }

        const res = await fetch(`${BACKEND_URL}/api/user/plan`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          // Auth error - don't retry, just use free
          console.warn('useUserPlan: 401 Unauthorized, using free plan');
          setData(FREE_DEFAULT);
        } else if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          // Other error - use free
          setData(FREE_DEFAULT);
        }
      } catch (e) {
        console.error('Error fetching user plan:', e);
        setData(FREE_DEFAULT);
      } finally {
        setLoading(false);
        hasFetched.current = true;
        lastUserId.current = user.id;
      }
    };

    fetchPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]); // Only depend on user.id, not the whole user object

  const canAccess = useCallback((feature) => {
    const f = data.features;
    if (feature === 'compare') return f.compare;
    if (feature === 'export') return f.export;
    if (feature === 'post_pass') return f.post_pass;
    if (feature === 'commissions') return f.commissions;
    if (feature === 'behavioral') return f.behavioral;
    if (feature === 'bootstrap') return f.modes?.includes('bootstrap');
    if (feature?.startsWith('firm:')) {
      const firmId = feature.slice(5);
      return f.firms_allowed === 'all' || f.firms_allowed?.includes(firmId);
    }
    return true;
  }, [data.features]);

  const refresh = useCallback(async () => {
    hasFetched.current = false;
    lastUserId.current = null;
    setLoading(true);
  }, []);

  return { plan: data.plan, status: data.status, features: data.features, loading, canAccess, refresh };
}
