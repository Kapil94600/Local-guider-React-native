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
  Share,
  Linking,
  StatusBar,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { File, Directory, Paths } from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/apiClient";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_URL = "https://localguider.sinfode.com";

// 🔥 Direct image URL from filename
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

// 🔥 Generate PDF HTML
const generatePDFHTML = (places) => {
  const placesList = places.map(place => `
    <div style="
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #2c5a73, #1e3c4f);
      border-radius: 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      color: white;
    ">
      <h2 style="color: white; margin-top: 0; font-size: 24px;">${place.placeName}</h2>
      
      <div style="margin: 15px 0;">
        <span style="
          background: rgba(255,255,255,0.2);
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 14px;
        ">
          ⭐ ${place.rating > 0 ? place.rating.toFixed(1) : 'New'}
        </span>
      </div>
      
      <p style="color: rgba(255,255,255,0.9); line-height: 1.6; margin: 10px 0;">
        ${place.description || 'No description available'}
      </p>
      
      <div style="margin: 10px 0;">
        <span style="color: white;">📍 ${place.city}, ${place.state}</span>
      </div>
      
      <div style="
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid rgba(255,255,255,0.2);
      ">
        <span>👁️ Views: ${place.views || 0}</span>
        ${place.topPlace ? '<span>👑 Top Place</span>' : ''}
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Tourist Places List</title>
      <style>
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          padding: 30px;
          background: #f5f5f5;
          margin: 0;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          text-align: center;
          color: #2c5a73;
          font-size: 32px;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #2c5a73;
        }
        .stats {
          text-align: center;
          color: #666;
          margin-bottom: 30px;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🏝️ Tourist Places Directory</h1>
        <div class="stats">
          Total Places: ${places.length} | Generated on ${new Date().toLocaleDateString()}
        </div>
        ${placesList}
      </div>
    </body>
    </html>
  `;
};

// 🔥 Download all places as PDF
const downloadPlacesAsPDF = async (places) => {
  try {
    if (places.length === 0) {
      Alert.alert("No Places", "No places to download");
      return;
    }

    Alert.alert(
      "Download Places List",
      `Download list of ${places.length} places as PDF?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download PDF",
          onPress: async () => {
            try {
              Alert.alert("Processing", "Generating PDF...");
              
              const html = generatePDFHTML(places);
              const { uri } = await Print.printToFileAsync({ html });
              
              const timestamp = Date.now();
              const dateStr = new Date().toISOString().split('T')[0];
              const fileName = `places_list_${dateStr}_${timestamp}.pdf`;
              
              const sourceFile = new File(uri);
              const downloadDir = new Directory(Paths.document, 'LocalGuider');
              
              if (!downloadDir.exists) {
                await downloadDir.create();
              }
              
              const destinationFile = new File(downloadDir, fileName);
              
              if (destinationFile.exists) {
                await destinationFile.delete();
              }
              
              sourceFile.copy(destinationFile);
              
              if (Platform.OS === 'android') {
                try {
                  const permissions = await MediaLibrary.requestPermissionsAsync();
                  if (permissions.granted) {
                    const asset = await MediaLibrary.createAssetAsync(destinationFile.uri);
                    await MediaLibrary.createAlbumAsync("LocalGuider", asset, false);
                  }
                } catch (mediaError) {
                  console.log("Media library error:", mediaError);
                }
              }
              
              Alert.alert(
                "✅ Success",
                `PDF downloaded successfully!\nFile: ${fileName}`,
                [
                  { text: "Share", onPress: () => sharePDF(destinationFile.uri, fileName) },
                  { text: "OK" }
                ]
              );
              
            } catch (error) {
              Alert.alert("Error", `Failed to generate PDF: ${error.message}`);
            }
          }
        }
      ]
    );
  } catch (error) {
    Alert.alert("Error", "Failed to download PDF");
  }
};

// 🔥 Share PDF function
const sharePDF = async (uri, fileName) => {
  try {
    if (await Sharing.isAvailableAsync()) {
      const file = new File(uri);
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${fileName}`,
        UTI: 'com.adobe.pdf'
      });
    } else {
      Alert.alert("Error", "Sharing is not available on this device");
    }
  } catch (error) {
    Alert.alert("Error", "Failed to share PDF");
  }
};

