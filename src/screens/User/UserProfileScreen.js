import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Image,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import api from "../../api/api";
import { AuthContext } from "../../context/AuthContext";

const BASE_URL = "https://YOUR_BASE_URL";

export default function UserProfileScreen({ navigation }) {
    const { user, refreshUser } = useContext(AuthContext);
    useEffect(() => {
        if (user) {
            setForm({
                username: user.username || "",
                phone: user.phone || "",
                name: user.name || user.fullName || "",
                location: user.location || "",
                dob: user.dob || "",
                gender: user.gender || "",
            });
        }
    }, [user]);


    const [form, setForm] = useState({
        username: "",
        phone: "",
        name: "",
        location: "",
        dob: "",
        gender: "",
    });

    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setForm({
                username: user.username || "",
                phone: user.phone || "",
                name: user.name || user.fullName || "",
                location: user.location || "",
                dob: user.dob || "",
                gender: user.gender || "",
            });
        }
    }, [user]);

    const profileImage =
        image?.uri
            ? image.uri
            : user?.profilePicture
                ? `${BASE_URL}/Uploads/${user.profilePicture}`
                : null;

    /* 📸 PICK IMAGE */
    const pickImage = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
        });

        if (!res.canceled) {
            setImage(res.assets[0]);
        }
    };

    /* 💾 SAVE PROFILE */
    const handleSave = async () => {
        try {
            setLoading(true);

            // 1️⃣ Update profile fields
            await api.post("/user/update_profile", form);

            // 2️⃣ Upload image if changed
            if (image) {
                const fd = new FormData();
                fd.append("file", {
                    uri: image.uri,
                    name: "profile.jpg",
                    type: "image/jpeg",
                });

                await api.post("/user/update_profile_picture", fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            await refreshUser();
            Alert.alert("Success", "Profile updated");
            navigation.goBack();
        } catch (e) {
            Alert.alert("Error", "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* 🔵 HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {form.name || form.username}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* 👤 PROFILE IMAGE */}
                <TouchableOpacity
                    style={styles.imageBox}
                    onPress={pickImage}
                >
                    {profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.image} />
                    ) : (
                        <View style={styles.emptyImage} />
                    )}
                </TouchableOpacity>

                <Text style={styles.changePhoto}>
                    Change Profile Photo
                </Text>

                {/* ✏️ FORM */}
                <Input value={form.username} onChange={(v) => setForm({ ...form, username: v })} />
                <Input value={form.phone} editable={false} />
                <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <Input value={form.location} onChange={(v) => setForm({ ...form, location: v })} />

                <View style={styles.row}>
                    <Input small value={form.dob} onChange={(v) => setForm({ ...form, dob: v })} />
                    <Input small value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} />
                </View>
            </ScrollView>

            {/* 💾 SAVE */}
            <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={loading}
            >
                <Text style={styles.saveText}>
                    {loading ? "Saving..." : "Save"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

/* 🔹 INPUT */
function Input({ value, onChange, editable = true, small }) {
    return (
        <TextInput
            value={value}
            editable={editable}
            onChangeText={onChange}
            style={[
                styles.input,
                small && { flex: 1, marginHorizontal: 6 },
            ]}
        />
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },

    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        justifyContent: "space-between",
    },

    headerTitle: { fontSize: 16, fontWeight: "700" },

    imageBox: {
        alignSelf: "center",
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginTop: 20,
        overflow: "hidden",
    },

    image: { width: "100%", height: "100%" },
    emptyImage: { flex: 1 },

    changePhoto: {
        textAlign: "center",
        color: "#2563EB",
        marginVertical: 10,
        fontWeight: "600",
    },

    input: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 10,
        padding: 14,
        marginHorizontal: 16,
        marginTop: 12,
    },

    row: {
        flexDirection: "row",
        marginHorizontal: 10,
    },

    saveBtn: {
        backgroundColor: "#2563EB",
        padding: 16,
        borderRadius: 30,
        margin: 16,
        alignItems: "center",
    },

    saveText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});
