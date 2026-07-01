import { Link } from 'react-router-dom';
import type { Movie } from '../api/client';
import { StarRating } from './StarRating';
import { PosterPlaceholder } from './PosterPlaceholder';

interface Props {
  movie: Movie;
  badge?: string;
  badgeColor?: string;
  userRating?: number | null;
  onRate?: (movieId: number, value: number) => void;
}

export function MovieCard({ movie, badge, badgeColor, userRating, onRate }: Props) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,163,61,0.4)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <Link to={`/movies/${movie.id}`} style={{ display: 'block' }}>
        <div style={{ aspectRatio: '2/3', background: 'var(--surface-2)', overflow: 'hidden' }}>
          {movie.poster_url
            ? <img src={movie.poster_url} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <PosterPlaceholder title={movie.title} />
          }
        </div>
      </Link>
      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {badge && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: badgeColor ?? 'var(--accent)',
            marginBottom: 2,
          }}>{badge}</span>
        )}
        <Link to={`/movies/${movie.id}`}>
          <div style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 15, lineHeight: 1.1, textTransform: 'uppercase' }}>
            {movie.title}
          </div>
        </Link>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          {movie.year ?? '—'} · {movie.genres.slice(0, 2).join(', ')}
        </div>
        {onRate !== undefined && (
          <div style={{ marginTop: 'auto', paddingTop: 8 }}>
            <StarRating value={userRating ?? null} onChange={v => onRate(movie.id, v)} size={16} />
          </div>
        )}
      </div>
    </div>
  );
}
