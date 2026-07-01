# Marquee — Movie Recommendation App

A full-stack movie recommendation web app built as a portfolio project. Tell it a movie you like (or build up a rating history), and it recommends what to watch next using a hybrid of content-based and collaborative filtering.

**Live demo:** _(deploy link goes here)_

---

## What it does

- **Browse & search** 9,700+ real movies from the [MovieLens ml-latest-small](https://grouplens.org/datasets/movielens/) dataset
- **"More like this"** — content-based recommendations using TF-IDF genre vectors + cosine similarity (no login needed)
- **"Audience also loved"** — item-based collaborative signal: what fans of this movie rated highly
- **Lightweight profiles** — display name only, no email or password. Rate movies to build a taste profile
- **Personalized "For You" feed** — unlocks after 3 ratings, blending content similarity with SVD matrix factorization

---

## Architecture

```
recommender/            Core ML logic
  content_based.py      TF-IDF genre vectors + cosine similarity
  collaborative.py      SVD matrix factorization (scipy.sparse.linalg.svds)
  hybrid.py             Blends content (0.4) + collaborative (0.6) scores
  engine.py             Singleton that owns the cached model; auto-refreshes
  db_loader.py          Loads DataFrames from SQLite for the recommender
backend/
  app/
    main.py             FastAPI app + lifespan startup
    models.py           SQLAlchemy ORM: Movie, User, Rating, MLRating
    database.py         SQLite engine (swap to Postgres: change DATABASE_URL)
    schemas.py          Pydantic request/response models
    routes/
      movies.py         GET /movies, /movies/{id}, /similar, /audience
      users.py          POST /users, ratings, GET /recommendations
  scripts/
    ingest.py           One-time ETL: MovieLens CSVs → SQLite
frontend/
  src/
    api/client.ts       Typed fetch wrapper for all API endpoints
    hooks/useUser.ts    Profile state + localStorage persistence
    pages/              Home, Browse, MovieDetail, Join, ForYou
    components/         Nav, MovieCard, StarRating, PosterPlaceholder, Skeleton
```

### Recommendation serving strategy (v1 simplification)

- **Content-based**: stateless, computed on demand — pure cosine similarity lookup, fast every request.
- **Collaborative/hybrid**: SVD factorization is computed once on startup and cached in memory. The engine auto-recomputes after every 10 new app-user ratings. Real-time per-request retraining is a deliberate v1 omission — documented, not an oversight.

### Data model notes

MovieLens seed ratings live in a separate `ml_ratings` table (no `User` rows needed for them). App users get `User` rows with IDs starting from 1. When building the collaborative matrix, app-user IDs are offset by 2,000,000 to avoid collision with MovieLens user IDs (1–610).

---

## Running locally

**Prerequisites:** Python 3.9+, Node 22+

### 1. Backend

```bash
cd movie_recommender/backend

# Install dependencies
pip install -r requirements.txt

# Ingest MovieLens data (one-time, ~30 seconds)
curl -L https://files.grouplens.org/datasets/movielens/ml-latest-small.zip -o /tmp/ml.zip
unzip /tmp/ml.zip -d /tmp/
python -m scripts.ingest --data-dir /tmp/ml-latest-small

# Start the API (builds recommender engine on startup, ~10s)
python -m uvicorn app.main:app --port 8000 --reload
```

API docs at `http://localhost:8000/docs`

### 2. Frontend

```bash
cd movie_recommender/frontend
npm install
npm run dev
```

App at `http://localhost:5173`

---

## API reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/movies` | Browse/search: `?search=&genre=&year_min=&year_max=&page=` |
| `GET` | `/movies/{id}` | Movie detail |
| `GET` | `/movies/{id}/similar` | Content-based "more like this" |
| `GET` | `/movies/{id}/audience` | Item-based "audience also loved" |
| `POST` | `/users` | Create profile `{display_name}` → `{id, display_name}` |
| `GET` | `/users/{id}` | Fetch profile |
| `POST` | `/users/{id}/ratings` | Rate a movie `{movie_id, value: 0.5–5.0}` |
| `GET` | `/users/{id}/ratings` | Rating history |
| `GET` | `/users/{id}/recommendations` | Personalized feed; returns `mode: insufficient\|content\|hybrid` |

---

## Tech choices

| Layer | Choice | Why |
|---|---|---|
| Backend | FastAPI | Zero-rewrite path from the pandas/sklearn prototype; async-ready; free OpenAPI docs |
| Database | SQLite + SQLAlchemy ORM | Sufficient for ≤10K movies, ≤200K ratings; ORM means Postgres is a connection-string change |
| Frontend | React + Vite + TypeScript | Modern, fast dev loop; typed API client catches integration bugs early |
| Recommender | TF-IDF + truncated SVD | Proven baseline; interpretable; lightweight enough to serve from a free-tier host |

---

## Data licensing

MovieLens data is provided by GroupLens Research for non-commercial research and education use. This is a portfolio/educational project. See [grouplens.org/datasets/movielens/](https://grouplens.org/datasets/movielens/) for full license terms.

> F. Maxwell Harper and Joseph A. Konstan. 2015. The MovieLens Datasets: History and Context. ACM Transactions on Interactive Intelligent Systems (TiiS) 5, 4: 25:1–25:19.
