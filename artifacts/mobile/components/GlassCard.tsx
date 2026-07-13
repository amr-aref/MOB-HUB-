import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import colors from '@/constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
  padding?: number;
  onPress?: never;
}

export default function GlassCard({
  children,
  style,
  intensity = 60,
  borderRadius = colors.radius,
  padding,
}: GlassCardProps) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensity}
        tint="light"
        style={[styles.blur, { borderRadius }, style]}
      >
        <View style={[styles.glassOverlay, { borderRadius }, padding !== undefined ? { padding } : null]}>
          {children}
        </View>
      </BlurView>
    );
  }

  // Android / Web fallback
  return (
    <View style={[styles.androidCard, { borderRadius }, style, padding !== undefined ? { padding } : null]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  blur: {
    overflow: 'hidden',
  },
  glassOverlay: {
    backgroundColor: colors.light.glass,
    borderWidth: 1,
    borderColor: colors.light.glassBorder,
  },
  androidCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.light.border,
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
});
