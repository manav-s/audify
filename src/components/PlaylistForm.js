import React from "react";

const PlaylistForm = ({ playlistLink, setPlaylistLink, handleSubmit }) => {
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <input
        type="text"
        className="block w-full py-2 px-4 mb-4 rounded border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-black"
        placeholder="Playlist Link"
        value={playlistLink}
        onChange={(e) => setPlaylistLink(e.target.value)} // Update the playlist link state as the user types
      />
      <button
        type="submit"
        className="block w-full py-1 px-2 rounded bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
      >
        Optimize
      </button>
    </form>
  );
};

export default PlaylistForm;
