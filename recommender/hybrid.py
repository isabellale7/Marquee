"""
Hybrid recommender: blends content-based similarity with collaborative
filtering's predicted rating, so recommendations benefit from both
"this is thematically similar" and "people with similar taste loved this".

Cold-start handling: a brand-new user (no ratings yet) gets pure
content-based recommendations; an existing user gets the blended score.
"""
from recommender.content_based import ContentBasedRecommender
from recommender.collaborative import CollaborativeRecommender


class HybridRecommender:
    def __init__(self, movies_path="data/movies.csv", ratings_path="data/ratings.csv",
                 content_weight=0.4, collab_weight=0.6):
        self.content = ContentBasedRecommender(movies_path)
        self.collab = CollaborativeRecommender(ratings_path, movies_path)
        self.content_weight = content_weight
        self.collab_weight = collab_weight

    def recommend(self, user_id, liked_titles=None, top_n=10):
        is_known_user = user_id in self.collab._user_pos
        has_profile = bool(liked_titles)

        if not is_known_user and not has_profile:
            raise ValueError(
                "Need either a known user_id or a list of liked_titles to "
                "recommend from (cold start needs *something* to go on)."
            )

        scores = {}

        if is_known_user:
            row = self.collab.predicted[self.collab._user_pos[user_id]]
            seen = self.collab._already_rated.get(user_id, set())
            for mid in self.collab._movie_ids:
                if mid in seen:
                    continue
                # normalize predicted rating (roughly 0.5-5) to a 0-1 scale
                scores[mid] = self.collab_weight * (row[self.collab._movie_pos[mid]] / 5.0)

        if has_profile:
            content_scores = self.content.similar_to_profile(liked_titles, top_n=len(self.content.movies))
            if content_scores is not None:
                for _, r in content_scores.iterrows():
                    mid = r["movieId"]
                    weight = self.content_weight if is_known_user else 1.0
                    scores[mid] = scores.get(mid, 0) + weight * r["similarity"]

        if not scores:
            return None

        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]
        result = self.content.movies.set_index("movieId").loc[[m for m, _ in ranked]].copy()
        result["score"] = [round(s, 3) for _, s in ranked]
        return result.reset_index()


if __name__ == "__main__":
    rec = HybridRecommender()

    print("== Existing user, blended recommendations ==")
    uid = rec.collab._user_ids[0]
    print(rec.recommend(user_id=uid, top_n=8)[["title", "year", "genres", "score"]])

    print("\n== New user, cold start from liked titles only ==")
    print(rec.recommend(
        user_id=-1, liked_titles=["Inception", "The Matrix"], top_n=8
    )[["title", "year", "genres", "score"]])
