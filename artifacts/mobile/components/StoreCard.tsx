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
  /** When true, renders full-width for vertical list use */
  listMode?: boolean;
}

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

  function handleFavorite() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavoriteStore(store.id);
  }

  // ─── Compact variant ───────────────────────────────────────────────────
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
          <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}>
            <Text style={[styles.compactName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {name}
            </Text>
            {store.isVerified && (
              <Ionicons name="checkmark-circle" size={13} color={colors.light.primary} />
            )}
          </View>
          <Text style={[styles.compactCity, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {city}
          </Text>
        </View>
        <View style={styles.compactRight}>
          <View style={[styles.compactRating, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Ionicons name="star" size={12} color={colors.light.star} />
            <Text style={styles.compactRatingText}>{store.rating.toFixed(1)}</Text>
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
                {
                  backgroundColor: store.isOpen
                    ? colors.light.success
                    : colors.light.mutedForeground,
                },
              ]}
            />
            <Text
              style={[
                styles.openText,
                { color: store.isOpen ? colors.light.success : colors.light.mutedForeground },
              ]}
            >
              {store.isOpen ? t('openNow') : t('closedNow')}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // ─── Full variant ──────────────────────────────────────────────────────
  const cardStyle = listMode
    ? [styles.listCard]
    : [styles.card];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [...cardStyle, pressed && styles.pressed]}
    >
      {/* Cover gradient */}
      <LinearGradient
        colors={store.coverGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={listMode ? styles.listCover : styles.cover}
      >
        {/* Logo */}
        <View style={[styles.logo, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
          <Text style={styles.logoText}>{store.logoInitial}</Text>
        </View>

        {/* Status badge */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: store.isOpen
                ? 'rgba(16,185,129,0.95)'
                : 'rgba(100,116,139,0.9)',
            },
          ]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: store.isOpen ? '#fff' : '#cbd5e1' }]}
          />
          <Text style={styles.statusText}>
            {store.isOpen ? t('openNow') : t('closedNow')}
          </Text>
        </View>

        {/* Verified badge */}
        {store.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
          </View>
        )}
      </LinearGradient>

      {/* Info section */}
      {Platform.OS === 'ios' ? (
        <BlurView intensity={40} tint="light" style={styles.info}>
          <StoreInfo
            store={store}
            name={name}
            city={city}
            isFav={isFav}
            onFavorite={handleFavorite}
            t={t}
            isRTL={isRTL}
          />
        </BlurView>
      ) : (
        <View style={[styles.info, styles.infoFallback]}>
          <StoreInfo
            store={store}
            name={name}
            city={city}
            isFav={isFav}
            onFavorite={handleFavorite}
            t={t}
            isRTL={isRTL}
          />
        </View>
      )}
    </Pressable>
  );
}

function StoreInfo({
  store,
  name,
  city,
  isFav,
  onFavorite,
  t,
  isRTL,
}: {
  store: Store;
  name: string;
  city: string;
  isFav: boolean;
  onFavorite: () => void;
  t: (k: any) => string;
  isRTL: boolean;
}) {
  return (
    <View style={styles.infoInner}>
      <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={{ flex: 1 }}>
          <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}>
            <Text
              style={[styles.storeName, { textAlign: isRTL ? 'right' : 'left' }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            {store.isVerified && (
              <Ionicons name="checkmark-circle" size={14} color={colors.light.primary} />
            )}
          </View>
          <View
            style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            <Ionicons name="location-outline" size={11} color={colors.light.mutedForeground} />
            <Text style={styles.cityText}>{city}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.productsText}>
              {store.productsCount} {t('products')}
            </Text>
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
        <RatingStars rating={store.rating} reviewsCount={store.reviewsCount} size={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Full card (carousel) ────────────────────────────────────────────────
  card: {
    width: 260,
    borderRadius: colors.radiusLg,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: 'rgba(15,23,42,0.12)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 6,
    marginRight: 12,
  },
  // ── Full card (list) ────────────────────────────────────────────────────
  listCard: {
    borderRadius: colors.radiusLg,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  pressed: { opacity: 0.93, transform: [{ scale: 0.985 }] },

  cover: {
    height: 120,
    justifyContent: 'flex-end',
    padding: 12,
  },
  listCover: {
    height: 110,
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
    borderColor: 'rgba(255,255,255,0.35)',
  },
  logoText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statusBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, color: '#fff', fontFamily: 'Inter_600SemiBold' },
  verifiedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  info: { overflow: 'hidden' },
  infoFallback: { backgroundColor: 'rgba(255,255,255,0.97)' },
  infoInner: { padding: 12, gap: 6 },
  infoRow: { alignItems: 'flex-start', gap: 8 },
  storeName: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cityText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
  },
  dot: { fontSize: 12, color: colors.light.mutedForeground },
  productsText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
  },
  favButton: { padding: 4 },
  ratingRow: { flexDirection: 'row' },

  // ── Compact variant ─────────────────────────────────────────────────────
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: colors.radiusMd,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    gap: 10,
    marginBottom: 8,
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  compactLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInitial: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  compactInfo: { flex: 1 },
  compactName: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    flexShrink: 1,
  },
  compactCity: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    marginTop: 2,
  },
  compactRight: { alignItems: 'flex-end', gap: 4 },
  compactRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  compactRatingText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
  },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 4,
  },
  openDot: { width: 5, height: 5, borderRadius: 2.5 },
  openText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
});
