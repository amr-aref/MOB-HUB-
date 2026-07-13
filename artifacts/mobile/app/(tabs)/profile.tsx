import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/data/translations';

export default function ProfileScreen() {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  function handleLanguageChange(lang: Language) {
    Haptics.selectionAsync();
    setLanguage(lang);
  }

  function handlePress(action: string) {
    Haptics.selectionAsync();
    Alert.alert(action, language === 'ar' ? 'قريباً' : 'Coming soon');
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomInset + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero header */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: topInset + 20 }]}
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color={colors.light.primary} />
          </View>
          <Pressable style={styles.editBadge}>
            <Ionicons name="pencil" size={12} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.userName}>{t('guestUser')}</Text>
        <Text style={styles.userEmail}>{language === 'ar' ? 'مستخدم زائر' : 'Guest User'}</Text>

        <Pressable
          onPress={() => handlePress(t('signIn'))}
          style={styles.signInBtn}
        >
          <Text style={styles.signInText}>{t('signIn')}</Text>
          <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.light.primary} />
        </Pressable>
      </LinearGradient>

      {/* Language selector */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('language')}
        </Text>
        <View style={[styles.langRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable
            onPress={() => handleLanguageChange('ar')}
            style={[styles.langBtn, language === 'ar' && styles.langBtnActive]}
          >
            <Text style={styles.langFlag}>🇪🇬</Text>
            <Text style={[styles.langText, language === 'ar' && styles.langTextActive]}>
              {t('arabic')}
            </Text>
            {language === 'ar' && (
              <Ionicons name="checkmark-circle" size={18} color={colors.light.primary} />
            )}
          </Pressable>
          <Pressable
            onPress={() => handleLanguageChange('en')}
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
          >
            <Text style={styles.langFlag}>🇬🇧</Text>
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
              {t('english')}
            </Text>
            {language === 'en' && (
              <Ionicons name="checkmark-circle" size={18} color={colors.light.primary} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('settings')}
        </Text>
        <View style={styles.settingsList}>
          <SettingsRow
            icon="notifications-outline"
            label={t('notifications')}
            onPress={() => handlePress(t('notifications'))}
            isRTL={isRTL}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label={t('privacyPolicy')}
            onPress={() => handlePress(t('privacyPolicy'))}
            isRTL={isRTL}
          />
          <SettingsRow
            icon="document-text-outline"
            label={t('termsOfService')}
            onPress={() => handlePress(t('termsOfService'))}
            isRTL={isRTL}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('about')}
        </Text>
        <View style={styles.settingsList}>
          <SettingsRow
            icon="star-outline"
            label={t('rateApp')}
            onPress={() => handlePress(t('rateApp'))}
            isRTL={isRTL}
          />
          <SettingsRow
            icon="share-outline"
            label={t('shareApp')}
            onPress={() => handlePress(t('shareApp'))}
            isRTL={isRTL}
          />
          <SettingsRow
            icon="information-circle-outline"
            label={`${t('appVersion')} 1.0.0`}
            onPress={() => {}}
            isRTL={isRTL}
            showChevron={false}
          />
        </View>
      </View>

      {/* App info */}
      <View style={styles.footer}>
        <LinearGradient
          colors={['#1E3A8A', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.footerBadge}
        >
          <Text style={styles.footerBadgeText}>{t('appName')}</Text>
        </LinearGradient>
        <Text style={styles.footerText}>
          {language === 'ar'
            ? 'المرجع الأول لأجهزة الجوال في مصر'
            : "Egypt's Premier Phone Marketplace"}
        </Text>
        <Text style={styles.footerVersion}>v1.0.0 · 2025</Text>
      </View>
    </ScrollView>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  isRTL,
  showChevron = true,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  isRTL: boolean;
  showChevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon as any} size={20} color={colors.light.primary} />
      </View>
      <Text style={[styles.rowLabel, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
        {label}
      </Text>
      {showChevron && (
        <Ionicons
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={18}
          color={colors.light.mutedForeground}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.backgroundSecondary },
  content: { gap: 20 },
  hero: {
    alignItems: 'center',
    paddingBottom: 28,
    paddingHorizontal: 20,
    gap: 6,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  userEmail: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
  },
  signInBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: colors.radiusFull,
    gap: 4,
  },
  signInText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.primary,
  },
  section: {
    marginHorizontal: 16,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: colors.light.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  langRow: {
    gap: 10,
  },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: colors.light.background,
    borderRadius: colors.radiusMd,
    borderWidth: 1.5,
    borderColor: colors.light.border,
  },
  langBtnActive: {
    borderColor: colors.light.primary,
    backgroundColor: colors.light.primaryLight,
  },
  langFlag: { fontSize: 20 },
  langText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: colors.light.foreground,
  },
  langTextActive: {
    color: colors.light.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  settingsList: {
    backgroundColor: colors.light.background,
    borderRadius: colors.radiusMd,
    borderWidth: 1,
    borderColor: colors.light.border,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.light.foreground,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: colors.radiusFull,
  },
  footerBadgeText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  footerText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    textAlign: 'center',
  },
  footerVersion: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.light.border,
  },
});
