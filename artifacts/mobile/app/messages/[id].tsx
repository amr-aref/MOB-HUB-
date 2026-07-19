import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeviceId } from '@/hooks/useDeviceId';
import { useLayout } from '@/hooks/useLayout';
import {
  useGetConversation,
  getGetConversationQueryKey,
  useGetConversationMessages,
  getGetConversationMessagesQueryKey,
  useGetStore,
  getGetStoreQueryKey,
  useSendMessage,
  useMarkConversationRead,
  type ChatMessageDto,
} from '@workspace/api-client-react';
import MessageBubble from '@/components/messaging/MessageBubble';
import ChatInput from '@/components/messaging/ChatInput';

// ─── Date separator ───────────────────────────────────────────────────────────

function DateSeparator({ iso, isRTL }: { iso: string; isRTL: boolean }) {
  const d = new Date(iso);
  const label = d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <View style={[sepStyles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={sepStyles.line} />
      <Text style={sepStyles.label}>{label}</Text>
      <View style={sepStyles.line} />
    </View>
  );
}

const sepStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 16, marginVertical: 10, gap: 8 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(226,232,240,0.6)' },
  label: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },
});

// ─── Group messages by date for date separators ───────────────────────────────

type ListItem = { kind: 'separator'; date: string } | { kind: 'message'; message: ChatMessageDto };

