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
import { useDeviceId } from '@/hooks/useDeviceId';
import { useLayout } from '@/hooks/useLayout';
import {
  useGetReservation,
  useCancelReservation,
  getGetReservationQueryKey,
} from '@workspace/api-client-react';

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { color: string; bg: string; icon: keyof typeof Ionicons.glyphMap; labelAr: string; labelEn: string }> = {
  pending:   { color: colors.light.warning,        bg: colors.light.warningLight, icon: 'time',                   labelAr: 'قيد الانتظار', labelEn: 'Pending' },
  confirmed: { color: colors.light.success,        bg: colors.light.successLight, icon: 'checkmark-circle',       labelAr: 'مؤكد',          labelEn: 'Confirmed' },
  declined:  { color: colors.light.destructive,    bg: '#FEE2E2',                 icon: 'close-circle',           labelAr: 'مرفوض',         labelEn: 'Declined' },
  cancelled: { color: colors.light.mutedForeground,bg: colors.light.muted,        icon: 'ban',                    labelAr: 'ملغى',           labelEn: 'Cancelled' },
  completed: { color: colors.light.verifiedBlue,   bg: '#EFF6FF',                 icon: 'checkmark-done-circle',  labelAr: 'مكتمل',         labelEn: 'Completed' },
  expired:   { color: colors.light.mutedForeground,bg: colors.light.muted,        icon: 'alert-circle',           labelAr: 'منتهي',         labelEn: 'Expired' },
};

function formatDateTime(iso: string, isAr: boolean): string {
  const d = new Date(iso);
  const monthsAr = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const monthsEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return isAr
    ? `${d.getDate()} ${monthsAr[d.getMonth()]} — ${time}`
    : `${monthsEn[d.getMonth()]} ${d.getDate()} — ${time}`;
}

function formatExpiry(iso: string, isAr: boolean): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return isAr ? 'انتهت صلاحية الحجز' : 'Reservation expired';
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return isAr ? 'أقل من ساعة' : 'Less than 1 hour';
  if (hours < 24) return isAr ? `${hours} ساعة متبقية` : `${hours}h remaining`;
  const days = Math.floor(hours / 24);
  return isAr ? `${days} يوم متبق` : `${days} day${days > 1 ? 's' : ''} remaining`;
}

// ─── Timeline dot ─────────────────────────────────────────────────────────────

