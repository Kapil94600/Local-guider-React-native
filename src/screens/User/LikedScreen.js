import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../context/AuthContext';
import { useLikes } from '../../context/LikesContext';
import LikeButton from '../../components/LikeButton';

const BASE_URL = 'https://localguider.sinfode.com';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  try {
    const filename = path.split('/').pop();
    return `${BASE_URL}/api/image/download/${filename}`;
  } catch {
    return null;
  }
};

const EmptyState = ({ message }) => (
  <View style={styles.emptyContainer}>
    <Ionicons name="heart-outline" size={60} color="#cbd5e1" />
    <Text style={styles.emptyTitle}>No favorites yet</Text>
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

export default function LikedScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { likes, toggleLike, loading, isLiked } = useLikes();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const onRefresh = async () => {
    setRefreshing(true);
    // useLikes already handles data, but we can force a reload if needed
    setRefreshing(false);
  };

  const filteredLikes = likes.filter(item => {
    if (activeTab === 'all') return true;
    return item.type === activeTab.slice(0, -1); // 'places' -> 'place'
  });

  const renderItem = ({ item }) => {
    const imageUrl = item.image ? getImageUrl(item.image) : null;
    let icon;
    if (item.type === 'place') icon = 'location-outline';
    else if (item.type === 'guider') icon = 'people-outline';
    else icon = 'camera-outline';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          if (item.type === 'place')
            navigation.navigate('PlaceDetails', { placeId: item.id });
          else if (item.type === 'guider')
            navigation.navigate('ProfessionalDetails', {
              professionalId: item.id,
              professionalType: 'guider',
            });
          else
            navigation.navigate('ProfessionalDetails', {
              professionalId: item.id,
              professionalType: 'photographer',
            });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cardImage} />
          ) : (
            <LinearGradient colors={['#2c5a73', '#1e3c4f']} style={styles.cardImagePlaceholder}>
              <Ionicons name={icon} size={30} color="#fff" />
            </LinearGradient>
          )}
          <LikeButton
            isLiked={isLiked(item.id, item.type)}
            onPress={() => toggleLike(item, item.type)}
            style={styles.cardLikeButton}
            size={20}
          />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          {item.location ? (
            <View style={styles.cardLocation}>
              <Ionicons name="location-outline" size={12} color="#64748b" />
              <Text style={styles.cardLocationText} numberOfLines={1}>{item.location}</Text>
            </View>
          ) : null}
          {item.rating ? (
            <View style={styles.cardRating}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.cardRatingText}>{item.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1e3c4f', '#2c5a73']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favorites</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <EmptyState message="Login to see your favorites" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1e3c4f', '#2c5a73']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favorites</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['all', 'places', 'guiders', 'photographers'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'all' ? 'All' : tab === 'guiders' ? 'Guides' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5a73" />
        </View>
      ) : filteredLikes.length === 0 ? (
        <EmptyState message={`No ${activeTab === 'all' ? '' : activeTab} favorites yet`} />
      ) : (
        <FlatList
          data={filteredLikes}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2c5a73']} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 46,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
 tabContainer: {
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#fff',
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#e2e8f0',
  gap: 8,
},
tab: {
  paddingVertical: 6,
  paddingHorizontal: 16,
  borderRadius: 20,
},
activeTab: {
  backgroundColor: '#2c5a73',
},
tabText: {
  fontSize: 13,
  fontWeight: '500',
  color: '#64748b',
  textAlign: 'center',
},
activeTabText: {
  color: '#fff',
},

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardLikeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 4,
    zIndex: 10,
  },
  cardInfo: {
    padding: 10,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardLocationText: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 4,
  },
  cardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardRatingText: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});