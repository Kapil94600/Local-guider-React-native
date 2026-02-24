import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../api/apiClient";
import { API } from "../api/endpoints";
import AdminMenuOverlay from "../components/AdminMenuOverlay";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;
const BASE_URL = "https://localguider.sinfode.com";

// 🔥 Get image URL from filename
const getImageUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  
  let imageName = filename;
  if (filename.includes('/')) {
    imageName = filename.split('/').pop();
  }
  if (filename.includes('\\')) {
    imageName = filename.split('\\').pop();
  }
  
  return `${BASE_URL}/api/image/download/${imageName}`;
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
        <Icon name="image-off" size={30} color="#2c5a73" />
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

// Stat Card Component with Gradient
const StatCard = ({ title, value, icon, onPress, subText, loading, isCurrency = false }) => {
  let displayValue = value;
  
  if (isCurrency && typeof value === 'number') {
    displayValue = `₹${value.toLocaleString()}`;
  } else if (typeof value === 'number') {
    displayValue = value.toLocaleString();
  }
  
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={loading}
      style={styles.cardWrapper}
    >
      <LinearGradient
        colors={['#2c5a73', '#1e3c4f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statCard}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Icon name={icon} size={28} color="#fff" />
          </View>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.cardValue}>
              {displayValue}
            </Text>
          )}
        </View>
        
        <Text style={styles.cardTitle}>{title}</Text>
        
        {subText && (
          <Text style={styles.cardSubText}>{subText}</Text>
        )}
        
        <View style={styles.cardFooter}>
          <Text style={styles.viewText}>View Details</Text>
          <Icon name="chevron-right" size={16} color="#fff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
};

