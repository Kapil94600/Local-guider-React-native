import api from "../api/apiClient";
import { API } from "../api/endpoints";

class MapService {
  // ================= GET MAP PLACES =================
  async getMapPlaces(lat, lng, radius = 5000) {
    try {
      const response = await api.post(API.MAP_GET_PLACES, {
        lat,
        lng,
        radius
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET LAT LNG FROM ADDRESS =================
  async getLatLng(address) {
    try {
      const response = await api.post(API.MAP_GET_LAT_LNG, { address });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new MapService();