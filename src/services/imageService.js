import api from "../api/apiClient";
import { API } from "../api/endpoints";

const BASE_URL = "https://localguider.sinfode.com";

class ImageService {
  // ================= ADD IMAGE =================
  async addImage(formData) {
    try {
      const response = await api.post(API.ADD_IMAGE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET ALL IMAGES =================
  async getAllImages(page = 1, perPage = 20) {
    try {
      const response = await api.post(API.ALL_IMAGES, { page, perPage });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET IMAGES BY ID =================
  async getImagesById(photographerId = null, guiderId = null, placeId = null, page = 1) {
    try {
      const response = await api.post(API.ALL_IMAGES_BY_ID, {
        photographerId,
        guiderId,
        placeId,
        page
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= DELETE IMAGE =================
  async deleteImage(imageId) {
    try {
      const response = await api.post(API.DELETE_IMAGE, { imageId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET IMAGE URL =================
  getImageUrl(imagePath) {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    
    let filename = imagePath;
    if (imagePath.includes('/')) filename = imagePath.split('/').pop();
    if (imagePath.includes('\\')) filename = imagePath.split('\\').pop();
    
    return `${BASE_URL}${API.READ_IMAGES}/${filename}`;
  }

  // ================= DOWNLOAD IMAGE =================
  async downloadImage(path) {
    try {
      const response = await api.post(`${API.DOWNLOAD_IMAGE}/${path}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new ImageService();