import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AdminUserDetails({ navigation }) {
  return (
    <View style={styles.container}>
      <Text>AdminUserDetails Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
});
