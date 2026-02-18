import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import UserMenuOverlay from "../components/UserMenuOverlay";
import { AuthContext } from "../context/AuthContext";
import { LocationContext } from "../context/LocationContext";
import api from "../api/apiClient";
import { API } from "../api/endpoints";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_URL = "https://localguider.sinfode.com";

// Local images from assets folder - आप अपनी images यहां लगाएं
const FEATURED_IMAGES = [
  {
    id: 1,
    source: require("../../assets/images/place6.jpg"),
    title: "Lake Pichola",
    location: "Udaipur",

  },
  {
    id: 2,
    source: require("../../assets/images/place1.jpg"),
    title: "Hawa Mahal",
    location: "Jaipur",

  },
  {
    id: 3,
    source: require("../../assets/images/place2.jpg"),
    title: "Jaisalmer Fort",
    location: "Jaisalmer",

  },
  {
    id: 4,
    source: require("../../assets/images/place3.jpg"),
    title: "Taj Mahal",
    location: "Agra",
    rating: 4.8
  },
  {
    id: 5,
    source: require("../../assets/images/place5.jpg"),
    title: "Amber Fort",
    location: "Jaipur",

  },
  {
    id: 6,
    source: require("../../assets/images/place4.jpg"),
    title: "Ladakh",
    location: "Ladakh (Leh–Manali Highway Region)",

  },
  {
    id: 7,
    source: require("../../assets/images/place7.jpg"),
    title: "Dharamshala",
    location: "Himachal Pradesh",

  },
  {
    id: 8,
    source: require("../../assets/images/place8.jpg"),
    title: "Baga Beach",
    location: "Goa",

  },
  {
    id: 9,
    source: require("../../assets/images/place9.jpg"),
    title: "Nahargarh Fort",
    location: "Jaipur",

  },
];

