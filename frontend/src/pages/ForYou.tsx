import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { RecommendationsOut, RatingOut } from '../api/client';
import { MovieCard } from '../components/MovieCard';

interface Props {
  userId: number | null;
  ratings: RatingOut[];
  onRate?: (movieId: number, value: number) => void;
  getRating?: (movieId: number) => number | null;
}

export function ForYou({ userId, ratings, onRate, getRating }: Props) {
  const [data, setData] = useState<RecommendationsOut | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.users.recommendations(userId).then(setData).finally(() => setLoading(false));
  }, [userId, ratings.length]);

  if (!userId) {
    return (
      <div style={{ maxWidth: 540, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 28, textTransform: 'uppercase', marginBottom: 16 }}>
          No profile yet
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
          Create a taste profile to get personalized recommendations.
        </p>
        <Link to="/join" style={{
          display: 'inline-block', background: 'var(--accent)', color: 'var(--bg)',
          borderRadius: 6, padding: '12px 24px', fontSize: 14, fontWeight: 600,
        }}>Get started →</Link>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 48, color: 'var(--text-muted)' }}>Loading recommendations…</div>;

  const mode = data?.mode;
  const threshold = data?.threshold ?? 3;
  const count = data?.ratings_count ?? 0;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
          {mode === 'hybrid' ? 'Hybrid · content + collaborative' : mode === 'content' ? 'Content-based · genre similarity' : 'Building your profile'}
        </p>
        <h1 style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 'clamp(28px,4vw,42px)', textTransform: 'uppercase', letterSpacing: '0.01em' }}>
          Recommended for You
        </h1>
      </div>

      {mode === 'insufficient' && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 32, maxWidth: 520,
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎬</div>
          <h2 style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 22, textTransform: 'uppercase', marginBottom: 12 }}>
            Rate {threshold - count} more movie{threshold - count !== 1 ? 's' : ''} to unlock picks
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            You've rated <strong style={{ color: 'var(--text)' }}>{count}</strong> movie{count !== 1 ? 's' : ''} so far.
            Once you hit {threshold}, we'll blend your ratings with what audiences like you loved.
          </p>
          <Link to="/browse" style={{
            display: 'inline-block', background: 'var(--accent)', color: 'var(--bg)',
            borderRadius: 6, padding: '10px 20px', fontSize: 14, fontWeight: 600,
          }}>Browse movies to rate →</Link>
        </div>
      )}

      {(mode === 'content' || mode === 'hybrid') && data && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
            padding: '10px 16px', background: 'var(--surface)', borderRadius: 8,
            border: '1px solid var(--border)', maxWidth: 520, fontSize: 13,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: mode === 'hybrid' ? 'var(--accent-2)' : 'var(--accent)', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-muted)' }}>
              {mode === 'hybrid'
                ? `Hybrid recommendations — your ${count} ratings blended with collaborative signals from similar audiences.`
                : `Content-based recommendations from your ${count} rated movies. Rate ${threshold - count} more to unlock hybrid picks.`
              }
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
            {data.items.map(m => (
              <MovieCard
                key={m.id} movie={m}
                badge={mode === 'hybrid' ? 'HYBRID' : 'SIMILAR'}
                badgeColor={mode === 'hybrid' ? 'var(--accent-2)' : 'var(--accent)'}
                userRating={getRating ? getRating(m.id) : undefined}
                onRate={onRate}
              />
            ))}
          </div>
        </>
      )}

      {/* Recent ratings */}
      {ratings.length > 0 && (
        <div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 22, textTransform: 'uppercase', marginBottom: 20 }}>
            Your Ratings
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
            {ratings.slice(0, 12).map(r => (
              <MovieCard key={r.movie_id} movie={r.movie} userRating={r.value} onRate={onRate} />
            ))}
          </div>
          {ratings.length > 12 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 16, fontFamily: "'JetBrains Mono', monospace" }}>
              + {ratings.length - 12} more rated movies
            </p>
          )}
        </div>
      )}
    </div>
  );
}
