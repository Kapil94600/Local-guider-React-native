import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  SafeAreaView,
  Image // Added Image import
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function AboutUs({ navigation }) {
  const openLink = (url) => {
    Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
  };

  const teamMembers = [
    {
      name: "Mahesh Katariya",
      role: "संस्थापक और सीईओ (Founder & CEO)",
    },
    {
      name: "Sarwan Saini",
      role: "संचालन प्रमुख (Head of Operations)",
    },
    {
      name: "Sikar Infotech",
      role: "तकनीकी प्रमुख (Technical Lead)",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1e3c4f', '#2c5a73', '#3b7a8f']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>हमारे बारे में</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Logo Section - Icon replaced with Image */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image 
              source={require("../../../assets/images/logo.png")} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.companyName}>Local Guider</Text>
          <Text style={styles.tagline}>आपका अपना स्थानीय साथी</Text>
        </View>

        {/* Our Story */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>हमारी कहानी (Our Story)</Text>
          <Text style={styles.sectionText}>
            Local Guider की शुरुआत एक सरल विचार के साथ हुई थी: "क्या हो अगर हर अनजान शहर में आपका कोई अपना हो?" अक्सर पर्यटक मुख्य स्मारकों तक ही सीमित रह जाते हैं और वहां के असली रंग, स्वाद और कहानियों से चूक जाते हैं।
          </Text>
          <Text style={styles.sectionText}>
            इसी दूरी को मिटाने के लिए हमने इस प्लेटफॉर्म को बनाया। आज हम हजारों यात्रियों को भारत के अनुभवी स्थानीय गाइडों और फोटोग्राफरों से जोड़ रहे हैं, ताकि उनकी यात्रा सिर्फ एक टूर न रहकर एक खूबसूरत अनुभव बन जाए।
          </Text>
        </View>

        {/* Mission & Vision */}
        <View style={styles.missionContainer}>
          <View style={styles.missionCard}>
            <View style={styles.missionIcon}>
              <Ionicons name="bulb-outline" size={28} color="#2c5a73" />
            </View>
            <Text style={styles.missionTitle}>हमारा मिशन</Text>
            <Text style={styles.missionText}>
              पर्यटन को आसान, सुरक्षित और यादगार बनाना। हम यात्रियों को सीधे स्थानीय विशेषज्ञों से जोड़ते हैं।
            </Text>
          </View>

          <View style={styles.missionCard}>
            <View style={styles.missionIcon}>
              <Ionicons name="eye-outline" size={28} color="#2c5a73" />
            </View>
            <Text style={styles.missionTitle}>हमारा दृष्टिकोण</Text>
            <Text style={styles.missionText}>
              भारत का सबसे भरोसेमंद प्लेटफॉर्म बनना, जहाँ हर यात्री को एक स्थानीय साथी मिले।
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>हम क्या सुविधा देते हैं?</Text>
          
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#2c5a73" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>सत्यापित स्थानीय गाइड</Text>
              <Text style={styles.featureText}>ऐसे विशेषज्ञ जो शहर के कोने-कोने और वहां की अनकही कहानियों से वाकिफ हैं।</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name="camera" size={20} color="#2c5a73" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>प्रोफेशनल फोटोग्राफर</Text>
              <Text style={styles.featureText}>आपकी यात्रा की सुनहरी यादों को बेहतरीन तस्वीरों में कैद करने के लिए।</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name="flash" size={20} color="#2c5a73" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>आसान बुकिंग</Text>
              <Text style={styles.featureText}>बिना किसी झंझट के, तुरंत अपनी पसंद के गाइड को बुक करने की सुविधा।</Text>
            </View>
          </View>
        </View>

        {/* Team */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>हमारी टीम (Our Team)</Text>
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

        {/* Contact info */}
        <View style={styles.contactCard}>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openLink('mailto:localguider07@gmail.com')}
          >
            <Ionicons name="mail-outline" size={18} color="#2c5a73" />
            <Text style={styles.contactText}>localguider07@gmail.com</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => openLink('tel:+91957109700')}
          >
            <Ionicons name="call-outline" size={18} color="#2c5a73" />
            <Text style={styles.contactText}>+91 95710 97002</Text>
          </TouchableOpacity>

          <View style={styles.contactItem}>
            <Ionicons name="location-outline" size={18} color="#2c5a73" />
            <Text style={styles.contactText}>Rajasthan, India</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Local Guider. सर्वाधिकार सुरक्षित।</Text>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingTop: Platform.OS === 'ios' ? 10 : 50,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  logoContainer: { alignItems: "center", paddingVertical: 30 },
  logoCircle: { 
    width: 110, 
    height: 110, 
    borderRadius: 55, 
    backgroundColor: "#fff", // Changed to white to make the logo pop
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 15, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden' // Ensures image stays within circle
  },
  logoImage: {
    width: '80%',
    height: '80%',
  },
  companyName: { fontSize: 24, fontWeight: "bold", color: "#1e293b" },
  tagline: { fontSize: 13, color: "#64748b", fontStyle: "italic", marginTop: 4 },
  card: { backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 16, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 12 },
  sectionText: { fontSize: 14, color: "#475569", lineHeight: 22, marginBottom: 10 },
  missionContainer: { flexDirection: "row", marginHorizontal: 16, marginBottom: 16, gap: 12 },
  missionCard: { flex: 1, backgroundColor: "#fff", padding: 15, borderRadius: 16, alignItems: "center", elevation: 2 },
  missionIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#e6f0f5", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  missionTitle: { fontSize: 14, fontWeight: "700", color: "#1e293b", marginBottom: 5 },
  missionText: { fontSize: 11, color: "#64748b", textAlign: "center", lineHeight: 16 },
  featureRow: { flexDirection: "row", marginBottom: 15 },
  featureIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#e6f0f5", justifyContent: "center", alignItems: "center", marginRight: 12 },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  featureText: { fontSize: 12, color: "#64748b", lineHeight: 18, marginTop: 2 },
  teamCard: { alignItems: "center", marginRight: 20, width: 120 },
  teamAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#2c5a73", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  teamAvatarText: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  teamName: { fontSize: 13, fontWeight: "700", color: "#1e293b", textAlign: "center" },
  teamRole: { fontSize: 10, color: "#64748b", textAlign: "center", marginTop: 2 },
  contactCard: { backgroundColor: "#fff", marginHorizontal: 16, padding: 20, borderRadius: 16, elevation: 2 },
  contactItem: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 },
  contactText: { fontSize: 14, color: "#1e293b", fontWeight: '500' },
  footer: { alignItems: "center", paddingVertical: 20 },
  footerText: { fontSize: 11, color: "#94a3b8" },
});