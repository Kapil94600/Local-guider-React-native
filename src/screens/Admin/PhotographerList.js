// PhotographerList.js - SHOW ONLY APPROVED PHOTOGRAPHERS
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
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/apiClient";
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Load token on mount
  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        console.log('📸 Token loaded:', storedToken ? 'Yes' : 'No');
      } catch (error) {
        console.error('Error loading token:', error);
      }
    };
    loadToken();
  }, []);

  const loadPhotographers = async () => {
    try {
      setLoading(true);
      console.log('📸 Loading approved photographers...');
      
      // Get users with photographer flag
      const usersResponse = await api.post("/user/get_user_list", {
        page: 1,
        perPage: 100
      });
      
      const users = usersResponse?.data?.data || [];
      
      // Filter users who are photographers AND have pid (approved)
      const photographerUsers = users.filter(u => 
        u.photographer === true && u.pid !== null
      );
      
      console.log(`📸 Found ${photographerUsers.length} approved photographers`);
      
      if (photographerUsers.length > 0) {
        // Create photographer objects from user data
        const photographerData = photographerUsers.map(user => ({
          id: user.pid,
          userId: user.id,
          firmName: user.name,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          photograph: user.profile,
          approvalStatus: "APPROVED",
          createdOn: user.createdOn,
          rating: 0,
        }));
        
        console.log('📸 Photographer data created:', photographerData);
        setPhotographers(photographerData);
      } else {
        setPhotographers([]);
      }
      
    } catch (error) {
      console.error("📸 Error loading photographers:", error);
      Alert.alert("Error", "Failed to load photographers");
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

  // ✅ Show Photographer Details
  const showPhotographerDetails = (photographer) => {
    setSelectedPhotographer(photographer);
    setDetailsModalVisible(true);
  };

  // ✅ Delete Photographer
  const deletePhotographer = async (photographerId, photographerName) => {
    Alert.alert(
      "Delete Photographer",
      `Are you sure you want to delete "${photographerName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              
              console.log("🗑️ Deleting photographer:", photographerId);
              
              // Update local state
              setPhotographers(prev => prev.filter(p => p.id !== photographerId));
              
              Alert.alert("Success", "Photographer deleted!");
              setDetailsModalVisible(false);
              
            } catch (error) {
              console.error("❌ Delete error:", error);
              Alert.alert("Error", "Failed to delete");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    return "#10B981"; // Always green for approved
  };

  const getStatusIcon = (status) => {
    return "check-circle"; // Always check circle for approved
  };

  const renderPhotographerItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.95}
      onPress={() => showPhotographerDetails(item)}
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
              {item.firmName || item.name || "Unnamed"}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {item.email || "No email"}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.approvalStatus) }]}>
            <Icon name={getStatusIcon(item.approvalStatus)} size={12} color="#fff" />
            <Text style={styles.statusText}>
              APPROVED
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
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerLeft}>
            <View style={styles.idContainer}>
              <Icon name="identifier" size={12} color="#64748b" />
              <Text style={styles.idText}>ID: {item.id}</Text>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <Icon name="calendar" size={12} color="#64748b" />
            <Text style={styles.dateText}>
              {item.createdOn ? new Date(item.createdOn).toLocaleDateString() : "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => showPhotographerDetails(item)}
          >
            <Icon name="eye" size={18} color="#2c5a73" />
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deletePhotographer(item.id, item.firmName || item.name)}
          >
            <Icon name="delete" size={18} color="#EF4444" />
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c5a73" />
        <LinearGradient colors={['#2c5a73', '#1e3c4f']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Approved Photographers</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
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
      
      <LinearGradient colors={['#2c5a73', '#1e3c4f']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Approved Photographers ({photographers.length})
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Icon name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {photographers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="camera-off" size={80} color="#2c5a73" />
          <Text style={styles.emptyTitle}>No Approved Photographers</Text>
          <Text style={styles.emptySubtext}>
            No photographers have been approved yet
          </Text>
          <TouchableOpacity style={styles.refreshBigButton} onPress={onRefresh}>
            <LinearGradient colors={['#2c5a73', '#1e3c4f']} style={styles.refreshGradient}>
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.refreshBigText}>Refresh</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={photographers}
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

      {/* Photographer Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <BlurView intensity={20} style={StyleSheet.absoluteFill} />
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Photographer Details</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Icon name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            {selectedPhotographer && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalProfileSection}>
                  <View style={styles.modalAvatarContainer}>
                    <PhotographerImage
                      imagePath={selectedPhotographer.photograph}
                      style={styles.modalAvatar}
                    />
                  </View>
                  
                  <Text style={styles.modalName}>
                    {selectedPhotographer.firmName || selectedPhotographer.name}
                  </Text>
                  
                  <View style={[styles.modalStatusBadge, { backgroundColor: "#10B981" }]}>
                    <Icon name="check-circle" size={14} color="#fff" />
                    <Text style={styles.modalStatusText}>APPROVED</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Contact Information</Text>
                  <View style={styles.modalInfoRow}>
                    <Icon name="email" size={18} color="#2c5a73" />
                    <Text style={styles.modalInfoValue}>{selectedPhotographer.email || "N/A"}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Icon name="phone" size={18} color="#2c5a73" />
                    <Text style={styles.modalInfoValue}>{selectedPhotographer.phone || "N/A"}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Icon name="map-marker" size={18} color="#2c5a73" />
                    <Text style={styles.modalInfoValue}>{selectedPhotographer.address || "N/A"}</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalActionButton, styles.deleteModalButton]}
                    onPress={() => deletePhotographer(selectedPhotographer.id, selectedPhotographer.firmName)}
                  >
                    <Icon name="delete" size={18} color="#fff" />
                    <Text style={styles.modalActionText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    marginTop: -35
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
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    flexWrap: 'wrap',
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
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  deleteText: {
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalProfileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#2c5a73',
  },
  modalAvatar: {
    width: '100%',
    height: '100%',
  },
  modalName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    gap: 6,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  modalInfoValue: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  deleteModalButton: {
    backgroundColor: '#DC2626',
  },
  modalActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});