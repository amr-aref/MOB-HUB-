import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useLayout } from '@/hooks/useLayout';
import {
  useGetReservation,
  useCancelReservation,
  getGetReservationQueryKey,
} from '@workspace/api-client-react';

const STATUS: Record<string, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap; labelAr: string; labelEn: string }> = {
  pending:   { color: colors.light.warning,         bg: colors.light.warningLight, icon: 'time',                   labelAr: 'قيد الانتظار',   labelEn: 'Pending' },
  confirmed: { color: colors.light.success,         bg: colors.light.successLight, icon: 'checkmark-circle',       labelAr: 'مؤكد',           labelEn: 'Confirmed' },
  declined:  { color: colors.light.destructive,     bg: '#FEE2E2',                 icon: 'close-circle',           labelAr: 'مرفوض',          labelEn: 'Declined' },
  cancelled: { color: colors.light.mutedForeground, bg: colors.light.muted,        icon: 'ban',                    labelAr: 'ملغى',           labelEn: 'Cancelled' },
  completed: { color: colors.light.verifiedBlue,    bg: '#EFF6FF',                 icon: 'checkmark-done-circle',  labelAr: 'مكتمل',          labelEn: 'Completed' },
  expired:   { color: colors.light.mutedForeground, bg: colors.light.muted,        icon: 'alert-circle',           labelAr: 'منتهي',          labelEn: 'Expired' },
};

function formatDate(iso: string, isAr: boolean): string {
  const d = new Date(iso);
  const monthsAr = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const monthsEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const time = d.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  return isAr
    ? `${d.getDate()} ${monthsAr[d.getMonth()]} — ${time}`
    : `${monthsEn[d.getMonth()]} ${d.getDate()} — ${time}`;
}

export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isTablet } = useLayout();
  const [cancelling, setCancelling] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  // Identity comes from the authenticated token — do not send buyerId
  const { data: reservation, isLoading } = useGetReservation(
    id!,
    { query: { queryKey: getGetReservationQueryKey(id!), enabled: !!id } },
  );

  const { mutate: cancelRes } = useCancelReservation({
    mutation: {
      onMutate: () => setCancelling(true),
      onSettled: () => setCancelling(false),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
        queryClient.invalidateQueries({ queryKey: getGetReservationQueryKey(id!) });
      },
    },
  });

  function handleCancel() {
    Alert.alert(
      language === 'ar' ? 'إلغاء الحجز' : 'Cancel reservation',
      language === 'ar' ? 'هل تريد إلغاء هذا الحجز؟' : 'Are you sure you want to cancel?',
      [
        { text: language === 'ar' ? 'لا' : 'No', style: 'cancel' },
        {
          text: language === 'ar' ? 'نعم، ألغِ' : 'Yes, cancel',
          style: 'destructive',
          // buyerId is derived server-side from the authenticated token
          onPress: () => cancelRes({ id: id!, data: {} }),
        },
      ],
    );
  }

  if (isLoading || !reservation) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  const status = STATUS[reservation.status] ?? STATUS.pending;
  const canCancel = reservation.status === 'pending' || reservation.status === 'confirmed';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }, isTablet && styles.tabletInner]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.light.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>{language === 'ar' ? 'تفاصيل الحجز' : 'Reservation detail'}</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.body, isTablet && styles.tabletInner, { paddingBottom: 40 }]}>
        <View style={[styles.statusPill, { backgroundColor: status.bg, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Ionicons name={status.icon} size={16} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>
            {language === 'ar' ? status.labelAr : status.labelEn}
          </Text>
        </View>

        <Text style={[styles.productName, { textAlign: isRTL ? 'right' : 'left' }]}>
          {language === 'ar' ? reservation.product.nameAr : reservation.product.nameEn}
        </Text>
        <Text style={[styles.meta, { textAlign: isRTL ? 'right' : 'left' }]}>
          {language === 'ar' ? reservation.store.nameAr : reservation.store.nameEn}
        </Text>
        <Text style={[styles.meta, { textAlign: isRTL ? 'right' : 'left' }]}>
          {formatDate(reservation.createdAt, language === 'ar')}
        </Text>

        {canCancel && (
          <Pressable
            style={[styles.cancelBtn, cancelling && { opacity: 0.5 }]}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color={colors.light.destructive} />
            ) : (
              <Text style={styles.cancelBtnText}>
                {language === 'ar' ? 'إلغاء الحجز' : 'Cancel reservation'}
              </Text>
            )}
          </Pressable>
        )}

        {reservation.conversationId ? (
          <Pressable
            style={styles.chatBtn}
            onPress={() => router.push(`/messages/${reservation.conversationId}` as any)}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
            <Text style={styles.chatBtnText}>{language === 'ar' ? 'فتح المحادثة' : 'Open chat'}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  tabletInner: { maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: {
    backgroundColor: colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    paddingBottom: 12,
  },
  headerRow: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.light.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  body: { padding: 16 },
  statusPill: {
    alignSelf: 'flex-start', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: colors.radiusFull, marginBottom: 16,
  },
  statusText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  productName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.light.foreground, marginBottom: 6 },
  meta: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginBottom: 4 },
  cancelBtn: {
    marginTop: 24, paddingVertical: 14, borderRadius: colors.radiusMd,
    borderWidth: 1, borderColor: colors.light.destructive,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.light.destructive },
  chatBtn: {
    marginTop: 12, paddingVertical: 14, borderRadius: colors.radiusMd,
    backgroundColor: colors.light.primary, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  chatBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
});
