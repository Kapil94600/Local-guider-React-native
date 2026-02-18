export const searchPlaces = async (query) => {
  if (!query || query.length < 2) return [];

  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}` +
    `&format=json` +
    `&addressdetails=1` +
    `&limit=10` +
    `&countrycodes=in` +
    `&accept-language=en`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "sinfode-app/1.0",
    },
  });

  return await res.json();
};
