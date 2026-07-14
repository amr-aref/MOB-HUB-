import React, { useState } from 'react';
import {
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
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useGetStore,
  useGetProducts,
  useGetDashboardStats,
  useGetDashboardOrders,
  useGetDashboardMessages,
  useGetDashboardReviews,
} from '@workspace/api-client-react';

const STORE_ID = 's1';

const STATS = [
  { key: 'views', labelAr: 'المشاهدات', labelEn: 'Views', value: 1850, icon: 'eye-outline', color: '#2563EB' },
  { key: 'visitors', labelAr: 'الزوار', labelEn: 'Visitors', value: 620, icon: 'people-outline', color: '#7C3AED' },
  { key: 'clicks', labelAr: 'النقرات', labelEn: 'Clicks', value: 310, icon: 'hand-left-outline', color: '#0891B2' },
  { key: 'reservations', labelAr: 'الحجوزات', labelEn: 'Reservations', value: 12, icon: 'calendar-outline', color: '#059669' },
  { key: 'reviews', labelAr: 'تقييمات جديدة', labelEn: 'New Reviews', value: 5, icon: 'chatbubble-outline', color: '#D97706' },
  { key: 'messages', labelAr: 'الرسائل', labelEn: 'Messages', value: 28, icon: 'mail-outline', color: '#DC2626' },
  { key: 'saved', labelAr: 'المحفوظة', labelEn: 'Saved', value: 95, icon: 'bookmark-outline', color: '#7C3AED' },
  { key: 'trending', labelAr: 'المنتجات الرائجة', labelEn: 'Trending', value: 4, icon: 'trending-up-outline', color: '#EA580C' },
];

const QUICK_ACTIONS = [
  { labelAr: 'إضافة منتج', labelEn: 'Add Product', icon: 'add-circle-outline', color: '#2563EB', route: '/dashboard/add-product' as const },
  { labelAr: 'الفئات', labelEn: 'Categories', icon: 'grid-outline', color: '#7C3AED', route: null },
  { labelAr: 'العروض', labelEn: 'Offers', icon: 'pricetag-outline', color: '#059669', route: null },
  { labelAr: 'التحليلات', labelEn: 'Analytics', icon: 'bar-chart-outline', color: '#0891B2', route: null },
  { labelAr: 'الموقع', labelEn: 'Location', icon: 'location-outline', color: '#DC2626', route: null },
  { labelAr: 'المعرض', labelEn: 'Gallery', icon: 'images-outline', color: '#D97706', route: null },
  { labelAr: 'الإعدادات', labelEn: 'Settings', icon: 'settings-outline', color: '#64748B', route: null },
];

const RECENT_ORDERS = [
  { id: 'o1', productAr: 'برو تك 14 الترا', productEn: 'Pro Tech 14 Ultra', storage: '512GB', customer: 'Sarah M.', timeAr: 'منذ ساعتين', timeEn: '2 hrs ago', status: 'PAID / RESERVED', price: 1099 },
  { id: 'o2', productAr: 'سامسونج S25 الترا', productEn: 'Galaxy S25 Ultra', storage: '256GB', customer: 'Ahmed K.', timeAr: 'منذ ٤ ساعات', timeEn: '4 hrs ago', status: 'RESERVED', price: 849 },
  { id: 'o3', productAr: 'آيفون 16 برو', productEn: 'iPhone 16 Pro', storage: '128GB', customer: 'Mona H.', timeAr: 'منذ ٦ ساعات', timeEn: '6 hrs ago', status: 'PENDING', price: 999 },
];

const RECENT_MESSAGES = [
  { id: 'm1', customer: 'Sarah M.', productAr: 'برو تك 14 الترا (512GB)', productEn: 'Pro Tech 14 Ultra (512GB)', timeAr: 'منذ ساعتين', timeEn: '2 hrs ago', status: 'PAID / RESERVED', unread: 1 },
  { id: 'm2', customer: 'Ali Hassan', productAr: 'سامسونج A55', productEn: 'Samsung Galaxy A55', timeAr: 'منذ يوم', timeEn: '1 day ago', status: 'INQUIRY', unread: 0 },
];

