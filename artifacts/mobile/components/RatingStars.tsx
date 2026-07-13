import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

interface RatingStarsProps {
  rating: number;
  reviewsCount?: number;
  size?: number;
  showCount?: boolean;
}

export default function RatingStars({
  rating,
  reviewsCount,
  size = 14,
  showCount = true,
}: RatingStarsProps) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (rating >= i + 1) return 'star';
    if (rating >= i + 0.5) return 'star-half';
    return 'star-outline';
  });

  return (
    <View style={styles.row}>
      {stars.map((name, i) => (
        <Ionicons
          key={i}
          name={name as 'star' | 'star-half' | 'star-outline'}
          size={size}
          color={colors.light.star}
        />
      ))}
      {showCount && reviewsCount !== undefined && (
        <Text style={[styles.count, { fontSize: size - 2 }]}>
          {' '}({reviewsCount.toLocaleString()})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    color: colors.light.mutedForeground,
  },
});
