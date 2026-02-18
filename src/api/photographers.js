import api from "./api";
import { API } from "./apis";

export const getAllPhotographers = () => api.get(API.GET_ALL_PHOTOGRAPHERS);

export const getPhotographersByPlace = (placeId) =>
  api.get(`${API.GET_PHOTOGRAPHERS_BY_PLACE}?placeId=${placeId}`);
