import React from 'react';
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
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { categories, products, reviews, stores } from '@/data/mockData';
import RatingStars from '@/components/RatingStars';
import ProductCard from '@/components/ProductCard';
import { getFontFamily } from '@/constants/fonts';
import GlassCard from '@/components/GlassCard';

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

  const fontFamBold = getFontFamily(isRTL, 'bold');
  const fontFamSemi = getFontFamily(isRTL, 'semiBold');
  const fontFamReg = getFontFamily(isRTL, 'regular');
  const latinBold = getFontFamily(false, 'bold');
  const latinReg = getFontFamily(false, 'regular');

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
        contentContainerStyle={{ paddingBottom: bottomInset + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero cover */}
        <Animated.View entering={FadeInUp.delay(50).springify().stiffness(300).damping(28)}>
          <LinearGradient
            colors={store.coverGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: topInset + 8 }]}
          >
            <View style={[styles.heroTopBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Pressable
                onPress={() => router.back()}
                style={styles.backBtn}
              >
                <Ionicons
                  name={isRTL ? 'chevron-forward' : 'chevron-back'}
                  size={24}
                  color="#fff"
                />
              </Pressable>
              <View style={[styles.heroActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                 <Pressable style={styles.heroActionBtn} onPress={handleFavorite}>
                    <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? colors.light.destructive : '#fff'} />
                 </Pressable>
                 <Pressable style={styles.heroActionBtn}>
                    <Ionicons name="share-outline" size={20} color="#fff" />
                 </Pressable>
              </View>
            </View>

            <View style={styles.logoWrap}>
              <View style={[styles.logo, { backgroundColor: store.logoColor }]}>
                <Text style={[styles.logoText, { fontFamily: latinBold }]}>{store.logoInitial}</Text>
              </View>
              {store.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </View>

            <View style={[styles.nameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.storeName, { fontFamily: fontFamBold }]}>{name}</Text>
            </View>

            <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <StatItem value={store.rating.toFixed(1)} label={language === 'ar' ? 'تقييم' : 'Rating'} icon="star" fontFamBold={latinBold} fontFamReg={fontFamReg} />
              <View style={styles.statDivider} />
              <StatItem value={`${(followersCount / 1000).toFixed(1)}k`} label={language === 'ar' ? 'متابع' : 'Followers'} fontFamBold={latinBold} fontFamReg={fontFamReg} />
              <View style={styles.statDivider} />
              <StatItem value={store.reviewsCount.toLocaleString()} label={language === 'ar' ? 'تقييم' : 'Reviews'} fontFamBold={latinBold} fontFamReg={fontFamReg} />
              <View style={styles.statDivider} />
              <StatItem value={`${(store.productsCount / 1000).toFixed(store.productsCount >= 1000 ? 1 : 0)}${store.productsCount >= 1000 ? 'k' : ''}`} label={language === 'ar' ? 'منتج' : 'Products'} fontFamBold={latinBold} fontFamReg={fontFamReg} />
              <View style={styles.statDivider} />
              <View style={[styles.openPill, { backgroundColor: store.isOpen ? 'rgba(47,190,92,0.9)' : 'rgba(138,135,130,0.9)' }]}>
                <View style={styles.openDot} />
                <Text style={[styles.openText, { fontFamily: fontFamSemi }]}>{store.isOpen ? t('openNow') : t('closedNow')}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick contact bar */}
        <Animated.View entering={FadeInUp.delay(100).springify().stiffness(300).damping(28)} style={[styles.contactBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <ContactBtn icon="call" label={language === 'ar' ? 'اتصال' : 'Call'} onPress={handleCall} color={colors.light.success} fontFam={fontFamSemi} />
          <ContactBtn icon="logo-whatsapp" label="WhatsApp" onPress={handleWhatsApp} color="#25D366" fontFam={fontFamSemi} />
          <ContactBtn icon="navigate" label={language === 'ar' ? 'الاتجاهات' : 'Navigate'} onPress={handleMaps} color={colors.light.primary} fontFam={fontFamSemi} />
          <ContactBtn
            icon={isFav ? 'heart' : 'heart-outline'}
            label={language === 'ar' ? 'متابعة' : 'Follow'}
            onPress={handleFavorite}
            color={isFav ? colors.light.destructive : colors.light.mutedForeground}
            fontFam={fontFamSemi}
          />
        </Animated.View>

        {/* Store Information */}
        <Animated.View entering={FadeInUp.delay(150).springify().stiffness(300).damping(28)} style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
            {language === 'ar' ? 'معلومات المتجر' : 'Store Information'}
          </Text>

          {description && (
            <Text style={[styles.descText, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamReg }]}>
              {description}
            </Text>
          )}

          <View style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.infoIcon}>
              <Ionicons name="time-outline" size={20} color={colors.light.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamReg }]}>
                {t('workingHours')}
              </Text>
              <Text style={[styles.infoValue, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamSemi }]}>{hours}</Text>
            </View>
          </View>

          <Pressable
            onPress={handleCopyAddress}
            style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            <View style={styles.infoIcon}>
              <Ionicons name="location-outline" size={20} color={colors.light.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamReg }]}>
                {t('location')}
              </Text>
              <Text style={[styles.infoValue, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamSemi }]}>{address}</Text>
            </View>
            <Ionicons name="copy-outline" size={20} color={colors.light.mutedForeground} />
          </Pressable>

          <View style={[styles.socialRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {store.phone && (
              <Pressable style={[styles.socialChip, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={handleCall}>
                <Ionicons name="call" size={16} color={colors.light.primary} />
                <Text style={[styles.socialChipText, { fontFamily: fontFamSemi }]}>{language === 'ar' ? 'الهاتف' : 'Phone'}</Text>
              </Pressable>
            )}
            {store.whatsapp && (
              <Pressable style={[styles.socialChip, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={handleWhatsApp}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={[styles.socialChipText, { color: '#25D366', fontFamily: latinBold }]}>WhatsApp</Text>
              </Pressable>
            )}
            {store.facebook && (
              <Pressable style={[styles.socialChip, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => handleSocial('facebook')}>
                <Ionicons name="logo-facebook" size={16} color="#1877F2" />
                <Text style={[styles.socialChipText, { color: '#1877F2', fontFamily: latinBold }]}>Facebook</Text>
              </Pressable>
            )}
            {store.instagram && (
              <Pressable style={[styles.socialChip, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => handleSocial('instagram')}>
                <Ionicons name="logo-instagram" size={16} color="#E1306C" />
                <Text style={[styles.socialChipText, { color: '#E1306C', fontFamily: latinBold }]}>Instagram</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Product Categories */}
        {storeCategories.length > 0 && (
          <Animated.View entering={FadeInUp.delay(200).springify().stiffness(300).damping(28)} style={styles.categoriesCard}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
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
                <View key={cat.id} style={[styles.catChip, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.catIconWrap, { backgroundColor: cat.color + '15' }]}>
                     <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                  </View>
                  <Text style={[styles.catChipText, { fontFamily: fontFamSemi }]}>
                    {t(cat.id as any)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Featured Products */}
        {storeProducts.length > 0 && (
          <Animated.View entering={FadeInUp.delay(250).springify().stiffness(300).damping(28)} style={styles.productsSection}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', paddingHorizontal: 16 }]}>
              <Text style={[styles.cardTitle, { marginBottom: 0, textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
                {t('allProducts')}
              </Text>
              <Text style={[styles.productsCount, { fontFamily: fontFamReg }]}>
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
                <View key={product.id} style={{ marginRight: isRTL ? 0 : 16, marginLeft: isRTL ? 16 : 0 }}>
                  <ProductCard
                    product={product}
                    onPress={() => router.push(`/product/${product.id}`)}
                    width={160}
                  />
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Reviews */}
        {storeReviews.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300).springify().stiffness(300).damping(28)} style={styles.card}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.cardTitle, { marginBottom: 0, textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
                {t('storeReviews')}
              </Text>
              <View style={[styles.ratingBig, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Ionicons name="star" size={24} color={colors.light.star} />
                <Text style={[styles.ratingBigText, { fontFamily: latinBold }]}>{store.rating.toFixed(1)}</Text>
              </View>
            </View>
            {storeReviews.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={[styles.reviewHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.reviewAvatar}>
                    <Ionicons name="person" size={20} color={colors.light.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewAuthor, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamSemi }]}>
                      {language === 'ar' ? review.authorAr : review.author}
                    </Text>
                    <Text style={[styles.reviewDate, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamReg }]}>
                      {review.date}
                    </Text>
                  </View>
                  <RatingStars rating={review.rating} size={14} showCount={false} />
                </View>
                <Text style={[styles.reviewText, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamReg }]}>
                  {language === 'ar' ? review.textAr : review.textEn}
                </Text>
              </View>
            ))}
            <Pressable style={[styles.writeReviewBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="create-outline" size={20} color={colors.light.primary} />
              <Text style={[styles.writeReviewText, { fontFamily: fontFamSemi }]}>{t('writeReview')}</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Store Gallery */}
        <Animated.View entering={FadeInUp.delay(350).springify().stiffness(300).damping(28)} style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
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
                  <Ionicons name="image-outline" size={32} color="rgba(255,255,255,0.5)" />
                </LinearGradient>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Map Section (Glass) */}
        <Animated.View entering={FadeInUp.delay(400).springify().stiffness(300).damping(28)} style={[styles.card, { marginBottom: 16, backgroundColor: 'transparent', padding: 0, borderWidth: 0, shadowColor: 'transparent', elevation: 0 }]}>
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', paddingHorizontal: 16, paddingTop: 16 }]}>
            <Text style={[styles.cardTitle, { marginBottom: 0, textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
              {language === 'ar' ? 'الموقع على الخريطة' : 'Map'}
            </Text>
          </View>

          <Pressable onPress={handleMaps} style={styles.mapContainer}>
             {/* Mock map background */}
             <LinearGradient colors={['#E2E8F0', '#CBD5E1']} style={StyleSheet.absoluteFill}>
                 {[0, 1, 2, 3, 4].map((i) => (
                    <View key={`h${i}`} style={[styles.mapGridH, { top: `${i * 25}%` as any }]} />
                 ))}
                 {[0, 1, 2, 3, 4].map((i) => (
                    <View key={`v${i}`} style={[styles.mapGridV, { left: `${i * 25}%` as any }]} />
                 ))}
             </LinearGradient>
             
             {/* Map Pin */}
             <View style={styles.mapPinContainer}>
                <View style={styles.mapPin}>
                  <View style={[styles.mapPinLogo, { backgroundColor: store.logoColor }]}>
                     <Text style={[styles.mapPinLogoText, { fontFamily: latinBold }]}>{store.logoInitial}</Text>
                  </View>
                </View>
                <View style={[styles.mapPinTriangle, { borderTopColor: '#fff' }]} />
             </View>

             {/* Glass Overlay Card */}
             <View style={styles.glassCardWrapper}>
                <GlassCard intensity={80} borderRadius={20} padding={16}>
                   <View style={[styles.glassCardInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={{ flex: 1 }}>
                         <Text style={[styles.glassStoreName, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>{name}</Text>
                         <Text style={[styles.glassStoreAddress, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamReg }]} numberOfLines={1}>{address}</Text>
                      </View>
                      <Pressable style={styles.glassDirectionsBtn} onPress={handleMaps}>
                         <Ionicons name="navigate" size={20} color="#fff" />
                      </Pressable>
                   </View>
                </GlassCard>
             </View>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function StatItem({ value, label, icon, fontFamBold, fontFamReg }: { value: string; label: string; icon?: string, fontFamBold: string, fontFamReg: string }) {
  return (
    <View style={styles.statItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon && <Ionicons name={icon as any} size={14} color={colors.light.star} />}
        <Text style={[styles.statValue, { fontFamily: fontFamBold }]}>{value}</Text>
      </View>
      <Text style={[styles.statLabel, { fontFamily: fontFamReg }]}>{label}</Text>
    </View>
  );
}

function ContactBtn({
  icon,
  label,
  onPress,
  color,
  fontFam
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
  fontFam: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.contactBtn}>
      <View style={[styles.contactBtnIcon, { backgroundColor: color + '15', borderColor: color + '25' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[styles.contactBtnLabel, { fontFamily: fontFam }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  scroll: { flex: 1 },

  hero: {
    alignItems: 'center',
    paddingBottom: 48,
  },
  heroTopBar: {
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  heroActions: {
    gap: 12,
  },
  heroActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoWrap: { position: 'relative', marginBottom: 16 },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
  logoText: { fontSize: 40, color: '#fff' },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.light.verifiedBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  nameRow: { alignItems: 'center', gap: 10, marginBottom: 16 },
  storeName: {
    fontSize: 28,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  statsRow: {
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statItem: { alignItems: 'center', gap: 4 },
  statValue: { fontSize: 16, color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.3)' },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  openDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  openText: { fontSize: 13, color: '#fff' },

  contactBar: {
    backgroundColor: colors.light.card,
    marginHorizontal: 16,
    marginTop: -32,
    borderRadius: colors.radiusXl,
    padding: 16,
    gap: 8,
    shadowColor: colors.light.shadowStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 6,
    zIndex: 10,
    justifyContent: 'space-between',
  },
  contactBtn: { alignItems: 'center', gap: 8, flex: 1 },
  contactBtnIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  contactBtnLabel: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textAlign: 'center',
  },

  card: {
    backgroundColor: colors.light.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: colors.radiusXl,
    padding: 20,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    color: colors.light.foreground,
    marginBottom: 16,
  },
  descText: {
    fontSize: 15,
    color: colors.light.secondaryForeground,
    lineHeight: 24,
    marginBottom: 16,
  },
  infoRow: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: colors.light.foreground,
  },
  socialRow: { gap: 12, flexWrap: 'wrap', paddingTop: 16 },
  socialChip: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.light.cardSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  socialChipText: {
    fontSize: 14,
    color: colors.light.primary,
  },

  categoriesCard: {
    backgroundColor: colors.light.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: colors.radiusXl,
    padding: 20,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  categoriesRow: { gap: 12 },
  catChip: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.light.cardSoft,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catChipText: { fontSize: 14, color: colors.light.foreground },

  productsSection: { marginTop: 24 },
  sectionHeader: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productsCount: {
    fontSize: 14,
  },
  productsRow: { gap: 16 },

  ratingBig: { alignItems: 'center', gap: 8 },
  ratingBigText: { fontSize: 28, color: colors.light.foreground },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    gap: 12,
  },
  reviewHeader: { alignItems: 'center', gap: 12 },
  reviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAuthor: { fontSize: 15, color: colors.light.foreground },
  reviewDate: { fontSize: 13, color: colors.light.mutedForeground, marginTop: 2 },
  reviewText: { fontSize: 15, color: colors.light.secondaryForeground, lineHeight: 22 },
  writeReviewBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: colors.light.primaryLight,
  },
  writeReviewText: { fontSize: 15, color: colors.light.primary },

  galleryRow: { gap: 12 },
  galleryItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  galleryImage: {
    width: 140,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapContainer: {
    height: 220,
    marginHorizontal: 16,
    borderRadius: colors.radiusXl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.2)',
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
  mapPinContainer: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -40 }],
    alignItems: 'center',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapPin: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
  },
  mapPinLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinLogoText: { fontSize: 24, color: '#fff' },
  mapPinTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  glassCardWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  glassCardInner: {
    alignItems: 'center',
    gap: 12,
  },
  glassStoreName: {
    fontSize: 16,
    color: colors.light.foreground,
  },
  glassStoreAddress: {
    fontSize: 13,
    color: colors.light.foreground,
    opacity: 0.8,
    marginTop: 4,
  },
  glassDirectionsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
});
