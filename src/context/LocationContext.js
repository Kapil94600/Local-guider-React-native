import React, { createContext, useEffect, useState } from "react";
import * as Location from "expo-location";

export const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        city: geo[0]?.city || geo[0]?.district || "Unknown",
        state: geo[0]?.region,
        country: geo[0]?.country,
      });
    })();
  }, []);

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}
