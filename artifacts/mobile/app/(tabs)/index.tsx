import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { getFontFamily } from '@/constants/fonts';
import { categories, products, stores } from '@/data/mockData';
import SearchBar from '@/components/SearchBar';
import CategoryChip from '@/components/CategoryChip';
import StoreCard from '@/components/StoreCard';
import ProductCard from '@/components/ProductCard';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function SectionHeader({
  title,
  onPress,
  t,
  isRTL,
  fontFamBold,
  fontFamSemi,
}: {
  title: string;
  onPress: () => void;
  t: (k: any) => string;
  isRTL: boolean;
  fontFamBold: string;
  fontFamSemi: string;
}) {
  return (
    <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>{title}</Text>
      <Pressable onPress={onPress} style={styles.seeAllBtn} hitSlop={8}>
        <Text style={[styles.seeAllText, { fontFamily: fontFamSemi }]}>{t('seeAll')}</Text>
        <Ionicons
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={14}
          color={colors.light.primary}
        />
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { t, isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const fontFamBold = getFontFamily(isRTL, 'bold');
  const fontFamSemi = getFontFamily(isRTL, 'semiBold');
  const fontFamReg = getFontFamily(isRTL, 'regular');
  const latinBold = getFontFamily(false, 'bold');
  const latinReg = getFontFamily(false, 'regular');

  const featuredStores = stores.filter((s) => s.isVerified);
  const newArrivals = products.filter((p) => p.isNew);
  const bestSellers = products.filter((p) => p.isBestSeller);

  const bannerScale = useSharedValue(1);
  const bannerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bannerScale.value }],
  }));

  const handleBannerPressIn = () => {
    bannerScale.value = withSpring(0.97, { stiffness: 300, damping: 28 });
  };
  const handleBannerPressOut = () => {
    bannerScale.value = withSpring(1, { stiffness: 300, damping: 28 });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={[styles.headerTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* Greeting */}
          <View style={[styles.greetingRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View>
              <Text style={[styles.greetingText, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamSemi }]}>
                {language === 'ar' ? 'صباح الخير 👋' : 'Good Morning 👋'}
              </Text>
              <View style={[styles.locationRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Ionicons name="location" size={14} color={colors.light.primary} />
                <Text style={[styles.locationText, { fontFamily: fontFamReg }]}>
                  {language === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt'}
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.light.mutedForeground} />
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable style={styles.iconBtn} hitSlop={8}>
              <Ionicons name="notifications-outline" size={22} color={colors.light.foreground} />
              <View style={styles.notifDot} />
            </Pressable>
            <Pressable
              style={styles.avatarBtn}
              onPress={() => router.push('/(tabs)/profile')}
            >
              <Image source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' }} style={styles.avatarImage} />
            </Pressable>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('searchPlaceholder')}
            isRTL={isRTL}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomInset + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <Animated.View entering={FadeInUp.delay(100).springify().stiffness(300).damping(28)} style={styles.section}>
          <AnimatedPressable 
            onPressIn={handleBannerPressIn}
            onPressOut={handleBannerPressOut}
            style={[styles.heroBanner, bannerAnimatedStyle]}
          >
            <LinearGradient
              colors={['#C9C6F5', '#8FA7EE', '#6B7FE0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={[styles.heroContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.heroTextContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.heroTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
                    {language === 'ar' ? 'هاتف أحلامك بانتظارك' : 'Your Dream Phone Awaits'}
                  </Text>
                  <Text style={[styles.heroSubtitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamReg }]}>
                    {language === 'ar' ? 'اكتشف أحدث الموبايلات والإلكترونيات بأفضل الأسعار.' : 'Discover the latest phones and electronics at the best prices.'}
                  </Text>
                  <Pressable style={styles.exploreBtn} onPress={() => {Haptics.selectionAsync();}}>
                    <Text style={[styles.exploreBtnText, { fontFamily: fontFamSemi }]}>
                      {language === 'ar' ? 'اكتشف الآن' : 'Explore Now'}
                    </Text>
                    <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={16} color="#000" />
                  </Pressable>
                </View>
                <View style={styles.heroImageWrap}>
                  <View style={styles.heroPhone}>
                    <View style={styles.heroPhoneScreen} />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </AnimatedPressable>
        </Animated.View>

        {/* Quick Categories */}
        <Animated.View entering={FadeInUp.delay(150).springify().stiffness(300).damping(28)} style={styles.section}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.chipsRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            {categories.map((cat) => (
              <View key={cat.id} style={styles.chipWrap}>
                <CategoryChip
                  label={t(cat.id as any)}
                  icon={cat.icon}
                  iconColor={cat.color}
                  isSelected={selectedCategory === cat.id}
                  onPress={() =>
                    setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
                  }
                />
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Featured Stores */}
        <Animated.View entering={FadeInUp.delay(200).springify().stiffness(300).damping(28)} style={styles.section}>
          <SectionHeader
            title={t('featuredStores')}
            onPress={() => router.push('/(tabs)/stores')}
            t={t}
            isRTL={isRTL}
            fontFamBold={fontFamBold}
            fontFamSemi={fontFamSemi}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.horizontalList,
              { paddingLeft: isRTL ? 0 : 16, paddingRight: isRTL ? 16 : 0 },
            ]}
          >
            {featuredStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                onPress={() => router.push(`/store/${store.id}`)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* New Arrivals */}
        <Animated.View entering={FadeInUp.delay(250).springify().stiffness(300).damping(28)} style={styles.section}>
          <SectionHeader 
            title={t('newArrivals')} 
            onPress={() => {}} 
            t={t} 
            isRTL={isRTL} 
            fontFamBold={fontFamBold}
            fontFamSemi={fontFamSemi}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.horizontalList,
              { paddingLeft: isRTL ? 0 : 16, paddingRight: isRTL ? 16 : 0 },
            ]}
          >
            {newArrivals.map((product) => (
              <View key={product.id} style={styles.productWrap}>
                <ProductCard
                  product={product}
                  onPress={() => router.push(`/product/${product.id}`)}
                  width={160}
                />
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Trending / Best Sellers */}
        <Animated.View entering={FadeInUp.delay(300).springify().stiffness(300).damping(28)} style={styles.section}>
          <SectionHeader 
            title={t('bestSellers')} 
            onPress={() => {}} 
            t={t} 
            isRTL={isRTL} 
            fontFamBold={fontFamBold}
            fontFamSemi={fontFamSemi}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.horizontalList,
              { paddingLeft: isRTL ? 0 : 16, paddingRight: isRTL ? 16 : 0 },
            ]}
          >
            {bestSellers.map((product) => (
              <View key={product.id} style={styles.productWrap}>
                <ProductCard
                  product={product}
                  onPress={() => router.push(`/product/${product.id}`)}
                  width={160}
                />
              </View>
            ))}
          </ScrollView>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },

  // Header
  header: {
    backgroundColor: colors.light.background,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
    zIndex: 10,
  },
  headerTop: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingRow: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  greetingText: {
    fontSize: 20,
    color: colors.light.foreground,
    marginBottom: 4,
  },
  locationRow: {
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: colors.light.mutedForeground,
  },
  headerActions: {
    gap: 12,
    alignItems: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.light.destructive,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  searchWrap: {
    paddingHorizontal: 4,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16 },

  // Hero Banner
  heroBanner: {
    marginHorizontal: 16,
    borderRadius: colors.radiusXl,
    overflow: 'hidden',
    shadowColor: colors.light.shadowStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
    marginBottom: 24,
  },
  heroGradient: {
    padding: 24,
    minHeight: 180,
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
  },
  heroTextContent: {
    flex: 1,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 24,
    color: '#fff',
    lineHeight: 32,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    lineHeight: 20,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 16,
    gap: 6,
  },
  exploreBtnText: {
    fontSize: 13,
    color: '#000',
  },
  heroImageWrap: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPhone: {
    width: 80,
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    padding: 6,
    transform: [{ rotate: '-10deg' }],
  },
  heroPhoneScreen: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
  },

  // Sections
  section: { marginBottom: 8 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 20,
    color: colors.light.foreground,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.light.primary,
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 16,
  },
  chipWrap: {},
  horizontalList: {
    gap: 16,
    paddingRight: 16,
    paddingBottom: 24,
  },
  productWrap: {},
});