// 🔥 Download image function
const downloadImage = async (imageUrl, placeName) => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant storage permission to download images');
      return;
    }

    Alert.alert(
      "Download Image",
      "Do you want to download this image?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download",
          onPress: async () => {
            try {
              const timestamp = Date.now();
              const fileName = `${placeName.replace(/\s+/g, '_')}_${timestamp}.jpg`;
              
              const downloadDir = new Directory(Paths.document, 'LocalGuider');
              if (!downloadDir.exists) {
                await downloadDir.create();
              }
              
              const downloadedFile = await File.downloadFileAsync(imageUrl, downloadDir);
              
              try {
                const asset = await MediaLibrary.createAssetAsync(downloadedFile.uri);
                await MediaLibrary.createAlbumAsync("LocalGuider", asset, false);
              } catch (mediaError) {
                console.log("Media library error:", mediaError);
              }
              
              Alert.alert("✅ Success", "Image saved to your device!");
            } catch (error) {
              Alert.alert("Error", "Failed to download image");
            }
          }
        }
      ]
    );
  } catch (error) {
    console.error("❌ Permission error:", error);
  }
};

// 🔥 Share image function
const shareImage = async (imageUrl, placeName) => {
  try {
    await Share.share({
      message: `Check out this beautiful place: ${placeName}`,
      url: imageUrl,
      title: placeName,
    });
  } catch (error) {
    console.error("❌ Share error:", error);
  }
};

// 🔥 Open in Maps function
const openInMaps = (latitude, longitude, placeName) => {
  const url = Platform.select({
    ios: `maps:0,0?q=${placeName}@${latitude},${longitude}`,
    android: `geo:0,0?q=${latitude},${longitude}(${placeName})`,
  });
  Linking.openURL(url);
};

// 🔥 Image Component
const ApiImage = ({ imagePath, style, showDownload = false, placeName }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!imagePath) {
      setError(true);
      setLoading(false);
      return;
    }
    setImageUrl(getImageUrl(imagePath));
    setLoading(false);
  }, [imagePath]);

  if (loading) {
    return (
      <View style={[style, styles.imagePlaceholder]}>
        <ActivityIndicator size="small" color="#2c5a73" />
      </View>
    );
  }

  if (error || !imageUrl) {
    return (
      <View style={[style, styles.imageError]}>
        <Icon name="image-off" size={30} color="#2c5a73" />
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={{ uri: imageUrl }}
        style={StyleSheet.absoluteFill}
        onError={() => setError(true)}
        resizeMode="cover"
      />
      
      {showDownload && (
        <TouchableOpacity 
          style={styles.downloadButton}
          onPress={() => downloadImage(imageUrl, placeName)}
        >
          <BlurView intensity={80} style={styles.downloadBlur}>
            <Icon name="download" size={20} color="#fff" />
          </BlurView>
        </TouchableOpacity>
      )}
    </View>
  );
};

