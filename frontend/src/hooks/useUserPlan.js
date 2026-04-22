import { useState, useEffect, useCallback } from 'react';
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
  const { user } = useAuth();
  const [data, setData] = useState(FREE_DEFAULT);
  const [loading, setLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    if (!user) {
      setData(FREE_DEFAULT);
      setLoading(false);
      return;
    }
    
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) {
        setData(FREE_DEFAULT);
        setLoading(false);
        return;
      }
      
      const res = await fetch(`${BACKEND_URL}/api/user/plan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        setData(FREE_DEFAULT);
      } else {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Error fetching user plan:', e);
      setData(FREE_DEFAULT);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

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
  }, [data]);

  return { plan: data.plan, status: data.status, features: data.features, loading, canAccess, refresh: fetchPlan };
}
