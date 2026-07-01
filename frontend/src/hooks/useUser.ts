import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { User, RatingOut } from '../api/client';

const STORAGE_KEY = 'marquee_user_id';

export function useUser() {
  const [userId, setUserId] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
  });
  const [user, setUser] = useState<User | null>(null);
  const [ratings, setRatings] = useState<RatingOut[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([api.users.get(userId), api.users.ratings(userId)])
      .then(([u, r]) => { setUser(u); setRatings(r); })
      .catch(() => {
        // Profile not found (cleared DB etc) — clear localStorage
        localStorage.removeItem(STORAGE_KEY);
        setUserId(null);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const createProfile = async (name: string) => {
    const u = await api.users.create(name);
    localStorage.setItem(STORAGE_KEY, String(u.id));
    setUserId(u.id);
    setUser(u);
    setRatings([]);
    return u;
  };

  const rateMovie = async (movieId: number, value: number) => {
    if (!userId) throw new Error('No profile');
    const r = await api.users.rate(userId, movieId, value);
    setRatings(prev => {
      const idx = prev.findIndex(x => x.movie_id === movieId);
      if (idx >= 0) { const next = [...prev]; next[idx] = r; return next; }
      return [r, ...prev];
    });
    return r;
  };

  const getRating = (movieId: number) =>
    ratings.find(r => r.movie_id === movieId)?.value ?? null;

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserId(null);
    setUser(null);
    setRatings([]);
  };

  return { user, userId, ratings, loading, createProfile, rateMovie, getRating, logout };
}
