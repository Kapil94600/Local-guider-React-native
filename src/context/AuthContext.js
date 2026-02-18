import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";

export const AuthContext = createContext();

const normalizeUser = (data) => {
  if (!data) return null;

  const base = data.user ? data.user : data;

  const isAdmin = base.admin === true || base.role === "ADMIN";
  const isGuider = base.guider === true || base.role === "GUIDER";
  const isPhotographer =
    base.photographer === true || base.role === "PHOTOGRAPHER";

  return {
    id: base.id,
    name: base.name || base.username || "User",
    username: base.username,
    phone: base.phone,
    email: base.email,
    address: base.address,
    gender: base.gender,
    dob: base.dob,
    countryCode: base.countryCode,
    latitude: base.latitude,
    longitude: base.longitude,
    profile: base.profile,

    admin: isAdmin,
    guider: isGuider,
    photographer: isPhotographer,

    isAdmin,
    role: isAdmin
      ? "ADMIN"
      : isGuider
      ? "GUIDER"
      : isPhotographer
      ? "PHOTOGRAPHER"
      : "USER",

    token: data.token || base.token,
    refreshToken: data.refreshToken,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  /* 🔥 AUTO LOAD TOKEN ON APP START */
  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        refreshUser();
      }
    };
    loadToken();
  }, []);

  /* ✅ LOGIN */
  const login = async (loginResponse) => {
    const normalized = normalizeUser(loginResponse);

    if (normalized?.token) {
      await AsyncStorage.setItem("token", normalized.token);

      // 🔥 IMPORTANT FIX
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${normalized.token}`;
    }

    setUser(normalized);
  };

  /* ✅ REFRESH PROFILE */
  const refreshUser = async () => {
    try {
      const res = await api.post("/user/get_profile");

      if (res?.data?.status === true && res.data.data) {
        setUser(normalizeUser(res.data.data));
      }
    } catch (err) {
      console.log("refreshUser failed", err?.response?.status);
    }
  };

  /* ✅ UPDATE PROFILE */
  const updateProfile = async (payload) => {
    const res = await api.post("/user/update_profile", payload);

    if (res?.data?.status === true) {
      setUser((prev) =>
        normalizeUser({
          ...prev,
          ...payload,
        })
      );
    }

    return res.data;
  };

  /* ✅ ROLE REQUEST */
  const requestRole = async (requestedRole) => {
    try {
      const res = await api.post("/user/request_role", {
        role: requestedRole,
      });
      return res.data;
    } catch (err) {
      return { status: false, message: "Something went wrong" };
    }
  };

  /* ✅ LOGOUT */
  const logout = async () => {
    await AsyncStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, refreshUser, updateProfile, requestRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};
