import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext'; // adjust path if needed

const LikesContext = createContext();
const LIKES_STORAGE_KEY = 'user_likes'; // use the same key as your custom hook

export const LikesProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [likesMap, setLikesMap] = useState({}); // { userId: { "place-123": item, ... } }
  const [loading, setLoading] = useState(true);

  // Load all likes from storage
  useEffect(() => {
    const loadLikes = async () => {
      try {
        const stored = await AsyncStorage.getItem(LIKES_STORAGE_KEY);
        if (stored) setLikesMap(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load likes:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLikes();
  }, []);

  // Save to storage whenever likesMap changes
  useEffect(() => {
    const saveLikes = async () => {
      try {
        await AsyncStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likesMap));
      } catch (error) {
        console.error('Failed to save likes:', error);
      }
    };
    saveLikes();
  }, [likesMap]);

  // Get current user's likes as an array (what LikedScreen expects)
  const userLikesArray = user?.id ? Object.values(likesMap[user.id] || {}) : [];

  const toggleLike = (item, type) => {
    if (!user?.id) return;

    setLikesMap(prev => {
      const userLikes = prev[user.id] || {};
      const key = `${type}-${item.id}`;
      const newUserLikes = { ...userLikes };

      if (newUserLikes[key]) {
        delete newUserLikes[key];
      } else {
        newUserLikes[key] = {
          id: item.id,
          type,
          name: item.name || item.firmName || item.placeName || 'Unknown',
          image: item.featuredImage || item.photograph || item.profileImage || null,
          rating: item.rating || 0,
          location: item.city || item.state || item.placeName || '',
        };
      }

      return {
        ...prev,
        [user.id]: newUserLikes,
      };
    });
  };

  const isLiked = (id, type) => {
    if (!user?.id) return false;
    const userLikes = likesMap[user.id] || {};
    return !!userLikes[`${type}-${id}`];
  };

  return (
    <LikesContext.Provider value={{
      likes: userLikesArray,      // ✅ array, matches custom hook
      loading,                    // ✅ loading state
      toggleLike,
      isLiked,
    }}>
      {children}
    </LikesContext.Provider>
  );
};

export const useLikes = () => {
  const context = useContext(LikesContext);
  if (!context) throw new Error('useLikes must be used within LikesProvider');
  return context;
};