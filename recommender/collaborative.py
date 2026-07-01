"""
Collaborative-filtering recommender.

Builds a user x movie ratings matrix, mean-centers each user's ratings, and
factorizes it with truncated SVD (latent-factor matrix factorization -- the
same family of technique Netflix's famous 2009 Prize-winning model used).
Reconstructing the matrix from the top-k latent factors fills in predicted
ratings for movies a user hasn't rated, which is what "users who liked what
you liked also liked..." actually means under the hood.
"""
import numpy as np
import pandas as pd
from scipy.sparse.linalg import svds


class CollaborativeRecommender:
    def __init__(self, ratings_path="data/ratings.csv", movies_path="data/movies.csv",
                 n_factors=20):
        self.ratings = pd.read_csv(ratings_path)
        self.movies = pd.read_csv(movies_path)

        self.user_item = self.ratings.pivot_table(
            index="userId", columns="movieId", values="rating"
        )
        self._user_ids = self.user_item.index.to_numpy()
        self._movie_ids = self.user_item.columns.to_numpy()

        matrix = self.user_item.to_numpy()
        self.user_means = np.nanmean(matrix, axis=1)
        filled = np.where(np.isnan(matrix), self.user_means[:, None], matrix)
        centered = filled - self.user_means[:, None]

        k = min(n_factors, min(centered.shape) - 1)
        U, sigma, Vt = svds(centered, k=k)
        self.predicted = U @ np.diag(sigma) @ Vt + self.user_means[:, None]

        self._user_pos = {uid: i for i, uid in enumerate(self._user_ids)}
        self._movie_pos = {mid: i for i, mid in enumerate(self._movie_ids)}
        self._already_rated = {
            uid: set(self.ratings.loc[self.ratings.userId == uid, "movieId"])
            for uid in self._user_ids
        }

    def recommend_for_user(self, user_id, top_n=10):
        if user_id not in self._user_pos:
            return None
        row = self.predicted[self._user_pos[user_id]]
        seen = self._already_rated.get(user_id, set())
        scored = [
            (mid, row[self._movie_pos[mid]])
            for mid in self._movie_ids if mid not in seen
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        top = scored[:top_n]
        result = self.movies.set_index("movieId").loc[[m for m, _ in top]].copy()
        result["predicted_rating"] = [round(s, 2) for _, s in top]
        return result.reset_index()

    def users_who_liked_this_also_liked(self, movie_id, top_n=10, like_threshold=4.0):
        """Item-based signal: among users who rated this movie highly, what
        else did they rate highly? A simpler, more interpretable cousin of
        the SVD-based recommendations above."""
        fans = self.ratings[
            (self.ratings.movieId == movie_id) & (self.ratings.rating >= like_threshold)
        ]["userId"].unique()
        if len(fans) == 0:
            return None
        co_ratings = self.ratings[
            (self.ratings.userId.isin(fans))
            & (self.ratings.movieId != movie_id)
            & (self.ratings.rating >= like_threshold)
        ]
        counts = co_ratings.groupby("movieId").size().sort_values(ascending=False)
        top = counts.head(top_n)
        result = self.movies.set_index("movieId").loc[top.index].copy()
        result["fans_who_also_liked_it"] = top.values
        return result.reset_index()


if __name__ == "__main__":
    rec = CollaborativeRecommender()
    uid = rec._user_ids[0]
    print(f"Top picks for user {uid} (predicted rating):")
    print(rec.recommend_for_user(uid, top_n=8)[["title", "year", "predicted_rating"]])
