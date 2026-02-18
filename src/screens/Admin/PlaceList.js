import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import api from "../../api/apiClient";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

const BASE_URL = "https://localguider.sinfode.com";

// 🔥 FIXED: Match Flutter's getImagesById method exactly
const fetchImageById = async (imageId) => {
  try {
    console.log("🖼️ Fetching image with ID:", imageId);
    
    // Extract ID from filename (same as Flutter)
    let id = imageId;
    if (imageId.includes('/')) {
      id = imageId.split('/').pop();
    }
    if (imageId.includes('\\')) {
      id = imageId.split('\\').pop();
    }
    if (imageId.startsWith('image_')) {
      // Extract just the number part
      const match = imageId.match(/\d+/);
      if (match) {
        id = match[0];
      }
    }
    
    console.log("🖼️ Extracted ID:", id);
    
    // Call the same API endpoint as Flutter's getImagesById
    const response = await api.post("/api/images/get_by_id", {
      photographerId: null,
      guiderId: null,
      placeId: id,
      imageId: id, // The image ID is passed as placeId in Flutter
      page: 1
    });
    
    console.log("🖼️ Image API response:", response.data);
    
    if (response.data?.status && response.data?.data?.length > 0) {
      // Flutter expects an array of ImageDto
      const imageDto = response.data.data[0];
      if (imageDto?.url) {
        return imageDto.url;
      } else if (imageDto?.base64) {
        return `data:image/jpeg;base64,${imageDto.base64}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error("❌ Error fetching image:", error.message);
    return null;
  }
};

// 🔥 NEW: Image component that uses the same API as Flutter
const ApiImage = ({ imagePath, style, placeId }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const loadImage = async () => {
      if (!imagePath && !placeId) {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      
      // Use placeId if provided, otherwise extract from imagePath
      const id = placeId || imagePath;
      
      // Try to fetch from API first (same as Flutter)
      const url = await fetchImageById(id);
      
      if (isMounted) {
        if (url) {
          console.log("✅ Image URL fetched:", url);
          setImageUrl(url);
          setError(false);
        } else {
          console.log("❌ Failed to fetch image for:", id);
          setError(true);
        }
        setLoading(false);
      }
    };

    loadImage();

    // Add timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.log("⏰ Image loading timeout");
        setError(true);
        setLoading(false);
      }
    }, 10000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [imagePath, placeId]);

  if (loading) {
    return (
      <View style={[style, styles.imagePlaceholder]}>
        <ActivityIndicator size="small" color="#42738f" />
      </View>
    );
  }

  if (error || !imageUrl) {
    return (
      <View style={[style, styles.imageError]}>
        <Icon name="image-off" size={24} color="#cbd5e1" />
        <Text style={styles.imageErrorText}>No Image</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={style}
      onError={() => {
        console.log("❌ Image failed to load:", imageUrl);
        setError(true);
      }}
      resizeMode="cover"
    />
  );
};

export default function PlaceList({ navigation }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [placeName, setPlaceName] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [topPlace, setTopPlace] = useState(false);
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadPlaces();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload images.');
      }
    } catch (error) {
      console.error("❌ Permission error:", error);
    }
  };

  const loadPlaces = async () => {
    try {
      setLoading(true);
      console.log("📡 Loading places...");
      
      const res = await api.post("/places/get", { 
        page: 1, 
        perPage: 50 
      });
      
      console.log("📍 Places API Response:", res.data);
      
      const placesData = res.data?.data || [];
      console.log(`📍 Places loaded: ${placesData.length}`);
      
      setPlaces(Array.isArray(placesData) ? placesData : []);
    } catch (e) {
      console.error("❌ Error loading places:", e.message);
      Alert.alert("Error", "Failed to load places");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPlaces();
  };

  // 🔥 TEST FUNCTION: Test the image API exactly like Flutter
  const testImageApi = async () => {
    if (places.length === 0) {
      Alert.alert("No Places", "No places to test");
      return;
    }

    console.log("\n🔍=== TESTING IMAGE API (Flutter Compatible) ===\n");
    
    for (let i = 0; i < Math.min(places.length, 3); i++) {
      const place = places[i];
      console.log(`Testing Place ID ${place.id}: ${place.placeName}`);
      console.log(`Image path: ${place.featuredImage}`);
      
      try {
        // Test the API exactly like Flutter's getImagesById
        const response = await api.post("/api/images/get_by_id", {
          photographerId: null,
          guiderId: null,
          placeId: place.id, // Use placeId, not the image filename
          page: 1
        });
        
        console.log(`API Response:`, response.data);
        
        if (response.data?.status && response.data?.data?.length > 0) {
          console.log(`✅ Found ${response.data.data.length} images`);
          console.log(`First image URL:`, response.data.data[0]?.url);
        } else {
          console.log(`❌ No images found for place ID: ${place.id}`);
        }
      } catch (error) {
        console.log(`❌ API Error:`, error.message);
      }
      console.log("---");
    }
    
    Alert.alert("Test Complete", "Check console for results");
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true, // Match Flutter's Uint8List
      });

      if (!result.canceled) {
        const selectedImage = result.assets[0];
        console.log("📸 Selected image:", selectedImage.uri);
        
        setImage(selectedImage);
        setImageBase64(selectedImage.base64);
        setImageError(false);
      }
    } catch (error) {
      console.error("❌ Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // 🔥 FIXED: Match Flutter's addPlace method exactly
  const handleSavePlace = async () => {
    // Validation
    if (!placeName.trim()) {
      Alert.alert("Error", "Place name is required");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Description is required");
      return;
    }
    if (!state.trim()) {
      Alert.alert("Error", "State is required");
      return;
    }
    if (!city.trim()) {
      Alert.alert("Error", "City is required");
      return;
    }
    if (!latitude.trim() || isNaN(parseFloat(latitude))) {
      Alert.alert("Error", "Valid latitude is required");
      return;
    }
    if (!longitude.trim() || isNaN(parseFloat(longitude))) {
      Alert.alert("Error", "Valid longitude is required");
      return;
    }
    if (!image || !imageBase64) {
      setImageError(true);
      Alert.alert("Error", "Please select an image");
      return;
    }

    try {
      setSaving(true);
      
      const formData = new FormData();
      
      // Add text fields - exactly like Flutter
      formData.append("placeName", placeName.trim());
      formData.append("description", description.trim());
      formData.append("state", state.trim());
      formData.append("city", city.trim());
      formData.append("latitude", parseFloat(latitude).toString());
      formData.append("longitude", parseFloat(longitude).toString());
      formData.append("address", address.trim() || `${city}, ${state}, India`);
      formData.append("fullAddress", address.trim() || `${city}, ${state}, India`);
      
      if (mapUrl.trim()) formData.append("mapUrl", mapUrl.trim());
      formData.append("topPlace", topPlace ? "true" : "false");
      
      // Add image - exactly like Flutter's convertUint8ListToMultipart
      const imageName = `image_${Date.now()}.jpg`;
      
      formData.append("featuredImage", {
        uri: image.uri,
        name: imageName,
        type: 'image/jpeg',
      });
      
      console.log("📤 Sending place data...");
      console.log("Place Name:", placeName);
      console.log("Image Name:", imageName);
      
      const response = await api.post("/places/add", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });
      
      console.log("✅ Save response:", response.data);
      
      if (response.data?.status === true) {
        Alert.alert("Success", "Place added successfully!", [
          {
            text: "OK",
            onPress: () => {
              resetForm();
              setModalVisible(false);
              loadPlaces();
            }
          }
        ]);
      } else {
        Alert.alert("Error", response.data?.message || "Failed to add place");
      }
      
    } catch (error) {
      console.error("❌ Save error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to save place. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setPlaceName("");
    setDescription("");
    setState("");
    setCity("");
    setLatitude("");
    setLongitude("");
    setAddress("");
    setMapUrl("");
    setTopPlace(false);
    setImage(null);
    setImageBase64(null);
    setImageError(false);
  };

  const deletePlace = async (placeId) => {
    Alert.alert(
      "Delete Place",
      "Are you sure you want to delete this place?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.delete("/places/delete", {
                data: { placeId }
              });
              
              if (response.data?.status) {
                Alert.alert("Success", "Place deleted successfully");
                loadPlaces();
              } else {
                Alert.alert("Error", response.data?.message || "Failed to delete");
              }
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("Error", "Failed to delete place");
            }
          }
        }
      ]
    );
  };

  const renderPlaceItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate("PlaceDetails", { placeId: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Pass the place ID to fetch images */}
          <ApiImage
            imagePath={item.featuredImage}
            placeId={item.id} // Pass placeId to fetch images
            style={styles.image}
          />
          
          <View style={styles.cardInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {item.placeName || "Unnamed Place"}
              </Text>
              {item.topPlace && (
                <View style={styles.topBadge}>
                  <Icon name="crown" size={12} color="#fff" />
                  <Text style={styles.topBadgeText}>Top</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.description} numberOfLines={2}>
              {item.description || "No description"}
            </Text>
            
            <View style={styles.locationRow}>
              <Icon name="map-marker" size={14} color="#64748b" />
              <Text style={styles.locationText}>
                {item.city || "Unknown City"}, {item.state || "Unknown State"}
              </Text>
            </View>
            
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => navigation.navigate("EditPlace", { placeId: item.id })}
              >
                <Icon name="pencil" size={16} color="#3B82F6" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deletePlace(item.id)}
              >
                <Icon name="delete" size={16} color="#EF4444" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => {
        resetForm();
        setModalVisible(false);
      }}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Place</Text>
            <TouchableOpacity
              onPress={() => {
                resetForm();
                setModalVisible(false);
              }}
            >
              <Icon name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity 
              style={[
                styles.imagePicker,
                imageError && styles.imagePickerError
              ]} 
              onPress={pickImage}
            >
              {image ? (
                <Image 
                  source={{ uri: image.uri }} 
                  style={styles.previewImage} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Icon name="camera-plus" size={40} color="#94a3b8" />
                  <Text style={styles.imagePickerText}>Select Image</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Place Name *</Text>
              <TextInput
                style={styles.input}
                value={placeName}
                onChangeText={setPlaceName}
                placeholder="Enter place name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>State *</Text>
                <TextInput
                  style={styles.input}
                  value={state}
                  onChangeText={setState}
                  placeholder="Enter state"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter city"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Latitude *</Text>
                <TextInput
                  style={styles.input}
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="e.g., 27.1751"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Longitude *</Text>
                <TextInput
                  style={styles.input}
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="e.g., 78.0421"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter full address"
                placeholderTextColor="#94a3b8"
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Map URL</Text>
              <TextInput
                style={styles.input}
                value={mapUrl}
                onChangeText={setMapUrl}
                placeholder="Enter Google Maps URL"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.toggleContainer}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Top Place</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    topPlace && styles.toggleButtonActive
                  ]}
                  onPress={() => setTopPlace(!topPlace)}
                >
                  <View style={[
                    styles.toggleDot,
                    topPlace && styles.toggleDotActive
                  ]} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSavePlace}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Place</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#42738f" />
        <Text style={styles.loadingText}>Loading places...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Tourist Places</Text>
            <Text style={styles.headerSubtitle}>{places.length} places found</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.testButton}
              onPress={testImageApi}
            >
              <Icon name="debug-step-over" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {places.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="map-marker-off" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Places Found</Text>
          <Text style={styles.emptySubtitle}>
            Add your first tourist place to get started
          </Text>
          <TouchableOpacity 
            style={styles.addFirstButton}
            onPress={() => setModalVisible(true)}
          >
            <Icon name="plus" size={20} color="#fff" />
            <Text style={styles.addFirstButtonText}>Add First Place</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderPlaceItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      {places.length > 0 && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => setModalVisible(true)}
        >
          <Icon name="plus" size={26} color="#fff" />
        </TouchableOpacity>
      )}

      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  testButton: {
    backgroundColor: "#8B5CF6",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 24,
  },
  addFirstButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#42738f",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
  },
  addFirstButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
  },
  image: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  imageError: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  imageErrorText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    flex: 1,
  },
  topBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 4,
  },
  description: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 8,
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#3B82F6",
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#EF4444",
    marginLeft: 4,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#42738f",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  imagePicker: {
    width: "100%",
    height: 200,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    marginBottom: 20,
    overflow: "hidden",
  },
  imagePickerError: {
    borderColor: "#EF4444",
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: "#94a3b8",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1e293b",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    marginBottom: 16,
  },
  toggleContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleLabel: {
    fontSize: 14,
    color: "#1e293b",
  },
  toggleButton: {
    width: 44,
    height: 24,
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: "#42738f",
  },
  toggleDot: {
    width: 20,
    height: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  toggleDotActive: {
    transform: [{ translateX: 20 }],
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748b",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    marginLeft: 8,
    backgroundColor: "#42738f",
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});