import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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

const UserPlanContext = createContext(null);

export function UserPlanProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(FREE_DEFAULT);
  const [loading, setLoading] = useState(true);
  const fetchedForUser = useRef(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setData(FREE_DEFAULT);
      setLoading(false);
      fetchedForUser.current = null;
      return;
    }
    if (fetchedForUser.current === userId) return;

    let cancelled = false;
    const fetchPlan = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) {
          if (!cancelled) setData(FREE_DEFAULT);
          return;
        }
        const res = await fetch(`${BACKEND_URL}/api/user/plan`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (res.ok) {
          setData(await res.json());
        } else {
          setData(FREE_DEFAULT);
        }
      } catch (e) {
        console.error('Error fetching user plan:', e);
        if (!cancelled) setData(FREE_DEFAULT);
      } finally {
        if (!cancelled) {
          setLoading(false);
          fetchedForUser.current = userId;
        }
      }
    };

    fetchPlan();
    return () => { cancelled = true; };
  }, [userId, authLoading]);

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
  }, []);

  const value = useMemo(
    () => ({ plan: data.plan, status: data.status, features, loading, canAccess, refresh }),
    [data.plan, data.status, features, loading, canAccess, refresh]
  );

  return (
    <UserPlanContext.Provider value={value}>
      {children}
    </UserPlanContext.Provider>
  );
}

export function useUserPlan() {
  const ctx = useContext(UserPlanContext);
  if (!ctx) throw new Error('useUserPlan must be used within UserPlanProvider');
  return ctx;
}
