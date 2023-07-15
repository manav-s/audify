import React, { useState, useEffect, useCallback } from "react";
import { InformationCircleIcon } from "@heroicons/react/outline";
import InfoDialog from "./InfoDialog";
import SpotifyAuth from "./SpotifyAuth";
import OptimizedPlaylist from "./OptimizedPlaylist";
import ErrorDialog from "./ErrorDialog";
import PlaylistForm from "./PlaylistForm";
import axios from "axios";
import { optimizePlaylist, reorderPlaylist } from "../utils/api";
import { css } from "@emotion/react";
import { ScaleLoader } from "react-spinners";

const Home = () => {
  // Define states for the component
  const [playlistLink, setPlaylistLink] = useState("");
  const [open, setOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [optimalPlaylist, setOptimalPlaylist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [cancelSource, setCancelSource] = useState(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

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
      console.log("Response:", response); // Debugging statement
      setOptimalPlaylist(response.optimal_playlist);
      setOpen(true);
    } catch (error) {
      // Handle request cancellation and other errors
      if (axios.isCancel(error)) {
        console.log("Request canceled:", error.message);
      } else {
        console.error("Error fetching data:", error);
        setErrorOpen(true);
      }
    } finally {
      setLoading(false); // Set loading to false after the optimization process is complete
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
    window.location = "https://audifyapp.netlify.app/home"; // Redirect the app to home
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
            redirect_uri: "https://audifyapp.netlify.app/home",
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
        setLoadingPhrase(loadingPhrases[index % loadingPhrases.length]);
        index++;
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [loading]);

  const override = css`
    display: block;
    margin: 0 auto;
  `;

  return (
    <div className="overflow-hidden">
      <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center">
        <SpotifyAuth
          callback={handleAuthCode}
          loggedIn={isLoggedIn()}
          handleLogout={handleLogout}
          accessToken={accessToken}
        />

        <h1 className="text-5xl font-extrabold mb-4 text-green-400">Audify.</h1>
        <h2 className="mb-8 font-bold text-slate-300 text-lg">
          Generate the perfect set with powerful machine learning algorithms
        </h2>

        <PlaylistForm
          playlistLink={playlistLink}
          setPlaylistLink={setPlaylistLink}
          handleSubmit={handleSubmit}
        />

        <InformationCircleIcon
          onClick={() => setInfoDialogOpen(true)}
          className="absolute bottom-4 h-10 w-10 text-white hover:text-green-400"
        />
      </div>

      {loading && !open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="flex items-center justify-center">
            <ScaleLoader color="#ffffff" loading={true} css={override} />
            <h3 className="text-white text-xl ml-4">{loadingPhrase}</h3>
          </div>
        </div>
      )}

      <OptimizedPlaylist
        open={open}
        optimalPlaylist={optimalPlaylist}
        handleClose={handleClose}
        isLoggedIn={isLoggedIn()}
        modifyPlaylist={modifyPlaylist}
      />

      {errorOpen && <ErrorDialog handleErrorClose={handleErrorClose} />}

      <InfoDialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
      />
    </div>
  );
};

export default Home;
