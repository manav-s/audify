import React, { useState } from 'react';
import Modal from 'react-modal';
import { TailSpin } from 'react-loader-spinner';

const Simcheck = () => {
  const [playlist1, setPlaylist1] = useState('');
  const [playlist2, setPlaylist2] = useState('');
  const [similarityPercentage, setSimilarityPercentage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalIsOpen(true);
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/compare_playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playlist1_link: playlist1,
          playlist2_link: playlist2,
        }),
      });

      const data = await response.json();
      setSimilarityPercentage(data.similarity_percentage.toFixed(2));
    } catch (error) {
      console.error('Error:', error);
      setSimilarityPercentage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSimilarityPercentage('');
  };

  const handleInputChange = (e) => {
    if (e.target.id === 'playlist1') {
      setPlaylist1(e.target.value);
    } else if (e.target.id === 'playlist2') {
      setPlaylist2(e.target.value);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black">
      <h1 className="text-5xl font-extrabold mb-4 text-green-400">Audify.</h1>
      <h2 className="mb-8 font-bold text-slate-300 text-lg">
        Compare and analyze playlists with advanced machine learning algorithms
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-4">
        <div className="flex space-x-4">
          <input
            type="text"
            id="playlist1"
            placeholder="Playlist 1"
            value={playlist1}
            onChange={handleInputChange}
            required
            className="border border-gray-300 rounded p-2 bg-white text-black"
          />
          <input
            type="text"
            id="playlist2"
            placeholder="Playlist 2"
            value={playlist2}
            onChange={handleInputChange}
            required
            className="border border-gray-300 rounded p-2 bg-white text-black"
          />
        </div>
        <button
          type="submit"
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 ease-in-out"
          style={{ borderRadius: '0' }}
        >
          Compare
        </button>
      </form>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className="modal"
        overlayClassName="overlay"
      >
        <div className="flex flex-col items-center justify-center">
          {isLoading ? (
            <>
              <TailSpin color="#1DB954" height={80} width={80} />
              <div className="text-white mt-4">Loading...</div>
            </>
          ) : (
            <>
              <div className="text-white text-3xl mb-4">Similarity Percentage</div>
              <div className="text-white text-5xl font-bold mb-4">{similarityPercentage}%</div>
              <button
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
                onClick={closeModal}
              >
                Close
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Simcheck;
