import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import {
  useCreateStoreReview,
  useUpdateReview,
  getGetStoreReviewsQueryKey,
  getGetStoreQueryKey,
  type ReviewDto,
} from '@workspace/api-client-react';
import { useLanguage } from '@/contexts/LanguageContext';
import colors from '@/constants/colors';
import { getFontFamily } from '@/constants/fonts';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReviewFormModalProps {
  storeId: string;
  visible: boolean;
  onClose: () => void;
  /** When provided the modal opens in edit mode, pre-populated with this review. */
  reviewToEdit?: ReviewDto | null;
  /** Persistent device identifier used as pseudo-userId until auth lands. */
  deviceId: string | null;
}

// ---------------------------------------------------------------------------
// StarSelector sub-component
// ---------------------------------------------------------------------------

function StarSelector({
  rating,
  onRate,
  size = 36,
}: {
  rating: number;
  onRate: (v: number) => void;
  size?: number;
}) {
  return (
    <View style={starStyles.row} accessibilityRole="radiogroup">
      {[1, 2, 3, 4, 5].map((v) => (
        <Pressable
          key={v}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRate(v);
          }}
          accessibilityRole="radio"
          accessibilityLabel={`${v} star${v > 1 ? 's' : ''}`}
          accessibilityState={{ checked: rating === v }}
          hitSlop={8}
        >
          <Ionicons
            name={v <= rating ? 'star' : 'star-outline'}
            size={size}
            color={v <= rating ? colors.light.star : colors.light.border}
          />
        </Pressable>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 8,
  },
});

// ---------------------------------------------------------------------------
// ReviewFormModal
// ---------------------------------------------------------------------------

