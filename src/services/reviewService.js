import api from "../api/apiClient";
import { API } from "../api/endpoints";

class ReviewService {
  // ================= ADD REVIEW =================
  async addReview(reviewData) {
    try {
      const response = await api.post(API.ADD_REVIEW, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= DELETE REVIEW =================
  async deleteReview(reviewId) {
    try {
      const response = await api.post(API.DELETE_REVIEW, { reviewId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET ALL REVIEWS =================
  async getAllReviews(
    photographerId = null,
    guiderId = null,
    placeId = null,
    page = 1,
    perPage = 20
  ) {
    try {
      const response = await api.post(API.GET_ALL_REVIEW, {
        photographerId,
        guiderId,
        placeId,
        page,
        perPage
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new ReviewService();