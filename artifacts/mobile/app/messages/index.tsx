import React, { useCallback, useMemo } from 'react';
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
import Animated, { FadeInUp } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeviceId } from '@/hooks/useDeviceId';
import { useLayout } from '@/hooks/useLayout';
import {
  useGetConversations,
  useGetStores,
  type ConversationDto,
} from '@workspace/api-client-react';
import ConversationItem from '@/components/messaging/ConversationItem';

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyConversations({ language, isRTL }: { language: 'ar' | 'en'; isRTL: boolean }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="chatbubbles-outline" size={48} color={colors.light.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
        {language === 'ar' ? 'لا توجد محادثات' : 'No conversations yet'}
      </Text>
      <Text style={[styles.emptySubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
        {language === 'ar'
          ? 'تواصل مع البائعين من صفحة المتجر أو المنتج'
          : 'Message a seller from a store or product page'}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const { language, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();
  const deviceId = useDeviceId();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const {
    data: conversations = [],
    isLoading,
    isError,
    refetch,
  } = useGetConversations(
    { buyerId: deviceId ?? undefined },
    { query: { enabled: !!deviceId, staleTime: 30_000 } },
  );

  // Batch-load all unique stores referenced by conversations in a single request
  const uniqueStoreIds = useMemo(
    () => Array.from(new Set(conversations.map((c) => c.storeId))),
    [conversations],
  );
  const { data: storesData = [] } = useGetStores(
    { ids: uniqueStoreIds.join(',') },
    { query: { enabled: uniqueStoreIds.length > 0, staleTime: 5 * 60 * 1000 } },
  );

  const storeMap = React.useMemo(() => {
    const map: Record<string, { nameAr: string; nameEn: string; logoColor: string; logoInitial: string }> = {};
    for (const s of storesData) {
      map[s.id] = { nameAr: s.nameAr, nameEn: s.nameEn, logoColor: s.logoColor, logoInitial: s.logoInitial };
    }
    return map;
  }, [storesData]);

  const handleOpen = useCallback((conv: ConversationDto) => {
    router.push(`/messages/${conv.id}` as any);
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={[styles.headerInner, isTablet && styles.tabletInner]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={24}
              color={colors.light.foreground}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'رسائلي' : 'Messages'}
          </Text>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.tabletScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.light.primary} />
          </View>
        )}

        {isError && !isLoading && (
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={36} color={colors.light.mutedForeground} />
            <Text style={styles.errorText}>
              {language === 'ar' ? 'فشل تحميل الرسائل' : 'Failed to load messages'}
            </Text>
            <Pressable onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryText}>
                {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </Text>
            </Pressable>
          </View>
        )}

        {!isLoading && !isError && conversations.length === 0 && (
          <EmptyConversations language={language} isRTL={isRTL} />
        )}

        {!isLoading && !isError && conversations.length > 0 && (
          <Animated.View entering={FadeInUp.duration(300)}>
            {conversations.map((conv) => {
              const store = storeMap[conv.storeId];
              return (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  storeNameAr={store?.nameAr}
                  storeNameEn={store?.nameEn}
                  storeLogoColor={store?.logoColor}
                  storeLogoInitial={store?.logoInitial}
                  language={language}
                  isRTL={isRTL}
                  unreadCount={conv.buyerUnreadCount}
                  onPress={() => handleOpen(conv)}
                />
              );
            })}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tabletInner: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    flex: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  tabletScrollContent: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.light.primary,
    borderRadius: 10,
    marginTop: 4,
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    lineHeight: 20,
    textAlign: 'center',
  },
});
