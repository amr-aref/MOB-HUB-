/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import {
  useGetProduct,
  useGetStore,
  useGetProducts,
  useCreateConversation,
  useCreateReservation,
  useGetReservations,
  getGetReservationsQueryKey,
  getGetStoreQueryKey,
} from '@workspace/api-client-react';
import { useDeviceId } from '@/hooks/useDeviceId';
import { useLayout } from '@/hooks/useLayout';

const STATUS_META: Record<string, {
  bg: string; fg: string; icon: any; ar: string; en: string;
}> = {
  pending:   { bg: '#FEF3C7', fg: '#D97706', icon: 'time-outline',                  ar: 'قيد الانتظار', en: 'Pending' },
  confirmed: { bg: '#D1FAE5', fg: '#059669', icon: 'checkmark-circle-outline',      ar: 'محجوز',         en: 'Reserved' },
  completed: { bg: '#EFF6FF', fg: '#2563EB', icon: 'checkmark-done-circle-outline', ar: 'تم الاستلام',   en: 'Completed' },
  cancelled: { bg: '#F3F4F6', fg: '#6B7280', icon: 'ban-outline',                   ar: 'ملغى',          en: 'Cancelled' },
  declined:  { bg: '#FEE2E2', fg: '#DC2626', icon: 'close-circle-outline',          ar: 'مرفوض',         en: 'Declined' },
  expired:   { bg: '#F3F4F6', fg: '#6B7280', icon: 'alert-circle-outline',          ar: 'منتهي',         en: 'Expired' },
};

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isProductFavorite, toggleFavoriteProduct } = useFavorites();
  const { isTablet } = useLayout();

  const { data: product, isLoading: loadingProduct } = useGetProduct(id!);
  const { data: store } = useGetStore(product?.storeId ?? '', {
    query: {
      enabled: !!product?.storeId,
      queryKey: getGetStoreQueryKey(product?.storeId ?? ''),
    },
  });
  const { data: relatedProductsData = [] } = useGetProducts(
    { category: product?.category ?? '', excludeId: id },
    { query: { enabled: !!product?.category, queryKey: ['getProducts', product?.category ?? ''] } },
  );

  // Hooks must be called unconditionally — before any early return
  const deviceId = useDeviceId();
  const queryClient = useQueryClient();

  // Fetch current user's reservations (identity comes from the auth token)
  const { data: myReservationsRaw = [] } = useGetReservations(
    undefined,
    { query: { queryKey: getGetReservationsQueryKey(undefined), staleTime: 30_000 } },
  );
  const myReservations = myReservationsRaw as Array<{ id: string; productId: string; status: string; conversationId?: string | null }>;

  const { mutate: createReservation, isPending: reserving } = useCreateReservation({
    mutation: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSuccess: (reservation: any) => {
        queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
        // Navigate directly to the conversation auto-created with the reservation
        if (reservation?.conversationId) {
          router.push(`/messages/${reservation.conversationId}` as any);
        } else {
          router.push({ pathname: '/reservations/[id]' as any, params: { id: reservation.id } });
        }
      },
      onError: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      },
    },
  });

  const { mutate: createConversation, isPending: creatingConv } = useCreateConversation({
    mutation: {
      onSuccess: (conv) => router.push(`/messages/${conv.id}` as any),
    },
  });

  if (loadingProduct || !product) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  const myReservation = myReservations.find((r) => r.productId === product.id && !['cancelled', 'declined', 'expired'].includes(r.status));

  const reserveBtn = (() => {
    if (!myReservation) {
      return { labelAr: 'احجز الآن', labelEn: 'Reserve Now', icon: 'bookmark-outline' as any, bg: '#2B2B2E', fg: '#fff', action: handleReserve, disabled: reserving, loading: reserving };
    }
    switch (myReservation.status) {
      case 'pending':
        return { labelAr: 'في انتظار التأكيد', labelEn: 'Awaiting Confirmation', icon: 'time-outline' as any, bg: '#FEF3C7', fg: '#D97706', action: () => router.push({ pathname: '/reservations/[id]' as any, params: { id: myReservation.id } }), disabled: false, loading: false };
      case 'confirmed':
        return { labelAr: 'محجوز',               labelEn: 'Reserved',              icon: 'checkmark-circle-outline' as any,      bg: '#D1FAE5', fg: '#059669', action: () => router.push({ pathname: '/reservations/[id]' as any, params: { id: myReservation.id } }), disabled: false, loading: false };
      case 'completed':
        return { labelAr: 'تم الاستلام',         labelEn: 'Reservation Completed', icon: 'checkmark-done-circle-outline' as any, bg: '#EFF6FF', fg: '#2563EB', action: () => router.push({ pathname: '/reservations/[id]' as any, params: { id: myReservation.id } }), disabled: false, loading: false };
      case 'expired':
        return { labelAr: 'انتهى الحجز',         labelEn: 'Reservation Expired',   icon: 'alert-circle-outline' as any,          bg: '#F3F4F6', fg: '#6B7280', action: handleReserve, disabled: reserving, loading: reserving };
      default: // cancelled | declined
        return { labelAr: 'احجز مجدداً',         labelEn: 'Reserve Again',         icon: 'refresh-outline' as any,               bg: '#2B2B2E', fg: '#fff',    action: handleReserve, disabled: reserving, loading: reserving };
    }
  })();

  const relatedProducts = relatedProductsData.slice(0, 4);

  function handleWhatsApp() {
    if (!store) return;
    const num = store.whatsapp?.replace(/[^0-9]/g, '') ?? store.phone?.replace(/[^0-9]/g, '');
    if (!num) return;
    const msg = encodeURIComponent(
      language === 'ar'
        ? `مرحباً، أنا مهتم بـ ${product!.nameAr}`
        : `Hi, I'm interested in ${product!.nameEn}`,
    );
    Linking.openURL(`https://wa.me/${num}?text=${msg}`);
  }

  function handleMessageAboutProduct() {
    if (!deviceId || !store) return;
    createConversation({
      data: {
        buyerId: deviceId,
        storeId: store!.id,
        productId: product!.id,
        productNameAr: product!.nameAr,
        productNameEn: product!.nameEn,
      },
    });
  }

  function handleReserve() {
    if (!product) return;
    // buyerId is derived server-side from the authenticated token
    createReservation({ id: product!.id, data: {} as any });
  }

  function handleCall(storeOverride?: any) {
    const targetStore = storeOverride ?? store;
    if (!targetStore) return;
    Linking.openURL(`tel:${targetStore.phone}`);
  }

  // Mock color names
  const colorNames = ['أسود فانتوم', 'فضي جليدي', 'أزرق سماوي', 'أخضر غابة'];
  const colorNamesEn = ['Phantom Black', 'Glacier Silver', 'Sky Blue', 'Forest Green'];

  const specItems = [
    { icon: 'phone-portrait', label: language === 'ar' ? 'الشاشة' : 'Display', value: '6.8", QHD+, 144Hz, 2600 nits', expandable: true },
    { icon: 'hardware-chip', label: language === 'ar' ? 'المعالج' : 'Processor', value: product.brand === 'Apple' ? 'Apple A18 Pro' : 'Snapdragon 8 Gen 4', expandable: true },
    { icon: 'server', label: language === 'ar' ? 'الذاكرة' : 'RAM', value: product.ram?.join(' / ') ?? '8GB', expandable: true },
    { icon: 'camera', label: language === 'ar' ? 'الكاميرا' : 'Camera', value: '200MP Wide, 50MP UW, 12MP Telephoto', expandable: true },
    { icon: 'battery-full', label: language === 'ar' ? 'البطارية' : 'Battery', value: '5500mAh, 120W, 50W Wireless', expandable: true },
    { icon: 'shield-checkmark', label: language === 'ar' ? 'الأمان' : 'Security', value: 'Under-display fingerprint, Face ID', expandable: true },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Image area */}
        <View style={[styles.imageArea, { paddingTop: Platform.OS === 'web' ? 67 : insets.top }]}>
          <View style={[styles.imageCircle, { backgroundColor: (product as any).imageColor + '22' }]}>
            <Ionicons name="phone-portrait-outline" size={80} color={(product as any).imageColor ?? colors.light.primary} />
          </View>
          <Pressable style={[styles.backBtnAbs, { top: (Platform.OS === 'web' ? 67 : insets.top) + 8, left: isRTL ? undefined : 16, right: isRTL ? 16 : undefined }]} onPress={() => router.back()}>
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.light.foreground} />
          </Pressable>
          <Pressable style={[styles.favBtnAbs, { top: (Platform.OS === 'web' ? 67 : insets.top) + 8, right: isRTL ? undefined : 16, left: isRTL ? 16 : undefined }]} onPress={() => toggleFavoriteProduct(product.id)}>
            <Ionicons name={isProductFavorite(product.id) ? 'heart' : 'heart-outline'} size={22} color={isProductFavorite(product.id) ? colors.light.destructive : colors.light.foreground} />
          </Pressable>
        </View>

        <View style={[styles.body, isTablet && styles.tabletInner]}>
          {/* Title */}
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? product.nameAr : product.nameEn}
          </Text>
          <Text style={[styles.price, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? `${product.price.toLocaleString('ar-EG')} ج.م` : `EGP ${product.price.toLocaleString('en-US')}`}
          </Text>

          {/* Store row */}
          {store && (
            <Pressable style={[styles.storeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => router.push(`/store/${store.id}` as any)}>
              <View style={[styles.storeLogo, { backgroundColor: (store as any).logoColor ?? colors.light.primary }]}>
                <Text style={styles.storeLogoText}>{(store as any).logoInitial ?? store.nameEn?.[0]}</Text>
              </View>
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text style={[styles.storeName, { textAlign: isRTL ? 'right' : 'left' }]}>{language === 'ar' ? store.nameAr : store.nameEn}</Text>
                <Text style={[styles.storeMeta, { textAlign: isRTL ? 'right' : 'left' }]}>{store.city} · {store.rating?.toFixed(1) ?? '—'} ★</Text>
              </View>
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.light.mutedForeground} />
            </Pressable>
          )}

          {/* Specs */}
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{language === 'ar' ? 'المواصفات' : 'Specifications'}</Text>
          {specItems.map((s, i) => (
            <View key={i} style={[styles.specRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name={s.icon as any} size={18} color={colors.light.primary} />
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text style={[styles.specLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{s.label}</Text>
                <Text style={[styles.specValue, { textAlign: isRTL ? 'right' : 'left' }]}>{s.value}</Text>
              </View>
            </View>
          ))}

          {/* Related */}
          {relatedProducts.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', marginTop: 20 }]}>{language === 'ar' ? 'منتجات مشابهة' : 'Related products'}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                {relatedProducts.map((p: any) => (
                  <Pressable key={p.id} style={styles.relatedCard} onPress={() => router.push(`/product/${p.id}` as any)}>
                    <View style={[styles.relatedImg, { backgroundColor: (p.imageColor ?? '#ccc') + '22' }]}>
                      <Ionicons name="phone-portrait-outline" size={28} color={p.imageColor ?? colors.light.primary} />
                    </View>
                    <Text style={styles.relatedName} numberOfLines={2}>{language === 'ar' ? p.nameAr : p.nameEn}</Text>
                    <Text style={styles.relatedPrice}>{language === 'ar' ? `${p.price.toLocaleString('ar-EG')} ج.م` : `EGP ${p.price.toLocaleString()}`}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 8, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable style={styles.iconBtn} onPress={handleWhatsApp}>
          <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={() => handleCall()}>
          <Ionicons name="call-outline" size={22} color={colors.light.primary} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={handleMessageAboutProduct} disabled={creatingConv}>
          {creatingConv ? <ActivityIndicator size="small" color={colors.light.primary} /> : <Ionicons name="chatbubble-outline" size={22} color={colors.light.primary} />}
        </Pressable>
        <Pressable
          style={[styles.reserveBtn, { backgroundColor: reserveBtn.bg, opacity: reserveBtn.disabled ? 0.6 : 1 }]}
          onPress={reserveBtn.action}
          disabled={reserveBtn.disabled}
        >
          {reserveBtn.loading ? (
            <ActivityIndicator color={reserveBtn.fg} />
          ) : (
            <>
              <Ionicons name={reserveBtn.icon} size={18} color={reserveBtn.fg} />
              <Text style={[styles.reserveBtnText, { color: reserveBtn.fg }]}>{language === 'ar' ? reserveBtn.labelAr : reserveBtn.labelEn}</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  tabletInner: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  imageArea: { height: 280, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.card },
  imageCircle: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  backBtnAbs: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: colors.light.card, alignItems: 'center', justifyContent: 'center', ...colors.light.shadowSm },
  favBtnAbs: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: colors.light.card, alignItems: 'center', justifyContent: 'center', ...colors.light.shadowSm },
  body: { padding: 16 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.light.foreground, marginBottom: 4 },
  price: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.light.primary, marginBottom: 16 },
  storeRow: { alignItems: 'center', backgroundColor: colors.light.card, borderRadius: colors.radiusLg, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.light.border },
  storeLogo: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  storeLogoText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
  storeName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground },
  storeMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.light.foreground, marginBottom: 12 },
  specRow: { alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  specLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },
  specValue: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.light.foreground },
  relatedCard: { width: 120 },
  relatedImg: { width: 120, height: 100, borderRadius: colors.radiusMd, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  relatedName: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.light.foreground },
  relatedPrice: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.light.primary },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.light.card, borderTopWidth: 1, borderTopColor: colors.light.border, paddingHorizontal: 12, paddingTop: 10, alignItems: 'center', gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.light.muted, alignItems: 'center', justifyContent: 'center' },
  reserveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: colors.radiusFull, paddingHorizontal: 16 },
  reserveBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});
