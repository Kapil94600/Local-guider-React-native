import api from "./api";

export const loginUser = (data) => api.post("/user/login", data);
export const registerUser = (data) => api.post("/user/register", data);
export const getProfile = () => api.get("/user/get_profile");
