import { useEffect, useState } from 'react';
import { UserProfile } from '../../../models/UserProfile';
import { Api } from '../../../config/api';

export function useProfile() {
  const [data, setData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const profile = await Api.getUserProfile();
        if (mounted) {
          setData(profile);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) {
          setError(e?.message || 'Failed to load profile');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}
