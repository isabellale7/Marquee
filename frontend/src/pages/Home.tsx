import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Movie } from '../api/client';
import { PosterPlaceholder } from '../components/PosterPlaceholder';

export function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [featured, setFeatured] = useState<Movie[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load a page of movies to use as hero posters
    api.movies.browse({ page: 3 }).then(p => setFeatured(p.items.slice(0, 6)));
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setOpen(false); return; }
    const t = setTimeout(() => {
      api.movies.browse({ search: query, page: 1 }).then(p => {
        setResults(p.items.slice(0, 8));
        setOpen(p.items.length > 0);
        setActiveIdx(-1);
      });
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const select = (m: Movie) => {
    setOpen(false);
    setQuery('');
    navigate(`/movies/${m.id}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    if (e.key === 'Enter' && activeIdx >= 0) select(results[activeIdx]);
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '72px 24px 64px', textAlign: 'center' }}>
        {/* Background poster collage */}
        {featured.length > 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, opacity: 0.12, filter: 'blur(1px)',
            transform: 'scale(1.05)',
            pointerEvents: 'none',
          }}>
            {featured.map(m => (
              <div key={m.id} style={{ flex: '0 0 120px', height: 180, borderRadius: 8, overflow: 'hidden' }}>
                {m.poster_url
                  ? <img src={m.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <PosterPlaceholder title={m.title} />
                }
              </div>
            ))}
          </div>
        )}
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, var(--bg) 0%, transparent 30%, transparent 70%, var(--bg) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <p style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 20 }}>
            Discover your next watch
          </p>
          <h1 style={{
            fontSize: 'clamp(36px,7vw,64px)',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: 20,
          }}>
            Movies that match<br /><span style={{ color: 'var(--accent)' }}>your taste.</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.7, marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
            Rate films you've seen. Get recommendations powered by genre similarity and collaborative filtering.
          </p>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 520, margin: '0 auto' }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onKey}
              onFocus={() => results.length > 0 && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              placeholder="Search 9,700+ movies…"
              aria-autocomplete="list"
              aria-expanded={open}
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: '1px solid rgba(108,99,255,0.3)',
                color: 'var(--text)',
                fontSize: 16,
                padding: '16px 20px',
                borderRadius: 14,
                outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocusCapture={e => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px rgba(108,99,255,0.15)';
              }}
              onBlurCapture={e => {
                e.target.style.borderColor = 'rgba(108,99,255,0.3)';
                e.target.style.boxShadow = 'none';
              }}
            />
            {open && (
              <div role="listbox" style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12,
                maxHeight: 320, overflowY: 'auto', zIndex: 20,
                boxShadow: '0 20px 60px rgba(0,0,0,.6)',
              }}>
                {results.map((m, i) => (
                  <div
                    key={m.id}
                    role="option"
                    aria-selected={i === activeIdx}
                    onMouseDown={() => select(m)}
                    onMouseEnter={() => setActiveIdx(i)}
                    style={{
                      padding: '11px 16px',
                      cursor: 'pointer',
                      fontSize: 14,
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      background: i === activeIdx ? 'rgba(108,99,255,0.12)' : 'transparent',
                    }}
                  >
                    <span>{m.title}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, flexShrink: 0 }}>{m.year}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            <Link to="/browse" style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text)', borderRadius: 10, padding: '11px 22px', fontSize: 14, fontWeight: 500,
            }}>Browse all movies</Link>
            <Link to="/join" style={{
              background: 'var(--accent)', color: '#fff',
              borderRadius: 10, padding: '11px 22px', fontSize: 14, fontWeight: 600,
            }}>Create a taste profile →</Link>
          </div>
        </div>
      </div>

      {/* Featured posters row */}
      {featured.length > 0 && (
        <div style={{ padding: '0 24px 56px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>From the catalog</h2>
            <Link to="/browse" style={{ fontSize: 13, color: 'var(--accent)' }}>Browse all →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 14 }}>
            {featured.map(m => (
              <Link key={m.id} to={`/movies/${m.id}`} style={{ display: 'block' }}>
                <div style={{
                  aspectRatio: '2/3', borderRadius: 10, overflow: 'hidden',
                  border: '1px solid var(--border)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(108,99,255,0.25)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  }}
                >
                  {m.poster_url
                    ? <img src={m.poster_url} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <PosterPlaceholder title={m.title} />
                  }
                </div>
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.year}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 72px', borderTop: '1px solid var(--border)', paddingTop: 48 }}>
        <p style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 28 }}>
          How it works
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 28 }}>
          {[
            { n: '01', title: 'Find a film', body: 'Search for any movie in our catalog of 9,700+ titles.' },
            { n: '02', title: 'Get similar picks', body: '"More like this" uses genre similarity. No account needed.' },
            { n: '03', title: 'Rate to unlock', body: 'Rate 3+ movies to unlock hybrid recommendations powered by collaborative filtering.' },
          ].map(step => (
            <div key={step.n} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 10, letterSpacing: '0.1em' }}>{step.n}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
