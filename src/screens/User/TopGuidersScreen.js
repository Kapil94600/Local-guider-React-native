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

export default function TopGuidersScreen({ navigation }) {
  const { location } = useContext(LocationContext);

  const [guiders, setGuiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGuider, setSelectedGuider] = useState(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [services, setServices] = useState([]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchTopGuiders();
  }, [location]);

  const fetchTopGuiders = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const response = await api.post(API.GET_GUIDERS_ALL, {
        latitude: location?.latitude,
        longitude: location?.longitude,
        page: pageNum,
        perPage: 10,
        sortBy: "rating",
        minRating: 4.0, // Only show guiders with rating 4+
        status: "APPROVED",
      });

      if (response.data?.status) {
        const newGuiders = response.data.data || [];
        
        if (append) {
          setGuiders(prev => [...prev, ...newGuiders]);
        } else {
          setGuiders(newGuiders);
        }
        
        setHasMore(newGuiders.length === 10);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching top guiders:", error);
      Alert.alert("Error", "Failed to load top guides");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchTopGuiders(page + 1, true);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchTopGuiders(1, false);
  };

  const handleGuiderPress = (guider) => {
    setSelectedGuider(guider);
    fetchGuiderServices(guider.id);
  };

  const fetchGuiderServices = async (guiderId) => {
    try {
      const response = await api.post(API.GET_SERVICES, {
        guiderId: guiderId,
      });
      
      if (response.data?.status) {
        setServices(response.data.data || []);
        setDetailsModal(true);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      Alert.alert("Error", "Failed to load services");
    }
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

  const renderGuiderCard = ({ item, index }) => {
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
        style={styles.guiderCard}
        onPress={() => handleGuiderPress(item)}
        activeOpacity={0.7}
      >
        {/* Rank Badge */}
        <View style={[styles.rankBadge, { backgroundColor: rankBgColor }]}>
          <Text style={[styles.rankText, { color: rankColor }]}>
            #{index + 1}
          </Text>
        </View>

        <View style={styles.cardHeader}>
          {item.featuredImage ? (
            <Image
              source={{ uri: getImageUrl(item.featuredImage) }}
              style={styles.guiderImage}
            />
          ) : (
            <View style={[styles.guiderImage, styles.imagePlaceholder]}>
              <Text style={styles.placeholderText}>
                {item.firmName?.charAt(0) || item.name?.charAt(0) || "G"}
              </Text>
            </View>
          )}

          <View style={styles.guiderInfo}>
            <Text style={styles.guiderName} numberOfLines={1}>
              {item.firmName || item.name || "Tour Guide"}
            </Text>
            
            <View style={styles.ratingContainer}>
              {renderRating(item.rating)}
              <Text style={styles.ratingText}>({item.rating?.toFixed(1) || "0.0"})</Text>
            </View>

            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#64748b" />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.placeName || "Local Guide"}
              </Text>
            </View>

            <View style={styles.badgeContainer}>
              <View style={styles.experienceBadge}>
                <Ionicons name="time-outline" size={12} color="#2c5a73" />
                <Text style={styles.experienceText}>{item.experience || "5+"} years</Text>
              </View>
              
              {item.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={14} color="#64748b" />
              <Text style={styles.statText}>{item.totalBookings || 0} tours</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="happy-outline" size={14} color="#64748b" />
              <Text style={styles.statText}>{item.reviewCount || 0} reviews</Text>
            </View>
          </View>
          
          <LinearGradient
            colors={['#2c5a73', '#1e3c4f']}
            style={styles.viewProfileBadge}
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    );
  };

  const renderServiceCard = ({ item }) => (
    <View style={styles.serviceCard}>
      {item.image && (
        <Image
          source={{ uri: getImageUrl(item.image) }}
          style={styles.serviceImage}
        />
      )}
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceTitle}>{item.title}</Text>
        <Text style={styles.serviceDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.serviceFooter}>
          <Text style={styles.servicePrice}>₹{item.servicePrice}</Text>
          <Text style={styles.serviceDuration}>{item.duration || "2 hours"}</Text>
        </View>
      </View>
    </View>
  );

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
            <Text style={styles.modalTitle}>Top Guide Profile</Text>
            <TouchableOpacity onPress={() => setDetailsModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {selectedGuider && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile Header */}
              <View style={styles.detailProfileHeader}>
                {selectedGuider.featuredImage ? (
                  <Image
                    source={{ uri: getImageUrl(selectedGuider.featuredImage) }}
                    style={styles.detailProfileImage}
                  />
                ) : (
                  <View style={[styles.detailProfileImage, styles.detailImagePlaceholder]}>
                    <Text style={styles.detailPlaceholderText}>
                      {selectedGuider.firmName?.charAt(0) || selectedGuider.name?.charAt(0) || "G"}
                    </Text>
                  </View>
                )}

                {/* Top Rated Badge */}
                <View style={styles.detailTopRatedBadge}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.detailTopRatedText}>Top Rated Guide</Text>
                </View>
              </View>

              {/* Guide Info */}
              <View style={styles.detailInfoSection}>
                <Text style={styles.detailName}>
                  {selectedGuider.firmName || selectedGuider.name || "Tour Guide"}
                </Text>
                
                <View style={styles.detailRatingRow}>
                  <View style={styles.detailRating}>
                    {renderRating(selectedGuider.rating)}
                    <Text style={styles.detailRatingText}>
                      {selectedGuider.rating?.toFixed(1) || "0.0"}
                    </Text>
                  </View>
                  <Text style={styles.detailReviews}>
                    ({selectedGuider.reviewCount || 0} reviews)
                  </Text>
                </View>

                <View style={styles.detailBadgeRow}>
                  <View style={styles.detailVerifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.detailVerifiedText}>Verified Guide</Text>
                  </View>
                  <View style={styles.detailExperienceBadge}>
                    <Ionicons name="time-outline" size={16} color="#2c5a73" />
                    <Text style={styles.detailExperienceText}>
                      {selectedGuider.experience || "5+"} years experience
                    </Text>
                  </View>
                </View>
              </View>

              {/* Location */}
              <View style={styles.detailSection}>
                <View style={styles.detailLocationRow}>
                  <Ionicons name="location-outline" size={18} color="#2c5a73" />
                  <Text style={styles.detailLocationText}>
                    {selectedGuider.placeName || "Local Guide"} • {selectedGuider.city || "Your City"}
                  </Text>
                </View>
              </View>

              {/* About */}
              {selectedGuider.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>About</Text>
                  <Text style={styles.detailDescription}>
                    {selectedGuider.description}
                  </Text>
                </View>
              )}

              {/* Languages */}
              {selectedGuider.languages && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Languages</Text>
                  <View style={styles.languageChips}>
                    {selectedGuider.languages.split(',').map((lang, idx) => (
                      <View key={idx} style={styles.languageChip}>
                        <Text style={styles.languageText}>{lang.trim()}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Stats Grid */}
              <View style={styles.detailStatsGrid}>
                <View style={styles.detailStatCard}>
                  <Ionicons name="people-outline" size={22} color="#2c5a73" />
                  <Text style={styles.detailStatValue}>{selectedGuider.totalBookings || 0}</Text>
                  <Text style={styles.detailStatLabel}>Tours Done</Text>
                </View>
                <View style={styles.detailStatCard}>
                  <Ionicons name="happy-outline" size={22} color="#2c5a73" />
                  <Text style={styles.detailStatValue}>{selectedGuider.reviewCount || 0}</Text>
                  <Text style={styles.detailStatLabel}>Reviews</Text>
                </View>
                <View style={styles.detailStatCard}>
                  <Ionicons name="people-outline" size={22} color="#2c5a73" />
                  <Text style={styles.detailStatValue}>{selectedGuider.followers || 0}</Text>
                  <Text style={styles.detailStatLabel}>Followers</Text>
                </View>
              </View>

              {/* Services/Packages */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Tour Packages</Text>
                {services.length > 0 ? (
                  services.map((service, idx) => renderServiceCard({ item: service }))
                ) : (
                  <Text style={styles.noServicesText}>No packages available</Text>
                )}
              </View>

              {/* Reviews Preview */}
              <View style={styles.reviewPreview}>
                <View style={styles.reviewPreviewHeader}>
                  <Text style={styles.reviewPreviewTitle}>Recent Reviews</Text>
                  <TouchableOpacity>
                    <Text style={styles.reviewPreviewAll}>See All</Text>
                  </TouchableOpacity>
                </View>

                {/* Sample Reviews */}
                <View style={styles.reviewItem}>
                  <View style={styles.reviewerInfo}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.reviewerInitial}>R</Text>
                    </View>
                    <View>
                      <Text style={styles.reviewerName}>Rahul Sharma</Text>
                      <View style={styles.reviewerRating}>
                        {renderRating(5.0)}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewText}>
                    Excellent guide! Very knowledgeable about local history and culture.
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
                        {renderRating(4.5)}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewText}>
                    Great experience! Very friendly and professional.
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.detailActions}>
                <TouchableOpacity
                  style={styles.detailBookBtn}
                  onPress={() => {
                    setDetailsModal(false);
                    navigation.navigate("GuiderList", { guiderId: selectedGuider.id });
                  }}
                >
                  <LinearGradient
                    colors={["#2c5a73", "#1e3c4f"]}
                    style={styles.detailBtnGradient}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#fff" />
                    <Text style={styles.detailBtnText}>Book a Tour</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.detailMessageBtn}
                >
                  <LinearGradient
                    colors={["#8B5CF6", "#7C3AED"]}
                    style={styles.detailBtnGradient}
                  >
                    <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                    <Text style={styles.detailBtnText}>Send Message</Text>
                  </LinearGradient>
                </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Top Rated Guides</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Subtitle */}
        <Text style={styles.headerSubtitle}>
          Meet our highest rated tour guides
        </Text>

        {/* Results Count */}
        <Text style={styles.resultsCount}>
          {guiders.length} top guides found
        </Text>
      </LinearGradient>

      {/* Guiders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5a73" />
          <Text style={styles.loadingText}>Loading top guides...</Text>
        </View>
      ) : (
        <FlatList
          data={guiders}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderGuiderCard}
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
              <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Top Guides Found</Text>
              <Text style={styles.emptyText}>
                There are no highly rated guides in your area yet
              </Text>
              <TouchableOpacity 
                style={styles.exploreAllBtn}
                onPress={() => navigation.navigate("GuiderList")}
              >
                <Text style={styles.exploreAllText}>Explore All Guides</Text>
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
  guiderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    right: 12,
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
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  guiderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 12,
  },
  imagePlaceholder: {
    backgroundColor: "#2c5a73",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  guiderInfo: {
    flex: 1,
  },
  guiderName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  experienceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f0f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  experienceText: {
    fontSize: 10,
    color: "#2c5a73",
    fontWeight: "500",
    marginLeft: 2,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    color: "#10B981",
    fontWeight: "600",
    marginLeft: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
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
  viewProfileBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  viewProfileText: {
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
  detailProfileHeader: {
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  detailProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  detailImagePlaceholder: {
    backgroundColor: "#2c5a73",
    justifyContent: "center",
    alignItems: "center",
  },
  detailPlaceholderText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  detailTopRatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: 0,
    right: width * 0.3,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailTopRatedText: {
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
    marginLeft: 4,
  },
  detailInfoSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  detailName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  detailRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
  detailBadgeRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  detailVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  detailVerifiedText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
    marginLeft: 4,
  },
  detailExperienceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f0f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  detailExperienceText: {
    fontSize: 12,
    color: "#2c5a73",
    fontWeight: "600",
    marginLeft: 4,
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
  },
  detailLocationText: {
    fontSize: 14,
    color: "#1e293b",
    marginLeft: 8,
  },
  detailDescription: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  languageChips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  languageChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  languageText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
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
  serviceCard: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  serviceImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 4,
  },
  serviceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2c5a73",
  },
  serviceDuration: {
    fontSize: 11,
    color: "#64748b",
  },
  noServicesText: {
    fontSize: 13,
    color: "#64748b",
    fontStyle: "italic",
    textAlign: "center",
    padding: 16,
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
  detailActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  detailBookBtn: {
    flex: 1,
    marginRight: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  detailMessageBtn: {
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
});