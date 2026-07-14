import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import GlassSurface from './GlassSurface.web';
import colors from '@/constants/colors';

// Web build of GlassCard: renders the React Bits GlassSurface (real SVG-displacement
// backdrop-filter glass) instead of expo-blur's BlurView, which has weaker/no blur
// support on web. Metro picks this file automatically when bundling for web;
// native (iOS/Android) keeps using GlassCard.tsx (expo-blur) unchanged.
interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
  padding?: number;
}

export default function GlassCard({
  children,
  style,
  borderRadius = 22,
  padding = 16,
}: GlassCardProps) {
  return (
    <View style={[styles.container, { borderRadius }, style]}>
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={borderRadius}
        backgroundOpacity={0.5}
        blur={14}
        distortionScale={-60}
        redOffset={2}
        greenOffset={6}
        blueOffset={10}
        style={{ padding }}
      >
        {children}
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
});
