import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";

export default function CustomDrawer(props) {
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.profileBox}>
        <Image
          source={{ uri: "https://i.pravatar.cc/150" }}
          style={styles.avatar}
        />
        <Text style={styles.name}>Sharma12</Text>
        <Text style={styles.email}>sharma12@gmail.com</Text>
        <Text style={styles.balance}>Balance: ₹0.0</Text>
      </View>

      <DrawerItem
        label="Home"
        icon={({ color }) => (
          <Ionicons name="home-outline" size={20} color={color} />
        )}
        onPress={() => props.navigation.navigate("UserDashboard")}
      />

      <DrawerItem
        label="Help"
        icon={({ color }) => (
          <Ionicons name="help-circle-outline" size={20} color={color} />
        )}
        onPress={() => {}}
      />
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  profileBox: {
    backgroundColor: "#2563EB",
    padding: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 10,
  },
  email: { color: "#E5E7EB", fontSize: 12 },
  balance: { color: "#FACC15", marginTop: 6 },
});
