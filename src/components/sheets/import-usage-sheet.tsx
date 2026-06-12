import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import {
  IconBoltFilled,
  IconSparkles,
  IconX,
} from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { Radius, Shadows, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ImportUsageSheetRef = {
  present: () => void;
  dismiss: () => void;
};

export type ImportUsageSummary = {
  used: number;
  limit: number;
  remaining: number | null;
  hasUnlimited: boolean;
  resetAt: number;
  daysUntilReset: number;
};

type ImportUsageSheetProps = {
  usage?: ImportUsageSummary;
  onUnlock: () => void;
};

export const ImportUsageSheet = forwardRef<
  ImportUsageSheetRef,
  ImportUsageSheetProps
>(function ImportUsageSheet({ usage, onUnlock }, ref) {
  const theme = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ["60%"], []);

  const t = theme as any;
  const paper = t.paper ?? theme.background;
  const surface = t.surface ?? "#F7F6F2";
  const cardMuted = t.cardMuted ?? surface;
  const primarySoft = t.primarySoft ?? surface;
  const border = t.border ?? "#E8E4DC";
  const borderStrong = t.borderStrong ?? border;
  const textSecondary = t.textSecondary ?? "#756F66";
  const textTertiary = t.textTertiary ?? textSecondary;

  const safeUsage: ImportUsageSummary = usage ?? {
    used: 0,
    limit: 5,
    remaining: 5,
    hasUnlimited: false,
    resetAt: Date.now(),
    daysUntilReset: 7,
  };

  const visualUsed = safeUsage.hasUnlimited
    ? safeUsage.limit
    : Math.min(safeUsage.used, safeUsage.limit);

  useImperativeHandle(ref, () => ({
    present: () => {
      Haptics.selectionAsync();
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const close = useCallback(() => {
    Haptics.selectionAsync();
    sheetRef.current?.dismiss();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.42}
        pressBehavior="close"
      />
    ),
    [],
  );

  const unlock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sheetRef.current?.dismiss();

    setTimeout(() => {
      onUnlock();
    }, 140);
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: borderStrong,
        width: 48,
        height: 5,
      }}
      backgroundStyle={{
        backgroundColor: paper,
        borderTopLeftRadius: Radius.xxl,
        borderTopRightRadius: Radius.xxl,
      }}
    >
      <BottomSheetScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: primarySoft,
                borderColor: border,
              },
            ]}
          >
            <IconSparkles size={25} color={theme.primary} strokeWidth={2.5} />
          </View>

          <Pressable
            onPress={close}
            hitSlop={10}
            style={({ pressed }) => [
              styles.closeButton,
              {
                backgroundColor: cardMuted,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <IconX size={22} color={textSecondary} strokeWidth={2.4} />
          </Pressable>
        </View>

        <View style={styles.boltsRow}>
          {Array.from({ length: safeUsage.limit }).map((_, index) => {
            const active = index < visualUsed;

            return (
              <View
                key={index}
                style={[
                  styles.boltWrap,
                  {
                    backgroundColor: active ? primarySoft : surface,
                  },
                ]}
              >
                <IconBoltFilled
                  size={31}
                  color={active ? theme.primary : textTertiary}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.copy}>
          {safeUsage.hasUnlimited ? (
            <>
              <ThemedText type="cardTitle" align="center" style={styles.title}>
                Importe pa limit
              </ThemedText>

              <ThemedText
                type="bodyMedium"
                color="secondary"
                align="center"
                style={styles.subtitle}
              >
                Plani Pro është aktiv. Mund të importosh receta pa kufi javor.
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText type="cardTitle" align="center" style={styles.title}>
                {safeUsage.remaining ?? 0} nga {safeUsage.limit} importe javore
              </ThemedText>

              <ThemedText
                type="bodyMedium"
                color="secondary"
                align="center"
                style={styles.subtitle}
              >
                Rivendoset pas {safeUsage.daysUntilReset} ditësh.
              </ThemedText>
            </>
          )}
        </View>

        {!safeUsage.hasUnlimited ? (
          <ThemedCard
            style={[
              styles.infoCard,
              {
                backgroundColor: paper,
                borderColor: border,
              },
            ]}
          >
            <ThemedText type="smallBold">Plani falas</ThemedText>

            <ThemedText type="small" color="secondary">
              Ke 5 importe falas çdo javë. Zhblloko Pro për importe pa limit,
              import më të shpejtë dhe veçori të avancuara.
            </ThemedText>
          </ThemedCard>
        ) : null}

        {!safeUsage.hasUnlimited ? (
          <ThemedButton
            title="Zhblloko importe pa limit"
            onPress={unlock}
            style={styles.cta}
          />
        ) : (
          <ThemedButton
            title="Mbyll"
            onPress={close}
            variant="secondary"
            style={styles.cta}
          />
        )}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  iconBadge: {
    width: 62,
    height: 62,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    position: "absolute",
    right: 0,
    top: 4,
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  boltsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  boltWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.7,
  },
  subtitle: {
    maxWidth: 310,
    fontSize: 16,
    lineHeight: 23,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  cta: {
    marginTop: Spacing.sm,
  },
});
