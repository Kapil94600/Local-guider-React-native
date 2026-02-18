import api from "../apiClient";
import { PLACES } from "../endpoints";

export const getPlaces = async () => {
  const res = await api.get(PLACES.GET_PLACES);
  return res.data;
};
