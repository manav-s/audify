import React, { useState, useEffect, useCallback } from "react";
import { InformationCircleIcon } from "@heroicons/react/outline";
import LoadingOverlay from "./LoadingOverlay";
import SpotifyAuth from "./SpotifyAuth";
import OptimizedPlaylist from "./OptimizedPlaylist";
import ErrorDialog from "./ErrorDialog";
import PlaylistForm from "./PlaylistForm";
import axios from "axios";

import { optimizePlaylist, reorderPlaylist } from "../utils/api";

const Home = () => {
  // Define states for the component
  const [playlistLink, setPlaylistLink] = useState(""); // The link to the playlist to be optimized
  const [open, setOpen] = useState(false); // Boolean to control the display of the optimized playlist
  const [errorOpen, setErrorOpen] = useState(false); // Boolean to control the display of any errors
  const [optimalPlaylist, setOptimalPlaylist] = useState([]); // The optimized playlist
  const [loading, setLoading] = useState(false); // Boolean to control the display of a loading screen
  const [loadingPhrase, setLoadingPhrase] = useState(""); // The phrase to be displayed while loading
  const [accessToken, setAccessToken] = useState(""); // The access token for Spotify
  const [refreshToken, setRefreshToken] = useState(""); // The refresh token for Spotify
  const [cancelSource, setCancelSource] = useState(null); // The cancel token source for axios

  // The function to be called when the form is submitted
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Create a new cancel token
    const source = axios.CancelToken.source();
    setCancelSource(source);

    // Check if the playlist link is a valid URL
    if (!playlistLink || !isValidURL(playlistLink)) {
      setErrorOpen(true);
      return;
    }

    // Call your Flask backend API to get the optimized playlist
    try {
      setLoading(true);
      const response = await optimizePlaylist(playlistLink, source);
      setOptimalPlaylist(response.optimal_playlist);
      setOpen(true);
      setLoading(false);
    } catch (error) {
      // Handle request cancellation and other errors
      if (axios.isCancel(error)) {
        console.log("Request canceled:", error.message);
      } else {
        console.error("Error fetching data:", error);
        setErrorOpen(true);
      }
      setLoading(false);
    }
  };

  // Cleanup function to cancel ongoing request when component unmounts
  useEffect(() => {
    return () => {
      // If a request is ongoing, cancel it
      if (cancelSource) {
        cancelSource.cancel("Operation canceled by the user.");
      }
    };
  }, [cancelSource]);

  // Function to check if a given string is a valid URL
  function isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Array of phrases to be displayed while loading
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

  // Function to close the optimized playlist view
  const handleClose = () => {
    setOpen(false);
    setPlaylistLink("");
  };

  // Function to logout the user
  const handleLogout = () => {
    setAccessToken("");
    setRefreshToken("");
    window.open("https://www.spotify.com/logout", "_blank"); // Log out of Spotify in a new tab
    window.location = "http://localhost:3000"; // Redirect the app to home
  };

  // Function to modify the original playlist based on the optimized order
  const modifyPlaylist = async () => {
    try {
      const playlistId = playlistLink;
      const newUris = optimalPlaylist.map((song) => song.uri);

      const response = await reorderPlaylist(playlistId, newUris, accessToken);

      console.log(response);
      alert("Playlist reordered successfully");
    } catch (error) {
      console.error("Error reordering playlist:", error);
      alert(
        "Error reordering playlist. Please try again. It may be a problem with your permissions!"
      );
    }
  };

  // Function to close the error message view
  const handleErrorClose = () => {
    setErrorOpen(false);
    setPlaylistLink("");
  };

  // Function to check if a user is logged in
  const isLoggedIn = () => {
    return accessToken !== "";
  };

  const handleAuthCode = useCallback(async (authCode) => {
    const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
    const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET;
    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        null,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
          },
          params: {
            grant_type: "authorization_code",
            code: authCode,
            redirect_uri: "http://localhost:3000",
          },
        }
      );

      const { access_token, refresh_token } = response.data;
      console.log("Access Token:", access_token);
      console.log("Refresh Token:", refresh_token);

      // Save the tokens in the state
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
    } catch (error) {
      console.error(
        "Error exchanging authorization code for access token:",
        error
      );
    }
  }, []);

  // A useEffect hook to control the loading phrase that is displayed
  useEffect(() => {
    let interval;

    if (loading) {
      let index = 0;
      interval = setInterval(() => {
        // Set a new loading phrase every second
        setLoadingPhrase(loadingPhrases[index % loadingPhrases.length]);
        index++;
      }, 1000);
    }

    // Clear the interval when the loading is done or component unmounts
    return () => clearInterval(interval);
  }, [loading]);

  // This is the main rendering of the page
  return (
    <>
      {/* Container for the Spotify authorization and form input */}
      <div
        className={`container bg-gradient-to-r from-green-600 to-black shadow-lg max-w-full w-full mx-auto px-4 flex flex-col items-center justify-center min-h-screen text-white ${
          loading ? "blur" : ""
        }`}
      >
        {/* Spotify authentication component */}
        <SpotifyAuth
          callback={handleAuthCode} // Function to handle authorization code
          loggedIn={isLoggedIn()} // Check if user is logged in
          handleLogout={handleLogout} // Function to handle user logout
          accessToken={accessToken}
        />

        {/* Title of the application */}
        <h1 className="text-5xl font-bold mb-4 shadow-xl">Audify.</h1>
        <h2 className="mb-5 font-bold text-slate-300">
          generate the perfect set with powerful machine learning algorithms
        </h2>

        {/* Form for submitting the playlist link */}
        <PlaylistForm
          playlistLink={playlistLink}
          setPlaylistLink={setPlaylistLink}
          handleSubmit={handleSubmit}
        />

        <InformationCircleIcon className="absolute bottom-4 h-10 w-10 text-white hover:text-slate-400" />
      </div>

      {/* Loading overlay component that appears while the playlist is being optimized */}
      {loading && (
        <LoadingOverlay
          loadingPhrase={loadingPhrase}
          cancelLoading={() => {
            if (cancelSource) {
              cancelSource.cancel("Operation canceled by the user."); // Cancel the playlist optimization
            }
          }}
        />
      )}

      {/* Optimized playlist component that displays the optimized playlist */}
      <OptimizedPlaylist
        open={open}
        optimalPlaylist={optimalPlaylist}
        handleClose={handleClose}
        isLoggedIn={isLoggedIn()}
        modifyPlaylist={modifyPlaylist}
      />

      {/* Error message component that appears if an error occurs */}
      {errorOpen && <ErrorDialog handleErrorClose={handleErrorClose} />}
    </>
  );
};

export default Home;
