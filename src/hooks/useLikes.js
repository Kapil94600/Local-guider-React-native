import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const LIKES_STORAGE_KEY = 'user_likes';

export const useLikes = () => {
  const { user } = useContext(AuthContext);
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLikes([]);
      setLoading(false);
      return;
    }
    loadLikes();
  }, [user?.id]);

  const loadLikes = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem(LIKES_STORAGE_KEY);
      const allLikes = stored ? JSON.parse(stored) : {};
      const userLikes = allLikes[user.id] || [];
      setLikes(userLikes);
    } catch (error) {
      console.error('Failed to load likes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLikes = async (newLikes) => {
    try {
      const stored = await AsyncStorage.getItem(LIKES_STORAGE_KEY);
      const allLikes = stored ? JSON.parse(stored) : {};
      allLikes[user.id] = newLikes;
      await AsyncStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(allLikes));
      setLikes(newLikes);
    } catch (error) {
      console.error('Failed to save likes:', error);
    }
  };

  const toggleLike = useCallback((item, type) => {
    if (!user?.id) return;
    const existingIndex = likes.findIndex(l => l.id === item.id && l.type === type);
    let newLikes;
    if (existingIndex >= 0) {
      newLikes = likes.filter((_, i) => i !== existingIndex);
    } else {
      const likeItem = {
        id: item.id,
        type,
        name: item.firmName || item.name || item.placeName || 'Unknown',
        image: item.featuredImage || item.photograph || item.profileImage || null,
        rating: item.rating || 0,
        location: item.city || item.state || item.placeName || '',
      };
      newLikes = [...likes, likeItem];
    }
    saveLikes(newLikes);
  }, [likes, user?.id]);

  const isLiked = useCallback((id, type) => {
    return likes.some(l => l.id === id && l.type === type);
  }, [likes]);

  return { likes, loading, toggleLike, isLiked };
};