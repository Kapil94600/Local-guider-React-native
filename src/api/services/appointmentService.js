import api from "../apiClient";
import { APPOINTMENT } from "../endpoints";

export const createAppointment = async (data) => {
  const res = await api.post(APPOINTMENT.CREATE, data);
  return res.data;
};

export const getAppointments = async () => {
  const res = await api.get(APPOINTMENT.GET_ALL);
  return res.data;
};
