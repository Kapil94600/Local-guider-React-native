import api from "../api/apiClient";
import { API } from "../api/endpoints";

class TimeSlotService {
  // ================= ADD TIME SLOT =================
  async addTimeSlot(timeSlotData) {
    try {
      const response = await api.post(API.ADD_TIMESLOT, timeSlotData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= DELETE TIME SLOT =================
  async deleteTimeSlot(slotId) {
    try {
      const response = await api.post(API.DELETE_TIMESLOT, { slotId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }

  // ================= GET ALL TIME SLOTS =================
  async getAllTimeSlots(
    photographerId = null,
    guiderId = null,
    date = null
  ) {
    try {
      const response = await api.post(API.GET_ALL_TIMESLOTS, {
        photographerId,
        guiderId,
        date
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
}

export default new TimeSlotService();