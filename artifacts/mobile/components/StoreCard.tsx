import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { Store } from '@/data/mockData';
import RatingStars from './RatingStars';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getFontFamily } from '@/constants/fonts';

interface StoreCardProps {
  store: Store;
  onPress: () => void;
  variant?: 'full' | 'compact';
  listMode?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function StoreCard({
  store,
  onPress,
  variant = 'full',
  listMode = false,
}: StoreCardProps) {
  const { toggleFavoriteStore, isStoreFavorite } = useFavorites();
  const { language, isRTL, t } = useLanguage();
  const isFav = isStoreFavorite(store.id);

  const name = language === 'ar' ? store.nameAr : store.nameEn;
  const city = isRTL ? store.governorate : store.city;

  const fontFamBold = getFontFamily(isRTL, 'bold');
  const fontFamReg = getFontFamily(isRTL, 'regular');
  const fontFamSemi = getFontFamily(isRTL, 'semiBold');
  const latinBold = getFontFamily(false, 'bold');

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.97, { stiffness: 300, damping: 28 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { stiffness: 300, damping: 28 });
  }

  function handlePress() {
    Haptics.selectionAsync();
    onPress();
  }

  function handleFavorite() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavoriteStore(store.id);
  }

  if (variant === 'compact') {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[styles.compact, { flexDirection: isRTL ? 'row-reverse' : 'row' }, animatedStyle]}
      >
        <View style={[styles.compactLogo, { backgroundColor: store.logoColor }]}>
          <Text style={[styles.compactInitial, { fontFamily: latinBold }]}>{store.logoInitial}</Text>
        </View>
        <View style={styles.compactInfo}>
          <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}>
            <Text style={[styles.compactName, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]} numberOfLines={1}>
              {name}
            </Text>
            {store.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color={colors.light.verifiedBlue} />
            )}
          </View>
          <Text style={[styles.compactCity, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamReg }]} numberOfLines={1}>
            {city}
          </Text>
        </View>
        <View style={styles.compactRight}>
          <View style={[styles.compactRating, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Ionicons name="star" size={12} color={colors.light.star} />
            <Text style={[styles.compactRatingText, { fontFamily: getFontFamily(false, 'semiBold') }]}>{store.rating.toFixed(1)}</Text>
          </View>
          <View
            style={[
              styles.openPill,
              { backgroundColor: store.isOpen ? colors.light.successLight : colors.light.muted },
            ]}
          >
            <View
              style={[
                styles.openDot,
                { backgroundColor: store.isOpen ? colors.light.success : colors.light.mutedForeground },
              ]}
            />
            <Text style={[styles.openText, { color: store.isOpen ? colors.light.success : colors.light.mutedForeground, fontFamily: fontFamSemi }]}>
              {store.isOpen ? t('openNow') : t('closedNow')}
            </Text>
          </View>
        </View>
      </AnimatedPressable>
    );
  }

  const cardStyle = listMode ? [styles.listCard] : [styles.card];

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[...cardStyle, animatedStyle]}
    >
      <LinearGradient
        colors={store.coverGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={listMode ? styles.listCover : styles.cover}
      >
        <View style={[styles.logo, { backgroundColor: 'rgba(255,255,255,0.25)' }, isRTL ? { right: 12 } : { left: 12 }]}>
          <Text style={[styles.logoText, { fontFamily: latinBold }]}>{store.logoInitial}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: store.isOpen ? 'rgba(47,190,92,0.95)' : 'rgba(138,135,130,0.9)' },
            isRTL ? { right: 12 } : { left: 12 }
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: store.isOpen ? '#fff' : '#ECE6D9' }]} />
          <Text style={[styles.statusText, { fontFamily: fontFamSemi }]}>
            {store.isOpen ? t('openNow') : t('closedNow')}
          </Text>
        </View>

        {store.isVerified && (
          <View style={[styles.verifiedBadge, isRTL ? { left: 12 } : { right: 12 }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.light.verifiedBlue} />
          </View>
        )}
      </LinearGradient>

      <View style={styles.infoInner}>
        <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1 }}>
            <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }]}>
              <Text style={[styles.storeName, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]} numberOfLines={1}>
                {name}
              </Text>
            </View>
            <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="location-outline" size={12} color={colors.light.mutedForeground} />
              <Text style={[styles.cityText, { fontFamily: fontFamReg }]}>{city}</Text>
              <Text style={[styles.dot, { fontFamily: fontFamReg }]}>·</Text>
              <Text style={[styles.productsText, { fontFamily: fontFamReg }]}>
                {store.productsCount} {t('products')}
              </Text>
            </View>
          </View>
          <Pressable onPress={handleFavorite} style={styles.favButton} hitSlop={8}>
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={22}
              color={isFav ? colors.light.destructive : colors.light.mutedForeground}
            />
          </Pressable>
        </View>
        <View style={[styles.ratingRow, { justifyContent: isRTL ? 'flex-end' : 'flex-start' }]}>
          <RatingStars rating={store.rating} reviewsCount={store.reviewsCount} size={14} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    borderRadius: colors.radiusLg,
    overflow: 'hidden',
    backgroundColor: colors.light.card,
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
    marginRight: 16,
  },
  listCard: {
    borderRadius: colors.radiusLg,
    overflow: 'hidden',
    backgroundColor: colors.light.card,
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  cover: {
    height: 130,
    justifyContent: 'flex-end',
    padding: 12,
  },
  listCover: {
    height: 120,
    justifyContent: 'flex-end',
    padding: 12,
  },
  logo: {
    position: 'absolute',
    top: 12,
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoText: { fontSize: 22, color: '#fff' },
  statusBadge: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, color: '#fff' },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoInner: { padding: 16, gap: 8 },
  infoRow: { alignItems: 'flex-start', gap: 12 },
  storeName: {
    fontSize: 16,
    color: colors.light.foreground,
  },
  metaRow: { alignItems: 'center', gap: 4, marginTop: 4 },
  cityText: {
    fontSize: 13,
    color: colors.light.mutedForeground,
  },
  dot: { fontSize: 13, color: colors.light.mutedForeground },
  productsText: {
    fontSize: 13,
    color: colors.light.mutedForeground,
  },
  favButton: { padding: 4 },
  ratingRow: { flexDirection: 'row', marginTop: 4 },

  compact: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.light.card,
    borderRadius: colors.radiusMd,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
    gap: 12,
    marginBottom: 10,
  },
  compactLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInitial: { fontSize: 20, color: '#fff' },
  compactInfo: { flex: 1 },
  compactName: {
    fontSize: 15,
    color: colors.light.foreground,
    flexShrink: 1,
  },
  compactCity: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    marginTop: 4,
  },
  compactRight: { alignItems: 'flex-end', gap: 6 },
  compactRating: { alignItems: 'center', gap: 4 },
  compactRatingText: {
    fontSize: 13,
    color: colors.light.foreground,
  },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 5,
  },
  openDot: { width: 6, height: 6, borderRadius: 3 },
  openText: { fontSize: 11 },
});
