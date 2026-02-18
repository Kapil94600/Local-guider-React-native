import React from "react";
import { View, Text, Image, Switch, StyleSheet } from "react-native";
import colors from "../utils/colors";

export default function ProfileCard({ profile, onToggle }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: profile.image }} style={styles.image} />

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{profile.firmName}</Text>
        <Text style={styles.rating}>⭐ {profile.rating}</Text>
        <Text style={styles.status}>
          Status: {profile.approvalStatus}
        </Text>
      </View>

      <Switch value={profile.active} onValueChange={onToggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
    marginBottom: 15,
  },
  image: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginRight: 12,
  },
  name: { fontSize: 16, fontWeight: "bold" },
  rating: { color: colors.secondary },
  status: { color: colors.gray, fontSize: 12 },
});