export default function UserDashboard({ navigation }) {
  const { user, refreshUser } = useContext(AuthContext);
  const { location, loading: locationLoading, refreshLocation } = useContext(LocationContext);

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState({
    places: false,
    guiders: false,
    photographers: false,
    topPlaces: false,
    topGuiders: false,
    topPhotographers: false,
  });

  // Auto-scroll references
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoScrollTimer = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Modal States
  const [placeModal, setPlaceModal] = useState(false);
  const [guiderModal, setGuiderModal] = useState(false);
  const [photographerModal, setPhotographerModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedGuider, setSelectedGuider] = useState(null);
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);

  const [data, setData] = useState({
    places: [],
    guiders: [],
    photographers: [],
    topPlaces: [],
    topGuiders: [],
    topPhotographers: [],
  });

  useEffect(() => {
    refreshUser && refreshUser();
    if (refreshLocation) {
      refreshLocation();
    }
  }, []);

  useEffect(() => {
    if (location?.latitude && location?.longitude) {
      fetchAllData();
    } else {
      if (refreshLocation) {
        refreshLocation();
      }
    }
  }, [location]);

  // ✅ Auto-scroll effect for image carousel
  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, []);

  const startAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }

    autoScrollTimer.current = setInterval(() => {
      if (FEATURED_IMAGES.length > 1) {
        setCurrentIndex(prev => {
          const nextIndex = (prev + 1) % FEATURED_IMAGES.length;
          if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          }
          return nextIndex;
        });
      }
    }, 4000); // Change every 4 seconds
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchTopPlaces(),
      fetchTopGuiders(),
      fetchTopPhotographers(),
      fetchPlaces(),
      fetchGuiders(),
      fetchPhotographers(),
    ]);
  };

  const fetchPlaces = async (page = 1) => {
    try {
      setLoading(prev => ({ ...prev, places: true }));
      const response = await api.post(API.GET_PLACES, {
        latitude: location?.latitude,
        longitude: location?.longitude,
        page,
        perPage: 10,
        searchText: searchQuery,
      });

      if (response.data?.status) {
        setData(prev => ({
          ...prev,
          places: page === 1 ? response.data.data : [...prev.places, ...response.data.data],
        }));
      }
    } catch (error) {
      console.error("Error fetching places:", error);
    } finally {
      setLoading(prev => ({ ...prev, places: false }));
    }
  };

  const fetchGuiders = async (page = 1) => {
    try {
      setLoading(prev => ({ ...prev, guiders: true }));
      const response = await api.post(API.GET_GUIDERS_ALL, {
        latitude: location?.latitude,
        longitude: location?.longitude,
        page,
        perPage: 10,
        searchText: searchQuery,
        sortBy: "rating",
        status: "APPROVED",
      });

      if (response.data?.status) {
        setData(prev => ({
          ...prev,
          guiders: page === 1 ? response.data.data : [...prev.guiders, ...response.data.data],
        }));
      }
    } catch (error) {
      console.error("Error fetching guiders:", error);
    } finally {
      setLoading(prev => ({ ...prev, guiders: false }));
    }
  };

  const fetchPhotographers = async (page = 1) => {
    try {
      setLoading(prev => ({ ...prev, photographers: true }));
      const response = await api.post(API.GET_PHOTOGRAPHERS_ALL, {
        latitude: location?.latitude,
        longitude: location?.longitude,
        page,
        perPage: 10,
        searchText: searchQuery,
        sortBy: "rating",
        status: "APPROVED",
      });

      if (response.data?.status) {
        setData(prev => ({
          ...prev,
          photographers: page === 1 ? response.data.data : [...prev.photographers, ...response.data.data],
        }));
      }
    } catch (error) {
      console.error("Error fetching photographers:", error);
    } finally {
      setLoading(prev => ({ ...prev, photographers: false }));
    }
  };

  const fetchTopPlaces = async () => {
    try {
      setLoading(prev => ({ ...prev, topPlaces: true }));
      const response = await api.post(API.GET_PLACES, {
        latitude: location?.latitude,
        longitude: location?.longitude,
        page: 1,
        perPage: 10,
        sortBy: "rating",
        minRating: 4.0,
      });

      if (response.data?.status) {
        setData(prev => ({ ...prev, topPlaces: response.data.data || [] }));
      }
    } catch (error) {
      console.error("Error fetching top places:", error);
    } finally {
      setLoading(prev => ({ ...prev, topPlaces: false }));
    }
  };

  const fetchTopGuiders = async () => {
    try {
      setLoading(prev => ({ ...prev, topGuiders: true }));
      const response = await api.post(API.GET_GUIDERS_ALL, {
        latitude: location?.latitude,
        longitude: location?.longitude,
        page: 1,
        perPage: 10,
        sortBy: "rating",
        minRating: 4.0,
        status: "APPROVED",
      });

      if (response.data?.status) {
        setData(prev => ({ ...prev, topGuiders: response.data.data || [] }));
      }
    } catch (error) {
      console.error("Error fetching top guiders:", error);
    } finally {
      setLoading(prev => ({ ...prev, topGuiders: false }));
    }
  };

  const fetchTopPhotographers = async () => {
    try {
      setLoading(prev => ({ ...prev, topPhotographers: true }));
      const response = await api.post(API.GET_PHOTOGRAPHERS_ALL, {
        latitude: location?.latitude,
        longitude: location?.longitude,
        page: 1,
        perPage: 10,
        sortBy: "rating",
        minRating: 4.0,
        status: "APPROVED",
      });

      if (response.data?.status) {
        setData(prev => ({ ...prev, topPhotographers: response.data.data || [] }));
      }
    } catch (error) {
      console.error("Error fetching top photographers:", error);
    } finally {
      setLoading(prev => ({ ...prev, topPhotographers: false }));
    }
  };

  const handleSearch = () => {
    fetchPlaces(1);
    fetchGuiders(1);
    fetchPhotographers(1);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (refreshLocation) {
      await refreshLocation();
    }
    await fetchAllData();
    setRefreshing(false);
  };

  const handleLocationPress = () => {
    navigation.navigate("LocationSearch", {
      onLocationSelected: (selectedLocation) => {
        if (refreshLocation) {
          refreshLocation();
        }
      }
    });
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

  const userName = user?.name?.trim()
    ? user.name
    : user?.username || user?.email || "User";

  const getLocationText = () => {
    if (locationLoading) return "Detecting location...";
    if (location?.city) {
      return `${location.city}${location.state ? ", " + location.state : ""}`;
    }
    if (location?.error) return "Location unavailable";
    return "Select location";
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
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  // ✅ Beautiful Card Type Auto-Scrolling Carousel - NON-CLICKABLE
  const renderFeaturedCarousel = () => (
    <View style={styles.featuredCarouselWrapper}>
      <FlatList
        ref={flatListRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        data={FEATURED_IMAGES}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.featuredCard}>
            <Image
              source={item.source}
              style={styles.featuredCardImage}
              resizeMode="cover"
            />

            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.featuredCardOverlay}
            />

            {/* Card Content */}
            <View style={styles.featuredCardContent}>
              <View style={styles.featuredCardHeader}>
                <Text style={styles.featuredCardTitle}>{item.title}</Text>
                <View style={styles.featuredCardRating}>
                  {/* <Ionicons name="star" size={14} color="#FFD700" /> */}
                  {/* <Text style={styles.featuredCardRatingText}>{item.rating}</Text> */}
                </View>
              </View>

              <View style={styles.featuredCardLocation}>
                <Ionicons name="location-outline" size={12} color="#fff" />
                <Text style={styles.featuredCardLocationText}>{item.location}</Text>
              </View>

              {/* <View style={styles.featuredCardBadge}>
                <Text style={styles.featuredCardBadgeText}>Explore Now</Text>
                <Ionicons name="arrow-forward" size={12} color="#fff" />
              </View> */}
            </View>
          </View>
        )}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
      />

      {/* Custom Pagination */}
      <View style={styles.paginationWrapper}>
        {FEATURED_IMAGES.map((_, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  width: dotWidth,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );

  // ✅ Modern Search Bar
  const renderSearchBar = () => (
    <View style={styles.searchWrapper}>
      {/* <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.searchGradient}
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#2c5a73" />
          <TextInput
            placeholder="Search places, guides, photographers..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient> */}
    </View>
  );

  // ✅ Place Details Modal
  const renderPlaceModal = () => (
    <Modal
      visible={placeModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setPlaceModal(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setPlaceModal(false)}
      >
        <View style={styles.modalContent}>
          {selectedPlace && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedPlace.placeName}</Text>
                <TouchableOpacity onPress={() => setPlaceModal(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              {selectedPlace.featuredImage ? (
                <Image
                  source={{ uri: getImageUrl(selectedPlace.featuredImage) }}
                  style={styles.modalImage}
                />
              ) : (
                <LinearGradient
                  colors={['#2c5a73', '#1e3c4f']}
                  style={styles.modalImagePlaceholder}
                >
                  <Ionicons name="image-outline" size={40} color="#fff" />
                </LinearGradient>
              )}

              <View style={styles.modalRating}>
                {renderRating(selectedPlace.rating)}
                <Text style={styles.modalRatingText}>({selectedPlace.rating?.toFixed(1) || '0.0'})</Text>
              </View>

              <View style={styles.modalLocation}>
                <Ionicons name="location-outline" size={16} color="#2c5a73" />
                <Text style={styles.modalLocationText}>
                  {selectedPlace.city}, {selectedPlace.state}
                </Text>
              </View>

              <Text style={styles.modalDescription}>
                {selectedPlace.description || "No description available"}
              </Text>

              <View style={styles.modalStats}>
                <View style={styles.modalStat}>
                  <Ionicons name="eye-outline" size={18} color="#2c5a73" />
                  <Text style={styles.modalStatValue}>{selectedPlace.views || 0}</Text>
                  <Text style={styles.modalStatLabel}>Views</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setPlaceModal(false);
                  navigation.navigate("PlaceDetails", { placeId: selectedPlace.id });
                }}
              >
                <LinearGradient
                  colors={["#2c5a73", "#1e3c4f"]}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>View Full Details</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ✅ Guider Details Modal
  const renderGuiderModal = () => (
    <Modal
      visible={guiderModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setGuiderModal(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setGuiderModal(false)}
      >
        <View style={styles.modalContent}>
          {selectedGuider && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedGuider.firmName || selectedGuider.name || "Tour Guide"}
                </Text>
                <TouchableOpacity onPress={() => setGuiderModal(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalProfileHeader}>
                {selectedGuider.featuredImage ? (
                  <Image
                    source={{ uri: getImageUrl(selectedGuider.featuredImage) }}
                    style={styles.modalProfileImage}
                  />
                ) : (
                  <View style={[styles.modalProfileImage, styles.modalImagePlaceholder]}>
                    <Text style={styles.modalProfileInitial}>
                      {selectedGuider.firmName?.charAt(0) || selectedGuider.name?.charAt(0) || 'G'}
                    </Text>
                  </View>
                )}

                <View style={styles.modalRating}>
                  {renderRating(selectedGuider.rating)}
                  <Text style={styles.modalRatingText}>({selectedGuider.rating?.toFixed(1) || '0.0'})</Text>
                </View>

                <View style={styles.modalLocation}>
                  <Ionicons name="location-outline" size={16} color="#2c5a73" />
                  <Text style={styles.modalLocationText}>
                    {selectedGuider.placeName || "Local Guide"}
                  </Text>
                </View>
              </View>

              {selectedGuider.verified && (
                <View style={styles.modalVerifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.modalVerifiedText}>Verified Guide</Text>
                </View>
              )}

              <Text style={styles.modalDescription}>
                {selectedGuider.description || "No description available"}
              </Text>

              <View style={styles.modalStats}>
                <View style={styles.modalStat}>
                  <Ionicons name="people-outline" size={18} color="#2c5a73" />
                  <Text style={styles.modalStatValue}>{selectedGuider.totalBookings || 0}</Text>
                  <Text style={styles.modalStatLabel}>Tours</Text>
                </View>
                <View style={styles.modalStat}>
                  <Ionicons name="star-outline" size={18} color="#2c5a73" />
                  <Text style={styles.modalStatValue}>{selectedGuider.reviewCount || 0}</Text>
                  <Text style={styles.modalStatLabel}>Reviews</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setGuiderModal(false);
                  navigation.navigate("GuiderDetails", { guiderId: selectedGuider.id });
                }}
              >
                <LinearGradient
                  colors={["#2c5a73", "#1e3c4f"]}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>View Full Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ✅ Photographer Details Modal
  const renderPhotographerModal = () => (
    <Modal
      visible={photographerModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setPhotographerModal(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setPhotographerModal(false)}
      >
        <View style={styles.modalContent}>
          {selectedPhotographer && (
            <>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {selectedPhotographer.firmName || selectedPhotographer.name || "Photographer"}
                </Text>
                <TouchableOpacity onPress={() => setPhotographerModal(false)}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalProfileHeader}>
                {selectedPhotographer.featuredImage ? (
                  <Image
                    source={{ uri: getImageUrl(selectedPhotographer.featuredImage) }}
                    style={styles.modalProfileImage}
                  />
                ) : (
                  <View style={[styles.modalProfileImage, styles.modalImagePlaceholder]}>
                    <Text style={styles.modalProfileInitial}>
                      {selectedPhotographer.firmName?.charAt(0) || selectedPhotographer.name?.charAt(0) || 'P'}
                    </Text>
                  </View>
                )}

                <View style={styles.modalRating}>
                  {renderRating(selectedPhotographer.rating)}
                  <Text style={styles.modalRatingText}>({selectedPhotographer.rating?.toFixed(1) || '0.0'})</Text>
                </View>

                <View style={styles.modalLocation}>
                  <Ionicons name="location-outline" size={16} color="#2c5a73" />
                  <Text style={styles.modalLocationText}>
                    {selectedPhotographer.placeName || "Local Photographer"}
                  </Text>
                </View>
              </View>

              {selectedPhotographer.verified && (
                <View style={styles.modalVerifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.modalVerifiedText}>Verified Photographer</Text>
                </View>
              )}

              <Text style={styles.modalDescription}>
                {selectedPhotographer.description || "No description available"}
              </Text>

              <View style={styles.modalStats}>
                <View style={styles.modalStat}>
                  <Ionicons name="camera-outline" size={18} color="#2c5a73" />
                  <Text style={styles.modalStatValue}>{selectedPhotographer.totalBookings || 0}</Text>
                  <Text style={styles.modalStatLabel}>Shoots</Text>
                </View>
                <View style={styles.modalStat}>
                  <Ionicons name="star-outline" size={18} color="#2c5a73" />
                  <Text style={styles.modalStatValue}>{selectedPhotographer.reviewCount || 0}</Text>
                  <Text style={styles.modalStatLabel}>Reviews</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setPhotographerModal(false);
                  navigation.navigate("PhotographerDetails", { photographerId: selectedPhotographer.id });
                }}
              >
                <LinearGradient
                  colors={["#2c5a73", "#1e3c4f"]}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>View Full Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* MENU OVERLAY */}
      <UserMenuOverlay
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(screen) => {
          setMenuOpen(false);
          if (screen !== "Logout") navigation.navigate(screen);
        }}
      />

      {/* HEADER with Gradient */}
      <LinearGradient
        colors={['#1e3c4f', '#2c5a73', '#3b7a8f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuBtn}>
            <Ionicons name="menu" size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.locationContainer}
            onPress={() => navigation.navigate("LocationSearch")}
          >
            <Text style={styles.greeting}>{userName}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#fff" />
              <Text style={styles.locationText} numberOfLines={1}>
                {getLocationText()}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => navigation.navigate("ProfileUpdate")}>
              <Ionicons name="person-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2c5a73']}
            tintColor="#2c5a73"
          />
        }
      >
        {/* BEAUTIFUL CARD TYPE AUTO-SCROLLING CAROUSEL - NON-CLICKABLE */}
        {renderFeaturedCarousel()}

        {/* MODERN SEARCH BAR - BELOW CAROUSEL */}
        {renderSearchBar()}

        {/* ===== 3 MAIN CATEGORY CARDS ===== */}
        <View style={styles.categoryContainer}>
          {/* Tour Guides Card */}
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate("GuiderListScreen")}
          >
            <LinearGradient
              colors={['#d2a0a0', '#4f1e1e']}
              style={styles.categoryGradient}
            >
              <View style={styles.categoryIconContainer}>

                <Image
                  source={require('../../assets/images/ic_guider_home.webp')}
                  style={styles.placeCardImage}
                />

              </View>
              <Text style={styles.categoryTitle}>Tour Guides</Text>
              <Text style={styles.categoryCount}></Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Photographers Card */}
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate("PhotographersListScreen")}
          >
            <LinearGradient
              colors={['#1986ae', '#a8d6dd']}
              style={styles.categoryGradient}
            >
              <View style={styles.categoryIconContainer}>
                <Image
                  source={require('../../assets/images/ic_photographers_home.webp')}
                  style={styles.placeCardImage}
                />
              </View>
              <Text style={styles.categoryTitle}>Photographers</Text>
              <Text style={styles.categoryCount}></Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Places Card */}
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate("PlaceListScreen")}
          >
            <LinearGradient
              colors={['#c1b7cd', '#2a1542']}
              style={styles.categoryGradient}
            >
              <View style={styles.categoryIconContainer}>
                <Image
                  source={require('../../assets/images/ic_place.webp')}
                  style={styles.placeCardImage}
                />
              </View>
              <Text style={styles.categoryTitle}>Places</Text>
              <Text style={styles.categoryCount}>{data.places.length}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* TOP PLACES SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>Top Rated Places</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("TopPlacesScreen")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal scroll of top places */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {data.topPlaces.length > 0 ? (
              data.topPlaces.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.placeCardSmall}
                  onPress={() => {
                    setSelectedPlace(place);
                    setPlaceModal(true);
                  }}
                >
                  {place.featuredImage ? (
                    <Image
                      source={{ uri: getImageUrl(place.featuredImage) }}
                      style={styles.placeCardImage}
                    />
                  ) : (
                    <LinearGradient
                      colors={['#2c5a73', '#1e3c4f']}
                      style={styles.placeCardImagePlaceholder}
                    >
                      <Ionicons name="image-outline" size={24} color="#fff" />
                    </LinearGradient>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.placeCardOverlay}
                  >
                    <Text style={styles.placeCardName}>{place.placeName}</Text>
                    <View style={styles.placeCardRating}>
                      <Ionicons name="star" size={10} color="#FFD700" />
                      <Text style={styles.placeCardRatingText}>{place.rating?.toFixed(1) || '0.0'}</Text>
                    </View>
                    <Text style={styles.placeCardLocation}>{place.city}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No top places found</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* TOP GUIDERS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="people" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Top Tour Guides</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("TopGuidersScreen")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal scroll of top guides */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {data.topGuiders.length > 0 ? (
              data.topGuiders.map((guider) => (
                <TouchableOpacity
                  key={guider.id}
                  style={styles.personCardSmall}
                  onPress={() => {
                    setSelectedGuider(guider);
                    setGuiderModal(true);
                  }}
                >
                  {guider.featuredImage ? (
                    <Image
                      source={{ uri: getImageUrl(guider.featuredImage) }}
                      style={styles.personCardImage}
                    />
                  ) : (
                    <View style={[styles.personCardImage, styles.personImagePlaceholder]}>
                      <Text style={styles.personInitial}>
                        {guider.firmName?.charAt(0) || guider.name?.charAt(0) || 'G'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.personCardName} numberOfLines={1}>
                    {guider.firmName || guider.name || 'Guide'}
                  </Text>
                  <View style={styles.personCardRating}>
                    <Ionicons name="star" size={10} color="#FFD700" />
                    <Text style={styles.personCardRatingText}>{guider.rating?.toFixed(1) || '0.0'}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No top guides found</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* TOP PHOTOGRAPHERS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="camera" size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Top Photographers</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("TopPhotographers")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal scroll of top photographers */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {data.topPhotographers.length > 0 ? (
              data.topPhotographers.map((photographer) => (
                <TouchableOpacity
                  key={photographer.id}
                  style={styles.personCardSmall}
                  onPress={() => {
                    setSelectedPhotographer(photographer);
                    setPhotographerModal(true);
                  }}
                >
                  {photographer.featuredImage ? (
                    <Image
                      source={{ uri: getImageUrl(photographer.featuredImage) }}
                      style={styles.personCardImage}
                    />
                  ) : (
                    <View style={[styles.personCardImage, styles.personImagePlaceholder]}>
                      <Text style={styles.personInitial}>
                        {photographer.firmName?.charAt(0) || photographer.name?.charAt(0) || 'P'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.personCardName} numberOfLines={1}>
                    {photographer.firmName || photographer.name || 'Photographer'}
                  </Text>
                  <View style={styles.personCardRating}>
                    <Ionicons name="star" size={10} color="#FFD700" />
                    <Text style={styles.personCardRatingText}>{photographer.rating?.toFixed(1) || '0.0'}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No top photographers found</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modals - only for other sections */}
      {renderPlaceModal()}
      {renderGuiderModal()}
      {renderPhotographerModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 46,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuBtn: {
    padding: 6,
  },
  locationContainer: {
    alignItems: 'center',
  },
  greeting: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    color: '#fff',
    fontSize: 12,
    marginHorizontal: 4,
    maxWidth: 140,
    opacity: 0.9,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },

  // Featured Carousel Styles - NON-CLICKABLE
  featuredCarouselWrapper: {
    height: 240,
    marginTop: 12,
    marginBottom: 8,
  },
  featuredCard: {
    width: SCREEN_WIDTH - 32,
    height: 220,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  featuredCardImage: {
    width: '100%',
    height: '100%',
  },
  featuredCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  featuredCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  featuredCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  featuredCardTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  featuredCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  featuredCardRatingText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  featuredCardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredCardLocationText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
    opacity: 0.9,
  },
  featuredCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c5a73',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  featuredCardBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  paginationWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2c5a73',
    marginHorizontal: 4,
  },

  // Modern Search Bar
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 24,
    marginTop: 8,
  },
  searchGradient: {
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1e293b',
  },
  clearBtn: {
    padding: 4,
  },

  // Category Cards
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 28,
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  categoryGradient: {
    padding: 16,
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    opacity: 0.9,
  },

  // Section Styles
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 8,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2c5a73',
    fontWeight: '600',
  },

  // Place Card Small
  placeCardSmall: {
    width: 140,
    height: 160,
    marginLeft: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  placeCardImage: {
    width: '100%',
    height: '100%',
  },
  placeCardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    paddingTop: 30,
  },
  placeCardName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  placeCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  placeCardRatingText: {
    color: '#fff',
    fontSize: 11,
    marginLeft: 2,
  },
  placeCardLocation: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.9,
  },

  // Person Card Small
  personCardSmall: {
    width: 110,
    marginLeft: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  personCardImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  personImagePlaceholder: {
    backgroundColor: '#2c5a73',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  personCardName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  personCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personCardRatingText: {
    fontSize: 10,
    color: '#64748b',
    marginLeft: 2,
  },

  // Empty States
  emptyCard: {
    width: 200,
    height: 100,
    marginLeft: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalImagePlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalProfileHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  modalProfileInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalRating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalRatingText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 4,
  },
  modalLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalLocationText: {
    fontSize: 13,
    color: '#1e293b',
    marginLeft: 4,
  },
  modalVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    alignSelf: 'center',
  },
  modalVerifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  modalDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },
  modalStatLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});