// PhotographerList.js - UPDATED with beautiful UI
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  StatusBar,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/apiClient";

const { width } = Dimensions.get("window");
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

// 🔥 Image Component
const PhotographerImage = ({ imagePath, style }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imagePath) {
      setError(true);
      return;
    }
    setImageUrl(getImageUrl(imagePath));
  }, [imagePath]);

  if (error || !imageUrl) {
    return (
      <View style={[style, styles.avatarPlaceholder]}>
        <Icon name="camera" size={30} color="#2c5a73" />
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

export default function PhotographerList({ navigation }) {
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all"); // all, pending, approved, declined

  const loadPhotographers = async () => {
    try {
      const response = await api.post("/photographers/get_all", {
        admin: true,
      });
      
      const responseData = response.data || {};
      const photographersData = responseData.data || [];
      
      console.log("Photographers loaded:", photographersData.length);
      setPhotographers(photographersData);
    } catch (error) {
      console.error("Error loading photographers:", error);
      Alert.alert("Error", "Failed to load photographers");
      setPhotographers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPhotographers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPhotographers();
  };

  const getFilteredPhotographers = () => {
    if (filter === "all") return photographers;
    return photographers.filter(p => 
      p.approvalStatus?.toLowerCase() === filter.toLowerCase()
    );
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || "pending";
    switch (statusLower) {
      case "approved":
        return "#10B981";
      case "declined":
        return "#EF4444";
      default:
        return "#F59E0B";
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || "pending";
    switch (statusLower) {
      case "approved":
        return "check-circle";
      case "declined":
        return "close-circle";
      default:
        return "clock-outline";
    }
  };

  const renderFilterButton = (filterType, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderPhotographerItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.95}
      onPress={() => {
        // Navigate to photographer details if needed
        // navigation.navigate("PhotographerDetails", { id: item.id });
      }}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <PhotographerImage
              imagePath={item.photograph}
              style={styles.avatar}
            />
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {item.firmName || item.name || "Unnamed Photographer"}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {item.email || "No email provided"}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.approvalStatus) }]}>
            <Icon name={getStatusIcon(item.approvalStatus)} size={12} color="#fff" />
            <Text style={styles.statusText}>
              {item.approvalStatus || "PENDING"}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          {item.phone && (
            <View style={styles.detailRow}>
              <Icon name="phone" size={16} color="#2c5a73" />
              <Text style={styles.detailText}>{item.phone}</Text>
            </View>
          )}
          
          {item.address && (
            <View style={styles.detailRow}>
              <Icon name="map-marker" size={16} color="#2c5a73" />
              <Text style={styles.detailText} numberOfLines={2}>
                {item.address}
              </Text>
            </View>
          )}
          
          {item.description && (
            <View style={styles.detailRow}>
              <Icon name="text" size={16} color="#2c5a73" />
              <Text style={styles.detailText} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          )}
          
          {item.placeName && (
            <View style={styles.detailRow}>
              <Icon name="map-marker-radius" size={16} color="#2c5a73" />
              <Text style={styles.detailText}>{item.placeName}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <View style={styles.idContainer}>
              <Icon name="identifier" size={12} color="#64748b" />
              <Text style={styles.idText}>ID: {item.id}</Text>
            </View>
            
            {item.rating > 0 && (
              <View style={styles.rating}>
                <Icon name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.dateContainer}>
            <Icon name="calendar" size={12} color="#64748b" />
            <Text style={styles.dateText}>
              {item.createdOn ? new Date(item.createdOn).toLocaleDateString() : "N/A"}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="eye" size={18} color="#2c5a73" />
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="pencil" size={18} color="#2c5a73" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          
          {item.approvalStatus?.toLowerCase() === "pending" && (
            <>
              <TouchableOpacity style={[styles.actionButton, styles.approveButton]}>
                <Icon name="check" size={18} color="#10B981" />
                <Text style={[styles.actionText, styles.approveText]}>Approve</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionButton, styles.declineButton]}>
                <Icon name="close" size={18} color="#EF4444" />
                <Text style={[styles.actionText, styles.declineText]}>Decline</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const filteredPhotographers = getFilteredPhotographers();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c5a73" />
        
        <LinearGradient
          colors={['#2c5a73', '#1e3c4f']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Photographers</Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Icon name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5a73" />
          <Text style={styles.loadingText}>Loading photographers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c5a73" />
      
      <LinearGradient
        colors={['#2c5a73', '#1e3c4f']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Photographers ({filteredPhotographers.length})
          </Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Icon name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {renderFilterButton("all", "All")}
          {renderFilterButton("pending", "Pending")}
          {renderFilterButton("approved", "Approved")}
          {renderFilterButton("declined", "Declined")}
        </View>
      </LinearGradient>
      
      {filteredPhotographers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="camera-off" size={80} color="#2c5a73" />
          <Text style={styles.emptyTitle}>No Photographers Found</Text>
          <Text style={styles.emptySubtext}>
            {filter === "all" 
              ? "There are no photographers registered yet"
              : `No ${filter} photographers found`}
          </Text>
          <TouchableOpacity 
            style={styles.refreshBigButton}
            onPress={onRefresh}
          >
            <LinearGradient
              colors={['#2c5a73', '#1e3c4f']}
              style={styles.refreshGradient}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshBigText}>Refresh</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredPhotographers}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderPhotographerItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2c5a73"]}
              tintColor="#2c5a73"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: '#2c5a73',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    marginTop:-35
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 21,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#fff',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  filterButtonTextActive: {
    color: '#2c5a73',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2c5a73',
  },
  list: {
    padding: 16,
  },
  card: {
    borderRadius: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2c5a73',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  email: {
    fontSize: 12,
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  cardDetails: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#334155',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  idText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  actionText: {
    fontSize: 11,
    color: '#2c5a73',
    fontWeight: '500',
  },
  approveButton: {
    backgroundColor: '#d1fae5',
  },
  approveText: {
    color: '#10B981',
  },
  declineButton: {
    backgroundColor: '#fee2e2',
  },
  declineText: {
    color: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5a73',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshBigButton: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 3,
  },
  refreshGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    gap: 8,
  },
  refreshBigText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});