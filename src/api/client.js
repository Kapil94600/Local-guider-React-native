import axios from "axios";

const API_BASE = "https://localguider.sinfode.com/api";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    throw error;
  }
);

export default client;
