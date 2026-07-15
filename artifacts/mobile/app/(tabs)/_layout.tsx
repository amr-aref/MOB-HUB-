import React from 'react';
import { Platform, StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import colors from '@/constants/colors';
import { getFontFamily } from '@/constants/fonts';
import { useLayout } from '@/hooks/useLayout';
import { BlurView } from 'expo-blur';

// Bottom nav sizing tokens — kept within Apple HIG / Material 3 ranges
// (24-28dp icons, 10-12sp labels) and expressed relative to the bar so
// they scale gracefully from iPhone SE up to Pro Max / tablets.
const NAV_ICON_SIZE = 24;
const NAV_LABEL_SIZE = 11;

function TabIcon({ focused, name, label, isRTL }: { focused: boolean, name: any, label: string, isRTL: boolean }) {
  const colors = useColors();
  const fontFam = getFontFamily(isRTL, focused ? 'semiBold' : 'medium');

  // Subtle, non-exaggerated feedback: the icon nudges up slightly and the
  // active pill fades in — no large scale/size jumps.
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.06 : 1, { stiffness: 300, damping: 20 }) }],
  }));
  const pillStyle = useAnimatedStyle(() => ({
    opacity: withSpring(focused ? 1 : 0, { stiffness: 300, damping: 24 }),
  }));

  const activeColor = colors.primary;
  const inactiveColor = colors.mutedForeground;

  return (
    <View style={styles.tabItem}>
      <View style={styles.tabItemContent}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            { backgroundColor: colors.primaryLight },
            pillStyle,
          ]}
        />
        <Animated.View style={iconStyle}>
          <Ionicons name={name} size={NAV_ICON_SIZE} color={focused ? activeColor : inactiveColor} />
        </Animated.View>
        <Text
          numberOfLines={1}
          ellipsizeMode="clip"
          style={[
            styles.tabLabel,
            { fontFamily: fontFam, color: focused ? activeColor : inactiveColor },
          ]}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

function TabletSidebar({ state, descriptors, navigation, isRTL, t }: any) {
  const fontFam = getFontFamily(isRTL, 'semiBold');

  return (
    <View style={[styles.sidebar, isRTL ? styles.sidebarRight : styles.sidebarLeft]}>
      <Text style={[styles.sidebarLogoText, { textAlign: isRTL ? 'right' : 'left' }]}>MOB HUB</Text>
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
              <Ionicons name={iconName as any} size={22} color={isFocused ? '#FF8A3D' : '#9E9BA4'} />
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
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  // Float the dock above the home indicator on notched phones (Pro Max, etc.)
  // while keeping a comfortable fixed offset on devices without one (SE).
  const bottomOffset = insets.bottom > 0 ? insets.bottom + 12 : 20;

  const tabBarStyle = isTablet ? { display: 'none' } : [
    styles.tabBar,
    { bottom: bottomOffset },
    isWeb && styles.tabBarWeb
  ];

  // sceneContainerStyle is a valid React Navigation BottomTab prop at runtime;
  // Expo Router's Tabs type definition does not expose it — use a typed alias.
  const SceneTabs = Tabs as unknown as React.ComponentType<
    React.ComponentProps<typeof Tabs> & { sceneContainerStyle?: object }
  >;

  return (
    <SceneTabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: tabBarStyle as any,
        tabBarBackground: isTablet || isWeb ? undefined : () => (
          <BlurView intensity={32} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 28, overflow: 'hidden' }]} />
        ),
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
            <TabIcon focused={focused} name={focused ? 'search' : 'search-outline'} label={t('stores')} isRTL={isRTL} />
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
    </SceneTabs>
  );
}

const styles = StyleSheet.create({
  // Mobile Tab Bar
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderRadius: 28,
    height: 68,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#1E190F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 10,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  tabBarWeb: {
    width: 420,
    left: '50%',
    transform: [{ translateX: -210 }],
  },
  // Each of the 5 destinations gets an equal share of the bar (flex: 1),
  // so icons stay evenly balanced and never crowd or clip regardless of
  // screen width (iPhone SE through Pro Max, and Android equivalents).
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  activePill: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    left: -10,
    right: -10,
    borderRadius: 18,
  },
  tabLabel: {
    fontSize: NAV_LABEL_SIZE,
    lineHeight: NAV_LABEL_SIZE + 2,
  },
  
  // Tablet Sidebar
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 220,
    backgroundColor: 'rgba(248, 246, 242, 1)',
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    paddingTop: 60,
    paddingHorizontal: 16,
    zIndex: 50,
  },
  sidebarLogoText: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#2B2B2E',
    opacity: 0.5,
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
    backgroundColor: 'rgba(255, 138, 61, 0.10)',
    borderRadius: 12,
  },
  sidebarLabel: {
    fontSize: 15,
    color: '#6B6870',
    flex: 1,
  },
  sidebarLabelFocused: {
    color: '#FF8A3D',
  },
});