export default function ReviewFormModal({
  storeId,
  visible,
  onClose,
  reviewToEdit = null,
  deviceId,
}: ReviewFormModalProps) {
  const { t, isRTL, language } = useLanguage();
  const queryClient = useQueryClient();

  const fontBold = getFontFamily(isRTL, 'bold');
  const fontSemi = getFontFamily(isRTL, 'semiBold');
  const fontReg = getFontFamily(isRTL, 'regular');

  // ------ form state ------
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Slide-up animation
  const slideAnim = useRef(new Animated.Value(600)).current;

  // Reset form whenever the modal opens or the target review changes
  useEffect(() => {
    if (visible) {
      setRating(reviewToEdit?.rating ?? 0);
      setName(reviewToEdit?.author ?? '');
      setTitle(reviewToEdit?.title ?? '');
      setReviewText(
        reviewToEdit
          ? language === 'ar'
            ? reviewToEdit.textAr
            : reviewToEdit.textEn
          : '',
      );
      setErrors({});
      setSubmitted(false);

      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 28,
        stiffness: 300,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(600);
    }
  }, [visible, reviewToEdit]);

  // ------ mutations ------
  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetStoreReviewsQueryKey(storeId) });
    queryClient.invalidateQueries({ queryKey: getGetStoreQueryKey(storeId) });
  }, [queryClient, storeId]);

  const createMutation = useCreateStoreReview({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSubmitted(true);
        invalidateQueries();
        setTimeout(onClose, 1600);
      },
      onError: (err: unknown) => {
        const status =
          typeof err === 'object' && err !== null && 'status' in err
            ? (err as { status: number }).status
            : 0;
        setErrors((prev) => ({
          ...prev,
          general: status === 409 ? t('duplicateReview') : t('error'),
        }));
      },
    },
  });

  const updateMutation = useUpdateReview({
    mutation: {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSubmitted(true);
        invalidateQueries();
        setTimeout(onClose, 1600);
      },
      onError: () => {
        setErrors((prev) => ({ ...prev, general: t('error') }));
      },
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isEditMode = reviewToEdit !== null;

  // ------ validation ------
  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (rating === 0) newErrors.rating = t('ratingRequired');
    const trimName = name.trim();
    if (!trimName) newErrors.name = t('nameRequired');
    else if (trimName.length < 2) newErrors.name = t('nameTooShort');
    const trimText = reviewText.trim();
    if (!trimText) newErrors.text = t('reviewTextRequired');
    else if (trimText.length < 10) newErrors.text = t('reviewTextTooShort');
    else if (trimText.length > 1000) newErrors.text = t('reviewTextTooLong');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ------ submit ------
  function handleSubmit() {
    if (!validate() || isLoading) return;
    const text = reviewText.trim();
    const trimName = name.trim();

    if (isEditMode && reviewToEdit) {
      updateMutation.mutate({
        id: reviewToEdit.id,
        data: {
          rating,
          title: title.trim(),
          textEn: text,
          textAr: text,
          userId: deviceId ?? reviewToEdit.userId ?? '',
        },
      });
    } else {
      createMutation.mutate({
        id: storeId,
        data: {
          author: trimName,
          authorAr: trimName,
          rating,
          title: title.trim(),
          textEn: text,
          textAr: text,
          userId: deviceId ?? undefined,
        },
      });
    }
  }

  function handleClose() {
    if (isLoading) return;
    onClose();
  }

  // ------ render ------
  const textDir = isRTL ? 'right' : 'left';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.headerTitle, { fontFamily: fontBold, textAlign: textDir }]}>
              {isEditMode ? t('editReview') : t('writeReview')}
            </Text>
            <Pressable
              style={styles.closeBtn}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel={t('close')}
            >
              <Ionicons name="close" size={22} color={colors.light.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Star Rating */}
            <View style={styles.ratingSection}>
              <Text style={[styles.fieldLabel, { fontFamily: fontSemi, textAlign: 'center' }]}>
                {t('tapToRate')}
              </Text>
              <StarSelector rating={rating} onRate={(v) => { setRating(v); setErrors((e) => { const n = { ...e }; delete n.rating; return n; }); }} />
              {errors.rating && (
                <Text style={[styles.errorText, { fontFamily: fontReg, textAlign: 'center' }]}>
                  {errors.rating}
                </Text>
              )}
            </View>

            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { fontFamily: fontSemi, textAlign: textDir }]}>
                {t('yourName')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { fontFamily: fontReg, textAlign: textDir },
                  errors.name ? styles.inputError : null,
                ]}
                value={name}
                onChangeText={(v) => { setName(v); setErrors((e) => { const n = { ...e }; delete n.name; return n; }); }}
                placeholder={t('yourNamePlaceholder')}
                placeholderTextColor={colors.light.mutedForeground}
                returnKeyType="next"
                accessibilityLabel={t('yourName')}
                maxLength={60}
              />
              {errors.name && (
                <Text style={[styles.errorText, { fontFamily: fontReg, textAlign: textDir }]}>
                  {errors.name}
                </Text>
              )}
            </View>

            {/* Title (optional) */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { fontFamily: fontSemi, textAlign: textDir }]}>
                {t('reviewTitle')}
              </Text>
              <TextInput
                style={[styles.input, { fontFamily: fontReg, textAlign: textDir }]}
                value={title}
                onChangeText={setTitle}
                placeholder={t('reviewTitlePlaceholder')}
                placeholderTextColor={colors.light.mutedForeground}
                returnKeyType="next"
                maxLength={100}
                accessibilityLabel={t('reviewTitle')}
              />
            </View>

            {/* Review Text */}
            <View style={styles.fieldGroup}>
              <View style={[styles.fieldLabelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.fieldLabel, { fontFamily: fontSemi, textAlign: textDir }]}>
                  {t('storeReviews')}
                </Text>
                <Text style={[styles.charCount, { fontFamily: fontReg }]}>
                  {reviewText.length}/1000
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textarea,
                  { fontFamily: fontReg, textAlign: textDir },
                  errors.text ? styles.inputError : null,
                ]}
                value={reviewText}
                onChangeText={(v) => { setReviewText(v); setErrors((e) => { const n = { ...e }; delete n.text; return n; }); }}
                placeholder={t('reviewTextPlaceholder')}
                placeholderTextColor={colors.light.mutedForeground}
                multiline
                numberOfLines={5}
                maxLength={1000}
                textAlignVertical="top"
                returnKeyType="done"
                accessibilityLabel={t('storeReviews')}
              />
              {errors.text && (
                <Text style={[styles.errorText, { fontFamily: fontReg, textAlign: textDir }]}>
                  {errors.text}
                </Text>
              )}
            </View>

            {/* General error */}
            {errors.general && (
              <View style={styles.generalError}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={[styles.generalErrorText, { fontFamily: fontReg }]}>
                  {errors.general}
                </Text>
              </View>
            )}

            {/* Submit */}
            <Pressable
              style={[
                styles.submitBtn,
                isLoading && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isLoading || submitted}
              accessibilityRole="button"
              accessibilityLabel={isEditMode ? t('editReview') : t('submitReview')}
            >
              {isLoading ? (
                <Text style={[styles.submitBtnText, { fontFamily: fontSemi }]}>
                  {'...'}
                </Text>
              ) : (
                <Text style={[styles.submitBtnText, { fontFamily: fontSemi }]}>
                  {isEditMode ? t('editReview') : t('submitReview')}
                </Text>
              )}
            </Pressable>
          </ScrollView>

          {/* Success overlay */}
          {submitted && (
            <View style={styles.successOverlay}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color={colors.light.primary} />
              </View>
              <Text style={[styles.successTitle, { fontFamily: fontBold }]}>
                {isEditMode ? t('reviewUpdated') : t('reviewSubmitted')}
              </Text>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.light.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.light.border,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  headerTitle: {
    fontSize: 17,
    color: colors.light.foreground,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.light.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  ratingSection: {
    alignItems: 'center',
    gap: 4,
    paddingBottom: 8,
  },
  fieldGroup: { gap: 8 },
  fieldLabel: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
  fieldLabelRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charCount: {
    fontSize: 12,
    color: colors.light.mutedForeground,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.light.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.light.foreground,
    backgroundColor: colors.light.cardSoft,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textarea: {
    height: 120,
    borderWidth: 1.5,
    borderColor: colors.light.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.light.foreground,
    backgroundColor: colors.light.cardSoft,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: -4,
  },
  generalError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  generalErrorText: {
    fontSize: 14,
    color: '#B91C1C',
    flex: 1,
  },
  submitBtn: {
    backgroundColor: colors.light.primary,
    borderRadius: 999,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.light.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 40,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 18,
    color: colors.light.foreground,
    textAlign: 'center',
  },
});
