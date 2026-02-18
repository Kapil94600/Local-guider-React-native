import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import * as Location from "expo-location";

export default function LocationPicker({ navigation, route }) {
  const onSelect = route?.params?.onSelect;

  const [query, setQuery] = useState("");
  const [list, setList] = useState([]);

  /* 🔎 SEARCH (PHOTON API) */
  const searchCity = async (text) => {
    setQuery(text);

    if (text.trim().length < 2) {
      setList([]);
      return;
    }

    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(
          text
        )}&limit=10&lang=en`
      );

      const json = await res.json();
      setList(json.features || []);
    } catch (e) {
      console.log("Search error:", e);
      setList([]);
    }
  };

  /* ✅ SELECT CITY */
  const chooseCity = async (item) => {
    const coords = {
      latitude: item.geometry.coordinates[1],
      longitude: item.geometry.coordinates[0],
    };

    const rev = await Location.reverseGeocodeAsync(coords);

    onSelect &&
      onSelect({
        latitude: coords.latitude,
        longitude: coords.longitude,
        city:
          item.properties.city ||
          item.properties.name ||
          rev[0]?.city ||
          "Unknown",
      });

    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput
        autoFocus
        placeholder="Type city name (si, ja, hsi...)"
        value={query}
        onChangeText={searchCity}
        style={styles.input}
      />

      <FlatList
        data={list}
        keyExtractor={(item, i) => i.toString()}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => chooseCity(item)}
          >
            <Text style={styles.city}>
              {item.properties.name}
              {item.properties.city
                ? `, ${item.properties.city}`
                : ""}
              {item.properties.country
                ? `, ${item.properties.country}`
                : ""}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.length >= 2 ? (
            <Text style={styles.empty}>No results found</Text>
          ) : null
        }
      />
    </View>
  );
}

/* 🎨 STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  item: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    marginBottom: 6,
  },
  city: {
    fontSize: 14,
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#6B7280",
  },
});
