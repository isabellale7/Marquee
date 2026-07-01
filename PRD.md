# Marquee — Movie Recommendation Platform
### Product Requirements Document (v1)

**Status:** Draft, ready for build
**Owner:** [you]
**Last updated:** 2026-06-28

---

## 0. Claude Code kickoff prompt

*(Paste this into Claude Code once this file is in the repo root, alongside the unzipped prototype.)*

```
I'm building Marquee, a movie recommendation web app — a personal portfolio
project. The repo already contains a working prototype: a Python
content-based + collaborative-filtering recommender (recommender/), a
simulated ratings dataset (data/), and a static HTML demo (web/).

Full requirements are in PRD.md at the repo root — read it in full before
writing any code.

Your job is to take this from prototype to the v1 product described in the
PRD. In particular:

1. Replace the simulated ratings with the real MovieLens ml-latest-small
   dataset — download it yourself from
   https://files.grouplens.org/datasets/movielens/ml-latest-small.zip
   (you have real internet access; I didn't when I built the prototype, which
   is the only reason the ratings are currently simulated).
2. Stand up the backend API described in PRD.md, reusing the existing
   recommender/ logic rather than rewriting it from scratch.
3. Build the frontend per the PRD, carrying over the visual language of the
   existing web/ demo rather than starting from a generic template.
4. Get the whole thing running locally end-to-end before touching deployment.

Work in the phased order laid out in the PRD's Milestones section (data
layer → API → frontend → polish) and check in with me after each phase
rather than building it all in one pass. Ask me anything in the PRD that's
ambiguous or under-specified before you start — don't guess silently on
anything that would be expensive to undo later (schema design, API shape).
```

---

## 1. Product overview & vision

Marquee is a movie recommendation web app. You tell it a movie you like (or
build up a rating history), and it recommends what to watch next using two
blended techniques: **content-based filtering** (genre/theme similarity) and
**collaborative filtering** (what people with similar taste rated highly).

This is a **personal portfolio project** — the goal is a polished, working,
deployable demonstration of a full recommendation system end-to-end (data →
ML → API → UI), not a commercial product. Scope should stay tight enough to
actually finish.

A prototype already exists and proves out the core recommendation logic
(TF-IDF content-based + SVD-based collaborative filtering, see
`recommender/`). This PRD describes turning that prototype into a real web
app with persistent data, a backend API, and an interactive frontend.

