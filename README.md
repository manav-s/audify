## Getting started

To start using the app:

1. Start the frontend by simply running 'npm start'
2. Start the backend by running 'python kmeansprod.py'

![Image 1](images/image-1.png)
![Image 2](images/image-2.png)

## How does alchemy.py work?

This Python script is a Flask web application that optimizes a given Spotify playlist by minimizing the transition cost between songs. The transition cost is calculated based on the difference in various audio features of the songs. The app uses the Spotify API to fetch information about the songs and their audio features. The Flask server exposes a single API endpoint /optimize_playlist to accept a Spotify playlist link and return an optimized playlist.

### Key concepts and components:

1. get_relative_key(key, mode): A function that calculates the relative major or minor key given the current key and mode.

2. key_compatibility(key1, mode1, key2, mode2): A function that checks if two keys are compatible based on their relative major or minor keys.

3. genre_similarity(genres1, genres2): A function that calculates genre similarity between two songs based on the number of shared genres.

4. evaluate_transition(song1, song2): A function that calculates the transition cost between two songs based on various attributes such as key compatibility, genre similarity, danceability, energy, loudness, tempo, and valence.

5. get_related_artist_genres(artist_id): A function that retrieves the genres of related artists for a given artist ID.

6. get_song_data(track_id): A function that fetches the track information and audio features for a given track ID.

7. beam_search(songs, beam_width=3): A function that searches for an optimal playlist arrangement using the beam search algorithm, which is a heuristic search algorithm that explores a limited number of states at each level of the search tree. The algorithm returns the optimized playlist and its transition cost.

8. optimize_playlist(): The main Flask route that handles incoming POST requests, takes a playlist link, and returns an optimized playlist with the desired attributes (position, track name, artist, album name, album cover, popularity, tempo (bpm), danceability, and energy) for each song.

To use this application, run the script, which will start the Flask server. Then, send a POST request to the /optimize_playlist endpoint with the Spotify playlist link as input. The server will return a JSON response containing the optimized playlist and its transition cost.
