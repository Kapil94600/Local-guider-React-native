import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function UserMenuScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu</Text>

      <MenuItem
        icon="home-outline"
        label="Home"
        onPress={() => navigation.goBack()}
      />

      <MenuItem
        icon="person-outline"
        label="Profile"
        onPress={() => navigation.navigate("Profile")}
      />

      <MenuItem
        icon="camera-outline"
        label="Photographers"
        onPress={() => navigation.navigate("PhotographerList")}
      />

      <MenuItem
        icon="log-out-outline"
        label="Logout"
        color="red"
        onPress={() => {
          // yahan later AuthContext logout laga dena
          navigation.replace("Login");
        }}
      />
    </View>
  );
}

function MenuItem({ icon, label, onPress, color = "#111" }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.menuText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  menuText: {
    marginLeft: 14,
    fontSize: 16,
    fontWeight: "600",
  },
});