**Working name:** Marquee (the prototype's HTML demo already uses this —
change it if you want, it's a placeholder).

## 2. Goals & success metrics

| Goal | How we'll know |
|---|---|
| Demonstrate a real hybrid recommender, not a toy | Trained/served on the actual MovieLens dataset, not synthetic data |
| Ship something a stranger can actually use | Deployed, public URL, works on first load with no setup |
| Show full-stack range | Working data layer + API + frontend, not just a notebook |
| Stay finishable | v1 scope fits in the milestones below without scope creep |

This is a portfolio piece, so "success" also includes: clean, readable code;
a README that explains the architecture decisions; and a live demo link you
can put in a resume/portfolio.

## 3. Target user & core use cases

One persona: **someone deciding what to watch next.** Two entry points:

1. **No history yet ("cold start"):** "I liked X — what else might I like?"
   → pure content-based recommendation, no login required.
2. **Returning user with rating history:** "Recommend something for me" →
   hybrid recommendation using their accumulated ratings.

## 4. Scope

### V1 — Must have
- Browse / search a real movie catalog (MovieLens `ml-latest-small`: ~9,700
  movies, ~100K ratings, ~600 users' worth of real rating data).
- "More like this" content-based recommendations for any movie, no login
  needed.
- Lightweight user profiles (no password required — see §7.2) so a person
  can rate movies and accumulate a taste profile across visits.
- Once a user has rated a handful of movies (threshold TBD, default 5),
  switch them from cold-start to hybrid (content + collaborative)
  recommendations.
- "Audience also loved" item-based recommendations on each movie's detail
  page (people who liked this also liked...).
- Persisted ratings (a SQLite database is sufficient at this scale).
- Responsive web UI carrying over the visual identity from the existing
  prototype demo (marquee/cinema aesthetic, not a generic Bootstrap look).

### V1 — Should have
- Movie posters (via the free [TMDB API](https://www.themoviedb.org/documentation/api),
  joined on the `links.csv` TMDB IDs that ship with the MovieLens dataset).
- Deployed to a public URL (e.g. Render/Fly.io for the API, Vercel/Netlify
  for the frontend).
- Basic genre/year filtering on the browse view.

### V1 — Could have (nice-to-have, cut first if time-constrained)
- "Surprise me" — a random high-quality pick outside the user's usual genres
  (recommendation diversity / serendipity).
- Light/dark theme toggle.
- Export your ratings as CSV.

### Explicitly out of scope for v1
- A **books** vertical (the architecture should stay swap-friendly for this
  later, but don't build it now — see §11 Future work).
- Real authentication (OAuth, password reset flows, email verification).
  Profiles are lightweight and not security-sensitive (no real PII, no
  passwords — see §7.2).
- Real-time model retraining on every new rating (recompute on a schedule or
  on-demand instead — see §6.4).
- Admin dashboard, analytics, A/B testing infrastructure.
- Native mobile app.
- Multi-language / i18n.
- Content moderation (no user-generated free text beyond a display name).

## 5. Functional requirements (user stories)

1. As a visitor, I can search the catalog by title and see a movie's detail
   page (poster, year, genres, synopsis if available).
2. As a visitor, I can view "more like this" on any movie's detail page
   without creating a profile.
3. As a visitor, I can create a lightweight profile (display name only) to
   start building a taste history.
4. As a profile-holder, I can rate movies (0.5–5 stars, half-star
   increments, matching MovieLens convention).
5. As a profile-holder with 5+ ratings, I see a personalized "Recommended
   for you" feed using the hybrid recommender.
6. As a profile-holder with <5 ratings, I see a clear empty/in-progress
   state ("rate a few more to unlock personalized picks") rather than a
   broken or empty feed.
7. As any user, I can filter the browse view by genre and/or year range.
8. As any user, the app clearly indicates when I'm looking at a "more like
   this" (content) result vs. an "audience also loved" (collaborative)
   result vs. a personalized recommendation — these are different signals
   and shouldn't be presented as interchangeable.

## 6. Architecture & technical design

### 6.1 Stack (recommended; deviate with a stated reason if you have one)

| Layer | Choice | Why |
|---|---|---|
| Backend | **FastAPI** (Python) | Directly reuses the existing `recommender/` package (pandas/numpy/scikit-learn/scipy) with zero rewrite. Async-friendly, auto-generates OpenAPI docs. |
| Database | **SQLite** via SQLAlchemy | Catalog + ratings at this scale (≤10K movies, ≤200K ratings) fit comfortably; zero ops overhead for a portfolio deployment. Schema should stay ORM-based so swapping to Postgres later is a connection-string change, not a rewrite. |
| Frontend | **React + Vite + TypeScript** | Modern, portfolio-credible, fast dev loop. Carry over the design tokens (colors, type, the sprocket-hole/film-strip motif) from the existing `web/` HTML prototype rather than starting from a generic template. |
| Recommender | Existing `recommender/content_based.py`, `collaborative.py`, `hybrid.py` | Adapt data loading from CSV to the database (see §6.4); the algorithms themselves don't need to change. |

### 6.2 Data source

Real **MovieLens `ml-latest-small`** dataset:
`https://files.grouplens.org/datasets/movielens/ml-latest-small.zip`
(movies.csv, ratings.csv, links.csv, tags.csv — ~9,742 movies, 100,836
ratings, 610 users). This replaces the prototype's simulated ratings
entirely. Review the dataset's README for usage terms before any public
deployment (it's a non-commercial research dataset).

### 6.3 Data model (initial)

```
Movie
  id            int (= MovieLens movieId, preserve for traceability)
  title         text
  year          int
  genres        text[]  (or normalized join table — either is fine)
  tmdb_id       int, nullable
  poster_url    text, nullable

User
  id            uuid / int
  display_name  text
  created_at    timestamp

Rating
  user_id       fk -> User
  movie_id      fk -> Movie
  value         float (0.5–5.0, half-star increments)
  created_at    timestamp
  unique(user_id, movie_id)
```

Decide during the data-layer phase whether to also ingest `tags.csv` (free-
text user tags) — not required for v1, but cheap to keep if useful for
future content-based feature expansion.

### 6.4 Recommendation serving strategy

The catalog is small enough that real-time matrix factorization on every
request is unnecessary and real-time retraining on every new rating is
overkill for v1. Recommended approach:

- **Content-based** (`content_based.py`): stateless, compute on demand —
  it's just a cosine similarity lookup, cheap every time.
- **Collaborative/hybrid** (`collaborative.py`, `hybrid.py`): recompute the
  SVD factorization **on a timer or on startup** (e.g. every 15 minutes, or
  triggered after N new ratings) and cache the result in memory, rather than
  refactoring on every single API request. Document this as a deliberate
  v1 simplification, not an oversight — real-time retraining is a
  reasonable phase-2 item if you want to extend this later.

### 6.5 API specification (v1)

| Method & path | Purpose |
|---|---|
| `GET /movies?search=&genre=&year_min=&year_max=&page=` | Browse/search catalog |
| `GET /movies/{id}` | Movie detail |
| `GET /movies/{id}/similar` | Content-based "more like this" |
| `GET /movies/{id}/audience` | Item-based "audience also loved" |
| `POST /users` | Create a lightweight profile `{display_name}` → `{id, display_name}` |
| `GET /users/{id}` | Fetch profile |
| `POST /users/{id}/ratings` | Rate a movie `{movie_id, value}` |
| `GET /users/{id}/ratings` | A user's rating history |
| `GET /users/{id}/recommendations` | Hybrid personalized feed; falls back to a clear "not enough data yet" response below the rating threshold rather than an empty 200 |

Exact request/response shapes are an implementation detail Claude Code
should propose and confirm with you, not something pre-specified here.

### 6.6 Frontend requirements

Carry over from the existing prototype demo:
- The marquee/film-strip visual identity (deep ink-navy background, marquee
  gold + rosewood accents, the sprocket-hole motif as the signature visual
  element, condensed display type for headlines).
- The combobox-style search-and-select interaction pattern for finding
  movies.

New for v1:
- A browse/grid view with genre and year filtering.
- A movie detail page combining "more like this" and "audience also loved"
  as clearly-labeled, separate sections (per user story 8).
- A lightweight onboarding flow: create a display name, no password.
- A "Recommended for you" view, gated behind the rating threshold, with a
  genuinely useful empty state for new profiles (not just a spinner or blank
  page — tell the person what to do next).
- Star-rating control on movie cards/detail pages (0.5–5, half-star steps).

## 7. Non-functional requirements

### 7.1 Performance
- Catalog browse and movie detail: sub-300ms server response at this data
  scale (no excuse for this being slow with ≤10K movies).
- Recommendation endpoints: sub-500ms using the cached/precomputed
  factorization from §6.4.

### 7.2 Privacy & security
- No passwords, no email collection, no real PII — display name only. State
  this explicitly in the UI (e.g. "no email or password needed").
- This also means: don't build anything that *implies* security guarantees
  the lightweight-profile model doesn't have (no "forgot password," no
  account recovery — a lost profile is just gone, and the UI should say so
  if relevant).

### 7.3 Accessibility & responsiveness
- Usable on mobile widths.
- Visible keyboard focus states throughout (carry over from the prototype).
- Respect `prefers-reduced-motion`.

### 7.4 Licensing
- MovieLens data is for non-commercial research/education use per
  GroupLens' terms — fine for a portfolio project, but don't present this as
  a commercial product without reviewing those terms again.

## 8. Milestones (build in this order)

1. **Data layer** — ingest real MovieLens data into the SQLite schema;
   adapt `recommender/` to read from the DB instead of CSVs; verify
   recommendation quality looks sane against a few spot-checks (reuse
   `demo.py`'s spot-check pattern).
2. **Backend API** — implement the endpoints in §6.5 on top of the data
   layer; auto-generated OpenAPI docs should be enough for manual testing
   at this stage.
3. **Frontend** — build the views in §6.6 against the live API.
4. **Polish** — empty states, loading states, responsive pass, accessibility
   pass, README write-up.
5. **(Should-have) Deploy** — public URL for both API and frontend.

Check in after each milestone rather than building all five in one pass.

## 9. Open questions (resolve before/during build, don't guess silently)

- Rating threshold to unlock personalized recommendations — default 5,
  confirm or change.
- Exact recompute cadence for the collaborative model (timer vs. rating-count
  trigger) — pick one, document the choice.
- Whether to ingest `tags.csv` now or skip it for v1.
- Deployment targets, if pursuing the should-have deploy milestone.

## 10. Migration notes from the prototype

| Prototype file | What happens to it |
|---|---|
| `data/movies.csv` | Replaced by real MovieLens `movies.csv`, loaded into the `Movie` table. |
| `data/ratings.csv` (simulated) | Replaced entirely by real MovieLens `ratings.csv`, loaded into the `Rating` table. |
| `data/generate_movies.py`, `generate_ratings.py` | No longer needed once real data is in place — fine to delete after migration, or keep under `scripts/legacy/` for reference. |
| `recommender/content_based.py` | Reused; swap its `pd.read_csv` data loading for a DB query. |
| `recommender/collaborative.py` | Reused; same swap, plus add the caching/recompute strategy from §6.4. |
| `recommender/hybrid.py` | Reused as-is once the two modules above are adapted. |
| `web/movie_recommender_demo.html` | Retired as the shipped product, but its design tokens and interaction patterns are the spec for the new frontend — don't discard the visual direction. |

## 11. Future work (explicitly not v1)

- A **books** vertical using the same architecture (content-based on
  genre/author/description, collaborative filtering on ratings), pulling
  from the Open Library or Google Books API instead of MovieLens.
- Real-time retraining instead of scheduled recompute.
- Real authentication if this ever needs to hold anything sensitive.
- Recommendation explainability ("recommended because you rated X highly").
