import { BASE_URL } from "../config/api";

export const getImageUrl = (path) => {
  if (!path) return null;

  if (path.startsWith("http")) return path;

  return `${BASE_URL}/${path}`;
};
