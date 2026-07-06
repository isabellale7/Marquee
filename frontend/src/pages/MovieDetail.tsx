import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Movie, SimilarMovie, AudienceMovie } from '../api/client';
import { MovieCard } from '../components/MovieCard';
import { StarRating } from '../components/StarRating';
import { PosterPlaceholder } from '../components/PosterPlaceholder';
import { Skeleton } from '../components/Skeleton';

interface Props {
  onRate?: (movieId: number, value: number) => void;
  getRating?: (movieId: number) => number | null;
  userId?: number | null;
}

export function MovieDetail({ onRate, getRating, userId }: Props) {
  const { id } = useParams<{ id: string }>();
  const movieId = parseInt(id ?? '0');

  const [movie, setMovie] = useState<Movie | null>(null);
  const [similar, setSimilar] = useState<SimilarMovie[]>([]);
  const [audience, setAudience] = useState<AudienceMovie[]>([]);
  const [ratingPending, setRatingPending] = useState(false);
  const [ratingMsg, setRatingMsg] = useState('');

  useEffect(() => {
    setMovie(null); setSimilar([]); setAudience([]);
    Promise.all([
      api.movies.get(movieId),
      api.movies.similar(movieId),
      api.movies.audience(movieId),
    ]).then(([m, s, a]) => {
      setMovie(m); setSimilar(s); setAudience(a);
      document.title = `${m.title} — Marquee`;
    });
    return () => { document.title = 'Marquee'; };
  }, [movieId]);

  const handleRate = async (mId: number, value: number) => {
    if (!onRate) return;
    setRatingPending(true);
    setRatingMsg('');
    try {
      await onRate(mId, value);
      setRatingMsg('Rating saved!');
      setTimeout(() => setRatingMsg(''), 2000);
    } finally {
      setRatingPending(false);
    }
  };

  if (!movie) return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <Skeleton width={120} height={12} style={{ marginBottom: 24 }} />
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <Skeleton width={200} height={300} borderRadius={8} style={{ flex: '0 0 200px' }} />
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton height={12} width={120} />
          <Skeleton height={48} width="70%" />
          <div style={{ display: 'flex', gap: 8 }}>
            {[80, 60, 70].map((w, i) => <Skeleton key={i} height={28} width={w} borderRadius={4} />)}
          </div>
        </div>
      </div>
    </div>
  );

  const myRating = getRating ? getRating(movieId) : null;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      {/* Back */}
      <Link to="/browse" style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
        ← BACK TO BROWSE
      </Link>

      {/* Hero */}
      <div style={{ display: 'flex', gap: 32, marginTop: 24, marginBottom: 48, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 200px', height: 300, borderRadius: 8, overflow: 'hidden', background: 'var(--surface-2)' }}>
          {movie.poster_url
            ? <img src={movie.poster_url} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <PosterPlaceholder title={movie.title} size="lg" />
          }
        </div>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 10 }}>
            {movie.year ?? '—'} · {movie.genres.join(' · ')}
          </div>
          <h1 style={{ fontWeight: 700, fontSize: 'clamp(24px,5vw,42px)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 20 }}>
            {movie.title}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {movie.genres.map(g => (
              <Link key={g} to={`/browse?genre=${encodeURIComponent(g)}`}>
                <span style={{
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: 20, padding: '4px 12px', fontSize: 12,
                  letterSpacing: '0.05em',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                  {g}
                </span>
              </Link>
            ))}
          </div>

          {/* Rating section */}
          {userId ? (
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Your rating
              </p>
              <StarRating value={myRating} onChange={v => handleRate(movieId, v)} size={28} />
              {ratingMsg && <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 8, fontFamily: "'JetBrains Mono', monospace" }}>{ratingMsg}</p>}
              {ratingPending && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Saving…</p>}
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, maxWidth: 320 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
                <Link to="/join" style={{ color: 'var(--accent)' }}>Create a free profile</Link> to rate this movie and get personalized recommendations.
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>No email or password needed.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations sections */}
      <RecsSection
        title="More Like This"
        subtitle="Content-based · genre & theme similarity"
        badgeColor="var(--accent)"
        badge="SIMILAR"
        empty="No similar movies found."
      >
        {similar.map(m => (
          <MovieCard key={m.id} movie={m} badge="SIMILAR" badgeColor="var(--accent)"
            userRating={getRating ? getRating(m.id) : undefined} onRate={onRate} />
        ))}
      </RecsSection>

      <RecsSection
        title="Audience Also Loved"
        subtitle="Collaborative · what fans of this movie rated highly"
        badgeColor="var(--accent-2)"
        badge="AUDIENCE"
        empty="Not enough rating data for this movie."
      >
        {audience.map(m => (
          <MovieCard key={m.id} movie={m} badge="AUDIENCE" badgeColor="var(--accent-2)"
            userRating={getRating ? getRating(m.id) : undefined} onRate={onRate} />
        ))}
      </RecsSection>
    </div>
  );
}

function RecsSection({ title, subtitle, badge, badgeColor, empty, children }: {
  title: string; subtitle: string; badge: string; badgeColor: string; empty: string; children: React.ReactNode[];
}) {
  return (
    <div style={{ marginBottom: 56 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, fontSize: 'clamp(18px,3vw,24px)', letterSpacing: '-0.01em' }}>
          {title}
        </h2>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</span>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: badgeColor, display: 'inline-block' }} />
        <span style={{ fontSize: 10, letterSpacing: '0.1em', color: badgeColor }}>{badge}</span>
      </div>
      {children.length === 0
        ? <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{empty}</p>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16 }}>{children}</div>
      }
    </div>
  );
}
