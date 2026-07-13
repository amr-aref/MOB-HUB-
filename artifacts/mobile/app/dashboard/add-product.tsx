import React, { useState, useEffect } from 'react';
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
import { getFontFamily } from '@/constants/fonts';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnimatedPressable, Toggle } from '@/components/admin/AdminComponents';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, withDelay, interpolateColor, withRepeat, withSequence } from 'react-native-reanimated';

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

  const fontFamilyRTL = {
    regular: getFontFamily(isRTL, 'regular'),
    medium: getFontFamily(isRTL, 'medium'),
    semiBold: getFontFamily(isRTL, 'semiBold'),
    bold: getFontFamily(isRTL, 'bold'),
  };
  
  const fontFamilyLTR = {
    regular: getFontFamily(false, 'regular'),
    medium: getFontFamily(false, 'medium'),
    semiBold: getFontFamily(false, 'semiBold'),
    bold: getFontFamily(false, 'bold'),
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <AnimatedPressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.light.foreground} />
          </AnimatedPressable>
          <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.bold }]}>
            {isAr ? 'إضافة منتج' : 'Add Product'}
          </Text>
          <View style={[styles.headerRight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.autoSavedText, { fontFamily: fontFamilyRTL.medium }]}>{isAr ? 'حفظ تلقائي' : 'Auto Saved'}</Text>
            {isDraft && (
              <View style={styles.draftBadge}>
                <View style={styles.draftDot} />
                <Text style={[styles.draftText, { fontFamily: fontFamilyRTL.semiBold }]}>{isAr ? 'مسودة' : 'Draft'}</Text>
              </View>
            )}
            <AnimatedPressable style={styles.headerAvatar}>
              <Ionicons name="person" size={16} color="#fff" />
            </AnimatedPressable>
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
                <AnimatedPressable
                  onPress={() => setCurrentStep(idx)}
                  style={[styles.stepItem, isActive && styles.stepItemActive]}
                >
                  <Text style={[
                    styles.stepLabel, 
                    isActive && styles.stepLabelActive, 
                    isDone && styles.stepLabelDone,
                    { fontFamily: isActive ? fontFamilyRTL.bold : fontFamilyRTL.medium }
                  ]}>
                    {isAr ? step.labelAr : step.labelEn}
                  </Text>
                </AnimatedPressable>
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
        contentContainerStyle={{ paddingBottom: bottomInset + 100, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Step 1: Basic Info ── */}
        {currentStep === 0 && (
          <StaggeredView currentStep={currentStep} stepIndex={0}>
            <SectionCard title={isAr ? 'المعلومات الأساسية' : 'Basic Information'} fontFamilyRTL={fontFamilyRTL}>
              <AnimatedField delay={100}>
                <FormField
                  label={isAr ? 'الاسم بالعربية' : 'Arabic Product Name'}
                  value={nameAr}
                  onChangeText={setNameAr}
                  placeholder={isAr ? 'اسم المنتج' : 'Product name in Arabic'}
                  isRTL={isRTL}
                  fontFamilyRTL={fontFamilyRTL}
                  fontFamilyLTR={fontFamilyLTR}
                />
              </AnimatedField>
              <AnimatedField delay={150}>
                <FormField
                  label={isAr ? 'الاسم بالإنجليزية' : 'English Product Name'}
                  value={nameEn}
                  onChangeText={setNameEn}
                  placeholder="e.g. iPhone Pro 16 Ultra"
                  isRTL={isRTL}
                  fontFamilyRTL={fontFamilyRTL}
                  fontFamilyLTR={fontFamilyLTR}
                />
              </AnimatedField>
              <AnimatedField delay={200}>
                <FormField
                  label={isAr ? 'الماركة' : 'Brand'}
                  value={brand}
                  onChangeText={setBrand}
                  placeholder={isAr ? 'مثل: Apple, Samsung' : 'e.g. Apple, Samsung'}
                  isRTL={isRTL}
                  fontFamilyRTL={fontFamilyRTL}
                  fontFamilyLTR={fontFamilyLTR}
                />
              </AnimatedField>

              {/* Category */}
              <AnimatedField delay={250}>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.medium }]}>
                    {isAr ? 'الفئة' : 'Category'}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.pillsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {cats.map((cat, idx) => (
                      <AnimatedPressable
                        key={idx}
                        onPress={() => setCategory(idx)}
                        style={[styles.pill, category === idx && styles.pillActive]}
                      >
                        <Text style={[styles.pillText, category === idx && styles.pillTextActive, { fontFamily: category === idx ? fontFamilyRTL.semiBold : fontFamilyRTL.regular }]}>{cat}</Text>
                      </AnimatedPressable>
                    ))}
                  </ScrollView>
                </View>
              </AnimatedField>

              {/* Condition */}
              <AnimatedField delay={300}>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.medium }]}>
                    {isAr ? 'الحالة' : 'Condition'}
                  </Text>
                  <View style={[styles.pillsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {CONDITIONS.map((cond, idx) => (
                      <AnimatedPressable
                        key={idx}
                        onPress={() => setCondition(idx)}
                        style={[styles.pill, condition === idx && styles.pillActive]}
                      >
                        <Text style={[styles.pillText, condition === idx && styles.pillTextActive, { fontFamily: condition === idx ? fontFamilyRTL.semiBold : fontFamilyRTL.regular }]}>
                          {isAr ? cond.labelAr : cond.labelEn}
                        </Text>
                      </AnimatedPressable>
                    ))}
                  </View>
                </View>
              </AnimatedField>
            </SectionCard>
          </StaggeredView>
        )}

        {/* ── Step 2: Media ── */}
        {currentStep === 1 && (
          <StaggeredView currentStep={currentStep} stepIndex={1}>
            <SectionCard title={isAr ? 'استوديو الوسائط' : 'Media Studio'} fontFamilyRTL={fontFamilyRTL}>
              <AnimatedField delay={100}>
                <Text style={[styles.mediaHint, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.regular }]}>
                  {isAr ? 'أضف حتى ١٢ صورة وفيديو للمنتج' : 'Add up to 12 images and a product video'}
                </Text>

                <View style={[styles.imageGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {/* Add button with dashed border & glow */}
                  <MediaUploadBox isAr={isAr} fontFamilyRTL={fontFamilyRTL} />

                  {/* Placeholder slots */}
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={24} color={colors.light.border} />
                    </View>
                  ))}
                </View>
              </AnimatedField>

              <AnimatedField delay={200}>
                {/* Video upload */}
                <View style={[styles.videoUpload, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.videoIcon}>
                    <Ionicons name="videocam-outline" size={20} color={colors.light.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.videoTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.semiBold }]}>
                      {isAr ? 'رفع فيديو' : 'Upload video'}
                    </Text>
                    <Text style={[styles.videoSub, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.regular }]}>
                      {isAr ? 'MP4 حتى ٥٠٠ ميجا' : 'MP4 up to 500MB'}
                    </Text>
                  </View>
                  <Ionicons name="cloud-upload-outline" size={22} color={colors.light.primary} />
                </View>
              </AnimatedField>
            </SectionCard>

            <SectionCard title={isAr ? 'المواصفات' : 'Specifications'} fontFamilyRTL={fontFamilyRTL}>
              {['Display', 'Processor', 'RAM', 'Storage', 'Camera', 'Battery'].map((spec, i) => (
                <AnimatedField key={spec} delay={300 + (i * 50)}>
                  <Pressable style={[styles.specRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={styles.specIcon}>
                      <Ionicons name="hardware-chip-outline" size={14} color={colors.light.primary} />
                    </View>
                    <Text style={[styles.specLabel, { flex: 1, textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyLTR.medium }]}>
                      {spec}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={colors.light.mutedForeground} />
                  </Pressable>
                </AnimatedField>
              ))}
            </SectionCard>
          </StaggeredView>
        )}

        {/* ── Step 3: Variants ── */}
        {currentStep === 2 && (
          <StaggeredView currentStep={currentStep} stepIndex={2}>
            <SectionCard title={isAr ? 'متغيرات المنتج' : 'Product Variants'} fontFamilyRTL={fontFamilyRTL}>
              <AnimatedField delay={100}>
                <Text style={[styles.mediaHint, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.regular }]}>
                  {isAr ? 'أضف المتغيرات حسب الذاكرة والرام واللون' : 'Add variants by storage, RAM, and color'}
                </Text>
              </AnimatedField>

              {variants.map((variant, idx) => (
                <AnimatedField key={idx} delay={150 + (idx * 100)}>
                  <View style={styles.variantCard}>
                    <View style={[styles.variantHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.variantTitle, { fontFamily: fontFamilyLTR.bold }]}>
                        {variant.storage} / {variant.ram} / {isAr ? 'لون' : 'Color'}
                      </Text>
                      <View style={[styles.variantColorDot, { backgroundColor: variant.color }]} />
                      <View style={{ flex: 1 }} />
                      {variants.length > 1 && (
                        <AnimatedPressable onPress={() => setVariants(variants.filter((_, i) => i !== idx))}>
                          <Ionicons name="trash-outline" size={18} color={colors.light.destructive} />
                        </AnimatedPressable>
                      )}
                    </View>

                    <View style={[styles.variantFields, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={styles.variantField}>
                        <Text style={[styles.variantFieldLabel, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.medium }]}>{isAr ? 'السعة' : 'Storage'}</Text>
                        <View style={[styles.variantPicker, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <Text style={[styles.variantPickerText, { fontFamily: fontFamilyLTR.regular }]}>{variant.storage}</Text>
                          <Ionicons name="chevron-down" size={14} color={colors.light.mutedForeground} />
                        </View>
                      </View>
                      <View style={styles.variantField}>
                        <Text style={[styles.variantFieldLabel, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.medium }]}>{isAr ? 'الرام' : 'RAM'}</Text>
                        <View style={[styles.variantPicker, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <Text style={[styles.variantPickerText, { fontFamily: fontFamilyLTR.regular }]}>{variant.ram}</Text>
                          <Ionicons name="chevron-down" size={14} color={colors.light.mutedForeground} />
                        </View>
                      </View>
                      <View style={styles.variantField}>
                        <Text style={[styles.variantFieldLabel, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.medium }]}>{isAr ? 'الكمية' : 'Qty'}</Text>
                        <View style={[styles.variantPriceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <AnimatedPressable style={styles.qtyBtn} onPress={() => {
                            const updated = [...variants];
                            updated[idx].qty = String(Math.max(1, parseInt(updated[idx].qty) - 1));
                            setVariants(updated);
                          }}>
                            <Ionicons name="remove" size={14} color={colors.light.foreground} />
                          </AnimatedPressable>
                          <Text style={[styles.qtyText, { fontFamily: fontFamilyLTR.semiBold }]}>{variant.qty}</Text>
                          <AnimatedPressable style={styles.qtyBtn} onPress={() => {
                            const updated = [...variants];
                            updated[idx].qty = String(parseInt(updated[idx].qty) + 1);
                            setVariants(updated);
                          }}>
                            <Ionicons name="add" size={14} color={colors.light.foreground} />
                          </AnimatedPressable>
                        </View>
                      </View>
                    </View>
                  </View>
                </AnimatedField>
              ))}

              <AnimatedField delay={300}>
                <AnimatedPressable
                  style={[styles.addVariantBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  onPress={() => setVariants([...variants, { storage: '256GB', ram: '12GB', color: '#2563EB', price: '0', qty: '1' }])}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.light.primary} />
                  <Text style={[styles.addVariantText, { fontFamily: fontFamilyRTL.semiBold }]}>{isAr ? 'إضافة متغير جديد' : 'Add New Variant'}</Text>
                </AnimatedPressable>
              </AnimatedField>
            </SectionCard>
          </StaggeredView>
        )}

        {/* ── Step 4: Pricing ── */}
        {currentStep === 3 && (
          <StaggeredView currentStep={currentStep} stepIndex={3}>
            <SectionCard title={isAr ? 'التسعير' : 'Pricing'} fontFamilyRTL={fontFamilyRTL}>
              <AnimatedField delay={100}>
                <FormField
                  label={isAr ? 'السعر الحالي (ج.م)' : 'Current Price (EGP)'}
                  value={currentPrice}
                  onChangeText={setCurrentPrice}
                  placeholder="0.00"
                  isRTL={isRTL}
                  keyboardType="numeric"
                  fontFamilyRTL={fontFamilyRTL}
                  fontFamilyLTR={fontFamilyLTR}
                />
              </AnimatedField>
              <AnimatedField delay={150}>
                <FormField
                  label={isAr ? 'السعر القديم (اختياري)' : 'Old Price (optional)'}
                  value={oldPrice}
                  onChangeText={setOldPrice}
                  placeholder="0.00"
                  isRTL={isRTL}
                  keyboardType="numeric"
                  fontFamilyRTL={fontFamilyRTL}
                  fontFamilyLTR={fontFamilyLTR}
                />
              </AnimatedField>
            </SectionCard>

            <SectionCard title={isAr ? 'المخزون والظهور' : 'Inventory & Visibility'} fontFamilyRTL={fontFamilyRTL}>
              <AnimatedField delay={200}>
                <ToggleRow
                  label={isAr ? 'متاح للبيع' : 'Available for Sale'}
                  value={available}
                  onToggle={() => setAvailable(!available)}
                  isRTL={isRTL}
                  fontFamilyRTL={fontFamilyRTL}
                />
              </AnimatedField>
              <AnimatedField delay={250}>
                <ToggleRow
                  label={isAr ? 'ظهور في المتجر' : 'Show in Store'}
                  value={storeVisible}
                  onToggle={() => setStoreVisible(!storeVisible)}
                  isRTL={isRTL}
                  fontFamilyRTL={fontFamilyRTL}
                />
              </AnimatedField>
            </SectionCard>
          </StaggeredView>
        )}

        {/* ── Step 5: Review & Publish ── */}
        {currentStep === 4 && (
          <StaggeredView currentStep={currentStep} stepIndex={4}>
            <SectionCard title={isAr ? 'مراجعة المنتج' : 'Review Product'} fontFamilyRTL={fontFamilyRTL}>
              {/* Live Preview Panel with Cross Fade */}
              <AnimatedField delay={100}>
                <LivePreviewPanel
                  brand={brand}
                  nameAr={nameAr}
                  nameEn={nameEn}
                  price={currentPrice}
                  isAr={isAr}
                  isRTL={isRTL}
                  fontFamilyRTL={fontFamilyRTL}
                  fontFamilyLTR={fontFamilyLTR}
                />
              </AnimatedField>

              {/* Summary Rows */}
              <AnimatedField delay={200}>
                <View style={styles.summaryRows}>
                  <SummaryRow label={isAr ? 'الاسم AR' : 'Name AR'} value={nameAr || '--'} fontFamilyRTL={fontFamilyRTL} fontFamilyLTR={fontFamilyLTR} />
                  <SummaryRow label={isAr ? 'الاسم EN' : 'Name EN'} value={nameEn || '--'} fontFamilyRTL={fontFamilyRTL} fontFamilyLTR={fontFamilyLTR} />
                  <SummaryRow label={isAr ? 'الماركة' : 'Brand'} value={brand || '--'} fontFamilyRTL={fontFamilyRTL} fontFamilyLTR={fontFamilyLTR} />
                  <SummaryRow label={isAr ? 'الفئة' : 'Category'} value={cats[category]} fontFamilyRTL={fontFamilyRTL} fontFamilyLTR={fontFamilyLTR} />
                  <SummaryRow label={isAr ? 'الحالة' : 'Condition'} value={isAr ? CONDITIONS[condition].labelAr : CONDITIONS[condition].labelEn} fontFamilyRTL={fontFamilyRTL} fontFamilyLTR={fontFamilyLTR} />
                  <SummaryRow label={isAr ? 'السعر' : 'Price'} value={currentPrice ? `${currentPrice} EGP` : '--'} fontFamilyRTL={fontFamilyRTL} fontFamilyLTR={fontFamilyLTR} />
                </View>
              </AnimatedField>
              
              {/* AI Assistant Rail */}
              <AnimatedField delay={300}>
                <View style={styles.aiRail}>
                  <Text style={[styles.aiRailTitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.bold }]}>
                    {isAr ? 'المساعد الذكي ✨' : 'AI Assistant ✨'}
                  </Text>
                  <AnimatedPressable style={[styles.aiRailCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.aiRailIcon, { backgroundColor: '#3E8BFF1A' }]}>
                      <Ionicons name="text-outline" size={16} color="#3E8BFF" />
                    </View>
                    <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                      <Text style={[styles.aiRailCardTitle, { fontFamily: fontFamilyRTL.semiBold }]}>{isAr ? 'تحسين الوصف' : 'Improve Description'}</Text>
                      <Text style={[styles.aiRailCardSub, { fontFamily: fontFamilyRTL.regular }]}>{isAr ? 'توليد وصف جذاب يعزز المبيعات' : 'Generate engaging description to boost sales'}</Text>
                    </View>
                  </AnimatedPressable>
                  <AnimatedPressable style={[styles.aiRailCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.aiRailIcon, { backgroundColor: '#2FBE5C1A' }]}>
                      <Ionicons name="pricetag-outline" size={16} color="#2FBE5C" />
                    </View>
                    <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                      <Text style={[styles.aiRailCardTitle, { fontFamily: fontFamilyRTL.semiBold }]}>{isAr ? 'اقتراح السعر' : 'Suggest Selling Price'}</Text>
                      <Text style={[styles.aiRailCardSub, { fontFamily: fontFamilyRTL.regular }]}>{isAr ? 'بناءً على السوق الحالي والمنافسين' : 'Based on current market and competitors'}</Text>
                    </View>
                  </AnimatedPressable>
                </View>
              </AnimatedField>
            </SectionCard>
          </StaggeredView>
        )}
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 16, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <AnimatedPressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={[styles.cancelBtnText, { fontFamily: fontFamilyRTL.medium }]}>{isAr ? 'إلغاء' : 'Cancel'}</Text>
        </AnimatedPressable>
        <AnimatedPressable style={styles.saveDraftBtn} onPress={handleSaveDraft}>
          <Text style={[styles.saveDraftText, { fontFamily: fontFamilyRTL.medium }]}>{isAr ? 'حفظ مسودة' : 'Save Draft'}</Text>
        </AnimatedPressable>
        {currentStep > 0 && (
          <AnimatedPressable style={styles.prevBtn} onPress={handlePrevStep}>
            <Text style={[styles.prevBtnText, { fontFamily: fontFamilyRTL.semiBold }]}>{isAr ? 'السابق' : 'Back'}</Text>
          </AnimatedPressable>
        )}
        <View style={{ flex: 1 }} />
        {currentStep < STEPS.length - 1 ? (
          <AnimatedPressable style={[styles.nextBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={handleNextStep}>
            <Text style={[styles.nextBtnText, { fontFamily: fontFamilyRTL.bold }]}>{isAr ? 'التالي' : 'Next'}</Text>
            <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color="#fff" />
          </AnimatedPressable>
        ) : (
          <AnimatedPressable style={[styles.publishBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={handlePublish}>
            <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
            <Text style={[styles.publishBtnText, { fontFamily: fontFamilyRTL.bold }]}>{isAr ? 'نشر المنتج' : 'Publish'}</Text>
          </AnimatedPressable>
        )}
      </View>
    </View>
  );
}

// Sub-components

function StaggeredView({ children, currentStep, stepIndex }: { children: React.ReactNode, currentStep: number, stepIndex: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (currentStep === stepIndex) {
      progress.value = 0;
      progress.value = withTiming(1, { duration: 300, easing: Easing.bezier(0.22, 1, 0.36, 1) });
    }
  }, [currentStep, stepIndex]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: (1 - progress.value) * 12 }]
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

function AnimatedField({ children, delay }: { children: React.ReactNode, delay: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

function LivePreviewPanel({ brand, nameAr, nameEn, price, isAr, isRTL, fontFamilyRTL, fontFamilyLTR }: any) {
  // Simple cross-fade logic by rendering a key on the container
  const [key, setKey] = useState(0);
  
  useEffect(() => {
    setKey(prev => prev + 1);
  }, [brand, nameAr, nameEn, price]);

  return (
    <View style={styles.previewCard}>
      <Text style={[styles.previewLabel, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.semiBold }]}>{isAr ? 'معاينة مباشرة' : 'Live Preview'}</Text>
      <View style={[styles.previewMockup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.previewPhoneIcon, { backgroundColor: '#F7F3EC' }]}>
          <Ionicons name="phone-portrait" size={32} color={colors.light.primary} />
        </View>
        <Animated.View key={key} entering={require('react-native-reanimated').FadeIn.duration(180)} style={{ flex: 1, gap: 4, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
          <Text style={[styles.previewBrand, { fontFamily: fontFamilyLTR.semiBold }]}>{brand || 'Brand'}</Text>
          <Text style={[styles.previewProductName, { fontFamily: fontFamilyRTL.bold, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
            {(isAr ? nameAr : nameEn) || (isAr ? 'اسم المنتج' : 'Product Name')}
          </Text>
          <Text style={[styles.previewPrice, { fontFamily: fontFamilyLTR.bold }]}>
            {price ? `${price} ${isAr ? 'ج.م' : 'EGP'}` : '--'}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

function MediaUploadBox({ isAr, fontFamilyRTL }: any) {
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      glow.value,
      [0, 1],
      ['rgba(226,232,240,0.8)', 'rgba(255,138,61,0.5)']
    );
    const backgroundColor = interpolateColor(
      glow.value,
      [0, 1],
      ['#FBFAF7', 'rgba(255,138,61,0.05)']
    );
    return { borderColor, backgroundColor };
  });

  return (
    <AnimatedPressable style={[styles.addImageBtn, animatedStyle]}>
      <Ionicons name="add" size={28} color={colors.light.primary} />
      <Text style={[styles.addImageText, { fontFamily: fontFamilyRTL.medium }]}>{isAr ? 'إضافة صورة' : 'Add Image'}</Text>
    </AnimatedPressable>
  );
}

function SectionCard({ title, children, fontFamilyRTL }: { title: string; children: React.ReactNode; fontFamilyRTL: any }) {
  return (
    <View style={sectionStyles.card}>
      <Text style={[sectionStyles.title, { fontFamily: fontFamilyRTL.bold }]}>{title}</Text>
      {children}
    </View>
  );
}
const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: 'rgba(30, 25, 15, 0.06)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    color: '#1B1B1D',
    marginBottom: 20,
  },
});

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  isRTL,
  keyboardType = 'default',
  fontFamilyRTL,
  fontFamilyLTR,
}: any) {
  return (
    <View style={formStyles.wrap}>
      <Text style={[formStyles.label, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.medium }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={[formStyles.input, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.regular }]}
        placeholderTextColor="#8A8782"
        keyboardType={keyboardType}
      />
    </View>
  );
}
const formStyles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: {
    fontSize: 12,
    color: '#8A8782',
    marginBottom: 8,
  },
  input: {
    borderWidth: 0,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1B1B1D',
    backgroundColor: '#F7F3EC',
  },
});

function ToggleRow({
  label,
  value,
  onToggle,
  isRTL,
  fontFamilyRTL,
}: any) {
  return (
    <Pressable
      onPress={onToggle}
      style={[toggleStyles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
    >
      <Text style={[toggleStyles.label, { flex: 1, textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamilyRTL.medium }]}>{label}</Text>
      <Toggle value={value} onToggle={onToggle} isRTL={isRTL} />
    </Pressable>
  );
}
const toggleStyles = StyleSheet.create({
  row: {
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236, 230, 217, 0.5)',
  },
  label: { fontSize: 14, color: '#1B1B1D' },
});

function SummaryRow({ label, value, fontFamilyRTL, fontFamilyLTR }: any) {
  return (
    <View style={summaryStyles.row}>
      <Text style={[summaryStyles.label, { fontFamily: fontFamilyRTL.regular }]}>{label}</Text>
      <Text style={[summaryStyles.value, { fontFamily: fontFamilyLTR.semiBold }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}
const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236, 230, 217, 0.4)',
  },
  label: { fontSize: 13, color: '#8A8782', flex: 1 },
  value: { fontSize: 13, color: '#1B1B1D', flex: 1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F3EC' },

  // Header
  header: {
    backgroundColor: '#F7F3EC',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: { alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(30, 25, 15, 0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  headerTitle: { flex: 1, fontSize: 18, color: '#1B1B1D' },
  headerRight: { alignItems: 'center', gap: 8 },
  autoSavedText: { fontSize: 11, color: '#B8B4AC' },
  draftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E3F8E9',
    borderRadius: 999,
  },
  draftDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2FBE5C' },
  draftText: { fontSize: 11, color: '#2FBE5C' },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF8A3D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Step indicator
  stepsRow: { alignItems: 'center', gap: 0 },
  stepItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  stepItemActive: { backgroundColor: '#2B2B2E' },
  stepLabel: { fontSize: 13, color: '#8A8782' },
  stepLabelActive: { color: '#FFFFFF' },
  stepLabelDone: { color: '#1B1B1D' },
  stepLine: { width: 12, height: 2, backgroundColor: '#ECE6D9' },
  stepLineDone: { backgroundColor: '#1B1B1D' },

  scroll: { flex: 1 },

  // Fields wrap
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    color: '#8A8782',
    marginBottom: 8,
  },
  pillsRow: { gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F7F3EC',
  },
  pillActive: { backgroundColor: '#2B2B2E' },
  pillText: { fontSize: 13, color: '#8A8782' },
  pillTextActive: { color: '#FFFFFF' },

  // Media
  mediaHint: { fontSize: 13, color: '#8A8782', marginBottom: 16 },
  imageGrid: { gap: 12, marginBottom: 20 },
  addImageBtn: {
    width: 100,
    height: 100,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addImageText: { fontSize: 12, color: '#FF8A3D' },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#F7F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoUpload: {
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F7F3EC',
  },
  videoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDEEDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTitle: { fontSize: 14, color: '#1B1B1D' },
  videoSub: { fontSize: 12, color: '#8A8782' },

  // Specs
  specRow: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE6D9',
  },
  specIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDEEDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specLabel: { fontSize: 14, color: '#1B1B1D' },

  // Variants
  variantCard: {
    backgroundColor: '#FBFAF7',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ECE6D9',
  },
  variantHeader: { alignItems: 'center', gap: 8, marginBottom: 16 },
  variantTitle: { fontSize: 14, color: '#1B1B1D' },
  variantColorDot: { width: 16, height: 16, borderRadius: 8 },
  variantFields: { gap: 12 },
  variantField: { flex: 1 },
  variantFieldLabel: { fontSize: 11, color: '#8A8782', marginBottom: 6 },
  variantPicker: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECE6D9',
  },
  variantPickerText: { fontSize: 13, color: '#1B1B1D' },
  variantPriceRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECE6D9',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F7F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 13, color: '#1B1B1D' },
  addVariantBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FDEEDD',
  },
  addVariantText: { fontSize: 14, color: '#FF8A3D' },

  // Preview
  previewCard: {
    marginBottom: 24,
  },
  previewLabel: { fontSize: 14, color: '#1B1B1D', marginBottom: 12 },
  previewMockup: {
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#FBFAF7',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECE6D9',
  },
  previewPhoneIcon: {
    width: 60,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBrand: { fontSize: 11, color: '#8A8782', textTransform: 'uppercase' },
  previewProductName: { fontSize: 16, color: '#1B1B1D' },
  previewPrice: { fontSize: 18, color: '#1B1B1D' },

  // Summary
  summaryRows: {
    backgroundColor: '#FBFAF7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECE6D9',
  },

  // AI Rail
  aiRail: { marginTop: 24 },
  aiRailTitle: { fontSize: 14, color: '#1B1B1D', marginBottom: 12 },
  aiRailCard: {
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECE6D9',
    shadowColor: 'rgba(30, 25, 15, 0.04)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
  },
  aiRailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiRailCardTitle: { fontSize: 13, color: '#1B1B1D', marginBottom: 2 },
  aiRailCardSub: { fontSize: 11, color: '#8A8782' },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ECE6D9',
    shadowColor: 'rgba(30, 25, 15, 0.08)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 12 },
  cancelBtnText: { fontSize: 14, color: '#8A8782' },
  saveDraftBtn: { paddingHorizontal: 12, paddingVertical: 12 },
  saveDraftText: { fontSize: 14, color: '#1B1B1D' },
  prevBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#F7F3EC',
  },
  prevBtnText: { fontSize: 14, color: '#1B1B1D' },
  nextBtn: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#2B2B2E',
    borderRadius: 999,
  },
  nextBtnText: { fontSize: 15, color: '#FFFFFF' },
  publishBtn: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#2B2B2E',
    borderRadius: 999,
  },
  publishBtnText: { fontSize: 15, color: '#FFFFFF' },
});
