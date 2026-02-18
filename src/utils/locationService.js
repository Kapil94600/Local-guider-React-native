import * as Location from "expo-location";

export const getLiveLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Location permission denied");
  }

  const loc = await Location.getCurrentPositionAsync({});
  const rev = await Location.reverseGeocodeAsync(loc.coords);

  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    city: rev[0]?.city || rev[0]?.subregion || "Unknown",
    state: rev[0]?.region || "",
  };
};
