import React from "react";

const OptimizedPlaylist = ({
  open,
  optimalPlaylist,
  handleClose,
  isLoggedIn,
  modifyPlaylist,
}) => {
  return (
    open && (
      <div className="fixed text-white inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-gray-800 p-8 rounded-lg w-[85%]">
          <h2 className="text-3xl font-bold mb-4">Optimized Playlist Order</h2>
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
          {isLoggedIn && (
            <button
              className="block mt-4 text-black ml-auto py-1 px-4 rounded-full bg-white hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-green-400"
              onClick={modifyPlaylist}
            >
              Modify current playlist ordering
            </button>
          )}
          <button
            className="block mt-4 ml-auto py-1 px-4 rounded-full bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    )
  );
};

export default OptimizedPlaylist;
