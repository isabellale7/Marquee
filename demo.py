"""
Demo script: run all three recommenders and print example output.

    python3 demo.py

Run this from the project root (movie_recommender/).
"""
import pandas as pd
from recommender.content_based import ContentBasedRecommender
from recommender.collaborative import CollaborativeRecommender
from recommender.hybrid import HybridRecommender

pd.set_option("display.max_colwidth", 60)
pd.set_option("display.width", 120)


def section(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


def main():
    content = ContentBasedRecommender()
    collab = CollaborativeRecommender()
    hybrid = HybridRecommender()

    section("1. CONTENT-BASED: 'More like this' for a specific movie")
    movie = "Spirited Away"
    print(f"Because you watched: {movie}\n")
    print(content.similar_to(movie, top_n=6)[["title", "year", "genres", "similarity"]]
          .to_string(index=False))

    section("2. CONTENT-BASED: Cold-start profile from a few liked titles")
    liked = ["The Godfather", "Goodfellas", "Casino"]
    print(f"Because you liked: {', '.join(liked)}\n")
    print(content.similar_to_profile(liked, top_n=6)[["title", "year", "genres", "similarity"]]
          .to_string(index=False))

    section("3. COLLABORATIVE FILTERING: Personalized picks for an existing user")
    uid = int(collab._user_ids[3])
    rated = collab.ratings[collab.ratings.userId == uid]
    top_rated_title = (
        rated.sort_values("rating", ascending=False)
        .merge(collab.movies, on="movieId")
        .iloc[0]["title"]
    )
    print(f"User {uid} has rated {len(rated)} movies, loved '{top_rated_title}' among others.")
    print("Top predicted picks (movies they haven't rated yet):\n")
    print(collab.recommend_for_user(uid, top_n=6)[["title", "year", "predicted_rating"]]
          .to_string(index=False))

    section("4. COLLABORATIVE FILTERING: 'Fans of this movie also loved...'")
    movie_id = int(collab.movies.loc[collab.movies.title == "The Dark Knight", "movieId"].iloc[0])
    print("Fans of 'The Dark Knight' also loved:\n")
    print(collab.users_who_liked_this_also_liked(movie_id, top_n=6)[["title", "year", "fans_who_also_liked_it"]]
          .to_string(index=False))

    section("5. HYBRID: hands-on hybrid blend for an existing user")
    print(f"Blended recommendations for user {uid} (collaborative + content signal):\n")
    print(hybrid.recommend(user_id=uid, top_n=6)[["title", "year", "genres", "score"]]
          .to_string(index=False))

    section("6. HYBRID: brand-new visitor, cold start from taste alone")
    liked = ["La La Land", "Whiplash"]
    print(f"New visitor says they liked: {', '.join(liked)}\n")
    print(hybrid.recommend(user_id=-1, liked_titles=liked, top_n=6)[["title", "year", "genres", "score"]]
          .to_string(index=False))


if __name__ == "__main__":
    main()
