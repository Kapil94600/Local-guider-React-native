import api from "../api/apiClient";
import { API } from "../api/endpoints";

class PlaceService {
  // ================= ADD PLACE =================
  async addPlace(formData) {
    try {
      const response = await api.post(API.ADD_PLACE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= EDIT PLACE =================
  async editPlace(formData) {
    try {
      const response = await api.post(API.EDIT_PLACE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET PLACES =================
  async getPlaces(page = 1, perPage = 20, lat = null, lng = null, searchText = "") {
    try {
      const response = await api.post(API.GET_PLACES, {
        page,
        perPage,
        lat,
        lng,
        searchText
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET PLACES BY IDS =================
  async getPlacesByIds(ids) {
    try {
      const response = await api.post(API.GET_PLACES_BY_IDS, { ids });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= DELETE PLACE =================
  async deletePlace(placeId) {
    try {
      const response = await api.post(API.DELETE_PLACE, { placeId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= ADD VIEW =================
  async addView(placeId) {
    try {
      const response = await api.post(API.ADD_VIEW, { placeId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new PlaceService();