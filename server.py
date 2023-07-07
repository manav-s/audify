import heapq
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
from sklearn.cluster import AgglomerativeClustering
from spotipy.exceptions import SpotifyException
import numpy as np
from dotenv import load_dotenv

load_dotenv()

def get_all_playlist_tracks(uri):
    offset = 0
    tracks = []

    while True:
        response = sp.playlist_tracks(uri, offset=offset)
        tracks.extend(response["items"])

        if response["next"]:
            offset += len(response["items"])
        else:
            break

    return tracks


def get_song_data(track_id):
    try:
        track = sp.track(track_id)
    except SpotifyException:
        return None
    if track['duration_ms'] == 0:
        return None
    audio_features = sp.audio_features(track_id)[0]
    artist_id = track['artists'][0]['id']
    genres = get_related_artist_genres(artist_id)

    song_data = audio_features.copy()
    song_data['genre'] = genres
    song_data['track_name'] = track['name']
    return song_data


@lru_cache(maxsize=128)
def get_related_artist_genres(artist_id):
    related_artists = sp.artist_related_artists(artist_id)
    genres = []
    for artist in related_artists['artists']:
        genres.extend(artist['genres'])
    return list(set(genres))


def get_relative_key(key, mode):
    if mode == 1:  # Major key
        return (key + 9) % 12  # Relative minor key
    else:  # Minor key
        return (key + 3) % 12  # Relative major key


def steps_in_circle_of_fifths(key1, key2):
    circle_of_fifths = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5]
    index1 = circle_of_fifths.index(key1)
    index2 = circle_of_fifths.index(key2)
    steps = abs(index1 - index2)
    return min(steps, 12 - steps)


def key_compatibility(key1, mode1, key2, mode2):
    if key1 == key2:
        return True

    # Check for relative major/minor relationship
    if mode1 != mode2 and (key1 == get_relative_key(key2, mode2) or key2 == get_relative_key(key1, mode1)):
        return True

    # Check for compatibility based on circle of fifths
    steps = steps_in_circle_of_fifths(key1, key2)
    if (mode1 == mode2 and steps <= 2) or (mode1 != mode2 and steps <= 1):
        return True

    return False


def genre_similarity(genres1, genres2):
    if not genres1 or not genres2:
        return 0
    shared_genres = len(set(genres1).intersection(genres2))
    return min(shared_genres, 5)


def evaluate_transition(song1, song2):
    score = 0

    # Weights for different attributes
    weights = {
        'danceability': 7,
        'energy': 5,
        'loudness': 1,
        'tempo': 100,
        'valence': 5,
        'genre': 4
    }

    # Check key compatibility
    if not key_compatibility(song1['key'], song1['mode'], song2['key'], song2['mode']):
        score += 6  # Return a large score if keys are not compatible

    # Calculate the differences in attributes
    diff = {}
    for attribute in weights:
        if attribute == 'genre':
            diff[attribute] = 5 - \
                genre_similarity(song1[attribute], song2[attribute])
        else:
            diff[attribute] = abs(song1[attribute] - song2[attribute])

    # Normalize loudness differences
    diff['loudness'] /= 60  # Assume max difference is 60 dB

    # Calculate tempo difference considering double/half time mixing
    tempo_diff = min(
        abs(song1['tempo'] - song2['tempo']),
        abs(song1['tempo'] * 2 - song2['tempo']),
        abs(song1['tempo'] / 2 - song2['tempo'])
    )
    diff['tempo'] = tempo_diff / 200  # Normalize tempo difference

    # Calculate the transition score
    for attribute in weights:
        score += weights[attribute] * diff[attribute]

    return score


def custom_distance(song1, song2):
    return evaluate_transition(song1, song2)


def custom_clustering_algorithm(songs, n_clusters):
    # Calculate pairwise distances
    distances = np.zeros((len(songs), len(songs)))
    for i in range(len(songs)):
        for j in range(i + 1, len(songs)):
            distance = custom_distance(songs[i], songs[j])
            distances[i, j] = distance
            distances[j, i] = distance

    # Apply Agglomerative Clustering
    clustering = AgglomerativeClustering(
        n_clusters=n_clusters, affinity='precomputed', linkage='complete')
    clusters = clustering.fit_predict(distances)

    return clusters


