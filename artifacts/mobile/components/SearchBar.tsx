import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { getFontFamily } from '@/constants/fonts';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  isRTL?: boolean;
}

export default function SearchBar({ value, onChangeText, placeholder, isRTL = false }: SearchBarProps) {
  const { isRTL: rtlContext } = useLanguage();
  const rtl = isRTL || rtlContext;
  const fontFam = getFontFamily(rtl, 'regular');

  const inputStyle = [
    styles.input,
    { textAlign: rtl ? 'right' as const : 'left' as const, fontFamily: fontFam },
  ];

  return (
    <View style={[styles.container, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
      <Ionicons name="search-outline" size={20} color={colors.light.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.light.textTertiary}
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
      <View style={[styles.actionIcons, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
        <Ionicons name="mic-outline" size={20} color={colors.light.mutedForeground} style={{ marginHorizontal: 6 }} />
        <Ionicons name="camera-outline" size={20} color={colors.light.mutedForeground} style={{ marginHorizontal: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(251, 250, 247, 0.85)',
    borderRadius: 999,
    borderWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 10,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.light.foreground,
    padding: 0,
  },
  actionIcons: {
    alignItems: 'center',
  }
});
