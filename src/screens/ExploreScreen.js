import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const LOCATIONS = ["Sikar, Rajasthan", "Jaipur, Rajasthan", "Delhi, India"];

export default function ExploreScreen({ route }) {
  const [activeTab, setActiveTab] = useState("PLACES");

  // 🔑 Location comes from dashboard
  const location = route.params?.location || "Sikar, Rajasthan";

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color="#2563EB" />
          <Text style={styles.location}>{location}</Text>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        {["PLACES", "GUIDERS", "PHOTOGRAPHERS"].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setActiveTab(t)}
            style={[
              styles.tab,
              activeTab === t && styles.activeTab,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === t && { color: "#fff" },
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LIST */}
      <FlatList
        data={DUMMY_DATA[activeTab]}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.sub}>{location}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#9CA3AF" />
          </View>
        )}
      />
    </View>
  );
}

/* TEMP DATA (API SE REPLACE HOGA) */
const DUMMY_DATA = {
  PLACES: [
    {
      id: "1",
      name: "Laxmangarh Fort",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/7/75/Laxmangarh_Fort_Sikar.jpg",
    },
  ],
  GUIDERS: [
    {
      id: "1",
      name: "Rahul Guider",
      image: "https://randomuser.me/api/portraits/men/41.jpg",
    },
  ],
  PHOTOGRAPHERS: [
    {
      id: "1",
      name: "Amit Photographer",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
    },
  ],
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800" },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  location: { marginLeft: 4, color: "#2563EB" },

  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  activeTab: { backgroundColor: "#2563EB" },
  tabText: { fontWeight: "600" },

  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    margin: 12,
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  image: { width: 60, height: 60, borderRadius: 12, marginRight: 12 },
  cardTitle: { fontWeight: "700" },
  sub: { color: "#6B7280", fontSize: 12 },
});
