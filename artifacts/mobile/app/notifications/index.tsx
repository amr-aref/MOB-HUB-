import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLayout } from '@/hooks/useLayout';
import { useDeviceId } from '@/hooks/useDeviceId';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationDto } from '@workspace/api-client-react';

type IconMeta = { icon: keyof typeof Ionicons.glyphMap; color: string };

const NOTIFICATION_ICONS: Record<string, IconMeta> = {
  new_message: { icon: 'chatbubble-ellipses', color: '#3E8BFF' },
  new_order: { icon: 'cart', color: '#2FBE5C' },
  order_status_updated: { icon: 'sync-circle', color: '#2FBE5C' },
  review_received: { icon: 'star', color: '#FFC94A' },
  product_approved: { icon: 'checkmark-circle', color: '#2FBE5C' },
  product_rejected: { icon: 'close-circle', color: '#FF4D4D' },
  store_follow: { icon: 'person-add', color: '#7C3AED' },
  favorite_price_change: { icon: 'trending-down', color: '#DC2626' },
  promotional_campaign: { icon: 'pricetag', color: '#D97706' },
  system_announcement: { icon: 'megaphone', color: colors.light.primary },
  // Reservation lifecycle
  reservation_created:   { icon: 'bookmark',               color: colors.light.primary },
  reservation_confirmed: { icon: 'checkmark-circle',        color: '#2FBE5C' },
  reservation_declined:  { icon: 'close-circle',            color: '#FF4D4D' },
  reservation_cancelled: { icon: 'ban',                     color: '#8A8782' },
  reservation_completed: { icon: 'checkmark-done-circle',   color: '#3E8BFF' },
};

const DEFAULT_ICON: IconMeta = { icon: 'notifications', color: colors.light.primary };

function timeAgo(iso: string, isAr: boolean): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  if (mins < 60) return isAr ? `منذ ${mins} د` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return isAr ? `منذ ${hours} س` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return isAr ? `منذ ${days} يوم` : `${days}d ago`;
}

export default function NotificationsScreen() {
  const { isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();
  const params = useLocalSearchParams<{ userId?: string }>();
  const deviceId = useDeviceId();

  // Screen is shared by buyer (Home/Profile) and seller (Dashboard) entry
  // points: whichever passes ?userId= wins, otherwise fall back to the
  // buyer's own device identity once it has loaded.
  const userId = params.userId ?? deviceId ?? undefined;

  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    isRefetching,
    refetch,
    markRead,
    markAllRead,
    remove,
  } = useNotifications(userId);

  const isAr = language === 'ar';
  const topInset = isTablet ? 24 : (Platform.OS === 'web' ? 67 : insets.top);

  const sorted = useMemo(
    () => [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications],
  );

  const handlePress = (item: NotificationDto) => {
    if (!item.readStatus) markRead(item.id);
    // Deep-link into reservation or conversation based on notification metadata
    const meta = (item.metadata ?? {}) as Record<string, string>;
    if (meta.reservationId) {
      router.push({ pathname: '/reservations/[id]' as any, params: { id: meta.reservationId } });
    } else if (meta.conversationId) {
      router.push(`/messages/${meta.conversationId}` as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View
          style={[
            styles.headerRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
            isTablet && styles.tabletCentered,
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={isAr ? 'رجوع' : 'Go back'}
            accessibilityHint={isAr ? 'العودة للشاشة السابقة' : 'Navigate to previous screen'}
            hitSlop={12}
          >
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={colors.light.foreground}
            />
          </Pressable>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isAr ? 'الإشعارات' : 'Notifications'}
            </Text>
            {unreadCount > 0 && (
              <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isAr ? `${unreadCount} غير مقروءة` : `${unreadCount} unread`}
              </Text>
            )}
          </View>
          {unreadCount > 0 ? (
            <Pressable
              onPress={markAllRead}
              style={styles.markAllBtn}
              accessibilityRole="button"
              accessibilityLabel={isAr ? 'تحديد الكل كمقروء' : 'Mark all as read'}
            >
              <Text style={styles.markAllText}>{isAr ? 'قراءة الكل' : 'Mark all read'}</Text>
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.light.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={44} color={colors.light.mutedForeground} />
          <Text style={styles.errorTitle}>
            {isAr ? 'تعذّر تحميل الإشعارات' : 'Couldn\u2019t load notifications'}
          </Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>{isAr ? 'إعادة المحاولة' : 'Retry'}</Text>
          </Pressable>
        </View>
      ) : sorted.length === 0 ? (
        <View style={[styles.centerState, isTablet && styles.tabletScrollContent]}>
          <View style={styles.emptyIconOuter}>
            <View style={styles.emptyIconInner}>
              <Ionicons name="notifications-outline" size={44} color={colors.light.primary} />
            </View>
          </View>
          <Text style={[styles.emptyTitle, { textAlign: 'center' }]}>
            {isAr ? 'لا توجد إشعارات' : 'No Notifications Yet'}
          </Text>
          <Text style={[styles.emptySubtitle, { textAlign: 'center' }]}>
            {isAr
              ? 'ستظهر هنا تنبيهات الطلبات والرسائل والعروض وتحديثات المتاجر'
              : 'Order, message, offer, and store updates will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, isTablet && styles.tabletScrollContent]}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => {
            const meta = NOTIFICATION_ICONS[item.type] ?? DEFAULT_ICON;
            return (
              <View
                style={[styles.card, !item.readStatus && styles.cardUnread, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              >
                <Pressable
                  onPress={() => handlePress(item)}
                  style={[{ flex: 1, flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12 }]}
                  accessibilityRole="button"
                >
                  <View style={[styles.cardIconWrap, { backgroundColor: `${meta.color}1A` }]}>
                    <Ionicons name={meta.icon} size={20} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.cardTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text
                        style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}
                        numberOfLines={1}
                      >
                        {isAr ? item.titleAr : item.titleEn}
                      </Text>
                      {!item.readStatus && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={[styles.cardBody, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
                      {isAr ? item.bodyAr : item.bodyEn}
                    </Text>
                    <Text style={[styles.cardTime, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {timeAgo(item.createdAt, isAr)}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => remove(item.id)}
                  hitSlop={10}
                  style={styles.deleteBtn}
                  accessibilityRole="button"
                  accessibilityLabel={isAr ? 'حذف الإشعار' : 'Delete notification'}
                >
                  <Ionicons name="close" size={16} color={colors.light.mutedForeground} />
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    alignItems: 'center',
  },
  tabletCentered: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.light.primary,
    marginTop: 2,
  },
  headerSpacer: { width: 38 },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.light.primaryLight,
  },
  markAllText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.primary,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  errorTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
    marginTop: 16,
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.light.primary,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },

  listContent: { padding: 16, paddingBottom: 40, gap: 10 },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: 'rgba(15,23,42,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: colors.light.primaryLight,
    backgroundColor: '#FAFCFF',
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleRow: {
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
    flexShrink: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.light.primary,
  },
  cardBody: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    lineHeight: 19,
    marginTop: 3,
  },
  cardTime: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    marginTop: 6,
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyIconOuter: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  emptyIconInner: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    lineHeight: 23,
  },
});
