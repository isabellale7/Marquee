"""
RecommenderEngine — wraps the three existing recommender classes and owns
the cached collaborative model. Load once at startup; call .refresh() to
recompute the SVD factorization (e.g. after N new ratings are added).

This is the v1 simplification documented in PRD §6.4: content-based is
stateless and computed on demand; collaborative/hybrid uses a cached model
recomputed on startup and every 10 new ratings.
"""
import logging
import threading
import numpy as np
import pandas as pd
from scipy.sparse.linalg import svds
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .content_based import ContentBasedRecommender
from .collaborative import CollaborativeRecommender

logger = logging.getLogger(__name__)

RATINGS_SINCE_REFRESH = 0
REFRESH_EVERY_N = 10
_lock = threading.Lock()


class RecommenderEngine:
    def __init__(self, movies_df: pd.DataFrame, ratings_df: pd.DataFrame = None, ratings_loader=None, n_factors: int = 20):
        self.movies_df = movies_df
        self._ratings_df = ratings_df
        self._ratings_loader = ratings_loader
        self._n_factors = n_factors
        self._ratings_since_refresh = 0
        self.collab = None  # built lazily on first use to reduce startup memory
        self._build_content(movies_df)

    def _ensure_collab(self) -> None:
        if self.collab is None:
            with _lock:
                if self.collab is None:
                    if self._ratings_df is None and self._ratings_loader is not None:
                        logger.info("Loading ratings for collab model (deferred)…")
                        self._ratings_df = self._ratings_loader()
                    self._build_collab(self.movies_df, self._ratings_df, self._n_factors)

    # ------------------------------------------------------------------
    # Construction helpers
    # ------------------------------------------------------------------

    def _build_content(self, movies_df: pd.DataFrame) -> None:
        genre_docs = movies_df["genres"].str.replace("|", " ", regex=False)
        vectorizer = TfidfVectorizer(token_pattern=r"[^\s]+")
        genre_matrix = vectorizer.fit_transform(genre_docs)
        similarity = cosine_similarity(genre_matrix)
        title_to_idx = {t.lower(): i for i, t in enumerate(movies_df["title"])}

        # Attach to a ContentBasedRecommender without calling __init__
        cb = ContentBasedRecommender.__new__(ContentBasedRecommender)
        cb.movies = movies_df.copy()
        cb.vectorizer = vectorizer
        cb.genre_matrix = genre_matrix
        cb.similarity = similarity
        cb._title_to_idx = title_to_idx
        self.content = cb

    def _build_collab(self, movies_df: pd.DataFrame, ratings_df: pd.DataFrame, n_factors: int) -> None:
        collab = CollaborativeRecommender.__new__(CollaborativeRecommender)
        collab.ratings = ratings_df.copy()
        collab.movies = movies_df.copy()

        user_item = ratings_df.pivot_table(index="userId", columns="movieId", values="rating")
        collab._user_ids = user_item.index.to_numpy()
        collab._movie_ids = user_item.columns.to_numpy()

        matrix = user_item.to_numpy()
        user_means = np.nanmean(matrix, axis=1)
        filled = np.where(np.isnan(matrix), user_means[:, None], matrix)
        centered = filled - user_means[:, None]

        k = min(n_factors, min(centered.shape) - 1)
        U, sigma, Vt = svds(centered, k=k)
        collab.predicted = U @ np.diag(sigma) @ Vt + user_means[:, None]
        collab.user_means = user_means
        collab._user_pos = {uid: i for i, uid in enumerate(collab._user_ids)}
        collab._movie_pos = {mid: i for i, mid in enumerate(collab._movie_ids)}
        collab._already_rated = {
            uid: set(ratings_df.loc[ratings_df.userId == uid, "movieId"])
            for uid in collab._user_ids
        }
        self.collab = collab
        logger.info("Collaborative model built (%d users, %d movies)", len(collab._user_ids), len(collab._movie_ids))

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def refresh(self) -> None:
        """Recompute the collaborative model in-place (thread-safe)."""
        with _lock:
            ratings_df = self._ratings_loader() if self._ratings_loader else self._ratings_df
            self._ratings_df = ratings_df
            self._build_collab(self.movies_df, ratings_df, self._n_factors)
            self._ratings_since_refresh = 0
            logger.info("Recommender engine refreshed.")

    def record_new_rating(self) -> bool:
        """Call after each new app-user rating. Returns True if a refresh was triggered."""
        with _lock:
            self._ratings_since_refresh += 1
            if self._ratings_since_refresh >= REFRESH_EVERY_N:
                ratings_df = self._ratings_loader() if self._ratings_loader else self._ratings_df
                self._ratings_df = ratings_df
                self._build_collab(self.movies_df, ratings_df, self._n_factors)
                self._ratings_since_refresh = 0
                logger.info("Auto-refresh triggered after %d new ratings.", REFRESH_EVERY_N)
                return True
        return False

    def similar_to(self, movie_id: int, top_n: int = 10):
        """Content-based: movies similar to the given movie_id."""
        movie_row = self.movies_df[self.movies_df["movieId"] == movie_id]
        if movie_row.empty:
            return None
        title = movie_row.iloc[0]["title"]
        return self.content.similar_to(title, top_n=top_n)

    def audience_also_liked(self, movie_id: int, top_n: int = 10):
        """Item-based collaborative: people who liked this also liked..."""
        self._ensure_collab()
        return self.collab.users_who_liked_this_also_liked(movie_id, top_n=top_n)

    def recommend_for_user(self, user_id: int, liked_titles: list, top_n: int = 10, rating_threshold: int = 3):
        """
        Hybrid recommendations for an app user.
        - user_id: DB id of the app user
        - liked_titles: titles of movies they've rated >= 3.5 (used as content profile)
        - rating_threshold: minimum number of ratings before switching to hybrid
        Returns (recs_df, mode) where mode is 'content', 'hybrid', or 'insufficient'.
        """
        from .hybrid import HybridRecommender

        n_rated = len(liked_titles)
        if n_rated < rating_threshold:
            return None, "insufficient"

        self._ensure_collab()
        from recommender.db_loader import APP_USER_ID_OFFSET
        collab_user_id = user_id + APP_USER_ID_OFFSET
        is_known = collab_user_id in self.collab._user_pos

        if is_known and liked_titles:
            # Full hybrid
            hybrid = HybridRecommender.__new__(HybridRecommender)
            hybrid.content = self.content
            hybrid.collab = self.collab
            hybrid.content_weight = 0.4
            hybrid.collab_weight = 0.6
            result = hybrid.recommend(user_id=collab_user_id, liked_titles=liked_titles, top_n=top_n)
            return result, "hybrid"
        elif liked_titles:
            # Content-only (user not yet in collab model)
            result = self.content.similar_to_profile(liked_titles, top_n=top_n)
            return result, "content"
        else:
            return None, "insufficient"
