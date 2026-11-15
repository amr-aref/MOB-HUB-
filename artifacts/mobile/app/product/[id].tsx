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
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/hooks/useLayout';
import {
  useGetProduct,
  useGetStore,
  useGetReservations,
  getGetReservationsQueryKey,
  useCreateReservation,
  useCreateConversation,
} from '@workspace/api-client-react';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useGetProduct(id!);
  const { data: store } = useGetStore(product?.storeId ?? '', {
    query: { enabled: !!product?.storeId },
  });

  const { data: myReservationsRaw = [] } = useGetReservations(
    undefined,
    {
      query: {
        enabled: isAuthenticated,
        queryKey: getGetReservationsQueryKey(),
        staleTime: 15_000,
      },
    },
  );

  const { mutate: createReservation, isPending: reserving } = useCreateReservation({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      },
    },
  });

  const { mutate: createConversation, isPending: creatingConv } = useCreateConversation({
    mutation: {
      onSuccess: (conv) => router.push(`/messages/${conv.id}` as any),
    },
  });

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;
  const isAr = language === 'ar';

  const myActive = myReservationsRaw.find(
    (r) => r.productId === id && (r.status === 'pending' || r.status === 'confirmed'),
  );

  function handleMessageAboutProduct() {
    // buyerId is derived server-side from the authenticated token (user.sub).
    if (!isAuthenticated || !user?.id || !store) return;
    createConversation({
      data: {
        buyerId: user.id,
        storeId: store!.id,
        productId: product!.id,
        productNameAr: product!.nameAr,
        productNameEn: product!.nameEn,
      },
    });
  }

  function handleReserve() {
    if (!product || !isAuthenticated) return;
    createReservation({
      data: {
        productId: product.id,
      },
    });
  }

  function handleCall() {
    const phone = (store as any)?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  }

  if (isLoading || !product) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  const name = isAr ? product.nameAr : product.nameEn;
  const reserveBtn = myActive
    ? { bg: colors.light.muted, label: isAr ? 'محجوز' : 'Reserved', disabled: true }
    : { bg: colors.light.primary, label: isAr ? 'احجز الآن' : 'Reserve now', disabled: reserving || !isAuthenticated };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.light.foreground} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 100 }}>
        <View style={isTablet ? styles.tabletInner : undefined}>
          <View style={[styles.hero, { backgroundColor: (product.imageColor || colors.light.primary) + '22' }]}>
            <Ionicons name="phone-portrait" size={64} color={product.imageColor || colors.light.primary} />
          </View>
          <Text style={[styles.name, { textAlign: isRTL ? 'right' : 'left' }]}>{name}</Text>
          <Text style={[styles.price, { textAlign: isRTL ? 'right' : 'left' }]}>
            {product.price.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}
          </Text>
          {store && (
            <Pressable onPress={() => router.push(`/store/${store.id}` as any)}>
              <Text style={[styles.storeLink, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isAr ? store.nameAr : store.nameEn}
              </Text>
            </Pressable>
          )}
          {(product.descriptionAr || product.descriptionEn) && (
            <Text style={[styles.desc, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isAr ? product.descriptionAr : product.descriptionEn}
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 12, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable style={styles.iconBtn} onPress={handleCall}>
          <Ionicons name="call-outline" size={22} color={colors.light.primary} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={handleMessageAboutProduct} disabled={creatingConv || !isAuthenticated}>
          {creatingConv ? <ActivityIndicator size="small" color={colors.light.primary} /> : <Ionicons name="chatbubble-outline" size={22} color={colors.light.primary} />}
        </Pressable>
        <Pressable
          style={[styles.reserveBtn, { backgroundColor: reserveBtn.bg, opacity: reserveBtn.disabled ? 0.6 : 1 }]}
          onPress={handleReserve}
          disabled={reserveBtn.disabled}
        >
          {reserving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.reserveBtnText}>{reserveBtn.label}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  tabletInner: { maxWidth: 680, alignSelf: 'center', width: '100%' },
  header: { backgroundColor: colors.light.card, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  headerRow: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.muted },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.light.foreground, textAlign: 'center' },
  hero: { height: 200, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  name: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.light.foreground, marginBottom: 6 },
  price: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.light.primary, marginBottom: 8 },
  storeLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.light.primary, marginBottom: 12 },
  desc: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, lineHeight: 22 },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 16, paddingTop: 12, gap: 10,
    backgroundColor: colors.light.card, borderTopWidth: 1, borderTopColor: colors.light.border,
    alignItems: 'center',
  },
  iconBtn: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.light.border,
  },
  reserveBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  reserveBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
