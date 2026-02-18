import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { BASE_URL } from "../config/api";
import { getImageUrl } from "../utils/imageUrl";

export default function PlacesScreen() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/places/get`, {
        // backend params if needed
      });

      setPlaces(res.data?.data || []);
    } catch (e) {
      console.log("PLACES ERROR", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={places}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => {
        const imageUrl = getImageUrl(item.featuredImage);

        // 🔥 DEBUG
        console.log("IMAGE URL =>", imageUrl);

        return (
          <View style={styles.card}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onError={(e) =>
                console.log("IMAGE ERROR", e.nativeEvent.error)
              }
            />

            <View style={styles.info}>
              <Text style={styles.title}>{item.placeName}</Text>
              <Text style={styles.city}>{item.city}</Text>
              <Text numberOfLines={2} style={styles.desc}>
                {item.description}
              </Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
  },
  image: {
    height: 180,
    width: "100%",
    backgroundColor: "#eee",
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  city: {
    color: "#777",
    marginVertical: 4,
  },
  desc: {
    color: "#444",
  },
});
