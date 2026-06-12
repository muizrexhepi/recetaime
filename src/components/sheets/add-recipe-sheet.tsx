import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import {
  IconBrandInstagram,
  IconBrandTiktok,
  IconBrandYoutube,
  IconCameraFilled,
  IconChevronRight,
  IconClipboardText,
  IconLink,
  IconPencil,
} from "@tabler/icons-react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Radius, Shadows, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type AddRecipeSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type ImportRouteMode = "social" | "photo" | "text" | "web" | "manual";

function SocialIcons() {
  return (
    <View style={styles.socialIcons}>
      <IconBrandInstagram size={25} color="#E4405F" strokeWidth={2.35} />
      <IconBrandTiktok size={25} color="#111111" strokeWidth={2.35} />
      <IconBrandYoutube size={27} color="#FF0033" strokeWidth={2.35} />
    </View>
  );
}

export const AddRecipeSheet = forwardRef<AddRecipeSheetRef>(
  function AddRecipeSheet(_props, ref) {
    const theme = useTheme();
    const router = useRouter();
    const sheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ["66%"], []);

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const close = useCallback(() => {
      Haptics.selectionAsync();
      sheetRef.current?.dismiss();
    }, []);

    const openImport = useCallback(
      (mode: ImportRouteMode) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        sheetRef.current?.dismiss();

        setTimeout(() => {
          router.push(`/import-recipe?mode=${mode}` as any);
        }, 120);
      },
      [router],
    );

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

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{
          backgroundColor: theme.borderStrong,
          width: 48,
          height: 5,
        }}
        backgroundStyle={{
          backgroundColor: theme.paper,
          borderTopLeftRadius: Radius.xxl,
          borderTopRightRadius: Radius.xxl,
        }}
      >
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <ThemedText type="cardTitle">Shto recetë</ThemedText>
              {/* <ThemedText type="bodyMedium" color="secondary">
                Importo nga link, foto ose shkruaje vetë.
              </ThemedText> */}
            </View>

            {/* <Pressable
              onPress={close}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: theme.cardMuted,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <IconX size={23} color={theme.textSecondary} strokeWidth={2.4} />
            </Pressable> */}
          </View>

          <Pressable
            onPress={() => openImport("social")}
            style={({ pressed }) => [
              styles.socialCard,
              {
                backgroundColor: theme.paper,
                borderColor: theme.border,
                opacity: pressed ? 0.74 : 1,
              },
            ]}
          >
            <SocialIcons />

            <View style={styles.socialCopy}>
              <ThemedText type="subhead">Nga rrjetet sociale</ThemedText>
              <ThemedText type="footnote" color="secondary" numberOfLines={1}>
                TikTok, Instagram, YouTube ose link
              </ThemedText>
            </View>

            <IconChevronRight
              size={22}
              color={theme.textTertiary}
              strokeWidth={2.3}
            />
          </Pressable>

          <View style={styles.grid}>
            <SheetTile
              title="Ngarko foto"
              icon={<IconCameraFilled size={24} color={theme.primary} />}
              onPress={() => openImport("photo")}
            />

            <SheetTile
              title="Ngjit tekst"
              icon={<IconClipboardText size={24} color={theme.primary} />}
              onPress={() => openImport("text")}
            />

            <SheetTile
              title="Importo nga web"
              icon={
                <IconLink size={25} color={theme.primary} strokeWidth={2.5} />
              }
              onPress={() => openImport("web")}
            />

            <SheetTile
              title="Shkruaj vetë"
              icon={
                <IconPencil
                  size={24}
                  color={theme.primary}
                  strokeWidth={2.45}
                />
              }
              onPress={() => openImport("manual")}
            />
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

function SheetTile({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: theme.paper,
          borderColor: theme.border,
          opacity: pressed ? 0.74 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.tileIcon,
          {
            backgroundColor: theme.primarySoft,
          },
        ]}
      >
        {icon}
      </View>

      <ThemedText type="subhead" numberOfLines={2}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  headerText: {
    flex: 1,
    gap: Spacing.xs,
  },
  closeButton: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  socialCard: {
    minHeight: 96,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    ...Shadows.soft,
  },
  socialIcons: {
    width: 82,
    flexDirection: "row",
    alignItems: "center",
  },
  socialCopy: {
    flex: 1,
    gap: 2,
  },
  grid: {
    marginTop: Spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  tile: {
    width: "48%",
    minHeight: 132,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    justifyContent: "space-between",
    ...Shadows.soft,
  },
  tileIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
