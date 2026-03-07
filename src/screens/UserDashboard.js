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
  Linking,
  Platform,
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

// Local images from assets folder
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
    location: "Ladakh",
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

// 🔥 Get image URL from filename
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

// 🔥 Image Component for Places
const PlaceImage = ({ imagePath, style }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imagePath) {
      setError(true);
      setLoading(false);
      return;
    }

    const url = getImageUrl(imagePath);
    setImageUrl(url);
    setLoading(false);
  }, [imagePath]);

  if (loading) {
    return (
      <View style={[style, styles.placeImagePlaceholder]}>
        <ActivityIndicator size="small" color="#2c5a73" />
      </View>
    );
  }

  if (error || !imageUrl) {
    return (
      <View style={[style, styles.placeImagePlaceholder]}>
        <Ionicons name="image-outline" size={30} color="#2c5a73" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={style}
      onError={() => setError(true)}
      resizeMode="cover"
    />
  );
};

// 🆕 Rating Stars Component - Centered
const RatingStars = ({ rating, size = 12 }) => {
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
  return (
    <View style={styles.ratingStarsContainer}>
      {stars}
      <Text style={[styles.ratingValue, { fontSize: size - 2 }]}>
        ({rating?.toFixed(1) || '0.0'})
      </Text>
    </View>
  );
};

