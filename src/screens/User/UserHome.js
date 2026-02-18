import React, { useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { AuthContext } from "../../src/context/AuthContext";
import { getPlaces } from "../../src/api/services/placeService";
import { createAppointment } from "../../src/api/services/appointmentService";

export default function UserHome() {
  const { user } = useContext(AuthContext);
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    try {
      const res = await getPlaces();
      setPlaces(res.data || []); // backend response ke hisaab se adjust karo
    } catch (err) {
      Alert.alert("Error", "Failed to load places");
    }
  };

  const bookService = async (placeId, service) => {
    try {
      const res = await createAppointment({
        userId: user?.id,
        placeId,
        service,
      });
      Alert.alert("Success", `Booked ${service} for place ${placeId}`);
    } catch (err) {
      Alert.alert("Error", "Booking failed");
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Welcome, {user?.name || "User"}
      </Text>

      {places.map((place) => (
        <View key={place.id} style={{ marginBottom: 20 }}>
          <Image source={{ uri: place.imageUrl }} style={{ width: "100%", height: 150 }} />
          <Text style={{ fontSize: 16, fontWeight: "600" }}>{place.name}</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <TouchableOpacity
              style={{ backgroundColor: "#1976D2", padding: 10, borderRadius: 8 }}
              onPress={() => bookService(place.id, "Photographer")}
            >
              <Text style={{ color: "#fff" }}>📸 Book Photographer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: "#1976D2", padding: 10, borderRadius: 8 }}
              onPress={() => bookService(place.id, "Guider")}
            >
              <Text style={{ color: "#fff" }}>🧭 Book Guider</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
