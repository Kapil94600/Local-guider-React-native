// src/screens/Admin/bookings/AdminBookingHistory.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AdminBookingHistory({ navigation }) {
  return (
    <View style={styles.container}>
      <Text>Admin Booking History Screen</Text>
      {/* Add your booking history content here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
});