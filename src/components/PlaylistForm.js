import React, { useState } from "react";

const PlaylistForm = ({ playlistLink, setPlaylistLink, handleSubmit }) => {
  const [isInputEmpty, setIsInputEmpty] = useState(true);

  const handleInputChange = (e) => {
    setPlaylistLink(e.target.value);
    setIsInputEmpty(e.target.value === "" || !isValidSpotifyLink(e.target.value));
  };

  const isValidSpotifyLink = (link) => {
    return link.startsWith("https://open.spotify.com/");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <input
        type="text"
        className="block w-full py-2 px-4 mb-4 rounded border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-black"
        placeholder="Playlist Link"
        value={playlistLink}
        onChange={handleInputChange}
      />
      {!isInputEmpty && (
        <button
          type="submit"
          className="block w-full py-1 px-2 rounded bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          Optimize
        </button>
      )}
      <style>
        {`
          @keyframes fade-in {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }
          .animate-fade-in {
            animation: fade-in 0.5s forwards;
          }
        `}
      </style>
    </form>
  );
};

export default PlaylistForm;
