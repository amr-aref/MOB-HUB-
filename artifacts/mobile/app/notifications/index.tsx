import React from 'react';
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
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLayout } from '@/hooks/useLayout';

export default function NotificationsScreen() {
  const { isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();

  const topInset = isTablet ? 24 : (Platform.OS === 'web' ? 67 : insets.top);

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
            accessibilityLabel={language === 'ar' ? 'رجوع' : 'Go back'}
            accessibilityHint={language === 'ar' ? 'العودة للشاشة السابقة' : 'Navigate to previous screen'}
            hitSlop={12}
          >
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={colors.light.foreground}
            />
          </Pressable>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'الإشعارات' : 'Notifications'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Professional empty state */}
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconOuter}>
            <View style={styles.emptyIconInner}>
              <Ionicons name="notifications-outline" size={44} color={colors.light.primary} />
            </View>
          </View>

          <Text style={[styles.emptyTitle, { textAlign: 'center' }]}>
            {language === 'ar' ? 'لا توجد إشعارات' : 'No Notifications Yet'}
          </Text>

          <Text style={[styles.emptySubtitle, { textAlign: 'center' }]}>
            {language === 'ar'
              ? 'ستظهر هنا تنبيهات العروض وانخفاض الأسعار وتحديثات المتاجر'
              : 'Offer alerts, price drops, and store updates will appear here'}
          </Text>

          {/* Feature hints */}
          <View style={styles.hintList}>
            {[
              {
                icon: 'pricetag-outline',
                ar: 'تنبيهات عروض خاصة وخصومات حصرية',
                en: 'Exclusive deals and discount alerts',
              },
              {
                icon: 'trending-down-outline',
                ar: 'إشعارات انخفاض أسعار الهواتف',
                en: 'Phone price drop notifications',
              },
              {
                icon: 'storefront-outline',
                ar: 'تحديثات من المتاجر المفضلة لديك',
                en: 'Updates from your favourite stores',
              },
            ].map((hint) => (
              <View
                key={hint.en}
                style={[styles.hintRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              >
                <View style={styles.hintIconWrap}>
                  <Ionicons name={hint.icon as any} size={18} color={colors.light.primary} />
                </View>
                <Text
                  style={[
                    styles.hintText,
                    { textAlign: isRTL ? 'right' : 'left' },
                  ]}
                >
                  {language === 'ar' ? hint.ar : hint.en}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
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
    flex: 1,
    marginHorizontal: 12,
  },
  headerSpacer: { width: 38 },

  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  tabletScrollContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
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
    marginBottom: 40,
  },
  hintList: {
    width: '100%',
    gap: 14,
  },
  hintRow: {
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: 'rgba(15,23,42,0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  hintIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.secondaryForeground,
    lineHeight: 21,
  },
});
