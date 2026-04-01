import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function TermsConditions({ navigation }) {
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);

  const sections = [
    {
      title: "1. शर्तों की स्वीकृति",
      content: "Local Guider ऐप का उपयोग करने का अर्थ है कि आप यहाँ दिए गए सभी नियमों और कानूनों का पालन करने के लिए कानूनी रूप से बाध्य हैं। यदि आप इन शर्तों से सहमत नहीं हैं, तो कृपया हमारी सेवाओं का उपयोग न करें।",
    },
    {
      title: "2. उपयोगकर्ता खाता (User Account)",
      content: "• आपकी आयु कम से कम 18 वर्ष होनी चाहिए।\n• आप अपने अकाउंट की जानकारी और पासवर्ड को सुरक्षित रखने के लिए पूरी तरह जिम्मेदार हैं।\n• अकाउंट बनाते समय दी गई सभी जानकारी सटीक और सच होनी चाहिए।",
    },
    {
      title: "3. हमारी सेवाएँ",
      content: "Local Guider एक प्लेटफॉर्म है जो यात्रियों (Travelers) को स्थानीय टूर गाइड और फोटोग्राफरों से जोड़ता है। हम केवल बुकिंग की सुविधा प्रदान करते हैं; हम सीधे तौर पर गाइड या फोटोग्राफी की सेवाएं स्वयं प्रदान नहीं करते।",
    },
    {
      title: "4. बुकिंग और भुगतान",
      content: "• सभी बुकिंग गाइड की उपलब्धता (Availability) के आधार पर तय की जाएंगी।\n• भुगतान सुरक्षित तरीके से भारतीय रुपये (INR) में लिया जाएगा।\n• बुकिंग के समय दिखाई गई राशि ही मान्य होगी।",
    },
    {
      title: "5. रद्दीकरण और रिफंड (Cancellation & Refund)",
      content: "बुकिंग रद्द करने की नीतियां अलग-अलग सेवा प्रदाताओं (Guides) के अनुसार भिन्न हो सकती हैं। रिफंड की प्रक्रिया हमारे रिफंड नियमों के तहत की जाएगी। कृपया बुकिंग से पहले रिफंड पॉलिसी को ध्यान से पढ़ लें।",
    },
    {
      title: "6. उपयोगकर्ता का आचरण",
      content: "ऐप का उपयोग केवल वैध उद्देश्यों के लिए ही करें। किसी भी गाइड या फोटोग्राफर के साथ दुर्व्यवहार, अभद्र भाषा या गलत व्यवहार करने पर आपका अकाउंट तुरंत बंद कर दिया जाएगा।",
    },
    {
      title: "7. गोपनीयता नीति (Privacy Policy)",
      content: "आपकी गोपनीयता हमारे लिए अत्यंत महत्वपूर्ण है। हम आपकी जानकारी का उपयोग केवल सेवा को बेहतर बनाने और बुकिंग प्रक्रिया के लिए करते हैं। हम आपकी जानकारी किसी तीसरे पक्ष को नहीं बेचते।",
    },
    {
      title: "8. जिम्मेदारी की सीमा",
      content: "सेवा के दौरान होने वाले किसी भी आकस्मिक नुकसान, चोट या असंतोष के लिए Local Guider सीधे तौर पर जिम्मेदार नहीं होगा। हम यात्रियों और गाइडों के बीच एक सेतु (Bridge) के रूप में कार्य करते हैं।",
    },
    {
      title: "9. नियमों में बदलाव",
      content: "हम किसी भी समय इन नियमों और शर्तों को बदल सकते हैं। ऐप का उपयोग जारी रखने का मतलब होगा कि आप नए नियमों को स्वीकार करते हैं।",
    },
    {
      title: "10. कानूनी अधिकार क्षेत्र",
      content: "ये शर्तें भारतीय कानूनों के अधीन हैं। किसी भी विवाद की स्थिति में न्यायिक कार्यक्षेत्र राजस्थान की अदालतें होंगी।",
    },
  ];

  const handleAccept = () => {
    setAcceptModalVisible(false);
    Alert.alert("सफलता", "नियमों को स्वीकार करने के लिए धन्यवाद।");
  };

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
        <Text style={styles.headerTitle}>नियम और शर्तें</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Local Guider में आपका स्वागत है</Text>
          <Text style={styles.introText}>
            कृपया हमारे प्लेटफॉर्म का उपयोग करने से पहले इन नियमों और शर्तों को ध्यान से पढ़ें। इस ऐप का उपयोग करके, आप इन शर्तों को मानने के लिए अपनी सहमति देते हैं।
          </Text>
        </View>

        {/* Sections */}
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
          <Text style={styles.notesTitle}>महत्वपूर्ण सूचना:</Text>
          <View style={styles.noteItem}>
            <Ionicons name="shield-checkmark" size={16} color="#2c5a73" />
            <Text style={styles.noteText}>यह एक कानूनी समझौता है।</Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="phone-portrait-outline" size={16} color="#2c5a73" />
            <Text style={styles.noteText}>भविष्य के संदर्भ के लिए आप इन शर्तों का स्क्रीनशॉट ले सकते हैं।</Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="help-circle-outline" size={16} color="#2c5a73" />
            <Text style={styles.noteText}>सहायता के लिए हमारे सहायता केंद्र से संपर्क करें।</Text>
          </View>
        </View>

        {/* Contact info */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>संपर्क करें</Text>
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={18} color="#2c5a73" />
            <Text style={styles.contactLink}>localguider07@gmail.com</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="call" size={18} color="#2c5a73" />
            <Text style={styles.contactLink}>+91 957109700</Text>
          </View>
        </View>

        {/* Accept Button */}
        <TouchableOpacity 
          style={styles.mainAcceptBtn} 
          onPress={() => setAcceptModalVisible(true)}
        >
          <Text style={styles.mainAcceptBtnText}>मैं शर्तों से सहमत हूँ</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal */}
      <Modal visible={acceptModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="document-text" size={50} color="#2c5a73" style={{ marginBottom: 15 }} />
            <Text style={styles.modalTitle}>नियम और शर्तें स्वीकार करें</Text>
            <Text style={styles.modalText}>
              स्वीकार करके, आप पुष्टि करते हैं कि आपने सभी नियमों और शर्तों को पढ़ और समझ लिया है।
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#f1f5f9' }]} 
                onPress={() => setAcceptModalVisible(false)}
              >
                <Text style={{ color: '#64748b', fontWeight: '700' }}>रद्द करें</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: '#2c5a73' }]} 
                onPress={handleAccept}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>स्वीकार करें</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  introCard: { backgroundColor: "#fff", margin: 16, padding: 20, borderRadius: 16, elevation: 2 },
  introTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 10 },
  introText: { fontSize: 14, color: "#64748b", lineHeight: 22 },
  sectionsCard: { backgroundColor: "#fff", marginHorizontal: 16, padding: 20, borderRadius: 16, elevation: 2 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 8 },
  sectionContent: { fontSize: 14, color: "#475569", lineHeight: 22 },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginTop: 15 },
  notesCard: { backgroundColor: "#e6f0f5", margin: 16, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#b8d4e3" },
  notesTitle: { fontSize: 16, fontWeight: "700", color: "#2c5a73", marginBottom: 12 },
  noteItem: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 },
  noteText: { flex: 1, fontSize: 13, color: "#1e293b", fontWeight: '500' },
  contactCard: { backgroundColor: "#fff", marginHorizontal: 16, padding: 20, borderRadius: 16, elevation: 2 },
  contactTitle: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 15 },
  contactItem: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 },
  contactLink: { fontSize: 14, color: "#2c5a73", fontWeight: "600" },
  mainAcceptBtn: { backgroundColor: "#2c5a73", margin: 20, padding: 16, borderRadius: 30, alignItems: 'center', elevation: 3 },
  mainAcceptBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 25, width: "90%", alignItems: "center" },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b", marginBottom: 10 },
  modalText: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 25, lineHeight: 20 },
  modalButtons: { flexDirection: "row", gap: 10, width: "100%" },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" }
});