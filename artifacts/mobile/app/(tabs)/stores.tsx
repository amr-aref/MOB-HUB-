import React, { useMemo, useState } from 'react';
import {
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
import colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { stores } from '@/data/mockData';
import SearchBar from '@/components/SearchBar';
import StoreCard from '@/components/StoreCard';

const CITIES_AR = ['الكل', 'القاهرة', 'الإسكندرية', 'الجيزة'];
const CITIES_EN = ['All', 'Cairo', 'Alexandria', 'Giza'];

export default function StoresScreen() {
  const { t, isRTL, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(0);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  const cities = language === 'ar' ? CITIES_AR : CITIES_EN;
  const citiesFilter = ['', 'القاهرة', 'الإسكندرية', 'الجيزة'];

  const filtered = useMemo(() => {
    return stores.filter((store) => {
      const name = language === 'ar' ? store.nameAr : store.nameEn;
      const matchSearch = name.toLowerCase().includes(search.toLowerCase()) ||
        store.governorate.includes(search) ||
        store.nameEn.toLowerCase().includes(search.toLowerCase());
      const matchCity = selectedCity === 0 || store.governorate === citiesFilter[selectedCity];
      return matchSearch && matchCity;
    });
  }, [search, selectedCity, language]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('stores')}
        </Text>
        <View style={styles.searchWrap}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={t('searchPlaceholder')}
            isRTL={isRTL}
          />
        </View>

        {/* City filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.filterRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          {cities.map((city, idx) => (
            <Pressable
              key={idx}
              onPress={() => setSelectedCity(idx)}
              style={[
                styles.filterChip,
                selectedCity === idx && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCity === idx && styles.filterTextActive,
                ]}
              >
                {city}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Stats bar */}
      <View style={[styles.statsBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={styles.statsText}>
          {filtered.length} {language === 'ar' ? 'متجر' : 'stores'}
        </Text>
        <Ionicons name="options-outline" size={18} color={colors.light.mutedForeground} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomInset + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={48} color={colors.light.border} />
            <Text style={styles.emptyText}>{t('noResults')}</Text>
          </View>
        ) : (
          filtered.map((store) => (
            <View key={store.id} style={styles.cardWrap}>
              <StoreCard
                store={store}
                variant="full"
                onPress={() => router.push(`/store/${store.id}`)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.backgroundSecondary },
  header: {
    backgroundColor: colors.light.background,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    shadowColor: colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    color: colors.light.foreground,
  },
  searchWrap: {},
  filterRow: {
    gap: 8,
    paddingBottom: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: colors.radiusFull,
    backgroundColor: colors.light.muted,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: colors.light.primaryLight,
    borderColor: colors.light.primary,
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.light.mutedForeground,
  },
  filterTextActive: {
    color: colors.light.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  statsBar: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statsText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.light.mutedForeground,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  cardWrap: { width: '100%' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: colors.light.mutedForeground,
  },
});
