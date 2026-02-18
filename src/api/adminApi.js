// src/api/adminApi.js
import api from "./apiClient";
import { API } from "./endpoints";

export const adminAPI = {
  // Dashboard
  getDashboardData: () => api.post(API.GET_ADMIN_DASHBOARD),

  // Photographer Requests
  getPhotographerRequests: () => 
    api.post(API.GET_PHOTOGRAPHERS_ALL, {
      status: "IN_REVIEW",
      admin: true,
    }),

  respondToPhotographerRequest: (photographerId, status) =>
    api.post(
      API.RESPOND_PHOTOGRAPHER_REQUEST,
      new URLSearchParams({ photographerId, status }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ),

  changePhotographerStatus: (pId, active) =>
    api.post(
      API.CHANGE_PHOTOGRAPHER_ACTIVE_STATUS,
      new URLSearchParams({ pId, active: active ? "1" : "0" }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ),

  // Guider Requests
  getGuiderRequests: () =>
    api.post(API.GET_GUIDERS_ALL, {
      status: "PENDING",
      admin: true,
    }),

  respondToGuiderRequest: (guiderId, status) =>
    api.post(
      API.CHANGE_GUIDER_ACTIVE_STATUS,
      new URLSearchParams({ gId: guiderId, status }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    ),

  // Places
  getPlaces: (page = 1, perPage = 10) =>
    api.post(API.GET_PLACES, { page, perPage }),
};