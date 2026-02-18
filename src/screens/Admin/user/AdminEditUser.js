import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function AdminEditUser({ navigation }) {
  return (
    <View style={styles.container}>
      <Text>AdminEditUser Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
});
