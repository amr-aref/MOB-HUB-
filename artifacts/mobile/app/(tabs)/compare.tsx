import React, { useState } from 'react';
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
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { getFontFamily } from '@/constants/fonts';
import { phoneSpecs, PhoneSpec, stores, products } from '@/data/mockData';
import ProductCard from '@/components/ProductCard';

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

function PulseGlow({ children }: { children: React.ReactNode }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withRepeat(withTiming(0.4, { duration: 1500 }), -1, true),
    };
  });

  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.pulseGlow, animatedStyle]} />
      {children}
    </View>
  );
}

export default function CompareScreen() {
  const { t, isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<PhoneSpec[]>([phoneSpecs[0], phoneSpecs[1]]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickingSlot, setPickingSlot] = useState(0);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;
  const MAX_PHONES = 3;

  const fontFamBold = getFontFamily(isRTL, 'bold');
  const fontFamSemi = getFontFamily(isRTL, 'semiBold');
  const fontFamReg = getFontFamily(isRTL, 'regular');
  const latinBold = getFontFamily(false, 'bold');
  const latinReg = getFontFamily(false, 'regular');

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
    if (!spec.compareValue || selected.length < 2) return null;
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
      color: '#D97706',
      bgColor: '#FEF3C7',
      phoneIdx: selected.reduce((best, p, i, arr) => {
        const score = p._rearMp / 10 + p._batteryMah / 1000 + p._ramGb - p.priceEGP / 10000;
        const bestScore = arr[best]._rearMp / 10 + arr[best]._batteryMah / 1000 + arr[best]._ramGb - arr[best].priceEGP / 10000;
        return score > bestScore ? i : best;
      }, 0),
    },
    {
      label: language === 'ar' ? 'أفضل أداء' : 'Best Gaming',
      icon: 'game-controller',
      color: '#7C3AED',
      bgColor: '#EDE9FE',
      phoneIdx: selected.reduce((best, p, i, arr) => p._ramGb > arr[best]._ramGb ? i : best, 0),
    },
    {
      label: language === 'ar' ? 'أفضل بطارية' : 'Best Battery',
      icon: 'battery-full',
      color: '#059669',
      bgColor: '#D1FAE5',
      phoneIdx: selected.reduce((best, p, i, arr) => p._batteryMah > arr[best]._batteryMah ? i : best, 0),
    },
    {
      label: language === 'ar' ? 'أفضل قيمة' : 'Best Value',
      icon: 'pricetag',
      color: '#2563EB',
      bgColor: '#DBEAFE',
      phoneIdx: selected.reduce((best, p, i, arr) => p.priceEGP < arr[best].priceEGP ? i : best, 0),
    },
  ] : [];

  const PHONE_COL = 130;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
          {t('compareTitle')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamReg }]}>
          {language === 'ar' ? 'قارن حتى ٣ هواتف جنباً إلى جنب' : 'Compare up to 3 phones side by side'}
        </Text>
        <View style={[styles.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable style={styles.actionBtn}>
            <Ionicons name="bookmark-outline" size={18} color={colors.light.foreground} />
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Ionicons name="share-social-outline" size={18} color={colors.light.foreground} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomInset + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Phone Selector */}
        <Animated.View entering={FadeInUp.delay(100).springify().stiffness(300).damping(28)} style={styles.selectorContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.slotsRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            {selected.map((phone, idx) => (
              <View key={phone.id} style={styles.phoneSlotCard}>
                <View style={[styles.phoneImage, { backgroundColor: getPhoneColor(idx) + '20' }]}>
                  <Ionicons name="phone-portrait" size={32} color={getPhoneColor(idx)} />
                </View>
                <Text style={[styles.phoneBrand, { fontFamily: fontFamSemi }]}>{phone.brand}</Text>
                <Text style={[styles.phoneModel, { fontFamily: fontFamBold }]} numberOfLines={2}>{phone.model}</Text>
                <View style={[styles.slotActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Pressable
                    onPress={() => removePhone(idx)}
                    style={styles.slotRemove}
                  >
                    <Text style={[styles.slotRemoveText, { fontFamily: fontFamSemi }]}>
                      {language === 'ar' ? 'إزالة' : 'Remove'}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openPicker(idx)}
                    style={styles.slotChange}
                  >
                    <Text style={[styles.slotChangeText, { fontFamily: fontFamSemi }]}>
                      {language === 'ar' ? 'تغيير' : 'Change'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {selected.length < MAX_PHONES && (
              <Pressable style={styles.addSlotCard} onPress={() => openPicker(selected.length)}>
                <View style={styles.addSlotIcon}>
                  <Ionicons name="add" size={28} color={colors.light.primary} />
                </View>
                <Text style={[styles.addSlotText, { fontFamily: fontFamSemi }]}>
                  {t('addPhone')}
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </Animated.View>

        {/* AI Quick Summary */}
        {aiBadges.length > 0 && (
          <Animated.View entering={FadeInUp.delay(150).springify().stiffness(300).damping(28)} style={styles.aiCard}>
            <View style={[styles.aiHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.aiIconWrap}>
                <Ionicons name="sparkles" size={18} color={colors.light.primary} />
              </View>
              <Text style={[styles.aiTitle, { fontFamily: fontFamBold }]}>
                {language === 'ar' ? 'ملخص الذكاء الاصطناعي' : 'AI Quick Summary'}
              </Text>
            </View>
            <View style={[styles.aiBadgesGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {aiBadges.map((badge, i) => (
                <View key={i} style={[styles.aiBadge, { backgroundColor: badge.bgColor, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Ionicons name={badge.icon as any} size={20} color={badge.color} />
                  <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                    <Text style={[styles.aiBadgeLabel, { color: badge.color, fontFamily: fontFamSemi }]}>{badge.label}</Text>
                    <Text style={[styles.aiBadgePhone, { fontFamily: fontFamBold }]} numberOfLines={1}>
                      {selected[badge.phoneIdx]?.model}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            {/* Purchase Recommendation */}
            <View style={styles.recommendationCard}>
              <View style={[styles.recommendationInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.recommendationIcon, { backgroundColor: getPhoneColor(aiBadges[0].phoneIdx) + '20' }]}>
                  <Ionicons name="trophy" size={24} color={getPhoneColor(aiBadges[0].phoneIdx)} />
                </View>
                <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <Text style={[styles.recommendationTitle, { fontFamily: fontFamBold }]}>
                    {language === 'ar' ? 'الفائز العام' : 'Overall Winner'}
                  </Text>
                  <Text style={[styles.recommendationModel, { fontFamily: fontFamBold }]}>
                    {selected[aiBadges[0].phoneIdx]?.model}
                  </Text>
                  <Text style={[styles.recommendationPros, { fontFamily: fontFamReg }]}>
                    {language === 'ar' ? 'أفضل توازن بين الأداء والكاميرا والسعر.' : 'Best balance of performance, camera, and price.'}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Spec Table */}
        {selected.length >= 2 && (
          <Animated.View entering={FadeInUp.delay(200).springify().stiffness(300).damping(28)} style={styles.tableCard}>
            <View style={styles.tableInner}>
              {/* Column headers */}
              <View style={[styles.tableHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.specLabelCol} />
                {selected.map((phone, idx) => (
                  <View key={phone.id} style={[styles.phoneCol, { width: PHONE_COL }]}>
                    <View style={[styles.phoneColHeader]}>
                      <Text style={[styles.phoneColBrand, { color: getPhoneColor(idx), fontFamily: fontFamSemi }]}>{phone.brand}</Text>
                      <Text style={[styles.phoneColModel, { fontFamily: fontFamBold }]} numberOfLines={2}>
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
                    <Text style={[styles.groupLabel, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
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
                            style={[styles.specLabel, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamSemi }]}
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
                                isBest && styles.bestCellOuter,
                              ]}
                            >
                              {isBest ? (
                                <PulseGlow>
                                  <View style={styles.bestCellPill}>
                                    <View style={styles.bestBadge}>
                                      <Text style={[styles.bestBadgeText, { fontFamily: fontFamBold }]}>
                                        {language === 'ar' ? 'الأفضل' : 'Best'}
                                      </Text>
                                    </View>
                                    <Text
                                      style={[styles.specValue, { textAlign: 'center', fontFamily: fontFamBold, color: colors.light.primary }]}
                                      numberOfLines={3}
                                    >
                                      {spec.getValue(phone)}
                                    </Text>
                                  </View>
                                </PulseGlow>
                              ) : (
                                <Text
                                  style={[styles.specValue, { textAlign: 'center', fontFamily: fontFamReg }]}
                                  numberOfLines={3}
                                >
                                  {spec.getValue(phone)}
                                </Text>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Store Price Comparison */}
        {selected.length >= 1 && (
          <Animated.View entering={FadeInUp.delay(250).springify().stiffness(300).damping(28)} style={styles.storesPriceCard}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name="storefront" size={20} color={colors.light.primary} />
              </View>
              <Text style={[styles.sectionTitle, { fontFamily: fontFamBold }]}>
                {language === 'ar' ? 'الأسعار في المتاجر' : 'Prices at Stores'}
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamReg }]}>
              {selected[0].model}
            </Text>
            {stores.slice(0, 3).map((store, idx) => {
              const priceVariant = selected[0].priceEGP * (1 + (idx * 0.05 - 0.02));
              const storeNameLabel = language === 'ar' ? store.nameAr : store.nameEn;
              const isLowest = idx === 0;
              return (
                <View key={store.id} style={[styles.storePriceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.storePriceLogo, { backgroundColor: store.logoColor }]}>
                    <Text style={[styles.storePriceLogoText, { fontFamily: latinBold }]}>{store.logoInitial}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: isRTL ? 0 : 12, marginRight: isRTL ? 12 : 0 }}>
                    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }]}>
                      <Text style={[styles.storePriceName, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamSemi }]} numberOfLines={1}>
                        {storeNameLabel}
                      </Text>
                      {store.isVerified && (
                        <View style={styles.verifiedStoreBadge}>
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        </View>
                      )}
                    </View>
                    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, marginTop: 4 }]}>
                      <Ionicons name="star" size={12} color={colors.light.star} />
                      <Text style={[styles.storePriceMeta, { fontFamily: fontFamReg }]}>
                        {store.rating.toFixed(1)}
                      </Text>
                      <Text style={[styles.storePriceMeta, { fontFamily: fontFamReg }]}>·</Text>
                      <Text style={[styles.storePriceMeta, { fontFamily: fontFamReg }]} numberOfLines={1}>
                        {language === 'ar' ? store.governorate : store.city}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
                    <Text style={[styles.storePriceAmount, { fontFamily: latinBold }, isLowest && { color: colors.light.success }]}>
                      {Math.round(priceVariant).toLocaleString()}
                    </Text>
                    <Text style={[styles.storePriceEgp, { fontFamily: fontFamSemi }]}>{t('egp')}</Text>
                  </View>
                </View>
              );
            })}
            {/* Action buttons */}
            <View style={[styles.priceActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Pressable style={styles.reserveBtn}>
                <Text style={[styles.reserveBtnText, { fontFamily: fontFamSemi }]}>
                  {language === 'ar' ? 'حجز أفضل عرض' : 'Reserve Best Deal'}
                </Text>
              </Pressable>
              <Pressable style={styles.saveBtn}>
                <Ionicons name="call" size={18} color={colors.light.btnPrimaryBg} />
              </Pressable>
              <Pressable style={styles.saveBtn}>
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Related Phones */}
        {selected.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300).springify().stiffness(300).damping(28)} style={styles.relatedSection}>
            <View style={styles.groupHeader}>
              <Text style={[styles.groupLabel, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
                {language === 'ar' ? 'هواتف ذات صلة' : 'Related Phones'}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.horizontalList,
                { paddingLeft: isRTL ? 0 : 16, paddingRight: isRTL ? 16 : 0, paddingTop: 16 },
              ]}
            >
              {products.slice(0, 4).map((product) => (
                <View key={product.id} style={styles.productWrap}>
                  <ProductCard
                    product={product}
                    onPress={() => {}}
                    width={160}
                  />
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

      </ScrollView>

      {/* Phone Picker Modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.modalTitle, { fontFamily: fontFamBold }]}>{t('selectPhone')}</Text>
            <Pressable onPress={() => setShowPicker(false)} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={colors.light.foreground} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalList}>
            {phoneSpecs.map((phone, idx) => {
              const alreadySelected = selected.some((p) => p.id === phone.id);
              return (
                <Pressable
                  key={phone.id}
                  onPress={() => !alreadySelected && selectPhone(phone)}
                  style={[styles.modalItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }, alreadySelected && styles.modalItemDisabled]}
                >
                  <View style={[styles.modalPhoneIcon, { backgroundColor: getPhoneColor(idx) + '20' }]}>
                    <Ionicons name="phone-portrait" size={24} color={getPhoneColor(idx)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalPhoneName, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamBold }]}>
                      {phone.brand} {phone.model}
                    </Text>
                    <Text style={[styles.modalPhonePrice, { textAlign: isRTL ? 'right' : 'left', fontFamily: fontFamReg }]}>
                      {phone.priceEGP.toLocaleString()} {t('egp')}
                    </Text>
                  </View>
                  {alreadySelected ? (
                    <Ionicons name="checkmark-circle" size={24} color={colors.light.primary} />
                  ) : (
                    <Ionicons
                      name={isRTL ? 'chevron-back' : 'chevron-forward'}
                      size={20}
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
  container: { flex: 1, backgroundColor: colors.light.background },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
    position: 'relative',
  },
  headerActions: {
    position: 'absolute',
    top: 50,
    right: 16,
    gap: 12,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 32,
    color: colors.light.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
  scroll: { flex: 1 },

  // Phone selector
  selectorContainer: {
    paddingVertical: 16,
  },
  slotsRow: { gap: 16, paddingHorizontal: 16 },
  phoneSlotCard: {
    width: 140,
    backgroundColor: colors.light.card,
    borderRadius: colors.radiusLg,
    padding: 12,
    alignItems: 'center',
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  phoneImage: {
    width: 72,
    height: 100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  phoneBrand: {
    fontSize: 11,
    color: colors.light.mutedForeground,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneModel: {
    fontSize: 14,
    color: colors.light.foreground,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  slotActions: { gap: 8, width: '100%' },
  slotRemove: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  slotRemoveText: { fontSize: 12, color: colors.light.destructive },
  slotChange: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
  },
  slotChangeText: { fontSize: 12, color: colors.light.primary },
  addSlotCard: {
    width: 140,
    backgroundColor: colors.light.cardSoft,
    borderRadius: colors.radiusLg,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.light.border,
    borderStyle: 'dashed',
    gap: 16,
  },
  addSlotIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSlotText: {
    fontSize: 14,
    color: colors.light.primary,
    textAlign: 'center',
  },

  // AI Summary
  aiCard: {
    backgroundColor: colors.light.card,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: colors.radiusXl,
    padding: 20,
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  aiHeader: { alignItems: 'center', gap: 12, marginBottom: 16 },
  aiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    fontSize: 18,
    color: colors.light.foreground,
    flex: 1,
  },
  aiBadgesGrid: {
    flexWrap: 'wrap',
    gap: 12,
  },
  aiBadge: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    width: '48%',
  },
  aiBadgeLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  aiBadgePhone: {
    fontSize: 13,
    color: colors.light.foreground,
  },
  recommendationCard: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
  },
  recommendationInner: {
    alignItems: 'center',
    gap: 16,
  },
  recommendationIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationTitle: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationModel: {
    fontSize: 18,
    color: colors.light.foreground,
    marginTop: 4,
    marginBottom: 6,
  },
  recommendationPros: {
    fontSize: 13,
    color: colors.light.secondaryForeground,
    lineHeight: 20,
  },

  // Spec table
  tableCard: {
    backgroundColor: colors.light.card,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: colors.radiusXl,
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
    overflow: 'hidden',
  },
  tableInner: {
    borderRadius: colors.radiusXl,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    backgroundColor: colors.light.cardSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  specLabelCol: {
    width: 100,
    padding: 16,
    justifyContent: 'center',
  },
  phoneCol: { 
    borderLeftWidth: 1, 
    borderLeftColor: colors.light.border,
  },
  phoneColHeader: { 
    padding: 16, 
    alignItems: 'center', 
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  phoneColBrand: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  phoneColModel: { fontSize: 14, textAlign: 'center', lineHeight: 20, color: colors.light.foreground },
  groupHeader: {
    backgroundColor: colors.light.cardSoft,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  groupLabel: {
    fontSize: 13,
    color: colors.light.foreground,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  specRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    minHeight: 56,
  },
  specLabel: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    lineHeight: 18,
  },
  specValueCell: {
    borderLeftWidth: 1,
    borderLeftColor: colors.light.border,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestCellOuter: {
    padding: 8,
  },
  bestCellPill: { 
    backgroundColor: colors.light.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,138,61,0.2)',
  },
  pulseContainer: {
    width: '100%',
    alignItems: 'center',
  },
  pulseGlow: {
    backgroundColor: colors.light.primaryMid,
    borderRadius: 12,
    transform: [{ scale: 1.05 }],
  },
  bestBadge: {
    backgroundColor: colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  bestBadgeText: { fontSize: 10, color: '#fff' },
  specValue: {
    fontSize: 13,
    color: colors.light.foreground,
    lineHeight: 20,
  },

  // Store prices
  storesPriceCard: {
    backgroundColor: colors.light.card,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: colors.radiusXl,
    padding: 20,
    shadowColor: colors.light.shadowMid,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 4,
  },
  sectionHeader: { alignItems: 'center', gap: 12, marginBottom: 8 },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    color: colors.light.foreground,
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.light.mutedForeground,
    marginBottom: 20,
  },
  storePriceRow: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  storePriceLogo: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storePriceLogoText: { fontSize: 20, color: '#fff' },
  storePriceName: {
    fontSize: 15,
    color: colors.light.foreground,
  },
  verifiedStoreBadge: {
    backgroundColor: colors.light.verifiedBlue,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storePriceMeta: {
    fontSize: 13,
    color: colors.light.mutedForeground,
  },
  storePriceAmount: {
    fontSize: 18,
    color: colors.light.foreground,
  },
  storePriceEgp: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    marginTop: 2,
  },
  priceActions: {
    marginTop: 20,
    gap: 12,
  },
  reserveBtn: {
    flex: 1,
    backgroundColor: colors.light.btnPrimaryBg,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reserveBtnText: {
    fontSize: 15,
    color: colors.light.btnPrimaryText,
  },
  saveBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.light.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.light.border,
  },

  // Related
  relatedSection: {
    marginTop: 24,
  },
  horizontalList: {
    gap: 16,
  },
  productWrap: {},

  // Modal
  modal: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.light.card,
  },
  modalTitle: {
    fontSize: 20,
    color: colors.light.foreground,
  },
  modalClose: {
    padding: 4,
  },
  modalList: {
    padding: 16,
    gap: 12,
  },
  modalItem: {
    backgroundColor: colors.light.card,
    borderRadius: colors.radiusLg,
    padding: 16,
    alignItems: 'center',
    gap: 16,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  modalItemDisabled: {
    opacity: 0.5,
  },
  modalPhoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPhoneName: {
    fontSize: 16,
    color: colors.light.foreground,
    marginBottom: 4,
  },
  modalPhonePrice: {
    fontSize: 14,
    color: colors.light.mutedForeground,
  },
});