app = Flask(__name__)
CORS(app)

cid = os.getenv("CLIENT_ID")
secret = os.getenv("CLIENT_SECRET")

client_credentials_manager = SpotifyClientCredentials(
    client_id=cid, client_secret=secret)
sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)

# this is a path to reorder the playlist
@app.route('/reorder_playlist', methods=['POST'])
def reorder_playlist():
    data = request.get_json()
    playlist_id = data.get('playlist_id')
    new_uris = data.get('new_uris')

    if not playlist_id or not new_uris:
        return {"error": "Invalid request. Please provide playlist_id and new_uris."}

    # Get the user's access token from the request header
    access_token = request.headers.get('Authorization')[
        7:]  # Remove "Bearer " prefix

    # Create a new Spotipy instance with the existing app credentials and the user's access token
    sp_user = spotipy.Spotify(
        client_credentials_manager=client_credentials_manager, auth=access_token)
    
    try:
        # Clear the playlist
        sp_user.playlist_replace_items(playlist_id, [])

        # Split the uris into chunks of 100
        uri_chunks = [new_uris[i:i + 100]
                      for i in range(0, len(new_uris), 100)]

        for chunk in uri_chunks:
            sp_user.playlist_add_items(playlist_id, chunk)

        return {"message": "Playlist reordered successfully"}
    except Exception as e:
        return {"error": str(e)}
    
# this is a route to optimize the playlist that it is given
@app.route('/optimize_playlist', methods=['POST'])
def optimize_playlist():
    data = request.get_json()
    playlist_link = data.get('playlist_link')
    if not playlist_link:
        return jsonify({"error": "playlist_link is required"}), 400

    uri = playlist_link.split("/")[-1].split("?")[0]
    track_uris = [x["track"]["uri"] for x in get_all_playlist_tracks(uri)]

    # Fetch song data in parallel
    with ThreadPoolExecutor() as executor:
        song_data_map = {song: data for song, data in zip(
            track_uris, executor.map(get_song_data, track_uris)) if data is not None}

    track_uris = list(song_data_map.keys())

    # Apply custom clustering algorithm
    n_clusters = min(8, len(track_uris))
    clusters = custom_clustering_algorithm(
        list(song_data_map.values()), n_clusters)

    # Sort songs within each cluster by tempo
    clustered_songs = {cluster_id: [] for cluster_id in range(n_clusters)}
    for i, song in enumerate(track_uris):
        clustered_songs[clusters[i]].append(
            (song, song_data_map[song]['tempo']))
    for cluster_id in clustered_songs:
        clustered_songs[cluster_id].sort(key=lambda x: x[1])

    # Create a playlist with songs ordered by cluster
    optimal_playlist = []
    for cluster_id in range(n_clusters):
        for song, _ in clustered_songs[cluster_id]:
            optimal_playlist.append(song)

        # Build the response
    response_data = {
        "optimal_playlist": [],
    }

    for i, song in enumerate(optimal_playlist):
        song_data = get_song_data(song)
        track = sp.track(song)  # Get the full track object

        position = i + 1
        track_name = track["name"]
        artist = track["artists"][0]["name"]
        album_name = track["album"]["name"]
        
        try:
            album_cover = track["album"]["images"][0]["url"]
        except IndexError:
            album_cover = None

        popularity = track["popularity"]
        tempo = song_data["tempo"]
        danceability = song_data["danceability"]

        response_data["optimal_playlist"].append({
            "position": position,
            "track_name": track_name,
            "artist": artist,
            "album_name": album_name,
            "album_cover": album_cover,
            "popularity": popularity,
            "tempo": tempo,
            "danceability": danceability,
            "uri": song,  # Add this line to include the URI
        })

    return jsonify(response_data), 200

if __name__ == "__main__":
    app.run()