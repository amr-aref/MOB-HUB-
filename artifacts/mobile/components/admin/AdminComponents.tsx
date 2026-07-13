import React, { useEffect, useState } from 'react';
import { Pressable, PressableProps, StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { getFontFamily } from '@/constants/fonts';

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const SPRING_CONFIG = { stiffness: 300, damping: 28 };

export function AnimatedPressable({
  children,
  style,
  onPress,
  ...props
}: PressableProps & { style?: StyleProp<ViewStyle> }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.97, SPRING_CONFIG);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_CONFIG);
      }}
      onPress={onPress}
      {...props}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Toggle({ value, onToggle, isRTL }: { value: boolean; onToggle: () => void; isRTL: boolean }) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 200, easing: EASE_OUT });
  }, [value]);

  const trackStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      progress.value,
      [0, 1],
      ['#ECE6D9', '#2FBE5C'] // border to accent-green
    );
    return { backgroundColor: bgColor };
  });

  const thumbStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: progress.value * (isRTL ? -18 : 18) }],
    };
  });

  return (
    <Pressable onPress={onToggle} style={{ width: 44, height: 26 }}>
      <Animated.View style={[styles.toggleTrack, trackStyle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Animated.View style={[styles.toggleThumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

export function ChartBar({ value, max, isToday, label, delay = 0, isRTL }: { value: number; max: number; isToday: boolean; label: string; delay?: number; isRTL: boolean }) {
  const heightProgress = useSharedValue(0);

  useEffect(() => {
    const targetHeight = max > 0 ? (value / max) * 100 : 0;
    heightProgress.value = withDelay(delay, withTiming(targetHeight, { duration: 600, easing: EASE_OUT }));
  }, [value, max]);

  const barStyle = useAnimatedStyle(() => ({
    height: `${heightProgress.value}%`,
  }));

  return (
    <View style={styles.chartBarContainer}>
      {isToday && (
        <Animated.View style={styles.chartTooltip}>
          <Text style={[styles.chartTooltipText, { fontFamily: getFontFamily(false, 'bold') }]}>{value}</Text>
        </Animated.View>
      )}
      <View style={styles.chartBarBg}>
        <Animated.View
          style={[
            styles.chartBarFill,
            { backgroundColor: isToday ? '#FF8A3D' : '#FDEEDD', borderRadius: isToday ? 6 : 4 },
            barStyle,
          ]}
        />
      </View>
      <Text style={[styles.chartLabel, { fontFamily: getFontFamily(isRTL, 'regular') }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: 'rgba(30, 25, 15, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartBarContainer: {
    alignItems: 'center',
    width: 28,
    height: '100%',
  },
  chartBarBg: {
    flex: 1,
    width: 12,
    justifyContent: 'flex-end',
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  chartBarFill: {
    width: '100%',
  },
  chartTooltip: {
    position: 'absolute',
    top: -24,
    backgroundColor: '#1B1B1D',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 10,
  },
  chartTooltipText: {
    fontSize: 10,
    color: '#fff',
  },
  chartLabel: {
    fontSize: 11,
    color: '#8A8782',
  },
});
