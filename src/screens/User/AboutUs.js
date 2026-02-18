import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function AboutUs({ navigation }) {
  const openLink = (url) => {
    Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
  };

  const teamMembers = [
    {
      name: "Rajesh Kumar",
      role: "Founder & CEO",
    },
    {
      name: "Priya Sharma",
      role: "Head of Operations",
    },
    {
      name: "Amit Patel",
      role: "Technical Lead",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#1e3c4f', '#2c5a73', '#3b7a8f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="compass" size={60} color="#fff" />
          </View>
          <Text style={styles.companyName}>TourEase</Text>
          <Text style={styles.tagline}>Your Perfect Travel Companion</Text>
        </View>

        {/* About Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <Text style={styles.sectionText}>
            TourEase was founded in 2023 with a simple mission: to connect travelers with the best local guides and photographers, making every journey memorable and hassle-free.
          </Text>
          <Text style={styles.sectionText}>
            What started as a small idea has now grown into a platform serving thousands of travelers across India.
          </Text>
        </View>

        {/* Mission & Vision */}
        <View style={styles.missionContainer}>
          <View style={styles.missionCard}>
            <View style={styles.missionIcon}>
              <Ionicons name="bulb-outline" size={28} color="#2c5a73" />
            </View>
            <Text style={styles.missionTitle}>Our Mission</Text>
            <Text style={styles.missionText}>
              To revolutionize travel by connecting people with authentic local experiences.
            </Text>
          </View>

          <View style={styles.missionCard}>
            <View style={styles.missionIcon}>
              <Ionicons name="eye-outline" size={28} color="#2c5a73" />
            </View>
            <Text style={styles.missionTitle}>Our Vision</Text>
            <Text style={styles.missionText}>
              To become the world's most trusted platform for finding local guides and photographers.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What We Offer</Text>
          
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name="map" size={22} color="#2c5a73" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Local Tour Guides</Text>
              <Text style={styles.featureText}>Expert guides who know the best spots and local stories</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name="camera" size={22} color="#2c5a73" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Professional Photographers</Text>
              <Text style={styles.featureText}>Capture your travel memories with professionals</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name="calendar" size={22} color="#2c5a73" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Easy Booking</Text>
              <Text style={styles.featureText}>Book guides and photographers instantly</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>10K+</Text>
            <Text style={styles.statLabel}>Happy Travelers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>500+</Text>
            <Text style={styles.statLabel}>Verified Guides</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>200+</Text>
            <Text style={styles.statLabel}>Photographers</Text>
          </View>
        </View>

        {/* Team */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Our Team</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {teamMembers.map((member, index) => (
              <View key={index} style={styles.teamCard}>
                <View style={styles.teamAvatar}>
                  <Text style={styles.teamAvatarText}>
                    {member.name.charAt(0)}
                  </Text>
                </View>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamRole}>{member.role}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Contact */}
        <View style={styles.contactCard}>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openLink('mailto:contact@tourease.com')}
          >
            <Ionicons name="mail-outline" size={18} color="#2c5a73" />
            <Text style={styles.contactText}>contact@tourease.com</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openLink('tel:+919876543210')}
          >
            <Ionicons name="call-outline" size={18} color="#2c5a73" />
            <Text style={styles.contactText}>+91 98765 43210</Text>
          </TouchableOpacity>

          <View style={styles.contactItem}>
            <Ionicons name="location-outline" size={18} color="#2c5a73" />
            <Text style={styles.contactText}>Mumbai, Maharashtra, India</Text>
          </View>
        </View>

        {/* Social Links */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="logo-facebook" size={20} color="#2c5a73" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="logo-instagram" size={20} color="#2c5a73" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="logo-twitter" size={20} color="#2c5a73" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon}>
            <Ionicons name="logo-whatsapp" size={20} color="#2c5a73" />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2024 TourEase. All rights reserved.</Text>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

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
  logoContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#2c5a73",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: "#64748b",
    fontStyle: "italic",
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 8,
  },
  missionContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  missionCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  missionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e6f0f5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  missionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
  },
  missionText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 16,
  },
  featureRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6f0f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  featureText: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#2c5a73",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    justifyContent: "space-around",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#e6f0f5",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  teamCard: {
    alignItems: "center",
    marginRight: 20,
    width: 100,
  },
  teamAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#2c5a73",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  teamAvatarText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  teamName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    textAlign: "center",
  },
  teamRole: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
  },
  contactCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  contactText: {
    fontSize: 13,
    color: "#1e293b",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6f0f5",
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 2,
  },
});