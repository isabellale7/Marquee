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
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(108,99,255,0.5)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(108,99,255,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Link to={`/movies/${movie.id}`} style={{ display: 'block', position: 'relative' }}>
        <div style={{ aspectRatio: '2/3', background: 'var(--surface-2)', overflow: 'hidden' }}>
          {movie.poster_url
            ? <img src={movie.poster_url} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <PosterPlaceholder title={movie.title} />
          }
        </div>
        {badge && (
          <span style={{
            position: 'absolute', top: 8, left: 8,
            background: badgeColor ?? 'var(--accent)',
            color: '#fff',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '3px 7px', borderRadius: 4,
          }}>{badge}</span>
        )}
      </Link>
      <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Link to={`/movies/${movie.id}`}>
          <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, color: 'var(--text)' }}>
            {movie.title}
          </div>
        </Link>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {movie.year ?? '—'} · {movie.genres.slice(0, 2).join(', ')}
        </div>
        {onRate !== undefined && (
          <div style={{ marginTop: 'auto', paddingTop: 6 }}>
            <StarRating value={userRating ?? null} onChange={v => onRate(movie.id, v)} size={14} />
          </div>
        )}
      </div>
    </div>
  );
}
