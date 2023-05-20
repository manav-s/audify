import React, { useEffect, useState } from "react";
import { getUserProfile } from "../utils/api";

const SpotifyAuth = ({ callback, loggedIn, handleLogout, accessToken }) => {
  const authEndpoint = "https://accounts.spotify.com/authorize";
  const clientId = process.env.REACT_APP_CLIENT_ID;
  const redirectUri = "http://localhost:3000";
  const scopes = [
    "user-library-read",
    "playlist-read-private",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-read-private",
  ];
  const responseType = "code";

  const handleLogin = () => {
    const url = `${authEndpoint}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(
      scopes.join(" ")
    )}&response_type=${responseType}`;

    window.location = url;
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    if (query.has("code")) {
      const authCode = query.get("code");
      callback(authCode);
    }
  }, [callback]);

  const [userName, setUserName] = useState(""); // State to store the user's name
  const [profilePicture, setProfilePicture] = useState(""); // State to store the user's profile picture

  const fetchUserProfile = async () => {
    try {
      const userProfile = await getUserProfile(accessToken);
      setUserName(userProfile.display_name);
      setProfilePicture(userProfile.images?.[0]?.url);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    if (loggedIn) {
      fetchUserProfile();
    }
  }, [loggedIn]);

  return (
    // Add a 'fixed' position and specify 'top' and 'right' properties
    <div className="fixed top-[2%] right-[2%] p-4 flex items-center justify-end">
      {loggedIn && profilePicture && (
        <img
          src={profilePicture}
          alt="Profile"
          className="w-8 h-8 rounded-full mr-2"
        />
      )}
      {loggedIn && (
        <span className="text-white font-bold text-sm pr-3">
          Hi, {userName || "user"}
        </span>
      )}
      <button
        onClick={loggedIn ? handleLogout : handleLogin}
        className="auth-button bg-white text-black font-bold hover:bg-slate-400 py-2 px-6 rounded-full"
      >
        {loggedIn ? "Log Out" : "Log In"}
      </button>
    </div>
  );
};

export default SpotifyAuth;
