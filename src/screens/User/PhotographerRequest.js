import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");
const BASE_URL = "https://localguider.sinfode.com";

// ✅ Allowed ID proof types from backend
const ID_PROOF_TYPES = [
  "Aadhaar",
  "PAN Card",
  "Voter ID",
  "Driving License",
  "Passport"
];

export default function PhotographerRequestScreen({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const getTokenFromStorage = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        setToken(storedToken);
        console.log("🔐 Token loaded:", storedToken ? "Yes" : "No");
      } catch (error) {
        console.error("Error loading token:", error);
      }
    };
    getTokenFromStorage();
  }, []);

  // ✅ Form state matches backend exactly
  const [form, setForm] = useState({
    userId: user?.id?.toString() || "",
    firmName: "",
    featuredImage: null,
    idProofFront: null,
    idProofBack: null,
    photograph: null,
    idProofType: "Aadhaar",
    description: "",
    phone: user?.phone || "",
    email: user?.email || "",
    placeId: "",
    places: "",
    address: "",
    services: [],
  });

  // ✅ Add service function
  const addService = () => {
    setForm(prev => ({
      ...prev,
      services: [
        ...prev.services,
        {
          title: "",
          description: "",
          servicePrice: "",
          image: null
        }
      ]
    }));
  };

  // ✅ Remove service function
  const removeService = (index) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  // ✅ Update service field
  const updateServiceField = (index, field, value) => {
    setForm(prev => {
      const newServices = [...prev.services];
      newServices[index][field] = value;
      return { ...prev, services: newServices };
    });
  };

  // ✅ Image picker
  const pickImage = async (field) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const image = result.assets[0];
        const imageData = {
          uri: image.uri,
          type: image.mimeType || 'image/jpeg',
          name: `${field}_${Date.now()}.jpg`,
        };
        setForm(prev => ({ ...prev, [field]: imageData }));
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // ✅ Service image picker
  const handleServiceImageSelect = async (index) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photo library.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const image = result.assets[0];
        const imageData = {
          uri: image.uri,
          type: image.mimeType || 'image/jpeg',
          name: `service_${Date.now()}_${index}.jpg`,
        };
        updateServiceField(index, 'image', imageData);
      }
    } catch (error) {
      console.error("Service image picker error:", error);
      Alert.alert("Error", "Failed to pick service image");
    }
  };

  // ✅ Create FormData
  const createFormData = () => {
    const formData = new FormData();
    
    const fields = {
      userId: form.userId,
      firmName: form.firmName,
      idProofType: form.idProofType,
      description: form.description,
      phone: form.phone,
      email: form.email,
      placeId: form.placeId,
      places: form.places,
      address: form.address,
    };

    Object.entries(fields).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    const addFile = (fieldName, file) => {
      if (file && file.uri) {
        const filename = file.uri.split('/').pop();
        formData.append(fieldName, {
          uri: file.uri,
          name: filename || `${fieldName}.jpg`,
          type: file.type || 'image/jpeg',
        });
      }
    };

    addFile("featuredImage", form.featuredImage);
    addFile("idProofFront", form.idProofFront);
    addFile("idProofBack", form.idProofBack);
    addFile("photograph", form.photograph);

    form.services.forEach((service, idx) => {
      formData.append(`services[${idx}][title]`, service.title || "");
      formData.append(`services[${idx}][description]`, service.description || "");
      formData.append(`services[${idx}][servicePrice]`, service.servicePrice || "");
      if (service.image) {
        addFile(`services[${idx}][image]`, service.image);
      }
    });

    return formData;
  };

  // ✅ Validation
  const validateForm = () => {
    if (!form.userId) {
      Alert.alert("Error", "User ID is required");
      return false;
    }
    if (!form.firmName.trim()) {
      Alert.alert("Error", "Studio/Company name is required");
      return false;
    }
    if (!form.idProofFront) {
      Alert.alert("Error", "ID Proof Front is required");
      return false;
    }
    if (!form.idProofBack) {
      Alert.alert("Error", "ID Proof Back is required");
      return false;
    }
    if (!form.photograph) {
      Alert.alert("Error", "Your photograph is required");
      return false;
    }
    if (!form.address.trim()) {
      Alert.alert("Error", "Address is required");
      return false;
    }
    if (!form.phone.trim()) {
      Alert.alert("Error", "Phone number is required");
      return false;
    }
    if (!form.placeId.trim()) {
      Alert.alert("Error", "Primary place ID is required");
      return false;
    }
    if (!form.places.trim()) {
      Alert.alert("Error", "Places information is required");
      return false;
    }
    if (!ID_PROOF_TYPES.includes(form.idProofType)) {
      Alert.alert("Error", "Invalid ID proof type");
      return false;
    }
    if (form.services.length === 0) {
      Alert.alert("Error", "At least one service is required");
      return false;
    }

    for (let i = 0; i < form.services.length; i++) {
      const service = form.services[i];
      if (!service.title.trim()) {
        Alert.alert("Error", `Service ${i + 1}: Title is required`);
        return false;
      }
      if (!service.description.trim()) {
        Alert.alert("Error", `Service ${i + 1}: Description is required`);
        return false;
      }
      if (!service.servicePrice || parseFloat(service.servicePrice) <= 0) {
        Alert.alert("Error", `Service ${i + 1}: Valid price is required`);
        return false;
      }
    }

    return true;
  };

  // ✅ Submit handler
  const handleSubmit = async () => {
    if (!token) {
      Alert.alert("Login Required", "Please login first to submit request.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const formData = createFormData();

      const response = await fetch(`${BASE_URL}/api/photographers/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      let responseData;
      try {
        const text = await response.text();
        responseData = text ? JSON.parse(text) : {};
      } catch {
        responseData = {};
      }

      if (response.ok && responseData.status === true) {
        setShowSuccessModal(true);
      } else {
        Alert.alert(
          "Submission Failed",
          responseData.message || "Unable to process your request."
        );
      }
    } catch (error) {
      console.error("❌ Submission error:", error.message);
      Alert.alert("Error", error.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Step Navigation
  const nextStep = () => {
    if (currentStep === 1) {
      if (!form.firmName || !form.phone || !form.address) {
        Alert.alert("Error", "Please fill all required fields");
        return;
      }
    }
    if (currentStep === 2) {
      if (!form.idProofFront || !form.idProofBack || !form.photograph) {
        Alert.alert("Error", "Please upload all required documents");
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // ✅ Render step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <View style={styles.stepWrapper}>
            <View style={[
              styles.stepCircle,
              currentStep >= step && styles.stepCircleActive,
              currentStep > step && styles.stepCircleCompleted
            ]}>
              {currentStep > step ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepText,
                  currentStep >= step && styles.stepTextActive
                ]}>{step}</Text>
              )}
            </View>
            <Text style={[
              styles.stepLabel,
              currentStep >= step && styles.stepLabelActive
            ]}>
              {step === 1 ? "Basic" : step === 2 ? "Docs" : step === 3 ? "Services" : "Review"}
            </Text>
          </View>
          {step < 4 && (
            <View style={[
              styles.stepLine,
              currentStep > step && styles.stepLineActive
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  // ✅ Render image preview
  const renderImagePreview = (image, label, field, required = false) => (
    <TouchableOpacity style={styles.imageUploadBox} onPress={() => pickImage(field)}>
      {image ? (
        <View style={styles.imagePreview}>
          <Image source={{ uri: image.uri }} style={styles.previewImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.imageGradient}
          >
            <View style={styles.imageInfo}>
              <Text style={styles.imageNameLight}>{label}{required ? ' *' : ''}</Text>
              <View style={styles.imageCheck}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.imageCheckText}>Uploaded</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      ) : (
        <View style={styles.uploadPlaceholder}>
          <View style={styles.uploadIconContainer}>
            <Ionicons name="cloud-upload-outline" size={32} color="#2c5a73" />
          </View>
          <Text style={styles.uploadLabel}>{label}{required ? ' *' : ''}</Text>
          <Text style={styles.uploadHint}>Tap to upload</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // ✅ Render service card
  const renderServiceCard = (service, index) => (
    <View key={index} style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceTitleContainer}>
          <View style={[styles.serviceNumberBadge, { backgroundColor: '#2c5a73' }]}>
            <Text style={styles.serviceNumberText}>{index + 1}</Text>
          </View>
          <Text style={styles.serviceTitle}>Photography Package</Text>
        </View>
        {form.services.length > 1 && (
          <TouchableOpacity onPress={() => removeService(index)} style={styles.removeServiceBtn}>
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.serviceInputGroup}>
        <Ionicons name="pricetag-outline" size={18} color="#2c5a73" style={styles.inputIcon} />
        <TextInput
          style={styles.serviceInput}
          placeholder="Package Title * (e.g., Wedding Photography)"
          placeholderTextColor="#94a3b8"
          value={service.title}
          onChangeText={(text) => updateServiceField(index, 'title', text)}
        />
      </View>

      <View style={styles.serviceInputGroup}>
        <Ionicons name="document-text-outline" size={18} color="#2c5a73" style={styles.inputIcon} />
        <TextInput
          style={[styles.serviceInput, styles.serviceTextArea]}
          placeholder="Description * (What's included?)"
          placeholderTextColor="#94a3b8"
          value={service.description}
          onChangeText={(text) => updateServiceField(index, 'description', text)}
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.serviceRow}>
        <View style={[styles.serviceInputGroup, { flex: 1, marginRight: 8 }]}>
          <Ionicons name="cash-outline" size={18} color="#2c5a73" style={styles.inputIcon} />
          <TextInput
            style={styles.serviceInput}
            placeholder="Price *"
            placeholderTextColor="#94a3b8"
            value={service.servicePrice}
            onChangeText={(text) => updateServiceField(index, 'servicePrice', text)}
            keyboardType="number-pad"
          />
        </View>

        <TouchableOpacity 
          style={styles.serviceImageBtn}
          onPress={() => handleServiceImageSelect(index)}
        >
          {service.image ? (
            <View style={styles.serviceImageSelected}>
              <Image source={{ uri: service.image.uri }} style={styles.serviceImageThumb} />
              <View style={styles.serviceImageCheck}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              </View>
            </View>
          ) : (
            <View style={styles.serviceImagePlaceholder}>
              <Ionicons name="image-outline" size={18} color="#94a3b8" />
              <Text style={styles.serviceImagePlaceholderText}>Photo</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // ✅ Success Modal
  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.successIconContainer}>
            <LinearGradient
              colors={['#2c5a73', '#1e3c4f']}
              style={styles.successIcon}
            >
              <Ionicons name="checkmark" size={40} color="#fff" />
            </LinearGradient>
          </View>
          
          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successText}>
            Your photographer application has been submitted successfully. We'll review your portfolio and documents within 24-48 hours.
          </Text>

          <View style={styles.successFeatures}>
            <View style={styles.successFeature}>
              <Ionicons name="time-outline" size={20} color="#2c5a73" />
              <Text style={styles.successFeatureText}>Review in 24-48 hours</Text>
            </View>
            <View style={styles.successFeature}>
              <Ionicons name="notifications-outline" size={20} color="#2c5a73" />
              <Text style={styles.successFeatureText}>Get notified on approval</Text>
            </View>
            <View style={styles.successFeature}>
              <Ionicons name="camera-outline" size={20} color="#2c5a73" />
              <Text style={styles.successFeatureText}>Start booking clients</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => {
              setShowSuccessModal(false);
              navigation.goBack();
            }}
          >
            <LinearGradient
              colors={['#2c5a73', '#1e3c4f']}
              style={styles.successBtnGradient}
            >
              <Text style={styles.successBtnText}>Got it, Thanks!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header with Gradient - Consistent Theme */}
      <LinearGradient
        colors={['#1e3c4f', '#2c5a73', '#3b7a8f']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Become a Photographer</Text>
          <Text style={styles.subtitle}>Share your photography skills</Text>
        </View>
      </LinearGradient>

      {/* Step Indicator */}
      {renderStepIndicator()}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepCardTitle}>Basic Information</Text>
              <Text style={styles.stepCardSubtitle}>Tell us about your photography business</Text>

              <View style={styles.inputGroup}>
                <Ionicons name="business-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Studio/Company Name *"
                  placeholderTextColor="#94a3b8"
                  value={form.firmName}
                  onChangeText={(text) => setForm({...form, firmName: text})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Ionicons name="document-text-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description * (Tell about your photography style and experience)"
                  placeholderTextColor="#94a3b8"
                  value={form.description}
                  onChangeText={(text) => setForm({...form, description: text})}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Ionicons name="call-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone *"
                    placeholderTextColor="#94a3b8"
                    value={form.phone}
                    onChangeText={(text) => setForm({...form, phone: text})}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Ionicons name="mail-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#94a3b8"
                    value={form.email}
                    onChangeText={(text) => setForm({...form, email: text})}
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Ionicons name="location-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Full Address *"
                  placeholderTextColor="#94a3b8"
                  value={form.address}
                  onChangeText={(text) => setForm({...form, address: text})}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.locationRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Ionicons name="map-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Place ID *"
                    placeholderTextColor="#94a3b8"
                    value={form.placeId}
                    onChangeText={(text) => setForm({...form, placeId: text})}
                    keyboardType="number-pad"
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Ionicons name="grid-outline" size={20} color="#2c5a73" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Other Places"
                    placeholderTextColor="#94a3b8"
                    value={form.places}
                    onChangeText={(text) => setForm({...form, places: text})}
                  />
                </View>
              </View>

              <Text style={styles.hintText}>
                <Ionicons name="information-circle" size={14} color="#64748b" /> Enter place IDs separated by commas
              </Text>
            </View>
          )}

          {/* Step 2: Documents */}
          {currentStep === 2 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepCardTitle}>Identity Documents</Text>
              <Text style={styles.stepCardSubtitle}>Upload your ID proofs for verification</Text>

              <Text style={styles.label}>ID Proof Type *</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.idTypeScroll}
              >
                {ID_PROOF_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.idTypeChip,
                      form.idProofType === type && styles.idTypeChipActive
                    ]}
                    onPress={() => setForm({...form, idProofType: type})}
                  >
                    <Text style={[
                      styles.idTypeChipText,
                      form.idTypeProofType === type && styles.idTypeChipTextActive
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.documentsGrid}>
                <View style={styles.docRow}>
                  <View style={styles.docColumn}>
                    {renderImagePreview(form.idProofFront, "ID Front", "idProofFront", true)}
                  </View>
                  <View style={styles.docColumn}>
                    {renderImagePreview(form.idProofBack, "ID Back", "idProofBack", true)}
                  </View>
                </View>
                <View style={styles.docRow}>
                  <View style={styles.docColumn}>
                    {renderImagePreview(form.photograph, "Your Photo", "photograph", true)}
                  </View>
                  <View style={styles.docColumn}>
                    {renderImagePreview(form.featuredImage, "Portfolio", "featuredImage", false)}
                  </View>
                </View>
              </View>

              <Text style={styles.hintText}>
                <Ionicons name="alert-circle" size={14} color="#F59E0B" /> Upload clear, readable images
              </Text>
            </View>
          )}

          {/* Step 3: Services */}
          {currentStep === 3 && (
            <View style={styles.stepCard}>
              <View style={styles.serviceHeaderRow}>
                <View>
                  <Text style={styles.stepCardTitle}>Photography Packages</Text>
                  <Text style={styles.stepCardSubtitle}>Add your photography services</Text>
                </View>
                <TouchableOpacity onPress={addService} style={[styles.addServiceBtn, { backgroundColor: '#2c5a73' }]}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addServiceBtnText}>Add Package</Text>
                </TouchableOpacity>
              </View>

              {form.services.length === 0 ? (
                <View style={styles.emptyServices}>
                  <Ionicons name="camera-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyServicesTitle}>No Packages Added</Text>
                  <Text style={styles.emptyServicesText}>
                    Add at least one photography package to continue
                  </Text>
                  <TouchableOpacity style={[styles.emptyServicesBtn, { backgroundColor: '#2c5a73' }]} onPress={addService}>
                    <Text style={styles.emptyServicesBtnText}>Add First Package</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                form.services.map((service, idx) => renderServiceCard(service, idx))
              )}
            </View>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <View style={styles.stepCard}>
              <Text style={styles.stepCardTitle}>Review Application</Text>
              <Text style={styles.stepCardSubtitle}>Please review your information</Text>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Basic Information</Text>
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Studio Name</Text>
                  <Text style={styles.reviewValue}>{form.firmName}</Text>
                </View>
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Phone</Text>
                  <Text style={styles.reviewValue}>{form.phone}</Text>
                </View>
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Email</Text>
                  <Text style={styles.reviewValue}>{form.email || 'Not provided'}</Text>
                </View>
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Address</Text>
                  <Text style={styles.reviewValue}>{form.address}</Text>
                </View>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Documents</Text>
                <View style={styles.reviewDocs}>
                  <View style={styles.reviewDocItem}>
                    <Ionicons name="document-text" size={20} color="#2c5a73" />
                    <Text style={styles.reviewDocText}>ID Proof</Text>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  </View>
                  <View style={styles.reviewDocItem}>
                    <Ionicons name="camera" size={20} color="#2c5a73" />
                    <Text style={styles.reviewDocText}>Photograph</Text>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  </View>
                </View>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Packages ({form.services.length})</Text>
                {form.services.map((service, idx) => (
                  <View key={idx} style={styles.reviewService}>
                    <Text style={styles.reviewServiceTitle}>{service.title}</Text>
                    <Text style={[styles.reviewServicePrice, { color: '#2c5a73' }]}>₹{service.servicePrice}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.termsBox}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#2c5a73" />
                <Text style={styles.termsText}>
                  By submitting, you agree to our terms and confirm that all information is accurate
                </Text>
              </View>
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
                <Ionicons name="arrow-back" size={20} color="#64748b" />
                <Text style={styles.prevButtonText}>Back</Text>
              </TouchableOpacity>
            )}
            
            {currentStep < 4 ? (
              <TouchableOpacity 
                style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull, { backgroundColor: '#2c5a73' }]} 
                onPress={nextStep}
              >
                <Text style={styles.nextButtonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.submitButtonDisabled, { backgroundColor: '#2c5a73' }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Submit Application</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal */}
      {renderSuccessModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  
  // Step Indicator
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stepWrapper: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  stepCircleActive: {
    backgroundColor: '#2c5a73',
    borderColor: '#2c5a73',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  stepTextActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  stepLabelActive: {
    color: '#2c5a73',
    fontWeight: '500',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#10B981',
  },

  // Step Cards
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  stepCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  stepCardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
  },

  // Input Styles
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputIcon: {
    marginRight: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Document Upload
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  idTypeScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  idTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  idTypeChipActive: {
    backgroundColor: '#2c5a73',
    borderColor: '#2c5a73',
  },
  idTypeChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  idTypeChipTextActive: {
    color: '#fff',
  },
  documentsGrid: {
    marginTop: 8,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  docColumn: {
    width: '48%',
  },
  imageUploadBox: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  imagePreview: {
    height: 110,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  imageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageNameLight: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  imageCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  imageCheckText: {
    fontSize: 9,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 2,
  },
  uploadPlaceholder: {
    height: 110,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  uploadIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f0f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  uploadLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadHint: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },

  // Services
  serviceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addServiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
  },
  addServiceBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyServices: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
  },
  emptyServicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyServicesText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyServicesBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  emptyServicesBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  serviceCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  serviceNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  removeServiceBtn: {
    padding: 4,
  },
  serviceInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  serviceInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1e293b',
  },
  serviceTextArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceImageBtn: {
    width: 70,
    height: 45,
    borderRadius: 8,
    overflow: 'hidden',
  },
  serviceImageSelected: {
    flex: 1,
    position: 'relative',
  },
  serviceImageThumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  serviceImageCheck: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  serviceImagePlaceholder: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  serviceImagePlaceholderText: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },

  // Review Section
  reviewSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  reviewSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  reviewLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  reviewValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e293b',
  },
  reviewDocs: {
    gap: 6,
  },
  reviewDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
  },
  reviewDocText: {
    flex: 1,
    fontSize: 12,
    color: '#1e293b',
    marginLeft: 8,
  },
  reviewService: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  reviewServiceTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1e293b',
  },
  reviewServicePrice: {
    fontSize: 12,
    fontWeight: '600',
  },
  termsBox: {
    flexDirection: 'row',
    backgroundColor: '#e6f0f5',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    color: '#1e293b',
    lineHeight: 16,
  },

  // Navigation Buttons
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 20,
  },
  prevButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  prevButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginRight: 6,
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },

  // Success Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  successFeatures: {
    width: '100%',
    marginBottom: 20,
  },
  successFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
  },
  successFeatureText: {
    fontSize: 12,
    color: '#1e293b',
    marginLeft: 10,
  },
  successBtn: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  successBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  successBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});