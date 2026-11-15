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
import { useAuth } from '@/contexts/AuthContext';
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

function DateSeparator({ iso, isRTL }: { iso: string; isRTL: boolean }) {
  const d = new Date(iso);
  const label = d.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <View style={styles.dateSep}>
      <Text style={[styles.dateSepText, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
    </View>
  );
}

type ListItem =
  | { kind: 'separator'; date: string }
  | { kind: 'message'; message: ChatMessageDto };

function buildListItems(messages: ChatMessageDto[]): ListItem[] {
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

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();
  const { user, isAuthenticated } = useAuth();
  const listRef = useRef<FlatList<ListItem>>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessageDto[]>([]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const {
    data: conversation,
    isLoading: convLoading,
    isError: convError,
  } = useGetConversation(
    id!,
    undefined,
    { query: { queryKey: getGetConversationQueryKey(id!), enabled: !!id && isAuthenticated } },
  );

  const {
    data: serverMessages = [],
    isLoading: msgsLoading,
    isError: msgsError,
    refetch: refetchMessages,
  } = useGetConversationMessages(
    id!,
    undefined,
    {
      query: {
        queryKey: getGetConversationMessagesQueryKey(id!),
        enabled: !!id && isAuthenticated,
        refetchInterval: 10_000,
      },
    },
  );

  const { data: store } = useGetStore(conversation?.storeId ?? '', {
    query: {
      queryKey: getGetStoreQueryKey(conversation?.storeId ?? ''),
      enabled: !!conversation?.storeId,
      staleTime: 5 * 60 * 1000,
    },
  });

  const { mutate: send, isPending: isSending } = useSendMessage({
    mutation: {
      onSuccess: (newMsg) => {
        setOptimisticMessages((prev) =>
          prev.filter((m) => m.id !== `opt_${newMsg.conversationId}_${newMsg.content}`),
        );
        refetchMessages();
      },
      onError: () => {
        setOptimisticMessages([]);
      },
    },
  });

  const { mutate: markRead } = useMarkConversationRead();

  useEffect(() => {
    if (conversation && isAuthenticated && conversation.buyerUnreadCount > 0) {
      markRead({ id: id!, data: { readerType: 'buyer' } });
    }
  }, [conversation?.id, conversation?.buyerUnreadCount, isAuthenticated, id]);

  const allMessages = React.useMemo(() => {
    const map = new Map<string, ChatMessageDto>();
    for (const m of serverMessages) map.set(m.id, m);
    for (const m of optimisticMessages) map.set(m.id, m);
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [serverMessages, optimisticMessages]);

  const listItems = React.useMemo(() => buildListItems(allMessages), [allMessages]);

  const handleSend = useCallback(
    (text: string) => {
      // Sender identity is derived server-side from the JWT session.
      if (!isAuthenticated || !user?.id || !id) return;

      const optimistic: ChatMessageDto = {
        id: `opt_${id}_${text}`,
        conversationId: id,
        senderType: 'buyer',
        senderId: user.id,
        type: 'text',
        content: text,
        status: 'sent',
        createdAt: new Date().toISOString(),
      };
      setOptimisticMessages((prev) => [...prev, optimistic]);

      send({
        id,
        data: { senderId: user.id, senderType: 'buyer', content: text, type: 'text' },
      });
    },
    [isAuthenticated, user?.id, id, send],
  );

  useEffect(() => {
    if (listItems.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [listItems.length]);

  const storeName = language === 'ar' ? store?.nameAr : store?.nameEn;

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.light.mutedForeground} />
        <Text style={styles.errorTitle}>
          {language === 'ar' ? 'يلزم تسجيل الدخول' : 'Login required'}
        </Text>
      </View>
    );
  }

  if (convLoading || msgsLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.light.primary} />
      </View>
    );
  }

  if (convError || msgsError || !conversation) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="cloud-offline-outline" size={40} color={colors.light.mutedForeground} />
        <Text style={styles.errorTitle}>
          {language === 'ar' ? 'تعذر فتح المحادثة' : 'Could not open conversation'}
        </Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>{language === 'ar' ? 'رجوع' : 'Go back'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={[styles.headerRow, isTablet && styles.tabletInner]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={colors.light.foreground}
            />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {storeName ?? (language === 'ar' ? 'محادثة' : 'Chat')}
            </Text>
            {(conversation.productNameAr || conversation.productNameEn) && (
              <Text style={[styles.headerSub, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                {language === 'ar' ? conversation.productNameAr : conversation.productNameEn}
              </Text>
            )}
          </View>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={listItems}
        keyExtractor={(item, i) =>
          item.kind === 'separator' ? `sep_${item.date}_${i}` : item.message.id
        }
        contentContainerStyle={[styles.listContent, isTablet && styles.tabletInner]}
        renderItem={({ item }) =>
          item.kind === 'separator' ? (
            <DateSeparator iso={item.date} isRTL={isRTL} />
          ) : (
            <MessageBubble
              message={item.message}
              viewerIsBuyer={item.message.senderType === 'buyer'}
              isRTL={isRTL}
            />
          )
        }
      />

      <View style={[styles.inputWrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={isTablet ? styles.tabletInner : undefined}>
          <ChatInput onSend={handleSend} isSending={isSending} isRTL={isRTL} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  centered: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  header: {
    backgroundColor: colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
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
  headerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  headerSub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    marginTop: 2,
  },
  listContent: { paddingHorizontal: 12, paddingVertical: 12, flexGrow: 1 },
  dateSep: { alignItems: 'center', marginVertical: 10 },
  dateSepText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.light.mutedForeground,
    backgroundColor: colors.light.muted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    backgroundColor: colors.light.card,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    textAlign: 'center',
  },
  backLink: { marginTop: 12, padding: 10 },
  backLinkText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.light.primary },
});
