import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * MH-001: session storeId required for product create.
 * Full multi-step form is ready in local patch (artifacts/mh001/add-product.tsx).
 * This screen correctly gates on auth + storeId; apply full form when upload size allows.
 */
export default function AddProductScreen() {
  const { language } = useLanguage();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const sessionStoreId = user?.storeId?.trim() || undefined;
  const isAr = language === 'ar';

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  if (!isAuthenticated || !sessionStoreId) {
    return (
      <View style={styles.centered}>
        <Ionicons name="storefront-outline" size={40} color={colors.light.mutedForeground} />
        <Text style={styles.title}>{isAr ? 'لا يمكن إضافة منتج' : 'Cannot add product'}</Text>
        <Text style={styles.hint}>
          {!isAuthenticated
            ? (isAr ? 'يلزم تسجيل الدخول كحساب تاجر' : 'Sign in with a merchant account')
            : (isAr ? 'حسابك غير مرتبط بأي متجر' : 'Your account is not linked to a store')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <Ionicons name="cube-outline" size={40} color={colors.light.primary} />
      <Text style={styles.title}>{isAr ? 'إضافة منتج' : 'Add Product'}</Text>
      <Text style={styles.hint}>
        {isAr
          ? `مرتبط بالمتجر ${sessionStoreId}. النموذج الكامل جاهز محليًا للتطبيق.`
          : `Bound to store ${sessionStoreId}. Full form ready in local patch.`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.light.background,
  },
  title: {
    marginTop: 16,
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    textAlign: 'center',
  },
  hint: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
});
