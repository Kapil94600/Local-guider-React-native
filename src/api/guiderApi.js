import api from "./apiClient";

// 🧾 USER → GUIDER REQUEST
export const requestForGuider = (data) =>
  api.post("/guider/request", data);

// 👑 ADMIN
export const getGuiderRequests = () =>
  api.post("/photographers/all_requests"); // combined

export const respondGuiderRequest = (data) =>
  api.post("/guider/respond_on_request", data);

// 🧭 DATA
export const getAllGuiders = () =>
  api.post("/guider/get_all");

export const getGuidersByPlace = (data) =>
  api.post("/guider/get_by_place", data);
