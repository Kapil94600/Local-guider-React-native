import React, { useState, useEffect, useContext } from "react";
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
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../context/AuthContext";
import { LocationContext } from "../../context/LocationContext";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

const { width } = Dimensions.get("window");
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
      <Text style={styles.reviewText} numberOfLines={2}>{reviewText}</Text>
      <Text style={styles.reviewDate}>{formatDate(review?.createdOn)}</Text>
    </View>
  );
};

// Horizontal Card for Professionals (guiders/photographers)
const HorizontalProfessionalCard = ({ item, type, onPress }) => {
  const imageUrl = item?.photograph || item?.featuredImage || item?.profileImage;
  const name = item?.firmName || item?.name || (type === "guider" ? "Tour Guide" : "Photographer");
  const rating = item?.rating || 0;

  return (
    <TouchableOpacity style={styles.horizontalCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.horizontalCardImageContainer}>
        {imageUrl ? (
          <Image source={{ uri: getImageUrl(imageUrl) }} style={styles.horizontalCardImage} />
        ) : (
          <LinearGradient
            colors={type === "guider" ? ["#3B82F6", "#1E40AF"] : ["#8B5CF6", "#6D28D9"]}
            style={styles.horizontalCardPlaceholder}
          >
            <Text style={styles.horizontalCardInitial}>{name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
        )}
      </View>
      <Text style={styles.horizontalCardName} numberOfLines={1}>{name}</Text>
      <RatingStars rating={rating} size={12} />
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
  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Full-screen image modal
  const [fullScreenImageVisible, setFullScreenImageVisible] = useState(false);
  const [selectedFullScreenImage, setSelectedFullScreenImage] = useState(null);

  const totalReviews = reviews.length;

  // Fetch gallery images for this place
  const fetchGalleryImages = async () => {
    try {
      setLoadingGallery(true);
      const formData = new URLSearchParams();
      formData.append('placeId', placeId.toString());
      formData.append('page', '1');
      formData.append('perPage', '20');

      const response = await api.post(API.ALL_IMAGES_BY_ID, formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (response?.data?.status === true) {
        setGalleryImages(response.data.data || []);
      } else {
        setGalleryImages([]);
      }
    } catch (error) {
      console.log("Gallery API Error:", error.response?.data || error.message);
      setGalleryImages([]);
    } finally {
      setLoadingGallery(false);
    }
  };

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
      fetchGalleryImages(),
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
      formData.append("latitude", location?.latitude);
      formData.append("longitude", location?.longitude);
      formData.append("status", "Approved");

      const response = await api.post(
        API.GET_GUIDERS_ALL,
        formData.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (response?.data?.status === true) {
        const allGuiders = response.data.data || [];
        const filtered = allGuiders.filter(
          (g) => g.placeId === placeId || g.places?.includes(placeId.toString())
        );
        setGuiders(filtered);
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

  const getLocationDisplay = () => {
    let city = place.city || "";
    let state = place.state || "";
    if (city.includes(',')) city = city.split(',')[0].trim();
    if (state.includes(',')) state = state.split(',')[0].trim();
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) return state;
    return "Jaipur";
  };

  // Open full-screen image
  const openFullScreenImage = (imageUrl) => {
    setSelectedFullScreenImage(imageUrl);
    setFullScreenImageVisible(true);
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
        {/* Place Card */}
        <View style={styles.rowContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openFullScreenImage(getImageUrl(place.featuredImage))}
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
              <Ionicons name="location-outline" size={16} color="#4b5563" />
              <Text style={styles.infoText}>{getLocationDisplay()}</Text>
            </View>
            <RatingStars rating={place.rating} size={16} />

            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>{getDisplayDescription()}</Text>
              {needsReadMore && (
                <TouchableOpacity onPress={toggleDescription} style={styles.readMoreButton}>
                  <Text style={styles.readMoreText}>{descExpanded ? "Read Less" : "Read More"}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Gallery Section - Directly below description */}
        {galleryImages.length > 0 && (
          <View style={styles.gallerySection}>
            <Text style={styles.galleryTitle}>Photo Gallery</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryScroll}
            >
              {galleryImages.map((img, idx) => (
                <TouchableOpacity
                  key={img.id || idx}
                  onPress={() => openFullScreenImage(getImageUrl(img.image))}
                >
                  <Image
                    source={{ uri: getImageUrl(img.image) }}
                    style={styles.galleryImage}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reviews Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reviews & Rating</Text>
            <View style={{ alignItems: 'flex-end' }}>
              {totalReviews > 0 ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="star" size={25} color="#FFD700" />
                    <Text style={styles.ratingTop}>
                      {" "}{place.rating?.toFixed(1) || '0'}
                    </Text>
                  </View>
                  <Text style={styles.ratingBottom}>
                    ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
                  </Text>
                </>
              ) : (
                <Text style={styles.ratingSummaryTexta}>No reviews yet</Text>
              )}
            </View>
          </View>

          <View style={{ marginTop: 6 }}>
            <TouchableOpacity
              onPress={() => setSortBy(sortBy === "recent" ? "top" : "recent")}
              style={styles.sortButton}
            >
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

        {/* Top Photographers Section */}
        <View style={styles.personsSection}>
          <View style={styles.sectionHeadera}>
            <Text style={styles.sectionTitle}>Top Photographer</Text>
            <TouchableOpacity style={styles.sortButton}>
              <Text style={styles.sortButtonTexta}>Sorted by top rating ▼</Text>
            </TouchableOpacity>
          </View>

          {loadingPhotographers ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#2c5a73" />
              <Text style={styles.loadingMoreText}>Loading photographers...</Text>
            </View>
          ) : photographers.length > 0 ? (
            <FlatList
              data={photographers}
              renderItem={({ item }) => (
                <HorizontalProfessionalCard
                  item={item}
                  type="photographer"
                  onPress={() => navigation.navigate("ProfessionalDetails", {
                    professionalId: item.id,
                    professionalType: 'photographer',
                    placeId: place.id,
                    placeName: place.placeName,
                  })}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="camera-outline" size={40} color="#94a3b8" />
              <Text style={styles.emptyText}>No photographers available</Text>
            </View>
          )}
        </View>

        {/* Top Guiders Section */}
        <View style={styles.personsSection}>
          <View style={styles.sectionHeadera}>
            <Text style={styles.sectionTitle}>Top Guider</Text>
            <TouchableOpacity style={styles.sortButton}>
              <Text style={styles.sortButtonTexta}>Sorted by top rating ▼</Text>
            </TouchableOpacity>
          </View>

          {loadingGuiders ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#2c5a73" />
              <Text style={styles.loadingMoreText}>Loading guides...</Text>
            </View>
          ) : guiders.length > 0 ? (
            <FlatList
              data={guiders}
              renderItem={({ item }) => (
                <HorizontalProfessionalCard
                  item={item}
                  type="guider"
                  onPress={() => navigation.navigate("ProfessionalDetails", {
                    professionalId: item.id,
                    professionalType: 'guider',
                    placeId: place.id,
                    placeName: place.placeName,
                  })}
                />
              )}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={40} color="#94a3b8" />
              <Text style={styles.emptyText}>No guides available</Text>
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Full‑screen image modal (for both featured and gallery) */}
      <Modal visible={fullScreenImageVisible} transparent={true} animationType="fade">
        <View style={styles.fullScreenModalContainer}>
          <TouchableOpacity
            style={styles.fullScreenClose}
            onPress={() => setFullScreenImageVisible(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {selectedFullScreenImage && (
            <Image
              source={{ uri: selectedFullScreenImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
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
  coverContainer: { width: 125, height: 125, borderRadius: 12, overflow: "hidden", borderWidth: 5, borderColor: "#ffffff", backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
  coverImage: { width: "100%", height: "100%" },
  coverPlaceholder: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  textContentContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  placeNameText: { fontSize: 21, fontWeight: "700", color: "#2c5a73", marginBottom: 8 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 },
  infoText: { fontSize: 12, color: "#63676d" },
  ratingStarsContainer: { flexDirection: "row", marginTop: 4, gap: 2 },
  ratingTop: { fontSize: 26, fontWeight: "bold", color: "#2c5a73", marginLeft: 1 },
  ratingBottom: { fontSize: 12, color: "#777", marginLeft: 1 },
  descriptionContainer: { marginTop: 12 },
  descriptionText: { fontSize: 11, color: "#63676d", lineHeight: 20, fontWeight: "500", textAlign: "center" },
  readMoreButton: { marginTop: 4 },
  readMoreText: { fontSize: 14, color: "#2c5a73", fontWeight: "600" },

  // Gallery Section (replaces the button)
  gallerySection: { marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  galleryTitle: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 8 },
  galleryScroll: { paddingVertical: 4 },
  galleryImage: { width: 100, height: 100, borderRadius: 8, marginRight: 8, backgroundColor: "#e2e8f0" },

  // Reviews Section
  reviewsSection: { backgroundColor: "#fff", marginTop: 4, padding: 16 },
  personsSection: { backgroundColor: "#fff", marginTop: 0, padding: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionHeadera: { flexDirection: "column", alignItems: "flex-start" },
  sectionTitle: { fontSize: 22, fontWeight: "700", color: "#2c5a73", marginTop: -1, marginBottom: 4 },
  sortButton: { padding: 0 },
  sortButtonText: { fontSize: 12, color: "#637985", fontWeight: "400", marginTop: -10, marginBottom: 18 },
  sortButtonTexta: { fontSize: 12, color: "#637985", fontWeight: "400", marginTop: 0, marginBottom: 18 },

  // Horizontal Review Card
  reviewsHorizontalList: { paddingRight: 16, gap: 12 },
  reviewCard: {
    width: 220,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#f6f6f6",
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  reviewerImage: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  reviewerPlaceholder: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginRight: 8 },
  reviewerInitial: { fontSize: 16, fontWeight: "bold", color: "#fff" },
  reviewerInfo: { flex: 1 },
  reviewerName: { fontSize: 13, fontWeight: "600", color: "#1e293b" },
  reviewText: { fontSize: 12, color: "#475569", lineHeight: 16, marginBottom: 6 },
  reviewDate: { fontSize: 10, color: "#94a3b8", alignSelf: "flex-end", marginTop: 2 },

  // Horizontal Professional Card
  horizontalCard: {
    width: 130,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginRight: 12,
    padding: 8,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  horizontalCardImageContainer: {
    width: '115%',
    height: 100,
    backgroundColor: '#ffffff',
    padding: '5%',
    borderColor: '#ebecee',
    borderWidth: 1,
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
    marginTop: -9
  },
  horizontalCardImage: { width: "100%", height: "100%", borderRadius: 12 },
  horizontalCardPlaceholder: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  horizontalCardInitial: { fontSize: 40, fontWeight: "bold", color: "#fff" },
  horizontalCardName: { fontSize: 14, fontWeight: "600", color: "#1e293b", textAlign: "center", marginBottom: 4 },

  // Empty state
  emptyContainer: { padding: 30, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#94a3b8", marginTop: 8 },
  ratingSummaryTexta: { fontSize: 12, color: "#2c5a73", fontWeight: "600" },

  // Full‑screen image modal
  fullScreenModalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" },
  fullScreenClose: { position: "absolute", top: 50, right: 20, zIndex: 10 },
  fullScreenImage: { width: "100%", height: "80%", resizeMode: "contain" },
});