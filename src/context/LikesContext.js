import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LikesContext = createContext();

const LIKES_STORAGE_KEY = '@user_likes';

export const LikesProvider = ({ children }) => {
  const [likes, setLikes] = useState({}); // { "place-123": { id, type, name, image }, ... }

  // Load likes from AsyncStorage on mount
  useEffect(() => {
    const loadLikes = async () => {
      try {
        const stored = await AsyncStorage.getItem(LIKES_STORAGE_KEY);
        if (stored) {
          setLikes(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load likes:', error);
      }
    };
    loadLikes();
  }, []);

  // Save likes to AsyncStorage whenever they change
  useEffect(() => {
    const saveLikes = async () => {
      try {
        await AsyncStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likes));
      } catch (error) {
        console.error('Failed to save likes:', error);
      }
    };
    saveLikes();
  }, [likes]);

  const toggleLike = (item, type) => {
    const key = `${type}-${item.id}`;
    setLikes(prev => {
      const newLikes = { ...prev };
      if (newLikes[key]) {
        delete newLikes[key];
      } else {
        newLikes[key] = {
          id: item.id,
          type,
          name: item.name || item.firmName || item.placeName,
          image: item.featuredImage || item.photograph || item.profileImage,
          // store any other fields needed for the Liked screen
        };
      }
      return newLikes;
    });
  };

  const isLiked = (id, type) => {
    const key = `${type}-${id}`;
    return !!likes[key];
  };

  const getAllLikes = () => Object.values(likes);

  return (
    <LikesContext.Provider value={{ likes, toggleLike, isLiked, getAllLikes }}>
      {children}
    </LikesContext.Provider>
  );
};

export const useLikes = () => {
  const context = useContext(LikesContext);
  if (!context) {
    throw new Error('useLikes must be used within a LikesProvider');
  }
  return context;
};