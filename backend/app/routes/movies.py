from __future__ import annotations
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from ..database import get_db
from ..models import Movie
from ..schemas import MovieBase, MoviePage, SimilarMovie, AudienceMovie
from ..recommender_state import get_engine

router = APIRouter(prefix="/movies", tags=["movies"])

PAGE_SIZE = 20


@router.get("", response_model=MoviePage)
def browse_movies(
    search: Optional[str] = Query(None),
    genre: Optional[str] = Query(None),
    year_min: Optional[int] = Query(None),
    year_max: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db),
):
    q = db.query(Movie)
    if search:
        q = q.filter(Movie.title.ilike(f"%{search}%"))
    if genre:
        q = q.filter(Movie.genres.ilike(f"%{genre}%"))
    if year_min:
        q = q.filter(Movie.year >= year_min)
    if year_max:
        q = q.filter(Movie.year <= year_max)

    total = q.count()
    movies = q.order_by(Movie.title).offset((page - 1) * PAGE_SIZE).limit(PAGE_SIZE).all()

    return MoviePage(
        items=[MovieBase.from_orm_movie(m) for m in movies],
        total=total,
        page=page,
        page_size=PAGE_SIZE,
    )


@router.get("/{movie_id}", response_model=MovieBase)
def get_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return MovieBase.from_orm_movie(movie)


@router.get("/{movie_id}/similar", response_model=List[SimilarMovie])
def similar_movies(movie_id: int, top_n: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    engine = get_engine()
    result = engine.similar_to(movie_id, top_n=top_n)
    if result is None:
        return []

    movie_ids = result["movieId"].tolist()
    movies_map = {m.id: m for m in db.query(Movie).filter(Movie.id.in_(movie_ids)).all()}

    out = []
    for _, row in result.iterrows():
        mid = int(row["movieId"])
        if mid not in movies_map:
            continue
        m = movies_map[mid]
        out.append(SimilarMovie(
            id=m.id, title=m.title, year=m.year,
            genres=m.genres.split("|") if m.genres else [],
            tmdb_id=m.tmdb_id, poster_url=m.poster_url,
            similarity=float(row["similarity"]),
        ))
    return out


@router.get("/{movie_id}/audience", response_model=List[AudienceMovie])
def audience_also_liked(movie_id: int, top_n: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    engine = get_engine()
    result = engine.audience_also_liked(movie_id, top_n=top_n)
    if result is None:
        return []

    movie_ids = result["movieId"].tolist()
    movies_map = {m.id: m for m in db.query(Movie).filter(Movie.id.in_(movie_ids)).all()}

    out = []
    for _, row in result.iterrows():
        mid = int(row["movieId"])
        if mid not in movies_map:
            continue
        m = movies_map[mid]
        out.append(AudienceMovie(
            id=m.id, title=m.title, year=m.year,
            genres=m.genres.split("|") if m.genres else [],
            tmdb_id=m.tmdb_id, poster_url=m.poster_url,
            fans_count=int(row["fans_who_also_liked_it"]),
        ))
    return out
