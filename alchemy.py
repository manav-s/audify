import heapq
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor


def get_relative_key(key, mode):
    if mode == 1:  # Major key
        return (key + 9) % 12  # Relative minor key
    else:  # Minor key
        return (key + 3) % 12  # Relative major key


def key_compatibility(key1, mode1, key2, mode2):
    if key1 == key2:
        return True
    if mode1 != mode2 and (key1 == get_relative_key(key2, mode2) or key2 == get_relative_key(key1, mode1)):
        return True
    return False


def genre_similarity(genres1, genres2):
    if not genres1 or not genres2:
        return 0
    shared_genres = len(set(genres1).intersection(genres2))
    # print("shared_genres: ", shared_genres)
    # print("shared_genres / max(len(genres1), len(genres2)): ", shared_genres / max(len(genres1), len(genres2)))

    # max of 5 shared genres
    return min(shared_genres, 5)


def evaluate_transition(song1, song2):
    score = 0
    # total genres for a given song
    max_genres = 10

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
            # if they have 5 in common, it is going to add 0
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
        # print("attribute: ", attribute, "   score: ", weights[attribute] * diff[attribute])
        score += weights[attribute] * diff[attribute]

    return score


@lru_cache(maxsize=128)
def get_related_artist_genres(artist_id):
    related_artists = sp.artist_related_artists(artist_id)
    genres = []
    for artist in related_artists['artists']:
        genres.extend(artist['genres'])
    return list(set(genres))


@lru_cache(maxsize=128)
def get_song_data(track_id):
    track = sp.track(track_id)
    audio_features = sp.audio_features(track_id)[0]
    artist_id = track['artists'][0]['id']
    genres = get_related_artist_genres(artist_id)

    song_data = audio_features.copy()
    song_data['genre'] = genres
    song_data['track_name'] = track['name']
    return song_data


def beam_search(songs, beam_width=3):
    # Fetch song data in parallel
    with ThreadPoolExecutor() as executor:
        song_data_map = {song: data for song, data in zip(
            songs, executor.map(get_song_data, songs))}

    # Initialize the search space with the initial state
    search_space = [([], songs, 0)]

    while search_space:
        # Keep track of the next states with their corresponding costs
        next_states = []

        for state in search_space:
            playlist, remaining_songs, cost = state

            # If there are no remaining songs, we have a complete playlist
            if not remaining_songs:
                return playlist, cost

            # Generate possible next states by adding one of the remaining songs
            for song in remaining_songs:
                if song not in playlist:
                    new_remaining_songs = remaining_songs.copy()
                    new_remaining_songs.remove(song)
                    new_playlist = playlist + [song]

                    if len(new_playlist) > 1:
                        last_song = song_data_map[playlist[-1]]
                        current_song = song_data_map[song]
                        transition_cost = evaluate_transition(
                            last_song, current_song)
                    else:
                        transition_cost = 0

                    new_cost = cost + transition_cost
                    next_states.append(
                        (new_playlist, new_remaining_songs, new_cost))

        # Keep only the best 'beam_width' states for the next iteration
        # You can experiment with beam width lengths.
        search_space = heapq.nsmallest(
            beam_width, next_states, key=lambda x: x[2])

    return None, float('inf')


app = Flask(__name__)
CORS(app)

cid = "3519692942004325a2c7160c90717ca5"
secret = "9243be1df96e48bb829c4b07254bd82c"

client_credentials_manager = SpotifyClientCredentials(
    client_id=cid, client_secret=secret)
sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)


@app.route('/optimize_playlist', methods=['POST'])
def optimize_playlist():
    data = request.get_json()
    playlist_link = data.get('playlist_link')
    if not playlist_link:
        return jsonify({"error": "playlist_link is required"}), 400

    uri = playlist_link.split("/")[-1].split("?")[0]
    track_uris = [x["track"]["uri"] for x in sp.playlist_tracks(uri)["items"]]
    optimal_playlist, cost = beam_search(track_uris, beam_width=3)

    response_data = {
        "optimal_playlist": [],
        "transition_cost": round(cost, 2)
    }

    for i, song in enumerate(optimal_playlist):
        song_data = get_song_data(song)
        track = sp.track(song)  # Get the full track object

        # Extract the required data from the track object
        position = i + 1
        track_name = track["name"]
        artist = track["artists"][0]["name"]
        album_name = track["album"]["name"]
        album_cover = track["album"]["images"][0]["url"]
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
        })

    return jsonify(response_data), 200


if __name__ == "__main__":
    app.run(debug=True)
