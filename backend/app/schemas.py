from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ── Movies ──────────────────────────────────────────────────────────────────

class MovieBase(BaseModel):
    id: int
    title: str
    year: Optional[int]
    genres: List[str]
    tmdb_id: Optional[int]
    poster_url: Optional[str]

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_movie(cls, m):
        return cls(
            id=m.id,
            title=m.title,
            year=m.year,
            genres=m.genres.split("|") if m.genres else [],
            tmdb_id=m.tmdb_id,
            poster_url=m.poster_url,
        )


class MoviePage(BaseModel):
    items: List[MovieBase]
    total: int
    page: int
    page_size: int


class SimilarMovie(MovieBase):
    similarity: float


class AudienceMovie(MovieBase):
    fans_count: int


# ── Users ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=50)


class UserOut(BaseModel):
    id: int
    display_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Ratings ──────────────────────────────────────────────────────────────────

class RatingCreate(BaseModel):
    movie_id: int
    value: float = Field(..., ge=0.5, le=5.0)


class RatingOut(BaseModel):
    movie_id: int
    value: float
    created_at: datetime
    movie: MovieBase

    model_config = {"from_attributes": True}


# ── Recommendations ──────────────────────────────────────────────────────────

class RecommendedMovie(MovieBase):
    score: float
    reason: str  # 'hybrid' | 'content'


class RecommendationsOut(BaseModel):
    mode: str   # 'hybrid' | 'content' | 'insufficient'
    ratings_count: int
    threshold: int
    items: List[RecommendedMovie]
