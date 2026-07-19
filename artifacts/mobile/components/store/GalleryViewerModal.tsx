import React, { useState, useEffect, useRef } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const GALLERY_COLORS = [
  ["#1E3A8A", "#3B82F6"],
  ["#7C3AED", "#A78BFA"],
  ["#065F46", "#34D399"],
  ["#92400E", "#F59E0B"],
];

export { GALLERY_COLORS };

export default function GalleryViewerModal({
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
          accessibilityHint={
            language === "ar"
              ? "إغلاق معرض الصور"
              : "Close the image gallery viewer"
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
