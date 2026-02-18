import api from "../apiClient";
import { AUTH } from "../endpoints";

// ✅ Login API
export const loginUser = async (data) => {
  try {
    const res = await api.post("/user/login", {
      phone: data.phone,        // ✅ backend expects phone
      password: data.password,
    });
    return res.data;            // ✅ return plain JSON, not class
  } catch (err) {
    console.error("Login API Error:", err.response?.data || err.message);
    throw err;
  }
};

