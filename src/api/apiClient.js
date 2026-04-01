import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const api = axios.create({
  baseURL: "https://localguider.sinfode.com/api/",
  timeout: 30000,
});

// 🔐 REQUEST INTERCEPTOR
api.interceptors.request.use(
  async (config) => {
    const noAuthUrls = ["/user/login", "/user/register"];

    // ✅ Add token if not login/register
    if (!noAuthUrls.some((url) => config.url.includes(url))) {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 🔥 SMART CONTENT‑TYPE HANDLING
    if (config.data instanceof FormData) {
      // ✅ Keep explicit multipart (as in your working version)
      config.headers["Content-Type"] = "multipart/form-data";
    } else if (!config.headers["Content-Type"]) {
      // Only set if the caller hasn't already specified a Content-Type
      if (typeof config.data === "object" && !(config.data instanceof URLSearchParams)) {
        config.headers["Content-Type"] = "application/json";
      } else if (typeof config.data === "string") {
        config.headers["Content-Type"] = "application/x-www-form-urlencoded";
      }
    }

    console.log("📤 API REQUEST:", config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// ❗ RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    console.log("✅ API SUCCESS:", response.data);
    return response;
  },
  async (error) => {
    console.log("❌ FULL ERROR 👉", JSON.stringify(error, null, 2));

    if (error.response) {
      console.log("📥 SERVER ERROR:", error.response.data);
    } else if (error.request) {
      console.log("🚫 NETWORK ERROR (NO RESPONSE)");
    }

    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("token");
      console.log("Session expired");
    }

    return Promise.reject(error);
  }
);

export default api;