// 🔥 Place Details Modal
const PlaceDetailsModal = ({ visible, place, onClose, onNavigate }) => {
  if (!place) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.detailsModalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailsImageWrapper}>
              <ApiImage
                imagePath={place.featuredImage}
                style={styles.detailsImage}
                showDownload={true}
                placeName={place.placeName}
              />
              
              <TouchableOpacity onPress={onClose} style={styles.detailsCloseButton}>
                <BlurView intensity={80} style={styles.detailsCloseBlur}>
                  <Icon name="close" size={24} color="#fff" />
                </BlurView>
              </TouchableOpacity>

              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.detailsTitleGradient}
              >
                <Text style={styles.detailsModalTitle}>{place.placeName}</Text>
                <View style={styles.detailsLocation}>
                  <Icon name="map-marker" size={16} color="#fff" />
                  <Text style={styles.detailsLocationText}>
                    {place.city}, {place.state}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.detailsContent}>
              <View style={styles.detailsStatsRow}>
                <View style={styles.detailsStatItem}>
                  <Icon name="star" size={24} color="#FFD700" />
                  <Text style={styles.detailsStatValue}>
                    {place.rating > 0 ? place.rating.toFixed(1) : 'New'}
                  </Text>
                  <Text style={styles.detailsStatLabel}>Rating</Text>
                </View>
                
                <View style={styles.detailsStatItem}>
                  <Icon name="eye" size={24} color="#2c5a73" />
                  <Text style={styles.detailsStatValue}>{place.views || 0}</Text>
                  <Text style={styles.detailsStatLabel}>Views</Text>
                </View>

                {place.topPlace && (
                  <View style={styles.detailsStatItem}>
                    <Icon name="crown" size={24} color="#F59E0B" />
                    <Text style={styles.detailsStatValue}>Top</Text>
                    <Text style={styles.detailsStatLabel}>Place</Text>
                  </View>
                )}
              </View>

              {place.description && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>About</Text>
                  <Text style={styles.detailsDescription}>
                    {place.description}
                  </Text>
                </View>
              )}

              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Location</Text>
                
                {place.address && (
                  <View style={styles.detailsInfoRow}>
                    <Icon name="home" size={18} color="#2c5a73" />
                    <Text style={styles.detailsInfoText}>{place.address}</Text>
                  </View>
                )}

                {place.latitude && place.longitude && (
                  <TouchableOpacity 
                    style={styles.detailsInfoRow}
                    onPress={() => openInMaps(place.latitude, place.longitude, place.placeName)}
                  >
                    <Icon name="google-maps" size={18} color="#2c5a73" />
                    <Text style={[styles.detailsInfoText, styles.linkText]}>
                      Open in Google Maps
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.detailsActions}>
                <TouchableOpacity 
                  style={[styles.detailsActionButton, styles.editButton]}
                  onPress={() => {
                    onClose();
                    onNavigate("EditPlace", { placeId: place.id });
                  }}
                >
                  <Icon name="pencil" size={18} color="#fff" />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.detailsActionButton, styles.shareButton]}
                  onPress={() => {
                    const imageUrl = getImageUrl(place.featuredImage);
                    shareImage(imageUrl, place.placeName);
                  }}
                >
                  <Icon name="share" size={18} color="#fff" />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// 🔥 Add Place Modal
