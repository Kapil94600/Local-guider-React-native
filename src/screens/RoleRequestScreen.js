import React, { useEffect, useState, useContext } from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import api from "../api/apiClient";
import { AuthContext } from "../context/AuthContext";

export default function RoleRequestScreen({ route }) {
  const { type } = route.params; // GUIDER / PHOTOGRAPHER
  const { user } = useContext(AuthContext);

  const [places, setPlaces] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    api.post("/place/get_all").then((res) => {
      setPlaces(res.data?.data || []);
    });
  }, []);

  const togglePlace = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((p) => p !== id));
    } else {
      if (selected.length === 3) {
        Alert.alert("Limit", "You can select only 3 places");
        return;
      }
      setSelected([...selected, id]);
    }
  };

  const submitRequest = async () => {
    if (selected.length === 0) {
      Alert.alert("Select place", "Select at least one place");
      return;
    }

    await api.post("/role/request", {
      userId: user.id,
      role: type,
      placeIds: selected,
    });

    Alert.alert(
      "Request Sent",
      `Your ${type.toLowerCase()} request has been sent to admin`
    );
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>
        Become a {type}
      </Text>

      <Text style={{ marginVertical: 10 }}>
        Select up to 3 locations
      </Text>

      <FlatList
        data={places}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => togglePlace(item.id)}
            style={{
              padding: 12,
              marginBottom: 8,
              borderRadius: 8,
              backgroundColor: selected.includes(item.id)
                ? "#D1FAE5"
                : "#F3F4F6",
            }}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        onPress={submitRequest}
        style={{
          backgroundColor: "#2563EB",
          padding: 14,
          borderRadius: 10,
          marginTop: 16,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Submit Request
        </Text>
      </TouchableOpacity>
    </View>
  );
}
