"""
Exports data the HTML demo needs as JSON:
  - movies.json: id/title/year/genres for every movie (content-based
    similarity is computed live in the browser from this).
  - audience.json: precomputed "fans of this also loved" top-8 lists per
    movie, derived from the (simulated) ratings data via the same
    item-based co-occurrence method as collaborative.py.
"""
import json
from recommender.collaborative import CollaborativeRecommender

collab = CollaborativeRecommender()
movies = collab.movies

movies_out = [
    {
        "id": int(row.movieId),
        "title": row.title,
        "year": int(row.year),
        "genres": row.genres.split("|"),
    }
    for row in movies.itertuples()
]

audience_out = {}
for row in movies.itertuples():
    result = collab.users_who_liked_this_also_liked(row.movieId, top_n=8)
    if result is None or result.empty:
        continue
    audience_out[str(row.movieId)] = [
        {
            "id": int(r.movieId),
            "title": r.title,
            "year": int(r.year),
            "count": int(r.fans_who_also_liked_it),
        }
        for r in result.itertuples()
    ]

with open("/home/claude/movie_recommender/web/movies.json", "w") as f:
    json.dump(movies_out, f)
with open("/home/claude/movie_recommender/web/audience.json", "w") as f:
    json.dump(audience_out, f)

print(f"Exported {len(movies_out)} movies, audience signal for {len(audience_out)} movies.")
