const BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? 'https://marquee-api-adss.onrender.com' : 'http://localhost:8000');

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? res.statusText);
  }
  return res.json();
}

export interface Movie {
  id: number;
  title: string;
  year: number | null;
  genres: string[];
  tmdb_id: number | null;
  poster_url: string | null;
}

export interface MoviePage {
  items: Movie[];
  total: number;
  page: number;
  page_size: number;
}

export interface SimilarMovie extends Movie { similarity: number; }
export interface AudienceMovie extends Movie { fans_count: number; }

export interface User {
  id: number;
  display_name: string;
  created_at: string;
}

export interface RatingOut {
  movie_id: number;
  value: number;
  created_at: string;
  movie: Movie;
}

export interface RecommendedMovie extends Movie {
  score: number;
  reason: string;
}

export interface RecommendationsOut {
  mode: 'hybrid' | 'content' | 'insufficient';
  ratings_count: number;
  threshold: number;
  items: RecommendedMovie[];
}

export const api = {
  movies: {
    browse: (params: { search?: string; genre?: string; year_min?: number; year_max?: number; page?: number }) => {
      const q = new URLSearchParams();
      if (params.search) q.set('search', params.search);
      if (params.genre) q.set('genre', params.genre);
      if (params.year_min) q.set('year_min', String(params.year_min));
      if (params.year_max) q.set('year_max', String(params.year_max));
      if (params.page) q.set('page', String(params.page));
      return req<MoviePage>(`/movies?${q}`);
    },
    get: (id: number) => req<Movie>(`/movies/${id}`),
    similar: (id: number, topN = 10) => req<SimilarMovie[]>(`/movies/${id}/similar?top_n=${topN}`),
    audience: (id: number, topN = 10) => req<AudienceMovie[]>(`/movies/${id}/audience?top_n=${topN}`),
  },
  users: {
    create: (display_name: string) =>
      req<User>('/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_name }) }),
    get: (id: number) => req<User>(`/users/${id}`),
    ratings: (id: number) => req<RatingOut[]>(`/users/${id}/ratings`),
    rate: (userId: number, movie_id: number, value: number) =>
      req<RatingOut>(`/users/${userId}/ratings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ movie_id, value }) }),
    recommendations: (id: number) => req<RecommendationsOut>(`/users/${id}/recommendations`),
  },
};
