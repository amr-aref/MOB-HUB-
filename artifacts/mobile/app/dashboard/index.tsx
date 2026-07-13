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
import { BlurView } from 'expo-blur';
import colors from '@/constants/colors';
import { getFontFamily } from '@/constants/fonts';
import { useLanguage } from '@/contexts/LanguageContext';
import { products, stores } from '@/data/mockData';
import { AnimatedPressable, ChartBar, Toggle } from '@/components/admin/AdminComponents';
import { AnimatedCounter } from '@/components/admin/AnimatedCounter';

const STORE = stores[0];

const STATS = [
  { key: 'views', labelAr: 'المشاهدات', labelEn: 'Views', value: 1850, icon: 'eye-outline', color: '#3E8BFF' },
  { key: 'visitors', labelAr: 'الزوار', labelEn: 'Visitors', value: 620, icon: 'people-outline', color: '#2FBE5C' },
  { key: 'clicks', labelAr: 'النقرات', labelEn: 'Clicks', value: 310, icon: 'hand-left-outline', color: '#FF8A3D' },
  { key: 'reservations', labelAr: 'الحجوزات', labelEn: 'Reservations', value: 12, icon: 'calendar-outline', color: '#FF4D4D' },
  { key: 'reviews', labelAr: 'تقييمات جديدة', labelEn: 'New Reviews', value: 5, icon: 'chatbubble-outline', color: '#FFC94A' },
  { key: 'messages', labelAr: 'الرسائل', labelEn: 'Messages', value: 28, icon: 'mail-outline', color: '#3E8BFF' },
  { key: 'saved', labelAr: 'المحفوظة', labelEn: 'Saved', value: 95, icon: 'bookmark-outline', color: '#2FBE5C' },
];

