import logging
import os
import sys
import json
import time
import threading
import urllib.request
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from .database import engine as db_engine, SessionLocal
from .models import Base, Movie
from .recommender_state import init_engine
from recommender.db_loader import load_movies, load_ratings
from .database import SessionLocal as _SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _bulk_fetch_posters():
    """Background thread: fetch missing poster URLs from TMDB at a safe rate."""
    api_key = os.environ.get("TMDB_API_KEY")
    if not api_key:
        return
    time.sleep(120)  # wait 2 min after startup before fetching posters
    logger.info("Starting background poster fetch…")
    with SessionLocal() as db:
        movies = db.query(Movie).filter(Movie.tmdb_id.isnot(None), Movie.poster_url.is_(None)).all()
        tmdb_ids = [(m.id, m.tmdb_id) for m in movies]

    logger.info("Fetching posters for %d movies.", len(tmdb_ids))
    batch, fetched = 0, 0
    for db_id, tmdb_id in tmdb_ids:
        try:
            with urllib.request.urlopen(
                f"https://api.themoviedb.org/3/movie/{tmdb_id}?api_key={api_key}", timeout=5
            ) as resp:
                data = json.loads(resp.read())
            path = data.get("poster_path")
            if path:
                with SessionLocal() as db:
                    m = db.query(Movie).filter(Movie.id == db_id).first()
                    if m:
                        m.poster_url = f"https://image.tmdb.org/t/p/w500{path}"
                        db.commit()
                fetched += 1
        except Exception:
            pass
        batch += 1
        if batch >= 38:  # stay under TMDB's 40 req/10s limit
            time.sleep(10)
            batch = 0
    logger.info("Poster fetch complete. %d posters saved.", fetched)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=db_engine)
    logger.info("Loading movies and building content model…")
    with Session(db_engine) as session:
        movies_df = load_movies(session)

    def ratings_loader():
        with _SessionLocal() as s:
            return load_ratings(s)

    init_engine(movies_df, ratings_loader)
    logger.info("Content model ready. %d movies loaded. Collab model deferred.", len(movies_df))
    threading.Thread(target=_bulk_fetch_posters, daemon=True).start()
    yield


app = FastAPI(
    title="Marquee API",
    description="Movie recommendation API powering the Marquee app.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://marquee-pi.vercel.app", "https://marquee-lm9bmqp1v-marqueeproject.vercel.app"],
    allow_origin_regex=r"https://marquee-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routes.movies import router as movies_router
from .routes.users import router as users_router

app.include_router(movies_router)
app.include_router(users_router)


@app.get("/health")
def health():
    return {"status": "ok"}
