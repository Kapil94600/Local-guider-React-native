import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/apiClient";

export const AuthContext = createContext();

const normalizeUser = (data) => {
  if (!data) return null;
  const base = data.user ? data.user : data;

  // Role Logic: Admin > Photographer > Guider > User
  let userRole = "USER";
  if (base.username === "admin" || base.id === 1) {
    userRole = "ADMIN";
  } else if (base.photographer === true || base.pid) {
    userRole = "PHOTOGRAPHER";
  } else if (base.guider === true || base.gid) {
    userRole = "GUIDER";
  }

  return {
    id: base.id,
    gid: base.gid,               // Guider ID
    pid: base.pid,               // Photographer ID (Added)
    name: base.name || base.username || "User",
    username: base.username,
    phone: base.phone,
    email: base.email,
    profile: base.profile,
    isGuider: base.guider === true,
    isPhotographer: base.photographer === true,
    role: userRole,              // "ADMIN", "PHOTOGRAPHER", "GUIDER", or "USER"
    token: data.token || base.token,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorage = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const savedUser = await AsyncStorage.getItem("user_data");
        
        if (token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
          await refreshUser();
        }
      } catch (e) {
        console.log("Auth Load Error:", e);
      } finally {
        setLoading(false);
      }
    };
    loadStorage();
  }, []);

  const login = async (loginResponse) => {
    const normalized = normalizeUser(loginResponse);
    if (normalized?.token) {
      await AsyncStorage.setItem("token", normalized.token);
      await AsyncStorage.setItem("user_data", JSON.stringify(normalized));
      
      api.defaults.headers.common["Authorization"] = `Bearer ${normalized.token}`;
      setUser(normalized);
      return normalized.role; // Navigation के लिए रोल वापस भेजें
    }
    return null;
  };

  const refreshUser = async () => {
    try {
      const res = await api.post("/user/get_profile");
      if (res?.data?.status && res.data.data) {
        const updated = normalizeUser(res.data.data);
        setUser(updated);
        await AsyncStorage.setItem("user_data", JSON.stringify(updated));
      }
    } catch (err) {
      console.log("Profile refresh failed:", err?.response?.status);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user_data");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};