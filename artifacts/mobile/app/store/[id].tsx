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
import { categories, products, reviews, stores } from '@/data/mockData';
import RatingStars from '@/components/RatingStars';
import ProductCard from '@/components/ProductCard';

const GALLERY_COLORS = [
  ['#1E3A8A', '#3B82F6'],
  ['#7C3AED', '#A78BFA'],
  ['#065F46', '#34D399'],
  ['#92400E', '#F59E0B'],
];

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
  const storeCategories = categories.filter((c) => store.categories.includes(c.id));
  const followersCount = store.reviewsCount * 3 + 450;

  function handleFavorite() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavoriteStore(store.id);
  }
  function handleCall() { Linking.openURL(`tel:${store.phone}`); }
  function handleWhatsApp() {
    Linking.openURL(`https://wa.me/${store.whatsapp.replace('+', '')}`);
  }
  function handleMaps() {
    const url = Platform.OS === 'ios'
      ? `maps://?q=${store.nameEn}&ll=${store.lat},${store.lng}`
      : `geo:${store.lat},${store.lng}?q=${encodeURIComponent(store.nameEn)}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${store.lat},${store.lng}`)
    );
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

          {/* Store logo — centered */}
          <View style={styles.logoWrap}>
            <View style={[styles.logo, { backgroundColor: store.logoColor }]}>
              <Text style={styles.logoText}>{store.logoInitial}</Text>
            </View>
            {store.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </View>

          {/* Name + verified */}
          <View style={[styles.nameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.storeName}>{name}</Text>
            {store.isVerified && (
              <View style={styles.verifiedPill}>
                <Ionicons name="checkmark-circle" size={13} color="#93C5FD" />
                <Text style={styles.verifiedText}>
                  {language === 'ar' ? 'موثق' : 'Verified'}
                </Text>
              </View>
            )}
          </View>

          {/* Stats row */}
          <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <StatItem value={store.rating.toFixed(1)} label={language === 'ar' ? 'تقييم' : 'Rating'} icon="star" />
            <View style={styles.statDivider} />
            <StatItem value={`${(followersCount / 1000).toFixed(1)}k`} label={language === 'ar' ? 'متابع' : 'Followers'} />
            <View style={styles.statDivider} />
            <StatItem value={store.reviewsCount.toLocaleString()} label={language === 'ar' ? 'تقييم' : 'Reviews'} />
            <View style={styles.statDivider} />
            <StatItem value={`${(store.productsCount / 1000).toFixed(store.productsCount >= 1000 ? 1 : 0)}${store.productsCount >= 1000 ? 'k' : ''}`} label={language === 'ar' ? 'منتج' : 'Products'} />
            <View style={styles.statDivider} />
            <View style={[styles.openPill, { backgroundColor: store.isOpen ? 'rgba(16,185,129,0.9)' : 'rgba(100,116,139,0.7)' }]}>
              <View style={styles.openDot} />
              <Text style={styles.openText}>{store.isOpen ? t('openNow') : t('closedNow')}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick contact bar */}
        <View style={[styles.contactBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <ContactBtn icon="call" label={language === 'ar' ? 'اتصال' : 'Call'} onPress={handleCall} color={colors.light.success} />
          <ContactBtn icon="logo-whatsapp" label="WhatsApp" onPress={handleWhatsApp} color="#25D366" />
          <ContactBtn icon="navigate" label={language === 'ar' ? 'الاتجاهات' : 'Navigate'} onPress={handleMaps} color={colors.light.primary} />
          <ContactBtn
            icon={isFav ? 'heart' : 'heart-outline'}
            label={language === 'ar' ? 'متابعة' : 'Follow'}
            onPress={handleFavorite}
            color={isFav ? colors.light.destructive : colors.light.mutedForeground}
          />
          <ContactBtn icon="share-outline" label={language === 'ar' ? 'مشاركة' : 'Share'} onPress={() => {}} color={colors.light.mutedForeground} />
        </View>

        {/* Store Information */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'معلومات المتجر' : 'Store Information'}
          </Text>

          {/* Description */}
          {description && (
            <Text style={[styles.descText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {description}
            </Text>
          )}

          {/* Hours */}
          <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.infoIcon}>
              <Ionicons name="time-outline" size={16} color={colors.light.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t('workingHours')}
              </Text>
              <Text style={[styles.infoValue, { textAlign: isRTL ? 'right' : 'left' }]}>{hours}</Text>
            </View>
          </View>

          {/* Address */}
          <Pressable
            onPress={handleCopyAddress}
            style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            <View style={styles.infoIcon}>
              <Ionicons name="location-outline" size={16} color={colors.light.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t('location')}
              </Text>
              <Text style={[styles.infoValue, { textAlign: isRTL ? 'right' : 'left' }]}>{address}</Text>
            </View>
            <Ionicons name="copy-outline" size={16} color={colors.light.mutedForeground} />
          </Pressable>

          {/* Contact links */}
          <View style={[styles.socialRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {store.phone && (
              <Pressable style={styles.socialChip} onPress={handleCall}>
                <Ionicons name="call-outline" size={14} color={colors.light.primary} />
                <Text style={styles.socialChipText}>{language === 'ar' ? 'الهاتف' : 'Phone'}</Text>
              </Pressable>
            )}
            {store.whatsapp && (
              <Pressable style={styles.socialChip} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                <Text style={[styles.socialChipText, { color: '#25D366' }]}>WhatsApp</Text>
              </Pressable>
            )}
            {store.facebook && (
              <Pressable style={styles.socialChip} onPress={() => handleSocial('facebook')}>
                <Ionicons name="logo-facebook" size={14} color="#1877F2" />
                <Text style={[styles.socialChipText, { color: '#1877F2' }]}>Facebook</Text>
              </Pressable>
            )}
            {store.instagram && (
              <Pressable style={styles.socialChip} onPress={() => handleSocial('instagram')}>
                <Ionicons name="logo-instagram" size={14} color="#E1306C" />
                <Text style={[styles.socialChipText, { color: '#E1306C' }]}>Instagram</Text>
              </Pressable>
            )}
            {store.website && (
              <Pressable style={styles.socialChip} onPress={() => handleSocial('website')}>
                <Ionicons name="globe-outline" size={14} color={colors.light.primary} />
                <Text style={styles.socialChipText}>{language === 'ar' ? 'الموقع' : 'Website'}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Product Categories */}
        {storeCategories.length > 0 && (
          <View style={styles.categoriesCard}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'فئات المنتجات' : 'Product Categories'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.categoriesRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              {storeCategories.map((cat) => (
                <View key={cat.id} style={[styles.catChip, { borderColor: cat.color + '40', backgroundColor: cat.color + '12' }]}>
                  <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                  <Text style={[styles.catChipText, { color: cat.color }]}>
                    {t(cat.id as any)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Products */}
        {storeProducts.length > 0 && (
          <View style={styles.productsSection}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t('allProducts')}
              </Text>
              <Text style={styles.productsCount}>
                {storeProducts.length} {language === 'ar' ? 'منتج' : 'products'}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.productsRow,
                { paddingLeft: isRTL ? 0 : 16, paddingRight: isRTL ? 16 : 0 },
              ]}
            >
              {storeProducts.map((product) => (
                <View key={product.id} style={{ marginRight: isRTL ? 0 : 10, marginLeft: isRTL ? 10 : 0 }}>
                  <ProductCard
                    product={product}
                    onPress={() => router.push(`/product/${product.id}`)}
                    width={160}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reviews */}
        {storeReviews.length > 0 && (
          <View style={styles.card}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.cardTitle, { marginBottom: 0, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('storeReviews')}
              </Text>
              <View style={[styles.ratingBig, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Ionicons name="star" size={18} color={colors.light.star} />
                <Text style={styles.ratingBigText}>{store.rating.toFixed(1)}</Text>
              </View>
            </View>
            {storeReviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={[styles.reviewHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.reviewAvatar}>
                    <Ionicons name="person" size={16} color={colors.light.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewAuthor, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {language === 'ar' ? review.authorAr : review.author}
                    </Text>
                    <Text style={[styles.reviewDate, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {review.date}
                    </Text>
                  </View>
                  <RatingStars rating={review.rating} size={12} />
                </View>
                <Text style={[styles.reviewText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? review.textAr : review.textEn}
                </Text>
              </View>
            ))}
            <Pressable style={[styles.writeReviewBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="create-outline" size={16} color={colors.light.primary} />
              <Text style={styles.writeReviewText}>{t('writeReview')}</Text>
            </Pressable>
          </View>
        )}

        {/* Store Gallery */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'معرض المتجر' : 'Store Gallery'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.galleryRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            {GALLERY_COLORS.map((gc, idx) => (
              <View key={idx} style={styles.galleryItem}>
                <LinearGradient colors={gc as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.galleryImage}>
                  <Ionicons name="image-outline" size={28} color="rgba(255,255,255,0.5)" />
                </LinearGradient>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Map Section */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.cardTitle, { marginBottom: 0, textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'الموقع على الخريطة' : 'Map'}
            </Text>
            <Pressable onPress={handleMaps} style={[styles.openMapsBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="navigate-outline" size={14} color={colors.light.primary} />
              <Text style={styles.openMapsBtnText}>
                {language === 'ar' ? 'فتح في الخرائط' : 'Open in Maps'}
              </Text>
            </Pressable>
          </View>

          {/* Mock map tile */}
          <Pressable onPress={handleMaps} style={styles.mapTile}>
            <LinearGradient
              colors={['#EFF6FF', '#DBEAFE']}
              style={styles.mapBg}
            >
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={`h${i}`} style={[styles.mapGridH, { top: `${i * 25}%` as any }]} />
              ))}
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={`v${i}`} style={[styles.mapGridV, { left: `${i * 25}%` as any }]} />
              ))}
              {/* Store pin */}
              <View style={styles.mapPin}>
                <View style={styles.mapPinHead}>
                  <View style={[styles.mapPinLogo, { backgroundColor: store.logoColor }]}>
                    <Text style={styles.mapPinLogoText}>{store.logoInitial}</Text>
                  </View>
                </View>
                <View style={[styles.mapPinTriangle, { borderTopColor: store.logoColor }]} />
              </View>
            </LinearGradient>
          </Pressable>

          <View style={[styles.mapFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mapStoreName, { textAlign: isRTL ? 'right' : 'left' }]}>{name}</Text>
              <Text style={[styles.mapAddress, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                {address}
              </Text>
            </View>
            <Pressable onPress={handleMaps} style={styles.directionsBtn}>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatItem({ value, label, icon }: { value: string; label: string; icon?: string }) {
  return (
    <View style={styles.statItem}>
      {icon && <Ionicons name={icon as any} size={12} color={colors.light.star} />}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ContactBtn({
  icon,
  label,
  onPress,
  color,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.contactBtn}>
      <View style={[styles.contactBtnIcon, { backgroundColor: color + '18', borderColor: color + '30' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.contactBtnLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { flex: 1 },

  // Hero
  hero: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    alignItems: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
  },
  logoWrap: { position: 'relative', marginBottom: 12 },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  logoText: { fontSize: 36, fontFamily: 'Inter_700Bold', color: '#fff' },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  nameRow: { alignItems: 'center', gap: 8, marginBottom: 10 },
  storeName: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
  },
  verifiedText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#93C5FD' },
  statsRow: {
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)' },
  statDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.25)' },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  openText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#fff' },

  // Contact bar
  contactBar: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -1,
    borderRadius: colors.radiusLg,
    padding: 14,
    gap: 4,
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    zIndex: 10,
    justifyContent: 'space-between',
  },
  contactBtn: { alignItems: 'center', gap: 5, flex: 1 },
  contactBtnIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  contactBtnLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: colors.light.mutedForeground,
    textAlign: 'center',
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: colors.radiusLg,
    padding: 16,
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    marginBottom: 12,
  },
  descText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.secondaryForeground,
    lineHeight: 22,
    marginBottom: 12,
  },
  infoRow: {
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.5)',
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.light.foreground,
    lineHeight: 20,
  },
  socialRow: { gap: 8, flexWrap: 'wrap', paddingTop: 10 },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
  },
  socialChipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.light.primary,
  },

  // Categories
  categoriesCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: colors.radiusLg,
    padding: 16,
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  categoriesRow: { gap: 8, paddingBottom: 4 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  catChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  // Products
  productsSection: { marginTop: 12 },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  productsCount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
  },
  productsRow: { gap: 10, paddingRight: 16 },

  // Reviews
  ratingBig: { alignItems: 'center', gap: 4 },
  ratingBigText: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.4)',
    gap: 8,
  },
  reviewHeader: { alignItems: 'center', gap: 10 },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAuthor: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground },
  reviewDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },
  reviewText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.light.secondaryForeground, lineHeight: 20 },
  writeReviewBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: colors.radiusFull,
    borderWidth: 1.5,
    borderColor: colors.light.primary + '40',
    backgroundColor: colors.light.primaryLight,
  },
  writeReviewText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.light.primary },

  // Gallery
  galleryRow: { gap: 8 },
  galleryItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  galleryImage: {
    width: 100,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Map
  mapTile: {
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.15)',
  },
  mapBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mapGridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(37,99,235,0.1)',
  },
  mapGridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(37,99,235,0.1)',
  },
  mapPin: { alignItems: 'center' },
  mapPinHead: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapPinLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinLogoText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  mapPinTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#2563EB',
    marginTop: -1,
  },
  mapFooter: { alignItems: 'center', gap: 10 },
  mapStoreName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  mapAddress: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginTop: 2 },
  directionsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openMapsBtn: { alignItems: 'center', gap: 4 },
  openMapsBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.light.primary },
});
