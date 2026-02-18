import React, { useEffect, useState } from "react";
import { View, FlatList, Image, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../../api/apiClient";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

const BASE_URL = "https://localguider.sinfode.com";

const getImageUrl = (p) =>
  p?.startsWith("http") ? p : `${BASE_URL}/${p}`;

export default function PlaceGallery({ route }) {
  const { placeId } = route.params;
  const [images, setImages] = useState([]);

  const loadImages = async () => {
    const fd = new FormData();
    fd.append("placeId", placeId.toString());
    const res = await api.post("/images/get_by_id", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setImages(res.data?.data || []);
  };

  useEffect(() => {
    loadImages();
  }, []);

  const uploadImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (res.canceled) return;

    const fd = new FormData();
    fd.append("image", {
      uri: res.assets[0].uri,
      name: "place.jpg",
      type: "image/jpeg",
    });
    fd.append("placeId", placeId.toString());

    await api.post("/images/add", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    loadImages();
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={images}
        numColumns={3}
        keyExtractor={(i) => i.id.toString()}
        renderItem={({ item }) => (
          <Image
            source={{ uri: getImageUrl(item.imagePath) }}
            style={{ width: "30%", height: 100, margin: 5 }}
          />
        )}
      />

      <TouchableOpacity onPress={uploadImage} style={{ position: "absolute", bottom: 20, right: 20 }}>
        <Icon name="plus" size={30} />
      </TouchableOpacity>
    </View>
  );
}
