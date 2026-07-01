"""
Generates data/ratings.csv -- a SIMULATED ratings matrix in MovieLens format
(userId,movieId,rating,timestamp).

WHY SIMULATED: the real MovieLens ratings.csv (100,836 rows) could not be
retrieved through this environment's available tools (GitHub renders the file
client-side via JS, and the official .zip can't be parsed through the fetch
tool available here). To still demonstrate a real collaborative-filtering
pipeline, ratings are generated from a genre-affinity model: each synthetic
user gets a taste profile (weights over genres), and rates a random subset of
real movies with a score that reflects how well each movie matches their
taste, plus noise. This produces a ratings matrix with the same kind of
structure (sparsity, genre-correlated taste clusters, power-law-ish popularity)
that collaborative filtering relies on -- it is not real user data.

>>> Swap in the real dataset at any time: download ml-latest-small.zip from
>>> https://files.grouplens.org/datasets/movielens/ml-latest-small.zip ,
>>> drop movies.csv / ratings.csv into data/, and the rest of the code
>>> (content_based.py, collaborative.py, hybrid.py) needs zero changes --
>>> it was written against the standard MovieLens column names.
"""
import csv
import random
import time

random.seed(42)

ARCHETYPES = {
    "action_fan":     {"Action": 2.0, "Adventure": 1.3, "Sci-Fi": 1.0, "Thriller": 0.8, "War": 0.6},
    "romcom_fan":      {"Romance": 2.0, "Comedy": 1.3, "Drama": 0.5},
    "arthouse_fan":    {"Drama": 1.6, "Mystery": 0.9, "Romance": 0.5, "Crime": 0.4},
    "family_fan":      {"Children": 2.0, "Animation": 1.6, "Comedy": 0.8, "Fantasy": 0.8, "Musical": 0.5},
    "horror_fan":      {"Horror": 2.2, "Thriller": 1.1, "Mystery": 0.7},
    "scifi_fan":       {"Sci-Fi": 2.0, "Fantasy": 0.9, "Action": 0.7, "Thriller": 0.5},
    "classic_fan":     {"Drama": 1.2, "Romance": 0.7, "War": 0.6, "Musical": 0.6, "Western": 0.6},
    "comedy_fan":      {"Comedy": 2.0, "Romance": 0.5, "Adventure": 0.5},
    "crime_thriller_fan": {"Crime": 1.8, "Thriller": 1.5, "Mystery": 1.0, "Drama": 0.5},
    "animation_fan":   {"Animation": 2.0, "Children": 1.2, "Fantasy": 0.9, "Adventure": 0.7, "Comedy": 0.6},
    "musical_fan":     {"Musical": 2.0, "Romance": 0.8, "Drama": 0.6, "Comedy": 0.5},
    "war_history_fan": {"War": 2.0, "Drama": 1.0, "History": 0.8, "Action": 0.4},
}

NUM_USERS = 150
MIN_RATINGS, MAX_RATINGS = 15, 45


def load_movies(path="/home/claude/movie_recommender/data/movies.csv"):
    movies = []
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            movies.append({
                "movieId": int(row["movieId"]),
                "genres": row["genres"].split("|"),
            })
    return movies


def affinity_score(weights, genres):
    return sum(weights.get(g, 0.0) for g in genres)


def make_rating(score, rng):
    # Map affinity score (roughly 0-3) to a 0.5-5.0 star rating with noise,
    # rounded to the nearest half star, like real MovieLens ratings.
    base = 2.4 + score * 0.9
    noisy = base + rng.gauss(0, 0.6)
    rating = max(0.5, min(5.0, round(noisy * 2) / 2))
    return rating


def generate(out_path="/home/claude/movie_recommender/data/ratings.csv"):
    movies = load_movies()
    rng = random.Random(42)
    rows = []
    start_ts = int(time.mktime((2015, 1, 1, 0, 0, 0, 0, 0, 0)))

    for user_id in range(1, NUM_USERS + 1):
        primary, secondary = rng.sample(list(ARCHETYPES.keys()), 2)
        w1, w2 = ARCHETYPES[primary], ARCHETYPES[secondary]
        blend = {g: w1.get(g, 0) * 0.7 + w2.get(g, 0) * 0.3 for g in set(w1) | set(w2)}

        n_ratings = rng.randint(MIN_RATINGS, MAX_RATINGS)
        # Bias movie selection toward ones this user would plausibly seek out,
        # but include some random exploration too (mirrors real behavior).
        scored = [(m, affinity_score(blend, m["genres"])) for m in movies]
        scored.sort(key=lambda x: x[1] + rng.uniform(0, 1.5), reverse=True)
        pool_size = min(len(movies), n_ratings * 3)
        candidates = [m for m, _ in scored[:pool_size]]
        rated_movies = rng.sample(candidates, min(n_ratings, len(candidates)))

        for m in rated_movies:
            score = affinity_score(blend, m["genres"])
            rating = make_rating(score, rng)
            ts = start_ts + rng.randint(0, 60 * 60 * 24 * 365 * 3)
            rows.append((user_id, m["movieId"], rating, ts))

    rows.sort(key=lambda r: (r[0], r[1]))

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["userId", "movieId", "rating", "timestamp"])
        writer.writerows(rows)

    print(f"Wrote {len(rows)} simulated ratings from {NUM_USERS} users to {out_path}")


if __name__ == "__main__":
    generate()
