import React from "react";

const ErrorDialog = ({ handleErrorClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-sm text-gray-800">
        <h2 className="text-3xl font-bold mb-4">Error</h2>
        <p className="text-sm mb-6">
          Oops! An error occurred while processing your request. Please try again later.
        </p>
        <div className="flex justify-center">
          <button
            className="text-white text-sm py-2 px-4 rounded bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
            onClick={handleErrorClose} // Close the error message
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDialog;
