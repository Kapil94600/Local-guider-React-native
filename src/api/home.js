import api from "./axios";

export const getHomeDetails = (placeId) => {
  return api.get("/main/home_details", {
    params: { placeId },
  });
};
