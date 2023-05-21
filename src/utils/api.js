import axios from "axios";

// Define the base URL for your API
const API_BASE_URL = "http://localhost:5001";
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET;

// Function to optimize a playlist
export const optimizePlaylist = async (playlistLink, cancelSource) => {
  const response = await axios.post(
    `${API_BASE_URL}/optimize_playlist`,
    { playlist_link: playlistLink },
    { cancelToken: cancelSource.token }
  );
  return response.data;
};

// Function to reorder a playlist
export const reorderPlaylist = async (playlistId, newUris, accessToken) => {
  const response = await axios.post(
    `${API_BASE_URL}/reorder_playlist`,
    {
      playlist_id: playlistId,
      new_uris: newUris,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.data;
};

// Function to get user's profile information
export const getUserProfile = async (accessToken) => {
  const response = await axios.get("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};
