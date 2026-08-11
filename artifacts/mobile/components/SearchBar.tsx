import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { getFontFamily } from '@/constants/fonts';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  isRTL?: boolean;
}

export default function SearchBar({ value, onChangeText, onSubmit, placeholder, isRTL = false }: SearchBarProps) {
  const { isRTL: rtlContext } = useLanguage();
  const router = useRouter();
  const rtl = isRTL || rtlContext;
  const fontFam = getFontFamily(rtl, 'regular');
  const [isFocused, setIsFocused] = useState(false);

  const submit = () => {
    const query = value.trim();
    if (onSubmit) {
      onSubmit();
      return;
    }
    if (query) router.push({ pathname: '/products/search', params: { query } });
  };

  return (
    <View style={[styles.container, isFocused && styles.containerFocused, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      <BlurView intensity={24} tint="light" style={[StyleSheet.absoluteFill, styles.blurLayer]} />
      <Ionicons name="search-outline" size={19} color={colors.light.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.light.textTertiary}
        style={[styles.input, { textAlign: rtl ? 'right' : 'left', fontFamily: fontFam }]}
        returnKeyType="search"
        autoCorrect={false}
        onSubmitEditing={submit}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {value.length > 0 && (
        <Ionicons name="close-circle" size={18} color={colors.light.mutedForeground} onPress={() => onChangeText('')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 16,
    height: 48,
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#1E190F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  containerFocused: {
    borderColor: colors.light.primaryMid,
    shadowColor: colors.light.primary,
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  blurLayer: { borderRadius: 999 },
  input: { flex: 1, fontSize: 15, color: colors.light.foreground, padding: 0 },
});
