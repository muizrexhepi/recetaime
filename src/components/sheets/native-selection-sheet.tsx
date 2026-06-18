import {
  BottomSheetModal,
  BottomSheetScrollView,
} from "@expo/ui/community/bottom-sheet";
import * as Haptics from "expo-haptics";
import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type NativeSelectionSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export type NativeSelectionOption = {
  key: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  colorDot?: string;
  selected?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export type NativeSelectionGroup = {
  title?: string;
  options: NativeSelectionOption[];
};

type NativeSelectionSheetProps = {
  groups: NativeSelectionGroup[];
  footerAction?: NativeSelectionOption;
  snapPoints?: Array<string | number>;
};

export const NativeSelectionSheet = forwardRef<
  NativeSelectionSheetRef,
  NativeSelectionSheetProps
>(function NativeSelectionSheet({ groups, footerAction, snapPoints }, ref) {
  const theme = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);

  const t = theme as any;

  const surface = t.surface ?? "#F7F6F2";
  const borderLight = t.borderLight ?? theme.border;
  const textSecondary = t.textSecondary ?? "#756F66";
  const primarySoft = t.primarySoft ?? "#FFF0ED";

  const groupBackground =
    Platform.OS === "ios" ? "rgba(247,246,242,0.72)" : surface;

  useImperativeHandle(ref, () => ({
    present: () => {
      sheetRef.current?.present();
    },
    dismiss: () => {
      sheetRef.current?.dismiss();
    },
  }));

  const handlePress = (option: NativeSelectionOption) => {
    if (option.disabled) return;

    void Haptics.selectionAsync();
    sheetRef.current?.dismiss();
    option.onPress();
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sheetContent}
      >
        {groups.map((group, groupIndex) => {
          const options = group.options.filter(Boolean);

          if (options.length === 0) return null;

          return (
            <View key={`group-${groupIndex}`} style={styles.groupWrap}>
              {group.title ? (
                <ThemedText
                  style={[styles.groupTitle, { color: textSecondary }]}
                >
                  {group.title}
                </ThemedText>
              ) : null}

              <View
                style={[styles.group, { backgroundColor: groupBackground }]}
              >
                {options.map((option, index) => (
                  <SheetOptionRow
                    key={option.key}
                    option={option}
                    selected={Boolean(option.selected)}
                    borderColor={
                      index === options.length - 1 ? "transparent" : borderLight
                    }
                    primarySoft={primarySoft}
                    onPress={() => handlePress(option)}
                  />
                ))}
              </View>
            </View>
          );
        })}

        {footerAction ? (
          <Pressable
            onPress={() => handlePress(footerAction)}
            disabled={footerAction.disabled}
            style={({ pressed }) => [
              styles.footerAction,
              {
                borderColor: borderLight,
                backgroundColor:
                  Platform.OS === "ios"
                    ? "rgba(255,255,255,0.42)"
                    : "transparent",
                opacity: pressed ? 0.72 : footerAction.disabled ? 0.45 : 1,
              },
            ]}
          >
            {footerAction.icon}

            <ThemedText
              style={[
                styles.footerActionText,
                {
                  color: footerAction.destructive ? "#D9422F" : theme.primary,
                },
              ]}
            >
              {footerAction.title}
            </ThemedText>
          </Pressable>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

function SheetOptionRow({
  option,
  selected,
  borderColor,
  primarySoft,
  onPress,
}: {
  option: NativeSelectionOption;
  selected: boolean;
  borderColor: string;
  primarySoft: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={option.disabled}
      style={({ pressed }) => [
        styles.optionRow,
        {
          borderBottomColor: borderColor,
          opacity: pressed ? 0.7 : option.disabled ? 0.45 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.optionIcon,
          {
            backgroundColor: selected ? primarySoft : "rgba(39,31,23,0.045)",
          },
        ]}
      >
        {option.icon ? (
          option.icon
        ) : option.colorDot ? (
          <View
            style={[styles.colorDot, { backgroundColor: option.colorDot }]}
          />
        ) : null}
      </View>

      <View style={styles.optionCopy}>
        <ThemedText
          style={[
            styles.optionTitle,
            option.destructive ? { color: "#D9422F" } : null,
          ]}
          numberOfLines={1}
        >
          {option.title}
        </ThemedText>

        {option.subtitle ? (
          <ThemedText
            type="subhead"
            themeColor="textSecondary"
            numberOfLines={1}
          >
            {option.subtitle}
          </ThemedText>
        ) : null}
      </View>

      {selected ? (
        <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.checkText}>✓</ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  groupWrap: {
    marginBottom: Spacing.lg,
  },
  groupTitle: {
    marginBottom: Spacing.sm,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  group: {
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  optionRow: {
    minHeight: 66,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  optionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  optionTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
  },
  footerAction: {
    minHeight: 56,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  footerActionText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
});
