import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PrivacyPolicy = ({ navigation }) => {
  
  const PolicySection = ({ title, content, icon }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={22} color="#2c5a73" style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={["#1e3c4f", "#2c5a73"]} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>गोपनीयता नीति</Text>
        <View style={{ width: 40 }} /> 
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            Local Guider में हम आपकी गोपनीयता (Privacy) का सम्मान करते हैं और आपकी व्यक्तिगत जानकारी को सुरक्षित रखने के लिए पूरी तरह प्रतिबद्ध हैं। यह नीति बताती है कि हम आपकी जानकारी कैसे एकत्र, उपयोग और सुरक्षित करते हैं।
          </Text>
        </View>

        <PolicySection 
          icon="person-add-outline"
          title="1. हम कौन सी जानकारी एकत्र करते हैं?"
          content="• व्यक्तिगत जानकारी: आपका नाम, ईमेल आईडी, फ़ोन नंबर और प्रोफाइल फोटो।&#10;• लोकेशन (स्थान): आपको अपने पास के बेहतरीन गाइड और फोटोग्राफर दिखाने के लिए हम आपकी जीपीएस लोकेशन का उपयोग करते हैं।&#10;• बुकिंग विवरण: आपकी यात्रा की तारीखें, स्थान और आपके द्वारा चुनी गई सेवाएँ।&#10;• डिवाइस जानकारी: आपके मोबाइल का मॉडल, ऑपरेटिंग सिस्टम और ऐप के उपयोग का तरीका।"
        />

        <PolicySection 
          icon="construct-outline"
          title="2. हम आपकी जानकारी का उपयोग कैसे करते हैं?"
          content="• आपको सही और सटीक बुकिंग सेवाएं प्रदान करने के लिए।&#10;• आपकी पहचान की पुष्टि करने और सुरक्षा सुनिश्चित करने के लिए।&#10;• आपको बुकिंग अपडेट, ऑफर और महत्वपूर्ण सूचनाएं भेजने के लिए।&#10;• ऐप की कार्यक्षमता और आपके अनुभव को बेहतर बनाने के लिए।"
        />

        <PolicySection 
          icon="share-social-outline"
          title="3. जानकारी साझा करना (Data Sharing)"
          content="• गाइड और फोटोग्राफर के साथ: बुकिंग सफल होने पर, हम आपका नाम और संपर्क नंबर आपके द्वारा चुने गए गाइड/फोटोग्राफर के साथ साझा करते हैं ताकि वे आपसे संपर्क कर सकें।&#10;• तीसरे पक्ष (Third Party): हम आपकी व्यक्तिगत जानकारी किसी को भी विज्ञापन के लिए बेचते नहीं हैं। हम केवल कानूनी आवश्यकताओं या भुगतान गेटवे (Payment Gateways) जैसे विश्वसनीय भागीदारों के साथ ही जानकारी साझा करते हैं।"
        />

        <PolicySection 
          icon="shield-checkmark-outline"
          title="4. डेटा सुरक्षा (Data Security)"
          content="हम आपकी जानकारी को सुरक्षित रखने के लिए एन्क्रिप्शन और सुरक्षित सर्वर जैसी आधुनिक तकनीकों का उपयोग करते हैं। हालांकि, इंटरनेट पर कोई भी डेटा पूरी तरह 100% सुरक्षित नहीं होता, इसलिए हम आपकी सावधानी की भी अपेक्षा करते हैं।"
        />

        <PolicySection 
          icon="options-outline"
          title="5. आपकी पसंद और नियंत्रण"
          content="• आप अपनी प्रोफाइल जानकारी को कभी भी ऐप की 'Settings' में जाकर बदल सकते हैं।&#10;• आप अपने मोबाइल की सेटिंग से लोकेशन एक्सेस (Location Access) को बंद कर सकते हैं, हालांकि इससे कुछ सेवाएं प्रभावित हो सकती हैं।"
        />

        <PolicySection 
          icon="browsers-outline"
          title="6. कुकीज़ (Cookies)"
          content="ऐप के बेहतर अनुभव के लिए हम कुकीज़ का उपयोग करते हैं जो आपके उपयोग के पैटर्न को समझने में हमारी मदद करती हैं।"
        />

        <PolicySection 
          icon="refresh-outline"
          title="7. इस नीति में बदलाव"
          content="हम समय-समय पर अपनी गोपनीयता नीति में बदलाव कर सकते हैं। किसी भी बड़े बदलाव की सूचना आपको ऐप के माध्यम से दी जाएगी।"
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>महत्वपूर्ण सूचना:</Text>
          <Text style={styles.infoText}>
            इस ऐप का उपयोग करके, आप हमारी इस गोपनीयता नीति की शर्तों से सहमत होते हैं।
          </Text>
        </View>

        {/* Contact Section */}
        <View style={styles.contactCard}>
          <Text style={styles.contactHeader}>संपर्क करें</Text>
          <Text style={styles.contactSub}>यदि आपके पास कोई सवाल है, तो कृपया हमें ईमेल करें:</Text>
          
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={18} color="#2c5a73" />
            <Text style={styles.contactText}>privacy@localguider.in</Text>
          </View>
          
          <View style={styles.contactItem}>
            <Ionicons name="location" size={18} color="#2c5a73" />
            <Text style={styles.contactText}>सीकर, राजस्थान, भारत</Text>
          </View>
        </View>

        <Text style={styles.footerVersion}>Version 1.0.2 • Last Updated: March 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingTop: 45, // Adjust for status bar
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  introText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    textAlign: 'justify',
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e3c4f',
  },
  sectionContent: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    paddingLeft: 32,
  },
  infoBox: {
    backgroundColor: '#E2E8F0',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2c5a73',
    marginVertical: 20,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e3c4f',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3c4f',
    marginBottom: 5,
  },
  contactSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#2c5a73',
    fontWeight: '500',
  },
  footerVersion: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 12,
    color: '#94a3b8',
  },
});

export default PrivacyPolicy;