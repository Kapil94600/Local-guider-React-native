import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function TermsConditions({ navigation }) {
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing or using TourEase, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.",
    },
    {
      title: "2. User Accounts",
      content: "You must be at least 18 years old. You are responsible for maintaining account confidentiality and providing accurate information.",
    },
    {
      title: "3. Services",
      content: "TourEase connects users with local tour guides and photographers. We facilitate bookings but don't provide services directly.",
    },
    {
      title: "4. Bookings and Payments",
      content: "All bookings are subject to availability. Payments are processed securely through our payment gateway in Indian Rupees (INR).",
    },
    {
      title: "5. Cancellation and Refunds",
      content: "Cancellation policies vary by service provider. Please review specific policy before booking. Refunds processed as per provider's policy.",
    },
    {
      title: "6. User Conduct",
      content: "Use services responsibly. Harassment, abuse, or inappropriate behavior will result in account termination.",
    },
    {
      title: "7. Privacy Policy",
      content: "Your privacy is important. Please review our Privacy Policy to understand how we collect and use your information.",
    },
    {
      title: "8. Limitation of Liability",
      content: "TourEase is not liable for any damages arising from service use. We don't guarantee accuracy of user-generated content.",
    },
    {
      title: "9. Changes to Terms",
      content: "We may modify these terms at any time. Continued use after changes constitutes acceptance.",
    },
    {
      title: "10. Governing Law",
      content: "These terms are governed by the laws of India. Disputes subject to jurisdiction of courts in Mumbai.",
    },
  ];

  const handleAccept = () => {
    Alert.alert(
      "Accept Terms",
      "By accepting, you confirm that you have read and agree to all terms and conditions.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () => {
            setAcceptModalVisible(false);
            Alert.alert("Success", "Thank you for accepting our terms");
          },
        },
      ]
    );
  };

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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Last Updated */}
        <View style={styles.lastUpdated}>
          <Ionicons name="time-outline" size={16} color="#2c5a73" />
          <Text style={styles.lastUpdatedText}>Last Updated: January 15, 2024</Text>
        </View>

        {/* Introduction */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Welcome to TourEase</Text>
          <Text style={styles.introText}>
            Please read these terms and conditions carefully before using our platform.
            By using TourEase, you agree to be bound by these terms.
          </Text>
        </View>

        {/* Terms Sections */}
        <View style={styles.sectionsCard}>
          {sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
              {index < sections.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Important Notes */}
        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Important Notes:</Text>
          
          <View style={styles.noteItem}>
            <Ionicons name="information-circle" size={16} color="#2c5a73" />
            <Text style={styles.noteText}>
              These terms constitute a legally binding agreement.
            </Text>
          </View>
          
          <View style={styles.noteItem}>
            <Ionicons name="information-circle" size={16} color="#2c5a73" />
            <Text style={styles.noteText}>
              Save a copy of these terms for your records.
            </Text>
          </View>
          
          <View style={styles.noteItem}>
            <Ionicons name="information-circle" size={16} color="#2c5a73" />
            <Text style={styles.noteText}>
              Contact support if you have any questions.
            </Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Contact Us</Text>
          <Text style={styles.contactText}>
            For questions about these terms, please contact:
          </Text>
          
          <TouchableOpacity style={styles.contactItem}>
            <Ionicons name="mail-outline" size={16} color="#2c5a73" />
            <Text style={styles.contactLink}>legal@tourease.com</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.contactItem}>
            <Ionicons name="call-outline" size={16} color="#2c5a73" />
            <Text style={styles.contactLink}>+91 98765 43210</Text>
          </TouchableOpacity>
        </View>

        {/* Accept Button */}
        <View style={styles.acceptContainer}>
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => setAcceptModalVisible(true)}
          >
            <Text style={styles.acceptButtonText}>I Accept the Terms</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Accept Modal */}
      <Modal
        visible={acceptModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAcceptModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <Ionicons name="document-text" size={50} color="#2c5a73" />
            </View>
            <Text style={styles.modalTitle}>Accept Terms & Conditions</Text>
            <Text style={styles.modalText}>
              By accepting, you confirm that you have read, understood, and agree to be bound by all the terms and conditions.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setAcceptModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalAcceptButton]}
                onPress={handleAccept}
              >
                <Text style={styles.modalAcceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  lastUpdated: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f0f5",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    gap: 6,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: "#2c5a73",
    fontWeight: "500",
  },
  introCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  sectionsCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginTop: 16,
  },
  notesCard: {
    backgroundColor: "#e6f0f5",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#b8d4e3",
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c5a73",
    marginBottom: 12,
  },
  noteItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: "#1e293b",
    lineHeight: 18,
  },
  contactCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  contactText: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  contactLink: {
    fontSize: 13,
    color: "#2c5a73",
    textDecorationLine: "underline",
  },
  acceptContainer: {
    alignItems: "center",
    marginVertical: 24,
    paddingHorizontal: 16,
  },
  acceptButton: {
    backgroundColor: "#2c5a73",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 320,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "#f1f5f9",
  },
  modalAcceptButton: {
    backgroundColor: "#2c5a73",
  },
  modalCancelText: {
    color: "#64748b",
    fontWeight: "600",
    fontSize: 14,
  },
  modalAcceptText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});