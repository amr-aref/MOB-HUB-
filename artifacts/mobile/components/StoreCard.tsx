import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { Store } from '@/data/mockData';
import RatingStars from './RatingStars';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface StoreCardProps {
  store: Store;
  onPress: () => void;
  variant?: 'full' | 'compact';
}

export default function StoreCard({ store, onPress, variant = 'full' }: StoreCardProps) {
  const { toggleFavoriteStore, isStoreFavorite } = useFavorites();
  const { language, isRTL, t } = useLanguage();
  const isFav = isStoreFavorite(store.id);

  const name = language === 'ar' ? store.nameAr : store.nameEn;
  const city = isRTL ? store.governorate : store.city;

  function handleFavorite() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavoriteStore(store.id);
  }

  if (variant === 'compact') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.compact, pressed && styles.pressed]}
      >
        <View style={[styles.compactLogo, { backgroundColor: store.logoColor }]}>
          <Text style={styles.compactInitial}>{store.logoInitial}</Text>
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>{name}</Text>
          <Text style={styles.compactCity} numberOfLines={1}>{city}</Text>
        </View>
        <View style={styles.compactRating}>
          <Ionicons name="star" size={12} color={colors.light.star} />
          <Text style={styles.compactRatingText}>{store.rating.toFixed(1)}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {/* Cover gradient */}
      <LinearGradient
        colors={store.coverGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cover}
      >
        {/* Logo */}
        <View style={[styles.logo, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Text style={styles.logoText}>{store.logoInitial}</Text>
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: store.isOpen ? 'rgba(16,185,129,0.9)' : 'rgba(100,116,139,0.9)' }]}>
          <View style={[styles.statusDot, { backgroundColor: store.isOpen ? '#fff' : '#cbd5e1' }]} />
          <Text style={styles.statusText}>
            {store.isOpen ? t('openNow') : t('closedNow')}
          </Text>
        </View>

        {/* Verified badge */}
        {store.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
          </View>
        )}
      </LinearGradient>

      {/* Info section — glass overlay */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={40} tint="light" style={styles.info}>
          <StoreInfo store={store} name={name} city={city} isFav={isFav} onFavorite={handleFavorite} t={t} isRTL={isRTL} />
        </BlurView>
      ) : (
        <View style={[styles.info, styles.infoFallback]}>
          <StoreInfo store={store} name={name} city={city} isFav={isFav} onFavorite={handleFavorite} t={t} isRTL={isRTL} />
        </View>
      )}
    </Pressable>
  );
}

function StoreInfo({ store, name, city, isFav, onFavorite, t, isRTL }: {
  store: Store; name: string; city: string; isFav: boolean;
  onFavorite: () => void; t: (k: any) => string; isRTL: boolean;
}) {
  return (
    <View style={styles.infoInner}>
      <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.storeName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{name}</Text>
          <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Ionicons name="location-outline" size={12} color={colors.light.mutedForeground} />
            <Text style={styles.cityText}>{city}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.productsText}>{store.productsCount} {t('products')}</Text>
          </View>
        </View>
        <Pressable onPress={onFavorite} style={styles.favButton} hitSlop={8}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={20}
            color={isFav ? colors.light.destructive : colors.light.mutedForeground}
          />
        </Pressable>
      </View>
      <View style={[styles.ratingRow, { justifyContent: isRTL ? 'flex-end' : 'flex-start' }]}>
        <RatingStars rating={store.rating} reviewsCount={store.reviewsCount} size={13} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    borderRadius: colors.radiusLg,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
    marginRight: 12,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  cover: {
    height: 120,
    justifyContent: 'flex-end',
    padding: 12,
  },
  logo: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statusBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  info: {
    overflow: 'hidden',
  },
  infoFallback: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  infoInner: { padding: 12, gap: 6 },
  infoRow: { alignItems: 'flex-start', gap: 8 },
  storeName: { fontSize: 15, fontWeight: '700', color: colors.light.foreground },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cityText: { fontSize: 12, color: colors.light.mutedForeground },
  dot: { fontSize: 12, color: colors.light.mutedForeground },
  productsText: { fontSize: 12, color: colors.light.mutedForeground },
  favButton: { padding: 4 },
  ratingRow: { flexDirection: 'row' },
  // Compact
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: colors.radiusMd,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 10,
    marginBottom: 8,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  compactLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInitial: { fontSize: 18, fontWeight: '700', color: '#fff' },
  compactInfo: { flex: 1 },
  compactName: { fontSize: 14, fontWeight: '600', color: colors.light.foreground },
  compactCity: { fontSize: 12, color: colors.light.mutedForeground, marginTop: 2 },
  compactRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  compactRatingText: { fontSize: 13, fontWeight: '600', color: colors.light.foreground },
});
