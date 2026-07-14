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
      <Ionicons name="search-outline" size={20} color="#9E9BA4" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(120, 115, 105, 0.7)"
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
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 999,
    borderWidth: 0,
    paddingHorizontal: 16,
    height: 48,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#1E190F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
