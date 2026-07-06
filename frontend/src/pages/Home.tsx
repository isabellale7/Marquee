import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Movie } from '../api/client';

export function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 24px 48px' }}>
      <div style={{ marginBottom: 48 }}>
        <p style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 16 }}>
          Discover your next watch
        </p>
        <h1 style={{
          fontSize: 'clamp(32px,6vw,54px)',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          marginBottom: 16,
        }}>
          Movies that match<br /><span style={{ color: 'var(--accent)' }}>your taste.</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 480, lineHeight: 1.7 }}>
          Rate films you've seen. Get recommendations that actually fit — powered by genre similarity and collaborative filtering.
        </p>
      </div>

      <div style={{ position: 'relative', marginBottom: 20 }}>
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
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontSize: 16,
            padding: '16px 20px',
            borderRadius: 12,
            outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocusCapture={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlurCapture={e => (e.target.style.borderColor = 'var(--border)')}
        />
        {open && (
          <div role="listbox" style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12,
            maxHeight: 320, overflowY: 'auto', zIndex: 20,
            boxShadow: '0 16px 40px rgba(0,0,0,.5)',
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
                  borderRadius: i === activeIdx ? 8 : 0,
                }}
              >
                <span>{m.title}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 13, flexShrink: 0 }}>{m.year}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a href="/browse" style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          color: 'var(--text)', borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 500,
        }}>Browse all movies →</a>
        <a href="/join" style={{
          background: 'var(--accent)', color: '#fff',
          borderRadius: 10, padding: '11px 20px', fontSize: 14, fontWeight: 600,
        }}>Create a taste profile</a>
      </div>

      <div style={{ marginTop: 80, paddingTop: 48, borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.15em', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 28 }}>
          How it works
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 28 }}>
          {[
            { n: '01', title: 'Find a film', body: 'Search for any movie in our catalog of 9,700+ titles.' },
            { n: '02', title: 'Get similar picks', body: '"More like this" uses genre similarity. No account needed.' },
            { n: '03', title: 'Rate to unlock', body: 'Rate 3+ movies to unlock hybrid recommendations powered by collaborative filtering.' },
          ].map(step => (
            <div key={step.n}>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 8, letterSpacing: '0.1em' }}>{step.n}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{step.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
