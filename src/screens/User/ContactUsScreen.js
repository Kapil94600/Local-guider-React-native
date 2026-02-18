import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function ContactUsScreen({ navigation }) {
  const PHONE_NUMBER = "+919876543210"; // 🔴 apna number
  const EMAIL = "support@localguider.com"; // 🔴 apni email

  /* 📞 CALL */
  const handleCall = async () => {
    const url = `tel:${PHONE_NUMBER}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert("Error", "Calling not supported on this device");
    }
  };

  /* 📧 EMAIL */
  const handleEmail = async () => {
    const url = `mailto:${EMAIL}`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert("Error", "Email app not available");
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔙 HEADER WITH GRADIENT */}
      <LinearGradient
        colors={['#1e3c4f', '#2c5a73', '#3b7a8f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Info Text */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Get in Touch</Text>
          <Text style={styles.infoText}>
            We're here to help! Choose your preferred way to contact us.
          </Text>
        </View>

        {/* 📞 PHONE CARD */}
        <TouchableOpacity style={styles.card} onPress={handleCall} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { backgroundColor: '#e6f0f5' }]}>
            <Ionicons name="call-outline" size={28} color="#2c5a73" />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.label}>Call Us</Text>
            <Text style={styles.value}>{PHONE_NUMBER}</Text>
            <Text style={styles.hint}>Available 24/7 for support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>

        {/* 📧 EMAIL CARD */}
        <TouchableOpacity style={styles.card} onPress={handleEmail} activeOpacity={0.7}>
          <View style={[styles.iconContainer, { backgroundColor: '#e6f0f5' }]}>
            <Ionicons name="mail-outline" size={28} color="#2c5a73" />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.label}>Email Us</Text>
            <Text style={styles.value}>{EMAIL}</Text>
            <Text style={styles.hint}>We'll respond within 24 hours</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>

        {/* Additional Info */}
        <View style={styles.workingHours}>
          <View style={styles.workingHoursHeader}>
            <Ionicons name="time-outline" size={18} color="#2c5a73" />
            <Text style={styles.workingHoursTitle}>Working Hours</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={styles.day}>Monday - Friday</Text>
            <Text style={styles.time}>9:00 AM - 8:00 PM</Text>
          </View>
          <View style={styles.hoursRow}>
            <Text style={styles.day}>Saturday - Sunday</Text>
            <Text style={styles.time}>10:00 AM - 6:00 PM</Text>
          </View>
        </View>

        {/* Social Media (Optional) */}
        <View style={styles.socialContainer}>
          <Text style={styles.socialTitle}>Connect With Us</Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#e6f0f5' }]}>
              <Ionicons name="logo-facebook" size={22} color="#2c5a73" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#e6f0f5' }]}>
              <Ionicons name="logo-twitter" size={22} color="#2c5a73" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#e6f0f5' }]}>
              <Ionicons name="logo-instagram" size={22} color="#2c5a73" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialIcon, { backgroundColor: '#e6f0f5' }]}>
              <Ionicons name="logo-whatsapp" size={22} color="#2c5a73" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

/* 🎨 STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  content: {
    flex: 1,
    padding: 16,
  },

  infoContainer: {
    marginBottom: 24,
    marginTop: 8,
  },

  infoTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
  },

  infoText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  textBox: {
    flex: 1,
    marginRight: 8,
  },

  label: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 2,
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },

  hint: {
    fontSize: 11,
    color: "#94a3b8",
  },

  workingHours: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  workingHoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  workingHoursTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },

  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },

  day: {
    fontSize: 14,
    color: "#64748b",
  },

  time: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2c5a73",
  },

  socialContainer: {
    marginTop: 8,
  },

  socialTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
    textAlign: 'center',
  },

  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },

  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});