"""
Module-level singleton for the RecommenderEngine.
Initialized at app startup; accessed by route handlers.
"""
import sys
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from recommender.engine import RecommenderEngine

_engine = None  # type: Optional[RecommenderEngine]


def get_engine() -> RecommenderEngine:
    if _engine is None:
        raise RuntimeError("RecommenderEngine not initialized — call init_engine() at startup.")
    return _engine


def init_engine(movies_df, ratings_df) -> RecommenderEngine:
    global _engine
    _engine = RecommenderEngine(movies_df, ratings_df)
    return _engine
