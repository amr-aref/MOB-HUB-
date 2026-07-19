import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ContactBtn({
  icon,
  label,
  onPress,
  color,
  fontFam,
  primary,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
  fontFam: string;
  primary?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.contactBtn}>
      <View
        style={[
          styles.contactBtnIcon,
          primary
            ? { backgroundColor: "#FF8A3D", borderColor: "#FF8A3D" }
            : { backgroundColor: color + "15", borderColor: color + "25" },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={24}
          color={primary ? "#fff" : color}
        />
      </View>
      <Text
        style={[styles.contactBtnLabel, { fontFamily: fontFam }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contactBtn: { alignItems: "center", gap: 8, flex: 1 },
  contactBtnIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  contactBtnLabel: {
    fontSize: 12,
    color: "#8A8A8E",
    textAlign: "center",
  },
});
