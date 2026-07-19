import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLayout } from '@/hooks/useLayout';
import {
  useGetReservations,
  getGetReservationsQueryKey,
  useConfirmReservation,
  useDeclineReservation,
  useCompleteReservation,
} from '@workspace/api-client-react';
import type { ReservationDto } from '@workspace/api-client-react';

const STORE_ID = 's1';

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { color: string; bg: string; labelAr: string; labelEn: string }> = {
  pending:   { color: colors.light.warning,        bg: colors.light.warningLight, labelAr: 'قيد الانتظار', labelEn: 'Pending' },
  confirmed: { color: colors.light.success,        bg: colors.light.successLight, labelAr: 'مؤكد',          labelEn: 'Confirmed' },
  declined:  { color: colors.light.destructive,    bg: '#FEE2E2',                 labelAr: 'مرفوض',         labelEn: 'Declined' },
  cancelled: { color: colors.light.mutedForeground,bg: colors.light.muted,        labelAr: 'ملغى',           labelEn: 'Cancelled' },
  completed: { color: colors.light.verifiedBlue,   bg: '#EFF6FF',                 labelAr: 'مكتمل',         labelEn: 'Completed' },
  expired:   { color: colors.light.mutedForeground,bg: colors.light.muted,        labelAr: 'منتهي',         labelEn: 'Expired' },
};

const FILTER_TABS = [
  { key: 'all',       ar: 'الكل',          en: 'All' },
  { key: 'pending',   ar: 'قيد الانتظار', en: 'Pending' },
  { key: 'confirmed', ar: 'مؤكد',          en: 'Confirmed' },
  { key: 'completed', ar: 'مكتمل',         en: 'Completed' },
  { key: 'declined',  ar: 'مرفوض',         en: 'Declined' },
];

function formatDate(iso: string, isAr: boolean): string {
  const d = new Date(iso);
  const monthsAr = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  const monthsEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return isAr
    ? `${d.getDate()} ${monthsAr[d.getMonth()]}`
    : `${monthsEn[d.getMonth()]} ${d.getDate()}`;
}

function formatExpiry(iso: string, isAr: boolean): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return isAr ? 'انتهى' : 'Expired';
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return isAr ? `${hours} س` : `${hours}h`;
  return isAr ? `${Math.floor(hours / 24)} ي` : `${Math.floor(hours / 24)}d`;
}

// ─── Reservation card (merchant view) ────────────────────────────────────────