// 🆕 New Card Component for Top Guiders & Photographers (with centered details)
const TopGuiderPhotographerCard = ({ item, type, onPress }) => {
  // Get profile image from multiple possible fields
  const getProfileImage = () => {
    return item.featuredImage || item.profileImage || item.avatar;
  };

  // Get name based on type
  const getName = () => {
    if (type === 'guider') {
      return item.firmName || item.name || 'Tour Guide';
    } else {
      return item.firmName || item.name || 'Photographer';
    }
  };

  // ✅ Get location - only city/district name
  const getLocation = () => {
    if (item.city) return item.city;
    if (item.state) return item.state;
    if (item.placeName) {
      const parts = item.placeName.split(',');
      return parts[0].trim();
    }
    return 'Local';
  };

  // Get rating
  const getRating = () => {
    return item.rating || 0;
  };

  return (
    <TouchableOpacity
      style={styles.topGuiderCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.topGuiderImageContainer}>
        {getProfileImage() ? (
          <Image
            source={{ uri: getImageUrl(getProfileImage()) }}
            style={styles.topGuiderImage}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={type === 'guider' ? ['#3B82F6', '#1E40AF'] : ['#8B5CF6', '#6D28D9']}
            style={styles.topGuiderImagePlaceholder}
          >
            <Text style={styles.topGuiderInitial}>
              {getName().charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}
      </View>

      <View style={styles.topGuiderInfo}>
        <Text style={styles.topGuiderName} numberOfLines={1}>
          {getName()}
        </Text>
        
        <View style={styles.topGuiderLocation}>
          <Ionicons name="location-outline" size={10} color="#94a3b8" />
          <Text style={styles.topGuiderLocationText} numberOfLines={1}>
            {getLocation()}
          </Text>
        </View>

        <RatingStars rating={getRating()} size={10} />

        {item.verified && (
          <View style={styles.topGuiderVerified}>
            <Ionicons name="checkmark-circle" size={10} color="#10B981" />
            <Text style={styles.topGuiderVerifiedText}>Verified</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

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

  // Auto-scroll effect for image carousel
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
    }, 4000);
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

  const renderRating = (rating, size = 14) => {
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
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  // Handle phone call
  const handleCall = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert("Error", "Phone number not available");
      return;
    }
    
    let phone = phoneNumber;
    if (Platform.OS === 'android') {
      phone = `tel:${phoneNumber}`;
    } else {
      phone = `telprompt:${phoneNumber}`;
    }
    
    Linking.canOpenURL(phone)
      .then(supported => {
        if (supported) {
          return Linking.openURL(phone);
        } else {
          Alert.alert("Error", "Phone call not supported");
        }
      })
      .catch(err => console.log('Call error:', err));
  };

  // Handle WhatsApp
  const handleWhatsApp = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert("Error", "WhatsApp number not available");
      return;
    }
    
    let phone = phoneNumber.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=${phone}`;
    
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert("Error", "WhatsApp is not installed");
        }
      })
      .catch(err => console.log('WhatsApp error:', err));
  };

  // Handle Email
  const handleEmail = (email) => {
    if (!email) {
      Alert.alert("Error", "Email not available");
      return;
    }
    
    const url = `mailto:${email}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert("Error", "Email app not supported");
        }
      })
      .catch(err => console.log('Email error:', err));
  };

  // Handle Booking
  const handleBooking = (item, type) => {
    if (type === 'guider') {
      navigation.navigate("GuiderDetails", { guiderId: item.id });
    } else if (type === 'photographer') {
      navigation.navigate("PhotographerDetails", { photographerId: item.id });
    } else {
      navigation.navigate("PlaceDetails", { placeId: item.id });
    }
  };

  // Featured Carousel
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
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.featuredCardOverlay}
            />
            <View style={styles.featuredCardContent}>
              <Text style={styles.featuredCardTitle}>{item.title}</Text>
              <View style={styles.featuredCardLocation}>
                <Ionicons name="location-outline" size={12} color="#fff" />
                <Text style={styles.featuredCardLocationText}>{item.location}</Text>
              </View>
            </View>
          </View>
        )}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
      />

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

  // ✅ UPDATED: Top Places Card with centered details and district/city location
  const renderTopPlaceCard = (place) => {
    const getPlaceLocation = () => {
      if (place.city) return place.city;
      if (place.state) return place.state;
      if (place.location) return place.location;
      return 'Unknown';
    };

    return (
      <TouchableOpacity
        key={place.id}
        style={styles.topPlaceCard}
        onPress={() => {
          if (place?.id) {
            navigation.navigate("PlaceDetails", { 
              placeId: place.id,
              placeName: place.placeName 
            });
          } else {
            console.log("Place ID not found", place);
            Alert.alert("Error", "Place details not available");
          }
        }}
        activeOpacity={0.9}
      >
        <View style={styles.topPlaceImageContainer}>
          <PlaceImage
            imagePath={place.featuredImage}
            style={styles.topPlaceImage}
          />
        </View>

        <View style={styles.topPlaceInfo}>
          <Text style={styles.topPlaceName} numberOfLines={1}>{place.placeName}</Text>
          <View style={styles.topPlaceLocation}>
            <Ionicons name="location-outline" size={10} color="#94a3b8" />
            <Text style={styles.topPlaceLocationText} numberOfLines={1}>
              {getPlaceLocation()}
            </Text>
          </View>
          
          <RatingStars rating={place.rating} size={10} />
        </View>
      </TouchableOpacity>
    );
  };

  // Top Guider Card
  const renderTopGuiderCard = (guider) => (
    <TopGuiderPhotographerCard
      key={guider.id}
      item={guider}
      type="guider"
      onPress={() => {
        setSelectedGuider(guider);
        setGuiderModal(true);
      }}
    />
  );

  // Top Photographer Card
  const renderTopPhotographerCard = (photographer) => (
    <TopGuiderPhotographerCard
      key={photographer.id}
      item={photographer}
      type="photographer"
      onPress={() => {
        setSelectedPhotographer(photographer);
        setPhotographerModal(true);
      }}
    />
  );

  // Place Details Modal
  const renderPlaceModal = () => (
    <Modal
      visible={placeModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setPlaceModal(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setPlaceModal(false)}
      >
        <View style={styles.modalContentLarge}>
          {selectedPlace && (
            <>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedPlace.placeName}</Text>
                  <TouchableOpacity onPress={() => setPlaceModal(false)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalImageContainer}>
                  <PlaceImage
                    imagePath={selectedPlace.featuredImage}
                    style={styles.modalImageLarge}
                  />
                </View>

                <View style={styles.modalRatingContainer}>
                  {renderRating(selectedPlace.rating, 16)}
                  <Text style={styles.modalRatingTextLarge}>({selectedPlace.rating?.toFixed(1) || '0.0'})</Text>
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons name="location-outline" size={18} color="#2c5a73" />
                  <Text style={styles.modalInfoText}>
                    {selectedPlace.city}{selectedPlace.state ? `, ${selectedPlace.state}` : ''}
                    {selectedPlace.country ? `, ${selectedPlace.country}` : ''}
                  </Text>
                </View>

                {selectedPlace.address && (
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="home-outline" size={18} color="#2c5a73" />
                    <Text style={styles.modalInfoText}>{selectedPlace.address}</Text>
                  </View>
                )}

                <View style={styles.modalDivider} />

                <Text style={styles.modalSectionTitle}>Description</Text>
                <Text style={styles.modalDescription}>
                  {selectedPlace.description || "No description available"}
                </Text>

                <View style={styles.modalDivider} />

                <Text style={styles.modalSectionTitle}>Place Details</Text>
                
                <View style={styles.modalStatsGrid}>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="time-outline" size={20} color="#2c5a73" />
                    <Text style={styles.modalStatLabel}>Opening Hours</Text>
                    <Text style={styles.modalStatValue}>{selectedPlace.openingHours || "Not specified"}</Text>
                  </View>

                  <View style={styles.modalStatItem}>
                    <Ionicons name="cash-outline" size={20} color="#2c5a73" />
                    <Text style={styles.modalStatLabel}>Entry Fee</Text>
                    <Text style={styles.modalStatValue}>{selectedPlace.entryFee || "Free"}</Text>
                  </View>

                  <View style={styles.modalStatItem}>
                    <Ionicons name="time-outline" size={20} color="#2c5a73" />
                    <Text style={styles.modalStatLabel}>Best Time</Text>
                    <Text style={styles.modalStatValue}>{selectedPlace.bestTime || "Anytime"}</Text>
                  </View>

                  <View style={styles.modalStatItem}>
                    <Ionicons name="eye-outline" size={20} color="#2c5a73" />
                    <Text style={styles.modalStatLabel}>Total Views</Text>
                    <Text style={styles.modalStatValue}>{selectedPlace.views || 0}</Text>
                  </View>
                </View>

                {selectedPlace.tags && selectedPlace.tags.length > 0 && (
                  <>
                    <View style={styles.modalDivider} />
                    <Text style={styles.modalSectionTitle}>Tags</Text>
                    <View style={styles.modalTagsContainer}>
                      {selectedPlace.tags.map((tag, index) => (
                        <View key={index} style={styles.modalTag}>
                          <Text style={styles.modalTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                <View style={styles.modalDivider} />
              </ScrollView>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
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
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Guider Details Modal
  const renderGuiderModal = () => (
    <Modal
      visible={guiderModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setGuiderModal(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setGuiderModal(false)}
      >
        <View style={styles.modalContentLarge}>
          {selectedGuider && (
            <>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedGuider.firmName || selectedGuider.name || "Tour Guide"}
                  </Text>
                  <TouchableOpacity onPress={() => setGuiderModal(false)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalProfileContainer}>
                  {selectedGuider.featuredImage ? (
                    <Image
                      source={{ uri: getImageUrl(selectedGuider.featuredImage) }}
                      style={styles.modalProfileImageLarge}
                    />
                  ) : (
                    <LinearGradient
                      colors={['#3B82F6', '#1E40AF']}
                      style={styles.modalProfileImageLarge}
                    >
                      <Text style={styles.modalProfileInitialLarge}>
                        {selectedGuider.firmName?.charAt(0) || selectedGuider.name?.charAt(0) || 'G'}
                      </Text>
                    </LinearGradient>
                  )}

                  <View style={styles.modalRatingContainer}>
                    {renderRating(selectedGuider.rating, 16)}
                    <Text style={styles.modalRatingTextLarge}>({selectedGuider.rating?.toFixed(1) || '0.0'})</Text>
                  </View>

                  {selectedGuider.verified && (
                    <View style={styles.modalVerifiedBadgeLarge}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.modalVerifiedText}>Verified Guide</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons name="location-outline" size={18} color="#2c5a73" />
                  <Text style={styles.modalInfoText}>
                    {selectedGuider.city || selectedGuider.state || selectedGuider.placeName || "Location not specified"}
                  </Text>
                </View>

                {selectedGuider.experience && (
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="school-outline" size={18} color="#2c5a73" />
                    <Text style={styles.modalInfoText}>Experience: {selectedGuider.experience} years</Text>
                  </View>
                )}

                <View style={styles.modalDivider} />

                {/* Contact Section */}
                <Text style={styles.modalSectionTitle}>Contact Information</Text>
                
                <View style={styles.modalContactContainer}>
                  {selectedGuider.phone && (
                    <TouchableOpacity 
                      style={styles.modalContactItem}
                      onPress={() => handleCall(selectedGuider.phone)}
                    >
                      <View style={[styles.modalContactIcon, { backgroundColor: '#E3F2FD' }]}>
                        <Ionicons name="call" size={20} color="#2196F3" />
                      </View>
                      <View style={styles.modalContactInfo}>
                        <Text style={styles.modalContactLabel}>Phone</Text>
                        <Text style={styles.modalContactValue}>{selectedGuider.phone}</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {selectedGuider.whatsapp && (
                    <TouchableOpacity 
                      style={styles.modalContactItem}
                      onPress={() => handleWhatsApp(selectedGuider.whatsapp)}
                    >
                      <View style={[styles.modalContactIcon, { backgroundColor: '#E8F5E9' }]}>
                        <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                      </View>
                      <View style={styles.modalContactInfo}>
                        <Text style={styles.modalContactLabel}>WhatsApp</Text>
                        <Text style={styles.modalContactValue}>{selectedGuider.whatsapp}</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {selectedGuider.email && (
                    <TouchableOpacity 
                      style={styles.modalContactItem}
                      onPress={() => handleEmail(selectedGuider.email)}
                    >
                      <View style={[styles.modalContactIcon, { backgroundColor: '#FFEBEE' }]}>
                        <Ionicons name="mail" size={20} color="#EA4335" />
                      </View>
                      <View style={styles.modalContactInfo}>
                        <Text style={styles.modalContactLabel}>Email</Text>
                        <Text style={styles.modalContactValue}>{selectedGuider.email}</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {selectedGuider.website && (
                    <TouchableOpacity 
                      style={styles.modalContactItem}
                      onPress={() => Linking.openURL(selectedGuider.website)}
                    >
                      <View style={[styles.modalContactIcon, { backgroundColor: '#F3E5F5' }]}>
                        <Ionicons name="globe" size={20} color="#9C27B0" />
                      </View>
                      <View style={styles.modalContactInfo}>
                        <Text style={styles.modalContactLabel}>Website</Text>
                        <Text style={styles.modalContactValue} numberOfLines={1}>{selectedGuider.website}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.modalDivider} />

                {/* Services Section */}
                <Text style={styles.modalSectionTitle}>Services Offered</Text>
                
                {selectedGuider.services && selectedGuider.services.length > 0 ? (
                  <View style={styles.modalServicesContainer}>
                    {selectedGuider.services.map((service, index) => (
                      <View key={index} style={styles.modalServiceItem}>
                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                        <Text style={styles.modalServiceText}>{service}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.modalEmptyText}>No services specified</Text>
                )}

                <View style={styles.modalDivider} />

                {/* Languages Section */}
                {selectedGuider.languages && selectedGuider.languages.length > 0 && (
                  <>
                    <Text style={styles.modalSectionTitle}>Languages</Text>
                    <View style={styles.modalTagsContainer}>
                      {selectedGuider.languages.map((lang, index) => (
                        <View key={index} style={styles.modalTag}>
                          <Text style={styles.modalTagText}>{lang}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.modalDivider} />
                  </>
                )}

                {/* Description */}
                <Text style={styles.modalSectionTitle}>About</Text>
                <Text style={styles.modalDescription}>
                  {selectedGuider.description || "No description available"}
                </Text>

                <View style={styles.modalDivider} />

                {/* Stats */}
                <View style={styles.modalStatsRow}>
                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatBoxValue}>{selectedGuider.totalBookings || 0}</Text>
                    <Text style={styles.modalStatBoxLabel}>Total Tours</Text>
                  </View>
                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatBoxValue}>{selectedGuider.reviewCount || 0}</Text>
                    <Text style={styles.modalStatBoxLabel}>Reviews</Text>
                  </View>
                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatBoxValue}>{selectedGuider.yearsOfExperience || 0}</Text>
                    <Text style={styles.modalStatBoxLabel}>Years Exp</Text>
                  </View>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
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
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Photographer Details Modal
  const renderPhotographerModal = () => (
    <Modal
      visible={photographerModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setPhotographerModal(false)}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setPhotographerModal(false)}
      >
        <View style={styles.modalContentLarge}>
          {selectedPhotographer && (
            <>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedPhotographer.firmName || selectedPhotographer.name || "Photographer"}
                  </Text>
                  <TouchableOpacity onPress={() => setPhotographerModal(false)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalProfileContainer}>
                  {selectedPhotographer.featuredImage ? (
                    <Image
                      source={{ uri: getImageUrl(selectedPhotographer.featuredImage) }}
                      style={styles.modalProfileImageLarge}
                    />
                  ) : (
                    <LinearGradient
                      colors={['#8B5CF6', '#6D28D9']}
                      style={styles.modalProfileImageLarge}
                    >
                      <Text style={styles.modalProfileInitialLarge}>
                        {selectedPhotographer.firmName?.charAt(0) || selectedPhotographer.name?.charAt(0) || 'P'}
                      </Text>
                    </LinearGradient>
                  )}

                  <View style={styles.modalRatingContainer}>
                    {renderRating(selectedPhotographer.rating, 16)}
                    <Text style={styles.modalRatingTextLarge}>({selectedPhotographer.rating?.toFixed(1) || '0.0'})</Text>
                  </View>

                  {selectedPhotographer.verified && (
                    <View style={styles.modalVerifiedBadgeLarge}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.modalVerifiedText}>Verified Photographer</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalInfoRow}>
                  <Ionicons name="location-outline" size={18} color="#2c5a73" />
                  <Text style={styles.modalInfoText}>
                    {selectedPhotographer.city || selectedPhotographer.state || selectedPhotographer.placeName || "Location not specified"}
                  </Text>
                </View>

                {selectedPhotographer.experience && (
                  <View style={styles.modalInfoRow}>
                    <Ionicons name="school-outline" size={18} color="#2c5a73" />
                    <Text style={styles.modalInfoText}>Experience: {selectedPhotographer.experience} years</Text>
                  </View>
                )}

                <View style={styles.modalDivider} />

                {/* Contact Section */}
                <Text style={styles.modalSectionTitle}>Contact Information</Text>
                
                <View style={styles.modalContactContainer}>
                  {selectedPhotographer.phone && (
                    <TouchableOpacity 
                      style={styles.modalContactItem}
                      onPress={() => handleCall(selectedPhotographer.phone)}
                    >
                      <View style={[styles.modalContactIcon, { backgroundColor: '#E3F2FD' }]}>
                        <Ionicons name="call" size={20} color="#2196F3" />
                      </View>
                      <View style={styles.modalContactInfo}>
                        <Text style={styles.modalContactLabel}>Phone</Text>
                        <Text style={styles.modalContactValue}>{selectedPhotographer.phone}</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {selectedPhotographer.whatsapp && (
                    <TouchableOpacity 
                      style={styles.modalContactItem}
                      onPress={() => handleWhatsApp(selectedPhotographer.whatsapp)}
                    >
                      <View style={[styles.modalContactIcon, { backgroundColor: '#E8F5E9' }]}>
                        <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                      </View>
                      <View style={styles.modalContactInfo}>
                        <Text style={styles.modalContactLabel}>WhatsApp</Text>
                        <Text style={styles.modalContactValue}>{selectedPhotographer.whatsapp}</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {selectedPhotographer.email && (
                    <TouchableOpacity 
                      style={styles.modalContactItem}
                      onPress={() => handleEmail(selectedPhotographer.email)}
                    >
                      <View style={[styles.modalContactIcon, { backgroundColor: '#FFEBEE' }]}>
                        <Ionicons name="mail" size={20} color="#EA4335" />
                      </View>
                      <View style={styles.modalContactInfo}>
                        <Text style={styles.modalContactLabel}>Email</Text>
                        <Text style={styles.modalContactValue}>{selectedPhotographer.email}</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {selectedPhotographer.instagram && (
                    <TouchableOpacity 
                      style={styles.modalContactItem}
                      onPress={() => Linking.openURL(`https://instagram.com/${selectedPhotographer.instagram}`)}
                    >
                      <View style={[styles.modalContactIcon, { backgroundColor: '#FCE4EC' }]}>
                        <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                      </View>
                      <View style={styles.modalContactInfo}>
                        <Text style={styles.modalContactLabel}>Instagram</Text>
                        <Text style={styles.modalContactValue}>@{selectedPhotographer.instagram}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.modalDivider} />

                {/* Services/Specializations Section */}
                <Text style={styles.modalSectionTitle}>Photography Services</Text>
                
                {selectedPhotographer.services && selectedPhotographer.services.length > 0 ? (
                  <View style={styles.modalServicesContainer}>
                    {selectedPhotographer.services.map((service, index) => (
                      <View key={index} style={styles.modalServiceItem}>
                        <Ionicons name="camera" size={18} color="#2c5a73" />
                        <Text style={styles.modalServiceText}>{service}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.modalEmptyText}>No services specified</Text>
                )}

                <View style={styles.modalDivider} />

                {/* Equipment Section */}
                {selectedPhotographer.equipment && selectedPhotographer.equipment.length > 0 && (
                  <>
                    <Text style={styles.modalSectionTitle}>Equipment</Text>
                    <View style={styles.modalTagsContainer}>
                      {selectedPhotographer.equipment.map((item, index) => (
                        <View key={index} style={styles.modalTag}>
                          <Text style={styles.modalTagText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.modalDivider} />
                  </>
                )}

                {/* Description */}
                <Text style={styles.modalSectionTitle}>About</Text>
                <Text style={styles.modalDescription}>
                  {selectedPhotographer.description || "No description available"}
                </Text>

                <View style={styles.modalDivider} />

                {/* Stats */}
                <View style={styles.modalStatsRow}>
                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatBoxValue}>{selectedPhotographer.totalBookings || 0}</Text>
                    <Text style={styles.modalStatBoxLabel}>Total Shoots</Text>
                  </View>
                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatBoxValue}>{selectedPhotographer.reviewCount || 0}</Text>
                    <Text style={styles.modalStatBoxLabel}>Reviews</Text>
                  </View>
                  <View style={styles.modalStatBox}>
                    <Text style={styles.modalStatBoxValue}>{selectedPhotographer.photosDelivered || 0}+</Text>
                    <Text style={styles.modalStatBoxLabel}>Photos</Text>
                  </View>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
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
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <UserMenuOverlay
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(screen) => {
          setMenuOpen(false);
          if (screen !== "Logout") navigation.navigate(screen);
        }}
      />

      <LinearGradient
        colors={['#1e3c4f', '#2c5a73', '#3b7a8f']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuBtn}>
            <Ionicons name="menu" size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.locationContainer}
            onPress={handleLocationPress}
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
        {renderFeaturedCarousel()}

        {/* Category Cards */}
        <View style={styles.categoryContainer}>
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate("GuiderListScreen")}
          >
            <View style={styles.categoryIconContainer}>
              <Image
                source={require('../../assets/images/ic_guider_home.webp')}
                style={styles.categoryIcon}
              />
            </View>
            <Text style={styles.categoryTitle}>Guiders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate("PhotographersListScreen")}
          >
            <View style={styles.categoryIconContainer}>
              <Image
                source={require('../../assets/images/ic_photographers_home.webp')}
                style={styles.categoryIcon}
              />
            </View>
            <Text style={styles.categoryTitle}>Photographers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate("PlaceListScreen")}
          >
            <View style={styles.categoryIconContainer}>
              <Image
                source={require('../../assets/images/ic_place.webp')}
                style={styles.categoryIcon}
              />
            </View>
            <Text style={styles.categoryTitle}>Places</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate("MoreScreen")}
          >
            <View style={styles.categoryIconContainer}>
              <Image
                source={require('../../assets/images/ic_more_home.webp')}
                style={styles.categoryIcon}
              />
            </View>
            <Text style={styles.categoryTitle}>More</Text>
          </TouchableOpacity>
        </View>

        {/* TOP PLACES SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="star" size={22} color="#FFD700" />
              <Text style={styles.sectionTitle}>Top Rated Places</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("TopPlacesScreen")}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {data.topPlaces.length > 0 ? (
              data.topPlaces.map(place => renderTopPlaceCard(place))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="location-outline" size={30} color="#94a3b8" />
                <Text style={styles.emptyText}>No top places found</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* TOP GUIDERS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="people" size={22} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Top Tour Guides</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("TopGuidersScreen")}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {data.topGuiders.length > 0 ? (
              data.topGuiders.map(guider => renderTopGuiderCard(guider))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={30} color="#94a3b8" />
                <Text style={styles.emptyText}>No top guides found</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* TOP PHOTOGRAPHERS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="camera" size={22} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Top Photographers</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("TopPhotographers")}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {data.topPhotographers.length > 0 ? (
              data.topPhotographers.map(photographer => renderTopPhotographerCard(photographer))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="camera-outline" size={30} color="#94a3b8" />
                <Text style={styles.emptyText}>No top photographers found</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

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

  // Featured Carousel Styles
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
  featuredCardTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  featuredCardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredCardLocationText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
    opacity: 0.9,
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

  // Category Cards
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 20,
  },
  categoryCard: {
    alignItems: 'center',
    width: (SCREEN_WIDTH - 48) / 4,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c5a73',
    textAlign: 'center',
  },

  // Section Styles
  section: {
    marginBottom: 24,
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
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2c5a73',
    fontWeight: '600',
  },

  // ✅ UPDATED: Rating Stars Container - Centered
  ratingStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 2,
  },
  ratingValue: {
    fontSize: 10,
    color: '#94a3b8',
    marginLeft: 4,
  },

  // ✅ UPDATED: Top Place Card Styles - Centered Details
  topPlaceCard: {
    width: 140,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginLeft: 16,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  topPlaceImageContainer: {
    width: '100%',
    height: 110,
    backgroundColor: '#ffffff',
    padding: '5%',
    borderColor: '#ebecee',
    borderWidth: 1,
  },
  topPlaceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  topPlaceInfo: {
    padding: 10,
    alignItems: 'center',
  },
  topPlaceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  topPlaceLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 4,
  },
  topPlaceLocationText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },

  // ✅ UPDATED: Top Guider/Photographer Card Styles - Centered Details
  topGuiderCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginLeft: 16,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  topGuiderImageContainer: {
    width: '100%',
    height: 110,
    backgroundColor: '#ffffff',
    padding: '5%',
    borderColor: '#ebecee',
    borderWidth: 1,
  },
  topGuiderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  topGuiderImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  topGuiderInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  topGuiderInfo: {
    padding: 10,
    alignItems: 'center',
  },
  topGuiderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  topGuiderLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 4,
  },
  topGuiderLocationText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  topGuiderVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  topGuiderVerifiedText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Placeholder Styles
  placeImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  emptyCard: {
    width: 140,
    height: 180,
    marginLeft: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  // Modal Styles (unchanged)
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContentLarge: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalImageContainer: {
    width: '100%',
    height: 180,
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalImageLarge: {
    width: '100%',
    height: '100%',
  },
  modalProfileContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalProfileImageLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalProfileInitialLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalRatingTextLarge: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 4,
  },
  modalVerifiedBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  modalVerifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalInfoText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
    flex: 1,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  modalStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modalStatItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  modalStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 2,
  },
  modalTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalTag: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modalTagText: {
    fontSize: 12,
    color: '#475569',
  },
  modalContactContainer: {
    marginBottom: 8,
  },
  modalContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalContactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalContactInfo: {
    flex: 1,
  },
  modalContactLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  modalContactValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  modalServicesContainer: {
    marginBottom: 8,
  },
  modalServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  modalServiceText: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 8,
    flex: 1,
  },
  modalEmptyText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  modalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
  },
  modalStatBox: {
    alignItems: 'center',
  },
  modalStatBoxValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c5a73',
  },
  modalStatBoxLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  modalButtonContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  modalButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonPrimary: {
    marginBottom: 8,
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