const QUICK_ACTIONS = [
  { labelAr: 'إضافة منتج', labelEn: 'Add Product', icon: 'add', color: '#FF8A3D', route: '/dashboard/add-product' as const },
  { labelAr: 'إدارة المنتجات', labelEn: 'Manage Products', icon: 'cube', color: '#2B2B2E', route: '/dashboard/products' as const },
  { labelAr: 'الفئات', labelEn: 'Categories', icon: 'grid', color: '#3E8BFF', route: null },
  { labelAr: 'التحليلات', labelEn: 'Analytics', icon: 'bar-chart', color: '#2FBE5C', route: null },
  { labelAr: 'العروض', labelEn: 'Offers', icon: 'pricetag', color: '#FF4D4D', route: null },
  { labelAr: 'الإعدادات', labelEn: 'Settings', icon: 'settings', color: '#8A8782', route: null },
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

  const storeProducts = products.filter((p) => p.storeId === STORE.id);
  const storeName = language === 'ar' ? STORE.nameAr : STORE.nameEn;
  const chartMax = Math.max(...CHART_DATA);
  const chartDays = language === 'ar' ? CHART_DAYS_AR : CHART_DAYS_EN;

  function handleAction(route: string | null) {
    if (route) router.push(route as any);
  }

  const fontFamilyRTL = {
    regular: getFontFamily(isRTL, 'regular'),
    medium: getFontFamily(isRTL, 'medium'),
    semiBold: getFontFamily(isRTL, 'semiBold'),
    bold: getFontFamily(isRTL, 'bold'),
  };
  
  const fontFamilyLTR = {
    regular: getFontFamily(false, 'regular'),
    medium: getFontFamily(false, 'medium'),
    semiBold: getFontFamily(false, 'semiBold'),
    bold: getFontFamily(false, 'bold'),
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1 }}>
            <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 }]}>
              <View style={[styles.headerLogo, { backgroundColor: STORE.logoColor }]}>
                <Text style={[styles.headerLogoText, { fontFamily: fontFamilyLTR.bold }]}>{STORE.logoInitial}</Text>
                {STORE.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={8} color="#fff" />
                  </View>
                )}
              </View>
              <View>
                <Text style={[styles.headerName, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.bold }]} numberOfLines={1}>
                  {storeName}
                </Text>
                <Text style={[styles.headerDate, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.regular }]}>
                  {language === 'ar' ? 'يوليو ١٣، ٢٠٢٦' : 'July 13, 2026'}
                </Text>
              </View>
            </View>
          </View>
          <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12, alignItems: 'center' }]}>
            <AnimatedPressable style={styles.headerIconBtn}>
              <Ionicons name="notifications-outline" size={22} color={colors.light.foreground} />
              <View style={styles.notifDot} />
            </AnimatedPressable>
            <AnimatedPressable style={styles.headerAvatar}>
              <Ionicons name="person" size={18} color="#fff" />
            </AnimatedPressable>
          </View>
        </View>

        {/* Store Status row */}
        <View style={[styles.storeStatusRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 16 }]}>
          <View style={[styles.statusPill, { backgroundColor: STORE.isOpen ? colors.light.successLight : colors.light.muted }]}>
            <View style={[styles.statusDot, { backgroundColor: STORE.isOpen ? colors.light.success : colors.light.mutedForeground }]} />
            <Text style={[styles.statusText, { color: STORE.isOpen ? colors.light.success : colors.light.mutedForeground, fontFamily: fontFamilyRTL.medium }]}>
              {language === 'ar' ? 'مفتوح' : 'OPEN'} · {language === 'ar' ? '٩ص – ٧م' : '9AM – 7PM'}
            </Text>
          </View>
          <View style={[styles.headerStats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <HeaderStat icon="star" value="4.9" color={colors.light.star} fontFamilyLTR={fontFamilyLTR} />
            <HeaderStat icon="people" value="12.5k" color={colors.light.primary} fontFamilyLTR={fontFamilyLTR} />
            <HeaderStat icon="chatbubble" value="4.1k" color={colors.light.mutedForeground} fontFamilyLTR={fontFamilyLTR} />
            <HeaderStat icon="cube" value="350" color={colors.light.mutedForeground} fontFamilyLTR={fontFamilyLTR} />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 100, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Today's Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.bold }]}>
            {language === 'ar' ? 'نظرة اليوم' : "Today's Overview"}
          </Text>
          <View style={[styles.statsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {STATS.map((stat) => (
              <AnimatedPressable key={stat.key} style={styles.statCard}>
                <View style={[styles.statCardIcon, { backgroundColor: stat.color + '1A' }]}>
                  <Ionicons name={stat.icon as any} size={18} color={stat.color} />
                </View>
                <AnimatedCounter style={[styles.statCardValue, { fontFamily: fontFamilyLTR.bold }]} value={stat.value} />
                <Text style={[styles.statCardLabel, { fontFamily: fontFamilyRTL.regular }]} numberOfLines={1}>
                  {language === 'ar' ? stat.labelAr : stat.labelEn}
                </Text>
              </AnimatedPressable>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.bold }]}>
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
              <AnimatedPressable
                key={idx}
                style={styles.actionBtn}
                onPress={() => handleAction(action.route)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color === '#FF8A3D' || action.color === '#2B2B2E' ? action.color : '#FFFFFF' }]}>
                  <Ionicons name={action.icon as any} size={22} color={action.color === '#FF8A3D' || action.color === '#2B2B2E' ? '#FFFFFF' : action.color} />
                </View>
                <Text style={[styles.actionLabel, { fontFamily: fontFamilyRTL.medium }]} numberOfLines={1}>
                  {language === 'ar' ? action.labelAr : action.labelEn}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </View>

        {/* Product Management */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', marginBottom: 0, fontFamily: fontFamilyRTL.bold }]}>
              {language === 'ar' ? 'إدارة المنتجات' : 'Product Management'}
            </Text>
            <Pressable
              style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }]}
              onPress={() => router.push('/dashboard/products')}
            >
              <Text style={[styles.seeAllText, { fontFamily: fontFamilyRTL.semiBold }]}>
                {language === 'ar' ? 'عرض الكل' : 'See All'}
              </Text>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color={colors.light.primary} />
            </Pressable>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.productsRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            {storeProducts.map((product) => {
              const name = language === 'ar' ? product.nameAr : product.nameEn;
              return (
                <AnimatedPressable key={product.id} style={styles.productCard}>
                  <View style={[styles.productImage, { backgroundColor: '#F8FAFC' }]}>
                    <Ionicons name="phone-portrait" size={32} color={product.imageColor} />
                    {product.discountPrice && (
                      <View style={styles.productDiscountBadge}>
                        <Text style={[styles.productDiscountText, { fontFamily: fontFamilyLTR.bold }]}>
                          -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.bold }]} numberOfLines={2}>
                      {name}
                    </Text>
                    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4, marginTop: 4 }]}>
                      <Text style={[styles.productPrice, { fontFamily: fontFamilyLTR.bold }]}>
                        ${(product.discountPrice || product.price) / 100}
                      </Text>
                      {product.discountPrice && (
                        <Text style={[styles.productOldPrice, { fontFamily: fontFamilyLTR.regular }]}>
                          ${product.price / 100}
                        </Text>
                      )}
                    </View>
                    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 8 }]}>
                      <View style={[styles.productMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.stockDot, { backgroundColor: product.inStock ? colors.light.success : colors.light.destructive }]} />
                        <Text style={[styles.productMetaText, { color: product.inStock ? colors.light.success : colors.light.destructive, fontFamily: fontFamilyRTL.medium }]}>
                          {product.inStock ? (language === 'ar' ? 'متوفر' : 'In Stock') : (language === 'ar' ? 'مخزون منخفض' : 'Low Stock')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Latest Orders */}
        <View style={styles.card}>
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', marginBottom: 0, fontFamily: fontFamilyRTL.bold }]}>
              {language === 'ar' ? 'أحدث الطلبات' : 'Latest Orders'}
            </Text>
            <Pressable>
              <Text style={[styles.seeAllText, { fontFamily: fontFamilyRTL.semiBold }]}>{language === 'ar' ? 'عرض الكل' : 'See All'}</Text>
            </Pressable>
          </View>
          {RECENT_ORDERS.map((order, idx) => (
            <View key={order.id} style={[styles.orderRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomWidth: idx === RECENT_ORDERS.length - 1 ? 0 : 1 }]}>
              <View style={[styles.orderImage, { backgroundColor: '#1E3A8A10' }]}>
                <Ionicons name="phone-portrait" size={20} color="#1E3A8A" />
              </View>
              <View style={{ flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <Text style={[styles.orderProduct, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.semiBold }]} numberOfLines={1}>
                    {language === 'ar' ? order.productAr : order.productEn}
                  </Text>
                  <Text style={[styles.orderPrice, { fontFamily: fontFamilyLTR.bold }]}>${order.price}</Text>
                </View>
                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }]}>
                  <Text style={[styles.orderMeta, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.regular }]}>
                    {order.customer} · {language === 'ar' ? order.timeAr : order.timeEn}
                  </Text>
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
                      fontFamily: fontFamilyLTR.semiBold,
                    }]}>{order.status}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Customer Messages */}
        <View style={styles.card}>
          <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', marginBottom: 0, fontFamily: fontFamilyRTL.bold }]}>
              {language === 'ar' ? 'رسائل العملاء' : 'Customer Messages'}
            </Text>
            <Pressable>
              <Text style={[styles.seeAllText, { fontFamily: fontFamilyRTL.semiBold }]}>{language === 'ar' ? 'عرض الكل' : 'See All'}</Text>
            </Pressable>
          </View>
          {RECENT_MESSAGES.map((msg, idx) => (
            <View key={msg.id} style={[styles.messageRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomWidth: idx === RECENT_MESSAGES.length - 1 ? 0 : 1 }]}>
              <View style={styles.messageAvatar}>
                <Ionicons name="person" size={18} color="#FFF" />
                {msg.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={[styles.unreadBadgeText, { fontFamily: fontFamilyLTR.bold }]}>{msg.unread}</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
                <Text style={[styles.messageCustomer, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.bold }]}>
                  {msg.customer}
                </Text>
                <Text style={[styles.messageProduct, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.regular }]} numberOfLines={1}>
                  {language === 'ar' ? msg.productAr : msg.productEn}
                </Text>
              </View>
              <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 6 }}>
                <Text style={[styles.messageTime, { fontFamily: fontFamilyRTL.regular }]}>{language === 'ar' ? msg.timeAr : msg.timeEn}</Text>
                <View style={[styles.messageStatus, {
                  backgroundColor: msg.status === 'PAID / RESERVED' ? colors.light.successLight : colors.light.primaryLight,
                }]}>
                  <Text style={[styles.messageStatusText, {
                    color: msg.status === 'PAID / RESERVED' ? colors.light.success : colors.light.primary,
                    fontFamily: fontFamilyLTR.semiBold,
                  }]}>{msg.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Store Performance Chart */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.bold }]}>
            {language === 'ar' ? 'أداء المتجر' : 'Store Performance'}
          </Text>
          <Text style={[styles.chartSubtitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.regular }]}>
            {language === 'ar' ? 'الزوار اليومي — الأسبوع الماضي' : 'Daily Visitors — Last Week'}
          </Text>
          <View style={[styles.chartArea, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {CHART_DATA.map((val, idx) => (
              <ChartBar
                key={idx}
                value={val}
                max={chartMax}
                isToday={idx === 3}
                label={chartDays[idx]}
                delay={idx * 100}
                isRTL={isRTL}
              />
            ))}
          </View>
        </View>

        {/* Map Card */}
        <View style={[styles.card, { marginBottom: 32, padding: 0, overflow: 'hidden' }]}>
          <View style={styles.mapContainer}>
             <LinearGradient colors={['#E5E0D8', '#F5EFE4']} style={styles.mapBackground} />
             <BlurView intensity={20} tint="light" style={styles.mapOverlayCard}>
                <View style={[styles.mapFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.mapName, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.bold }]}>{storeName}</Text>
                    <Text style={[styles.mapAddr, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.regular }]} numberOfLines={1}>
                      {language === 'ar' ? STORE.addressAr : STORE.address}
                    </Text>
                  </View>
                  <AnimatedPressable style={styles.changeLocBtn}>
                    <Text style={[styles.changeLocText, { fontFamily: fontFamilyRTL.medium }]}>{language === 'ar' ? 'تغيير' : 'Change'}</Text>
                  </AnimatedPressable>
                  <AnimatedPressable style={styles.openMapsBtn}>
                    <Text style={[styles.openMapsText, { fontFamily: fontFamilyRTL.semiBold }]}>{language === 'ar' ? 'الخرائط' : 'Maps'}</Text>
                  </AnimatedPressable>
                </View>
             </BlurView>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <AnimatedPressable style={[styles.fab, isRTL ? { left: 24 } : { right: 24 }]} onPress={() => router.push('/dashboard/add-product')}>
        {isRTL && <Text style={[styles.fabText, { fontFamily: fontFamilyRTL.bold }]}>{language === 'ar' ? 'إضافة منتج' : 'Add Product'}</Text>}
        <View style={styles.fabIcon}>
          <Ionicons name="add" size={24} color="#fff" />
        </View>
        {!isRTL && <Text style={[styles.fabText, { fontFamily: fontFamilyRTL.bold }]}>{language === 'ar' ? 'إضافة منتج' : 'Add Product'}</Text>}
      </AnimatedPressable>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { paddingBottom: bottomInset + 12 }]}>
        {([
          { key: 'dashboard', iconDefault: 'grid-outline', iconActive: 'grid', labelAr: 'الرئيسية', labelEn: 'Dashboard' },
          { key: 'products', iconDefault: 'cube-outline', iconActive: 'cube', labelAr: 'المنتجات', labelEn: 'Products' },
          { key: 'analytics', iconDefault: 'bar-chart-outline', iconActive: 'bar-chart', labelAr: 'التحليلات', labelEn: 'Analytics' },
          { key: 'messages', iconDefault: 'mail-outline', iconActive: 'mail', labelAr: 'الرسائل', labelEn: 'Messages' },
          { key: 'profile', iconDefault: 'person-outline', iconActive: 'person', labelAr: 'الملف', labelEn: 'Profile' },
        ] as const).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <AnimatedPressable
              key={tab.key}
              style={styles.bottomNavItem}
              onPress={() => {
                if (tab.key === 'profile') router.back();
                else setActiveTab(tab.key);
              }}
            >
              <View style={styles.bottomNavIconContainer}>
                {isActive && <View style={styles.bottomNavActiveBg} />}
                <Ionicons
                  name={isActive ? tab.iconActive : tab.iconDefault}
                  size={24}
                  color={isActive ? colors.light.foreground : colors.light.mutedForeground}
                />
              </View>
              <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive, { fontFamily: isActive ? fontFamilyRTL.bold : fontFamilyRTL.medium }]}>
                {language === 'ar' ? tab.labelAr : tab.labelEn}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

