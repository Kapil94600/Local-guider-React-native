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
import { useLikes } from '../context/LikesContext';
import LikeButton from "../components/LikeButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_URL = "https://localguider.sinfode.com";
const MAX_DISTANCE_KM = 100; // Maximum distance in kilometers to show results
const AUTO_REFRESH_INTERVAL = 300000; // 5 minutes in milliseconds

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper function to filter items by location
const filterByLocation = (items, userLat, userLng, getLatLng) => {
  if (!userLat || !userLng) return items;
  
  return items.filter(item => {
    const { lat, lng } = getLatLng(item);
    if (!lat || !lng) return false;
    const distance = calculateDistance(userLat, userLng, lat, lng);
    return distance <= MAX_DISTANCE_KM;
  });
};

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

// Get image URL from filename
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

// Image Component for Places
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

// Rating Stars Component
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

// Card Component for Top Guiders & Photographers
const TopGuiderPhotographerCard = ({ item, type, onPress, isLiked, onToggleLike }) => {
  const getProfileImage = () => {
    return item.featuredImage || item.profileImage || item.avatar;
  };

  const getName = () => {
    if (type === 'guider') {
      return item.firmName || item.name || 'Tour Guide';
    } else {
      return item.firmName || item.name || 'Photographer';
    }
  };

  const getLocation = () => {
    if (item.city) return item.city;
    if (item.state) return item.state;
    if (item.placeName) {
      const parts = item.placeName.split(',');
      return parts[0].trim();
    }
    return 'Local';
  };

  const getRating = () => {
    return item.rating || 0;
  };

  return (
    <View style={styles.topGuiderCard}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
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

      <LikeButton
        isLiked={isLiked(item.id, type)}
        onPress={() => onToggleLike(item, type)}
        size={18}
        style={styles.cardLikeButton}
      />
    </View>
  );
};

