import React, { useContext } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { LocationContext } from "../../context/LocationContext";

export default function MapSelectScreen({ navigation }) {
  const { location, setLocation } = useContext(LocationContext);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          setLocation({ latitude, longitude });
        }}
      >
        <Marker coordinate={location} />
      </MapView>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: "#fff" }}>Confirm Location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
