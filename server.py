import heapq
from flask import Flask, request, jsonify
import os
import spotipy
from dotenv import load_dotenv
from spotipy.oauth2 import SpotifyClientCredentials
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
from sklearn.cluster import AgglomerativeClustering
from spotipy.exceptions import SpotifyException
import numpy as np
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)


client_credentials_manager = SpotifyClientCredentials(
    client_id=os.getenv("CLIENT_ID"),
    client_secret=os.getenv("CLIENT_SECRET"),
)

sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)

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

def find_best_transition(single_track, playlist_tracks):
    # Fetch song data in parallel
    with ThreadPoolExecutor() as executor:
        song_data_map = {song: data for song, data in zip(
            playlist_tracks, executor.map(get_song_data, playlist_tracks)) if data is not None}

    single_track_data = get_song_data(single_track)
    transition_scores = {track: evaluate_transition(
        single_track_data, song_data) for track, song_data in song_data_map.items()}

    best_transition_track_uri = min(
        transition_scores, key=transition_scores.get)

    best_transition_track = sp.track(best_transition_track_uri)

    return best_transition_track

@app.route('/find_best_transition', methods=['POST'])
def find_best_transition():
    data = request.get_json()
    single_track = data.get('single_track')
    playlist_link = data.get('playlist_link')

    if not single_track or not playlist_link:
        return jsonify({"error": "Both single_track and playlist_link are required"}), 400

    uri = playlist_link.split("/")[-1].split("?")[0]
    playlist_tracks = [x["track"]["uri"] for x in get_all_playlist_tracks(uri)]

    # Fetch song data in parallel
    with ThreadPoolExecutor() as executor:
        song_data_map = {song: data for song, data in zip(
            playlist_tracks, executor.map(get_song_data, playlist_tracks)) if data is not None}

    single_track_data = get_song_data(single_track)
    transition_scores = {track: evaluate_transition(single_track_data, song_data) for track, song_data in song_data_map.items()}

    best_transition_track = min(transition_scores, key=transition_scores.get)

    # Get track details
    track = sp.track(best_transition_track)
    track_name = track["name"]
    artist = track["artists"][0]["name"]

    # Get tempo details
    original_track_tempo = single_track_data['tempo']
    best_track_tempo = song_data_map[best_transition_track]['tempo']

    response_data = {
        "original_track": {
            "uri": single_track,
            "tempo": original_track_tempo,
        },
        "best_transition_track": {
            "track_name": track_name,
            "artist": artist,
            "uri": best_transition_track,
            "tempo": best_track_tempo,
        }
    }

    return jsonify(response_data), 200

@app.route('/b2b_playlist', methods=['POST'])
def generate_b2b_playlist():
    data = request.get_json()
    playlist1_link = data.get('playlist1_link')
    playlist2_link = data.get('playlist2_link')

    if not playlist1_link or not playlist2_link:
        return jsonify({"error": "Both playlist1_link and playlist2_link are required"}), 400

    # Get track URIs from playlist1
    playlist1_uri = playlist1_link.split("/")[-1].split("?")[0]
    playlist1_tracks = [x["track"]["uri"]
                        for x in get_all_playlist_tracks(playlist1_uri)]

    # Get track URIs from playlist2
    playlist2_uri = playlist2_link.split("/")[-1].split("?")[0]
    playlist2_tracks = [x["track"]["uri"]
                        for x in get_all_playlist_tracks(playlist2_uri)]

    if not playlist1_tracks or not playlist2_tracks:
        return jsonify({"error": "One or both playlists are empty or not accessible"}), 400

    b2b_playlist = []

    # Start with the first track from playlist1
    current_track = playlist1_tracks[0]
    b2b_playlist.append(sp.track(current_track))

    # Iterate through playlist2 and playlist1 alternately
    while playlist2_tracks:
        try:
            best_transition_track = find_best_transition(
                current_track, playlist2_tracks)
            b2b_playlist.append(best_transition_track)

            # Remove the used track from playlist2
            playlist2_tracks.remove(best_transition_track['uri'])

            if playlist1_tracks:
                # Find the best track from playlist1 excluding the current track
                current_track = playlist1_tracks[0]
                playlist1_tracks.remove(current_track)
        except SpotifyException as e:
            return jsonify({"error": str(e)}), 500

    # Build the response
    response_data = {
        "b2b_playlist": []
    }

    for i, track in enumerate(b2b_playlist):
        position = i + 1
        track_name = track["name"]
        artist = track["artists"][0]["name"]
        album_name = track["album"]["name"]

        try:
            album_cover = track["album"]["images"][0]["url"]
        except IndexError:
            album_cover = None

        popularity = track["popularity"]
        tempo = track["tempo"]
        danceability = track["danceability"]

        response_data["b2b_playlist"].append({
            "position": position,
            "track_name": track_name,
            "artist": artist,
            "album_name": album_name,
            "album_cover": album_cover,
            "popularity": popularity,
            "tempo": tempo,
            "danceability": danceability,
            "uri": track["uri"],
        })

    return jsonify(response_data), 200

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

        return {"message": "Playlist reordered successfully. However, if you don't have full access it may not be available to you. Please email sharma.manav@northeastern.edu so we can add you to authorized users."}
    except Exception as e:
        return {"error": str(e)}

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


