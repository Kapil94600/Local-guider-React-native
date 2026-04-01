import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function HelpSupport({ navigation }) {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Updated FAQ Data in Hindi
  const faqData = [
    {
      id: 1,
      question: "1. Local Guider ऐप क्या है?",
      answer: "Local Guider एक ऐसा प्लेटफॉर्म है जो यात्रियों (Travelers) को स्थानीय विशेषज्ञों (Guides) और फोटोग्राफरों से जोड़ता है, ताकि आपकी यात्रा अधिक जानकारीपूर्ण और यादगार बन सके।",
      category: "general",
    },
    {
      id: 2,
      question: "2. मैं गाइड कैसे बुक कर सकता हूँ?",
      answer: "ऐप खोलें, अपना गंतव्य (Destination) चुनें, उपलब्ध गाइड्स की प्रोफाइल देखें और अपनी पसंद के अनुसार 'Book Now' बटन पर क्लिक करें।",
      category: "booking",
    },
    {
      id: 3,
      question: "3. क्या गाइड और फोटोग्राफर भरोसेमंद हैं?",
      answer: "हाँ, हम हर गाइड और फोटोग्राफर के दस्तावेजों की जाँच (Verification) करते हैं। आप बुकिंग करने से पहले अन्य यात्रियों द्वारा दिए गए रिव्यूज और रेटिंग्स भी देख सकते हैं।",
      category: "safety",
    },
    {
      id: 4,
      question: "4. भुगतान (Payment) कैसे करें?",
      answer: "आप ऐप के भीतर ही सुरक्षित रूप से UPI, क्रेडिट/डेबिट कार्ड या नेट बैंकिंग के माध्यम से भुगतान कर सकते हैं।",
      category: "payment",
    },
    {
      id: 5,
      question: "5. क्या मुझे गाइड के साथ फोटोग्राफर भी मिलेगा?",
      answer: "आप अपनी जरूरत के अनुसार केवल गाइड, केवल फोटोग्राफर या दोनों को एक साथ बुक कर सकते हैं।",
      category: "booking",
    },
    {
      id: 6,
      question: "6. अगर गाइड समय पर न आए तो क्या करें?",
      answer: "ऐसी स्थिति में आप तुरंत ऐप के 'Support' सेक्शन में जाकर हमसे संपर्क कर सकते हैं या हमारे हेल्पलाइन नंबर पर कॉल कर सकते हैं। हम आपकी पूरी सहायता करेंगे।",
      category: "safety",
    },
    {
      id: 7,
      question: "7. क्या मैं खुद भी एक 'Local Guider' बन सकता हूँ?",
      answer: "बिल्कुल! यदि आप अपने शहर को अच्छे से जानते हैं, तो आप ऐप में 'Register as a Guide' सेक्शन में जाकर आवेदन कर सकते हैं। हमारी टीम आपसे संपर्क करेगी।",
      category: "account",
    },
  ];

  const categories = [
    { id: "all", label: "सभी (All)" },
    { id: "general", label: "सामान्य" },
    { id: "booking", label: "बुकिंग" },
    { id: "payment", label: "भुगतान" },
    { id: "safety", label: "सुरक्षा" },
  ];

  const filteredFaqs = selectedCategory === "all" 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory);

  const FAQItem = ({ item, isExpanded, onToggle }) => (
    <TouchableOpacity style={styles.faqItem} onPress={onToggle} activeOpacity={0.7}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#2c5a73" 
        />
      </View>
      {isExpanded && (
        <View style={styles.faqAnswerContainer}>
          <Text style={styles.faqAnswer}>{item.answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>अक्सर पूछे जाने वाले सवाल</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.contentPadding}>
          <Text style={styles.sectionHeading}>FAQs</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipSelected]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredFaqs.map(faq => (
            <FAQItem
              key={faq.id}
              item={faq}
              isExpanded={expandedFaq === faq.id}
              onToggle={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
            />
          ))}

          <View style={styles.moreHelpCard}>
             <Text style={styles.moreHelpTitle}>कुछ और मदद चाहिए?</Text>
             <Text style={styles.moreHelpSub}>यदि आपके सवाल का जवाब यहाँ नहीं है, तो हमें ईमेल करें:</Text>
             <Text style={styles.supportEmail}>support@localguider.in</Text>
          </View>
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
    marginBottom: 10,
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  contentPadding: { padding: 20 },
  sectionHeading: { fontSize: 22, fontWeight: '700', color: '#1e293b', marginBottom: 15 },
  catScroll: { marginBottom: 15 },
  categoryChip: { 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: "#fff", 
    marginRight: 8, 
    borderWidth: 1, 
    borderColor: '#e2e8f0' 
  },
  categoryChipSelected: { backgroundColor: "#2c5a73", borderColor: '#2c5a73' },
  categoryChipText: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  categoryChipTextSelected: { color: "#fff" },
  faqItem: { 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 10, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  faqQuestion: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1e293b", lineHeight: 22 },
  faqAnswerContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  faqAnswer: { fontSize: 14, color: "#64748b", lineHeight: 22 },
  moreHelpCard: { 
    marginTop: 30, 
    padding: 25, 
    backgroundColor: '#e6f0f5', 
    borderRadius: 20, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1e2eb'
  },
  moreHelpTitle: { fontSize: 16, fontWeight: '700', color: '#2c5a73', marginBottom: 5 },
  moreHelpSub: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  supportEmail: { fontSize: 16, fontWeight: '700', color: '#1e3c4f', marginTop: 8 },
});