import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AdminAddUser({ navigation }) {
  return (
    <View style={styles.container}>
      <Text>AdminAddUser Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
});
