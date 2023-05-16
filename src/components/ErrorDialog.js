import React from "react";

const ErrorDialog = ({ handleErrorClose }) => {
  return (
    <div className="fixed inset-0 text-white flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-gray-800 p-8 rounded-lg">
        <h2 className="text-3xl font-bold mb-4">Error</h2>
        <p>
          Try a different playlist. Please make sure that the playlist is
          public!
        </p>
        <button
          className="block mt-4 ml-auto py-1 px-2 rounded bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
          onClick={handleErrorClose} // Close the error message
        >
          X
        </button>
      </div>
    </div>
  );
};

export default ErrorDialog;