function HeaderStat({ icon, value, color, fontFamilyLTR }: { icon: string; value: string; color: string; fontFamilyLTR: any }) {
  return (
    <View style={[styles.headerStatItem, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
      <Ionicons name={icon as any} size={14} color={color} />
      <Text style={[styles.headerStatText, { fontFamily: fontFamilyLTR.semiBold }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },

  // Header
  header: {
    backgroundColor: colors.light.background,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: { alignItems: 'center', justifyContent: 'space-between' },
  headerLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerLogoText: { fontSize: 22, color: '#fff' },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.light.verifiedBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.light.background,
  },
  headerName: {
    fontSize: 18,
    color: colors.light.foreground,
  },
  headerDate: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    marginTop: 2,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.light.destructive,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeStatusRow: { alignItems: 'center', gap: 12 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 13 },
  headerStats: { flex: 1, justifyContent: 'flex-end', gap: 12 },
  headerStatItem: {},
  headerStatText: { fontSize: 13, color: colors.light.mutedForeground },

  // Scroll
  scroll: { flex: 1 },

  // Sections
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 18,
    color: colors.light.foreground,
    marginBottom: 16,
  },
  sectionHeader: { alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  seeAllText: { fontSize: 14, color: colors.light.primary },

  // Stats grid
  statsGrid: {
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '22%',
    minWidth: 76,
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  statCardIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statCardValue: { fontSize: 20, color: colors.light.foreground },
  statCardLabel: { fontSize: 11, color: colors.light.mutedForeground, textAlign: 'center' },

  // Quick actions
  actionsRow: { gap: 16, paddingBottom: 8 },
  actionBtn: { alignItems: 'center', gap: 8, width: 72 },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  actionLabel: { fontSize: 12, color: colors.light.mutedForeground, textAlign: 'center' },

  // Products row
  productsRow: { gap: 16 },
  productCard: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  productImage: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  productDiscountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.light.destructive,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  productDiscountText: {
    color: '#fff',
    fontSize: 10,
  },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, color: colors.light.foreground },
  productPrice: { fontSize: 16, color: colors.light.foreground },
  productOldPrice: { fontSize: 12, color: colors.light.textTertiary, textDecorationLine: 'line-through' },
  productMeta: { alignItems: 'center', gap: 4 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  productMetaText: { fontSize: 11 },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  cardTitle: { fontSize: 18, color: colors.light.foreground, marginBottom: 16 },

  // Orders
  orderRow: { alignItems: 'center', paddingVertical: 12, borderBottomColor: colors.light.border },
  orderImage: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  orderProduct: { fontSize: 14, color: colors.light.foreground },
  orderPrice: { fontSize: 14, color: colors.light.foreground },
  orderMeta: { fontSize: 12, color: colors.light.mutedForeground },
  orderStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  orderStatusText: { fontSize: 10, letterSpacing: 0.5 },

  // Messages
  messageRow: { alignItems: 'center', paddingVertical: 12, borderBottomColor: colors.light.border },
  messageAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D9C3AE', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  unreadBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: colors.light.destructive, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  unreadBadgeText: { color: '#fff', fontSize: 10 },
  messageCustomer: { fontSize: 14, color: colors.light.foreground },
  messageProduct: { fontSize: 13, color: colors.light.mutedForeground, marginTop: 2 },
  messageTime: { fontSize: 11, color: colors.light.mutedForeground },
  messageStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  messageStatusText: { fontSize: 9, letterSpacing: 0.5 },

  // Reviews
  reviewRow: { paddingVertical: 12, borderBottomColor: colors.light.border },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D9C3AE', alignItems: 'center', justifyContent: 'center' },
  reviewAuthor: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  reviewText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginTop: 4, lineHeight: 18 },
  reviewTime: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.textTertiary, marginTop: 6 },

  // Charts
  chartSubtitle: { fontSize: 13, color: colors.light.mutedForeground, marginBottom: 24, marginTop: -12 },
  chartArea: { height: 160, alignItems: 'flex-end', justifyContent: 'space-between' },

  // Map
  mapContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end'
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlayCard: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  mapFooter: { alignItems: 'center', gap: 12 },
  mapName: { fontSize: 16, color: colors.light.foreground },
  mapAddr: { fontSize: 13, color: colors.light.foreground, marginTop: 2, opacity: 0.8 },
  changeLocBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 999 },
  changeLocText: { fontSize: 12, color: colors.light.foreground },
  openMapsBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 999 },
  openMapsText: { fontSize: 12, color: colors.light.primary },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: colors.light.success,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    shadowColor: colors.light.shadowFabGlow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 8,
    gap: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 15,
  },
  fabIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bottom nav
  bottomNav: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingTop: 12,
    paddingHorizontal: 16,
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 10,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomNavItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  bottomNavIconContainer: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bottomNavActiveBg: {
    position: 'absolute',
    width: 48,
    height: 32,
    backgroundColor: colors.light.background,
    borderRadius: 16,
  },
  bottomNavLabel: { fontSize: 10, color: colors.light.mutedForeground },
  bottomNavLabelActive: { color: colors.light.foreground },
});
