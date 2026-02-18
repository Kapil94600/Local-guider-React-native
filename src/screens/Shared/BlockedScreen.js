// screens/Shared/BlockedScreen.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function BlockedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚫 Account Blocked</Text>
      <Text style={styles.message}>
        Your account has been blocked by Admin. Please contact support.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", color: "#f44336", marginBottom: 10 },
  message: { fontSize: 16, color: "#333", textAlign: "center", paddingHorizontal: 20 },
});
