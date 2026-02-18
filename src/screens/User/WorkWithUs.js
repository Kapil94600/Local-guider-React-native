import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function WorkWithUs({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Work with us as</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("PhotographerRequest")}
      >
        <Ionicons name="camera-outline" size={30} color="#fff" />
        <Text style={styles.label}>Photographer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("GuiderRequest")}
      >
        <Ionicons name="map-outline" size={30} color="#fff" />
        <Text style={styles.label}>Guider</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  heading: { fontSize: 22, fontWeight: "700", marginBottom: 30, textAlign: "center" },
  card: {
    backgroundColor: "#42738fe3",
    padding: 24,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  label: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 8 },
});
