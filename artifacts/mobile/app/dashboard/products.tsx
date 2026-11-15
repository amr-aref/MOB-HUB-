import React, { useState, useEffect } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { getFontFamily } from '@/constants/fonts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/hooks/useLayout';
import { products, stores } from '@/data/mockData';
import { AnimatedPressable } from '@/components/admin/AdminComponents';
import { AnimatedCounter } from '@/components/admin/AnimatedCounter';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, withDelay } from 'react-native-reanimated';
import { useNotifications } from '@/hooks/useNotifications';

const STORE = stores[0];

export default function ProductsScreen() {
  const { isRTL, language } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;
  const isAr = language === 'ar';
  const fontFamilyRTL = {
    regular: getFontFamily(isRTL, 'regular'),
    medium: getFontFamily(isRTL, 'medium'),
    semiBold: getFontFamily(isRTL, 'semiBold'),
    bold: getFontFamily(isRTL, 'bold'),
  };
  const fontFamilyLTR = {
    regular: getFontFamily(false, 'regular'),
    medium: getFontFamily(false, 'medium'),
    semiBold: getFontFamily(false, 'semiBold'),
    bold: getFontFamily(false, 'bold'),
  };
  const storeProducts = products.filter(p => p.storeId === STORE.id);
  // Notification identity from session (not mock storeId). Backend uses req.user.sub.
  const { unreadCount } = useNotifications(user?.id);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <View style={isTablet ? styles.tabletInner : undefined}>
          <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }]}>
            <AnimatedPressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.light.foreground} />
            </AnimatedPressable>
            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={[styles.overline, { fontFamily: fontFamilyLTR.semiBold, letterSpacing: 1 }]}>PRODUCT MANAGEMENT STUDIO</Text>
              <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }]}>
                <View style={[styles.storeAvatar, { backgroundColor: STORE.logoColor }]}>
                  <Text style={[styles.storeAvatarText, { fontFamily: fontFamilyLTR.bold }]}>{STORE.logoInitial}</Text>
                </View>
                <Text style={[styles.storeName, { fontFamily: fontFamilyRTL.bold }]}>{isAr ? STORE.nameAr : STORE.nameEn}</Text>
              </View>
            </View>
            <AnimatedPressable
              style={styles.iconBtn}
              onPress={() => router.push({ pathname: '/notifications', params: user?.id ? { userId: user.id } : {} })}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.light.foreground} />
              {unreadCount > 0 && <View style={styles.notifDot} />}
            </AnimatedPressable>
          </View>
          <View style={[styles.searchContainer, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 16 }]}>
            <Ionicons name="search" size={20} color={colors.light.mutedForeground} style={{ marginHorizontal: 12 }} />
            <TextInput
              style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.regular }]}
              placeholder={isAr ? 'بحث...' : 'Search...'}
              placeholderTextColor={colors.light.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: bottomInset + 100, padding: 20 }}>
        <Text style={{ fontFamily: fontFamilyRTL.medium, color: colors.light.mutedForeground, marginBottom: 12 }}>
          {isAr ? `${storeProducts.length} منتج` : `${storeProducts.length} products`}
        </Text>
        {storeProducts.map((product) => (
          <View key={product.id} style={styles.productRow}>
            <Text style={{ fontFamily: fontFamilyRTL.bold, color: colors.light.foreground }}>
              {isAr ? product.nameAr : product.nameEn}
            </Text>
          </View>
        ))}
      </ScrollView>
      <AnimatedPressable style={[styles.fab, isRTL ? { left: 24 } : { right: 24 }]} onPress={() => router.push('/dashboard/add-product')}>
        <Ionicons name="add" size={24} color="#fff" />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    backgroundColor: colors.light.background,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
  },
  headerRow: { gap: 12 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  overline: { fontSize: 10, color: colors.light.mutedForeground, marginBottom: 2 },
  storeAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  storeAvatarText: { fontSize: 12, color: '#fff' },
  storeName: { fontSize: 16, color: colors.light.foreground },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.light.destructive, borderWidth: 1.5, borderColor: '#fff',
  },
  searchContainer: {
    backgroundColor: '#fff', borderRadius: 999, height: 48, alignItems: 'center', paddingHorizontal: 6,
  },
  searchInput: { flex: 1, height: '100%', fontSize: 14, color: colors.light.foreground },
  scroll: { flex: 1 },
  productRow: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
  },
  fab: {
    position: 'absolute', bottom: 28, width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.light.primary, alignItems: 'center', justifyContent: 'center',
  },
  tabletInner: { width: '100%', maxWidth: 760, alignSelf: 'center' },
});
