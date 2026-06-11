import { IconCheck } from "@tabler/icons-react-native";
import { ComponentType, ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Shadows, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type OnboardingOptionCardProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  Icon?: ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  selected?: boolean;
  onPress: () => void;
  compact?: boolean;
};

export function OnboardingOptionCard({
  title,
  subtitle,
  icon,
  Icon,
  selected = false,
  onPress,
  compact = false,
}: OnboardingOptionCardProps) {
  const theme = useTheme();
  const iconColor = selected ? theme.primary : theme.textSecondary;
  const iconBackground = selected ? theme.primarySoft : theme.cardMuted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.86 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
      ]}
    >
      <ThemedView
        style={[
          styles.card,
          compact && styles.compact,
          {
            backgroundColor: theme.paper,
            borderColor: selected ? theme.borderStrong : theme.border,
          },
        ]}
      >
        {Icon || icon ? (
          <ThemedView
            style={[
              styles.iconWrap,
              {
                backgroundColor: iconBackground,
              },
            ]}
          >
            {Icon ? (
              <Icon size={21} color={iconColor} strokeWidth={2.35} />
            ) : (
              icon
            )}
          </ThemedView>
        ) : null}

        <ThemedView transparent style={styles.textWrap}>
          <ThemedText style={styles.title} numberOfLines={2}>
            {title}
          </ThemedText>

          {subtitle ? (
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.subtitle}
              numberOfLines={1}
            >
              {subtitle}
            </ThemedText>
          ) : null}
        </ThemedView>

        <ThemedView
          style={[
            styles.checkSlot,
            {
              backgroundColor: selected ? theme.primary : "transparent",
              borderColor: selected ? theme.primary : theme.borderStrong,
            },
          ]}
        >
          {selected ? (
            <IconCheck size={14} color="#FFFFFF" strokeWidth={3.4} />
          ) : null}
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 70,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderWidth: 1,
    shadowColor: Shadows.soft.shadowColor,
    shadowOpacity: 0.045,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 1,
  },
  compact: {
    minHeight: 64,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "500",
  },
  checkSlot: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
