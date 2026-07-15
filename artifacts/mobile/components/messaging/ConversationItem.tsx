import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import type { ConversationDto } from '@workspace/api-client-react';

interface ConversationItemProps {
  conversation: ConversationDto;
  storeNameAr?: string;
  storeNameEn?: string;
  storeLogoColor?: string;
  storeLogoInitial?: string;
  language: 'ar' | 'en';
  isRTL: boolean;
  unreadCount: number;
  onPress: () => void;
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function ConversationItem({
  conversation,
  storeNameAr,
  storeNameEn,
  storeLogoColor = colors.light.primary,
  storeLogoInitial = '?',
  language,
  isRTL,
  unreadCount,
  onPress,
}: ConversationItemProps) {
  const storeName = language === 'ar' ? (storeNameAr ?? storeNameEn ?? '') : (storeNameEn ?? storeNameAr ?? '');
  const productName =
    language === 'ar'
      ? conversation.productNameAr
      : conversation.productNameEn;
  const relTime = formatRelativeTime(conversation.lastMessageAt ?? null);
  const hasUnread = unreadCount > 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={storeName}
    >
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: storeLogoColor }]}>
        <Text style={styles.avatarText}>{storeLogoInitial}</Text>
        {hasUnread && (
          <View style={styles.unreadDot}>
            <Text style={styles.unreadDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={[styles.content, { marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }]}>
        <View style={[styles.topRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.name, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {storeName}
          </Text>
          <Text style={styles.time}>{relTime}</Text>
        </View>
        {productName ? (
          <Text
            style={[styles.product, { textAlign: isRTL ? 'right' : 'left' }]}
            numberOfLines={1}
          >
            <Ionicons name="phone-portrait-outline" size={11} color={colors.light.primary} />
            {' '}{productName}
          </Text>
        ) : null}
        <Text
          style={[
            styles.lastMessage,
            { textAlign: isRTL ? 'right' : 'left' },
            hasUnread && styles.lastMessageUnread,
          ]}
          numberOfLines={1}
        >
          {conversation.lastMessageText ?? (language === 'ar' ? 'ابدأ المحادثة' : 'Start chatting')}
        </Text>
      </View>

      {/* Chevron */}
      <Ionicons
        name={isRTL ? 'chevron-back' : 'chevron-forward'}
        size={16}
        color={colors.light.textTertiary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.5)',
  },
  pressed: { backgroundColor: colors.light.muted },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  unreadDotText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  content: { flex: 1, gap: 2 },
  topRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
    flex: 1,
  },
  time: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    marginLeft: 6,
  },
  product: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: colors.light.primary,
  },
  lastMessage: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
  },
  lastMessageUnread: {
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
  },
});