export default function AdminDashboard({ navigation }) {
  const [counts, setCounts] = useState({
    users: 0,
    photographers: 0,
    guiders: 0,
    places: 0,
    transactions: 0,
    photographerRequests: 0,
    guiderRequests: 0,
    pendingWithdrawals: 0,
  });

  const [overlayVisible, setOverlayVisible] = useState(false);
  const [places, setPlaces] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const greeting = getGreeting();

  // Load Admin Dashboard Data
  const loadDashboardData = async () => {
    try {
      let response;
      try {
        response = await api.get(API.ADMIN_DASHBOARD);
      } catch (getError) {
        response = await api.post(API.ADMIN_DASHBOARD);
      }
      
      const responseData = response.data || {};
      const data = responseData.data || {};
      
      return {
        users: data.totalUsers || 0,
        photographers: data.totalPhotographers || 0,
        guiders: data.totalGuiders || 0,
        places: data.totalPlaces || 0,
        transactions: data.totalTransactions || 0,
        pendingWithdrawals: data.pendingWithdrawals || 0,
      };
    } catch (error) {
      console.error("❌ Dashboard data error:", error);
      return null;
    }
  };

  // Load Photographer Requests Count
  const loadPhotographerRequests = async () => {
    try {
      const response = await api.post(API.GET_PHOTOGRAPHERS_ALL, { admin: true });
      const responseData = response.data || {};
      const photographersData = responseData.data || [];
      
      return photographersData.filter(p => 
        p.approvalStatus === "PENDING" || 
        p.approvalStatus === "pending" ||
        !p.approvalStatus
      ).length;
    } catch (error) {
      return 0;
    }
  };

  // Load Guider Requests Count
  const loadGuiderRequests = async () => {
    try {
      const response = await api.post(API.GET_GUIDERS_ALL, { admin: true });
      const responseData = response.data || {};
      const guidersData = responseData.data || [];
      
      return guidersData.filter(g => 
        g.approvalStatus === "PENDING" || 
        g.approvalStatus === "pending" ||
        !g.approvalStatus
      ).length;
    } catch (error) {
      return 0;
    }
  };

  // Load Places Data
  const loadPlaces = async () => {
    try {
      const response = await api.post(API.GET_PLACES, { page: 1, perPage: 6 });
      const responseData = response.data || {};
      return responseData.data || [];
    } catch (error) {
      return [];
    }
  };

  // Load All Data
  const loadAllData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    
    try {
      const results = await Promise.allSettled([
        loadDashboardData(),
        loadPhotographerRequests(),
        loadGuiderRequests(),
        loadPlaces(),
      ]);
      
      const dashboardData = results[0].status === 'fulfilled' ? results[0].value : null;
      const photographerRequests = results[1].status === 'fulfilled' ? results[1].value : 0;
      const guiderRequests = results[2].status === 'fulfilled' ? results[2].value : 0;
      const placesData = results[3].status === 'fulfilled' ? results[3].value : [];
      
      setCounts(prev => ({
        ...prev,
        users: dashboardData?.users || 0,
        photographers: dashboardData?.photographers || 0,
        guiders: dashboardData?.guiders || 0,
        places: dashboardData?.places || 0,
        transactions: dashboardData?.transactions || 0,
        pendingWithdrawals: dashboardData?.pendingWithdrawals || 0,
        photographerRequests,
        guiderRequests,
      }));
      
      setPlaces(placesData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("❌ Load all data error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setInitialLoadComplete(true);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData(true);
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => loadAllData(true), 120000);
    return () => clearInterval(interval);
  }, []);

  // Main cards for overview
  const mainCards = [
    { label: "Total Users", value: counts.users, icon: "account-group", route: "UserList", subText: "Registered users" },
    { label: "Photographers", value: counts.photographers, icon: "camera", route: "PhotographerList", subText: "Active photographers" },
    { label: "Guiders", value: counts.guiders, icon: "map-marker-account", route: "GuiderList", subText: "Active guides" },
    { label: "Places", value: counts.places, icon: "map-marker-multiple", route: "PlaceList", subText: "Tourist places" },
  ];

  // Request cards
  const requestCards = [
    { label: "Photographer Requests", value: counts.photographerRequests, icon: "camera-account", route: "PhotographerRequests", subText: "Pending approval" },
    { label: "Guider Requests", value: counts.guiderRequests, icon: "account-clock", route: "GuiderRequests", subText: "Pending approval" },
    { label: "Withdrawals", value: counts.pendingWithdrawals, icon: "cash-clock", route: "WithdrawalList", subText: "Pending withdrawals" },
  ];

  // Financial cards
  const financialCards = [
    { label: "Transactions", value: counts.transactions, icon: "credit-card", route: "TransactionList", subText: "All transactions", isCurrency: false },
  ];

  // Quick action cards
  const quickActionCards = [
    { label: "Notifications", icon: "bell-outline", route: "NotificationList", subText: "View alerts" },
    { label: "Settings", icon: "cog-outline", route: "AdminSettings", subText: "Configuration" },
    { label: "Withdrawals", icon: "cash-multiple", route: "WithdrawalList", subText: "Manage payouts" },
    { label: "Appointments", icon: "calendar", route: "AppointmentList", subText: "View bookings" },
  ];

  const renderSection = (title, data) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.cardsRow}>
        {data.map((item, index) => (
          <StatCard
            key={index.toString()}
            title={item.label}
            value={item.value}
            icon={item.icon}
            subText={item.subText}
            loading={loading && !initialLoadComplete}
            isCurrency={item.isCurrency}
            onPress={() => item.route && navigation.navigate(item.route)}
          />
        ))}
      </View>
    </View>
  );

  // Original Place Card Component
  const renderPlaceCard = ({ item, index }) => {
    if (!item) return null;
    
    const placeName = item.placeName || `Place ${index + 1}`;
    const city = item.city || "";
    const state = item.state || "";
    const featuredImage = item.featuredImage;
    
    return (
      <TouchableOpacity 
        style={styles.placeCard}
        onPress={() => {
          if (navigation) {
            navigation.navigate("PlaceDetails", { 
              placeId: item.id || index 
            });
          }
        }}
      >
        <PlaceImage
          imagePath={featuredImage}
          style={styles.placeImage}
        />
        <View style={styles.placeInfo}>
          <Text style={styles.placeName} numberOfLines={1}>
            {placeName}
          </Text>
          {(city || state) && (
            <View style={styles.placeLocation}>
              <Icon name="map-marker" size={12} color="#2c5a73" />
              <Text style={styles.placeCity} numberOfLines={1}>
                {city ? `${city}${state ? `, ${state}` : ''}` : state || ""}
              </Text>
            </View>
          )}
          {item.views !== undefined && (
            <View style={styles.placeViews}>
              <Icon name="eye" size={12} color="#2c5a73" />
              <Text style={styles.viewsText}>{item.views} views</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuickAction = (item, index) => (
    <TouchableOpacity
      key={index.toString()}
      style={styles.quickAction}
      onPress={() => {
        if (item.route && navigation) {
          navigation.navigate(item.route);
        }
      }}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: '#2c5a73' }]}>
        <Icon name={item.icon} size={24} color="#fff" />
      </View>
      <Text style={styles.quickActionLabel}>{item.label}</Text>
      <Text style={styles.quickActionSub}>{item.subText}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2c5a73" barStyle="light-content" />

      {/* Header with Gradient */}
      <LinearGradient colors={['#2c5a73', '#1e3c4f']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.menuButton} onPress={() => setOverlayVisible(true)}>
              <Icon name="menu" size={28} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.subtitle}>Admin Dashboard</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={refreshing}>
            {refreshing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="refresh" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Last Update Time */}
        <View style={styles.updateTimeContainer}>
          <Icon name="clock-outline" size={14} color="rgba(255,255,255,0.8)" />
          <Text style={styles.updateTimeText}>
            Updated: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </LinearGradient>

      {/* Stats Preview Cards - Below Header */}
      <View style={styles.statsPreviewContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsPreviewScroll}
        >
          <View style={styles.statPreviewItem}>
            <Icon name="account-group" size={24} color="#2c5a73" />
            <Text style={styles.statPreviewValue}>{counts.users}</Text>
            <Text style={styles.statPreviewLabel}>Users</Text>
          </View>
          <View style={styles.statPreviewItem}>
            <Icon name="camera" size={24} color="#2c5a73" />
            <Text style={styles.statPreviewValue}>{counts.photographers}</Text>
            <Text style={styles.statPreviewLabel}>Photographers</Text>
          </View>
          <View style={styles.statPreviewItem}>
            <Icon name="map-marker-account" size={24} color="#2c5a73" />
            <Text style={styles.statPreviewValue}>{counts.guiders}</Text>
            <Text style={styles.statPreviewLabel}>Guides</Text>
          </View>
          <View style={styles.statPreviewItem}>
            <Icon name="map-marker-multiple" size={24} color="#2c5a73" />
            <Text style={styles.statPreviewValue}>{counts.places}</Text>
            <Text style={styles.statPreviewLabel}>Places</Text>
          </View>
          <View style={styles.statPreviewItem}>
            <Icon name="credit-card" size={24} color="#2c5a73" />
            <Text style={styles.statPreviewValue}>{counts.transactions}</Text>
            <Text style={styles.statPreviewLabel}>Transactions</Text>
          </View>
          <View style={styles.statPreviewItem}>
            <Icon name="cash-clock" size={24} color="#2c5a73" />
            <Text style={styles.statPreviewValue}>{counts.pendingWithdrawals}</Text>
            <Text style={styles.statPreviewLabel}>Withdrawals</Text>
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2c5a73"]} />}
      >
        {loading && !initialLoadComplete ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2c5a73" />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : (
          <View style={styles.dataContainer}>
            {renderSection("Platform Overview", mainCards)}
            
            <View style={styles.divider} />
            
            {renderSection("Pending Requests", requestCards)}
            
            <View style={styles.divider} />
            
            {renderSection("Financial Overview", financialCards)}
            
            {/* Popular Places - Original Card Style */}
            {places.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Popular Places</Text>
                  <TouchableOpacity onPress={() => navigation.navigate("PlaceList")}>
                    <Text style={styles.viewAll}>View All →</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={places}
                  keyExtractor={(item, index) => (item.id || index).toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={renderPlaceCard}
                  contentContainerStyle={styles.placesList}
                />
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActions}>
                {quickActionCards.map(renderQuickAction)}
              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Admin Dashboard v1.0</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Menu Overlay */}
      {overlayVisible && (
        <AdminMenuOverlay
          onClose={() => setOverlayVisible(false)}
          onNavigate={(route) => {
            setOverlayVisible(false);
            navigation.navigate(route);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 10,
    shadowColor: '#2c5a73',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  updateTimeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 6,
  },
  statsPreviewContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
  
    marginTop: -10,
    marginHorizontal: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 10,
    marginTop:20
  },
  statsPreviewScroll: {
    paddingHorizontal: 0,
  },
  statPreviewItem: {
    alignItems: 'center',
    marginHorizontal: 12,
    minWidth: 70,
  },
  statPreviewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5a73',
    marginTop: 4,
  },
  statPreviewLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  dataContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    minHeight: 400,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#2c5a73',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5a73',
    marginBottom: 10,
  },
  viewAll: {
    fontSize: 14,
    color: '#2c5a73',
    fontWeight: '600',
  },
  divider: {
    height: 8,
    backgroundColor: '#f0f0f0',
    marginTop: 20,
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  statCard: {
    borderRadius: 20,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 10,
  },
  viewText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
    marginRight: 4,
  },
  placesList: {
    paddingBottom: 10,
    paddingRight: 16,
  },
  placeCard: {
    width: 160,
    borderRadius: 16,
    marginRight: 15,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  placeImage: {
    width: "100%",
    height: 120,
  },
  placeImagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  placeInfo: {
    padding: 12,
  },
  placeName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  placeLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  placeCity: {
    fontSize: 11,
    color: "#2c5a73",
    marginLeft: 4,
  },
  placeViews: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewsText: {
    fontSize: 11,
    color: "#2c5a73",
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: CARD_WIDTH,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSub: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});