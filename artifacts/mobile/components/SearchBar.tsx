import React from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import colors from '@/constants/colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isRTL?: boolean;
}

export default function SearchBar({ value, onChangeText, placeholder, isRTL = false }: SearchBarProps) {
  const inputStyle = [
    styles.input,
    { textAlign: isRTL ? 'right' as const : 'left' as const },
  ];

  const inner = (
    <View style={[styles.innerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Ionicons name="search-outline" size={18} color={colors.light.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.light.mutedForeground}
        style={inputStyle}
        returnKeyType="search"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Ionicons
          name="close-circle"
          size={18}
          color={colors.light.mutedForeground}
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={60} tint="light" style={styles.blur}>
        <View style={styles.glassOverlay}>{inner}</View>
      </BlurView>
    );
  }

  return <View style={styles.fallback}>{inner}</View>;
}

const styles = StyleSheet.create({
  blur: {
    borderRadius: colors.radiusFull,
    overflow: 'hidden',
  },
  glassOverlay: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1.5,
    borderColor: colors.light.glassBorder,
    borderRadius: colors.radiusFull,
  },
  fallback: {
    backgroundColor: '#fff',
    borderRadius: colors.radiusFull,
    borderWidth: 1.5,
    borderColor: colors.light.border,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.light.foreground,
    padding: 0,
    fontFamily: 'Inter_400Regular',
  },
});
