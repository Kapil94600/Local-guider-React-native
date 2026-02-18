import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../../api/apiClient";

export default function HelpSupport({ navigation }) {
  const [activeTab, setActiveTab] = useState("faq");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const faqData = [
    {
      id: 1,
      question: "How do I book a tour guide?",
      answer: "Go to 'Find Tour Guides' section, browse available guides, select your preferred guide, choose date and time, and complete the booking process.",
      category: "booking",
    },
    {
      id: 2,
      question: "How can I cancel my booking?",
      answer: "You can cancel your booking from 'My Bookings' section. Select the booking and click on 'Cancel Booking' button.",
      category: "booking",
    },
    {
      id: 3,
      question: "What is the refund policy?",
      answer: "Cancellations made 24 hours before the booking are eligible for full refund. Check specific booking for details.",
      category: "payment",
    },
    {
      id: 4,
      question: "How do I add money to my wallet?",
      answer: "Go to 'Add Balance' from the menu, enter amount, and complete payment through our secure gateway.",
      category: "payment",
    },
    {
      id: 5,
      question: "How do I become a tour guide?",
      answer: "Click on 'Work with us' in menu, select 'Tour Guide' role, and fill out the application form.",
      category: "account",
    },
    {
      id: 6,
      question: "How do I update my profile?",
      answer: "Go to 'Edit Profile' from menu to update your personal information and profile picture.",
      category: "account",
    },
  ];

  const categories = [
    { id: "all", label: "All" },
    { id: "booking", label: "Booking" },
    { id: "payment", label: "Payment" },
    { id: "account", label: "Account" },
  ];

  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredFaqs = selectedCategory === "all" 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

  const handleContactSubmit = async () => {
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      // API call here
      Alert.alert("Success", "Your message has been sent. We'll contact you soon.");
      setContactForm({ name: "", email: "", subject: "", message: "" });
      setActiveTab("faq");
    } catch (error) {
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  const startLiveChat = () => {
    setChatModalVisible(true);
    setChatMessages([
      {
        id: 1,
        text: "Welcome to Live Chat! How can we help you today?",
        sender: "support",
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: newMessage,
      sender: "user",
      time: new Date().toLocaleTimeString(),
    };

    setChatMessages([...chatMessages, userMessage]);
    setNewMessage("");

    // Simulate admin response
    setTimeout(() => {
      const adminMessage = {
        id: Date.now() + 1,
        text: "Thank you for your message. Our support team will respond shortly.",
        sender: "support",
        time: new Date().toLocaleTimeString(),
      };
      setChatMessages(prev => [...prev, adminMessage]);
    }, 2000);
  };

  const CategoryChip = ({ category, label, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        isSelected && styles.categoryChipSelected,
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.categoryChipText,
        isSelected && styles.categoryChipTextSelected,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const FAQItem = ({ item, isExpanded, onToggle }) => (
    <TouchableOpacity style={styles.faqItem} onPress={onToggle}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#64748b" 
        />
      </View>
      {isExpanded && (
        <Text style={styles.faqAnswer}>{item.answer}</Text>
      )}
    </TouchableOpacity>
  );

  const ChatMessage = ({ message }) => (
    <View style={[
      styles.messageContainer,
      message.sender === "user" ? styles.userMessage : styles.supportMessage,
    ]}>
      <Text style={[
        styles.messageText,
        message.sender === "user" ? styles.userMessageText : styles.supportMessageText,
      ]}>
        {message.text}
      </Text>
      <Text style={styles.messageTime}>{message.time}</Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "faq" && styles.activeTab]}
          onPress={() => setActiveTab("faq")}
        >
          <Ionicons 
            name="help-buoy" 
            size={20} 
            color={activeTab === "faq" ? "#2c5a73" : "#64748b"} 
          />
          <Text style={[styles.tabText, activeTab === "faq" && styles.activeTabText]}>
            FAQ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "contact" && styles.activeTab]}
          onPress={() => setActiveTab("contact")}
        >
          <Ionicons 
            name="mail" 
            size={20} 
            color={activeTab === "contact" ? "#2c5a73" : "#64748b"} 
          />
          <Text style={[styles.tabText, activeTab === "contact" && styles.activeTabText]}>
            Contact
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "chat" && styles.activeTab]}
          onPress={() => setActiveTab("chat")}
        >
          <Ionicons 
            name="chatbubbles" 
            size={20} 
            color={activeTab === "chat" ? "#2c5a73" : "#64748b"} 
          />
          <Text style={[styles.tabText, activeTab === "chat" && styles.activeTabText]}>
            Live Chat
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === "faq" && (
          <View style={styles.faqContainer}>
            {/* Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map(cat => (
                <CategoryChip
                  key={cat.id}
                  category={cat.id}
                  label={cat.label}
                  isSelected={selectedCategory === cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                />
              ))}
            </ScrollView>

            {/* FAQ List */}
            {filteredFaqs.map(faq => (
              <FAQItem
                key={faq.id}
                item={faq}
                isExpanded={expandedFaq === faq.id}
                onToggle={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              />
            ))}
          </View>
        )}

        {activeTab === "contact" && (
          <View style={styles.contactContainer}>
            <View style={styles.contactCard}>
              <Text style={styles.contactTitle}>Send us a Message</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  value={contactForm.name}
                  onChangeText={(text) => setContactForm({...contactForm, name: text})}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  value={contactForm.email}
                  onChangeText={(text) => setContactForm({...contactForm, email: text})}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Subject</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter subject"
                  value={contactForm.subject}
                  onChangeText={(text) => setContactForm({...contactForm, subject: text})}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Message *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your issue..."
                  multiline
                  numberOfLines={4}
                  value={contactForm.message}
                  onChangeText={(text) => setContactForm({...contactForm, message: text})}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleContactSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Send Message</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === "chat" && (
          <View style={styles.chatContainer}>
            <View style={styles.chatCard}>
              <Ionicons name="chatbubbles" size={60} color="#2c5a73" />
              <Text style={styles.chatTitle}>Live Chat Support</Text>
              <Text style={styles.chatSubtitle}>
                Chat with our support team in real-time
              </Text>
              <View style={styles.onlineBadge}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Available 24/7</Text>
              </View>

              <TouchableOpacity
                style={styles.startChatButton}
                onPress={startLiveChat}
              >
                <Ionicons name="chatbubble" size={20} color="#fff" />
                <Text style={styles.startChatButtonText}>Start Live Chat</Text>
              </TouchableOpacity>

              <View style={styles.chatFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="flash" size={18} color="#2c5a73" />
                  <Text style={styles.featureText}>Instant Response</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="people" size={18} color="#2c5a73" />
                  <Text style={styles.featureText}>Friendly Support</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Chat Modal */}
      <Modal
        visible={chatModalVisible}
        animationType="slide"
        onRequestClose={() => setChatModalVisible(false)}
      >
        <View style={styles.chatModal}>
          <LinearGradient
            colors={['#1e3c4f', '#2c5a73', '#3b7a8f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chatModalHeader}
          >
            <TouchableOpacity onPress={() => setChatModalVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.chatModalTitle}>Support Chat</Text>
              <View style={styles.onlineStatus}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineStatusText}>Online</Text>
              </View>
            </View>
            <View style={{ width: 24 }} />
          </LinearGradient>

          <FlatList
            data={chatMessages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ChatMessage message={item} />}
            contentContainerStyle={styles.messagesList}
          />

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type your message..."
              value={newMessage}
              onChangeText={setNewMessage}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !newMessage.trim() && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: "#e6f0f5",
  },
  tabText: {
    fontSize: 14,
    color: "#64748b",
    marginLeft: 6,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#2c5a73",
    fontWeight: "600",
  },
  faqContainer: {
    padding: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
    marginBottom: 16,
  },
  categoryChipSelected: {
    backgroundColor: "#2c5a73",
  },
  categoryChipText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  categoryChipTextSelected: {
    color: "#fff",
  },
  faqItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 12,
    lineHeight: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  contactContainer: {
    padding: 16,
  },
  contactCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#2c5a73",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  chatContainer: {
    padding: 16,
  },
  chatCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 12,
    marginBottom: 4,
  },
  chatSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f0f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  onlineText: {
    fontSize: 12,
    color: "#2c5a73",
    fontWeight: "500",
  },
  startChatButton: {
    backgroundColor: "#2c5a73",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 20,
    gap: 8,
  },
  startChatButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  chatFeatures: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  featureItem: {
    alignItems: "center",
  },
  featureText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  chatModal: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  chatModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 40,
  },
  chatModalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  onlineStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  onlineStatusText: {
    fontSize: 11,
    color: "#fff",
    marginLeft: 4,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: "80%",
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#2c5a73",
  },
  supportMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#fff",
  },
  supportMessageText: {
    color: "#1e293b",
  },
  messageTime: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: "#f8fafc",
    color: "#1e293b",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2c5a73",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});