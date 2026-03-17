import React, { useState, useContext, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LocationContext } from "../../context/LocationContext";
import api from "../../api/apiClient";
import * as Location from "expo-location";

export default function LocationSearchScreen({ navigation }) {
  const { setLocation } = useContext(LocationContext);
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchInputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Search function – calls the backend with searchText
  const onSearch = async (text) => {
    setSearchText(text);

    if (text.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Send POST with searchText as query parameter
      const response = await api.post("/map/get_places", null, {
        params: { searchText: text },
      });

      if (response.data?.predictions) {
        setResults(response.data.predictions);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search locations");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (item) => {
    // item contains description, place_id, latitude, longitude (added by backend)
    const locationData = {
      latitude: item.latitude,
      longitude: item.longitude,
      city: item.description.split(',')[0]?.trim() || "",
      fullAddress: item.description,
      source: "MANUAL",
    };

    setLocation(locationData);
    navigation.goBack();
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Please allow location access to use this feature");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city: address.city || address.subregion || address.region || "Unknown",
        state: address.region || "",
        fullAddress: `${address.city || ""}, ${address.region || ""}, ${address.country || ""}`,
        source: "GPS",
      };

      setLocation(locationData);
      navigation.goBack();
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Failed to get current location");
    } finally {
      setLoading(false);
    }
  };

  const renderSearchHeader = () => (
    <Animated.View
      style={[
        styles.searchHeader,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <LinearGradient
        colors={["#1e3c4f", "#2c5a73", "#3b7a8f"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Find Your Location</Text>
          <View style={{ width: 38 }} />
        </View>

        <Text style={styles.headerSub}>
          Search for your city or area to discover local experiences
        </Text>

        {/* Current Location Button */}
        <TouchableOpacity
          style={styles.currentLocationBtn}
          onPress={handleUseCurrentLocation}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.1)"]}
            style={styles.currentLocationGradient}
          >
            <Ionicons name="locate" size={18} color="#fff" />
            <Text style={styles.currentLocationText}>Use Current Location</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Search Box */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            ref={searchInputRef}
            autoFocus
            placeholder="Search city, area, or landmark..."
            placeholderTextColor="#94a3b8"
            onChangeText={onSearch}
            value={searchText}
            style={styles.input}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchText("");
              setResults([]);
            }}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {renderSearchHeader()}

      {/* Results */}
      <Animated.View
        style={[
          styles.body,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2c5a73" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.place_id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
            ListEmptyComponent={
              searchText.length >= 2 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="map-outline" size={64} color="#cbd5e1" />
                  <Text style={styles.emptyTitle}>No locations found</Text>
                  <Text style={styles.emptyText}>
                    We couldn't find any matches for "{searchText}"
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Try checking the spelling or search for a nearby area
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="map-outline" size={64} color="#cbd5e1" />
                  <Text style={styles.emptyTitle}>Start searching</Text>
                  <Text style={styles.emptyText}>
                    Type at least 2 characters to find locations
                  </Text>
                </View>
              )
            }
            renderItem={({ item, index }) => (
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  transform: [{
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [index * 10, 0]
                    })
                  }]
                }}
              >
                <TouchableOpacity
                  style={styles.resultCard}
                  onPress={() => handleSelectLocation(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.resultLeft}>
                    <View style={styles.resultIcon}>
                      <Ionicons name="location" size={20} color="#2c5a73" />
                    </View>
                    <View style={styles.resultContent}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {item.description.split(',')[0]}
                      </Text>
                      <Text style={styles.resultAddress} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </Animated.View>
            )}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  searchHeader: {
    position: "relative",
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  currentLocationBtn: {
    marginBottom: 16,
    borderRadius: 30,
    overflow: "hidden",
  },
  currentLocationGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 30,
  },
  currentLocationText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#1e293b",
    padding: 0,
  },
  body: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  resultLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
});