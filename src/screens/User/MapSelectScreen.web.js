import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function MapSelectScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Map is not supported on Web.
      </Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: "#fff" }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: "#818fae",
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 10,
  },
});
