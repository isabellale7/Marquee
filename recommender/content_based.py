"""
Content-based recommender.

Represents each movie as a TF-IDF vector over its genre tags, then recommends
by cosine similarity. Works with zero user data -- this is what powers
"more like this" / cold-start recommendations.
"""
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class ContentBasedRecommender:
    def __init__(self, movies_path="data/movies.csv"):
        self.movies = pd.read_csv(movies_path)
        # Treat the pipe-separated genre string as a "document" of genre tokens.
        genre_docs = self.movies["genres"].str.replace("|", " ", regex=False)
        self.vectorizer = TfidfVectorizer(token_pattern=r"[^\s]+")
        self.genre_matrix = self.vectorizer.fit_transform(genre_docs)
        self.similarity = cosine_similarity(self.genre_matrix)
        self._title_to_idx = {
            title.lower(): idx for idx, title in enumerate(self.movies["title"])
        }

    def find_movie(self, query):
        """Fuzzy-ish lookup: exact match first, then substring match."""
        query = query.lower().strip()
        if query in self._title_to_idx:
            return self._title_to_idx[query]
        matches = [i for t, i in self._title_to_idx.items() if query in t]
        return matches[0] if matches else None

    def _row_similarity(self, idx):
        """Compute similarity for one movie row on-demand (avoids full NxN matrix)."""
        vec = self.genre_matrix[idx]
        return cosine_similarity(vec, self.genre_matrix).flatten()

    def similar_to(self, title, top_n=10):
        idx = self.find_movie(title)
        if idx is None:
            return None
        row = self._row_similarity(idx)
        scores = [(i, float(s)) for i, s in enumerate(row) if i != idx]
        scores.sort(key=lambda x: x[1], reverse=True)
        top = scores[:top_n]
        result = self.movies.iloc[[i for i, _ in top]].copy()
        result["similarity"] = [round(s, 3) for _, s in top]
        return result.reset_index(drop=True)

    def similar_to_profile(self, titles, top_n=10):
        """Recommend based on a small set of movies someone says they like."""
        idxs = [self.find_movie(t) for t in titles]
        idxs = [i for i in idxs if i is not None]
        if not idxs:
            return None
        rows = [self._row_similarity(i) for i in idxs]
        import numpy as np
        profile_scores = np.mean(rows, axis=0)
        scores = [(i, float(s)) for i, s in enumerate(profile_scores) if i not in idxs]
        scores.sort(key=lambda x: x[1], reverse=True)
        top = scores[:top_n]
        result = self.movies.iloc[[i for i, _ in top]].copy()
        result["similarity"] = [round(s, 3) for _, s in top]
        return result.reset_index(drop=True)


if __name__ == "__main__":
    rec = ContentBasedRecommender()
    print("Movies similar to 'The Dark Knight':")
    print(rec.similar_to("The Dark Knight", top_n=8)[["title", "year", "genres", "similarity"]])
