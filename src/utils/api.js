import axios from "axios";

// Define the base URL for your API
const API_BASE_URL = "http://localhost:5000";

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

// Function to exchange Spotify authorization code for tokens
export const exchangeCodeForTokens = async (authCode) => {
  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    null,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(
          `3519692942004325a2c7160c90717ca5:9243be1df96e48bb829c4b07254bd82c`
        )}`,
      },
      params: {
        grant_type: "authorization_code",
        code: authCode,
        redirect_uri: "http://localhost:3000",
      },
    }
  );
  return response.data;
};
