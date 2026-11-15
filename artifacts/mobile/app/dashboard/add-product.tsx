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
import { useAuth } from '@/contexts/AuthContext';
import { useCreateDashboardProduct } from '@workspace/api-client-react';

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
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const sessionStoreId = user?.storeId?.trim() || undefined;
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
  const createProduct = useCreateDashboardProduct();

  function handlePublish() {
    if (!sessionStoreId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createProduct.mutate(
      {
        data: {
          storeId: sessionStoreId!,
          nameAr: nameAr || 'منتج جديد',
          nameEn: nameEn || 'New Product',
          descriptionAr: '',
          descriptionEn: '',
          brand: brand || 'Unknown',
          model: model || 'Unknown',
          price: Number(currentPrice) || 0,
          discountPrice: oldPrice ? Number(oldPrice) : undefined,
          category: cats[category] ?? 'Other',
          condition: CONDITIONS[condition]?.value ?? 'new',
          warranty,
          stock: Number(qty) || 1,
          isAvailable: available,
        },
      },
      {
        onSuccess: () => {
          router.back();
        },
      },
    );
  }

  const isAr = language === 'ar';
  const cats = isAr ? CATEGORIES : CATEGORIES_EN;

  if (authLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground }}>
          {language === 'ar' ? 'جاري التحميل…' : 'Loading…'}
        </Text>
      </View>
    );
  }

  if (!isAuthenticated || !sessionStoreId) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }]}>
        <Ionicons name="storefront-outline" size={40} color={colors.light.mutedForeground} />
        <Text style={{ marginTop: 16, fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.light.foreground, textAlign: 'center' }}>
          {language === 'ar' ? 'لا يمكن إضافة منتج' : 'Cannot add product'}
        </Text>
        <Text style={{ marginTop: 8, fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, textAlign: 'center' }}>
          {!isAuthenticated
            ? (language === 'ar' ? 'يلزم تسجيل الدخول كحساب تاجر' : 'Sign in with a merchant account')
            : (language === 'ar' ? 'حسابك غير مرتبط بأي متجر' : 'Your account is not linked to a store')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.light.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>{isAr ? 'إضافة منتج' : 'Add Product'}</Text>
          <Pressable onPress={handleSaveDraft}>
            <Text style={styles.draftBtn}>{isAr ? 'مسودة' : 'Draft'}</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.steps, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {STEPS.map((step, idx) => (
            <Pressable key={step.key} onPress={() => setCurrentStep(idx)} style={[styles.stepChip, currentStep === idx && styles.stepChipActive]}>
              <Text style={[styles.stepChipText, currentStep === idx && styles.stepChipTextActive]}>
                {isAr ? step.labelAr : step.labelEn}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 100 }}>
        {currentStep === 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{isAr ? 'المعلومات الأساسية' : 'Basic Info'}</Text>
            <Text style={styles.label}>{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}</Text>
            <TextInput style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]} value={nameAr} onChangeText={setNameAr} placeholder={isAr ? 'اسم المنتج' : 'Product name'} placeholderTextColor={colors.light.mutedForeground} />
            <Text style={styles.label}>{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</Text>
            <TextInput style={styles.input} value={nameEn} onChangeText={setNameEn} placeholder="Product name" placeholderTextColor={colors.light.mutedForeground} />
            <Text style={styles.label}>{isAr ? 'العلامة التجارية' : 'Brand'}</Text>
            <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="Apple, Samsung…" placeholderTextColor={colors.light.mutedForeground} />
            <Text style={styles.label}>{isAr ? 'الموديل' : 'Model'}</Text>
            <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="iPhone 15…" placeholderTextColor={colors.light.mutedForeground} />
            <Text style={styles.label}>{isAr ? 'الفئة' : 'Category'}</Text>
            <View style={[styles.chipRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {cats.map((cat, i) => (
                <Pressable key={cat} onPress={() => setCategory(i)} style={[styles.chip, category === i && styles.chipActive]}>
                  <Text style={[styles.chipText, category === i && styles.chipTextActive]}>{cat}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>{isAr ? 'الحالة' : 'Condition'}</Text>
            <View style={[styles.chipRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {CONDITIONS.map((c, i) => (
                <Pressable key={c.value} onPress={() => setCondition(i)} style={[styles.chip, condition === i && styles.chipActive]}>
                  <Text style={[styles.chipText, condition === i && styles.chipTextActive]}>{isAr ? c.labelAr : c.labelEn}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {currentStep === 1 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{isAr ? 'الوسائط' : 'Media'}</Text>
            <Text style={styles.hint}>{isAr ? 'رفع الصور متاح في إصدار لاحق' : 'Image upload available in a later release'}</Text>
          </View>
        )}

        {currentStep === 2 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{isAr ? 'المتغيرات' : 'Variants'}</Text>
            {variants.map((v, i) => (
              <View key={i} style={styles.variantRow}>
                <Text style={styles.label}>{isAr ? `متغير ${i + 1}` : `Variant ${i + 1}`}</Text>
                <TextInput style={styles.input} value={v.storage} onChangeText={(t) => { const next = [...variants]; next[i] = { ...next[i], storage: t }; setVariants(next); }} placeholder="128GB" placeholderTextColor={colors.light.mutedForeground} />
                <TextInput style={styles.input} value={v.ram} onChangeText={(t) => { const next = [...variants]; next[i] = { ...next[i], ram: t }; setVariants(next); }} placeholder="8GB" placeholderTextColor={colors.light.mutedForeground} />
              </View>
            ))}
          </View>
        )}

        {currentStep === 3 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{isAr ? 'التسعير' : 'Pricing'}</Text>
            <Text style={styles.label}>{isAr ? 'السعر الحالي' : 'Current price'}</Text>
            <TextInput style={styles.input} value={currentPrice} onChangeText={setCurrentPrice} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.light.mutedForeground} />
            <Text style={styles.label}>{isAr ? 'السعر قبل الخصم' : 'Original price'}</Text>
            <TextInput style={styles.input} value={oldPrice} onChangeText={setOldPrice} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.light.mutedForeground} />
            <Text style={styles.label}>{isAr ? 'الكمية' : 'Quantity'}</Text>
            <TextInput style={styles.input} value={qty} onChangeText={setQty} keyboardType="numeric" placeholder="1" placeholderTextColor={colors.light.mutedForeground} />
          </View>
        )}

        {currentStep === 4 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{isAr ? 'النشر' : 'Publish'}</Text>
            <Text style={styles.hint}>
              {isAr
                ? `سيتم نشر المنتج في المتجر: ${sessionStoreId}`
                : `Product will be published to store: ${sessionStoreId}`}
            </Text>
            <Pressable style={styles.publishBtn} onPress={handlePublish} disabled={createProduct.isPending}>
              <Text style={styles.publishBtnText}>
                {createProduct.isPending
                  ? (isAr ? 'جاري النشر…' : 'Publishing…')
                  : (isAr ? 'نشر المنتج' : 'Publish product')}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 12, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {currentStep > 0 && (
          <Pressable style={styles.secondaryBtn} onPress={handlePrevStep}>
            <Text style={styles.secondaryBtnText}>{isAr ? 'السابق' : 'Back'}</Text>
          </Pressable>
        )}
        {currentStep < STEPS.length - 1 && (
          <Pressable style={styles.primaryBtn} onPress={handleNextStep}>
            <Text style={styles.primaryBtnText}>{isAr ? 'التالي' : 'Next'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    backgroundColor: colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light.muted,
  },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  draftBtn: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.light.primary },
  steps: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  stepChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.light.muted,
  },
  stepChipActive: { backgroundColor: colors.light.primary },
  stepChipText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground },
  stepChipTextActive: { color: '#fff', fontFamily: 'Inter_700Bold' },
  card: {
    backgroundColor: colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.light.border,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.light.foreground, marginBottom: 12 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: colors.light.foreground,
    backgroundColor: colors.light.muted,
  },
  chipRow: { flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.light.muted,
  },
  chipActive: { backgroundColor: colors.light.primary },
  chipText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground },
  chipTextActive: { color: '#fff' },
  hint: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.light.mutedForeground, lineHeight: 20 },
  variantRow: { marginBottom: 12 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.light.card,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  secondaryBtn: {
    flex: 1,
    backgroundColor: colors.light.muted,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground },
  publishBtn: {
    marginTop: 16,
    backgroundColor: colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  publishBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
