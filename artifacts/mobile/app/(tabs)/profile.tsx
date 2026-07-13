import React from 'react';
import {
  Alert,
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
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/data/translations';

function SettingsRow({
  icon,
  label,
  onPress,
  isRTL,
  value,
  danger,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  isRTL: boolean;
  value?: string;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
    >
      <View style={[styles.settingsRowInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.settingsIcon, danger && styles.settingsIconDanger]}>
          <Ionicons name={icon} size={18} color={danger ? colors.light.destructive : colors.light.primary} />
        </View>
        <Text
          style={[
            styles.settingsLabel,
            { flex: 1, textAlign: isRTL ? 'right' : 'left' },
            danger && { color: colors.light.destructive },
          ]}
        >
          {label}
        </Text>
        {value ? (
          <Text style={styles.settingsValue}>{value}</Text>
        ) : (
          <Ionicons
            name={isRTL ? 'chevron-back' : 'chevron-forward'}
            size={16}
            color={colors.light.mutedForeground}
          />
        )}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { t, isRTL, language, setLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
      contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Premium White Hero Header */}
      <View style={[styles.hero, { paddingTop: topInset + 20 }]}>
        {/* Background decoration */}
        <View style={styles.heroBg} />
        <View style={styles.heroBg2} />

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={38} color={colors.light.primary} />
          </View>
          <Pressable style={styles.editBadge} onPress={() => handlePress('Edit')}>
            <Ionicons name="pencil" size={11} color="#fff" />
          </Pressable>
        </View>

        <Text style={[styles.userName, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('guestUser')}
        </Text>
        <Text style={[styles.userSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {language === 'ar' ? 'مستخدم زائر' : 'Guest User'}
        </Text>

        {/* Sign In CTA */}
        <Pressable
          onPress={() => handlePress(t('signIn'))}
          style={styles.signInBtn}
        >
          <Ionicons name="log-in-outline" size={18} color="#fff" />
          <Text style={styles.signInText}>{t('signIn')}</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        {/* ── My Store Section ─────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'متجري' : 'My Store'}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.storeCard, pressed && styles.pressed]}
            onPress={() => router.push('/dashboard')}
          >
            <View style={[styles.storeCardInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.storeAvatar}>
                <Ionicons name="storefront" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
                <Text style={[styles.storeCardName, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'موبايل وورلد' : 'Mobile World'}
                </Text>
                <View style={[styles.storeCardMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.openIndicator} />
                  <Text style={styles.storeCardStatus}>
                    {language === 'ar' ? 'مفتوح · ٣٤٢ منتج' : 'Open · 342 products'}
                  </Text>
                </View>
              </View>
              <View style={styles.dashboardBtn}>
                <Ionicons name="grid-outline" size={16} color={colors.light.primary} />
                <Text style={styles.dashboardBtnText}>
                  {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* ── Language selector ─────────────────────────────────── */}
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
                <View style={styles.langCheck}>
                  <Ionicons name="checkmark" size={13} color="#fff" />
                </View>
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
                <View style={styles.langCheck}>
                  <Ionicons name="checkmark" size={13} color="#fff" />
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* ── Settings ─────────────────────────────────────────── */}
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

        {/* ── About ─────────────────────────────────────────────── */}
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
              icon="share-social-outline"
              label={t('shareApp')}
              onPress={() => handlePress(t('shareApp'))}
              isRTL={isRTL}
            />
            <SettingsRow
              icon="information-circle-outline"
              label={t('appVersion')}
              onPress={() => {}}
              isRTL={isRTL}
              value="1.0.0"
            />
          </View>
        </View>

        {/* ── Sign out ──────────────────────────────────────────── */}
        <View style={[styles.section, { marginBottom: 0 }]}>
          <View style={styles.settingsList}>
            <SettingsRow
              icon="log-out-outline"
              label={t('signOut')}
              onPress={() => handlePress(t('signOut'))}
              isRTL={isRTL}
              danger
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  // Hero
  hero: {
    backgroundColor: colors.light.background,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  heroBg: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(37,99,235,0.06)',
  },
  heroBg2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(37,99,235,0.04)',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(37,99,235,0.2)',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  userSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    marginTop: 4,
    marginBottom: 18,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: colors.light.primary,
    borderRadius: colors.radiusFull,
    shadowColor: colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  signInText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },

  // Content
  content: { padding: 16, gap: 0 },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  // My Store card
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: colors.radiusLg,
    padding: 14,
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  storeCardInner: { alignItems: 'center' },
  storeAvatar: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeCardName: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  storeCardMeta: { alignItems: 'center', gap: 5, marginTop: 3 },
  openIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.light.success,
  },
  storeCardStatus: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
  },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: colors.radiusFull,
    backgroundColor: colors.light.primaryLight,
  },
  dashboardBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.primary,
  },

  // Language
  langRow: { gap: 10 },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: colors.radiusMd,
    borderWidth: 2,
    borderColor: 'rgba(226,232,240,0.8)',
    shadowColor: 'rgba(15,23,42,0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 1,
  },
  langBtnActive: {
    borderColor: colors.light.primary,
    backgroundColor: colors.light.primaryLight,
  },
  langFlag: { fontSize: 20 },
  langText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.secondaryForeground,
  },
  langTextActive: { color: colors.light.primary },
  langCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Settings
  settingsList: {
    backgroundColor: '#fff',
    borderRadius: colors.radiusLg,
    overflow: 'hidden',
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  settingsRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
  },
  settingsRowInner: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconDanger: {
    backgroundColor: '#FEE2E2',
  },
  settingsLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: colors.light.foreground,
  },
  settingsValue: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
  },
  pressed: { opacity: 0.85 },
});
