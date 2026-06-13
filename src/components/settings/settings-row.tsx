import { IconChevronRight } from "@tabler/icons-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type SettingsRowProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
};

export function SettingsRow({
  icon,
  title,
  subtitle,
  value,
  onPress,
  right,
  destructive,
  disabled,
  showChevron = true,
}: SettingsRowProps) {
  const theme = useTheme();

  const t = theme as any;
  const surface = t.surface ?? "#F7F6F2";
  const borderLight = t.borderLight ?? theme.border;
  const textSecondary = t.textSecondary ?? "#756F66";
  const textTertiary = t.textTertiary ?? textSecondary;

  const canPress = Boolean(onPress) && !disabled;

  return (
    <Pressable
      disabled={!canPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: borderLight,
          opacity: disabled ? 0.45 : pressed ? 0.58 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: surface }]}>
        {icon}
      </View>

      <View style={styles.copy}>
        <ThemedText
          style={[styles.title, destructive ? { color: "#D9422F" } : null]}
        >
          {title}
        </ThemedText>

        {subtitle ? (
          <ThemedText
            type="subhead"
            themeColor="textSecondary"
            style={styles.subtitle}
          >
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      {value ? (
        <ThemedText
          type="subhead"
          style={[styles.value, { color: textSecondary }]}
          numberOfLines={1}
        >
          {value}
        </ThemedText>
      ) : null}

      {right ? right : null}

      {showChevron && canPress ? (
        <IconChevronRight size={20} color={textTertiary} strokeWidth={2.3} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 66,
    paddingHorizontal: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  value: {
    maxWidth: 110,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },
});
