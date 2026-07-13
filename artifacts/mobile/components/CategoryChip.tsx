import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { getFontFamily } from '@/constants/fonts';

interface CategoryChipProps {
  label: string;
  icon: string;
  iconColor: string;
  isSelected?: boolean;
  onPress: () => void;
  size?: 'sm' | 'md';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CategoryChip({
  label,
  icon,
  iconColor,
  isSelected = false,
  onPress,
  size = 'md',
}: CategoryChipProps) {
  const { isRTL } = useLanguage();
  const fontFam = getFontFamily(isRTL, 'medium');
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.95, { stiffness: 300, damping: 28 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { stiffness: 300, damping: 28 });
  }

  function handlePress() {
    Haptics.selectionAsync();
    onPress();
  }

  const isSm = size === 'sm';

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[
        styles.chip,
        isSm ? styles.chipSm : styles.chipMd,
        isSelected && styles.chipSelected,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          isSm ? styles.iconWrapSm : styles.iconWrapMd,
          { backgroundColor: isSelected ? iconColor : colors.light.cardSoft },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={isSm ? 14 : 20}
          color={isSelected ? '#fff' : iconColor}
        />
      </View>
      <Text
        style={[
          styles.label,
          isSm && styles.labelSm,
          { color: isSelected ? colors.light.foreground : colors.light.foreground, fontFamily: fontFam },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: colors.light.card,
    borderRadius: 999,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
    padding: 6,
  },
  chipMd: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chipSm: {
    paddingHorizontal: 12,
    gap: 6,
  },
  chipSelected: {
    backgroundColor: colors.light.primaryLight,
    shadowColor: colors.light.primaryMid,
  },
  iconWrap: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapMd: { width: 36, height: 36 },
  iconWrapSm: { width: 28, height: 28 },
  label: {
    fontSize: 13,
  },
  labelSm: { fontSize: 11 },
});
