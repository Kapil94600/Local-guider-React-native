import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

export default function AddPlaceScreen({ navigation }) {
  const [placeName, setPlaceName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.image,
      quality: 0.8,
    });
    if (!res.canceled) {
      setImage(res.assets[0]);
    }
  };

  const submit = async () => {
    if (!placeName || !city || !state) {
      Alert.alert("Missing Fields", "Place Name, City and State are required");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("placeName", placeName);
      formData.append("city", city);
      formData.append("state", state);
      formData.append("fullAddress", address);
      formData.append("description", description);

      if (image?.uri) {
        formData.append("featuredImage", {
          uri: image.uri,
          name: `place_${Date.now()}.jpg`,
          type: "image/jpeg",
        });
      }

      const res = await api.post(API.ADD_PLACE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!res?.data?.success) {
        throw new Error(res?.data?.message);
      }

      Alert.alert("Success", "Place added successfully");
      navigation.goBack();
    } catch (err) {
      console.log("ADD PLACE ERROR 👉", err?.response?.data || err);
      Alert.alert("Error", "Place add nahi ho paaya");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f4f6fb" }}>
      {/* HEADER */}
      <View
        style={{
          backgroundColor: "#5f27cd",
          padding: 24,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800" }}>
          New Place
        </Text>
      </View>

      {/* FORM */}
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 24,
          padding: 18,
          margin: 16,
          marginTop: -30,
        }}
      >
        <Input
          icon="location-outline"
          placeholder="Place Name"
          value={placeName}
          onChangeText={setPlaceName}
        />

        <Input
          icon="business-outline"
          placeholder="City"
          value={city}
          onChangeText={setCity}
        />

        <Input
          icon="map-outline"
          placeholder="State"
          value={state}
          onChangeText={setState}
        />

        <Input
          icon="home-outline"
          placeholder="Full Address"
          value={address}
          onChangeText={setAddress}
        />

        <Input
          icon="chatbox-outline"
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* IMAGE PICKER */}
        <TouchableOpacity
          onPress={pickImage}
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 16,
            padding: 14,
            marginBottom: 12,
          }}
        >
          <Ionicons name="image-outline" size={20} color="#9ca3af" />
          <Text style={{ marginLeft: 10, color: image ? "#111827" : "#9ca3af" }}>
            {image ? "Image Selected" : "Pick Featured Image"}
          </Text>
        </TouchableOpacity>

        {/* SUBMIT */}
        <TouchableOpacity
          onPress={submit}
          disabled={loading}
          style={{
            backgroundColor: "#5f27cd",
            padding: 18,
            borderRadius: 18,
          }}
        >
          <Text
            style={{
              color: "#fff",
              textAlign: "center",
              fontWeight: "800",
              fontSize: 16,
            }}
          >
            {loading ? "Saving..." : "➕ Add Place"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ===== HELPERS ===== */
const Input = ({ icon, placeholder, value, onChangeText, multiline }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: multiline ? "flex-start" : "center",
      borderWidth: 1,
      borderColor: "#e5e7eb",
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
    }}
  >
    <Ionicons
      name={icon}
      size={20}
      color="#9ca3af"
      style={{ marginTop: multiline ? 4 : 0 }}
    />
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#9ca3af"
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      style={{
        marginLeft: 10,
        flex: 1,
        color: "#111827",
        minHeight: multiline ? 60 : undefined,
      }}
    />
  </View>
);
