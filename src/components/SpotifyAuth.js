import React, { useEffect } from "react";

const SpotifyAuth = ({ callback, loggedIn, handleLogout }) => {
  const authEndpoint = "https://accounts.spotify.com/authorize";
  const clientId = "3519692942004325a2c7160c90717ca5";
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

  return (
    <button
      onClick={loggedIn ? handleLogout : handleLogin}
      className="fixed top-[5%] right-[10%] bg-white text-black font-bold hover:bg-slate-400 py-2 px-6 rounded-full"
    >
      {loggedIn ? "Log Out" : "Log In"}
    </button>
  );
};

export default SpotifyAuth;