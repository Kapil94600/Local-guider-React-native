import api from "../api/apiClient";
import { API } from "../api/endpoints";

class PhotographerService {
  // ================= REQUEST FOR PHOTOGRAPHER =================
  async requestPhotographer(formData) {
    try {
      const response = await api.post(API.REQUEST_FOR_PHOTOGRAPHER, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= CHANGE ACTIVE STATUS =================
  async changeActiveStatus(photographerId, status) {
    try {
      const response = await api.post(API.CHANGE_PHOTOGRAPHER_ACTIVE_STATUS, {
        photographerId,
        status
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= RESPOND TO REQUEST =================
  async respondToRequest(requestId, status, remarks) {
    try {
      const response = await api.post(API.RESPOND_PHOTOGRAPHER_REQUEST, {
        requestId,
        status,
        remarks
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= UPDATE PHOTOGRAPHER =================
  async updatePhotographer(photographerData) {
    try {
      const response = await api.post(API.UPDATE_PHOTOGRAPHER, photographerData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= DELETE PHOTOGRAPHER =================
  async deletePhotographer(photographerId) {
    try {
      const response = await api.post(API.DELETE_PHOTOGRAPHER, { photographerId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET PHOTOGRAPHERS BY PLACE =================
  async getPhotographersByPlace(placeId) {
    try {
      const response = await api.post(API.GET_PHOTOGRAPHERS_BY_PLACE_ID, { placeId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET ALL PHOTOGRAPHERS =================
  async getAllPhotographers(page = 1, perPage = 20) {
    try {
      const response = await api.post(API.GET_PHOTOGRAPHERS_ALL, { page, perPage });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET PHOTOGRAPHER DETAILS =================
  async getPhotographerDetails(photographerId) {
    try {
      const response = await api.post(API.GET_PHOTOGRAPHERS_DETAILS, { photographerId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET ALL REQUESTS =================
  async getAllRequests(page = 1, perPage = 20) {
    try {
      const response = await api.post(API.GET_PHOTOGRAPHERS_REQUESTS, { page, perPage });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new PhotographerService();