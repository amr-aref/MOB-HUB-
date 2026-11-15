/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
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
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/hooks/useLayout';
import {
  useGetStore,
  useGetProducts,
  useGetDashboardStats,
  useGetDashboardOrders,
  useGetDashboardMessages,
  useGetDashboardReviews,
  useGetConversations,
} from '@workspace/api-client-react';
import { useNotifications } from '@/hooks/useNotifications';

const QUICK_ACTIONS = [
  { labelAr: 'إضافة منتج', labelEn: 'Add Product', icon: 'add-circle-outline' as const, color: '#2563EB', route: '/dashboard/add-product' },
  { labelAr: 'الحجوزات', labelEn: 'Reservations', icon: 'calendar-outline' as const, color: '#059669', route: '/dashboard/reservations' },
  { labelAr: 'المنتجات', labelEn: 'Products', icon: 'cube-outline' as const, color: '#7C3AED', route: '/dashboard/products' },
  { labelAr: 'الرسائل', labelEn: 'Messages', icon: 'mail-outline' as const, color: '#DC2626', route: '/messages' },
];

export default function DashboardScreen() {
  const { language, isRTL } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isTablet } = useLayout();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const storeId = user?.storeId?.trim() || undefined;
  const { unreadCount } = useNotifications(user?.id);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;
  const isAr = language === 'ar';

  const { data: storeData, isLoading: storeLoading } = useGetStore(storeId ?? '', {
    query: { enabled: Boolean(storeId) },
  });
  const { data: storeProducts = [], isLoading: productsLoading } = useGetProducts(
    { storeId: storeId ?? '' },
    { query: { enabled: Boolean(storeId) } },
  );
  const { data: stats } = useGetDashboardStats(
    { storeId: storeId ?? '' },
    { query: { enabled: Boolean(storeId) } },
  );
  const { data: orders = [] } = useGetDashboardOrders(
    { storeId: storeId ?? '' },
    { query: { enabled: Boolean(storeId) } },
  );
  const { data: messages = [] } = useGetDashboardMessages(
    { storeId: storeId ?? '' },
    { query: { enabled: Boolean(storeId) } },
  );
  const { data: reviews = [] } = useGetDashboardReviews(
    { storeId: storeId ?? '' },
    { query: { enabled: Boolean(storeId) } },
  );
  const { data: conversations = [] } = useGetConversations(
    { storeId: storeId ?? '' },
    { query: { enabled: Boolean(storeId) } },
  );

  if (authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.light.mutedForeground} />
        <Text style={styles.emptyTitle}>{isAr ? 'يلزم تسجيل الدخول' : 'Login required'}</Text>
        <Text style={styles.emptyHint}>
          {isAr ? 'سجّل دخولك كحساب تاجر للوصول إلى لوحة التحكم' : 'Sign in with a merchant account to open the dashboard'}
        </Text>
      </View>
    );
  }

  if (!storeId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="storefront-outline" size={40} color={colors.light.mutedForeground} />
        <Text style={styles.emptyTitle}>{isAr ? 'لا يوجد متجر مرتبط' : 'No store linked'}</Text>
        <Text style={styles.emptyHint}>
          {isAr ? 'حسابك غير مرتبط بأي متجر. تواصل مع الإدارة.' : 'Your account is not linked to any store. Contact support.'}
        </Text>
      </View>
    );
  }

  const storeName = isAr
    ? (storeData as any)?.nameAr ?? (storeData as any)?.name ?? storeId
    : (storeData as any)?.nameEn ?? (storeData as any)?.name ?? storeId;

  const statCards = [
    { key: 'views', labelAr: 'المشاهدات', labelEn: 'Views', value: (stats as any)?.views ?? 0, icon: 'eye-outline' as const, color: '#2563EB' },
    { key: 'orders', labelAr: 'الطلبات', labelEn: 'Orders', value: orders.length, icon: 'receipt-outline' as const, color: '#059669' },
    { key: 'products', labelAr: 'المنتجات', labelEn: 'Products', value: storeProducts.length, icon: 'cube-outline' as const, color: '#7C3AED' },
    { key: 'messages', labelAr: 'الرسائل', labelEn: 'Messages', value: messages.length || conversations.length, icon: 'mail-outline' as const, color: '#DC2626' },
    { key: 'reviews', labelAr: 'التقييمات', labelEn: 'Reviews', value: reviews.length, icon: 'star-outline' as const, color: '#EA580C' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={isTablet ? styles.tabletInner : undefined}>
          <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1 }}>
              <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }]}>
                <View style={styles.headerLogo}>
                  <Ionicons name="storefront" size={18} color="#fff" />
                </View>
                <View>
                  <Text style={[styles.headerName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                    {storeLoading ? '…' : storeName}
                  </Text>
                  <Text style={[styles.headerSub, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isAr ? `متجر: ${storeId}` : `Store: ${storeId}`}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, alignItems: 'center' }]}>
              <Pressable
                style={styles.headerIconBtn}
                onPress={() => router.push({ pathname: '/notifications', params: user?.id ? { userId: user.id } : {} } as any)}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.light.foreground} />
                {unreadCount > 0 && <View style={styles.notifDot} />}
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 32 }}>
        <View style={isTablet ? styles.tabletInner : undefined}>
          {/* Quick actions */}
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isAr ? 'إجراءات سريعة' : 'Quick actions'}
          </Text>
          <View style={[styles.actionsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.route}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '18' }]}>
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{isAr ? action.labelAr : action.labelEn}</Text>
              </Pressable>
            ))}
          </View>

          {/* Stats */}
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', marginTop: 20 }]}>
            {isAr ? 'الإحصائيات' : 'Stats'}
          </Text>
          <View style={[styles.statsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {statCards.map((s) => (
              <View key={s.key} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{isAr ? s.labelAr : s.labelEn}</Text>
              </View>
            ))}
          </View>

          {/* Products preview */}
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.sectionTitle}>{isAr ? 'المنتجات' : 'Products'}</Text>
            <Pressable onPress={() => router.push('/dashboard/products' as any)}>
              <Text style={styles.link}>{isAr ? 'عرض الكل' : 'View all'}</Text>
            </Pressable>
          </View>
          {productsLoading ? (
            <ActivityIndicator color={colors.light.primary} style={{ marginVertical: 16 }} />
          ) : storeProducts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyHint}>{isAr ? 'لا توجد منتجات بعد' : 'No products yet'}</Text>
              <Pressable style={styles.primaryBtn} onPress={() => router.push('/dashboard/add-product' as any)}>
                <Text style={styles.primaryBtnText}>{isAr ? 'إضافة منتج' : 'Add product'}</Text>
              </Pressable>
            </View>
          ) : (
            storeProducts.slice(0, 5).map((p: any) => (
              <View key={p.id} style={[styles.productRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.productDot} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                    {isAr ? p.nameAr ?? p.name : p.nameEn ?? p.name}
                  </Text>
                  <Text style={[styles.productMeta, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {typeof p.price === 'number' ? p.price.toLocaleString() : p.price} {isAr ? 'ج.م' : 'EGP'}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* Reservations CTA */}
          <Pressable
            style={[styles.ctaCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            onPress={() => router.push('/dashboard/reservations' as any)}
          >
            <Ionicons name="calendar" size={24} color={colors.light.primary} />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text style={[styles.ctaTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isAr ? 'إدارة الحجوزات' : 'Manage reservations'}
              </Text>
              <Text style={[styles.ctaHint, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isAr ? 'تأكيد ورفض وإكمال طلبات الحجز' : 'Confirm, decline, and complete reservation requests'}
              </Text>
            </View>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.light.mutedForeground} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  tabletInner: { width: '100%', maxWidth: 720, alignSelf: 'center' },
  header: {
    backgroundColor: colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    paddingBottom: 12,
  },
  headerRow: { alignItems: 'center', paddingHorizontal: 16 },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginTop: 2 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.light.destructive,
  },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.light.foreground, marginBottom: 10 },
  sectionHeader: { alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10 },
  link: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.light.primary },
  actionsGrid: { flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '47%',
    backgroundColor: colors.light.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground, textAlign: 'center' },
  statsGrid: { flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '30%',
    minWidth: 100,
    flexGrow: 1,
    backgroundColor: colors.light.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginTop: 2 },
  productRow: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  productDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.light.primary },
  productName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground },
  productMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginTop: 2 },
  emptyCard: {
    backgroundColor: colors.light.card,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  emptyTitle: { marginTop: 16, fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.light.foreground, textAlign: 'center' },
  emptyHint: { marginTop: 8, fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, textAlign: 'center' },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: colors.light.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  ctaCard: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: colors.light.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  ctaTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  ctaHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginTop: 2 },
});
