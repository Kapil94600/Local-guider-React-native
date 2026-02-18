import React, { useState, useContext, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { searchPlaces } from "../../api/map";
import { LocationContext } from "../../context/LocationContext";
import * as Location from "expo-location";

const { width } = Dimensions.get("window");

export default function LocationSearchScreen({ navigation }) {
  const { setLocation, location: currentLocation } = useContext(LocationContext);
  const [list, setList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchInputRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Load recent searches from storage (you can implement AsyncStorage later)
    loadRecentSearches();
    
    // Animate entrance
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

  const loadRecentSearches = () => {
    // Mock recent searches - replace with AsyncStorage later
    setRecentSearches([
      { id: 1, name: "New Delhi", type: "city" },
      { id: 2, name: "Mumbai", type: "city" },
      { id: 3, name: "Jaipur", type: "city" },
      { id: 4, name: "Agra", type: "city" },
    ]);
  };

  const onSearch = async (text) => {
    setSearchText(text);
    
    // Generate suggestions as user types
    if (text.length > 0) {
      const mockSuggestions = generateSuggestions(text);
      setSuggestions(mockSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    // Actual API search
    if (text.length >= 2) {
      setLoading(true);
      try {
        const res = await searchPlaces(text);
        setList(res || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setList([]);
    }
  };

  const generateSuggestions = (text) => {
    // Mock suggestions based on input
    const suggestions = [
      { id: 1, text: `${text} City`, type: "city" },
      { id: 2, text: `${text} District`, type: "district" },
      { id: 3, text: `${text} Area`, type: "area" },
      { id: 4, text: `${text} Locality`, type: "locality" },
    ];
    return suggestions.filter(s => s.text.toLowerCase().includes(text.toLowerCase()));
  };

  const handleSelectSuggestion = (suggestion) => {
    setSearchText(suggestion.text);
    setShowSuggestions(false);
    // Trigger search with selected suggestion
    onSearch(suggestion.text);
  };

  const handleSelectLocation = (item) => {
    const locationData = {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      city: item.display_name.split(',')[0].trim(),
      state: item.display_name.split(',').slice(-2, -1)[0]?.trim() || "",
      fullAddress: item.display_name,
      source: "MANUAL",
    };
    
    setLocation(locationData);
    
    // Save to recent searches
    saveToRecentSearches(item.display_name.split(',')[0].trim());
    
    navigation.goBack();
  };

  const saveToRecentSearches = (locationName) => {
    // Implement AsyncStorage saving later
    console.log("Saved to recent:", locationName);
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

  const highlightMatch = (text, searchTerm) => {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <Text>
        {parts.map((part, index) => 
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <Text key={index} style={styles.highlightedText}>{part}</Text>
          ) : (
            <Text key={index}>{part}</Text>
          )
        )}
      </Text>
    );
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
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchText("");
              setList([]);
              setSuggestions([]);
              setShowSuggestions(false);
            }}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(suggestion)}
              >
                <Ionicons name="search-outline" size={16} color="#64748b" />
                <Text style={styles.suggestionText}>
                  {highlightMatch(suggestion.text, searchText)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {renderSearchHeader()}

      {/* Main Content */}
      <Animated.View 
        style={[
          styles.body,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Recent Searches */}
        {!searchText && recentSearches.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Ionicons name="time-outline" size={18} color="#64748b" />
              <Text style={styles.recentTitle}>Recent Searches</Text>
            </View>
            <FlatList
              horizontal
              data={recentSearches}
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.recentChip}
                  onPress={() => setSearchText(item.name)}
                >
                  <Ionicons name="location-outline" size={14} color="#2c5a73" />
                  <Text style={styles.recentChipText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Popular Locations */}
        {!searchText && (
          <View style={styles.popularSection}>
            <View style={styles.popularHeader}>
              <Ionicons name="star-outline" size={18} color="#64748b" />
              <Text style={styles.popularTitle}>Popular Destinations</Text>
            </View>
            <View style={styles.popularGrid}>
              {["Delhi", "Mumbai", "Jaipur", "Agra", "Goa", "Varanasi"].map((city, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.popularItem}
                  onPress={() => setSearchText(city)}
                >
                  <View style={styles.popularIcon}>
                    <Ionicons name="location" size={16} color="#2c5a73" />
                  </View>
                  <Text style={styles.popularItemText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Search Results */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2c5a73" />
            <Text style={styles.loadingText}>Finding locations...</Text>
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(i) => i.place_id?.toString() || Math.random().toString()}
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
              ) : null
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
                        {item.display_name.split(',')[0]}
                      </Text>
                      <Text style={styles.resultAddress} numberOfLines={2}>
                        {item.display_name}
                      </Text>
                      <View style={styles.resultMeta}>
                        <Ionicons name="time-outline" size={12} color="#94a3b8" />
                        <Text style={styles.resultMetaText}>
                          {Math.floor(Math.random() * 10) + 1} km away
                        </Text>
                      </View>
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
  suggestionsContainer: {
    position: "absolute",
    top: 180,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    zIndex: 20,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  suggestionText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#1e293b",
    flex: 1,
  },
  highlightedText: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontWeight: "600",
  },
  body: {
    flex: 1,
    padding: 16,
  },
  recentSection: {
    marginBottom: 24,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recentChipText: {
    fontSize: 13,
    color: "#2c5a73",
    marginLeft: 6,
    fontWeight: "500",
  },
  popularSection: {
    marginBottom: 24,
  },
  popularHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  popularTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  popularGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  popularItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  popularIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  popularItemText: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "500",
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
    marginBottom: 4,
  },
  resultMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultMetaText: {
    fontSize: 11,
    color: "#94a3b8",
    marginLeft: 4,
  },
});