function MerchantReservationCard({
  item,
  isRTL,
  language,
  onConfirm,
  onDecline,
  onComplete,
  onOpenChat,
  actionLoading,
}: {
  item: ReservationDto;
  isRTL: boolean;
  language: 'ar' | 'en';
  onConfirm: () => void;
  onDecline: () => void;
  onComplete: () => void;
  onOpenChat: (() => void) | null;
  actionLoading: boolean;
}) {
  const st = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
  const productName = language === 'ar' ? item.product.nameAr : item.product.nameEn;
  const buyerShort = item.buyerId.slice(0, 10) + '…';
  const isActive = item.status === 'pending' || item.status === 'confirmed';

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={[styles.cardTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Product visual */}
        <View style={[styles.productCircle, { backgroundColor: item.product.imageColor + '22', borderColor: item.product.imageColor + '44' }]}>
          <Ionicons name="phone-portrait" size={20} color={item.product.imageColor} />
        </View>

        {/* Info */}
        <View style={{ flex: 1, marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }}>
          <Text style={[styles.productName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {productName}
          </Text>
          <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginTop: 2 }]}>
            <Ionicons name="person-outline" size={12} color={colors.light.mutedForeground} />
            <Text style={styles.buyerText}>{buyerShort}</Text>
          </View>
          <Text style={[styles.priceText, { textAlign: isRTL ? 'right' : 'left' }]}>
            {item.product.price.toLocaleString()} {language === 'ar' ? 'ج.م' : 'EGP'}
          </Text>
        </View>

        {/* Status badge */}
        <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 4 }}>
          <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
            <Text style={[styles.statusText, { color: st.color }]}>
              {language === 'ar' ? st.labelAr : st.labelEn}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.createdAt, language === 'ar')}</Text>
          {isActive && item.expiresAt && (
            <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 3 }]}>
              <Ionicons name="timer-outline" size={10} color={colors.light.warning} />
              <Text style={styles.expiryText}>{formatExpiry(item.expiresAt, language === 'ar')}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Buyer notes */}
      {item.buyerNotes && (
        <View style={[styles.notesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={13} color={colors.light.mutedForeground} />
          <Text style={[styles.notesText, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
            {item.buyerNotes}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      {item.status === 'pending' && (
        <View style={[styles.actionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable
            style={[styles.actionBtn, styles.confirmBtn, actionLoading && { opacity: 0.5 }]}
            onPress={onConfirm}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={15} color="#fff" />
                <Text style={styles.confirmBtnText}>{language === 'ar' ? 'تأكيد' : 'Confirm'}</Text>
              </>
            )}
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.declineBtn, actionLoading && { opacity: 0.5 }]}
            onPress={onDecline}
            disabled={actionLoading}
          >
            <Ionicons name="close" size={15} color={colors.light.destructive} />
            <Text style={styles.declineBtnText}>{language === 'ar' ? 'رفض' : 'Decline'}</Text>
          </Pressable>
        </View>
      )}

      {item.status === 'confirmed' && (
        <View style={[styles.actionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable
            style={[styles.actionBtn, styles.completeBtn, actionLoading && { opacity: 0.5 }]}
            onPress={onComplete}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="storefront" size={15} color="#fff" />
                <Text style={styles.confirmBtnText}>{language === 'ar' ? 'تم الاستلام' : 'Mark Completed'}</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      {/* Open conversation with buyer */}
      {onOpenChat && (
        <View style={[styles.actionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable
            style={[styles.actionBtn, styles.chatBtn, actionLoading && { opacity: 0.5 }]}
            onPress={onOpenChat}
            disabled={actionLoading}
            accessibilityRole="button"
            accessibilityLabel={language === 'ar' ? 'فتح المحادثة مع المشتري' : 'Open conversation with buyer'}
          >
            <Ionicons name="chatbubble-outline" size={15} color={colors.light.primary} />
            <Text style={styles.chatBtnText}>{language === 'ar' ? 'فتح المحادثة' : 'Open Chat'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MerchantReservationsScreen() {
  const { isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null); // reservation id or null

  // Decline modal
  const [declineModal, setDeclineModal] = useState<{ id: string } | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const { data: reservations = [], isLoading, refetch } = useGetReservations(
    { storeId: STORE_ID, ...(activeFilter !== 'all' ? { status: activeFilter } : {}) },
    { query: { queryKey: getGetReservationsQueryKey({ storeId: STORE_ID, ...(activeFilter !== 'all' ? { status: activeFilter } : {}) }), staleTime: 15_000 } },
  );

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
  }

  const { mutate: confirm } = useConfirmReservation({
    mutation: {
      onMutate: ({ id }) => setActionLoading(id),
      onSettled: () => setActionLoading(null),
      onSuccess: invalidateAll,
    },
  });

  const { mutate: decline } = useDeclineReservation({
    mutation: {
      onMutate: ({ id }) => setActionLoading(id),
      onSettled: () => { setActionLoading(null); setDeclineModal(null); setDeclineReason(''); },
      onSuccess: invalidateAll,
    },
  });

  const { mutate: complete } = useCompleteReservation({
    mutation: {
      onMutate: ({ id }) => setActionLoading(id),
      onSettled: () => setActionLoading(null),
      onSuccess: invalidateAll,
    },
  });

  function submitDecline() {
    if (!declineModal) return;
    decline({
      id: declineModal.id,
      data: { storeId: STORE_ID, ...(declineReason.trim() ? { cancellationReason: declineReason.trim() } : {}) },
    });
  }

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
              {language === 'ar' ? 'إدارة الحجوزات' : 'Reservation Management'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.tabs, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            {FILTER_TABS.map((tab) => {
              const count = tab.key !== 'all' && !isLoading
                ? reservations.filter((r) => r.status === tab.key).length
                : null;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setActiveFilter(tab.key)}
                  style={[styles.tab, activeFilter === tab.key && styles.tabActive]}
                >
                  <Text style={[styles.tabText, activeFilter === tab.key && styles.tabTextActive]}>
                    {language === 'ar' ? tab.ar : tab.en}
                    {count !== null && count > 0 ? ` (${count})` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.light.primary} />
        </View>
      ) : reservations.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="calendar-outline" size={40} color={colors.light.mutedForeground} />
          </View>
          <Text style={styles.emptyTitle}>
            {language === 'ar' ? 'لا توجد حجوزات' : 'No reservations'}
          </Text>
          <Text style={styles.emptyHint}>
            {language === 'ar' ? 'ستظهر طلبات الحجز هنا' : 'Reservation requests will appear here'}
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
              <MerchantReservationCard
                item={item}
                isRTL={isRTL}
                language={language}
                actionLoading={actionLoading === item.id}
                onConfirm={() => confirm({ id: item.id, data: { storeId: STORE_ID } })}
                onDecline={() => { setDeclineModal({ id: item.id }); setDeclineReason(''); }}
                onComplete={() => complete({ id: item.id, data: { storeId: STORE_ID } })}
                onOpenChat={item.conversationId ? () => router.push(`/messages/${item.conversationId}` as any) : null}
              />
            </View>
          )}
        />
      )}

      {/* Decline modal */}
      <Modal
        visible={!!declineModal}
        transparent
        animationType="slide"
        onRequestClose={() => setDeclineModal(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDeclineModal(null)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'رفض الحجز' : 'Decline Reservation'}
          </Text>
          <Text style={[styles.modalSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'سبب الرفض (اختياري)' : 'Reason for declining (optional)'}
          </Text>
          <TextInput
            style={[styles.reasonInput, { textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={language === 'ar' ? 'أضف سبباً...' : 'Add a reason...'}
            placeholderTextColor={colors.light.mutedForeground}
            value={declineReason}
            onChangeText={setDeclineReason}
            multiline
            maxLength={500}
          />
          <View style={[styles.modalActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable
              style={styles.modalCancelBtn}
              onPress={() => setDeclineModal(null)}
            >
              <Text style={styles.modalCancelText}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Text>
            </Pressable>
            <Pressable
              style={[styles.modalDeclineBtn, actionLoading && { opacity: 0.5 }]}
              onPress={submitDecline}
              disabled={!!actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalDeclineText}>{language === 'ar' ? 'رفض الحجز' : 'Decline'}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
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

  tabs: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: colors.radiusFull,
    backgroundColor: colors.light.muted,
  },
  tabActive: { backgroundColor: colors.light.primary },
  tabText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground },
  tabTextActive: { color: '#fff', fontFamily: 'Inter_700Bold' },

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
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 10,
    ...colors.light.shadowSm,
  },
  cardTop: { alignItems: 'flex-start' },
  productCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  buyerText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },
  priceText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.light.primary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: colors.radiusFull,
  },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  dateText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },
  expiryText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.light.warning },

  notesRow: { gap: 6, alignItems: 'flex-start', backgroundColor: colors.light.muted, borderRadius: 8, padding: 8 },
  notesText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.light.foreground, flex: 1 },

  actionsRow: { gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: colors.radiusMd,
  },
  confirmBtn: { backgroundColor: colors.light.success },
  declineBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: colors.light.destructive + '30' },
  completeBtn: { backgroundColor: colors.light.verifiedBlue },
  confirmBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  declineBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.light.destructive },
  chatBtn: { backgroundColor: colors.light.primaryLight, borderWidth: 1, borderColor: colors.light.primary + '30' },
  chatBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.light.primary },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: colors.light.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
    ...colors.light.shadowLg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.light.border,
    alignSelf: 'center',
    marginBottom: 4,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  modalSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },
  reasonInput: {
    backgroundColor: colors.light.muted,
    borderRadius: colors.radiusMd,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.foreground,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  modalActions: { gap: 10 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: colors.radiusMd,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.light.mutedForeground },
  modalDeclineBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: colors.radiusMd,
    backgroundColor: colors.light.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeclineText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
});
