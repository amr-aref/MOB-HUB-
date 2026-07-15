import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import type { ChatMessageDto } from '@workspace/api-client-react';

interface MessageBubbleProps {
  message: ChatMessageDto;
  /** Whether the current viewer is the buyer (controls left/right bubble side). */
  viewerIsBuyer: boolean;
  isRTL: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, viewerIsBuyer, isRTL }: MessageBubbleProps) {
  const isMine =
    (viewerIsBuyer && message.senderType === 'buyer') ||
    (!viewerIsBuyer && message.senderType === 'seller');

  if (message.senderType === 'system') {
    return (
      <View style={styles.systemContainer}>
        <View style={styles.systemBubble}>
          <Ionicons name="chatbubble-ellipses-outline" size={12} color={colors.light.mutedForeground} />
          <Text style={styles.systemText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        isMine
          ? { alignItems: isRTL ? 'flex-start' : 'flex-end' }
          : { alignItems: isRTL ? 'flex-end' : 'flex-start' },
      ]}
    >
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleOther,
        ]}
      >
        <Text
          style={[
            styles.content,
            isMine ? styles.contentMine : styles.contentOther,
            { textAlign: isRTL ? 'right' : 'left' },
          ]}
        >
          {message.content}
        </Text>
        <View style={[styles.meta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.time, isMine ? styles.timeMine : styles.timeOther]}>
            {formatTime(message.createdAt)}
          </Text>
          {isMine && (
            <Ionicons
              name={message.status === 'read' ? 'checkmark-done' : 'checkmark'}
              size={12}
              color={message.status === 'read' ? '#60A5FA' : 'rgba(255,255,255,0.7)'}
              style={{ marginLeft: 3 }}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 2,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  bubbleMine: {
    backgroundColor: '#2B2B2E',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
  },
  contentMine: {
    fontFamily: 'Inter_400Regular',
    color: '#fff',
  },
  contentOther: {
    fontFamily: 'Inter_400Regular',
    color: colors.light.foreground,
  },
  meta: {
    alignItems: 'center',
    gap: 2,
  },
  time: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  timeMine: { color: 'rgba(255,255,255,0.6)' },
  timeOther: { color: colors.light.mutedForeground },

  // System message
  systemContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  systemBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.light.muted,
    borderRadius: 12,
  },
  systemText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
  },
});
