from sqlalchemy import Column, Integer, Float, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True)  # = MovieLens movieId
    title = Column(Text, nullable=False)
    year = Column(Integer, nullable=True)
    genres = Column(Text, nullable=False)   # pipe-separated e.g. "Action|Drama"
    tmdb_id = Column(Integer, nullable=True)
    poster_url = Column(Text, nullable=True)

    ratings = relationship("Rating", back_populates="movie")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    display_name = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    ratings = relationship("Rating", back_populates="user")


class Rating(Base):
    """App-user ratings (profiles created in this app)."""
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    value = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (UniqueConstraint("user_id", "movie_id"),)

    user = relationship("User", back_populates="ratings")
    movie = relationship("Movie", back_populates="ratings")


class MLRating(Base):
    """Seed ratings from MovieLens ml-latest-small.  No User rows needed."""
    __tablename__ = "ml_ratings"

    ml_user_id = Column(Integer, nullable=False, primary_key=True)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False, primary_key=True)
    value = Column(Float, nullable=False)