const AddPlaceModal = ({ visible, onClose, onSave, saving }) => {
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
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        setImageBase64(result.assets[0].base64);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSave = async () => {
    if (!placeName.trim() || !description.trim() || !state.trim() || !city.trim() ||
        !latitude.trim() || !longitude.trim() || !image) {
      Alert.alert("Error", "Please fill all required fields and select an image");
      return;
    }

    await onSave({
      placeName,
      description,
      state,
      city,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address || `${city}, ${state}, India`,
      mapUrl,
      topPlace,
      image,
      imageBase64,
    });

    resetForm();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        resetForm();
        onClose();
      }}
    >
      <BlurView intensity={10} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#2c5a73', '#1e3c4f']}
            style={styles.modalGradient}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Place</Text>
              <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity 
                style={styles.modalImagePicker} 
                onPress={pickImage}
              >
                {image ? (
                  <Image 
                    source={{ uri: image.uri }} 
                    style={styles.modalPreviewImage} 
                  />
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <Icon name="camera-plus" size={40} color="#fff" />
                    <Text style={styles.modalImageText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.modalForm}>
                <TextInput
                  style={styles.modalInput}
                  value={placeName}
                  onChangeText={setPlaceName}
                  placeholder="Place Name *"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                />

                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Description *"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.modalRow}>
                  <TextInput
                    style={[styles.modalInput, styles.modalHalfInput]}
                    value={state}
                    onChangeText={setState}
                    placeholder="State *"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                  />
                  <TextInput
                    style={[styles.modalInput, styles.modalHalfInput]}
                    value={city}
                    onChangeText={setCity}
                    placeholder="City *"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                  />
                </View>

                <View style={styles.modalRow}>
                  <TextInput
                    style={[styles.modalInput, styles.modalHalfInput]}
                    value={latitude}
                    onChangeText={setLatitude}
                    placeholder="Latitude *"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.modalInput, styles.modalHalfInput]}
                    value={longitude}
                    onChangeText={setLongitude}
                    placeholder="Longitude *"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    keyboardType="numeric"
                  />
                </View>

                <TextInput
                  style={styles.modalInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Address"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                />

                <TextInput
                  style={styles.modalInput}
                  value={mapUrl}
                  onChangeText={setMapUrl}
                  placeholder="Map URL"
                  placeholderTextColor="rgba(255,255,255,0.6)"
                />

                <TouchableOpacity 
                  style={styles.modalToggle}
                  onPress={() => setTopPlace(!topPlace)}
                >
                  <Text style={styles.modalToggleText}>Mark as Top Place</Text>
                  <View style={[
                    styles.modalToggleSwitch,
                    topPlace && styles.modalToggleSwitchActive
                  ]}>
                    <View style={[
                      styles.modalToggleDot,
                      topPlace && styles.modalToggleDotActive
                    ]} />
                  </View>
                </TouchableOpacity>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => { resetForm(); onClose(); }}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalSaveButton]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#2c5a73" />
                    ) : (
                      <Text style={styles.modalSaveText}>Add Place</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default function PlaceList({ navigation }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPlaces();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log("Media library permission not granted");
      }
    } catch (error) {
      console.error("❌ Permission error:", error);
    }
  };

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const res = await api.post("/places/get", { page: 1, perPage: 50 });
      setPlaces(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      Alert.alert("Error", "Failed to load places");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSavePlace = async (placeData) => {
    try {
      setSaving(true);
      
      const formData = new FormData();
      formData.append("placeName", placeData.placeName);
      formData.append("description", placeData.description);
      formData.append("state", placeData.state);
      formData.append("city", placeData.city);
      formData.append("latitude", placeData.latitude.toString());
      formData.append("longitude", placeData.longitude.toString());
      formData.append("address", placeData.address);
      formData.append("fullAddress", placeData.address);
      formData.append("mapUrl", placeData.mapUrl);
      formData.append("topPlace", placeData.topPlace ? "true" : "false");
      
      const imageName = `image_${Date.now()}.jpg`;
      formData.append("featuredImage", {
        uri: placeData.image.uri,
        name: imageName,
        type: 'image/jpeg',
      });

      const response = await api.post("/places/add", formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.status === true) {
        Alert.alert("Success", "Place added successfully!");
        setModalVisible(false);
        loadPlaces();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save place");
    } finally {
      setSaving(false);
    }
  };

  const deletePlace = (placeId) => {
    Alert.alert(
      "Delete Place",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.delete("/places/delete", { data: { placeId } });
              if (response.data?.status) {
                loadPlaces();
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete");
            }
          }
        }
      ]
    );
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Icon key={i} name="star" size={14} color="#FFD700" />);
      } else {
        stars.push(<Icon key={i} name="star-outline" size={14} color="#FFD700" />);
      }
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderPlaceItem = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        setSelectedPlace(item);
        setDetailsModalVisible(true);
      }}
      activeOpacity={0.9}
    >
      <View style={styles.cardImageContainer}>
        <ApiImage
          imagePath={item.featuredImage}
          style={styles.cardImage}
          placeName={item.placeName}
        />
        {item.topPlace && (
          <View style={styles.cardTopBadge}>
            <Icon name="crown" size={14} color="#F59E0B" />
            <Text style={styles.cardTopText}>Top</Text>
          </View>
        )}
      </View>

      <LinearGradient
        colors={['#2c5a73', '#1e3c4f']}
        style={styles.cardContent}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.placeName}
          </Text>
          <View style={styles.cardRating}>
            {renderStars(item.rating)}
            <Text style={styles.cardRatingText}>
              {item.rating > 0 ? item.rating.toFixed(1) : 'New'}
            </Text>
          </View>
        </View>

        <View style={styles.cardLocation}>
          <Icon name="map-marker" size={14} color="#fff" />
          <Text style={styles.cardLocationText} numberOfLines={1}>
            {item.city}, {item.state}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.cardStats}>
            <View style={styles.cardStat}>
              <Icon name="eye" size={14} color="#fff" />
              <Text style={styles.cardStatText}>{item.views || 0}</Text>
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.cardAction}
              onPress={() => navigation.navigate("EditPlace", { placeId: item.id })}
            >
              <Icon name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cardAction, styles.deleteAction]}
              onPress={() => deletePlace(item.id)}
            >
              <Icon name="delete" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#2c5a73', '#1e3c4f']}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading Amazing Places...</Text>
        </LinearGradient>
      </View>
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
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Discover</Text>
              <Text style={styles.headerSubtitle}>Beautiful Destinations</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => downloadPlacesAsPDF(places)}
            >
              <BlurView intensity={80} style={styles.headerButtonBlur}>
                <Icon name="file-pdf-box" size={22} color="#fff" />
              </BlurView>
            </TouchableOpacity>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{places.length}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {places.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="map-marker-off" size={80} color="#2c5a73" />
          <Text style={styles.emptyTitle}>No Places Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start by adding your first tourist place
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => setModalVisible(true)}
          >
            <LinearGradient
              colors={['#2c5a73', '#1e3c4f']}
              style={styles.emptyButtonGradient}
            >
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Add Place</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderPlaceItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={loadPlaces}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

      {places.length > 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <LinearGradient
            colors={['#2c5a73', '#1e3c4f']}
            style={styles.fabGradient}
          >
            <Icon name="plus" size={26} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <AddPlaceModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSavePlace}
        saving={saving}
      />
      
      <PlaceDetailsModal
        visible={detailsModalVisible}
        place={selectedPlace}
        onClose={() => setDetailsModalVisible(false)}
        onNavigate={navigation.navigate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  headerButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  headerButtonBlur: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: (SCREEN_WIDTH - 36) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardTopBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  cardTopText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  cardRatingText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLocationText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 4,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStats: {
    flexDirection: 'row',
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cardAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    backgroundColor: 'rgba(255,99,99,0.3)',
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
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 3,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#2c5a73',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  imageError: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  downloadButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  downloadBlur: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalImagePicker: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    marginBottom: 20,
    overflow: 'hidden',
  },
  modalImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageText: {
    marginTop: 8,
    fontSize: 16,
    color: '#fff',
  },
  modalPreviewImage: {
    width: '100%',
    height: '100%',
  },
  modalForm: {
    gap: 12,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#fff',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalHalfInput: {
    flex: 1,
  },
  modalToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 12,
  },
  modalToggleText: {
    fontSize: 15,
    color: '#fff',
  },
  modalToggleSwitch: {
    width: 44,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 2,
  },
  modalToggleSwitchActive: {
    backgroundColor: '#fff',
  },
  modalToggleDot: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  modalToggleDotActive: {
    transform: [{ translateX: 20 }],
    backgroundColor: '#2c5a73',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    backgroundColor: '#fff',
  },
  modalSaveText: {
    color: '#2c5a73',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 10,
  },
  detailsImageWrapper: {
    height: 250,
    width: '100%',
  },
  detailsImage: {
    width: '100%',
    height: '100%',
  },
  detailsCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  detailsCloseBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsTitleGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  detailsModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  detailsLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsLocationText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 4,
    opacity: 0.9,
  },
  detailsContent: {
    padding: 20,
  },
  detailsStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailsStatItem: {
    alignItems: 'center',
  },
  detailsStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  detailsStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  detailsDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  detailsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  detailsInfoText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  linkText: {
    color: '#2c5a73',
    textDecorationLine: 'underline',
  },
  detailsActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  detailsActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#2c5a73',
  },
  shareButton: {
    backgroundColor: '#1e3c4f',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});