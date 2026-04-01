import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Switch,
    Image,
    Alert,
    ActivityIndicator,
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

const BASE_URL = "https://localguider.sinfode.com";

export default function AddPlaceScreen({ navigation, route }) {
    const existingPlace = route?.params?.place;
    const isEditing = !!existingPlace;

    const [loading, setLoading] = useState(false);
    const [placeName, setPlaceName] = useState("");
    const [description, setDescription] = useState("");
    const [state, setState] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [mapUrl, setMapUrl] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [topPlace, setTopPlace] = useState(false);
    const [featuredImage, setFeaturedImage] = useState(null);      // new image if changed
    const [featuredImageUri, setFeaturedImageUri] = useState(null); // preview
    const [galleryImages, setGalleryImages] = useState([]);        // only used for adding new gallery images when creating new place

    // Pre‑fill if editing
    useEffect(() => {
        if (existingPlace) {
            setPlaceName(existingPlace.placeName || "");
            setDescription(existingPlace.description || "");
            setState(existingPlace.state || "");
            setCity(existingPlace.city || "");
            setAddress(existingPlace.fullAddress || "");
            setMapUrl(existingPlace.mapUrl || "");
            setLatitude(existingPlace.latitude?.toString() || "");
            setLongitude(existingPlace.longitude?.toString() || "");
            setTopPlace(existingPlace.topPlace || false);
            if (existingPlace.featuredImage) {
                // Show the existing image as preview (no new file yet)
                const filename = existingPlace.featuredImage.split('/').pop();
                setFeaturedImageUri(`${BASE_URL}/api/image/download/${filename}`);
            }
        }
    }, [existingPlace]);

    // Pick featured image (single)
    const pickFeaturedImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "Please allow access to your photo library");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });
        if (!result.canceled) {
            const asset = result.assets[0];
            setFeaturedImage(asset);
            setFeaturedImageUri(asset.uri);
        }
    };

    // Pick multiple gallery images (only used when creating new place)
    const pickGalleryImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "Please allow access to your photo library");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsMultipleSelection: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            setGalleryImages([...galleryImages, ...result.assets]);
        }
    };

    // Remove a gallery image (only used when creating new place)
    const removeGalleryImage = (index) => {
        const newImages = [...galleryImages];
        newImages.splice(index, 1);
        setGalleryImages(newImages);
    };

    // Validate form
    const validate = () => {
        if (!placeName.trim()) {
            Alert.alert("Error", "Place name is required");
            return false;
        }
        if (!description.trim()) {
            Alert.alert("Error", "Description is required");
            return false;
        }
        if (!state.trim()) {
            Alert.alert("Error", "State is required");
            return false;
        }
        if (!city.trim()) {
            Alert.alert("Error", "City is required");
            return false;
        }
        if (!latitude.trim() || isNaN(parseFloat(latitude))) {
            Alert.alert("Error", "Valid latitude is required");
            return false;
        }
        if (!longitude.trim() || isNaN(parseFloat(longitude))) {
            Alert.alert("Error", "Valid longitude is required");
            return false;
        }
        // Featured image required only for new places
        if (!isEditing && !featuredImage) {
            Alert.alert("Error", "Featured image is required");
            return false;
        }
        return true;
    };

    // Submit form
    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("placeName", placeName.trim());
            formData.append("description", description.trim());
            formData.append("state", state.trim());
            formData.append("city", city.trim());
            if (address) formData.append("address", address.trim());
            if (mapUrl) formData.append("mapUrl", mapUrl.trim());
            formData.append("latitude", parseFloat(latitude).toString());
            formData.append("longitude", parseFloat(longitude).toString());
            formData.append("topPlace", topPlace.toString());

            // If editing, add placeId
            if (isEditing) {
                formData.append("placeId", existingPlace.id.toString());
            }

            // Featured image – only if a new image was selected
            if (featuredImage) {
                formData.append("featuredImage", {
                    uri: featuredImage.uri,
                    type: featuredImage.mimeType || "image/jpeg",
                    name: `featured_${Date.now()}.jpg`,
                });
            }

            // Determine endpoint
            const endpoint = isEditing ? API.EDIT_PLACE : API.ADD_PLACE;

            // Send main place request
            const placeResponse = await api.post(endpoint, formData);
            if (!placeResponse.data?.status) {
                throw new Error(placeResponse.data?.message || "Failed to save place");
            }

            const placeId = placeResponse.data.data?.id || existingPlace?.id;

            // If creating a new place, upload gallery images
            if (!isEditing && galleryImages.length > 0) {
                for (const image of galleryImages) {
                    const imageForm = new FormData();
                    imageForm.append("placeId", placeId.toString());
                    imageForm.append("title", placeName.trim());
                    imageForm.append("description", description.trim());
                    imageForm.append("image", {
                        uri: image.uri,
                        type: image.mimeType || "image/jpeg",
                        name: `gallery_${Date.now()}.jpg`,
                    });
                    await api.post(API.ADD_IMAGE, imageForm);
                }
            }

            Alert.alert("Success", `Place ${isEditing ? "updated" : "added"} successfully!`);
            navigation.goBack();
        } catch (error) {
            console.error("❌ Submit error:", error);
            let message = "Failed to save place";
            if (error.response?.data?.message) {
                message = error.response.data.message;
            } else if (error.message) {
                message = error.message;
            }
            Alert.alert("Error", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#2c5a73" barStyle="light-content" />

            <LinearGradient colors={["#2c5a73", "#1e3c4f"]} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isEditing ? "Edit Place" : "Add New Place"}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
                {/* Featured Image Picker */}
                <TouchableOpacity style={styles.imagePicker} onPress={pickFeaturedImage}>
                    {featuredImageUri ? (
                        <Image source={{ uri: featuredImageUri }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="camera-outline" size={40} color="#2c5a73" />
                            <Text style={styles.placeholderText}>
                                {isEditing ? "Tap to change featured image" : "Tap to select featured image"}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Input Fields */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Place Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={placeName}
                        onChangeText={setPlaceName}
                        placeholder="e.g., Taj Mahal"
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe the place..."
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>State *</Text>
                        <TextInput
                            style={styles.input}
                            value={state}
                            onChangeText={setState}
                            placeholder="Rajasthan"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>City *</Text>
                        <TextInput
                            style={styles.input}
                            value={city}
                            onChangeText={setCity}
                            placeholder="Jaipur"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.label}>Latitude *</Text>
                        <TextInput
                            style={styles.input}
                            value={latitude}
                            onChangeText={setLatitude}
                            placeholder="27.1751"
                            keyboardType="numeric"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.label}>Longitude *</Text>
                        <TextInput
                            style={styles.input}
                            value={longitude}
                            onChangeText={setLongitude}
                            placeholder="78.0421"
                            keyboardType="numeric"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Address (optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Full address"
                        placeholderTextColor="#94a3b8"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Map URL (optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={mapUrl}
                        onChangeText={setMapUrl}
                        placeholder="https://maps.google.com/..."
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.switchRow}>
                    <Text style={styles.label}>Mark as Top Place</Text>
                    <Switch
                        value={topPlace}
                        onValueChange={setTopPlace}
                        trackColor={{ false: "#e2e8f0", true: "#2c5a73" }}
                        thumbColor="#fff"
                    />
                </View>

                {/* Gallery Images – only shown when creating a new place */}
                {!isEditing && (
                    <View style={styles.gallerySection}>
                        <Text style={styles.label}>Gallery Images (optional)</Text>
                        <TouchableOpacity style={styles.addGalleryButton} onPress={pickGalleryImages}>
                            <Ionicons name="images-outline" size={24} color="#2c5a73" />
                            <Text style={styles.addGalleryText}>Add multiple images</Text>
                        </TouchableOpacity>

                        {galleryImages.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryPreview}>
                                {galleryImages.map((img, index) => (
                                    <View key={index} style={styles.galleryItem}>
                                        <Image source={{ uri: img.uri }} style={styles.galleryImage} />
                                        <TouchableOpacity
                                            style={styles.removeGallery}
                                            onPress={() => removeGalleryImage(index)}
                                        >
                                            <Ionicons name="close-circle" size={22} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={["#2c5a73", "#1e3c4f"]}
                        style={styles.submitGradient}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>
                                {isEditing ? "Update Place" : "Add Place"}
                            </Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f7fa" },
    header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, marginTop: -35 },
    headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
    formContainer: { padding: 20, paddingBottom: 40 },
    imagePicker: { width: "100%", height: 180, backgroundColor: "#fff", borderRadius: 12, borderWidth: 2, borderColor: "#2c5a73", borderStyle: "dashed", overflow: "hidden", marginBottom: 20, justifyContent: "center", alignItems: "center" },
    previewImage: { width: "100%", height: "100%" },
    placeholder: { alignItems: "center", justifyContent: "center" },
    placeholderText: { marginTop: 8, fontSize: 14, color: "#2c5a73" },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginBottom: 6 },
    input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, padding: 12, fontSize: 14, color: "#1e293b" },
    textArea: { minHeight: 100, textAlignVertical: "top" },
    row: { flexDirection: "row" },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    gallerySection: { marginBottom: 20 },
    addGalleryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderWidth: 1, borderColor: "#2c5a73", borderStyle: "dashed", borderRadius: 12, backgroundColor: "#f8fafc" },
    addGalleryText: { marginLeft: 8, fontSize: 14, color: "#2c5a73", fontWeight: "600" },
    galleryPreview: { flexDirection: "row", marginTop: 12 },
    galleryItem: { position: "relative", marginRight: 12 },
    galleryImage: { width: 100, height: 100, borderRadius: 8 },
    removeGallery: { position: "absolute", top: 4, right: 4, backgroundColor: "#fff", borderRadius: 12 },
    submitButton: { marginTop: 20, borderRadius: 12, overflow: "hidden" },
    submitGradient: { paddingVertical: 16, alignItems: "center" },
    submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    disabledButton: { opacity: 0.6 },
});