@app.route('/generate_warmup', methods=['POST'])
def generate_warmup():
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

    # Sort the songs by tempo and energy, in ascending order
    warmup_songs = dict(sorted(song_data_map.items(), key=lambda item: (
        item[1]['tempo'], item[1]['energy'])))

    # Create response
    response_data = {"warmup_playlist": []}

    for i, song in enumerate(warmup_songs.keys()):
        song_data = warmup_songs[song]
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

        response_data["warmup_playlist"].append({
            "position": position,
            "track_name": track_name,
            "artist": artist,
            "album_name": album_name,
            "album_cover": album_cover,
            "popularity": popularity,
            "tempo": tempo,
            "danceability": danceability,
            "uri": song,
        })

    return jsonify(response_data), 200


@app.route('/generate_cooldown', methods=['POST'])
def generate_cooldown():
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

    # Filter out songs with tempo greater than 91
    cooldown_songs = {song: data for song,
                      data in song_data_map.items() if data['tempo'] <= 91}

    # Sort the remaining songs by tempo and energy, in descending order
    cooldown_songs = dict(sorted(cooldown_songs.items(), key=lambda item: (
        item[1]['tempo'], item[1]['energy']), reverse=True))

    # Create response
    response_data = {"cooldown_playlist": []}

    for i, song in enumerate(cooldown_songs.keys()):
        song_data = cooldown_songs[song]
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

        response_data["cooldown_playlist"].append({
            "position": position,
            "track_name": track_name,
            "artist": artist,
            "album_name": album_name,
            "album_cover": album_cover,
            "popularity": popularity,
            "tempo": tempo,
            "danceability": danceability,
            "uri": song,
        })

    return jsonify(response_data), 200
    

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
            diff[attribute] = 5 - genre_similarity(song1[attribute], song2[attribute])
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

def calculate_similarity(playlist1_tracks, playlist2_tracks):
    # Fetch song data in parallel for both playlists
    with ThreadPoolExecutor() as executor:
        playlist1_data_map = {song: data for song, data in zip(
            playlist1_tracks, executor.map(get_song_data, playlist1_tracks)) if data is not None}

        playlist2_data_map = {song: data for song, data in zip(
            playlist2_tracks, executor.map(get_song_data, playlist2_tracks)) if data is not None}

    similarity_scores = []
    
    for song1 in playlist1_data_map:
        for song2 in playlist2_data_map:
            score = evaluate_transition(
                playlist1_data_map[song1], playlist2_data_map[song2])
            similarity_scores.append(score)

    max_score = max(similarity_scores)
    similarity_percentage = (1 - (max_score / 600)) * 100

    return similarity_percentage

@app.route('/compare_playlists', methods=['POST'])
def compare_playlists():
    data = request.get_json()
    playlist1_link = data.get('playlist1_link')
    playlist2_link = data.get('playlist2_link')

    if not playlist1_link or not playlist2_link:
        return jsonify({"error": "Both playlist1_link and playlist2_link are required"}), 400

    playlist1_uri = playlist1_link.split("/")[-1].split("?")[0]
    playlist1_tracks = [x["track"]["uri"]
                        for x in get_all_playlist_tracks(playlist1_uri)]

    playlist2_uri = playlist2_link.split("/")[-1].split("?")[0]
    playlist2_tracks = [x["track"]["uri"]
                        for x in get_all_playlist_tracks(playlist2_uri)]

    if not playlist1_tracks or not playlist2_tracks:
        return jsonify({"error": "One or both playlists are empty or not accessible"}), 400

    similarity_percentage = calculate_similarity(
        playlist1_tracks, playlist2_tracks)

    response_data = {
        "similarity_percentage": similarity_percentage
    }

    return jsonify(response_data), 200

if __name__ == "__main__":
    app.run()