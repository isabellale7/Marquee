"""
Loads movies and ratings from the SQLite DB into DataFrames that match the
shape the existing recommender classes expect.

Ratings are unioned from two tables:
  - ml_ratings: seed data from MovieLens (ml_user_id 1-610)
  - ratings:    app-user ratings (user_id starting from 1, offset to 2_000_000+
                to avoid collision with ML user IDs in the collaborative matrix)
"""
import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

# Offset applied to app-user IDs when building the collaborative matrix so they
# don't collide with MovieLens user IDs (1–610).
APP_USER_ID_OFFSET = 2_000_000


def load_movies(session: Session) -> pd.DataFrame:
    rows = session.execute(
        text("SELECT id AS movieId, title, year, genres FROM movies")
    ).fetchall()
    return pd.DataFrame(rows, columns=["movieId", "title", "year", "genres"])


def load_ratings(session: Session) -> pd.DataFrame:
    """
    Combined ratings for the collaborative model.
    ML users keep their original IDs (1-610).
    App users are offset to 2_000_000+ to avoid collision.
    """
    rows = session.execute(text("""
        SELECT ml_user_id AS userId, movie_id AS movieId, value AS rating
        FROM ml_ratings
        UNION ALL
        SELECT user_id + :offset AS userId, movie_id AS movieId, value AS rating
        FROM ratings
    """), {"offset": APP_USER_ID_OFFSET}).fetchall()
    return pd.DataFrame(rows, columns=["userId", "movieId", "rating"])


def load_app_ratings(session: Session) -> pd.DataFrame:
    """App-user ratings only, using raw user_id (not offset)."""
    rows = session.execute(
        text("SELECT user_id AS userId, movie_id AS movieId, value AS rating FROM ratings")
    ).fetchall()
    return pd.DataFrame(rows, columns=["userId", "movieId", "rating"])
