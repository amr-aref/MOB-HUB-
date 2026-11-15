import React, { useState, useRef, useEffect } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInUp,
} from "react-native-reanimated";
import colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import {
  useGetStore,
  useGetStoreProducts,
  useGetStoreReviews,
  useGetCategories,
  useDeleteReview,
  useCreateConversation,
  getGetStoreReviewsQueryKey,
  getGetStoreQueryKey,
  type ReviewDto,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useAuth } from "@/contexts/AuthContext";
import ReviewFormModal from "@/components/ReviewFormModal";
import RatingStars from "@/components/RatingStars";
import ProductCard from "@/components/ProductCard";
import { getFontFamily } from "@/constants/fonts";
import GlassCard from "@/components/GlassCard";
import { useLayout } from "@/hooks/useLayout";

const GALLERY_COLORS = [
  ["#1E3A8A", "#3B82F6"],
  ["#7C3AED", "#A78BFA"],
  ["#065F46", "#34D399"],
  ["#92400E", "#F59E0B"],
];

function GalleryViewerModal({
  items,
  initialIndex,
  visible,
  onClose,
  language,
}: {
  items: [string, string][];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
  language: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRef = useRef<any>(null);
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      const timer = setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [visible, initialIndex]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={galleryViewerStyles.backdrop}>
        <Pressable
          style={galleryViewerStyles.closeBtn}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={
            language === "ar" ? "إغلاق المعرض" : "Close gallery"
          }
        >
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>

        <View style={galleryViewerStyles.counter}>
          <Text style={galleryViewerStyles.counterText}>
            {currentIndex + 1} / {items.length}
          </Text>
        </View>

        <FlatList
          ref={listRef}
          data={items}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          initialScrollIndex={initialIndex}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            setCurrentIndex(idx);
          }}
          renderItem={({ item }: { item: [string, string] }) => (
            <View style={[galleryViewerStyles.slide, { width: screenWidth }]}>
              <LinearGradient
                colors={item}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={galleryViewerStyles.gradientImage}
              >
                <Ionicons
                  name="image-outline"
                  size={72}
                  color="rgba(255,255,255,0.4)"
                />
              </LinearGradient>
            </View>
          )}
        />

        <View style={galleryViewerStyles.dots}>
          {items.map((_, i) => (
            <View
              key={i}
              style={[
                galleryViewerStyles.dot,
                i === currentIndex && galleryViewerStyles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}

const galleryViewerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    position: "absolute",
    top: 62,
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: "center",
  },
  counterText: {
    color: "#fff",
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
  },
  gradientImage: {
    width: "80%",
    aspectRatio: 1,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: {
    backgroundColor: "#fff",
    width: 20,
    borderRadius: 4,
  },
});

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, isRTL, language } = useLanguage();
  const { toggleFavoriteStore, isStoreFavorite } = useFavorites();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isTablet } = useLayout();

  const { data: store, isLoading: storeLoading } = useGetStore(id!);
  const { data: storeProducts = [] } = useGetStoreProducts(id!);
  const { data: storeReviews = [] } = useGetStoreReviews(id!);
  const { data: allCategories = [] } = useGetCategories();

  const queryClient = useQueryClient();
  const deviceId = useDeviceId();
  const { user, isAuthenticated } = useAuth();
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [reviewFormVisible, setReviewFormVisible] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewDto | null>(null);

  const deleteMutation = useDeleteReview({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetStoreReviewsQueryKey(id!),
        });
        queryClient.invalidateQueries({
          queryKey: getGetStoreQueryKey(id!),
        });
      },
    },
  });

  const { mutate: createConversation } = useCreateConversation({
    mutation: {
      onSuccess: (conv) => router.push(`/messages/${conv.id}` as any),
    },
  });

  function handleDeleteReview(review: ReviewDto) {
    Alert.alert(t("deleteReview"), t("deleteReviewConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () =>
          deleteMutation.mutate({
            id: review.id,
            params: { userId: deviceId ?? "" },
          }),
      },
    ]);
  }

  if (storeLoading || !store) return null;

  const topInset = isTablet ? 24 : Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = isTablet ? 0 : Platform.OS === "web" ? 34 : 0;

  const fontFamBold = getFontFamily(isRTL, "bold");
  const fontFamSemi = getFontFamily(isRTL, "semiBold");
  const fontFamReg = getFontFamily(isRTL, "regular");
  const latinBold = getFontFamily(false, "bold");

  const isFav = isStoreFavorite(store.id);
  const name = language === "ar" ? store.nameAr : store.nameEn;
  const description =
    language === "ar" ? store.descriptionAr : store.descriptionEn;
  const address = language === "ar" ? store.addressAr : store.address;
  const hours = language === "ar" ? store.workingHoursAr : store.workingHours;

  const storeCategories = allCategories.filter((c) =>
    (store.categories ?? []).includes(c.id),
  );
  const followersCount = store.reviewsCount * 3 + 450;

  function handleFavorite() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavoriteStore(store!.id);
  }

  function handleShare() {
    const storeName = language === "ar" ? store!.nameAr : store!.nameEn;
    Share.share({
      title: storeName,
      message: `${storeName}\n${address}\n${store!.phone}`,
    });
  }
  function handleCall() {
    Linking.openURL(`tel:${store!.phone}`);
  }
  function handleWhatsApp() {
    Linking.openURL(`https://wa.me/${store!.whatsapp.replace(/\+/g, "")}`);
  }
  function handleMessageSeller() {
    // buyerId is derived server-side from the authenticated token (user.sub).
    if (!isAuthenticated || !user?.id) return;
    createConversation({ data: { buyerId: user.id, storeId: store!.id } });
  }

  function handleMaps() {
    const url =
      Platform.OS === "ios"
        ? `maps://?q=${store!.nameEn}&ll=${store!.lat},${store!.lng}`
        : `geo:${store!.lat},${store!.lng}?q=${encodeURIComponent(store!.nameEn)}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${store!.lat},${store!.lng}`),
    );
  }
  function handleCopyAddress() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("", t("addressCopied"));
  }
  function handleSocial(type: "facebook" | "instagram" | "website") {
    const urls: Record<string, string | undefined> = {
      facebook: store!.facebook
        ? `https://facebook.com/${store!.facebook}`
        : undefined,
      instagram: store!.instagram
        ? `https://instagram.com/${store!.instagram}`
        : undefined,
      website: store!.website ?? undefined,
    };
    const url = urls[type];
    if (url) Linking.openURL(url);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          { paddingBottom: bottomInset + 80 },
          isTablet && styles.tabletScrollContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInUp.delay(50).springify().stiffness(300).damping(28)}
        >
          <LinearGradient
            colors={store.coverGradient as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.hero,
              { paddingTop: topInset + 8 },
              isTablet && styles.tabletHero,
            ]}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.25)", "rgba(0,0,0,0.5)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              style={[
                styles.heroTopBar,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons
                  name={isRTL ? "chevron-forward" : "chevron-back"}
                  size={24}
                  color="#fff"
                />
              </Pressable>
              <View
                style={[
                  styles.heroActions,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <Pressable style={styles.heroActionBtn} onPress={handleFavorite}>
                  <Ionicons
                    name={isFav ? "heart" : "heart-outline"}
                    size={20}
                    color={isFav ? colors.light.destructive : "#fff"}
                  />
                </Pressable>
                <Pressable style={styles.heroActionBtn} onPress={handleShare}>
                  <Ionicons name="share-outline" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>

            <View style={styles.logoWrap}>
              <View style={[styles.logo, { backgroundColor: store.logoColor }]}>
                <Text style={[styles.logoText, { fontFamily: latinBold }]}>
                  {store.logoInitial}
                </Text>
              </View>
              {store.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </View>

            <View
              style={[
                styles.nameRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Text style={[styles.storeName, { fontFamily: fontFamBold }]}>
                {name}
              </Text>
            </View>

            <View
              style={[
                styles.statsRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Text style={[styles.statText, { fontFamily: latinBold }]}>
                ★ {store.rating.toFixed(1)}
              </Text>
              <Text style={[styles.statMuted, { fontFamily: fontFamReg }]}>
                {" · "}{store.reviewsCount}{" · "}{store.productsCount}{" "}{language === "ar" ? "منتج" : "products"}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={[styles.contactBar, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Pressable style={styles.contactBtn} onPress={handleCall}>
            <Ionicons name="call" size={20} color={colors.light.success} />
            <Text style={styles.contactLabel}>{language === "ar" ? "اتصال" : "Call"}</Text>
          </Pressable>
          <Pressable style={styles.contactBtn} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.contactLabel}>WhatsApp</Text>
          </Pressable>
          <Pressable style={styles.contactBtn} onPress={handleMessageSeller}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.light.primary} />
            <Text style={styles.contactLabel}>{language === "ar" ? "رسالة" : "Message"}</Text>
          </Pressable>
          <Pressable style={styles.contactBtn} onPress={handleMaps}>
            <Ionicons name="map-outline" size={20} color={colors.light.primary} />
            <Text style={styles.contactLabel}>{language === "ar" ? "خريطة" : "Map"}</Text>
          </Pressable>
        </View>

        {description ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontFamily: fontFamBold, textAlign: isRTL ? "right" : "left" }]}>
              {language === "ar" ? "عن المتجر" : "About"}
            </Text>
            <Text style={[styles.bodyText, { fontFamily: fontFamReg, textAlign: isRTL ? "right" : "left" }]}>
              {description}
            </Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontFamBold, textAlign: isRTL ? "right" : "left" }]}>
            {language === "ar" ? "المنتجات" : "Products"}
          </Text>
          {storeProducts.length === 0 ? (
            <Text style={[styles.bodyText, { textAlign: isRTL ? "right" : "left" }]}>
              {language === "ar" ? "لا توجد منتجات" : "No products"}
            </Text>
          ) : (
            <View style={styles.productsGrid}>
              {storeProducts.slice(0, 12).map((p) => (
                <View key={p.id} style={styles.productWrap}>
                  <ProductCard product={p as any} />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontFamBold, textAlign: isRTL ? "right" : "left" }]}>
            {language === "ar" ? "التقييمات" : "Reviews"}
          </Text>
          {storeReviews.length === 0 ? (
            <Text style={[styles.bodyText, { textAlign: isRTL ? "right" : "left" }]}>
              {language === "ar" ? "لا توجد تقييمات" : "No reviews yet"}
            </Text>
          ) : (
            storeReviews.slice(0, 10).map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <RatingStars rating={review.rating} size={14} />
                <Text style={[styles.bodyText, { marginTop: 6, textAlign: isRTL ? "right" : "left" }]}>
                  {language === "ar" ? review.commentAr : review.commentEn}
                </Text>
                {deviceId !== null && review.userId === deviceId && (
                  <Pressable onPress={() => handleDeleteReview(review)}>
                    <Text style={{ color: colors.light.destructive, marginTop: 6 }}>
                      {language === "ar" ? "حذف" : "Delete"}
                    </Text>
                  </Pressable>
                )}
              </View>
            ))
          )}
          <Pressable
            style={styles.writeReviewBtn}
            onPress={() => {
              setEditingReview(null);
              setReviewFormVisible(true);
            }}
          >
            <Text style={styles.writeReviewText}>
              {language === "ar" ? "كتابة تقييم" : "Write a review"}
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <ReviewFormModal
        visible={reviewFormVisible}
        onClose={() => setReviewFormVisible(false)}
        storeId={store.id}
        existingReview={editingReview}
        deviceId={deviceId}
      />

      <GalleryViewerModal
        items={GALLERY_COLORS as [string, string][]}
        initialIndex={galleryIndex}
        visible={galleryVisible}
        onClose={() => setGalleryVisible(false)}
        language={language}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  scroll: { flex: 1 },
  tabletScrollContent: { maxWidth: 900, alignSelf: "center", width: "100%" },
  hero: { paddingBottom: 24, paddingHorizontal: 16 },
  tabletHero: { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroTopBar: { justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center",
  },
  heroActions: { gap: 8 },
  heroActionBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.25)", alignItems: "center", justifyContent: "center",
  },
  logoWrap: { alignSelf: "center", marginBottom: 12 },
  logo: {
    width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center",
  },
  logoText: { fontSize: 28, color: "#fff" },
  verifiedBadge: {
    position: "absolute", bottom: -2, right: -2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.light.primary, alignItems: "center", justifyContent: "center",
  },
  nameRow: { justifyContent: "center", marginBottom: 8 },
  storeName: { fontSize: 22, color: "#fff", textAlign: "center" },
  statsRow: { justifyContent: "center", alignItems: "center", gap: 4 },
  statText: { color: "#fff", fontSize: 14 },
  statMuted: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  contactBar: {
    marginHorizontal: 16, marginTop: -16, marginBottom: 8,
    backgroundColor: colors.light.card, borderRadius: 16, padding: 10,
    gap: 8, borderWidth: 1, borderColor: colors.light.border,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  contactBtn: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 8 },
  contactLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.light.foreground },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 17, color: colors.light.foreground, marginBottom: 10 },
  bodyText: { fontSize: 14, color: colors.light.mutedForeground, lineHeight: 22 },
  productsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  productWrap: { width: "47%", flexGrow: 1 },
  reviewCard: {
    backgroundColor: colors.light.card, borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: colors.light.border,
  },
  writeReviewBtn: {
    marginTop: 8, paddingVertical: 12, borderRadius: 12,
    backgroundColor: colors.light.primary, alignItems: "center",
  },
  writeReviewText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
});
