import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/apiClient';
import { API } from '../../api/endpoints';

export default function ReviewScreen({ navigation, route }) {
  const { appointmentId, providerId, providerType, providerName, serviceName } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Error', 'Please write a review comment');
      return;
    }

    try {
      setSubmitting(true);
      // Adjust the endpoint and parameters according to your backend
      const response = await api.post('/review/add', {
        appointmentId,
        [providerType === 'photographer' ? 'photographerId' : 'guiderId']: providerId,
        rating,
        comment,
      });

      if (response.data?.status) {
        Alert.alert('Success', 'Thank you for your review!');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#3c6178', '#3e728f', '#2c454e']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Review</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.providerName}>{providerName}</Text>
          <Text style={styles.serviceName}>{serviceName}</Text>
        </View>

        <Text style={styles.label}>Rate your experience</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={36}
                color={star <= rating ? '#FFD700' : '#CBD5E1'}
                style={styles.star}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Write your review</Text>
        <TextInput
          style={styles.input}
          placeholder="Share your experience with this guide..."
          placeholderTextColor="#94a3b8"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={submitReview}
          disabled={submitting}
        >
          <LinearGradient
            colors={['#2c5a73', '#1e3c4f']}
            style={styles.gradient}
          >
            <Text style={styles.submitBtnText}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  providerName: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  serviceName: { fontSize: 14, color: '#64748b' },
  label: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  star: { marginHorizontal: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1e293b',
    minHeight: 120,
    marginBottom: 24,
  },
  submitBtn: { borderRadius: 12, overflow: 'hidden' },
  submitBtnDisabled: { opacity: 0.6 },
  gradient: { paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});