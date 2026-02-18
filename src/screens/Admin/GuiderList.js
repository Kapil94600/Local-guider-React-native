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
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import api from "../../api/apiClient";

export default function GuiderList({ navigation }) {
  const [guiders, setGuiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadGuiders = async () => {
    try {
      const response = await api.post("/guider/get_all", {
        admin: true,
      });
      
      const responseData = response.data || {};
      const guidersData = responseData.data || [];
      
      console.log("Guiders loaded:", guidersData.length);
      setGuiders(guidersData);
    } catch (error) {
      console.error("Error loading guiders:", error);
      Alert.alert("Error", "Failed to load guiders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGuiders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadGuiders();
  };

  const renderGuiderItem = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {item.photograph ? (
            <Image 
              source={{ uri: item.photograph }} 
              style={styles.avatarImage}
            />
          ) : (
            <Icon name="map-marker-account" size={24} color="#000000e3" />
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.name}>{item.firmName || item.name || "Unnamed Guider"}</Text>
          <Text style={styles.email}>{item.email || "No email"}</Text>
        </View>
        <View style={[styles.statusBadge, 
          item.approvalStatus === "Approved" ? styles.approvedBadge : 
          item.approvalStatus === "DECLINED" ? styles.declinedBadge : 
          styles.pendingBadge
        ]}>
          <Text style={styles.statusText}>
            {item.approvalStatus || "PENDING"}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardDetails}>
        {item.phone && (
          <View style={styles.detailRow}>
            <Icon name="phone" size={14} color="#000000" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        )}
        
        {item.address && (
          <View style={styles.detailRow}>
            <Icon name="map-marker" size={14} color="#000000" />
            <Text style={styles.detailText}>{item.address}</Text>
          </View>
        )}
        
        {item.description && (
          <View style={styles.detailRow}>
            <Icon name="text" size={14} color="#000000" />
            <Text style={styles.detailText} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        )}
        
        {item.placeName && (
          <View style={styles.detailRow}>
            <Icon name="map-marker-radius" size={14} color="#000000" />
            <Text style={styles.detailText}>{item.placeName}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Text style={styles.idText}>ID: {item.id}</Text>
          {item.rating > 0 && (
            <View style={styles.rating}>
              <Icon name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.dateText}>
          {item.createdOn ? new Date(item.createdOn).toLocaleDateString() : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {/* ✅ CUSTOM HEADER ADDED */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Tourist Guiders</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Icon name="refresh" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3a0250e3" />
          <Text style={styles.loadingText}>Loading guiders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ CUSTOM HEADER ADDED */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Tourist Guiders ({guiders.length})</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Icon name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {guiders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="account-off" size={60} color="#d1d5db" />
          <Text style={styles.emptyText}>No guiders found</Text>
          <Text style={styles.emptySubtext}>
            There are no tourist guiders registered yet
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Icon name="refresh" size={20} color="#3a0250e3" />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={guiders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderGuiderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3a0250e3"]}
            />
          }
          showsVerticalScrollIndicator={false}
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
  // ✅ HEADER STYLES ADDED
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#42738fe3",
    borderBottomWidth: 1,
    borderBottomColor: "#42738fe3",
    height: 100,
    marginBottom: 15,
    paddingTop: 35,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#d7e5ede3",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: "#42738fe3",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0e6f7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  email: {
    fontSize: 12,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  approvedBadge: {
    backgroundColor: "#42738fe3",
  },
  declinedBadge: {
    backgroundColor: "#42738fe3",
  },
  pendingBadge: {
    backgroundColor: "#42738fe3",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
    textTransform: "uppercase",
  },
  cardDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 13,
    color: "#2a2a2a",
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#42738fe3",
    paddingTop: 12,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  idText: {
    fontSize: 11,
    color: "#000000",
    fontWeight: "500",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    color: "#000000",
    fontWeight: "500",
  },
  dateText: {
    fontSize: 11,
    color: "#000000",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#000000",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    color: "#3a0250e3",
    fontWeight: "600",
    fontSize: 14,
  },
});