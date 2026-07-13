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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { phoneSpecs, PhoneSpec } from '@/data/mockData';

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
  const [selected, setSelected] = useState<PhoneSpec[]>([phoneSpecs[0], phoneSpecs[1]]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickingSlot, setPickingSlot] = useState(0);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const MAX_PHONES = 3;

  const specGroups: SpecGroup[] = [
    {
      groupKey: 'category_specs',
      specs: [
        { key: 'spec_brand', label: t('spec_brand'), getValue: (p) => p.brand },
        { key: 'spec_os', label: t('spec_os'), getValue: (p) => p.os },
        { key: 'spec_processor', label: t('spec_processor'), getValue: (p) => p.processor },
        {
          key: 'spec_ram',
          label: t('spec_ram'),
          getValue: (p) => p.ram.join(' / '),
          compareValue: (p) => p._ramGb,
          higherIsBetter: true,
        },
        { key: 'spec_storage', label: t('spec_storage'), getValue: (p) => p.storage.join(' / ') },
      ],
    },
    {
      groupKey: 'category_display',
      specs: [
        {
          key: 'spec_displaySize',
          label: t('spec_displaySize'),
          getValue: (p) => p.displaySize,
          compareValue: (p) => p._displayInch,
          higherIsBetter: true,
        },
        { key: 'spec_displayType', label: t('spec_displayType'), getValue: (p) => p.displayType },
        { key: 'spec_resolution', label: t('spec_resolution'), getValue: (p) => p.resolution },
        {
          key: 'spec_refreshRate',
          label: t('spec_refreshRate'),
          getValue: (p) => p.refreshRate,
          compareValue: (p) => p._refreshRateHz,
          higherIsBetter: true,
        },
      ],
    },
    {
      groupKey: 'category_camera',
      specs: [
        {
          key: 'spec_rearCamera',
          label: t('spec_rearCamera'),
          getValue: (p) => p.rearCamera,
          compareValue: (p) => p._rearMp,
          higherIsBetter: true,
        },
        { key: 'spec_frontCamera', label: t('spec_frontCamera'), getValue: (p) => p.frontCamera },
        { key: 'spec_video', label: language === 'ar' ? 'الفيديو' : 'Video', getValue: (p) => p.videoRecording },
      ],
    },
    {
      groupKey: 'category_battery',
      specs: [
        {
          key: 'spec_battery',
          label: t('spec_battery'),
          getValue: (p) => p.battery,
          compareValue: (p) => p._batteryMah,
          higherIsBetter: true,
        },
        {
          key: 'spec_charging',
          label: t('spec_charging'),
          getValue: (p) => p.charging,
          compareValue: (p) => p._chargingW,
          higherIsBetter: true,
        },
        {
          key: 'spec_wirelessCharging',
          label: t('spec_wirelessCharging'),
          getValue: (p) => p.wirelessCharging ? '✓' : '✗',
          compareValue: (p) => p.wirelessCharging ? 1 : 0,
          higherIsBetter: true,
        },
      ],
    },
    {
      groupKey: 'category_connectivity',
      specs: [
        {
          key: 'spec_fiveG',
          label: t('spec_fiveG'),
          getValue: (p) => p.fiveG ? '✓' : '✗',
          compareValue: (p) => p.fiveG ? 1 : 0,
          higherIsBetter: true,
        },
        {
          key: 'spec_nfc',
          label: t('spec_nfc'),
          getValue: (p) => p.nfc ? '✓' : '✗',
          compareValue: (p) => p.nfc ? 1 : 0,
          higherIsBetter: true,
        },
        { key: 'spec_usb', label: t('spec_usb'), getValue: (p) => p.usb },
        { key: 'spec_wifi', label: 'Wi-Fi', getValue: (p) => p.wifi },
      ],
    },
    {
      groupKey: 'category_design',
      specs: [
        { key: 'spec_weight', label: t('spec_weight'), getValue: (p) => p.weight },
        { key: 'spec_waterResistance', label: t('spec_waterResistance'), getValue: (p) => p.waterResistance },
        { key: 'spec_colors', label: t('colors'), getValue: (p) => p.colors.join(', ') },
      ],
    },
    {
      groupKey: 'category_price',
      specs: [
        {
          key: 'spec_price',
          label: t('spec_price'),
          getValue: (p) => `${p.priceEGP.toLocaleString()} ${t('egp')}`,
          compareValue: (p) => p.priceEGP,
          higherIsBetter: false,
        },
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
    if (pickingSlot < next.length) {
      next[pickingSlot] = phone;
    } else {
      next.push(phone);
    }
    setSelected(next);
    setShowPicker(false);
  }

  function removePhone(idx: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = selected.filter((_, i) => i !== idx);
    setSelected(next);
  }

  function getBestIdx(spec: SpecGroup['specs'][0]): number | null {
    if (!spec.compareValue) return null;
    const vals = selected.map(spec.compareValue);
    const best = spec.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const allSame = vals.every((v) => v === vals[0]);
    if (allSame) return null;
    return vals.indexOf(best);
  }

  const PHONE_COL = 110;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: topInset + 8 }]}
      >
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('compareTitle')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('compareSubtitle')}
        </Text>

        {/* Phone slots */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.slotsRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          {selected.map((phone, idx) => (
            <View key={phone.id + idx} style={[styles.slot, { width: PHONE_COL }]}>
              <Pressable onPress={() => openPicker(idx)} style={styles.slotCard}>
                <Text style={styles.slotBrand}>{phone.brand}</Text>
                <Text style={styles.slotModel} numberOfLines={2}>{phone.model}</Text>
                <Text style={styles.slotPrice}>{phone.priceEGP.toLocaleString()}</Text>
                <Text style={styles.slotCurrency}>{t('egp')}</Text>
              </Pressable>
              <Pressable onPress={() => removePhone(idx)} style={styles.removeBtn}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>
          ))}

          {selected.length < MAX_PHONES && (
            <Pressable
              onPress={() => openPicker(selected.length)}
              style={[styles.addSlot, { width: PHONE_COL }]}
            >
              <Ionicons name="add-circle-outline" size={28} color="rgba(255,255,255,0.7)" />
              <Text style={styles.addSlotText}>{t('addPhone')}</Text>
            </Pressable>
          )}
        </ScrollView>
      </LinearGradient>

      {/* Spec table */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {specGroups.map((group) => (
          <View key={group.groupKey} style={styles.specGroup}>
            <LinearGradient
              colors={['#EFF6FF', '#DBEAFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.groupHeader}
            >
              <Text style={[styles.groupTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t(group.groupKey as any)}
              </Text>
            </LinearGradient>

            {group.specs.map((spec, sIdx) => {
              const bestIdx = getBestIdx(spec);
              return (
                <View
                  key={spec.key}
                  style={[
                    styles.specRow,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    sIdx % 2 === 0 && styles.specRowAlt,
                  ]}
                >
                  <Text
                    style={[
                      styles.specLabel,
                      { textAlign: isRTL ? 'right' : 'left' },
                    ]}
                    numberOfLines={2}
                  >
                    {spec.label}
                  </Text>
                  {selected.map((phone, pIdx) => {
                    const isBest = bestIdx === pIdx;
                    return (
                      <View
                        key={phone.id + pIdx}
                        style={[
                          styles.specCell,
                          { width: PHONE_COL },
                          isBest && styles.specCellBest,
                        ]}
                      >
                        <Text
                          style={[
                            styles.specValue,
                            { textAlign: 'center' },
                            isBest && styles.specValueBest,
                          ]}
                          numberOfLines={3}
                        >
                          {spec.getValue(phone)}
                        </Text>
                        {isBest && (
                          <View style={styles.bestBadge}>
                            <Text style={styles.bestBadgeText}>{t('better')}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                  {selected.length < MAX_PHONES && (
                    <View style={[styles.specCell, { width: PHONE_COL }]} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Phone picker modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.modalTitle}>{t('selectPhone')}</Text>
            <Pressable onPress={() => setShowPicker(false)}>
              <Ionicons name="close" size={24} color={colors.light.foreground} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalList}>
            {phoneSpecs.map((phone) => {
              const isAlreadySelected = selected.some(
                (s, i) => s.id === phone.id && i !== pickingSlot,
              );
              return (
                <Pressable
                  key={phone.id}
                  onPress={() => !isAlreadySelected && selectPhone(phone)}
                  style={[
                    styles.phoneOption,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    isAlreadySelected && styles.phoneOptionDisabled,
                  ]}
                >
                  <View style={styles.phoneLogo}>
                    <Text style={styles.phoneLogoText}>{phone.brand[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.phoneName, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {phone.brand} {phone.model}
                    </Text>
                    <Text style={[styles.phoneRelease, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {phone.releaseDate} · {phone.priceEGP.toLocaleString()} {t('egp')}
                    </Text>
                  </View>
                  {isAlreadySelected ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.light.primary} />
                  ) : (
                    <Ionicons name="add-circle-outline" size={20} color={colors.light.mutedForeground} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.backgroundSecondary },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 16,
  },
  slotsRow: {
    gap: 10,
    paddingBottom: 4,
  },
  slot: {
    position: 'relative',
  },
  slotCard: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: colors.radiusMd,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    padding: 10,
    alignItems: 'center',
    gap: 3,
  },
  slotBrand: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slotModel: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 16,
  },
  slotPrice: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#93C5FD',
    marginTop: 4,
  },
  slotCurrency: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Inter_400Regular',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  addSlot: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: colors.radiusMd,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  addSlotText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8 },
  specGroup: { marginBottom: 4 },
  groupHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  groupTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: colors.light.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  specRow: {
    backgroundColor: colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    minHeight: 52,
  },
  specRowAlt: { backgroundColor: '#FAFAFA' },
  specLabel: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.light.foreground,
  },
  specCell: {
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.light.border,
    gap: 4,
  },
  specCellBest: {
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
  },
  specValue: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: colors.light.foreground,
    lineHeight: 16,
  },
  specValueBest: {
    color: colors.light.primary,
    fontFamily: 'Inter_700Bold',
  },
  bestBadge: {
    backgroundColor: colors.light.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: colors.light.primary,
  },
  // Modal
  modal: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  modalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  modalList: { paddingVertical: 8 },
  phoneOption: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  phoneOptionDisabled: { opacity: 0.4 },
  phoneLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.light.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneLogoText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: colors.light.primary,
  },
  phoneName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: colors.light.foreground,
  },
  phoneRelease: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: colors.light.mutedForeground,
    marginTop: 2,
  },
});
