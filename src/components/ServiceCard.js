import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import colors from "../utils/colors";

export default function ServiceCard({ service }) {
  return (
    <View style={styles.card}>
      {service.image && (
        <Image source={{ uri: service.image }} style={styles.image} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{service.title}</Text>
        <Text style={styles.desc}>{service.description}</Text>
      </View>
      <Text style={styles.price}>₹ {service.price}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  image: {
    width: 45,
    height: 45,
    borderRadius: 8,
    marginRight: 10,
  },
  title: { fontWeight: "bold" },
  desc: { color: colors.gray, fontSize: 12 },
  price: { fontWeight: "bold", color: colors.primary },
});
