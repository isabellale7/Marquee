import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { MoviePage } from '../api/client';
import { MovieCard } from '../components/MovieCard';
import { MovieCardSkeleton } from '../components/Skeleton';

const GENRES = ['Action','Adventure','Animation','Children','Comedy','Crime','Documentary','Drama','Fantasy','Film-Noir','Horror','IMAX','Musical','Mystery','Romance','Sci-Fi','Thriller','War','Western'];

interface Props {
  onRate?: (movieId: number, value: number) => void;
  getRating?: (movieId: number) => number | null;
}

export function Browse({ onRate, getRating }: Props) {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState(searchParams.get('genre') ?? '');
  const [yearMin, setYearMin] = useState('');
  const [yearMax, setYearMax] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MoviePage | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.movies.browse({
      search: search || undefined,
      genre: genre || undefined,
      year_min: yearMin ? parseInt(yearMin) : undefined,
      year_max: yearMax ? parseInt(yearMax) : undefined,
      page,
    }).then(setData).finally(() => setLoading(false));
  }, [search, genre, yearMin, yearMax, page]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 on filter change
  const setFilter = (fn: () => void) => { fn(); setPage(1); };

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--accent)', letterSpacing: '0.15em', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>
          Catalog
        </p>
        <h1 style={{ fontFamily: "'Anton', sans-serif", fontWeight: 400, fontSize: 'clamp(28px,4vw,42px)', textTransform: 'uppercase', letterSpacing: '0.01em' }}>
          Browse Movies
        </h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 32, alignItems: 'end' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Search</label>
          <input
            value={search}
            onChange={e => setFilter(() => setSearch(e.target.value))}
            placeholder="Title…"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Genre</label>
          <select value={genre} onChange={e => setFilter(() => setGenre(e.target.value))} style={inputStyle}>
            <option value="">All genres</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Year from</label>
          <input value={yearMin} onChange={e => setFilter(() => setYearMin(e.target.value))} placeholder="1900" type="number" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Year to</label>
          <input value={yearMax} onChange={e => setFilter(() => setYearMax(e.target.value))} placeholder="2025" type="number" style={inputStyle} />
        </div>
      </div>

      {/* Results count */}
      {data && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, fontFamily: "'JetBrains Mono', monospace" }}>
          {data.total.toLocaleString()} movies · page {data.page} of {totalPages}
        </p>
      )}

      {/* Grid */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
          {Array.from({ length: 20 }).map((_, i) => <MovieCardSkeleton key={i} />)}
        </div>
      )}
      {!loading && data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
            {data.items.map(m => (
              <MovieCard
                key={m.id}
                movie={m}
                userRating={getRating ? getRating(m.id) : undefined}
                onRate={onRate}
              />
            ))}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
              <PageBtn disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</PageBtn>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = page <= 4 ? i + 1 : page - 3 + i;
                if (p < 1 || p > totalPages) return null;
                return <PageBtn key={p} active={p === page} onClick={() => setPage(p)}>{p}</PageBtn>;
              })}
              <PageBtn disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</PageBtn>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PageBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: active ? 'var(--accent)' : 'var(--surface)',
      color: active ? 'var(--bg)' : 'var(--text)',
      border: '1px solid var(--border)',
      borderRadius: 6, padding: '6px 14px', fontSize: 13,
      opacity: disabled ? 0.4 : 1,
      cursor: disabled ? 'default' : 'pointer',
    }}>{children}</button>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--text-muted)', display: 'block', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface)',
  border: '1px solid var(--border)', color: 'var(--text)',
  fontSize: 14, padding: '10px 14px', borderRadius: 6, outline: 'none',
};
