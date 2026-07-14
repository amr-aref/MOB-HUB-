import React, { useState, useEffect } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGetPhoneSpecs, useGetStores } from '@workspace/api-client-react';
import type { PhoneSpecDto as PhoneSpec } from '@workspace/api-client-react';
import { useLayout } from '@/hooks/useLayout';

type SpecGroup = {
  groupKey: string;
  specs: Array<{
    key: string;
    label: string;
    getValue: (p: PhoneSpec) => string;
    compareValue?: (p: PhoneSpec) => number;
    higherIsBetter?: boolean;
  }>;
};

export default function CompareScreen() {
  const { t, isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const { data: phoneSpecs = [] } = useGetPhoneSpecs();
  const { data: storesData = [] } = useGetStores();
  const [selected, setSelected] = useState<PhoneSpec[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickingSlot, setPickingSlot] = useState(0);
  const { isTablet } = useLayout();

  useEffect(() => {
    if (phoneSpecs.length >= 2 && selected.length === 0) {
      setSelected([phoneSpecs[0], phoneSpecs[1]]);
    }
  }, [phoneSpecs]);

  const topInset = isTablet ? 24 : (Platform.OS === 'web' ? 67 : insets.top);
  const bottomInset = isTablet ? 0 : (Platform.OS === 'web' ? 34 : 0);
  const MAX_PHONES = 3;

  const specGroups: SpecGroup[] = [
    {
      groupKey: 'category_specs',
      specs: [
        { key: 'spec_brand', label: t('spec_brand'), getValue: (p) => p.brand },
        { key: 'spec_os', label: t('spec_os'), getValue: (p) => p.os },
        { key: 'spec_processor', label: t('spec_processor'), getValue: (p) => p.processor },
        { key: 'spec_ram', label: t('spec_ram'), getValue: (p) => p.ram.join(' / '), compareValue: (p) => p._ramGb, higherIsBetter: true },
        { key: 'spec_storage', label: t('spec_storage'), getValue: (p) => p.storage.join(' / ') },
      ],
    },
    {
      groupKey: 'category_display',
      specs: [
        { key: 'spec_displaySize', label: t('spec_displaySize'), getValue: (p) => p.displaySize, compareValue: (p) => p._displayInch, higherIsBetter: true },
        { key: 'spec_displayType', label: t('spec_displayType'), getValue: (p) => p.displayType },
        { key: 'spec_resolution', label: t('spec_resolution'), getValue: (p) => p.resolution },
        { key: 'spec_refreshRate', label: t('spec_refreshRate'), getValue: (p) => p.refreshRate, compareValue: (p) => p._refreshRateHz, higherIsBetter: true },
      ],
    },
    {
      groupKey: 'category_camera',
      specs: [
        { key: 'spec_rearCamera', label: t('spec_rearCamera'), getValue: (p) => p.rearCamera, compareValue: (p) => p._rearMp, higherIsBetter: true },
        { key: 'spec_frontCamera', label: t('spec_frontCamera'), getValue: (p) => p.frontCamera },
        { key: 'spec_video', label: language === 'ar' ? 'الفيديو' : 'Video', getValue: (p) => p.videoRecording },
      ],
    },
    {
      groupKey: 'category_battery',
      specs: [
        { key: 'spec_battery', label: t('spec_battery'), getValue: (p) => p.battery, compareValue: (p) => p._batteryMah, higherIsBetter: true },
        { key: 'spec_charging', label: t('spec_charging'), getValue: (p) => p.charging, compareValue: (p) => p._chargingW, higherIsBetter: true },
        { key: 'spec_wirelessCharging', label: t('spec_wirelessCharging'), getValue: (p) => p.wirelessCharging ? '✓' : '✗', compareValue: (p) => p.wirelessCharging ? 1 : 0, higherIsBetter: true },
      ],
    },
    {
      groupKey: 'category_connectivity',
      specs: [
        { key: 'spec_fiveG', label: t('spec_fiveG'), getValue: (p) => p.fiveG ? '✓' : '✗', compareValue: (p) => p.fiveG ? 1 : 0, higherIsBetter: true },
        { key: 'spec_nfc', label: t('spec_nfc'), getValue: (p) => p.nfc ? '✓' : '✗', compareValue: (p) => p.nfc ? 1 : 0, higherIsBetter: true },
        { key: 'spec_usb', label: t('spec_usb'), getValue: (p) => p.usb },
        { key: 'spec_wifi', label: 'Wi-Fi', getValue: (p) => p.wifi },
      ],
    },
    {
      groupKey: 'category_design',
      specs: [
        { key: 'spec_weight', label: t('spec_weight'), getValue: (p) => p.weight },
        { key: 'spec_waterResistance', label: t('spec_waterResistance'), getValue: (p) => p.waterResistance },
      ],
    },
    {
      groupKey: 'category_price',
      specs: [
        { key: 'spec_price', label: t('spec_price'), getValue: (p) => `${p.priceEGP.toLocaleString()} ${t('egp')}`, compareValue: (p) => p.priceEGP, higherIsBetter: false },
        { key: 'spec_release', label: language === 'ar' ? 'تاريخ الإطلاق' : 'Release', getValue: (p) => p.releaseDate },
      ],
    },
  ];

  function openPicker(slot: number) {
    setPickingSlot(slot);
    setShowPicker(true);
  }

  function selectPhone(phone: PhoneSpec) {
    Haptics.selectionAsync();
    const next = [...selected];
    if (pickingSlot < next.length) next[pickingSlot] = phone;
    else next.push(phone);
    setSelected(next);
    setShowPicker(false);
  }

  function removePhone(idx: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelected(selected.filter((_, i) => i !== idx));
  }

  function getBestIdx(spec: SpecGroup['specs'][0]): number | null {
    if (!spec.compareValue) return null;
    const vals = selected.map(spec.compareValue);
    const best = spec.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const allSame = vals.every((v) => v === vals[0]);
    if (allSame) return null;
    return vals.indexOf(best);
  }

  // AI summary badges
  const aiBadges = selected.length >= 2 ? [
    {
      label: language === 'ar' ? 'الأفضل عموماً' : 'Best Overall',
      icon: 'trophy',
      color: '#CC5A00',
      bgColor: 'rgba(255,138,61,0.08)',
      phoneIdx: selected.reduce((best, p, i, arr) => {
        const score = p._rearMp / 10 + p._batteryMah / 1000 + p._ramGb - p.priceEGP / 10000;
        const bestScore = arr[best]._rearMp / 10 + arr[best]._batteryMah / 1000 + arr[best]._ramGb - arr[best].priceEGP / 10000;
        return score > bestScore ? i : best;
      }, 0),
    },
    {
      label: language === 'ar' ? 'أفضل كاميرا' : 'Best Camera',
      icon: 'camera',
      color: '#CC5A00',
      bgColor: 'rgba(255,138,61,0.08)',
      phoneIdx: selected.reduce((best, p, i, arr) => p._rearMp > arr[best]._rearMp ? i : best, 0),
    },
    {
      label: language === 'ar' ? 'أفضل بطارية' : 'Best Battery',
      icon: 'battery-full',
      color: '#CC5A00',
      bgColor: 'rgba(255,138,61,0.08)',
      phoneIdx: selected.reduce((best, p, i, arr) => p._batteryMah > arr[best]._batteryMah ? i : best, 0),
    },
    {
      label: language === 'ar' ? 'أفضل قيمة' : 'Best Value',
      icon: 'pricetag',
      color: '#CC5A00',
      bgColor: 'rgba(255,138,61,0.08)',
      phoneIdx: selected.reduce((best, p, i, arr) => p.priceEGP < arr[best].priceEGP ? i : best, 0),
    },
  ] : [];

  const PHONE_COL = isTablet ? 150 : 110;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={isTablet ? styles.tabletCenteredHeader : undefined}>
          <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('compareTitle')}
          </Text>
          <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'قارن حتى ٣ هواتف جنباً إلى جنب' : 'Compare up to 3 phones side by side'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomInset + 100 },
          isTablet && styles.tabletScrollContent
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={isTablet ? [styles.tabletRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }] : undefined}>
          <View style={isTablet ? { width: '35%' } : undefined}>
            {/* Phone Selector */}
            <View style={styles.selectorCard}>
              <ScrollView
                horizontal={!isTablet}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[
                  styles.slotsRow,
                  { flexDirection: isTablet ? 'column' : (isRTL ? 'row-reverse' : 'row') },
                ]}
              >
                {selected.map((phone, idx) => (
                  <View key={phone.id} style={[styles.phoneSlot, isTablet && { width: '100%' }]}>
                    <View style={isTablet ? [styles.tabletSlotInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }] : undefined}>
                      {/* Phone color swatch */}
                      <View style={[styles.phoneImage, { backgroundColor: getPhoneColor(idx) }]}>
                        <Ionicons name="phone-portrait" size={28} color="rgba(255,255,255,0.9)" />
                      </View>
                      <View style={isTablet ? { flex: 1, paddingHorizontal: 12 } : undefined}>
                        <Text style={[styles.phoneBrand, isTablet && { textAlign: isRTL ? 'right' : 'left' }]}>{phone.brand}</Text>
                        <Text style={[styles.phoneModel, isTablet && { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>{phone.model}</Text>
                        <Text style={[styles.phonePrice, isTablet && { textAlign: isRTL ? 'right' : 'left' }]}>
                          {(phone.priceEGP / 1000).toFixed(0)}k {t('egp')}
                        </Text>
                        <Text style={[styles.phoneStorage, isTablet && { textAlign: isRTL ? 'right' : 'left' }]}>{phone.storage[0]}</Text>
                        <View style={[styles.slotActions, isTablet && { justifyContent: isRTL ? 'flex-end' : 'flex-start' }]}>
                          <Pressable
                            onPress={() => removePhone(idx)}
                            style={styles.slotRemove}
                          >
                            <Text style={styles.slotRemoveText}>
                              {language === 'ar' ? 'إزالة' : 'Remove'}
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => openPicker(idx)}
                            style={styles.slotChange}
                          >
                            <Text style={styles.slotChangeText}>
                              {language === 'ar' ? 'تغيير' : 'Change'}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}

                {selected.length < MAX_PHONES && (
                  <Pressable style={[styles.addSlot, isTablet && { width: '100%', flexDirection: isRTL ? 'row-reverse' : 'row', height: 110 }]} onPress={() => openPicker(selected.length)}>
                    <View style={styles.addSlotIcon}>
                      <Ionicons name="add" size={26} color={colors.light.primary} />
                    </View>
                    <Text style={styles.addSlotText}>
                      {t('addPhone')}
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
            </View>

            {/* AI Quick Summary (on tablet, it fits under the selector nicely) */}
            {aiBadges.length > 0 && (
              <View style={[styles.aiCard, isTablet && { marginHorizontal: 0, marginTop: 16 }]}>
                <View style={[styles.aiHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.aiIconWrap}>
                    <Ionicons name="sparkles" size={16} color={colors.light.primary} />
                  </View>
                  <Text style={styles.aiTitle}>
                    {language === 'ar' ? 'ملخص ذكي' : 'Intelligent Summary'}
                  </Text>
                </View>
                <View style={styles.aiBadgesGrid}>
                  {aiBadges.map((badge, i) => (
                    <View key={i} style={[styles.aiBadge, { backgroundColor: badge.bgColor }, isTablet && { minWidth: '45%' }]}>
                      <Ionicons name={badge.icon as any} size={16} color={badge.color} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.aiBadgeLabel, { color: badge.color }]}>{badge.label}</Text>
                        <Text style={styles.aiBadgePhone} numberOfLines={1}>
                          {selected[badge.phoneIdx]?.model}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={isTablet ? { width: '65%' } : undefined}>
            {/* Spec Table */}
            {selected.length >= 2 && (
              <View style={[styles.tableCard, isTablet && { marginHorizontal: 0, marginTop: 0 }]}>
                {/* Column headers */}
                <View style={[styles.tableHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.specLabelCol} />
                  {selected.map((phone, idx) => (
                    <View key={phone.id} style={[styles.phoneCol, { width: PHONE_COL }]}>
                      <View style={[styles.phoneColHeader, { backgroundColor: getPhoneColor(idx) + '22' }]}>
                        <Text style={[styles.phoneColBrand, { color: getPhoneColor(idx) }]}>{phone.brand}</Text>
                        <Text style={[styles.phoneColModel, { color: colors.light.foreground }]} numberOfLines={2}>
                          {phone.model.replace(phone.brand, '').trim()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {specGroups.map((group) => (
                  <View key={group.groupKey}>
                    {/* Group header */}
                    <View style={styles.groupHeader}>
                      <Text style={[styles.groupLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {t(group.groupKey as any)}
                      </Text>
                    </View>

                    {group.specs.map((spec) => {
                      const bestIdx = getBestIdx(spec);
                      return (
                        <View
                          key={spec.key}
                          style={[styles.specRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                        >
                          <View style={styles.specLabelCol}>
                            <Text
                              style={[styles.specLabel, { textAlign: isRTL ? 'right' : 'left' }]}
                              numberOfLines={2}
                            >
                              {spec.label}
                            </Text>
                          </View>
                          {selected.map((phone, idx) => {
                            const isBest = bestIdx === idx;
                            return (
                              <View
                                key={phone.id}
                                style={[
                                  styles.specValueCell,
                                  { width: PHONE_COL },
                                  isBest && styles.bestCell,
                                ]}
                              >
                                {isBest && (
                                  <View style={styles.bestBadge}>
                                    <Ionicons name="checkmark" size={10} color="#fff" />
                                    <Text style={styles.bestBadgeText}>{t('better')}</Text>
                                  </View>
                                )}
                                <Text
                                  style={[styles.specValue, { textAlign: 'center' }, isBest && styles.bestValue]}
                                  numberOfLines={3}
                                >
                                  {spec.getValue(phone)}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}

            {/* Store Price Comparison */}
            {selected.length >= 1 && (
              <View style={[styles.storesPriceCard, isTablet && { marginHorizontal: 0 }]}>
                <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.sectionIconWrap}>
                    <Ionicons name="storefront-outline" size={16} color={colors.light.primary} />
                  </View>
                  <Text style={styles.sectionTitle}>
                    {language === 'ar' ? 'السعر في المتاجر' : 'Price at Stores'}
                  </Text>
                </View>
                <Text style={[styles.sectionSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {selected[0].model}
                </Text>
                {storesData.slice(0, 3).map((store, idx) => {
                  const priceVariant = selected[0].priceEGP * (1 + (idx * 0.05 - 0.02));
                  const storeNameLabel = language === 'ar' ? store.nameAr : store.nameEn;
                  const isLowest = idx === 0;
                  return (
                    <View key={store.id} style={[styles.storePriceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={[styles.storePriceLogo, { backgroundColor: store.logoColor }]}>
                        <Text style={styles.storePriceLogoText}>{store.logoInitial}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }}>
                        <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 5 }]}>
                          <Text style={[styles.storePriceName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                            {storeNameLabel}
                          </Text>
                          {store.isVerified && (
                            <Ionicons name="checkmark-circle" size={12} color={colors.light.primary} />
                          )}
                        </View>
                        <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 5, marginTop: 2 }]}>
                          <Ionicons name="location-outline" size={11} color={colors.light.mutedForeground} />
                          <Text style={styles.storePriceMeta} numberOfLines={1}>
                            {language === 'ar' ? store.governorate : store.city}
                            {isLowest && (
                              <Text style={styles.bestPriceTag}>
                                {language === 'ar' ? ' · أقل سعر' : ' · Best Price'}
                              </Text>
                            )}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                        <Text style={[styles.storePriceAmount, isLowest && { color: colors.light.success }]}>
                          {Math.round(priceVariant).toLocaleString()}
                        </Text>
                        <Text style={styles.storePriceEgp}>{t('egp')}</Text>
                      </View>
                    </View>
                  );
                })}
                {/* Action buttons */}
                <View style={[styles.priceActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Pressable style={styles.reserveBtn}>
                    <Ionicons name="bookmark-outline" size={16} color="#fff" />
                    <Text style={styles.reserveBtnText}>
                      {language === 'ar' ? 'احجز أفضل عرض' : 'Reserve Best Deal'}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.saveBtn}>
                    <Ionicons name="heart-outline" size={16} color={colors.light.primary} />
                    <Text style={styles.saveBtnText}>
                      {language === 'ar' ? 'حفظ' : 'Save'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Phone Picker Modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.modalTitle}>{t('selectPhone')}</Text>
            <Pressable onPress={() => setShowPicker(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color={colors.light.foreground} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalList}>
            {phoneSpecs.map((phone) => {
              const alreadySelected = selected.some((p) => p.id === phone.id);
              return (
                <Pressable
                  key={phone.id}
                  onPress={() => !alreadySelected && selectPhone(phone)}
                  style={[styles.modalItem, alreadySelected && styles.modalItemDisabled]}
                >
                  <View style={[styles.modalPhoneIcon, { backgroundColor: getPhoneColor(phoneSpecs.indexOf(phone)) }]}>
                    <Ionicons name="phone-portrait" size={20} color="rgba(255,255,255,0.9)" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalPhoneName, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {phone.brand} {phone.model}
                    </Text>
                    <Text style={[styles.modalPhonePrice, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {phone.priceEGP.toLocaleString()} {t('egp')}
                    </Text>
                  </View>
                  {alreadySelected ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.light.primary} />
                  ) : (
                    <Ionicons
                      name={isRTL ? 'chevron-back' : 'chevron-forward'}
                      size={18}
                      color={colors.light.mutedForeground}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function getPhoneColor(idx: number): string {
  const palette = ['#2563EB', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2'];
  return palette[idx % palette.length];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  tabletCenteredHeader: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  tabletScrollContent: {
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
    padding: 24,
  },
  tabletRow: {
    gap: 24,
  },
  tabletSlotInner: {
    alignItems: 'center',
  },

  header: {
    backgroundColor: colors.light.background,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Phone selector
  selectorCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: colors.radiusLg,
    padding: 16,
    shadowColor: 'rgba(15,23,42,0.07)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  slotsRow: { gap: 12 },
  phoneSlot: {
    width: 130,
    alignItems: 'center',
    gap: 5,
  },
  phoneImage: {
    width: 72,
    height: 110,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  phoneBrand: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: colors.light.mutedForeground,
    textAlign: 'center',
  },
  phoneModel: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    textAlign: 'center',
    lineHeight: 16,
  },
  phonePrice: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: colors.light.primary,
    textAlign: 'center',
  },
  phoneStorage: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    textAlign: 'center',
  },
  slotActions: { flexDirection: 'row', gap: 6, marginTop: 4 },
  slotRemove: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  slotRemoveText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.light.destructive },
  slotChange: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.light.primaryLight,
  },
  slotChangeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.light.primary },
  addSlot: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addSlotIcon: {
    width: 72,
    height: 110,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  addSlotText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.light.primary,
    textAlign: 'center',
  },

  // AI Summary
  aiCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: colors.radiusLg,
    padding: 16,
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  aiHeader: { alignItems: 'center', gap: 8, marginBottom: 12 },
  aiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    flex: 1,
  },
  aiBadgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
  },
  aiBadgeLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  aiBadgePhone: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    marginTop: 1,
  },

  // Spec table
  tableCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
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
  tableHeaderRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.8)',
    backgroundColor: 'rgba(247,243,236,0.95)',
  },
  specLabelCol: {
    width: 100,
    padding: 8,
  },
  phoneCol: { borderLeftWidth: 1, borderLeftColor: 'rgba(226,232,240,0.8)' },
  phoneColHeader: { padding: 10, alignItems: 'center', gap: 2 },
  phoneColBrand: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  phoneColModel: { fontSize: 12, fontFamily: 'Inter_700Bold', textAlign: 'center', lineHeight: 15 },
  groupHeader: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.8)',
  },
  groupLabel: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: colors.light.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.5)',
    minHeight: 44,
  },
  specLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.light.mutedForeground,
    lineHeight: 16,
    padding: 10,
  },
  specValueCell: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(226,232,240,0.8)',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bestCell: { backgroundColor: 'rgba(37,99,235,0.06)' },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.light.primary,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 3,
  },
  bestBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#fff' },
  specValue: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.light.foreground,
    lineHeight: 16,
  },
  bestValue: { fontFamily: 'Inter_700Bold', color: colors.light.primary },

  // Store prices
  storesPriceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: colors.radiusLg,
    padding: 16,
    shadowColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
  },
  sectionHeader: { alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    marginBottom: 12,
  },
  storePriceRow: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.5)',
  },
  storePriceLogo: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storePriceLogoText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  storePriceName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
  },
  storePriceMeta: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
  },
  bestPriceTag: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold' },
  storePriceAmount: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  storePriceEgp: { fontSize: 10, fontFamily: 'Inter_500Medium', color: colors.light.mutedForeground, marginTop: 2 },
  priceActions: {
    marginTop: 16,
    gap: 10,
  },
  reserveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: colors.light.primary,
    borderRadius: colors.radiusFull,
  },
  reserveBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.light.primaryLight,
    borderRadius: colors.radiusFull,
  },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.light.primary },

  // Modal
  modal: { flex: 1, backgroundColor: '#F5F7FA' },
  modalHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.6)',
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.light.foreground },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.light.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalList: { padding: 16, gap: 10 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: colors.radiusMd,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.6)',
    gap: 12,
  },
  modalItemDisabled: { opacity: 0.6, backgroundColor: '#F8FAFC' },
  modalPhoneIcon: {
    width: 36,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPhoneName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.light.foreground },
  modalPhonePrice: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.light.primary, marginTop: 2 },
});
