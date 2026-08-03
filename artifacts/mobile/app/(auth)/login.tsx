import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeviceId } from '@/hooks/useDeviceId';

export default function LoginScreen() {
  const { login } = useAuth();
  const { isRTL } = useLanguage();
  const deviceId = useDeviceId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = isRTL ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = isRTL ? 'بريد إلكتروني غير صالح' : 'Invalid email address';
    if (!password) errs.password = isRTL ? 'كلمة المرور مطلوبة' : 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setIsSubmitting(true);
    setErrors({});

    try {
      await login(email.trim().toLowerCase(), password, deviceId ?? undefined);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrors({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>{isRTL ? 'تسجيل الدخول' : 'Sign In'}</Text>
          <Text style={styles.subtitle}>
            {isRTL ? 'أهلاً بك في موب هاب' : 'Welcome back to MOB HUB'}
          </Text>
        </View>

        {errors.general ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errors.general}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, isRTL && styles.rtlText]}>
              {isRTL ? 'البريد الإلكتروني' : 'Email'}
            </Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null, isRTL && styles.rtlInput]}
              value={email}
              onChangeText={setEmail}
              placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textAlign={isRTL ? 'right' : 'left'}
            />
            {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, isRTL && styles.rtlText]}>
              {isRTL ? 'كلمة المرور' : 'Password'}
            </Text>
            <TextInput
              style={[styles.input, errors.password ? styles.inputError : null, isRTL && styles.rtlInput]}
              value={password}
              onChangeText={setPassword}
              placeholder={isRTL ? 'أدخل كلمة مرورك' : 'Enter your password'}
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              textAlign={isRTL ? 'right' : 'left'}
            />
            {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isRTL ? 'تسجيل الدخول' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isRTL ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
            <Text style={styles.linkText}>
              {isRTL ? 'إنشاء حساب' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.guestText}>
            {isRTL ? 'تصفح كزائر' : 'Continue as Guest'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: { marginBottom: 32, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280' },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorBannerText: { color: '#DC2626', fontSize: 14 },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  rtlText: { textAlign: 'right' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  rtlInput: { textAlign: 'right' },
  inputError: { borderColor: '#EF4444' },
  fieldError: { color: '#EF4444', fontSize: 12 },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: { color: '#6B7280', fontSize: 14 },
  linkText: { color: '#2563EB', fontSize: 14, fontWeight: '600' },
  guestButton: { alignItems: 'center', marginTop: 12 },
  guestText: { color: '#9CA3AF', fontSize: 13 },
});
