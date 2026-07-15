import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/constants/colors';

interface ChatInputProps {
  onSend: (text: string) => void;
  isSending?: boolean;
  isRTL?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  isSending = false,
  isRTL = false,
  placeholder,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const canSend = text.trim().length > 0 && !isSending;

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <View style={[styles.container, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          {
            textAlign: isRTL ? 'right' : 'left',
            writingDirection: isRTL ? 'rtl' : 'ltr',
          },
        ]}
        value={text}
        onChangeText={setText}
        placeholder={placeholder ?? (isRTL ? 'اكتب رسالة...' : 'Type a message...')}
        placeholderTextColor={colors.light.mutedForeground}
        multiline
        maxLength={2000}
        returnKeyType="send"
        onSubmitEditing={Platform.OS !== 'web' ? handleSend : undefined}
        blurOnSubmit={false}
        editable={!isSending}
        accessibilityLabel={isRTL ? 'حقل الرسالة' : 'Message input'}
      />
      <Pressable
        onPress={handleSend}
        disabled={!canSend}
        style={({ pressed }) => [
          styles.sendBtn,
          { backgroundColor: canSend ? '#2B2B2E' : colors.light.muted },
          pressed && canSend && { opacity: 0.85 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={isRTL ? 'إرسال' : 'Send'}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={canSend ? '#fff' : colors.light.mutedForeground} />
        ) : (
          <Ionicons
            name="send"
            size={18}
            color={canSend ? '#fff' : colors.light.mutedForeground}
            style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.6)',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: colors.light.muted,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: 8,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.foreground,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
