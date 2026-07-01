import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from .database import engine as db_engine, SessionLocal
from .models import Base
from .recommender_state import init_engine
from recommender.db_loader import load_movies, load_ratings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=db_engine)
    logger.info("Loading data and building recommender engine…")
    with Session(db_engine) as session:
        movies_df = load_movies(session)
        ratings_df = load_ratings(session)
    init_engine(movies_df, ratings_df)
    logger.info("Recommender engine ready. %d movies, %d ratings.", len(movies_df), len(ratings_df))
    yield


app = FastAPI(
    title="Marquee API",
    description="Movie recommendation API powering the Marquee app.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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
