import React from "react";

const LoadingOverlay = ({ loadingPhrase, cancelLoading }) => {
  return (
    <div className="text-white fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-gray-800 p-8 rounded-lg flex justify-between items-center">
        <p className="mr-4">{loadingPhrase}</p>
        <button
          className="block py-1 px-2 rounded bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
          onClick={cancelLoading}
        >
          X
        </button>
      </div>
    </div>
  );
};

export default LoadingOverlay;
