import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "../utils/colors";

export default function StatsCard({ title, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>₹ {value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.light,
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  title: { color: colors.gray },
  value: { fontSize: 18, fontWeight: "bold" },
});
