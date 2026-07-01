"""
Ingest MovieLens ml-latest-small data into the SQLite database.
Run from movie_recommender/backend/:
    python -m scripts.ingest --data-dir /path/to/ml-latest-small
"""
import argparse
import re
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine
from app.models import Base, Movie, MLRating


TITLE_YEAR_RE = re.compile(r"^(.*)\s+\((\d{4})\)\s*$")


def parse_title_year(raw: str):
    m = TITLE_YEAR_RE.match(raw.strip())
    if m:
        return m.group(1).strip(), int(m.group(2))
    return raw.strip(), None


def ingest(data_dir: Path) -> None:
    Base.metadata.create_all(bind=engine)

    movies_df = pd.read_csv(data_dir / "movies.csv")
    ratings_df = pd.read_csv(data_dir / "ratings.csv")
    links_df = pd.read_csv(data_dir / "links.csv")

    tmdb_lookup = {
        row["movieId"]: int(row["tmdbId"]) if pd.notna(row["tmdbId"]) else None
        for _, row in links_df.iterrows()
    }

    print(f"Ingesting {len(movies_df)} movies…")
    with Session(engine) as session:
        session.execute(text("DELETE FROM ml_ratings"))
        session.execute(text("DELETE FROM ratings"))
        session.execute(text("DELETE FROM users"))
        session.execute(text("DELETE FROM movies"))
        session.commit()

        movies_to_insert = []
        for _, row in movies_df.iterrows():
            title, year = parse_title_year(row["title"])
            movies_to_insert.append(Movie(
                id=int(row["movieId"]),
                title=title,
                year=year,
                genres=row["genres"],
                tmdb_id=tmdb_lookup.get(row["movieId"]),
            ))
        session.bulk_save_objects(movies_to_insert)
        session.commit()
        print(f"  Inserted {len(movies_to_insert)} movies.")

        print(f"Ingesting {len(ratings_df)} MovieLens ratings into ml_ratings…")
        ml_ratings = [
            MLRating(
                ml_user_id=int(row["userId"]),
                movie_id=int(row["movieId"]),
                value=float(row["rating"]),
            )
            for _, row in ratings_df.iterrows()
        ]
        session.bulk_save_objects(ml_ratings)
        session.commit()
        print(f"  Inserted {len(ml_ratings)} ML ratings.")

    print("Ingestion complete.  App users start from id=1.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default="/tmp/ml-latest-small", type=Path)
    args = parser.parse_args()
    ingest(args.data_dir)
