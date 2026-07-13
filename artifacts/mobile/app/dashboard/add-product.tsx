import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';

const STEPS = [
  { key: 'basic', labelAr: 'المعلومات', labelEn: 'Basic Info' },
  { key: 'media', labelAr: 'الوسائط', labelEn: 'Media' },
  { key: 'variants', labelAr: 'المتغيرات', labelEn: 'Variants' },
  { key: 'pricing', labelAr: 'التسعير', labelEn: 'Pricing' },
  { key: 'publish', labelAr: 'النشر', labelEn: 'Publish' },
];

const CATEGORIES = [
  'الهواتف الذكية', 'التابلت', 'سماعات', 'شواحن', 'كفرات', 'أخرى',
];
const CATEGORIES_EN = ['Smartphones', 'Tablets', 'Earbuds', 'Chargers', 'Cases', 'Other'];

const CONDITIONS = [
  { labelAr: 'جديد', labelEn: 'New', value: 'new' },
  { labelAr: 'مستعمل', labelEn: 'Used', value: 'used' },
  { labelAr: 'مجدد', labelEn: 'Refurbished', value: 'refurbished' },
];

export default function AddProductScreen() {
  const { language, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const [currentStep, setCurrentStep] = useState(0);
  const [isDraft, setIsDraft] = useState(false);

  // Form state
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState(0);
  const [condition, setCondition] = useState(0);
  const [warranty, setWarranty] = useState('');
  const [tags, setTags] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState([{ storage: '128GB', ram: '8GB', color: '#1C1C1E', price: '0', qty: '1' }]);
  const [currentPrice, setCurrentPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [tax, setTax] = useState('14');
  const [qty, setQty] = useState('1');
  const [available, setAvailable] = useState(true);
  const [storeVisible, setStoreVisible] = useState(true);

  function handleNextStep() {
    Haptics.selectionAsync();
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  }
  function handlePrevStep() {
    Haptics.selectionAsync();
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }
  function handleSaveDraft() {
    setIsDraft(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
  function handlePublish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  const isAr = language === 'ar';
  const cats = isAr ? CATEGORIES : CATEGORIES_EN;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.light.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isAr ? 'إضافة منتج' : 'Add Product'}
          </Text>
          <View style={[styles.headerRight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {isDraft && (
              <View style={styles.draftBadge}>
                <View style={styles.draftDot} />
                <Text style={styles.draftText}>{isAr ? 'مسودة' : 'Draft'}</Text>
              </View>
            )}
            <Pressable style={styles.previewBtn}>
              <Ionicons name="eye-outline" size={16} color={colors.light.mutedForeground} />
              <Text style={styles.previewBtnText}>{isAr ? 'معاينة' : 'Preview'}</Text>
            </Pressable>
            <Pressable style={styles.publishHeaderBtn} onPress={handlePublish}>
              <Text style={styles.publishHeaderBtnText}>{isAr ? 'نشر' : 'Publish'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Step indicator */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.stepsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {STEPS.map((step, idx) => {
            const isActive = idx === currentStep;
            const isDone = idx < currentStep;
            return (
              <React.Fragment key={step.key}>
                <Pressable
                  onPress={() => setCurrentStep(idx)}
                  style={[styles.stepItem, isActive && styles.stepItemActive, isDone && styles.stepItemDone]}
                >
                  <View style={[styles.stepCircle, isActive && styles.stepCircleActive, isDone && styles.stepCircleDone]}>
                    {isDone ? (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    ) : (
                      <Text style={[styles.stepNum, isActive && styles.stepNumActive]}>{idx + 1}</Text>
                    )}
                  </View>
                  <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                    {isAr ? step.labelAr : step.labelEn}
                  </Text>
                </Pressable>
                {idx < STEPS.length - 1 && (
                  <View style={[styles.stepLine, idx < currentStep && styles.stepLineDone]} />
                )}
              </React.Fragment>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Step 1: Basic Info ── */}
        {currentStep === 0 && (
          <View style={styles.stepContent}>
            <SectionCard title={isAr ? 'المعلومات الأساسية' : 'Basic Information'}>
              <FormField
                label={isAr ? 'الاسم بالعربية' : 'Arabic Product Name'}
                value={nameAr}
                onChangeText={setNameAr}
                placeholder={isAr ? 'اسم المنتج' : 'Product name in Arabic'}
                isRTL={isRTL}
              />
              <FormField
                label={isAr ? 'الاسم بالإنجليزية' : 'English Product Name'}
                value={nameEn}
                onChangeText={setNameEn}
                placeholder="e.g. iPhone Pro 16 Ultra"
                isRTL={isRTL}
              />
              <FormField
                label={isAr ? 'الماركة' : 'Brand'}
                value={brand}
                onChangeText={setBrand}
                placeholder={isAr ? 'مثل: Apple, Samsung' : 'e.g. Apple, Samsung'}
                isRTL={isRTL}
              />
              <FormField
                label={isAr ? 'الموديل' : 'Model'}
                value={model}
                onChangeText={setModel}
                placeholder={isAr ? 'مثل: iPhone 16 Pro' : 'e.g. iPhone 16 Pro'}
                isRTL={isRTL}
              />

              {/* Category */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isAr ? 'الفئة' : 'Category'}
                </Text>
                <View style={[styles.pillsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {cats.map((cat, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => setCategory(idx)}
                      style={[styles.pill, category === idx && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, category === idx && styles.pillTextActive]}>{cat}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Condition */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isAr ? 'الحالة' : 'Condition'}
                </Text>
                <View style={[styles.pillsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {CONDITIONS.map((cond, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => setCondition(idx)}
                      style={[styles.pill, condition === idx && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, condition === idx && styles.pillTextActive]}>
                        {isAr ? cond.labelAr : cond.labelEn}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <FormField
                label={isAr ? 'الضمان' : 'Warranty'}
                value={warranty}
                onChangeText={setWarranty}
                placeholder={isAr ? 'مثل: سنة واحدة' : 'e.g. 1 year'}
                isRTL={isRTL}
              />
              <FormField
                label={isAr ? 'الوسوم' : 'Tags'}
                value={tags}
                onChangeText={setTags}
                placeholder={isAr ? 'مثل: ذكي، 5G، أصلي' : 'e.g. flagship, 5G, original'}
                isRTL={isRTL}
              />
            </SectionCard>
          </View>
        )}

        {/* ── Step 2: Media ── */}
        {currentStep === 1 && (
          <View style={styles.stepContent}>
            <SectionCard title={isAr ? 'استوديو الوسائط' : 'Media Studio'}>
              <Text style={[styles.mediaHint, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isAr ? 'أضف حتى ١٢ صورة وفيديو للمنتج' : 'Add up to 12 images and a product video'}
              </Text>

              {/* Image grid */}
              <View style={styles.imageGrid}>
                {/* Add button */}
                <Pressable style={styles.addImageBtn}>
                  <Ionicons name="add" size={28} color={colors.light.primary} />
                  <Text style={styles.addImageText}>{isAr ? 'إضافة صورة' : 'Add Image'}</Text>
                </Pressable>

                {/* Placeholder slots */}
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={24} color={colors.light.border} />
                  </View>
                ))}
              </View>

              {/* Video upload */}
              <View style={styles.videoUpload}>
                <View style={styles.videoIcon}>
                  <Ionicons name="videocam-outline" size={20} color={colors.light.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.videoTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isAr ? 'رفع فيديو' : 'Upload video'}
                  </Text>
                  <Text style={[styles.videoSub, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isAr ? 'MP4 حتى ٥٠٠ ميجا' : 'MP4 up to 500MB'}
                  </Text>
                </View>
                <Ionicons name="cloud-upload-outline" size={22} color={colors.light.primary} />
              </View>
            </SectionCard>

            <SectionCard title={isAr ? 'المواصفات' : 'Specifications'}>
              {['Display', 'Processor', 'RAM', 'Storage', 'Camera', 'Battery'].map((spec) => (
                <Pressable key={spec} style={[styles.specRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.specIcon}>
                    <Ionicons name="hardware-chip-outline" size={14} color={colors.light.primary} />
                  </View>
                  <Text style={[styles.specLabel, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>
                    {spec}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={colors.light.mutedForeground} />
                  <View style={styles.specValueInput}>
                    <Ionicons name="create-outline" size={14} color={colors.light.mutedForeground} />
                  </View>
                </Pressable>
              ))}
            </SectionCard>
          </View>
        )}

        {/* ── Step 3: Variants ── */}
        {currentStep === 2 && (
          <View style={styles.stepContent}>
            <SectionCard title={isAr ? 'متغيرات المنتج' : 'Product Variants'}>
              <Text style={[styles.mediaHint, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isAr ? 'أضف المتغيرات حسب الذاكرة والرام واللون' : 'Add variants by storage, RAM, and color'}
              </Text>

              {variants.map((variant, idx) => (
                <View key={idx} style={styles.variantCard}>
                  <View style={[styles.variantHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={styles.variantTitle}>
                      {variant.storage}/{variant.ram}/{isAr ? 'لون' : 'Color'}
                    </Text>
                    <View style={[styles.variantColorDot, { backgroundColor: variant.color }]} />
                    {variants.length > 1 && (
                      <Pressable onPress={() => setVariants(variants.filter((_, i) => i !== idx))}>
                        <Ionicons name="trash-outline" size={16} color={colors.light.destructive} />
                      </Pressable>
                    )}
                  </View>

                  <View style={[styles.variantFields, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={styles.variantField}>
                      <Text style={styles.variantFieldLabel}>{isAr ? 'السعة' : 'Storage'}</Text>
                      <View style={styles.variantPicker}>
                        <Text style={styles.variantPickerText}>{variant.storage}</Text>
                        <Ionicons name="chevron-down" size={14} color={colors.light.mutedForeground} />
                      </View>
                    </View>
                    <View style={styles.variantField}>
                      <Text style={styles.variantFieldLabel}>{isAr ? 'الرام' : 'RAM'}</Text>
                      <View style={styles.variantPicker}>
                        <Text style={styles.variantPickerText}>{variant.ram}</Text>
                        <Ionicons name="chevron-down" size={14} color={colors.light.mutedForeground} />
                      </View>
                    </View>
                    <View style={styles.variantField}>
                      <Text style={styles.variantFieldLabel}>{isAr ? 'السعر' : 'Price'}</Text>
                      <View style={[styles.variantPriceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Pressable style={styles.qtyBtn} onPress={() => {
                          const updated = [...variants];
                          updated[idx].qty = String(Math.max(1, parseInt(updated[idx].qty) - 1));
                          setVariants(updated);
                        }}>
                          <Ionicons name="remove" size={14} color={colors.light.primary} />
                        </Pressable>
                        <Text style={styles.qtyText}>{variant.qty}</Text>
                        <Pressable style={styles.qtyBtn} onPress={() => {
                          const updated = [...variants];
                          updated[idx].qty = String(parseInt(updated[idx].qty) + 1);
                          setVariants(updated);
                        }}>
                          <Ionicons name="add" size={14} color={colors.light.primary} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              ))}

              <Pressable
                style={[styles.addVariantBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => setVariants([...variants, { storage: '256GB', ram: '12GB', color: '#2563EB', price: '0', qty: '1' }])}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.light.primary} />
                <Text style={styles.addVariantText}>{isAr ? 'إضافة متغير جديد' : 'Add New Variant'}</Text>
              </Pressable>
            </SectionCard>
          </View>
        )}

        {/* ── Step 4: Pricing ── */}
        {currentStep === 3 && (
          <View style={styles.stepContent}>
            <SectionCard title={isAr ? 'التسعير' : 'Pricing'}>
              <FormField
                label={isAr ? 'السعر الحالي (ج.م)' : 'Current Price (EGP)'}
                value={currentPrice}
                onChangeText={setCurrentPrice}
                placeholder="0.00"
                isRTL={isRTL}
                keyboardType="numeric"
              />
              <FormField
                label={isAr ? 'السعر القديم (اختياري)' : 'Old Price (optional)'}
                value={oldPrice}
                onChangeText={setOldPrice}
                placeholder="0.00"
                isRTL={isRTL}
                keyboardType="numeric"
              />
              <FormField
                label={isAr ? 'الضريبة (%)' : 'Tax (%)'}
                value={tax}
                onChangeText={setTax}
                placeholder="14"
                isRTL={isRTL}
                keyboardType="numeric"
              />
            </SectionCard>

            <SectionCard title={isAr ? 'المخزون' : 'Inventory'}>
              <FormField
                label={isAr ? 'الكمية' : 'Quantity'}
                value={qty}
                onChangeText={setQty}
                placeholder="1"
                isRTL={isRTL}
                keyboardType="numeric"
              />
              <ToggleRow
                label={isAr ? 'متاح للبيع' : 'Available for Sale'}
                value={available}
                onToggle={() => setAvailable(!available)}
                isRTL={isRTL}
              />
            </SectionCard>

            <SectionCard title={isAr ? 'إعدادات الظهور' : 'Visibility'}>
              <ToggleRow
                label={isAr ? 'ظهور في المتجر' : 'Show in Store'}
                value={storeVisible}
                onToggle={() => setStoreVisible(!storeVisible)}
                isRTL={isRTL}
              />
            </SectionCard>
          </View>
        )}

        {/* ── Step 5: Review & Publish ── */}
        {currentStep === 4 && (
          <View style={styles.stepContent}>
            <SectionCard title={isAr ? 'مراجعة المنتج' : 'Review Product'}>
              {/* Live Preview */}
              <View style={styles.previewCard}>
                <Text style={styles.previewLabel}>{isAr ? 'معاينة مباشرة' : 'Live Preview'}</Text>
                <Text style={styles.previewHint}>{isAr ? 'كيف سيظهر في السوق' : 'How it will look in marketplace'}</Text>

                <View style={styles.previewMockup}>
                  <View style={[styles.previewPhoneIcon, { backgroundColor: '#1E3A8A22' }]}>
                    <Ionicons name="phone-portrait" size={32} color="#1E3A8A" />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.previewBrand}>{brand || 'Brand'}</Text>
                    <Text style={styles.previewProductName} numberOfLines={2}>
                      {(isAr ? nameAr : nameEn) || (isAr ? 'اسم المنتج' : 'Product Name')}
                    </Text>
                    <Text style={styles.previewPrice}>
                      {currentPrice ? `${currentPrice} ${isAr ? 'ج.م' : 'EGP'}` : '--'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Summary */}
              <View style={styles.summaryRows}>
                <SummaryRow label={isAr ? 'الاسم AR' : 'Name AR'} value={nameAr || '--'} />
                <SummaryRow label={isAr ? 'الاسم EN' : 'Name EN'} value={nameEn || '--'} />
                <SummaryRow label={isAr ? 'الماركة' : 'Brand'} value={brand || '--'} />
                <SummaryRow label={isAr ? 'الفئة' : 'Category'} value={cats[category]} />
                <SummaryRow label={isAr ? 'الحالة' : 'Condition'} value={isAr ? CONDITIONS[condition].labelAr : CONDITIONS[condition].labelEn} />
                <SummaryRow label={isAr ? 'السعر' : 'Price'} value={currentPrice ? `${currentPrice} EGP` : '--'} />
                <SummaryRow label={isAr ? 'الكمية' : 'Quantity'} value={qty} />
              </View>
            </SectionCard>
          </View>
        )}
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 12 }]}>
        {currentStep > 0 && (
          <Pressable style={styles.prevBtn} onPress={handlePrevStep}>
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={18} color={colors.light.foreground} />
            <Text style={styles.prevBtnText}>{isAr ? 'السابق' : 'Back'}</Text>
          </Pressable>
        )}
        <Pressable style={styles.saveDraftBtn} onPress={handleSaveDraft}>
          <Ionicons name="bookmark-outline" size={16} color={colors.light.mutedForeground} />
          <Text style={styles.saveDraftText}>{isAr ? 'حفظ كمسودة' : 'Save Draft'}</Text>
        </Pressable>
        {currentStep < STEPS.length - 1 ? (
          <Pressable style={styles.nextBtn} onPress={handleNextStep}>
            <Text style={styles.nextBtnText}>{isAr ? 'التالي' : 'Next'}</Text>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable style={styles.publishBtn} onPress={handlePublish}>
            <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
            <Text style={styles.publishBtnText}>{isAr ? 'نشر المنتج' : 'Publish Product'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Sub-components
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.card}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  );
}
const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: colors.radiusLg,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    marginBottom: 14,
  },
});

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  isRTL,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  isRTL: boolean;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={formStyles.wrap}>
      <Text style={[formStyles.label, { textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={[formStyles.input, { textAlign: isRTL ? 'right' : 'left' }]}
        placeholderTextColor={colors.light.mutedForeground}
        keyboardType={keyboardType}
      />
    </View>
  );
}
const formStyles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.mutedForeground,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(226,232,240,0.8)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.foreground,
    backgroundColor: '#F8FAFC',
  },
});

function ToggleRow({
  label,
  value,
  onToggle,
  isRTL,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  isRTL: boolean;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={[toggleStyles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
    >
      <Text style={[toggleStyles.label, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <View style={[toggleStyles.track, value && toggleStyles.trackActive]}>
        <View style={[toggleStyles.thumb, value && toggleStyles.thumbActive]} />
      </View>
    </Pressable>
  );
}
const toggleStyles = StyleSheet.create({
  row: {
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.5)',
  },
  label: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.light.foreground },
  track: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.light.border,
    justifyContent: 'center',
    padding: 2,
  },
  trackActive: { backgroundColor: colors.light.success },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: 'rgba(0,0,0,0.15)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 2 },
  thumbActive: { transform: [{ translateX: 18 }] },
});

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={summaryStyles.row}>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={summaryStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}
const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.4)',
  },
  label: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, flex: 1 },
  value: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground, flex: 1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  // Header
  header: {
    backgroundColor: colors.light.background,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    gap: 14,
  },
  headerRow: { alignItems: 'center', gap: 10 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  headerRight: { alignItems: 'center', gap: 6 },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.light.successLight,
    borderRadius: 8,
  },
  draftDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.light.success },
  draftText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.light.success },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  previewBtnText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground },
  publishHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.light.primary,
    borderRadius: 10,
  },
  publishHeaderBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },

  // Step indicator
  stepsRow: { alignItems: 'center', gap: 0, paddingBottom: 4 },
  stepItem: { alignItems: 'center', gap: 5, paddingHorizontal: 4 },
  stepItemActive: {},
  stepItemDone: {},
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.light.border,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: { borderColor: colors.light.primary, backgroundColor: colors.light.primaryLight },
  stepCircleDone: { borderColor: colors.light.success, backgroundColor: colors.light.success },
  stepNum: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.light.mutedForeground },
  stepNumActive: { color: colors.light.primary },
  stepLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, textAlign: 'center', maxWidth: 52 },
  stepLabelActive: { fontFamily: 'Inter_600SemiBold', color: colors.light.primary },
  stepLine: { width: 20, height: 2, backgroundColor: colors.light.border, marginHorizontal: 2 },
  stepLineDone: { backgroundColor: colors.light.success },

  // Content
  scroll: { flex: 1 },
  stepContent: { padding: 16 },

  // Field components
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.light.mutedForeground, marginBottom: 8 },
  pillsRow: { gap: 8, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(226,232,240,0.8)',
    backgroundColor: '#F8FAFC',
  },
  pillActive: { backgroundColor: colors.light.primaryLight, borderColor: colors.light.primary },
  pillText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground },
  pillTextActive: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold' },

  // Media
  mediaHint: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginBottom: 14 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  addImageBtn: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.light.primary + '40',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.primaryLight,
    gap: 4,
  },
  addImageText: { fontSize: 10, fontFamily: 'Inter_500Medium', color: colors.light.primary },
  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.light.border,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.light.border,
    backgroundColor: '#F8FAFC',
  },
  videoIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.light.primaryLight, alignItems: 'center', justifyContent: 'center' },
  videoTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground },
  videoSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },

  // Spec accordion
  specRow: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.5)',
  },
  specIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.light.primaryLight, alignItems: 'center', justifyContent: 'center' },
  specLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.light.foreground },
  specValueInput: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },

  // Variants
  variantCard: {
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  variantHeader: { alignItems: 'center', gap: 8, marginBottom: 10 },
  variantTitle: { flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground },
  variantColorDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  variantFields: { gap: 10 },
  variantField: { flex: 1 },
  variantFieldLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground, marginBottom: 5 },
  variantPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  variantPickerText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.light.foreground },
  variantPriceRow: { alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.light.foreground, minWidth: 24, textAlign: 'center' },
  addVariantBtn: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.light.primary + '40',
    borderStyle: 'dashed',
    backgroundColor: colors.light.primaryLight,
    justifyContent: 'center',
  },
  addVariantText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.light.primary },

  // Preview
  previewCard: {
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
  },
  previewLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.light.foreground, marginBottom: 2 },
  previewHint: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, marginBottom: 12 },
  previewMockup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewPhoneIcon: { width: 64, height: 80, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  previewBrand: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground },
  previewProductName: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.light.foreground, lineHeight: 18 },
  previewPrice: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.light.primary, marginTop: 4 },
  summaryRows: {},

  // Bottom bar
  bottomBar: {
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.7)',
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.light.border,
    backgroundColor: '#F8FAFC',
  },
  prevBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground },
  saveDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.light.border,
  },
  saveDraftText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: colors.light.primary,
    borderRadius: 12,
  },
  nextBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  publishBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.light.success,
    borderRadius: 12,
    shadowColor: colors.light.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  publishBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
