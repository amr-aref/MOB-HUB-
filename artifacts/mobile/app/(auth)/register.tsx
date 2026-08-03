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
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDeviceId } from '@/hooks/useDeviceId';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { isRTL } = useLanguage();
  const deviceId = useDeviceId();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'merchant'>('buyer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string; email?: string; password?: string;
    confirmPassword?: string; general?: string;
  }>({});

  function validate(): boolean {
    const errs: typeof errors = {};
    if (name.trim().length < 2)
      errs.name = isRTL ? 'الاسم يجب أن يكون حرفين على الأقل' : 'Name must be at least 2 characters';
    if (!email.trim())
      errs.email = isRTL ? 'البريد الإلكتروني مطلوب' : 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = isRTL ? 'بريد إلكتروني غير صالح' : 'Invalid email address';
    if (password.length < 8)
      errs.password = isRTL ? 'كلمة المرور 8 أحرف على الأقل' : 'Password must be at least 8 characters';
    if (password !== confirmPassword)
      errs.confirmPassword = isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setIsSubmitting(true);
    setErrors({});

    try {
      await register({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        nameAr: name.trim(),
        role,
        deviceId: deviceId ?? undefined,
      });
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
          <Text style={styles.title}>{isRTL ? 'إنشاء حساب' : 'Create Account'}</Text>
          <Text style={styles.subtitle}>
            {isRTL ? 'انضم إلى موب هاب اليوم' : 'Join MOB HUB today'}
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
              {isRTL ? 'الاسم' : 'Full Name'}
            </Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null, isRTL && styles.rtlInput]}
              value={name}
              onChangeText={setName}
              placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
              placeholderTextColor="#9CA3AF"
              textAlign={isRTL ? 'right' : 'left'}
              autoCapitalize="words"
            />
            {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}
          </View>

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
              placeholder={isRTL ? '8 أحرف على الأقل' : 'At least 8 characters'}
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              textAlign={isRTL ? 'right' : 'left'}
            />
            {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, isRTL && styles.rtlText]}>
              {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
            </Text>
            <TextInput
              style={[styles.input, errors.confirmPassword ? styles.inputError : null, isRTL && styles.rtlInput]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={isRTL ? 'أعد إدخال كلمة المرور' : 'Re-enter your password'}
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              textAlign={isRTL ? 'right' : 'left'}
            />
            {errors.confirmPassword ? (
              <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
            ) : null}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, isRTL && styles.rtlText]}>
              {isRTL ? 'نوع الحساب' : 'Account Type'}
            </Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleButton, role === 'buyer' && styles.roleButtonActive]}
                onPress={() => setRole('buyer')}
              >
                <Text style={[styles.roleText, role === 'buyer' && styles.roleTextActive]}>
                  {isRTL ? 'مشتري' : 'Buyer'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, role === 'merchant' && styles.roleButtonActive]}
                onPress={() => setRole('merchant')}
              >
                <Text style={[styles.roleText, role === 'merchant' && styles.roleTextActive]}>
                  {isRTL ? 'تاجر' : 'Merchant'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isRTL ? 'إنشاء حساب' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isRTL ? 'لديك حساب؟ ' : 'Already have an account? '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.linkText}>
              {isRTL ? 'تسجيل الدخول' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 28, alignItems: 'center' },
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
  form: { gap: 14 },
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
  roleRow: { flexDirection: 'row', gap: 12 },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  roleButtonActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  roleText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  roleTextActive: { color: '#2563EB', fontWeight: '600' },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6B7280', fontSize: 14 },
  linkText: { color: '#2563EB', fontSize: 14, fontWeight: '600' },
});
