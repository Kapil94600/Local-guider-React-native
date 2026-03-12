import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
  Modal,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../context/AuthContext";
import { LocationContext } from "../../context/LocationContext";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

const BASE_URL = "https://localguider.sinfode.com";

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

// Rating Stars Component
const RatingStars = ({ rating, size = 14 }) => {
  const stars = [];
  const fullStars = Math.floor(rating || 0);
  const hasHalf = (rating || 0) % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Ionicons key={i} name="star" size={size} color="#FFD700" />);
    } else if (i === fullStars && hasHalf) {
      stars.push(<Ionicons key={i} name="star-half" size={size} color="#FFD700" />);
    } else {
      stars.push(<Ionicons key={i} name="star-outline" size={size} color="#FFD700" />);
    }
  }
  return <View style={styles.ratingStarsContainer}>{stars}</View>;
};

// Horizontal Review Card
const ReviewCard = ({ review }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return "";
    }
  };

  const userName = review?.fullName || review?.user?.name || review?.userName || "Anonymous";
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "U";
  const profileImage = review?.profileImage ? getImageUrl(review.profileImage) : null;
  const reviewText = review?.message || review?.comment || review?.review || "";

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.reviewerImage} />
        ) : (
          <LinearGradient colors={["#2c5a73", "#1e3c4f"]} style={styles.reviewerPlaceholder}>
            <Text style={styles.reviewerInitial}>{userInitial}</Text>
          </LinearGradient>
        )}
        <View style={styles.reviewerInfo}>
          <Text style={styles.reviewerName} numberOfLines={1}>{userName}</Text>
          <RatingStars rating={review?.rating} size={10} />
        </View>
      </View>
      <Text style={styles.reviewText} numberOfLines={3}>{reviewText}</Text>
      <Text style={styles.reviewDate}>{formatDate(review?.createdOn)}</Text>
    </View>
  );
};

