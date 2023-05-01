import React, { useState, useEffect } from "react";
import axios from "axios";

const Home = () => {
  const [playlistLink, setPlaylistLink] = useState("");
  const [open, setOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [optimalPlaylist, setOptimalPlaylist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!playlistLink || !isValidURL(playlistLink)) {
      setErrorOpen(true);
      return;
    }

    setLoading(true);

    // Call your Flask backend API to get the optimized playlist
    try {
      console.log(playlistLink);
      const response = await axios.post(
        "http://localhost:5000/optimize_playlist",
        {
          playlist_link: playlistLink,
        }
      );

      setOptimalPlaylist(response.data.optimal_playlist);
      setOpen(true);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrorOpen(true);
    }
  };

  function isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }


  const loadingPhrases = [
    "Calculating song key compatibility...",
    "Minimizing tempo differences...",
    "Comparing and contrasting genres...",
    "Finalizing the optimal playlist...",
    "Analyzing the vibe...",
    "Dusting off the turntables...",
    "Harmonizing melodies...",
    "Syncing beats per minute...",
    "Discovering hidden gems...",
    "Shuffling the deck...",
    "Fine-tuning the playlist...",
    "Crossfading tracks...",
    "Setting the groove...",
    "Calculating the perfect mix...",
    "Blending musical flavors...",
    "Balancing energy levels...",
    "Creating the ultimate auditory experience...",
    "Matching moods and emotions...",
    "Finding the right rhythm...",
    "Mixing tempos and keys...",
    "Preparing for the grand finale...",
    "Optimizing track transitions...",
    "Scouring the music archives...",
    "Bringing the beat back...",
    "Adding a touch of magic...",
    "Curating the perfect setlist...",
  ];

  const handleClose = () => {
    setOpen(false);
    setPlaylistLink("");
  };

  const handleErrorClose = () => {
    setErrorOpen(false);
    setPlaylistLink("");
  };

  useEffect(() => {
    if (loading) {
      let index = 0;
      const interval = setInterval(() => {
        setLoadingPhrase(loadingPhrases[index % loadingPhrases.length]);
        index++;
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [loading]);

    return (
      <>
        <div
          className={`container bg-gradient-to-r from-green-600 to-black shadow-lg max-w-full w-full mx-auto px-4 flex flex-col items-center justify-center min-h-screen text-white ${
            loading ? "blur" : ""
          }`}
        >
          <button className="fixed top-[5%] right-[10%] bg-white text-black font-bold py-2 px-6 rounded-full">
            Log in
          </button>

          <h1 className="text-5xl font-bold mb-8 shadow-xl">Audify.</h1>
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <input
              type="text"
              className="block w-full py-2 px-4 mb-4 rounded border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-black"
              placeholder="Playlist Link"
              value={playlistLink}
              onChange={(e) => setPlaylistLink(e.target.value)}
            />
            <button
              type="submit"
              className="block w-full py-1 px-2 rounded bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              Optimize
            </button>
          </form>
        </div>

        {loading && (
          <div className="text-white fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-gray-800 p-8 rounded-lg">
              <p>{loadingPhrase}</p>
            </div>
          </div>
        )}

        {open && (
          <div className="fixed text-white inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-gray-800 p-8 rounded-lg w-[85%]">
              <h2 className="text-3xl font-bold mb-4">
                Optimized Playlist Order
              </h2>
              <div className="overflow-x-auto overflow-y-auto h-96">
                <table className="table-fixed w-full">
                  <thead>
                    <tr>
                      <th className="w-[5%] text-left"></th>
                      <th className="w-[10%] text-left"></th>
                      <th className="w-[25%] text-left">Track Name</th>
                      <th className="w-[15%] text-left">Artist</th>
                      <th className="w-[20%] text-left">Album Name</th>
                      <th className="w-[10%] text-left">Tempo (BPM)</th>
                      <th className="w-[10%] text-left">Popularity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optimalPlaylist.map((song, index) => (
                      <tr key={song.position} className="mb-2">
                        <td className="py-2">{index + 1}</td>
                        <td>
                          <img
                            src={song.album_cover}
                            alt={song.album_name}
                            className="w-16 h-16"
                          />
                        </td>
                        <td className="py-2">{song.track_name}</td>
                        <td className="py-2">{song.artist}</td>
                        <td className="py-2">{song.album_name}</td>
                        <td className="py-2">{song.tempo}</td>
                        <td className="py-2">{song.popularity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                className="block mt-4 ml-auto py-1 px-2 rounded bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {errorOpen && (
          <div className="fixed inset-0 text-white flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-gray-800 p-8 rounded-lg">
              <h2 className="text-3xl font-bold mb-4">Error</h2>
              <p>
                Try a different playlist. Please make sure that the playlist is
                public!
              </p>
              <button
                className="block mt-4 ml-auto py-1 px-2 rounded bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                onClick={handleErrorClose}
              >
                X
              </button>
            </div>
          </div>
        )}
      </>
    );
};

export default Home;
