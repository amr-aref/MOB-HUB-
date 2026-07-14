import React from 'react';
import { Platform, StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { getFontFamily } from '@/constants/fonts';
import { useLayout } from '@/hooks/useLayout';

function TabIcon({ focused, name, label, isRTL }: { focused: boolean, name: any, label: string, isRTL: boolean }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(focused ? 1.05 : 1, { stiffness: 300, damping: 20 }) }],
      opacity: withSpring(focused ? 1 : 0.6),
    };
  });
  
  return (
    <Animated.View style={[styles.tabItem, animatedStyle]}>
      <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
        <Ionicons name={name} size={22} color={focused ? '#fff' : colors.light.mutedForeground} />
      </View>
    </Animated.View>
  );
}

function TabletSidebar({ state, descriptors, navigation, isRTL, t }: any) {
  const fontFam = getFontFamily(isRTL, 'semiBold');

  return (
    <View style={[styles.sidebar, isRTL ? styles.sidebarRight : styles.sidebarLeft]}>
      <View style={styles.sidebarLogoWrap}>
        <View style={styles.appIcon}>
          <Ionicons name="phone-portrait" size={26} color="#fff" />
        </View>
      </View>
      <View style={styles.sidebarNav}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const iconNameMap: Record<string, { active: string; inactive: string }> = {
            index: { active: 'home', inactive: 'home-outline' },
            stores: { active: 'search', inactive: 'search-outline' },
            compare: { active: 'swap-horizontal', inactive: 'swap-horizontal-outline' },
            favorites: { active: 'heart', inactive: 'heart-outline' },
            profile: { active: 'person', inactive: 'person-outline' },
          };

          const mapping = iconNameMap[route.name];
          if (!mapping) return null;

          const iconName = isFocused ? mapping.active : mapping.inactive;
          const label = options.title !== undefined ? options.title : route.name;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.sidebarItem, isFocused && styles.sidebarItemFocused, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            >
              <Ionicons name={iconName as any} size={22} color={isFocused ? colors.light.primary : colors.light.mutedForeground} />
              <Text style={[styles.sidebarLabel, { fontFamily: fontFam, textAlign: isRTL ? 'right' : 'left' }, isFocused && styles.sidebarLabelFocused]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { t, isRTL } = useLanguage();
  const { isTablet } = useLayout();
  const isWeb = Platform.OS === 'web';

  const tabBarStyle = isTablet ? { display: 'none' } : [
    styles.tabBar,
    isWeb && styles.tabBarWeb
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: tabBarStyle as any,
      }}
      tabBar={isTablet ? (props) => <TabletSidebar {...props} isRTL={isRTL} t={t} /> : undefined}
      sceneContainerStyle={isTablet ? { 
        marginLeft: isRTL ? 0 : 220, 
        marginRight: isRTL ? 220 : 0, 
        backgroundColor: '#F5F7FA' 
      } : undefined}
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
  // Mobile Tab Bar
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
  
  // Tablet Sidebar
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 220,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    paddingTop: 40,
    paddingHorizontal: 16,
    zIndex: 50,
  },
  sidebarLeft: {
    left: 0,
    borderLeftWidth: 0,
  },
  sidebarRight: {
    right: 0,
    borderRightWidth: 0,
  },
  sidebarLogoWrap: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sidebarNav: {
    gap: 8,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  sidebarItemFocused: {
    backgroundColor: colors.light.primaryLight,
  },
  sidebarLabel: {
    fontSize: 15,
    color: colors.light.mutedForeground,
    flex: 1,
  },
  sidebarLabelFocused: {
    color: colors.light.primary,
  },
});
