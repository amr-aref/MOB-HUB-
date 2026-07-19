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
import { useDeviceId } from '@/hooks/useDeviceId';
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
  return isAr
    ? `${day} ${monthsAr[d.getMonth()]}`
    : `${monthsEn[d.getMonth()]} ${day}`;
}

function formatExpiry(iso: string, isAr: boolean): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return isAr ? 'انتهى' : 'Expired';
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return isAr ? `${hours} س` : `${hours}h left`;
  const days = Math.floor(hours / 24);
  return isAr ? `${days} يوم` : `${days}d left`;
}

// ─── Card component ───────────────────────────────────────────────────────────

function ReservationCard({
  item,
  isRTL,
  language,
  onPress,
}: {
  item: ReservationDto;
  isRTL: boolean;
  language: 'ar' | 'en';
  onPress: () => void;
}) {
  const st = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
  const productName = language === 'ar' ? item.product.nameAr : item.product.nameEn;
  const storeName   = language === 'ar' ? item.store.nameAr   : item.store.nameEn;
  const statusLabel = language === 'ar' ? STATUS_LABEL_AR[item.status] : STATUS_LABEL_EN[item.status];
  const isActive    = item.status === 'pending' || item.status === 'confirmed';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      {/* Left: product color circle */}
      <View style={[styles.productCircle, { backgroundColor: item.product.imageColor + '22', borderColor: item.product.imageColor + '44' }]}>
        <Ionicons name="phone-portrait" size={22} color={item.product.imageColor} />
      </View>

      {/* Middle: info */}
      <View style={{ flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
        <Text style={[styles.productName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
          {productName}
        </Text>
        <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4, marginTop: 2 }]}>
          <View style={[styles.storeDot, { backgroundColor: item.store.logoColor }]}>
            <Text style={styles.storeDotText}>{item.store.logoInitial}</Text>
          </View>
          <Text style={styles.storeName} numberOfLines={1}>{storeName}</Text>
        </View>
        <Text style={[styles.price, { textAlign: isRTL ? 'right' : 'left', marginTop: 4 }]}>
          {item.product.price.toLocaleString()} {language === 'ar' ? 'ج.م' : 'EGP'}
        </Text>
        <Text style={[styles.dateText, { textAlign: isRTL ? 'right' : 'left' }]}>
          {language === 'ar' ? 'تاريخ الحجز: ' : 'Reserved: '}{formatDate(item.createdAt, language === 'ar')}
        </Text>
        {isActive && item.expiresAt && (
          <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4, marginTop: 2 }]}>
            <Ionicons name="timer-outline" size={11} color={colors.light.warning} />
            <Text style={styles.expiryText}>
              {language === 'ar' ? 'ينتهي: ' : 'Expires: '}{formatExpiry(item.expiresAt, language === 'ar')}
            </Text>
          </View>
        )}
      </View>

      {/* Right: status badge + chevron */}
      <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 6 }}>
        <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
          <Ionicons name={st.icon} size={11} color={st.color} />
          <Text style={[styles.statusText, { color: st.color }]}>{statusLabel}</Text>
        </View>
        <Ionicons
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={16}
          color={colors.light.mutedForeground}
        />
      </View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MyReservationsScreen() {
  const { isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();
  const deviceId = useDeviceId();

  const [activeFilter, setActiveFilter] = useState('all');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const { data: reservations = [], isLoading, refetch } = useGetReservations(
    deviceId ? { buyerId: deviceId, ...(activeFilter !== 'all' ? { status: activeFilter } : {}) } : undefined,
    { query: { queryKey: getGetReservationsQueryKey(deviceId ? { buyerId: deviceId, ...(activeFilter !== 'all' ? { status: activeFilter } : {}) } : undefined), enabled: !!deviceId, staleTime: 20_000 } },
  );

  const loading = !deviceId || isLoading;

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
            <View style={{ width: 40 }} />
          </View>

          {/* Filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.tabs, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            {FILTER_TABS.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveFilter(tab.key)}
                style={[styles.tab, activeFilter === tab.key && styles.tabActive]}
              >
                <Text style={[styles.tabText, activeFilter === tab.key && styles.tabTextActive]}>
                  {language === 'ar' ? tab.ar : tab.en}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* List */}
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
            {language === 'ar' ? 'احجز منتجاً لتظهر هنا' : 'Reserve a product to see it here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomInset + 24, alignItems: isTablet ? 'center' : undefined },
          ]}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.light.primary} />
          }
          renderItem={({ item }) => (
            <View style={isTablet ? styles.tabletInner : { width: '100%' }}>
              <ReservationCard
                item={item}
                isRTL={isRTL}
                language={language}
                onPress={() => router.push({
                  pathname: '/reservations/[id]' as any,
                  params: { id: item.id },
                })}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  tabletInner: { width: '100%', maxWidth: 680, alignSelf: 'center' },

  header: {
    backgroundColor: colors.light.card,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    ...colors.light.shadowSm,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.muted,
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