function TimelineDot({
  done,
  active,
  failed,
  icon,
  labelAr,
  labelEn,
  dateIso,
  isRTL,
  language,
  isLast,
}: {
  done: boolean;
  active: boolean;
  failed?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  labelAr: string;
  labelEn: string;
  dateIso?: string | null;
  isRTL: boolean;
  language: 'ar' | 'en';
  isLast?: boolean;
}) {
  const dotColor = failed
    ? colors.light.destructive
    : done || active
    ? colors.light.primary
    : colors.light.border;
  const label = language === 'ar' ? labelAr : labelEn;

  return (
    <View style={[tlStyles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={{ alignItems: 'center', width: 32 }}>
        <View style={[tlStyles.dot, { backgroundColor: dotColor, opacity: done || active ? 1 : 0.3 }]}>
          <Ionicons name={icon} size={14} color="#fff" />
        </View>
        {!isLast && <View style={[tlStyles.line, { backgroundColor: done ? colors.light.primary : colors.light.border }]} />}
      </View>
      <View style={{ flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0, paddingBottom: isLast ? 0 : 20 }}>
        <Text style={[tlStyles.label, { textAlign: isRTL ? 'right' : 'left', color: done || active ? colors.light.foreground : colors.light.mutedForeground }]}>
          {label}
        </Text>
        {dateIso && (
          <Text style={[tlStyles.date, { textAlign: isRTL ? 'right' : 'left' }]}>
            {formatDateTime(dateIso, language === 'ar')}
          </Text>
        )}
      </View>
    </View>
  );
}

const tlStyles = StyleSheet.create({
  row: { alignItems: 'flex-start' },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginTop: 2,
  },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  date: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginTop: 2 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();
  const deviceId = useDeviceId();
  const queryClient = useQueryClient();

  const [cancelling, setCancelling] = useState(false);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const { data: reservation, isLoading } = useGetReservation(
    id!,
    deviceId ? { buyerId: deviceId } : {},
    { query: { queryKey: getGetReservationQueryKey(id!, deviceId ? { buyerId: deviceId } : {}), enabled: !!id && !!deviceId, staleTime: 15_000 } },
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
    if (!deviceId) return;
    Alert.alert(
      language === 'ar' ? 'إلغاء الحجز' : 'Cancel Reservation',
      language === 'ar' ? 'هل تريد إلغاء هذا الحجز؟' : 'Are you sure you want to cancel?',
      [
        { text: language === 'ar' ? 'لا' : 'No', style: 'cancel' },
        {
          text: language === 'ar' ? 'نعم، إلغاء' : 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelRes({ id: id!, data: { buyerId: deviceId } }),
        },
      ],
    );
  }

  if (!deviceId || isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  if (!reservation) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.light.mutedForeground} />
        <Text style={styles.notFoundText}>
          {language === 'ar' ? 'الحجز غير موجود' : 'Reservation not found'}
        </Text>
        <Pressable style={styles.backBtnCenter} onPress={() => router.back()}>
          <Text style={styles.backBtnCenterText}>
            {language === 'ar' ? 'رجوع' : 'Go Back'}
          </Text>
        </Pressable>
      </View>
    );
  }

  const st = STATUS_STYLE[reservation.status] ?? STATUS_STYLE.pending;
  const productName = language === 'ar' ? reservation.product.nameAr : reservation.product.nameEn;
  const storeName   = language === 'ar' ? reservation.store.nameAr   : reservation.store.nameEn;
  const canCancel   = reservation.status === 'pending' || reservation.status === 'confirmed';
  const isActive    = reservation.status === 'pending' || reservation.status === 'confirmed';

  // Build timeline
  const isBad = reservation.status === 'declined' || reservation.status === 'cancelled' || reservation.status === 'expired';

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
              {language === 'ar' ? 'تفاصيل الحجز' : 'Reservation Details'}
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100, alignItems: isTablet ? 'center' : undefined }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={isTablet ? styles.tabletInner : { width: '100%' }}>

          {/* Status hero */}
          <View style={[styles.statusHero, { backgroundColor: st.bg }]}>
            <Ionicons name={st.icon} size={36} color={st.color} />
            <Text style={[styles.statusHeroLabel, { color: st.color }]}>
              {language === 'ar' ? st.labelAr : st.labelEn}
            </Text>
            {isActive && reservation.expiresAt && (
              <Text style={[styles.expiryText, { color: st.color }]}>
                {formatExpiry(reservation.expiresAt, language === 'ar')}
              </Text>
            )}
          </View>

          {/* Product card */}
          <View style={styles.card}>
            <Text style={[styles.cardLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'المنتج' : 'Product'}
            </Text>
            <View style={[styles.productRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.productCircle, { backgroundColor: reservation.product.imageColor + '20', borderColor: reservation.product.imageColor + '40' }]}>
                <Ionicons name="phone-portrait" size={26} color={reservation.product.imageColor} />
              </View>
              <View style={{ flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
                <Text style={[styles.productName, { textAlign: isRTL ? 'right' : 'left' }]}>{productName}</Text>
                <Text style={[styles.productBrand, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {reservation.product.brand} · {reservation.product.model}
                </Text>
                <Text style={[styles.productPrice, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {reservation.product.price.toLocaleString()} {language === 'ar' ? 'ج.م' : 'EGP'}
                </Text>
              </View>
            </View>
          </View>

          {/* Store card */}
          <View style={styles.card}>
            <Text style={[styles.cardLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'المتجر' : 'Store'}
            </Text>
            <View style={[styles.storeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.storeLogo, { backgroundColor: reservation.store.logoColor }]}>
                <Text style={styles.storeLogoText}>{reservation.store.logoInitial}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
                <Text style={[styles.storeName, { textAlign: isRTL ? 'right' : 'left' }]}>{storeName}</Text>
                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }]}>
                  <Ionicons name="location-outline" size={12} color={colors.light.mutedForeground} />
                  <Text style={styles.storeAddr} numberOfLines={1}>{reservation.store.address}</Text>
                </View>
              </View>
              <Pressable
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${reservation.store.phone}`)}
              >
                <Ionicons name="call-outline" size={18} color={colors.light.primary} />
              </Pressable>
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.card}>
            <Text style={[styles.cardLabel, { textAlign: isRTL ? 'right' : 'left', marginBottom: 16 }]}>
              {language === 'ar' ? 'حالة الحجز' : 'Reservation Status'}
            </Text>

            <TimelineDot
              done
              active={false}
              icon="bookmark"
              labelAr="تم إرسال طلب الحجز"
              labelEn="Reservation submitted"
              dateIso={reservation.createdAt}
              isRTL={isRTL}
              language={language}
            />

            {(reservation.status === 'confirmed' || reservation.status === 'completed') && (
              <TimelineDot
                done
                active={false}
                icon="checkmark-circle"
                labelAr="تم تأكيد الحجز من المتجر"
                labelEn="Confirmed by store"
                dateIso={reservation.confirmedAt}
                isRTL={isRTL}
                language={language}
              />
            )}

            {reservation.status === 'declined' && (
              <TimelineDot
                done={false}
                active={false}
                failed
                icon="close-circle"
                labelAr="تم رفض الحجز"
                labelEn="Reservation declined"
                dateIso={reservation.declinedAt}
                isRTL={isRTL}
                language={language}
              />
            )}

            {reservation.status === 'cancelled' && (
              <TimelineDot
                done={false}
                active={false}
                failed
                icon="ban"
                labelAr={reservation.cancelledBy === 'merchant' ? 'ألغى المتجر الحجز' : 'ألغيت الحجز'}
                labelEn={reservation.cancelledBy === 'merchant' ? 'Cancelled by store' : 'Cancelled by you'}
                dateIso={reservation.cancelledAt}
                isRTL={isRTL}
                language={language}
              />
            )}

            {reservation.status === 'pending' && (
              <TimelineDot
                done={false}
                active
                icon="time"
                labelAr="في انتظار تأكيد المتجر"
                labelEn="Awaiting store confirmation"
                isRTL={isRTL}
                language={language}
              />
            )}

            {reservation.status === 'completed' && (
              <TimelineDot
                done
                active={false}
                icon="storefront"
                labelAr="تم الاستلام من المتجر"
                labelEn="Picked up from store"
                dateIso={reservation.completedAt}
                isRTL={isRTL}
                language={language}
                isLast
              />
            )}

            {reservation.status !== 'completed' && !isBad && (
              <TimelineDot
                done={false}
                active={false}
                icon="storefront"
                labelAr="زيارة المتجر واستلام الجهاز"
                labelEn="Visit store & pick up device"
                isRTL={isRTL}
                language={language}
                isLast
              />
            )}
          </View>

          {/* Notes */}
          {(reservation.buyerNotes || reservation.merchantNotes) && (
            <View style={styles.card}>
              {reservation.buyerNotes && (
                <>
                  <Text style={[styles.cardLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {language === 'ar' ? 'ملاحظاتك' : 'Your Notes'}
                  </Text>
                  <Text style={[styles.noteText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {reservation.buyerNotes}
                  </Text>
                </>
              )}
              {reservation.merchantNotes && (
                <>
                  <Text style={[styles.cardLabel, { textAlign: isRTL ? 'right' : 'left', marginTop: reservation.buyerNotes ? 12 : 0 }]}>
                    {language === 'ar' ? 'ملاحظة المتجر' : 'Store Note'}
                  </Text>
                  <Text style={[styles.noteText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {reservation.merchantNotes}
                  </Text>
                </>
              )}
            </View>
          )}

          {/* Reservation ID */}
          <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.metaKey}>{language === 'ar' ? 'رقم الحجز' : 'Reservation ID'}</Text>
            <Text style={styles.metaVal} numberOfLines={1}>{reservation.id}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action bar */}
      {(canCancel || reservation.conversationId) && (
        <View style={[styles.actionBar, { paddingBottom: bottomInset + 12 }]}>
          {reservation.conversationId && (
            <Pressable
              style={styles.chatBtn}
              onPress={() => router.push(`/messages/${reservation.conversationId}` as any)}
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.light.primary} />
              <Text style={styles.chatBtnText}>
                {language === 'ar' ? 'فتح المحادثة' : 'Open Chat'}
              </Text>
            </Pressable>
          )}
          {canCancel && (
            <Pressable
              style={[styles.cancelBtn, cancelling && { opacity: 0.5 }]}
              onPress={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color={colors.light.destructive} />
              ) : (
                <>
                  <Ionicons name="close-outline" size={18} color={colors.light.destructive} />
                  <Text style={styles.cancelBtnText}>
                    {language === 'ar' ? 'إلغاء الحجز' : 'Cancel Reservation'}
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  tabletInner: { width: '100%', maxWidth: 680, alignSelf: 'center' },

  header: {
    backgroundColor: colors.light.card,
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
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.light.foreground },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  statusHero: {
    borderRadius: colors.radiusLg,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  statusHeroLabel: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  expiryText: { fontSize: 13, fontFamily: 'Inter_500Medium', opacity: 0.8 },

  card: {
    backgroundColor: colors.light.card,
    borderRadius: colors.radiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.light.border,
    ...colors.light.shadowSm,
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  productRow: { alignItems: 'center' },
  productCircle: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  productBrand: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },
  productPrice: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.light.primary, marginTop: 4 },

  storeRow: { alignItems: 'center' },
  storeLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogoText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  storeName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  storeAddr: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, flex: 1 },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noteText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.foreground,
    lineHeight: 20,
  },

  metaRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  metaKey: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground },
  metaVal: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.textTertiary, flex: 1, textAlign: 'right' },

  actionBar: {
    backgroundColor: colors.light.card,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    paddingTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: colors.radiusMd,
    backgroundColor: colors.light.primaryLight,
    borderWidth: 1,
    borderColor: colors.light.primary + '40',
  },
  chatBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.light.primary },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: colors.radiusMd,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: colors.light.destructive + '30',
  },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.light.destructive },

  notFoundText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.mutedForeground,
    marginTop: 12,
    marginBottom: 20,
  },
  backBtnCenter: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.light.primary,
    borderRadius: colors.radiusMd,
  },
  backBtnCenterText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
});