const RECENT_REVIEWS = [
  { id: 'rv1', author: 'Sarah M.', rating: 5, textAr: 'منتج رائع! أفضل متجر في مصر، الخدمة ممتازة والتوصيل سريع.', textEn: 'Amazing product! Best store in Egypt, excellent service and fast delivery.', timeAr: 'منذ يومين', timeEn: '2 days ago', unread: 1 },
];

const CHART_DATA = [180, 140, 165, 190, 160, 200, 185];
const CHART_DAYS_AR = ['أح', 'اث', 'ثل', 'أر', 'خم', 'جم', 'سب'];
const CHART_DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DashboardScreen() {
  const { t, isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'analytics' | 'messages' | 'profile'>('dashboard');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const { data: storeData } = useGetStore(STORE_ID);
  const { data: storeProducts = [] } = useGetProducts({ storeId: STORE_ID });
  const { data: statsData } = useGetDashboardStats({ storeId: STORE_ID });
  const { data: ordersData = [] } = useGetDashboardOrders({ storeId: STORE_ID });
  const { data: messagesData = [] } = useGetDashboardMessages({ storeId: STORE_ID });
  const { data: reviewsData = [] } = useGetDashboardReviews({ storeId: STORE_ID });

  // Keep the STORE variable name so all existing JSX references work unchanged
  const STORE = storeData ?? {
    id: STORE_ID,
    nameAr: 'موبايل وورلد',
    nameEn: 'Mobile World',
    logoColor: '#2563EB',
    logoInitial: 'M',
    isOpen: true,
    isVerified: true,
    address: '',
    addressAr: '',
  };

  // Live stats merged over the module-level defaults
  const liveStats = STATS.map((s) => {
    if (!statsData) return s;
    const apiVal: Record<string, number> = {
      views: statsData.views,
      visitors: statsData.visitors,
      clicks: statsData.clicks,
      reservations: statsData.reservations,
      reviews: statsData.newReviews,
      messages: statsData.messagesCount,
      saved: statsData.saved,
      trending: statsData.trending,
    };
    return { ...s, value: apiVal[s.key] ?? s.value };
  });

  // Dashboard list data — fall back to module-level constants if API hasn't loaded
  const displayOrders = ordersData.length > 0 ? ordersData : RECENT_ORDERS;
  const displayMessages = messagesData.length > 0 ? messagesData : RECENT_MESSAGES;
  const displayReviews = reviewsData.length > 0 ? reviewsData : RECENT_REVIEWS;

  const storeName = language === 'ar' ? STORE.nameAr : STORE.nameEn;
  const chartMax = Math.max(...CHART_DATA);
  const chartDays = language === 'ar' ? CHART_DAYS_AR : CHART_DAYS_EN;

  function handleAction(route: string | null) {
    if (route) router.push(route as any);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1 }}>
            <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }]}>
              <View style={[styles.headerLogo, { backgroundColor: STORE.logoColor }]}>
                <Text style={styles.headerLogoText}>{STORE.logoInitial}</Text>
              </View>
              <View>
                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 5 }]}>
                  <Text style={[styles.headerName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                    {storeName}
                  </Text>
                  {STORE.isVerified && (
                    <Ionicons name="checkmark-circle" size={16} color={colors.light.primary} />
                  )}
                </View>
                <Text style={[styles.headerDate, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'يوليو ١٣، ٢٠٢٦' : 'July 13, 2026'}
                </Text>
              </View>
            </View>
          </View>
          <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, alignItems: 'center' }]}>
            <Pressable style={styles.headerIconBtn}>
              <Ionicons name="notifications-outline" size={20} color={colors.light.foreground} />
              <View style={styles.notifDot} />
            </Pressable>
            <Pressable style={styles.headerAvatar}>
              <Ionicons name="person" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Store Status row */}
        <View style={[styles.storeStatusRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.statusPill, { backgroundColor: STORE.isOpen ? colors.light.successLight : colors.light.muted }]}>
            <View style={[styles.statusDot, { backgroundColor: STORE.isOpen ? colors.light.success : colors.light.mutedForeground }]} />
            <Text style={[styles.statusText, { color: STORE.isOpen ? colors.light.success : colors.light.mutedForeground }]}>
              {language === 'ar' ? 'مفتوح' : 'OPEN'} · {language === 'ar' ? '٩ص – ٧م' : '9AM – 7PM'}
            </Text>
          </View>
          <View style={[styles.headerStats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <HeaderStat icon="star" value="4.9" color={colors.light.star} />
            <HeaderStat icon="people-outline" value="12.5k" color={colors.light.primary} />
            <HeaderStat icon="chatbubble-outline" value="4.1k" color={colors.light.mutedForeground} />
            <HeaderStat icon="cube-outline" value="350" color={colors.light.mutedForeground} />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'نظرة اليوم' : "Today's Overview"}
          </Text>
          <View style={styles.statsGrid}>
            {liveStats.map((stat) => (
              <View key={stat.key} style={[styles.statCard, { borderTopColor: stat.color }]}>
                <View style={[styles.statCardIcon, { backgroundColor: stat.color + '18' }]}>
                  <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                </View>
                <Text style={styles.statCardValue}>{stat.value.toLocaleString()}</Text>
                <Text style={styles.statCardLabel} numberOfLines={1}>
                  {language === 'ar' ? stat.labelAr : stat.labelEn}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.actionsRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            {QUICK_ACTIONS.map((action, idx) => (
              <Pressable
                key={idx}
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
                onPress={() => handleAction(action.route)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '18' }]}>
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={styles.actionLabel} numberOfLines={1}>
                  {language === 'ar' ? action.labelAr : action.labelEn}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Product Management */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', marginBottom: 0 }]}>
              {language === 'ar' ? 'إدارة المنتجات' : 'Product Management'}
            </Text>
            <Pressable
              style={styles.addProductFab}
              onPress={() => router.push('/dashboard/add-product')}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addProductFabText}>
                {language === 'ar' ? 'إضافة' : 'Add'}
              </Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.productsRow,
              { paddingLeft: isRTL ? 0 : 16, paddingRight: isRTL ? 16 : 0 },
            ]}
          >
            {storeProducts.map((product) => {
              const name = language === 'ar' ? product.nameAr : product.nameEn;
              return (
                <View key={product.id} style={styles.productCard}>
                  <View style={[styles.productImage, { backgroundColor: product.imageColor + '20' }]}>
                    <Ionicons name="phone-portrait" size={22} color={product.imageColor} />
                    {product.isNew && (
                      <View style={styles.productNewBadge}>
                        <Text style={styles.productNewBadgeText}>NEW</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{name}</Text>
                    <Text style={styles.productPrice}>
                      ${(product.price / 100).toFixed(0)}
                    </Text>
                    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={[styles.productMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.stockDot, { backgroundColor: product.inStock ? colors.light.success : colors.light.destructive }]} />
                        <Text style={[styles.productMetaText, { color: product.inStock ? colors.light.success : colors.light.destructive }]}>
                          {product.inStock ? (language === 'ar' ? 'متوفر' : 'In Stock') : (language === 'ar' ? 'نفذ' : 'Out')}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.productActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Pressable style={styles.productActionBtn}>
                        <Text style={styles.productActionText}>{language === 'ar' ? 'تعديل' : 'Edit'}</Text>
                      </Pressable>
                      <Pressable style={styles.productActionBtn}>
                        <Text style={styles.productActionText}>{language === 'ar' ? 'نسخ' : 'Dup.'}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Latest Orders */}
        <View style={styles.card}>
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', marginBottom: 0 }]}>
              {language === 'ar' ? 'أحدث الطلبات' : 'Latest Orders'}
            </Text>
            <Pressable>
              <Text style={styles.seeAllText}>{language === 'ar' ? 'عرض الكل' : 'See All'}</Text>
            </Pressable>
          </View>
          {displayOrders.map((order, idx) => (
            <View key={order.id} style={[styles.orderRow, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: idx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'transparent', borderRadius: 12 }]}>
              <View style={[styles.orderImage, { backgroundColor: '#1E3A8A22' }]}>
                <Ionicons name="phone-portrait" size={18} color="#1E3A8A" />
              </View>
              <View style={{ flex: 1, marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }}>
                <Text style={[styles.orderProduct, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                  {language === 'ar' ? order.productAr : order.productEn} ({order.storage})
                </Text>
                <Text style={[styles.orderMeta, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {order.customer} · {language === 'ar' ? order.timeAr : order.timeEn}
                </Text>
              </View>
              <View style={[styles.orderStatus, {
                backgroundColor:
                  order.status === 'PAID / RESERVED' ? colors.light.successLight :
                  order.status === 'RESERVED' ? colors.light.primaryLight :
                  colors.light.warningLight,
              }]}>
                <Text style={[styles.orderStatusText, {
                  color:
                    order.status === 'PAID / RESERVED' ? colors.light.success :
                    order.status === 'RESERVED' ? colors.light.primary :
                    colors.light.warning,
                }]}>{order.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Customer Messages */}
        <View style={styles.card}>
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', marginBottom: 0 }]}>
              {language === 'ar' ? 'رسائل العملاء' : 'Customer Messages'}
            </Text>
            <Pressable>
              <Text style={styles.seeAllText}>{language === 'ar' ? 'عرض الكل' : 'See All'}</Text>
            </Pressable>
          </View>
          {displayMessages.map((msg) => (
            <View key={msg.id} style={[styles.messageRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.messageAvatar}>
                <Ionicons name="person" size={16} color={colors.light.primary} />
                {msg.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{msg.unread}</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }}>
                <Text style={[styles.messageCustomer, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {msg.customer}
                </Text>
                <Text style={[styles.messageProduct, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                  {language === 'ar' ? msg.productAr : msg.productEn}
                </Text>
              </View>
              <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 3 }}>
                <Text style={styles.messageTime}>{language === 'ar' ? msg.timeAr : msg.timeEn}</Text>
                <View style={[styles.messageStatus, {
                  backgroundColor: msg.status === 'PAID / RESERVED' ? colors.light.successLight : colors.light.primaryLight,
                }]}>
                  <Text style={[styles.messageStatusText, {
                    color: msg.status === 'PAID / RESERVED' ? colors.light.success : colors.light.primary,
                  }]}>{msg.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Latest Reviews */}
        <View style={styles.card}>
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', marginBottom: 0 }]}>
              {language === 'ar' ? 'أحدث التقييمات' : 'Latest Reviews'}
            </Text>
            <Pressable>
              <Text style={styles.seeAllText}>{language === 'ar' ? 'عرض الكل' : 'See All'}</Text>
            </Pressable>
          </View>
          {displayReviews.map((rv) => (
            <View key={rv.id} style={[styles.reviewRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.reviewAvatar}>
                <Ionicons name="person" size={14} color={colors.light.primary} />
                {rv.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{rv.unread}</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }}>
                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                  <Text style={styles.reviewAuthor}>{rv.author}</Text>
                  <View style={[{ flexDirection: 'row', gap: 2 }]}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons key={i} name="star" size={11} color={i < rv.rating ? colors.light.star : colors.light.border} />
                    ))}
                  </View>
                </View>
                <Text style={[styles.reviewText, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
                  {language === 'ar' ? rv.textAr : rv.textEn}
                </Text>
                <Text style={styles.reviewTime}>{language === 'ar' ? rv.timeAr : rv.timeEn}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Store Performance Chart */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'أداء المتجر' : 'Store Performance'}
          </Text>
          <Text style={[styles.chartSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'الزوار اليومي — الأسبوع الماضي' : 'Daily Visitors — Last Week'}
          </Text>
          <View style={[styles.chartArea, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {CHART_DATA.map((val, idx) => {
              const height = (val / chartMax) * 100;
              const isToday = idx === 3;
              return (
                <View key={idx} style={styles.chartBar}>
                  {isToday && (
                    <View style={styles.chartTooltip}>
                      <Text style={styles.chartTooltipText}>{val}</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: `${height}%` as any,
                        backgroundColor: isToday ? colors.light.primary : colors.light.primaryLight,
                        borderRadius: isToday ? 6 : 4,
                      },
                    ]}
                  />
                  <Text style={styles.chartLabel}>{chartDays[idx]}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Map Card */}
        <View style={[styles.card, { marginBottom: 16 }]}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'موقع المتجر' : 'Store Location'}
          </Text>
          <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={styles.mapTile}>
            {[0, 1, 2, 3].map((i) => (
              <View key={`h${i}`} style={[styles.mapGridH, { top: `${i * 33}%` as any }]} />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <View key={`v${i}`} style={[styles.mapGridV, { left: `${i * 33}%` as any }]} />
            ))}
            <View style={styles.mapPin}>
              <View style={[styles.mapPinHead, { backgroundColor: STORE.logoColor }]}>
                <Text style={styles.mapPinText}>{STORE.logoInitial}</Text>
              </View>
              <View style={[styles.mapPinDrop, { borderTopColor: STORE.logoColor }]} />
            </View>
          </LinearGradient>
          <View style={[styles.mapFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mapName, { textAlign: isRTL ? 'right' : 'left' }]}>{storeName}</Text>
              <Text style={[styles.mapAddr, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                {language === 'ar' ? STORE.addressAr : STORE.address}
              </Text>
            </View>
            <Pressable style={styles.changeLocBtn}>
              <Text style={styles.changeLocText}>{language === 'ar' ? 'تغيير الموقع' : 'Change'}</Text>
            </Pressable>
            <Pressable style={styles.openMapsBtn}>
              <Text style={styles.openMapsText}>{language === 'ar' ? 'فتح في الخرائط' : 'Open in Maps'}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: bottomInset + 6 }]}>
        {([
          { key: 'dashboard', iconDefault: 'grid-outline', iconActive: 'grid', labelAr: 'الرئيسية', labelEn: 'Dashboard' },
          { key: 'products', iconDefault: 'cube-outline', iconActive: 'cube', labelAr: 'المنتجات', labelEn: 'Products' },
          { key: 'analytics', iconDefault: 'bar-chart-outline', iconActive: 'bar-chart', labelAr: 'التحليلات', labelEn: 'Analytics' },
          { key: 'messages', iconDefault: 'mail-outline', iconActive: 'mail', labelAr: 'الرسائل', labelEn: 'Messages' },
          { key: 'profile', iconDefault: 'person-outline', iconActive: 'person', labelAr: 'الملف', labelEn: 'Profile' },
        ] as const).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={styles.bottomNavItem}
              onPress={() => {
                if (tab.key === 'profile') router.back();
                else setActiveTab(tab.key);
              }}
            >
              <Ionicons
                name={isActive ? tab.iconActive : tab.iconDefault}
                size={22}
                color={isActive ? colors.light.primary : colors.light.mutedForeground}
              />
              <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>
                {language === 'ar' ? tab.labelAr : tab.labelEn}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function HeaderStat({ icon, value, color }: { icon: string; value: string; color: string }) {
  return (
    <View style={[styles.headerStatItem, { flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
      <Ionicons name={icon as any} size={12} color={color} />
      <Text style={styles.headerStatText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  // Header
  header: {
    backgroundColor: colors.light.background,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  headerRow: { alignItems: 'center', justifyContent: 'space-between' },
  headerLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerName: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  headerDate: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    marginTop: 1,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.light.destructive,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeStatusRow: { alignItems: 'center', gap: 8 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  headerStats: { flex: 1, justifyContent: 'flex-end', gap: 10 },
  headerStatItem: {},
  headerStatText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground },

  // Scroll
  scroll: { flex: 1 },

  // Sections
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    marginBottom: 12,
  },
  sectionHeader: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  seeAllText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.light.primary },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '22%',
    minWidth: 74,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 3,
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statCardValue: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  statCardLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, textAlign: 'center' },

  // Quick actions
  actionsRow: { gap: 8, paddingBottom: 4 },
  actionBtn: { alignItems: 'center', gap: 6, width: 68 },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground, textAlign: 'center' },

  // Products row
  productsRow: { gap: 10, paddingRight: 16 },
  productCard: {
    width: 130,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: 'rgba(15,23,42,0.07)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  addProductFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.light.primary,
    borderRadius: colors.radiusFull,
  },
  addProductFabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  productImage: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productNewBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.light.primary,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  productNewBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#fff' },
  productInfo: { padding: 8, gap: 3 },
  productName: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground, lineHeight: 15 },
  productPrice: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.light.primary },
  productMeta: { alignItems: 'center', gap: 4 },
  stockDot: { width: 5, height: 5, borderRadius: 2.5 },
  productMetaText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  productActions: { gap: 4, marginTop: 4 },
  productActionBtn: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: colors.light.muted,
    borderRadius: 6,
    alignItems: 'center',
  },
  productActionText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.light.mutedForeground },

  // Card
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
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    marginBottom: 12,
  },

  // Orders
  orderRow: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(226,232,240,0.4)', gap: 10 },
  orderImage: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  orderProduct: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground },
  orderMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginTop: 2 },
  orderStatus: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  orderStatusText: { fontSize: 10, fontFamily: 'Inter_700Bold' },

  // Messages
  messageRow: { alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(226,232,240,0.4)' },
  messageAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.light.primaryLight, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  unreadBadge: { position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.light.destructive, alignItems: 'center', justifyContent: 'center' },
  unreadBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#fff' },
  messageCustomer: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground },
  messageProduct: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginTop: 1 },
  messageTime: { fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },
  messageStatus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  messageStatusText: { fontSize: 9, fontFamily: 'Inter_700Bold' },

  // Reviews
  reviewRow: { alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(226,232,240,0.4)' },
  reviewAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.light.primaryLight, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  reviewAuthor: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground },
  reviewText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.light.secondaryForeground, lineHeight: 18, marginTop: 4 },
  reviewTime: { fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginTop: 4 },

  // Chart
  chartSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginBottom: 16 },
  chartArea: { height: 160, alignItems: 'flex-end', gap: 6, marginBottom: 4, padding: 16, backgroundColor: '#fff', borderRadius: 16 },
  chartBar: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 4, position: 'relative' },
  chartBarFill: { width: '80%', minHeight: 8 },
  chartLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },
  chartTooltip: {
    position: 'absolute',
    top: 0,
    backgroundColor: colors.light.foreground,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chartTooltipText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#fff' },

  // Map
  mapTile: {
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  mapGridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(37,99,235,0.1)' },
  mapGridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(37,99,235,0.1)' },
  mapPin: { alignItems: 'center' },
  mapPinHead: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.2)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 8, elevation: 4 },
  mapPinText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  mapPinDrop: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 },
  mapFooter: { alignItems: 'center', gap: 8 },
  mapName: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  mapAddr: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginTop: 1 },
  changeLocBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.light.muted, borderRadius: 10 },
  changeLocText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground },
  openMapsBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.light.primaryLight, borderRadius: 10 },
  openMapsText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.light.primary },

  // Bottom nav
  bottomNav: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.7)',
    paddingTop: 8,
    paddingHorizontal: 4,
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  bottomNavItem: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  bottomNavLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },
  bottomNavLabelActive: { fontFamily: 'Inter_600SemiBold', color: colors.light.primary },
});
