import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import api from "../../api/apiClient";
import { API } from "../../api/endpoints";

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState({
    appName: "",
    supportEmail: "",
    supportPhone: "",
    commissionPercent: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  // 🔹 GET SETTINGS
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.post(API.GET_SETTINGS);
      const data = res.data?.data || {};

      setSettings({
        appName: data.appName || "",
        supportEmail: data.supportEmail || "",
        supportPhone: data.supportPhone || "",
        commissionPercent: data.commissionPercent
          ? String(data.commissionPercent)
          : "",
      });
    } catch (e) {
      console.log("Get settings error:", e.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 UPDATE SETTINGS
  const saveSettings = async () => {
    try {
      setLoading(true);

      await api.post(API.UPDATE_SETTINGS, {
        appName: settings.appName,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        commissionPercent: Number(settings.commissionPercent),
      });

      Alert.alert("Success", "Settings updated successfully");
    } catch (e) {
      console.log("Update settings error:", e.message);
      Alert.alert("Error", "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Settings</Text>

      <Text style={styles.label}>App Name</Text>
      <TextInput
        style={styles.input}
        value={settings.appName}
        onChangeText={(v) => setSettings({ ...settings, appName: v })}
        placeholder="Enter app name"
      />

      <Text style={styles.label}>Support Email</Text>
      <TextInput
        style={styles.input}
        value={settings.supportEmail}
        onChangeText={(v) => setSettings({ ...settings, supportEmail: v })}
        placeholder="support@email.com"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Support Phone</Text>
      <TextInput
        style={styles.input}
        value={settings.supportPhone}
        onChangeText={(v) => setSettings({ ...settings, supportPhone: v })}
        placeholder="Support phone number"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Commission (%)</Text>
      <TextInput
        style={styles.input}
        value={settings.commissionPercent}
        onChangeText={(v) => setSettings({ ...settings, commissionPercent: v })}
        placeholder="e.g. 10"
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={saveSettings}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Saving..." : "Save Settings"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    color: "#1F2937",
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    color: "#374151",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  button: {
    backgroundColor: "#3F51B5",
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
