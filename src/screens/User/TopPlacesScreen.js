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

const { width } = Dimensions.get("window");
const BASE_URL = "https://localguider.sinfode.com";

export default function TopPlacesScreen({ navigation }) {
  const { location } = useContext(LocationContext);

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchTopPlaces();
  }, [location]);

  const fetchTopPlaces = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await api.post(API.GET_PLACES, {
        latitude: location?.latitude,
        longitude: location?.longitude,
        page: pageNum,
        perPage: 10,
        sortBy: "rating",
        minRating: 4.0, // Only show places with rating 4+
        onlyTopPlaces: true,
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
      console.error("Error fetching top places:", error);
      Alert.alert("Error", "Failed to load top places");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchTopPlaces(page + 1, true);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchTopPlaces(1, false);
  };

  const handlePlacePress = (place) => {
    setSelectedPlace(place);
    setDetailsModal(true);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    try {
      const filename = path.split("/").pop();
      return `${BASE_URL}/Uploads/${filename}`;
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

  const renderPlaceCard = ({ item, index }) => {
    // Determine rank color based on position
    let rankColor = "#FFD700"; // Gold default
    let rankBgColor = "#FEF3C7";
    
    if (index === 0) {
      rankColor = "#FFD700"; // Gold for 1st
      rankBgColor = "#FEF3C7";
    } else if (index === 1) {
      rankColor = "#C0C0C0"; // Silver for 2nd
      rankBgColor = "#F1F5F9";
    } else if (index === 2) {
      rankColor = "#CD7F32"; // Bronze for 3rd
      rankBgColor = "#FEE2E2";
    }

    return (
      <TouchableOpacity
        style={styles.placeCard}
        onPress={() => handlePlacePress(item)}
        activeOpacity={0.7}
      >
        {/* Rank Badge */}
        <View style={[styles.rankBadge, { backgroundColor: rankBgColor }]}>
          <Text style={[styles.rankText, { color: rankColor }]}>
            #{index + 1}
          </Text>
        </View>

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
            <View style={styles.topBadge}>
              <Ionicons name="star" size={12} color="#fff" />
              <Text style={styles.topBadgeText}>Top Rated</Text>
            </View>
          </View>

          <View style={styles.ratingContainer}>
            {renderRating(item.rating)}
            <Text style={styles.ratingText}>
              {item.rating?.toFixed(1) || "0.0"} ({item.reviews || 0} reviews)
            </Text>
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
    );
  };

  const renderDetailsModal = () => (
    <Modal
      visible={detailsModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setDetailsModal(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, styles.detailsModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Top Place Details</Text>
            <TouchableOpacity onPress={() => setDetailsModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedPlace && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Place Image */}
              {selectedPlace.featuredImage ? (
                <Image
                  source={{ uri: getImageUrl(selectedPlace.featuredImage) }}
                  style={styles.detailImage}
                />
              ) : (
                <LinearGradient
                  colors={['#2c5a73', '#1e3c4f']}
                  style={styles.detailImagePlaceholder}
                >
                  <Ionicons name="image-outline" size={48} color="#fff" />
                </LinearGradient>
              )}

              {/* Top Rated Badge */}
              <View style={styles.detailTopRatedBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.detailTopRatedText}>Top Rated Place</Text>
              </View>

              {/* Place Name & Rating */}
              <View style={styles.detailHeader}>
                <Text style={styles.detailName}>{selectedPlace.placeName}</Text>
                
                <View style={styles.detailRatingRow}>
                  <View style={styles.detailRating}>
                    {renderRating(selectedPlace.rating)}
                    <Text style={styles.detailRatingText}>
                      {selectedPlace.rating?.toFixed(1) || "0.0"}
                    </Text>
                  </View>
                  <Text style={styles.detailReviews}>
                    ({selectedPlace.reviews || 0} reviews)
                  </Text>
                </View>
              </View>

              {/* Location Info */}
              <View style={styles.detailSection}>
                <View style={styles.detailLocationRow}>
                  <Ionicons name="location-outline" size={18} color="#2c5a73" />
                  <Text style={styles.detailLocationText}>
                    {selectedPlace.city}, {selectedPlace.state}
                  </Text>
                </View>
                {selectedPlace.fullAddress && (
                  <Text style={styles.detailAddress}>
                    {selectedPlace.fullAddress}
                  </Text>
                )}
              </View>

              {/* Description */}
              {selectedPlace.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>About this Place</Text>
                  <Text style={styles.detailDescription}>
                    {selectedPlace.description}
                  </Text>
                </View>
              )}

              {/* Stats Grid */}
              <View style={styles.detailStatsGrid}>
                <View style={styles.detailStatCard}>
                  <Ionicons name="eye-outline" size={22} color="#2c5a73" />
                  <Text style={styles.detailStatValue}>{selectedPlace.views || 0}</Text>
                  <Text style={styles.detailStatLabel}>Total Views</Text>
                </View>
                <View style={styles.detailStatCard}>
                  <Ionicons name="people-outline" size={22} color="#2c5a73" />
                  <Text style={styles.detailStatValue}>{selectedPlace.guiders || 0}</Text>
                  <Text style={styles.detailStatLabel}>Tour Guides</Text>
                </View>
                <View style={styles.detailStatCard}>
                  <Ionicons name="camera-outline" size={22} color="#2c5a73" />
                  <Text style={styles.detailStatValue}>{selectedPlace.photographers || 0}</Text>
                  <Text style={styles.detailStatLabel}>Photographers</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.detailGuideBtn}
                  onPress={() => {
                    setDetailsModal(false);
                    navigation.navigate("GuiderList", { placeId: selectedPlace.id });
                  }}
                >
                  <LinearGradient
                    colors={["#2c5a73", "#1e3c4f"]}
                    style={styles.detailBtnGradient}
                  >
                    <Ionicons name="people-outline" size={18} color="#fff" />
                    <Text style={styles.detailBtnText}>Find Guides</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailPhotographerBtn}
                  onPress={() => {
                    setDetailsModal(false);
                    navigation.navigate("PhotographerList", { placeId: selectedPlace.id });
                  }}
                >
                  <LinearGradient
                    colors={["#2c5a73", "#1e3c4f"]}
                    style={styles.detailBtnGradient}
                  >
                    <Ionicons name="camera-outline" size={18} color="#fff" />
                    <Text style={styles.detailBtnText}>Find Photographers</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Reviews Section Preview */}
              <View style={styles.reviewPreview}>
                <View style={styles.reviewPreviewHeader}>
                  <Text style={styles.reviewPreviewTitle}>Recent Reviews</Text>
                  <TouchableOpacity>
                    <Text style={styles.reviewPreviewAll}>See All</Text>
                  </TouchableOpacity>
                </View>

                {/* Sample Review - Replace with actual reviews from API */}
                <View style={styles.reviewItem}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.reviewerInitial}>R</Text>
                    </View>
                    <View>
                      <Text style={styles.reviewerName}>Rahul Sharma</Text>
                      <View style={styles.reviewerRating}>
                        {renderRating(4.5)}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewText}>
                    Amazing place! Must visit with family and friends.
                  </Text>
                </View>

                <View style={styles.reviewItem}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.reviewerInitial}>P</Text>
                    </View>
                    <View>
                      <Text style={styles.reviewerName}>Priya Patel</Text>
                      <View style={styles.reviewerRating}>
                        {renderRating(5.0)}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewText}>
                    Beautiful location, great experience with local guide.
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
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
          <Text style={styles.headerTitle}>Top Rated Places</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Subtitle */}
        <Text style={styles.headerSubtitle}>
          Discover the highest rated destinations
        </Text>

        {/* Results Count */}
        <Text style={styles.resultsCount}>
          {places.length} top places found
        </Text>
      </LinearGradient>

      {/* Places List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5a73" />
          <Text style={styles.loadingText}>Loading top places...</Text>
        </View>
      ) : (
        <FlatList
          data={places}
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
              <Ionicons name="star-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Top Places Found</Text>
              <Text style={styles.emptyText}>
                There are no highly rated places in your area yet
              </Text>
              <TouchableOpacity 
                style={styles.exploreAllBtn}
                onPress={() => navigation.navigate("PlaceList")}
              >
                <Text style={styles.exploreAllText}>Explore All Places</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Details Modal */}
      {renderDetailsModal()}
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
    marginBottom: 8,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 12,
    textAlign: "center",
  },
  resultsCount: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
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
    position: "relative",
  },
  rankBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rankText: {
    fontSize: 14,
    fontWeight: "700",
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
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
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
  exploreAllBtn: {
    backgroundColor: "#2c5a73",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreAllText: {
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
  detailsModalContent: {
    maxHeight: "95%",
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

  // Details Modal Styles
  detailImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 12,
  },
  detailImagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  detailTopRatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  detailTopRatedText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
    marginLeft: 4,
  },
  detailHeader: {
    marginBottom: 16,
  },
  detailName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  detailRatingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailRating: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  detailRatingText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F59E0B",
    marginLeft: 4,
  },
  detailReviews: {
    fontSize: 13,
    color: "#64748b",
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  detailLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailLocationText: {
    fontSize: 15,
    color: "#1e293b",
    marginLeft: 8,
  },
  detailAddress: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  detailDescription: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  detailStatsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  detailStatCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  detailStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginTop: 4,
  },
  detailStatLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  detailActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  detailGuideBtn: {
    flex: 1,
    marginRight: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  detailPhotographerBtn: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  detailBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  detailBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  reviewPreview: {
    marginTop: 8,
    marginBottom: 20,
  },
  reviewPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewPreviewTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
  reviewPreviewAll: {
    fontSize: 12,
    color: "#2c5a73",
    fontWeight: "500",
  },
  reviewItem: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2c5a73",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  reviewerInitial: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  reviewerRating: {
    flexDirection: "row",
  },
  reviewText: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
    fontStyle: "italic",
  },
});