// Animated Professional Card
const AnimatedProfessionalCard = ({ item, type, rank, onPress }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const imageUrl = item?.photograph || item?.featuredImage || item?.profileImage;
  const name = item?.firmName || item?.name || (type === "guider" ? "Tour Guide" : "Photographer");
  const location = item?.city || item?.state || "Location";
  const badge = item?.specialization || (type === "guider" ? "Tour Guide" : "Photographer");
  const gradientColors =
    type === "guider" ? ["#3B82F6", "#1E40AF"] : ["#8B5CF6", "#6D28D9"];

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[styles.personCard, { transform: [{ scale: scaleValue }] }]}>
        <View style={styles.personRank}>
          <Text style={styles.personRankText}>{rank}</Text>
        </View>
        <View style={styles.personImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: getImageUrl(imageUrl) }} style={styles.personImage} />
          ) : (
            <LinearGradient colors={gradientColors} style={styles.personImagePlaceholder}>
              <Text style={styles.personInitial}>{name.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          )}
        </View>
        <View style={styles.personInfo}>
          <Text style={styles.personName} numberOfLines={1}>{name}</Text>
          <View style={styles.personLocation}>
            <Ionicons name="location-outline" size={12} color="#64748b" />
            <Text style={styles.personLocationText} numberOfLines={1}>{location}</Text>
          </View>
          <RatingStars rating={item?.rating} size={12} />
          <View style={styles.personBadge}>
            <Text style={styles.personBadgeText}>{badge}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function PlaceDetailsScreen({ route, navigation }) {
  const placeId = route?.params?.placeId;
  const { user } = useContext(AuthContext);
  const { location } = useContext(LocationContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [place, setPlace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [guiders, setGuiders] = useState([]);
  const [photographers, setPhotographers] = useState([]);
  const [loadingGuiders, setLoadingGuiders] = useState(false);
  const [loadingPhotographers, setLoadingPhotographers] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [descExpanded, setDescExpanded] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    if (!placeId) {
      Alert.alert("Error", "Place ID not found", [
        { text: "Go Back", onPress: () => navigation.goBack() },
      ]);
      return;
    }
    fetchAllData();
  }, [placeId]);

  const fetchAllData = async () => {
    await Promise.allSettled([
      fetchPlaceDetails(),
      fetchReviews(),
      fetchGuiders(),
      fetchPhotographers(),
    ]);
  };

  const fetchPlaceDetails = async () => {
    try {
      setLoading(true);
      const response = await api.post(API.GET_PLACES, {
        placeId: placeId,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
      if (response?.data?.status) {
        const placesData = response.data.data || [];
        const placeData = placesData.find((p) => p.id === placeId) || placesData[0];
        setPlace(placeData);
      } else {
        console.warn("Failed to load place details:", response?.data?.message);
      }
    } catch (error) {
      console.error("Error fetching place:", error);
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const formData = new URLSearchParams();
      formData.append('placeId', placeId.toString());

      const response = await api.post(API.GET_ALL_REVIEW, formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (response?.data?.status === true) {
        let reviewsData = response.data.data || [];

        if (sortBy === "recent") {
          reviewsData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
        } else {
          reviewsData.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        setReviews(reviewsData);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.log("Reviews API Error:", error.response?.data || error.message);
      setReviews([]);
    }
  };

  const fetchGuiders = async () => {
    try {
      setLoadingGuiders(true);
      const formData = new URLSearchParams();
      formData.append('placeId', placeId.toString());

      const response = await api.post(API.GET_GUIDERS_BY_PLACE_ID, formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (response?.data?.status === true) {
        setGuiders(response.data.data || []);
      } else {
        setGuiders([]);
      }
    } catch (error) {
      console.log("Guiders API Error:", error.response?.data || error.message);
      setGuiders([]);
    } finally {
      setLoadingGuiders(false);
    }
  };

  const fetchPhotographers = async () => {
    try {
      setLoadingPhotographers(true);
      const formData = new URLSearchParams();
      formData.append('placeId', placeId.toString());

      const response = await api.post(API.GET_PHOTOGRAPHERS_BY_PLACE_ID, formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (response?.data?.status === true) {
        setPhotographers(response.data.data || []);
      } else {
        setPhotographers([]);
      }
    } catch (error) {
      console.log("Photographers API Error:", error.response?.data || error.message);
      setPhotographers([]);
    } finally {
      setLoadingPhotographers(false);
    }
  };

  const toggleDescription = () => {
    setDescExpanded(!descExpanded);
  };

  const getDisplayDescription = () => {
    if (!place?.description) return "No description available.";
    if (descExpanded) return place.description;
    if (place.description.length > 150) {
      return place.description.substring(0, 150) + "...";
    }
    return place.description;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5a73" />
        <Text style={styles.loadingText}>Loading place details...</Text>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#ef4444" />
        <Text style={styles.errorText}>Place not found</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const needsReadMore = place.description?.length > 150;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1e3c4f", "#2c5a73"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {place.placeName}
        </Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2c5a73"]} />}
      >
        {/* Place Card with Image and Text */}
        <View style={styles.rowContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setImageModalVisible(true)}
            style={styles.coverContainer}
          >
            {place.featuredImage ? (
              <Image
                source={{ uri: getImageUrl(place.featuredImage) }}
                style={styles.coverImage}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient colors={["#2c5a73", "#1e3c4f"]} style={styles.coverPlaceholder}>
                <Ionicons name="image-outline" size={30} color="#fff" />
              </LinearGradient>
            )}
          </TouchableOpacity>

          <View style={styles.textContentContainer}>
            <Text style={styles.placeNameText}>{place.placeName}</Text>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#4b5563" />
              <Text style={styles.infoText}>Explores in: 02hr 23 min</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#4b5563" />
              <Text style={styles.infoText}>
                {place.city || "Jaipur"} {place.state ? `(${place.state})` : ""}
              </Text>
            </View>
            <RatingStars rating={place.rating} size={16} />
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{getDisplayDescription()}</Text>
          {needsReadMore && (
            <TouchableOpacity onPress={toggleDescription} style={styles.readMoreButton}>
              <Text style={styles.readMoreText}>{descExpanded ? "Read Less" : "Read More"}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reviews Section - Horizontal Scroll */}
        <View style={styles.reviewsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reviews & Rating</Text>
            <TouchableOpacity onPress={() => setSortBy(sortBy === "recent" ? "top" : "recent")} style={styles.sortButton}>
              <Text style={styles.sortButtonText}>
                Sorted by {sortBy === "recent" ? "recent reviews" : "top rating"} ▼
              </Text>
            </TouchableOpacity>
          </View>

          {reviews.length > 0 ? (
            <FlatList
              data={reviews}
              renderItem={({ item }) => <ReviewCard review={item} />}
              keyExtractor={(item, index) => item.id?.toString() || index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reviewsHorizontalList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={40} color="#94a3b8" />
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          )}
        </View>

        {/* Top Guiders Section */}
        <View style={styles.personsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Guider</Text>
            <TouchableOpacity style={styles.sortButton}>
              <Text style={styles.sortButtonText}>Sorted by top rating ▼</Text>
            </TouchableOpacity>
          </View>

          {loadingGuiders ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#2c5a73" />
              <Text style={styles.loadingMoreText}>Loading guides...</Text>
            </View>
          ) : guiders.length > 0 ? (
            guiders.map((guider, index) => (
              <AnimatedProfessionalCard
                key={guider.id}
                item={guider}
                type="guider"
                rank={index + 1}
                onPress={() => navigation.navigate("ProfessionalDetails", {
                  professionalId: guider.id,
                  professionalType: 'guider',
                  placeId: place.id,
                  placeName: place.placeName,
                })}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={40} color="#94a3b8" />
              <Text style={styles.emptyText}>No guides available</Text>
            </View>
          )}
        </View>

        {/* Top Photographers Section */}
        <View style={styles.personsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Photographer</Text>
            <TouchableOpacity style={styles.sortButton}>
              <Text style={styles.sortButtonText}>Sorted by top rating ▼</Text>
            </TouchableOpacity>
          </View>

          {loadingPhotographers ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#2c5a73" />
              <Text style={styles.loadingMoreText}>Loading photographers...</Text>
            </View>
          ) : photographers.length > 0 ? (
            photographers.map((photographer, index) => (
              <AnimatedProfessionalCard
                key={photographer.id}
                item={photographer}
                type="photographer"
                rank={index + 1}
                onPress={() => navigation.navigate("ProfessionalDetails", {
                  professionalId: photographer.id,
                  professionalType: 'photographer',
                  placeId: place.id,
                  placeName: place.placeName,
                })}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="camera-outline" size={40} color="#94a3b8" />
              <Text style={styles.emptyText}>No photographers available</Text>
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal visible={imageModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setImageModalVisible(false)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: getImageUrl(place.featuredImage) }}
            style={styles.modalImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748b" },
  loadingMoreContainer: { padding: 20, alignItems: "center" },
  loadingMoreText: { marginTop: 8, fontSize: 14, color: "#64748b" },
  errorContainer: { padding: 20, alignItems: "center" },
  errorText: { fontSize: 14, color: "#ef4444", marginTop: 8 },
  errorButton: { backgroundColor: "#2c5a73", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  errorButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 46, paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", color: "#fff", textAlign: "center" },
  
  // Place Card
  rowContainer: { flexDirection: "row", padding: 16, gap: 16 },
  coverContainer: { width: 140, height: 160, borderRadius: 12, overflow: "hidden", borderWidth: 2, borderColor: "#e2e8f0", backgroundColor: "#fff" },
  coverImage: { width: "100%", height: "100%" },
  coverPlaceholder: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  textContentContainer: { flex: 1, justifyContent: "center" },
  placeNameText: { fontSize: 20, fontWeight: "700", color: "#1e293b", marginBottom: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 },
  infoText: { fontSize: 14, color: "#4b5563" },
  ratingStarsContainer: { flexDirection: "row", marginTop: 4, gap: 2 },
  
  // Description
  descriptionContainer: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: "#fff", marginTop: 8, paddingTop: 16 },
  descriptionText: { fontSize: 14, color: "#475569", lineHeight: 20 },
  readMoreButton: { marginTop: 8 },
  readMoreText: { fontSize: 14, color: "#2c5a73", fontWeight: "600" },
  
  // Sections
  reviewsSection: { backgroundColor: "#fff", marginTop: 8, padding: 16 },
  personsSection: { backgroundColor: "#fff", marginTop: 8, padding: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  sortButton: { padding: 4 },
  sortButtonText: { fontSize: 13, color: "#2c5a73", fontWeight: "500" },
  
  // Horizontal Review Card
  reviewsHorizontalList: { paddingRight: 16, gap: 12 },
  reviewCard: {
    width: 260,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  reviewerImage: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  reviewerPlaceholder: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 8 },
  reviewerInitial: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  reviewerInfo: { flex: 1 },
  reviewerName: { fontSize: 13, fontWeight: "600", color: "#1e293b" },
  reviewText: { fontSize: 12, color: "#475569", lineHeight: 16, marginBottom: 4 },
  reviewDate: { fontSize: 10, color: "#94a3b8", alignSelf: "flex-end" },
  
  // Professional Card
  personCard: { flexDirection: "row", backgroundColor: "#f8fafc", borderRadius: 12, padding: 12, marginBottom: 12, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0" },
  personRank: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#2c5a73", justifyContent: "center", alignItems: "center", marginRight: 12 },
  personRankText: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  personImageContainer: { width: 60, height: 60, borderRadius: 30, overflow: "hidden", marginRight: 12 },
  personImage: { width: "100%", height: "100%" },
  personImagePlaceholder: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  personInitial: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  personInfo: { flex: 1 },
  personName: { fontSize: 15, fontWeight: "600", color: "#1e293b", marginBottom: 2 },
  personLocation: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  personLocationText: { fontSize: 12, color: "#64748b", marginLeft: 4 },
  personBadge: { backgroundColor: "#e6f0f5", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignSelf: "flex-start", marginTop: 4 },
  personBadgeText: { fontSize: 10, color: "#2c5a73", fontWeight: "500" },
  
  emptyContainer: { padding: 30, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#94a3b8", marginTop: 8 },
  
  // Modal
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center" },
  modalClose: { position: "absolute", top: 50, right: 20, zIndex: 10 },
  modalImage: { width: "100%", height: "80%" },
});