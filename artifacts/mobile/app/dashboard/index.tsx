/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

/**
 * MH-001: session storeId required.
 * Full dashboard UI: restore from main then apply local patch artifacts/mh001/index.tsx
 * reservations.tsx is fully fixed on this branch.
 */
export default function DashboardScreen() {
  const { language } = useLanguage();
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const storeId = user?.storeId?.trim() || undefined;
  const isAr = language === 'ar';

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.light.mutedForeground} />
        <Text style={styles.title}>{isAr ? 'يلزم تسجيل الدخول' : 'Login required'}</Text>
        <Text style={styles.hint}>
          {isAr
            ? 'سجّل دخولك كحساب تاجر للوصول إلى لوحة التحكم'
            : 'Sign in with a merchant account to open the dashboard'}
        </Text>
      </View>
    );
  }

  if (!storeId) {
    return (
      <View style={styles.centered}>
        <Ionicons name="storefront-outline" size={40} color={colors.light.mutedForeground} />
        <Text style={styles.title}>{isAr ? 'لا يوجد متجر مرتبط' : 'No store linked'}</Text>
        <Text style={styles.hint}>
          {isAr
            ? 'حسابك غير مرتبط بأي متجر. تواصل مع الإدارة.'
            : 'Your account is not linked to any store. Contact support.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <Ionicons name="storefront" size={40} color={colors.light.primary} />
      <Text style={styles.title}>{isAr ? 'لوحة التاجر' : 'Merchant Dashboard'}</Text>
      <Text style={styles.hint}>
        {isAr ? `متجرك: ${storeId}` : `Store: ${storeId}`}
      </Text>
      <Pressable
        style={styles.btn}
        onPress={() => router.push('/dashboard/reservations' as any)}
      >
        <Text style={styles.btnText}>{isAr ? 'إدارة الحجوزات' : 'Reservations'}</Text>
      </Pressable>
      <Pressable
        style={styles.btn}
        onPress={() => router.push('/dashboard/add-product' as any)}
      >
        <Text style={styles.btnText}>{isAr ? 'إضافة منتج' : 'Add Product'}</Text>
      </Pressable>
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
  btn: {
    marginTop: 16,
    backgroundColor: colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});
