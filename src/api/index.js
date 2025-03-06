// API utilities for making requests to the Flask backend

const API_BASE_URL = ""; // Empty string for same-origin requests

/**
 * Get an OpenAI token for a specific language
 * @param {string} language - Language code (e.g., 'en')
 * @returns {Promise<Object>} Token response
 */
export const getOpenAIToken = async (language = "en") => {
  try {
    const response = await fetch(`${API_BASE_URL}/token/${language}/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching token:", error);
    throw error;
  }
};

/**
 * Upload audio recording to the server
 * @param {Blob} audioBlob - The audio recording as a Blob
 * @returns {Promise<Object>} Upload response
 */
export const uploadAudio = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};
