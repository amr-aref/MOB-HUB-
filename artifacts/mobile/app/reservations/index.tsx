import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLayout } from '@/hooks/useLayout';
import { useGetReservations, getGetReservationsQueryKey } from '@workspace/api-client-react';
import type { ReservationDto } from '@workspace/api-client-react';

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pending:   { color: colors.light.warning,        bg: colors.light.warningLight,  icon: 'time-outline' },
  confirmed: { color: colors.light.success,        bg: colors.light.successLight,  icon: 'checkmark-circle-outline' },
  declined:  { color: colors.light.destructive,    bg: '#FEE2E2',                  icon: 'close-circle-outline' },
  cancelled: { color: colors.light.mutedForeground,bg: colors.light.muted,         icon: 'ban-outline' },
  completed: { color: colors.light.verifiedBlue,   bg: '#EFF6FF',                  icon: 'checkmark-done-circle-outline' },
  expired:   { color: colors.light.mutedForeground,bg: colors.light.muted,         icon: 'alert-circle-outline' },
};

const STATUS_LABEL_AR: Record<string, string> = {
  pending: 'قيد الانتظار', confirmed: 'مؤكد', declined: 'مرفوض',
  cancelled: 'ملغى', completed: 'مكتمل', expired: 'منتهي',
};
const STATUS_LABEL_EN: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', declined: 'Declined',
  cancelled: 'Cancelled', completed: 'Completed', expired: 'Expired',
};

const FILTER_TABS: { key: string; ar: string; en: string }[] = [
  { key: 'all',       ar: 'الكل',          en: 'All' },
  { key: 'pending',   ar: 'قيد الانتظار', en: 'Pending' },
  { key: 'confirmed', ar: 'مؤكد',          en: 'Confirmed' },
  { key: 'cancelled', ar: 'ملغى',          en: 'Cancelled' },
  { key: 'completed', ar: 'مكتمل',         en: 'Completed' },
];

function formatDate(iso: string, isAr: boolean): string {
  const d = new Date(iso);
  const day = d.getDate();
  const monthsAr = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const monthsEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const month = isAr ? monthsAr[d.getMonth()] : monthsEn[d.getMonth()];
  const year = d.getFullYear();
  return isAr ? `${day} ${month} ${year}` : `${month} ${day}, ${year}`;
}

function formatPrice(price: number, isAr: boolean): string {
  const formatted = price.toLocaleString(isAr ? 'ar-EG' : 'en-US');
  return isAr ? `${formatted} ج.م` : `EGP ${formatted}`;
}

// ─── Reservation card ────────────────────────────────────────────────────────

function ReservationCard({
  item,
  isRTL,
  language,
  onPress,
}: {
  item: ReservationDto;
  isRTL: boolean;
  language: string;
  onPress: () => void;
}) {
  const status = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
  const label = language === 'ar'
    ? (STATUS_LABEL_AR[item.status] ?? item.status)
    : (STATUS_LABEL_EN[item.status] ?? item.status);

  return (
    <Pressable
      style={[styles.card, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      onPress={onPress}
    >
      <View style={[styles.productCircle, { backgroundColor: item.product.imageColor + '22', borderColor: item.product.imageColor + '44' }]}>
        <Ionicons name="phone-portrait-outline" size={22} color={item.product.imageColor} />
      </View>

      <View style={{ flex: 1, marginHorizontal: 12 }}>
        <Text style={[styles.productName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
          {language === 'ar' ? item.product.nameAr : item.product.nameEn}
        </Text>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
          <View style={[styles.storeDot, { backgroundColor: item.store.logoColor }]}>
            <Text style={styles.storeDotText}>{item.store.logoInitial}</Text>
          </View>
          <Text style={[styles.storeName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {language === 'ar' ? item.store.nameAr : item.store.nameEn}
          </Text>
        </View>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Text style={styles.price}>{formatPrice(item.product.price, language === 'ar')}</Text>
          <Text style={styles.dateText}>{formatDate(item.createdAt, language === 'ar')}</Text>
        </View>
        {item.status === 'pending' && (
          <Text style={[styles.expiryText, { textAlign: isRTL ? 'right' : 'left', marginTop: 2 }]}>
            {language === 'ar' ? 'ينتهي: ' : 'Expires: '}{formatDate(item.expiresAt, language === 'ar')}
          </Text>
        )}
      </View>

      <View style={[styles.statusBadge, { backgroundColor: status.bg, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Ionicons name={status.icon} size={12} color={status.color} />
        <Text style={[styles.statusText, { color: status.color }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ReservationsScreen() {
  const { isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();

  const [activeFilter, setActiveFilter] = useState('all');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const listParams = activeFilter !== 'all' ? { status: activeFilter } : undefined;
  const { data: reservations = [], isLoading, refetch } = useGetReservations(
    listParams,
    { query: { queryKey: getGetReservationsQueryKey(listParams), staleTime: 20_000 } },
  );

  const loading = isLoading;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={isTablet ? styles.tabletInner : undefined}>
          <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons
                name={isRTL ? 'chevron-forward' : 'chevron-back'}
                size={22}
                color={colors.light.foreground}
              />
            </Pressable>
            <Text style={styles.headerTitle}>
              {language === 'ar' ? 'حجوزاتي' : 'My Reservations'}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.tabs, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            {FILTER_TABS.map((tab) => {
              const active = activeFilter === tab.key;
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setActiveFilter(tab.key)}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {language === 'ar' ? tab.ar : tab.en}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.light.primary} />
        </View>
      ) : reservations.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="bookmark-outline" size={40} color={colors.light.mutedForeground} />
          </View>
          <Text style={styles.emptyTitle}>
            {language === 'ar' ? 'لا توجد حجوزات' : 'No reservations yet'}
          </Text>
          <Text style={styles.emptyHint}>
            {language === 'ar'
              ? 'احجز جهازاً من صفحة المنتج ليظهر هنا'
              : 'Reserve a device from a product page to see it here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 24 }]}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} tintColor={colors.light.primary} />
          }
          renderItem={({ item }) => (
            <ReservationCard
              item={item}
              isRTL={isRTL}
              language={language}
              onPress={() => router.push({ pathname: '/reservations/[id]', params: { id: item.id } } as any)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  tabletInner: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: {
    backgroundColor: colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    paddingBottom: 8,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  tabs: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: colors.radiusFull,
    backgroundColor: colors.light.muted,
  },
  tabActive: {
    backgroundColor: colors.light.primary,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.light.mutedForeground,
  },
  tabTextActive: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
  },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    textAlign: 'center',
  },

  list: { padding: 16, gap: 10 },

  card: {
    backgroundColor: colors.light.card,
    borderRadius: colors.radiusLg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.light.border,
    ...colors.light.shadowSm,
  },
  productCircle: {
    width: 52,
    height: 52,
    borderRadius: colors.radiusMd,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  storeDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeDotText: { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#fff' },
  storeName: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    flex: 1,
  },
  price: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  dateText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
  },
  expiryText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: colors.light.warning,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: colors.radiusFull,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
});
