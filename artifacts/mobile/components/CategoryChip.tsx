import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';

interface CategoryChipProps {
  label: string;
  icon: string;
  iconColor: string;
  isSelected?: boolean;
  onPress: () => void;
  size?: 'sm' | 'md';
}

export default function CategoryChip({
  label,
  icon,
  iconColor,
  isSelected = false,
  onPress,
  size = 'md',
}: CategoryChipProps) {
  function handle() {
    Haptics.selectionAsync();
    onPress();
  }

  const isSm = size === 'sm';

  return (
    <Pressable
      onPress={handle}
      style={({ pressed }) => [
        styles.chip,
        isSm ? styles.chipSm : styles.chipMd,
        isSelected && styles.chipSelected,
        { borderColor: isSelected ? iconColor : colors.light.border },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          isSm ? styles.iconWrapSm : styles.iconWrapMd,
          { backgroundColor: isSelected ? iconColor : iconColor + '18' },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={isSm ? 14 : 18}
          color={isSelected ? '#fff' : iconColor}
        />
      </View>
      <Text
        style={[
          styles.label,
          isSm && styles.labelSm,
          { color: isSelected ? iconColor : colors.light.foreground },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1.5,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  chipMd: {
    width: 78,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  chipSm: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
  iconWrap: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapMd: { width: 40, height: 40 },
  iconWrapSm: { width: 26, height: 26, borderRadius: 8 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  labelSm: { fontSize: 12 },
});
