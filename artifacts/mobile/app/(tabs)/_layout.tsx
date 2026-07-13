import React from 'react';
import { Platform, StyleSheet, useColorScheme, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { getFontFamily } from '@/constants/fonts';

function TabIcon({ focused, name, label, isRTL }: { focused: boolean, name: any, label: string, isRTL: boolean }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(focused ? 1.05 : 1, { stiffness: 300, damping: 20 }) }],
      opacity: withSpring(focused ? 1 : 0.6),
    };
  });
  
  const fontFam = getFontFamily(isRTL, 'semiBold');

  return (
    <Animated.View style={[styles.tabItem, animatedStyle]}>
      <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
        <Ionicons name={name} size={22} color={focused ? '#fff' : colors.light.mutedForeground} />
      </View>
    </Animated.View>
  );
}

export default function TabLayout() {
  const { t, isRTL } = useLanguage();
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          isWeb && styles.tabBarWeb
        ],
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? 'home' : 'home-outline'} label={t('home')} isRTL={isRTL} />
          ),
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: t('stores'),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? 'search' : 'search-outline'} label={t('search')} isRTL={isRTL} />
          ),
        }}
      />
      <Tabs.Screen
        name="compare"
        options={{
          title: t('compare'),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? 'swap-horizontal' : 'swap-horizontal-outline'} label={t('compare')} isRTL={isRTL} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('favorites'),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? 'heart' : 'heart-outline'} label={t('favorites')} isRTL={isRTL} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name={focused ? 'person' : 'person-outline'} label={t('profile')} isRTL={isRTL} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 999,
    height: 64,
    borderWidth: 0,
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabBarWeb: {
    width: 400,
    left: '50%',
    transform: [{ translateX: -200 }],
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: 48,
    width: 48,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapFocused: {
    backgroundColor: colors.light.btnPrimaryBg,
  },
});
