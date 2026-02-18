import axios from "axios";

const api = axios.create({
  baseURL: "https://localguider.sinfode.com", // ❌ NOT /api here
  timeout: 10000,
});

export default api;