function groupMessages(messages: ChatMessageDto[]): ListItem[] {
  const items: ListItem[] = [];
  let lastDate = '';
  for (const msg of messages) {
    const date = msg.createdAt.slice(0, 10);
    if (date !== lastDate) {
      items.push({ kind: 'separator', date: msg.createdAt });
      lastDate = date;
    }
    items.push({ kind: 'message', message: msg });
  }
  return items;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();
  const deviceId = useDeviceId();
  const listRef = useRef<FlatList<ListItem>>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessageDto[]>([]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  // ── Fetch conversation ──────────────────────────────────────────────────────
  const {
    data: conversation,
    isLoading: convLoading,
    isError: convError,
  } = useGetConversation(
    id!,
    { buyerId: deviceId ?? undefined },
    { query: { queryKey: getGetConversationQueryKey(id!, { buyerId: deviceId ?? undefined }), enabled: !!id && !!deviceId } },
  );

  // ── Fetch messages (poll every 10 s) ───────────────────────────────────────
  const {
    data: serverMessages = [],
    isLoading: msgsLoading,
    isError: msgsError,
    refetch: refetchMessages,
  } = useGetConversationMessages(
    id!,
    { buyerId: deviceId ?? undefined },
    { query: { queryKey: getGetConversationMessagesQueryKey(id!, { buyerId: deviceId ?? undefined }), enabled: !!id && !!deviceId, refetchInterval: 10_000 } },
  );

  // ── Fetch store for header ─────────────────────────────────────────────────
  const { data: store } = useGetStore(
    conversation?.storeId ?? '',
    { query: { queryKey: getGetStoreQueryKey(conversation?.storeId ?? ''), enabled: !!conversation?.storeId, staleTime: 5 * 60 * 1000 } },
  );

  // ── Send message mutation ───────────────────────────────────────────────────
  const { mutate: send, isPending: isSending } = useSendMessage({
    mutation: {
      onSuccess: (newMsg) => {
        // Drop optimistic message; server version will arrive on next poll.
        setOptimisticMessages((prev) =>
          prev.filter((m) => m.id !== `opt_${newMsg.conversationId}_${newMsg.content}`),
        );
        refetchMessages();
      },
    },
  });

  // ── Mark as read on mount / when conversation changes ────────────────────
  const { mutate: markRead } = useMarkConversationRead();

  useEffect(() => {
    if (conversation && deviceId && conversation.buyerUnreadCount > 0) {
      markRead({ id: id!, data: { readerType: 'buyer' } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id]);

  // ── Build flat message list (server + optimistic) ─────────────────────────
  const allMessages: ChatMessageDto[] = [...serverMessages, ...optimisticMessages];
  const grouped = groupMessages(allMessages);

  // ── Auto-scroll when new messages arrive ──────────────────────────────────
  useEffect(() => {
    if (grouped.length > 0) {
      const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
      return () => clearTimeout(t);
    }
  }, [grouped.length]);

  // ── Send handler ────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    (text: string) => {
      if (!deviceId || !id) return;

      const optimistic: ChatMessageDto = {
        id: `opt_${id}_${text}`,
        conversationId: id,
        senderType: 'buyer',
        senderId: deviceId,
        type: 'text',
        content: text,
        status: 'sent',
        createdAt: new Date().toISOString(),
      };
      setOptimisticMessages((prev) => [...prev, optimistic]);

      send({
        id,
        data: { senderId: deviceId, senderType: 'buyer', content: text, type: 'text' },
      });
    },
    [deviceId, id, send],
  );

  // ── Derived values ──────────────────────────────────────────────────────────
  const storeName =
    language === 'ar' ? (store?.nameAr ?? '...') : (store?.nameEn ?? '...');

  const productName =
    conversation?.productId
      ? (language === 'ar' ? conversation.productNameAr : conversation.productNameEn)
      : null;

  const isLoading = convLoading || msgsLoading;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topInset + 8 }]}>
          <View
            style={[
              styles.headerInner,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
              isTablet && styles.tabletInner,
            ]}
          >
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons
                name={isRTL ? 'chevron-forward' : 'chevron-back'}
                size={24}
                color={colors.light.foreground}
              />
            </Pressable>

            {store && (
              <View style={[styles.headerLogo, { backgroundColor: store.logoColor }]}>
                <Text style={styles.headerLogoText}>{store.logoInitial}</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text
                style={[styles.headerName, { textAlign: isRTL ? 'right' : 'left' }]}
                numberOfLines={1}
              >
                {storeName}
              </Text>
              {productName ? (
                <Text
                  style={[styles.headerProduct, { textAlign: isRTL ? 'right' : 'left' }]}
                  numberOfLines={1}
                >
                  {productName}
                </Text>
              ) : null}
            </View>

            <Pressable onPress={() => refetchMessages()} style={styles.refreshBtn}>
              <Ionicons name="refresh-outline" size={20} color={colors.light.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {/* Message list */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.light.primary} />
          </View>
        ) : msgsError || convError ? (
          <View style={styles.centered}>
            <Ionicons name="cloud-offline-outline" size={36} color={colors.light.mutedForeground} />
            <Text style={styles.errorText}>
              {language === 'ar' ? 'فشل تحميل الرسائل' : 'Failed to load messages'}
            </Text>
            <Pressable onPress={() => refetchMessages()} style={styles.retryBtn}>
              <Text style={styles.retryText}>
                {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={grouped}
            keyExtractor={(item, i) =>
              item.kind === 'message' ? item.message.id : `sep_${i}`
            }
            renderItem={({ item }) =>
              item.kind === 'separator' ? (
                <DateSeparator iso={item.date} isRTL={isRTL} />
              ) : (
                <MessageBubble
                  message={item.message}
                  viewerIsBuyer
                  isRTL={isRTL}
                />
              )
            }
            contentContainerStyle={[
              styles.listContent,
              grouped.length === 0 && styles.listEmpty,
            ]}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Ionicons name="chatbubble-outline" size={36} color={colors.light.mutedForeground} />
                <Text style={styles.emptyText}>
                  {language === 'ar' ? 'ابدأ المحادثة' : 'Start the conversation'}
                </Text>
              </View>
            }
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input */}
        {!convError && (
          <ChatInput onSend={handleSend} isSending={isSending} isRTL={isRTL} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerInner: {
    alignItems: 'center',
    gap: 10,
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
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  headerName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
  },
  headerProduct: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.light.primary,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingTop: 12, paddingBottom: 12 },
  listEmpty: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 48,
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
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    textAlign: 'center',
  },
});
