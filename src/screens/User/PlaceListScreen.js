import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { LocationContext } from "../../context/LocationContext";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";
import { BlurView } from "expo-blur";

// ✅ Import like hook and component
import { useLikes } from '../../context/LikesContext';
import LikeButton from "../../components/LikeButton";


const { width } = Dimensions.get("window");
const BASE_URL = "https://localguider.sinfode.com";

export default function PlaceListScreen({ navigation, route }) {
  const { location } = useContext(LocationContext);
  const { type } = route.params || { type: "all" };

  // ✅ Like hook at top level
  const { isLiked, toggleLike } = useLikes();

  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModal, setFilterModal] = useState(false);
  
  // Filter states
  const [sortBy, setSortBy] = useState("rating");
  const [minRating, setMinRating] = useState(0);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Get unique states and cities for filters
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  useEffect(() => {
    fetchPlaces();
  }, [location, sortBy, minRating, selectedState, selectedCity]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = places.filter(
        (place) =>
          place.placeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPlaces(filtered);
    } else {
      setFilteredPlaces(places);
    }
  }, [searchQuery, places]);

  useEffect(() => {
    // Extract unique states and cities for filters
    const states = [...new Set(places.map(p => p.state).filter(Boolean))];
    const cities = [...new Set(places.map(p => p.city).filter(Boolean))];
    setAvailableStates(states);
    setAvailableCities(cities);
  }, [places]);

  const fetchPlaces = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await api.post(API.GET_PLACES, {
        latitude: location?.latitude,
        longitude: location?.longitude,
        page: pageNum,
        perPage: 10,
        sortBy: sortBy,
        minRating: minRating > 0 ? minRating : undefined,
        state: selectedState || undefined,
        city: selectedCity || undefined,
        searchText: searchQuery,
      });

      if (response.data?.status) {
        const newPlaces = response.data.data || [];
        
        if (append) {
          setPlaces(prev => [...prev, ...newPlaces]);
        } else {
          setPlaces(newPlaces);
        }
        
        setHasMore(newPlaces.length === 10);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching places:", error);
      Alert.alert("Error", "Failed to load places");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchPlaces(page + 1, true);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchPlaces(1, false);
  };

  // ✅ Handle place press – navigate to PlaceDetailsScreen
  const handlePlacePress = (place) => {
    navigation.navigate("PlaceDetails", { placeId: place.id });
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    try {
      const filename = path.split("/").pop();
      return `${BASE_URL}/api/image/download/${filename}`;
    } catch (error) {
      return null;
    }
  };

  const renderRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalf = (rating || 0) % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={14} color="#FFD700" />);
      } else if (i === fullStars && hasHalf) {
        stars.push(<Ionicons key={i} name="star-half" size={14} color="#FFD700" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={14} color="#FFD700" />);
      }
    }
    return <View style={{ flexDirection: "row" }}>{stars}</View>;
  };

  const applyFilters = () => {
    setFilterModal(false);
    setPage(1);
    fetchPlaces(1, false);
  };

  const resetFilters = () => {
    setSortBy("rating");
    setMinRating(0);
    setSelectedState("");
    setSelectedCity("");
    setFilterModal(false);
    setPage(1);
    fetchPlaces(1, false);
  };

  // ✅ Render each place card with LikeButton
  const renderPlaceCard = ({ item }) => (
    <View style={styles.placeCard}>
      {/* Like Button – positioned absolutely */}
      <LikeButton
        isLiked={isLiked(item.id, 'place')}
        onPress={() => toggleLike(item, 'place')}
        size={18}
        style={styles.cardLikeButton}
      />

      <TouchableOpacity
        onPress={() => handlePlacePress(item)}
        activeOpacity={0.7}
      >
        {item.featuredImage ? (
          <Image
            source={{ uri: getImageUrl(item.featuredImage) }}
            style={styles.placeImage}
          />
        ) : (
          <LinearGradient
            colors={['#2c5a73', '#1e3c4f']}
            style={styles.placeImagePlaceholder}
          >
            <Ionicons name="image-outline" size={32} color="#fff" />
          </LinearGradient>
        )}

        <View style={styles.placeContent}>
          <View style={styles.placeHeader}>
            <Text style={styles.placeName} numberOfLines={1}>
              {item.placeName}
            </Text>
            {item.topPlace && (
              <View style={styles.topBadge}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.topBadgeText}>Top</Text>
              </View>
            )}
          </View>

          <View style={styles.ratingContainer}>
            {renderRating(item.rating)}
            <Text style={styles.ratingText}>({item.rating?.toFixed(1) || "0.0"})</Text>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#64748b" />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.city}, {item.state}
            </Text>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {item.description || "No description available"}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={14} color="#64748b" />
                <Text style={styles.statText}>{item.views || 0} views</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={14} color="#64748b" />
                <Text style={styles.statText}>{item.guiders || 0} guides</Text>
              </View>
            </View>
            
            <LinearGradient
              colors={['#2c5a73', '#1e3c4f']}
              style={styles.exploreBadge}
            >
              <Text style={styles.exploreBadgeText}>View Details</Text>
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={filterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFilterModal(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Places</Text>
            <TouchableOpacity onPress={() => setFilterModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Sort By */}
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.sortOptions}>
              {[
                { label: "Rating", value: "rating" },
                { label: "Most Viewed", value: "views" },
                { label: "Newest", value: "newest" },
                { label: "A-Z", value: "name" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    sortBy === option.value && styles.sortOptionSelected,
                  ]}
                  onPress={() => setSortBy(option.value)}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option.value && styles.sortOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Minimum Rating */}
            <Text style={styles.filterLabel}>Minimum Rating</Text>
            <View style={styles.ratingOptions}>
              {[4, 3, 2, 1].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingOption,
                    minRating === rating && styles.ratingOptionSelected,
                  ]}
                  onPress={() => setMinRating(minRating === rating ? 0 : rating)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text
                      style={[
                        styles.ratingOptionText,
                        minRating === rating && styles.ratingOptionTextSelected,
                      ]}
                    >
                      {rating}+
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* State Filter */}
            {availableStates.length > 0 && (
              <>
                <Text style={styles.filterLabel}>State</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.stateOptions}>
                    <TouchableOpacity
                      style={[
                        styles.stateChip,
                        selectedState === "" && styles.stateChipSelected,
                      ]}
                      onPress={() => setSelectedState("")}
                    >
                      <Text
                        style={[
                          styles.stateChipText,
                          selectedState === "" && styles.stateChipTextSelected,
                        ]}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    {availableStates.map((state) => (
                      <TouchableOpacity
                        key={state}
                        style={[
                          styles.stateChip,
                          selectedState === state && styles.stateChipSelected,
                        ]}
                        onPress={() => setSelectedState(state)}
                      >
                        <Text
                          style={[
                            styles.stateChipText,
                            selectedState === state && styles.stateChipTextSelected,
                          ]}
                        >
                          {state}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {/* City Filter */}
            {availableCities.length > 0 && (
              <>
                <Text style={styles.filterLabel}>City</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.cityOptions}>
                    <TouchableOpacity
                      style={[
                        styles.cityChip,
                        selectedCity === "" && styles.cityChipSelected,
                      ]}
                      onPress={() => setSelectedCity("")}
                    >
                      <Text
                        style={[
                          styles.cityChipText,
                          selectedCity === "" && styles.cityChipTextSelected,
                        ]}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    {availableCities.map((city) => (
                      <TouchableOpacity
                        key={city}
                        style={[
                          styles.cityChip,
                          selectedCity === city && styles.cityChipSelected,
                        ]}
                        onPress={() => setSelectedCity(city)}
                      >
                        <Text
                          style={[
                            styles.cityChipText,
                            selectedCity === city && styles.cityChipTextSelected,
                          ]}
                        >
                          {city}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}

            {/* Action Buttons */}
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <LinearGradient
                  colors={["#2c5a73", "#1e3c4f"]}
                  style={styles.applyGradient}
                >
                  <Text style={styles.applyBtnText}>Apply Filters</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#1e3c4f", "#2c5a73", "#3b7a8f"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Explore Places</Text>
          <TouchableOpacity onPress={() => setFilterModal(true)} style={styles.filterBtn}>
            <Ionicons name="options-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search places by name, city, or state..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {/* Places List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5a73" />
          <Text style={styles.loadingText}>Discovering amazing places...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPlaces}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderPlaceCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#2c5a73" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="map-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Places Found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters or search query
              </Text>
              <TouchableOpacity style={styles.resetFiltersBtn} onPress={resetFilters}>
                <Text style={styles.resetFiltersText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      {renderFilterModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingTop: 46,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  filterBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#1e293b",
    padding: 0,
  },
  resultsCount: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  placeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    position: "relative", // For absolute positioning of like button
  },
  placeImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  placeImagePlaceholder: {
    width: "100%",
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  placeContent: {
    padding: 16,
  },
  placeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  placeName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    flex: 1,
  },
  topBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  topBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 2,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 4,
  },
  description: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
  },
  exploreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  exploreBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
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
    marginBottom: 20,
  },
  resetFiltersBtn: {
    backgroundColor: "#2c5a73",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetFiltersText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 12,
  },
  sortOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  sortOptionSelected: {
    backgroundColor: "#2c5a73",
  },
  sortOptionText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  sortOptionTextSelected: {
    color: "#fff",
  },
  ratingOptions: {
    flexDirection: "row",
    marginBottom: 20,
  },
  ratingOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    marginRight: 8,
  },
  ratingOptionSelected: {
    backgroundColor: "#2c5a73",
  },
  ratingOptionText: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 4,
    fontWeight: "500",
  },
  ratingOptionTextSelected: {
    color: "#fff",
  },
  stateOptions: {
    flexDirection: "row",
    marginBottom: 16,
  },
  stateChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    marginRight: 8,
  },
  stateChipSelected: {
    backgroundColor: "#2c5a73",
  },
  stateChipText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  stateChipTextSelected: {
    color: "#fff",
  },
  cityOptions: {
    flexDirection: "row",
    marginBottom: 16,
  },
  cityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    marginRight: 8,
  },
  cityChipSelected: {
    backgroundColor: "#2c5a73",
  },
  cityChipText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  cityChipTextSelected: {
    color: "#fff",
  },
  filterActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 20,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    alignItems: "center",
  },
  resetBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  applyBtn: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  applyGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },

  // ✅ Like button style (same as other screens)
  cardLikeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 6,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});