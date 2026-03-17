import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LikeButton = ({ isLiked, onPress, size = 24, style }) => {
  return (
    <TouchableOpacity onPress={onPress} style={style}>
      <Ionicons
        name={isLiked ? 'heart' : 'heart-outline'}
        size={size}
        color={isLiked ? '#ef4444' : '#94a3b8'}
      />
    </TouchableOpacity>
  );
};

export default LikeButton;