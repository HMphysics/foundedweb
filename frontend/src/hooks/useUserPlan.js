import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  const fetchedForUser = useRef(null);

  // Extract userId as a stable primitive
  const userId = user?.id ?? null;

  const fetchPlan = useCallback(async () => {
    if (!userId) {
      setData(FREE_DEFAULT);
      setLoading(false);
      return;
    }

    // Already fetched for this user
    if (fetchedForUser.current === userId) {
      return;
    }

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
        console.warn('useUserPlan: 401 Unauthorized, using free plan');
        setData(FREE_DEFAULT);
      } else if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(FREE_DEFAULT);
      }
    } catch (e) {
      console.error('Error fetching user plan:', e);
      setData(FREE_DEFAULT);
    } finally {
      setLoading(false);
      fetchedForUser.current = userId;
    }
  }, [userId]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Reset if user logged out
    if (!userId) {
      setData(FREE_DEFAULT);
      setLoading(false);
      fetchedForUser.current = null;
      return;
    }

    // Only fetch if we haven't fetched for this user yet
    if (fetchedForUser.current !== userId) {
      fetchPlan();
    }
  }, [userId, authLoading, fetchPlan]);

  // Memoize features to prevent unnecessary re-renders
  const features = useMemo(() => data.features, [data.features]);

  const canAccess = useCallback((feature) => {
    const f = features;
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
  }, [features]);

  const refresh = useCallback(() => {
    fetchedForUser.current = null;
    setLoading(true);
    fetchPlan();
  }, [fetchPlan]);

  return { plan: data.plan, status: data.status, features, loading, canAccess, refresh };
}
