import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { products, reviews, stores } from '@/data/mockData';
import RatingStars from '@/components/RatingStars';
import ProductCard from '@/components/ProductCard';

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, isRTL, language } = useLanguage();
  const { toggleFavoriteStore, isStoreFavorite } = useFavorites();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const store = stores.find((s) => s.id === id);
  if (!store) return null;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const isFav = isStoreFavorite(store.id);
  const name = language === 'ar' ? store.nameAr : store.nameEn;
  const description = language === 'ar' ? store.descriptionAr : store.descriptionEn;
  const address = language === 'ar' ? store.addressAr : store.address;
  const hours = language === 'ar' ? store.workingHoursAr : store.workingHours;

  const storeProducts = products.filter((p) => p.storeId === store.id);
  const storeReviews = reviews.filter((r) => r.storeId === store.id);

  function handleFavorite() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavoriteStore(store.id);
  }

  function handleCall() {
    Linking.openURL(`tel:${store.phone}`);
  }

  function handleWhatsApp() {
    const num = store.whatsapp.replace('+', '');
    Linking.openURL(`https://wa.me/${num}`);
  }

  function handleMaps() {
    const url = Platform.OS === 'ios'
      ? `maps://?q=${store.nameEn}&ll=${store.lat},${store.lng}`
      : `geo:${store.lat},${store.lng}?q=${encodeURIComponent(store.nameEn)}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://maps.google.com/?q=${store.lat},${store.lng}`);
    });
  }

  function handleCopyAddress() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('', t('addressCopied'));
  }

  function handleSocial(type: 'facebook' | 'instagram' | 'website') {
    const urls: Record<string, string | undefined> = {
      facebook: store.facebook ? `https://facebook.com/${store.facebook}` : undefined,
      instagram: store.instagram ? `https://instagram.com/${store.instagram}` : undefined,
      website: store.website,
    };
    const url = urls[type];
    if (url) Linking.openURL(url);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero cover */}
        <LinearGradient
          colors={store.coverGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: topInset + 8 }]}
        >
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}
          >
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color="#fff"
            />
          </Pressable>

          {/* Store logo */}
          <View style={[styles.logo, { backgroundColor: store.logoColor }]}>
            <Text style={styles.logoText}>{store.logoInitial}</Text>
          </View>

          {/* Name + verified */}
          <View style={[styles.nameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.storeName}>{name}</Text>
            {store.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color="#93C5FD" />
            )}
          </View>

          {/* City + status */}
          <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.metaText}>{language === 'ar' ? store.governorate : store.city}</Text>
            <Text style={styles.metaDot}>·</Text>
            <View style={[styles.statusPill, { backgroundColor: store.isOpen ? 'rgba(16,185,129,0.9)' : 'rgba(100,116,139,0.7)' }]}>
              <Text style={styles.statusText}>{store.isOpen ? t('openNow') : t('closedNow')}</Text>
            </View>
          </View>

          <RatingStars rating={store.rating} reviewsCount={store.reviewsCount} size={14} />

          {/* Favorite button */}
          <Pressable onPress={handleFavorite} style={styles.favBtn}>
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={20}
              color={isFav ? '#FCA5A5' : 'rgba(255,255,255,0.9)'}
            />
            <Text style={styles.favText}>
              {isFav ? t('removeFromFavorites') : t('followStore')}
            </Text>
          </Pressable>
        </LinearGradient>

        {/* Quick contact buttons */}
        <View style={[styles.contactRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <ContactBtn icon="call" label={t('callStore')} onPress={handleCall} color="#10B981" />
          <ContactBtn icon="logo-whatsapp" label={t('whatsapp')} onPress={handleWhatsApp} color="#25D366" />
          <ContactBtn icon="navigate" label={t('openInMaps')} onPress={handleMaps} color="#2563EB" />
          {store.facebook && (
            <ContactBtn icon="logo-facebook" label={t('facebook')} onPress={() => handleSocial('facebook')} color="#1877F2" />
          )}
          {store.instagram && (
            <ContactBtn icon="logo-instagram" label={t('instagram')} onPress={() => handleSocial('instagram')} color="#E1306C" />
          )}
        </View>

        {/* Description */}
        {description && (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'عن المتجر' : 'About'}
            </Text>
            <Text style={[styles.cardText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {description}
            </Text>
          </View>
        )}

        {/* Location & Hours */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('location')} & {t('workingHours')}
          </Text>

          <Pressable
            onPress={handleMaps}
            style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            <View style={[styles.infoIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="location" size={18} color={colors.light.primary} />
            </View>
            <Text style={[styles.infoText, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
              {address}
            </Text>
            <Ionicons name="copy-outline" size={16} color={colors.light.mutedForeground} onPress={handleCopyAddress} />
          </Pressable>

          <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.infoIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="time" size={18} color={colors.light.success} />
            </View>
            <Text style={[styles.infoText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {hours}
            </Text>
          </View>
        </View>

        {/* Products */}
        {storeProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 16 }]}>
              {t('allProducts')} ({storeProducts.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.productsRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              {storeProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => router.push(`/product/${product.id}`)}
                  width={160}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reviews */}
        {storeReviews.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 16 }]}>
              {t('storeReviews')}
            </Text>
            {storeReviews.map((review) => (
              <View key={review.id} style={[styles.reviewCard, { marginHorizontal: 16 }]}>
                <View style={[styles.reviewHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>
                      {(language === 'ar' ? review.authorAr : review.author)[0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewAuthor, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {language === 'ar' ? review.authorAr : review.author}
                    </Text>
                    <RatingStars rating={review.rating} size={12} showCount={false} />
                  </View>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
                <Text style={[styles.reviewText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? review.textAr : review.textEn}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ContactBtn({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  return (
    <Pressable onPress={onPress} style={styles.contactBtn}>
      <View style={[styles.contactIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.contactLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.backgroundSecondary },
  scroll: { flex: 1 },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 8,
    alignItems: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoText: { fontSize: 32, fontFamily: 'Inter_700Bold', color: '#fff' },
  nameRow: { alignItems: 'center', gap: 6 },
  storeName: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  metaRow: { alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter_400Regular' },
  metaDot: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: { fontSize: 11, color: '#fff', fontFamily: 'Inter_600SemiBold' },
  favBtn: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: colors.radiusFull,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  favText: { fontSize: 13, color: '#fff', fontFamily: 'Inter_500Medium' },
  contactRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    flexWrap: 'wrap',
  },
  contactBtn: {
    alignItems: 'center',
    gap: 6,
    minWidth: 60,
  },
  contactIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: colors.light.foreground,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: colors.light.background,
    borderRadius: colors.radiusMd,
    borderWidth: 1,
    borderColor: colors.light.border,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  cardText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    lineHeight: 22,
  },
  infoRow: {
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.light.foreground,
  },
  section: { marginBottom: 20, gap: 12 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  productsRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  reviewCard: {
    backgroundColor: colors.light.background,
    borderRadius: colors.radiusMd,
    borderWidth: 1,
    borderColor: colors.light.border,
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  reviewHeader: { alignItems: 'flex-start', gap: 10 },
  reviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.light.primary },
  reviewAuthor: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground },
  reviewDate: { fontSize: 11, color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular' },
  reviewText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.light.foreground, lineHeight: 20 },
});