export default function UserDashboard({ navigation }) {
  const { user, refreshUser } = useContext(AuthContext);
  const { location, loading: locationLoading, refreshLocation } = useContext(LocationContext);

  const { isLiked, toggleLike } = useLikes();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [loading, setLoading] = useState({
    places: false,
    guiders: false,
    photographers: false,
    topPlaces: false,
    topGuiders: false,
    topPhotographers: false,
  });

  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoScrollTimer = useRef(null);
  const autoRefreshTimer = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [data, setData] = useState({
    places: [],
    guiders: [],
    photographers: [],
    topPlaces: [],
    topGuiders: [],
    topPhotographers: [],
  });

  // Filtered data based on location
  const [filteredData, setFilteredData] = useState({
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
    
    // Start auto-refresh when component mounts
    startAutoRefresh();
    
    // Cleanup timers on unmount
    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
      if (autoRefreshTimer.current) {
        clearInterval(autoRefreshTimer.current);
      }
    };
  }, []);

  // Start auto-refresh timer
  const startAutoRefresh = () => {
    // Clear existing timer if any
    if (autoRefreshTimer.current) {
      clearInterval(autoRefreshTimer.current);
    }
    
    // Set up new timer for auto-refresh
    autoRefreshTimer.current = setInterval(() => {
      console.log("Auto-refreshing data...", new Date().toLocaleTimeString());
      performAutoRefresh();
    }, AUTO_REFRESH_INTERVAL);
  };

  // Perform auto-refresh without showing refresh indicator
  const performAutoRefresh = async () => {
    try {
      console.log("Starting auto-refresh...");
      await fetchAllData();
      setLastRefreshTime(new Date());
      console.log("Auto-refresh completed successfully");
    } catch (error) {
      console.error("Auto-refresh failed:", error);
    }
  };

  // Filter data whenever location or raw data changes
  useEffect(() => {
    if (!location?.latitude || !location?.longitude) {
      // If no location, show all data (or none, depending on preference)
      setFilteredData(data);
      return;
    }

    const userLat = location.latitude;
    const userLng = location.longitude;

    // Filter places by location
    const filteredPlaces = filterByLocation(data.places, userLat, userLng, (place) => ({
      lat: place.latitude,
      lng: place.longitude
    }));

    // Filter guiders by location
    const filteredGuiders = filterByLocation(data.guiders, userLat, userLng, (guider) => ({
      lat: guider.latitude,
      lng: guider.longitude
    }));

    // Filter photographers by location
    const filteredPhotographers = filterByLocation(data.photographers, userLat, userLng, (photographer) => ({
      lat: photographer.latitude,
      lng: photographer.longitude
    }));

    // Filter top places
    const filteredTopPlaces = filterByLocation(data.topPlaces, userLat, userLng, (place) => ({
      lat: place.latitude,
      lng: place.longitude
    }));

    // Filter top guiders
    const filteredTopGuiders = filterByLocation(data.topGuiders, userLat, userLng, (guider) => ({
      lat: guider.latitude,
      lng: guider.longitude
    }));

    // Filter top photographers
    const filteredTopPhotographers = filterByLocation(data.topPhotographers, userLat, userLng, (photographer) => ({
      lat: photographer.latitude,
      lng: photographer.longitude
    }));

    setFilteredData({
      places: filteredPlaces,
      guiders: filteredGuiders,
      photographers: filteredPhotographers,
      topPlaces: filteredTopPlaces,
      topGuiders: filteredTopGuiders,
      topPhotographers: filteredTopPhotographers,
    });
  }, [data, location]);

  // Auto-scroll effect
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
        page,
        perPage: 50, // Fetch more to filter on frontend
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
        page,
        perPage: 50,
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
        page,
        perPage: 50,
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
        page: 1,
        perPage: 50,
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
        page: 1,
        perPage: 50,
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
        page: 1,
        perPage: 50,
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
    setLastRefreshTime(new Date());
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
    if (location?.city && location?.state) {
      return `${location.city}, ${location.state}`;
    }
    if (location?.city) return location.city;
    if (location?.state) return location.state;
    if (location?.error) return "Location unavailable";
    return "Select location";
  };

  const handleProfessionalPress = (item, type) => {
    navigation.navigate("ProfessionalDetails", {
      professionalId: item.id,
      professionalType: type,
    });
  };

  if (locationLoading && !location?.latitude) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5a73" />
        <Text style={styles.loadingText}>Detecting your location...</Text>
      </View>
    );
  }

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

  // Top Places Card
  const renderTopPlaceCard = (place) => {
    const getPlaceLocation = () => {
      if (place.city) return place.city;
      if (place.state) return place.state;
      return 'Unknown';
    };

    return (
      <View style={styles.topPlaceCard}>
        <TouchableOpacity
          onPress={() => navigation.navigate("PlaceDetails", { placeId: place.id })}
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

        <LikeButton
          isLiked={isLiked(place.id, 'place')}
          onPress={() => toggleLike(place, 'place')}
          size={18}
          style={styles.cardLikeButton}
        />
      </View>
    );
  };

  // Top Guider Card
  const renderTopGuiderCard = (guider) => (
    <TopGuiderPhotographerCard
      key={guider.id}
      item={guider}
      type="guider"
      onPress={() => handleProfessionalPress(guider, 'guider')}
      isLiked={isLiked}
      onToggleLike={toggleLike}
    />
  );

  // Top Photographer Card
  const renderTopPhotographerCard = (photographer) => (
    <TopGuiderPhotographerCard
      key={photographer.id}
      item={photographer}
      type="photographer"
      onPress={() => handleProfessionalPress(photographer, 'photographer')}
      isLiked={isLiked}
      onToggleLike={toggleLike}
    />
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
            <TouchableOpacity onPress={() => navigation.navigate("Liked")}>
              <Ionicons name="heart-outline" size={22} color="#fff" />
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
              <Text style={styles.sectionTitle}>Top Places</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("PlaceListScreen")}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filteredData.topPlaces.length > 0 ? (
              filteredData.topPlaces.map(place => (
                <React.Fragment key={place.id}>
                  {renderTopPlaceCard(place)}
                </React.Fragment>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="location-outline" size={30} color="#94a3b8" />
                <Text style={styles.emptyText}>No top places found nearby</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* TOP PHOTOGRAPHERS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Top Photographers</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("PhotographersListScreen")}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filteredData.topPhotographers.length > 0 ? (
              filteredData.topPhotographers.map(photographer => (
                <React.Fragment key={photographer.id}>
                  {renderTopPhotographerCard(photographer)}
                </React.Fragment>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="camera-outline" size={30} color="#94a3b8" />
                <Text style={styles.emptyText}>No top photographers found nearby</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* TOP GUIDERS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Top Guides</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("GuiderListScreen")}>
              <Text style={styles.seeAllText}>See All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filteredData.topGuiders.length > 0 ? (
              filteredData.topGuiders.map(guider => (
                <React.Fragment key={guider.id}>
                  {renderTopGuiderCard(guider)}
                </React.Fragment>
              ))
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={30} color="#94a3b8" />
                <Text style={styles.emptyText}>No top guides found nearby</Text>
              </View>
            )}
          </ScrollView>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
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
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  menuBtn: { padding: 6 },
  locationContainer: { alignItems: 'center' },
  greeting: { color: '#fff', fontSize: 16, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { color: '#fff', fontSize: 12, marginHorizontal: 4, maxWidth: 140, opacity: 0.9 },
  headerIcons: { flexDirection: 'row', gap: 16 },

  featuredCarouselWrapper: { height: 240, marginTop: 12, marginBottom: 8 },
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
  featuredCardImage: { width: '100%', height: '100%' },
  featuredCardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },
  featuredCardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  featuredCardTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  featuredCardLocation: { flexDirection: 'row', alignItems: 'center' },
  featuredCardLocationText: { color: '#fff', fontSize: 14, marginLeft: 6, opacity: 0.9 },
  paginationWrapper: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  paginationDot: { height: 6, borderRadius: 3, backgroundColor: '#2c5a73', marginHorizontal: 4 },

  categoryContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginVertical: 20 },
  categoryCard: { alignItems: 'center', width: (SCREEN_WIDTH - 48) / 4 },
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
  categoryIcon: { width: 40, height: 40, resizeMode: 'contain' },
  categoryTitle: { fontSize: 12, fontWeight: '600', color: '#2c5a73', textAlign: 'center' },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 21, fontWeight: '800', color: '#1e293b' },
  seeAllText: { fontSize: 14, color: '#2c5a73', fontWeight: '600' },

  ratingStarsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4, gap: 2 },
  ratingValue: { fontSize: 10, color: '#94a3b8', marginLeft: 4 },

  topPlaceCard: {
    width: 130,
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
    height: 163,
  },
  topPlaceImageContainer: { width: '100%', height: 100, backgroundColor: '#ffffff', padding: '5%', borderColor: '#ebecee', borderWidth: 1 },
  topPlaceImage: { width: '100%', height: '100%', borderRadius: 12 },
  topPlaceInfo: { padding: 3, alignItems: 'center' },
  topPlaceName: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 2, textAlign: 'center' },
  topPlaceLocation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 },
  topPlaceLocationText: { fontSize: 11, color: '#64748b', textAlign: 'center' },

  topGuiderCard: {
    width: 130,
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
  topGuiderImageContainer: { width: '100%', height: 100, backgroundColor: '#ffffff', padding: '5%', borderColor: '#ebecee', borderWidth: 1 },
  topGuiderImage: { width: '100%', height: '100%', borderRadius: 12 },
  topGuiderImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  topGuiderInitial: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  topGuiderInfo: { padding: 3, alignItems: 'center' },
  topGuiderName: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 2, textAlign: 'center' },
  topGuiderLocation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2 },
  topGuiderLocationText: { fontSize: 11, color: '#64748b', textAlign: 'center' },
  topGuiderVerified: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 2 },
  topGuiderVerifiedText: { fontSize: 10, color: '#10B981', fontWeight: '500', textAlign: 'center' },

  placeImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12 },
  emptyCard: { width: 140, height: 180, marginLeft: 16, backgroundColor: '#f1f5f9', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 12, marginTop: 8, textAlign: 'center', paddingHorizontal: 10 },

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