import api from "./apiClient";

export const registerUser = (data) =>
  api.post("/user/register", data);

export const loginUser = (data) =>
  api.post("/user/login", data);

export const forgetPassword = (data) =>
  api.post("/user/forget_password", data);

export const getProfile = () =>
  api.post("/user/get_profile");

export const updateProfile = (data) =>
  api.post("/user/update_profile");

export const changePassword = (data) =>
  api.post("/user/change_password");
