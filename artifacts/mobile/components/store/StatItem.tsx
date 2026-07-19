import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "@/constants/colors";

export default function StatItem({
  value,
  label,
  icon,
  fontFamBold,
  fontFamReg,
}: {
  value: string;
  label: string;
  icon?: string;
  fontFamBold: string;
  fontFamReg: string;
}) {
  return (
    <View style={styles.statItem}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {icon && (
          <Ionicons name={icon as any} size={14} color={colors.light.star} />
        )}
        <Text style={[styles.statValue, { fontFamily: fontFamBold }]}>
          {value}
        </Text>
      </View>
      <Text style={[styles.statLabel, { fontFamily: fontFamReg }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statItem: {
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 12,
    minWidth: 70,
  },
  statValue: { fontSize: 16, color: "#fff" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.85)" },
});
