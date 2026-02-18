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
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import api from "../api/apiClient";
import { API } from "../api/endpoints";
import AdminMenuOverlay from "../components/AdminMenuOverlay";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

// Stat Card Component
const StatCard = ({ title, value, icon, color, onPress, subText, loading, isCurrency = false }) => {
  let displayValue = value;
  
  if (isCurrency && typeof value === 'number') {
    displayValue = `₹${value.toLocaleString()}`;
  } else if (typeof value === 'number') {
    displayValue = value.toLocaleString();
  }
  
  return (
    <TouchableOpacity
      style={[styles.statCard, { backgroundColor: color }]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={loading}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}40` }]}>
          <Icon name={icon} size={28} color="#fff" />
        </View>
      </View>
      
      {loading ? (
        <ActivityIndicator size="small" color="#272b2e" style={styles.loadingIndicator} />
      ) : (
        <Text style={styles.cardValue}>
          {displayValue}
        </Text>
      )}
      
      <Text style={styles.cardTitle}>{title}</Text>
      
      {subText && <Text style={styles.cardSubText}>{subText}</Text>}
      
      <View style={styles.cardFooter}>
        <Text style={styles.viewText}>View Details</Text>
        <Icon name="chevron-right" size={16} color="#fff" />
      </View>
    </TouchableOpacity>
  );
};

// Placeholder Image Component
const PlaceholderImage = () => (
  <View style={styles.placeImagePlaceholder}>
    <Icon name="image" size={30} color="#90bbd4e3" />
    <Text style={styles.placeholderText}>No Image</Text>
  </View>
);

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
      console.log("📡 Fetching dashboard data...");
      let response;
      try {
        response = await api.get(API.ADMIN_DASHBOARD);
      } catch (getError) {
        console.log("GET failed, trying POST...");
        response = await api.post(API.ADMIN_DASHBOARD);
      }
      
      const responseData = response.data || {};
      console.log("📊 Dashboard Full Response:", JSON.stringify(responseData, null, 2));
      
      // ✅ FIXED: Extract data from response.data.data
      const data = responseData.data || {};
      console.log("📊 Dashboard Data:", data);
      
      return {
        users: data.totalUsers || 0,
        photographers: data.totalPhotographers || 0,
        guiders: data.totalGuiders || 0,
        places: data.totalPlaces || 0,
        transactions: data.totalTransactions || 0,
        pendingWithdrawals: data.pendingWithdrawals || 0,
      };
    } catch (error) {
      console.error("❌ Dashboard data error:", error.response?.data || error.message);
      return null;
    }
  };

  // Load Photographer Requests Count
  const loadPhotographerRequests = async () => {
    try {
      console.log("📡 Fetching photographer requests...");
      const response = await api.post(API.GET_PHOTOGRAPHERS_ALL, {
        admin: true,
      });
      
      const responseData = response.data || {};
      console.log("📸 Photographers Full Response:", JSON.stringify(responseData, null, 2));
      
      // ✅ FIXED: Extract data from response.data.data
      const photographersData = responseData.data || [];
      console.log("📸 Photographers Array:", photographersData.length);
      
      // Count pending requests - use approvalStatus
      const pendingRequests = photographersData.filter(photographer => 
        photographer.approvalStatus === "PENDING" || 
        photographer.approvalStatus === "pending" ||
        !photographer.approvalStatus ||
        photographer.approvalStatus === "IN_REVIEW"
      ).length;
      
      console.log("📸 Pending Photographer Requests:", pendingRequests);
      
      return pendingRequests;
    } catch (error) {
      console.error("❌ Photographer requests error:", error);
      return 0;
    }
  };

  // Load Guider Requests Count
  const loadGuiderRequests = async () => {
    try {
      console.log("📡 Fetching guider requests...");
      const response = await api.post(API.GET_GUIDERS_ALL, {
        admin: true,
      });
      
      const responseData = response.data || {};
      console.log("🧭 Guiders Full Response:", JSON.stringify(responseData, null, 2));
      
      // ✅ FIXED: Extract data from response.data.data
      const guidersData = responseData.data || [];
      console.log("🧭 Guiders Array:", guidersData.length);
      
      // Count pending requests - use approvalStatus
      const pendingRequests = guidersData.filter(guider => 
        guider.approvalStatus === "PENDING" || 
        guider.approvalStatus === "pending" ||
        !guider.approvalStatus ||
        guider.approvalStatus === "IN_REVIEW"
      ).length;
      
      console.log("🧭 Pending Guider Requests:", pendingRequests);
      
      return pendingRequests;
    } catch (error) {
      console.error("❌ Guider requests error:", error);
      return 0;
    }
  };

  // Load Places Data
  const loadPlaces = async () => {
    try {
      console.log("📡 Fetching places...");
      const response = await api.post(API.GET_PLACES, { 
        page: 1, 
        perPage: 6,
      });
      
      const responseData = response.data || {};
      console.log("📍 Places Full Response:", JSON.stringify(responseData, null, 2));
      
      // ✅ FIXED: Extract data from response.data
      const placesData = responseData.data || responseData || [];
      console.log("📍 Places Array:", placesData.length);
      
      return Array.isArray(placesData) ? placesData : [];
    } catch (error) {
      console.error("❌ Places error:", error);
      return [];
    }
  };

  // Load All Data - FIXED VERSION
  const loadAllData = async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    
    console.log("🔄 Loading all dashboard data...");
    
    try {
      // Use Promise.allSettled instead of Promise.all
      const results = await Promise.allSettled([
        loadDashboardData(),
        loadPhotographerRequests(),
        loadGuiderRequests(),
        loadPlaces(),
      ]);
      
      console.log("✅ All API calls completed");
      
      // Process results
      const dashboardData = results[0].status === 'fulfilled' ? results[0].value : null;
      const photographerRequests = results[1].status === 'fulfilled' ? results[1].value : 0;
      const guiderRequests = results[2].status === 'fulfilled' ? results[2].value : 0;
      const placesData = results[3].status === 'fulfilled' ? results[3].value : [];
      
      // Update counts
      setCounts(prev => ({
        ...prev,
        users: dashboardData?.users || 0,
        photographers: dashboardData?.photographers || 0,
        guiders: dashboardData?.guiders || 0,
        places: dashboardData?.places || 0,
        transactions: dashboardData?.transactions || 0,
        pendingWithdrawals: dashboardData?.pendingWithdrawals || 0,
        photographerRequests: photographerRequests,
        guiderRequests: guiderRequests,
      }));
      
      // Update places
      setPlaces(placesData);
      
      // Update last update time
      setLastUpdate(new Date());
      
      console.log("✅ Dashboard data loaded successfully!");
      console.log("📊 Final counts:", {
        users: dashboardData?.users || 0,
        photographers: dashboardData?.photographers || 0,
        guiders: dashboardData?.guiders || 0,
        places: dashboardData?.places || 0,
        photographerRequests,
        guiderRequests,
      });
      
    } catch (error) {
      console.error("❌ Load all data error:", error);
      // Even if there's an error, stop loading
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
    // Initial load
    loadAllData();
    
    // Set up refresh interval (every 2 minutes)
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing dashboard...");
      loadAllData(true);
    }, 120000);

    return () => clearInterval(interval);
  }, []);

  // Main cards for overview
  const mainCards = [
    { 
      label: "Total Users", 
      value: counts.users, 
      icon: "account-group", 
      route: "UserList", 
      color: "#90bbd4e3",
      subText: "Registered users",
      loading: loading && !initialLoadComplete,
    },
    { 
      label: "Photographers", 
      value: counts.photographers, 
      icon: "camera", 
      route: "PhotographerList", 
      color: "#90bbd4e3",
      subText: "Active photographers",
      loading: loading && !initialLoadComplete,
    },
    { 
      label: "Guiders", 
      value: counts.guiders, 
      icon: "map-marker-account", 
      route: "GuiderList", 
      color: "#90bbd4e3",
      subText: "Active tourist guiders",
      loading: loading && !initialLoadComplete,
    },
    { 
      label: "Places", 
      value: counts.places, 
      icon: "map-marker-multiple", 
      route: "PlaceList", 
      color: "#90bbd4e3",
      subText: "Tourist places",
      loading: loading && !initialLoadComplete,
    },
  ];

  // Request cards
  const requestCards = [
    { 
      label: "Photographer Requests", 
      value: counts.photographerRequests, 
      icon: "camera-account", 
      route: "PhotographerRequests", 
      color: "#90bbd4e3",
      subText: "Pending approval",
      loading: loading && !initialLoadComplete,
    },
    { 
      label: "Guider Requests", 
      value: counts.guiderRequests, 
      icon: "account-clock", 
      route: "GuiderRequests", 
      color: "#90bbd4e3",
      subText: "Pending approval",
      loading: loading && !initialLoadComplete,
    },
    { 
      label: "Withdrawal Requests", 
      value: counts.pendingWithdrawals, 
      icon: "cash-clock", 
      route: "WithdrawalList", 
      color: "#90bbd4e3",
      subText: "Pending withdrawals",
      loading: loading && !initialLoadComplete,
    },
  ];

  // Financial cards
  const financialCards = [
    { 
      label: "Transactions", 
      value: counts.transactions, 
      icon: "credit-card", 
      route: "TransactionList", 
      color: "#90bbd4e3",
      subText: "All time transactions",
      loading: loading && !initialLoadComplete,
    },
  ];

  // Quick action cards
  const quickActionCards = [
    { 
      label: "Notifications", 
      icon: "bell-outline", 
      route: "NotificationList", 
      color: "#90bbd4e3",
      subText: "View all alerts",
    },
    { 
      label: "Settings", 
      icon: "cog-outline", 
      route: "AdminSettings", 
      color: "#90bbd4e3",
      subText: "System configuration",
    },
    { 
      label: "Withdrawals", 
      icon: "cash-multiple", 
      route: "WithdrawalList", 
      color: "#90bbd4e3",
      subText: "Manage payouts",
    },
    { 
      label: "Appointments", 
      icon: "calendar", 
      route: "AppointmentList", 
      color: "#90bbd4e3",
      subText: "View bookings",
    },
  ];

  const renderSection = (title, data, columns = 2) => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={[styles.cardsRow, { justifyContent: 'space-between' }]}>
          {data.map((item, index) => (
            <StatCard
              key={index.toString()}
              title={item.label}
              value={item.value}
              icon={item.icon}
              color={item.color}
              subText={item.subText}
              loading={item.loading}
              isCurrency={item.isCurrency}
              onPress={() => {
                if (item.route && navigation) {
                  console.log(`Navigating to: ${item.route}`);
                  navigation.navigate(item.route);
                }
              }}
            />
          ))}
        </View>
      </View>
    );
  };

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
        {featuredImage ? (
          <Image 
            source={{ uri: featuredImage }} 
            style={styles.placeImage}
          />
        ) : (
          <PlaceholderImage />
        )}
        <View style={styles.placeInfo}>
          <Text style={styles.placeName} numberOfLines={1}>
            {placeName}
          </Text>
          {(city || state) && (
            <View style={styles.placeLocation}>
              <Icon name="map-marker" size={12} color="#666" />
              <Text style={styles.placeCity} numberOfLines={1}>
                {city ? `${city}${state ? `, ${state}` : ''}` : state || ""}
              </Text>
            </View>
          )}
          {item.views !== undefined && (
            <View style={styles.placeViews}>
              <Icon name="eye" size={12} color="#666" />
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
      <View style={[styles.quickActionIcon, { backgroundColor: item.color }]}>
        <Icon name={item.icon} size={24} color="#fff" />
      </View>
      <Text style={styles.quickActionLabel}>{item.label}</Text>
      <Text style={styles.quickActionSub}>{item.subText}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#42738fe3" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setOverlayVisible(true)}
            >
              <Icon name="menu" size={28} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              {/* <Text style={styles.subtitle}>Dashboard Overview</Text> */}
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={refreshing || loading}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="refresh" size={22} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Last Update Time */}
        <View style={styles.updateTimeContainer}>
          <Icon name="clock-outline" size={14} color="rgba(255,255,255,0.8)" />
          <Text style={styles.updateTimeText}>
            Updated: {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#42738f"]}
            tintColor="#42738f"
          />
        }
      >
        {/* Loading State */}
        {loading && !initialLoadComplete ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#42738f" />
            <Text style={styles.loadingText}>Loading dashboard data...</Text>
          </View>
        ) : (
          <>
            {/* Data Loaded State */}
            <View style={styles.dataContainer}>
              {/* Debug Info - Only show in development */}
              {__DEV__ && (
                <View style={styles.debugInfo}>
                  <Text style={styles.debugText}>
                    Data Loaded Successfully | Last Update: {lastUpdate.toLocaleTimeString()}
                  </Text>
                </View>
              )}

              {renderSection("Platform Overview", mainCards)}
              {renderSection("Pending Requests", requestCards, 3)}
              {renderSection("Financial Overview", financialCards)}
              
              {/* Popular Places */}
              {places.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Popular Places ({places.length})</Text>
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

              {/* Last Update Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Dashboard updated at {lastUpdate.toLocaleTimeString()}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ADMIN MENU OVERLAY */}
      {overlayVisible && (
        <AdminMenuOverlay
          onClose={() => setOverlayVisible(false)}
          onNavigate={(route) => {
            setOverlayVisible(false);
            if (navigation) {
              navigation.navigate(route);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },
  header: {
    backgroundColor: "#42738fe3",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  menuButton: {
    padding: 5,
    marginRight: 15,
    marginTop: 5,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  refreshButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 10,
    borderRadius: 12,
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  updateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  updateTimeText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    marginLeft: 6,
  },
  content: {
    flex: 1,
  },
  dataContainer: {
    minHeight: 600, // Ensure content area has minimum height
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    minHeight: 400,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
  section: {
    marginTop: 25,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#272b2e",
    marginBottom: 15,
  },
  viewAll: {
    fontSize: 14,
    color: "#42738f",
    fontWeight: "600",
  },
  cardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: CARD_WIDTH,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingIndicator: {
    marginVertical: 10,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#272b2e",
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#272b2e",
    marginBottom: 4,
  },
  cardSubText: {
    fontSize: 11,
    color: "#272b2e",
    opacity: 0.8,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    paddingTop: 8,
  },
  viewText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
    marginRight: 4,
  },
  placesList: {
    paddingBottom: 10,
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
    resizeMode: "cover",
  },
  placeImagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 5,
    fontSize: 12,
    color: "#90bbd4e3",
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
    color: "#666",
    marginLeft: 4,
  },
  placeViews: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewsText: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickAction: {
    width: CARD_WIDTH,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  quickActionSub: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  debugInfo: {
    backgroundColor: "#f0f9ff",
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  debugText: {
    fontSize: 12,
    color: "#0369a1",
    textAlign: "center",
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});