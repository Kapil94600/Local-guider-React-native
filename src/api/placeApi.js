import api from "./apiClient";

export const getPlaces = () =>
  api.post("/places/get");

export const getPlacesByIds = (data) =>
  api.post("/places/get_by_ids", data);
