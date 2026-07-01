from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, Rating, Movie
from ..schemas import UserCreate, UserOut, RatingCreate, RatingOut, MovieBase, RecommendationsOut, RecommendedMovie
from ..recommender_state import get_engine

router = APIRouter(prefix="/users", tags=["users"])

RATING_THRESHOLD = 3  # minimum ratings to unlock personalized recommendations


@router.post("", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db)):
    user = User(display_name=body.display_name.strip())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/{user_id}/ratings", response_model=RatingOut, status_code=201)
def rate_movie(user_id: int, body: RatingCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    movie = db.query(Movie).filter(Movie.id == body.movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    # Validate half-star increments
    if round(body.value * 2) != body.value * 2:
        raise HTTPException(status_code=422, detail="Rating must be in 0.5 increments")

    existing = db.query(Rating).filter(
        Rating.user_id == user_id, Rating.movie_id == body.movie_id
    ).first()

    if existing:
        existing.value = body.value
        db.commit()
        db.refresh(existing)
        rating = existing
    else:
        rating = Rating(user_id=user_id, movie_id=body.movie_id, value=body.value)
        db.add(rating)
        db.commit()
        db.refresh(rating)

    # Potentially refresh the recommender model
    try:
        eng = get_engine()
        eng.record_new_rating()
    except Exception:
        pass  # never fail a rating write due to model refresh

    return RatingOut(
        movie_id=rating.movie_id,
        value=rating.value,
        created_at=rating.created_at,
        movie=MovieBase.from_orm_movie(movie),
    )


@router.get("/{user_id}/ratings", response_model=List[RatingOut])
def get_ratings(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    ratings = (
        db.query(Rating)
        .filter(Rating.user_id == user_id)
        .join(Movie)
        .order_by(Rating.created_at.desc())
        .all()
    )
    return [
        RatingOut(
            movie_id=r.movie_id,
            value=r.value,
            created_at=r.created_at,
            movie=MovieBase.from_orm_movie(r.movie),
        )
        for r in ratings
    ]


@router.get("/{user_id}/recommendations", response_model=RecommendationsOut)
def get_recommendations(user_id: int, top_n: int = 10, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    ratings = db.query(Rating).filter(Rating.user_id == user_id).all()
    ratings_count = len(ratings)

    if ratings_count < RATING_THRESHOLD:
        return RecommendationsOut(
            mode="insufficient",
            ratings_count=ratings_count,
            threshold=RATING_THRESHOLD,
            items=[],
        )

    # Build liked_titles from ratings >= 3.5
    liked_movie_ids = [r.movie_id for r in ratings if r.value >= 3.5]
    if not liked_movie_ids:
        liked_movie_ids = [r.movie_id for r in ratings]  # fallback: use all

    movies = db.query(Movie).filter(Movie.id.in_(liked_movie_ids)).all()
    liked_titles = [m.title for m in movies]

    engine = get_engine()
    result, mode = engine.recommend_for_user(
        user_id=user_id,
        liked_titles=liked_titles,
        top_n=top_n,
        rating_threshold=RATING_THRESHOLD,
    )

    if result is None:
        return RecommendationsOut(
            mode="insufficient",
            ratings_count=ratings_count,
            threshold=RATING_THRESHOLD,
            items=[],
        )

    movie_ids = result["movieId"].tolist()
    movies_map = {m.id: m for m in db.query(Movie).filter(Movie.id.in_(movie_ids)).all()}

    score_col = "score" if "score" in result.columns else "similarity"
    items = []
    for _, row in result.iterrows():
        mid = int(row["movieId"])
        if mid not in movies_map:
            continue
        m = movies_map[mid]
        items.append(RecommendedMovie(
            id=m.id, title=m.title, year=m.year,
            genres=m.genres.split("|") if m.genres else [],
            tmdb_id=m.tmdb_id, poster_url=m.poster_url,
            score=float(row[score_col]),
            reason=mode,
        ))

    return RecommendationsOut(
        mode=mode,
        ratings_count=ratings_count,
        threshold=RATING_THRESHOLD,
        items=items,
    )
