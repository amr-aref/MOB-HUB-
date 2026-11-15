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
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/hooks/useLayout';
import {
  useGetConversations,
  getGetConversationsQueryKey,
  useGetStores,
  getGetStoresQueryKey,
  type ConversationDto,
} from '@workspace/api-client-react';
import ConversationItem from '@/components/messaging/ConversationItem';

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

export default function MessagesScreen() {
  const { language, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();
  const { isAuthenticated } = useAuth();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  // Identity from JWT session — backend uses req.user.sub; do not send client buyerId/deviceId.
  const {
    data: conversations = [],
    isLoading,
    isError,
    refetch,
  } = useGetConversations(
    undefined,
    { query: { queryKey: getGetConversationsQueryKey(), enabled: isAuthenticated, staleTime: 30_000 } },
  );

  const uniqueStoreIds = useMemo(
    () => Array.from(new Set(conversations.map((c) => c.storeId))),
    [conversations],
  );
  const { data: storesData = [] } = useGetStores(
    { ids: uniqueStoreIds.join(',') },
    {
      query: {
        queryKey: getGetStoresQueryKey({ ids: uniqueStoreIds.join(',') }),
        enabled: uniqueStoreIds.length > 0,
        staleTime: 5 * 60 * 1000,
      },
    },
  );

  const storeMap = React.useMemo(() => {
    const map: Record<
      string,
      { nameAr: string; nameEn: string; logoColor: string; logoInitial: string }
    > = {};
    for (const s of storesData) {
      map[s.id] = {
        nameAr: s.nameAr,
        nameEn: s.nameEn,
        logoColor: s.logoColor,
        logoInitial: s.logoInitial,
      };
    }
    return map;
  }, [storesData]);

  const handleOpen = useCallback(
    (conv: ConversationDto) => {
      router.push(`/messages/${conv.id}` as any);
    },
    [router],
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.light.mutedForeground} />
        <Text style={[styles.emptyTitle, { textAlign: 'center' }]}>
          {language === 'ar' ? 'يلزم تسجيل الدخول' : 'Login required'}
        </Text>
        <Text style={[styles.emptySubtitle, { textAlign: 'center' }]}>
          {language === 'ar'
            ? 'سجّل دخولك لعرض محادثاتك مع البائعين'
            : 'Sign in to view your conversations with sellers'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <Text style={styles.emptyTitle}>
              {language === 'ar' ? 'تعذر التحميل' : 'Could not load'}
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

        {!isLoading &&
          conversations.map((conv, index) => {
            const store = storeMap[conv.storeId];
            return (
              <Animated.View key={conv.id} entering={FadeInUp.delay(index * 40).springify()}>
                <ConversationItem
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
              </Animated.View>
            );
          })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  header: {
    backgroundColor: colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tabletInner: { maxWidth: 680, alignSelf: 'center', width: '100%' },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.muted,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingVertical: 8, paddingBottom: 32 },
  tabletScrollContent: { maxWidth: 680, alignSelf: 'center', width: '100%' },
  emptyContainer: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 80 },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.light.primary,
  },
  retryText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
