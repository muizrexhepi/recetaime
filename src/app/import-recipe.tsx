import {
  IconCheck,
  IconChevronLeft,
  IconClipboardList,
  IconLink,
  IconPhoto,
  IconSparkles,
} from "@tabler/icons-react-native";
import { useMutation } from "convex/react";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useShareIntentContext } from "expo-share-intent";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "../../convex/_generated/api";
import {
  buildRecipeFromDraft,
  detectSourceType,
  inferTitle,
  normalizeImportDraft,
} from "@/lib/recipe-import";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedIconButton } from "@/components/ui/themed-icon-button";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Radius, Shadows, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/providers/auth-provider";
import { useGuestStore } from "@/stores/guest-store";
import {
  ImportDraft,
  ImportMode,
  useImportDraftStore,
} from "@/stores/import-draft-store";

const MODE_COPY: Record<
  ImportMode,
  { title: string; subtitle: string; inputLabel: string; placeholder: string }
> = {
  link: {
    title: "Importo nga linku.",
    subtitle: "TikTok, Instagram, YouTube ose website recetash.",
    inputLabel: "Linku i recetës",
    placeholder: "Ngjit linkun këtu",
  },
  photo: {
    title: "Importo nga foto.",
    subtitle: "Screenshot, foto nga telefoni ose recetë e printuar.",
    inputLabel: "Foto",
    placeholder: "",
  },
  text: {
    title: "Importo nga teksti.",
    subtitle: "Për WhatsApp, mesazhe ose shënime familjare.",
    inputLabel: "Teksti i recetës",
    placeholder: "Ngjit recetën këtu",
  },
  manual: {
    title: "Shkruaj recetë.",
    subtitle: "Ruaje tani, rregulloje më vonë.",
    inputLabel: "Receta",
    placeholder: "Shkruaj përbërësit dhe hapat",
  },
  share: {
    title: "Ruaje në Receta Ime.",
    subtitle: "E morëm nga share sheet. Kontrolloje para ruajtjes.",
    inputLabel: "Burimi",
    placeholder: "",
  },
};

export default function ImportRecipeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: ImportMode; source?: string }>();
  const theme = useTheme();
  const { token, isAuthenticated } = useAuth();
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();
  const addGuestRecipe = useGuestStore((state) => state.addRecipe);
  const createRecipe = useMutation(api.recipes.createFromImport);

  const storeDraft = useImportDraftStore((state) => state.draft);
  const setStoreDraft = useImportDraftStore((state) => state.setDraft);
  const clearDraft = useImportDraftStore((state) => state.clearDraft);
  const [screenReceivedAt] = useState(() => Date.now());
  const isShareIntentEntry = params.source === "share-intent";

  const initial = useMemo(
    () => getInitialDraft(storeDraft, params.mode, screenReceivedAt),
    [params.mode, screenReceivedAt, storeDraft],
  );

  const [mode, setMode] = useState<ImportMode>(initial.mode);
  const [sourceValue, setSourceValue] = useState(
    initial.sourceUrl ?? initial.sourceText ?? "",
  );
  const [title, setTitle] = useState(initial.title ?? "");
  const [imageUri, setImageUri] = useState(initial.imageUri);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [appliedDraftId, setAppliedDraftId] = useState(initial.id);
  const [shareFallbackReady, setShareFallbackReady] = useState(
    !isShareIntentEntry || Boolean(storeDraft),
  );

  const copy = MODE_COPY[mode];
  const sourceType = imageUri ? "photo" : detectSourceType(sourceValue);
  const canSave = Boolean(title.trim()) && Boolean(sourceValue.trim() || imageUri);

  const draft = useMemo<ImportDraft>(() => {
    const normalized = normalizeImportDraft({
      mode,
      value: sourceValue,
      imageUri,
      metaTitle: storeDraft?.metaTitle,
    });

    return {
      id: storeDraft?.id ?? "screen_draft",
      receivedAt: storeDraft?.receivedAt ?? screenReceivedAt,
      ...normalized,
      title: title.trim() || normalized.title,
      files: storeDraft?.files,
    };
  }, [
    imageUri,
    mode,
    screenReceivedAt,
    sourceValue,
    storeDraft?.files,
    storeDraft?.id,
    storeDraft?.metaTitle,
    storeDraft?.receivedAt,
    title,
  ]);

  useEffect(() => {
    if (!storeDraft || appliedDraftId === storeDraft.id) return;

    const timer = setTimeout(() => {
      setMode(normalizeModeForDraft(storeDraft));
      setSourceValue(storeDraft.sourceUrl ?? storeDraft.sourceText ?? "");
      setImageUri(storeDraft.imageUri);
      setTitle(storeDraft.title ?? "");
      setAppliedDraftId(storeDraft.id);
      setShareFallbackReady(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [appliedDraftId, storeDraft]);

  useEffect(() => {
    if (!hasShareIntent) return;

    const firstFile = shareIntent.files?.[0];
    const isImage = firstFile?.mimeType?.startsWith("image/");
    const value = shareIntent.webUrl ?? shareIntent.text ?? "";

    setStoreDraft({
      ...normalizeImportDraft({
        mode: isImage ? "photo" : "share",
        value,
        imageUri: isImage ? firstFile?.path : undefined,
        metaTitle: shareIntent.meta?.title,
      }),
      files: shareIntent.files ?? undefined,
    });
    resetShareIntent(true);
  }, [
    hasShareIntent,
    resetShareIntent,
    setStoreDraft,
    shareIntent.files,
    shareIntent.meta?.title,
    shareIntent.text,
    shareIntent.webUrl,
  ]);

  useEffect(() => {
    if (!isShareIntentEntry || shareFallbackReady) return;

    const timer = setTimeout(() => {
      setShareFallbackReady(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, [isShareIntentEntry, shareFallbackReady]);

  const pasteFromClipboard = async () => {
    Haptics.selectionAsync();
    setMessage(null);

    try {
      const url = await Clipboard.getUrlAsync().catch(() => null);
      const text = url ?? (await Clipboard.getStringAsync());

      if (!text?.trim()) {
        setMessage("Nuk gjetëm tekst ose link në clipboard.");
        return;
      }

      const nextDraft = normalizeImportDraft({ mode: "link", value: text });
      setMode(nextDraft.sourceUrl ? "link" : "text");
      setSourceValue(text);
      setImageUri(undefined);
      setTitle(nextDraft.title ?? inferTitle(nextDraft));
    } catch {
      setMessage("Nuk mundëm të lexojmë clipboard tani.");
    }
  };

  const choosePhoto = async () => {
    Haptics.selectionAsync();
    setMessage(null);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.86,
      allowsEditing: false,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    setMode("photo");
    setImageUri(asset.uri);
    setSourceValue("");
    setTitle((current) => current || "Recetë nga foto");
  };

  const saveRecipe = async () => {
    if (!canSave || loading) return;

    setLoading(true);
    setMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const recipe = buildRecipeFromDraft(draft);

      if (isAuthenticated && token) {
        await createRecipe({
          token,
          title: recipe.title,
          ...(recipe.description ? { description: recipe.description } : {}),
          sourceType: recipe.sourceType,
          ...(recipe.sourceUrl ? { sourceUrl: recipe.sourceUrl } : {}),
          ...(recipe.sourceText ? { sourceText: recipe.sourceText } : {}),
          ...(recipe.imageUrl ? { imageUrl: recipe.imageUrl } : {}),
          ingredients: recipe.ingredients,
          steps: recipe.steps,
        });
      } else {
        addGuestRecipe(recipe);
      }

      clearDraft();
      router.replace("/(tabs)/cookbooks" as any);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nuk mundëm ta ruajmë recetën tani.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (isShareIntentEntry && !shareFallbackReady) {
    return <ShareIntentLoadingScreen />;
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ThemedView transparent style={styles.header}>
          <ThemedIconButton
            onPress={() => router.back()}
            size={38}
            radius="md"
            variant="paper"
            icon={
              <IconChevronLeft
                size={22}
                color={theme.textSecondary}
                strokeWidth={2.6}
              />
            }
          />
        </ThemedView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
        >
          <ThemedView transparent style={styles.hero}>
            <ThemedView
              style={[
                styles.heroIcon,
                { backgroundColor: theme.primarySoft, borderColor: theme.border },
              ]}
            >
              <IconSparkles size={28} color={theme.primary} strokeWidth={2.5} />
            </ThemedView>

            <ThemedText style={styles.title}>{copy.title}</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              {copy.subtitle}
            </ThemedText>
          </ThemedView>

          <ModeSwitcher mode={mode} onChange={setMode} />

          <ThemedCard
            variant="outline"
            style={styles.formCard}
            contentStyle={styles.formContent}
          >
            <FieldLabel label="Titulli" />
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Emri i recetës"
              placeholderTextColor={theme.textTertiary}
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
            />

            <ThemedView transparent style={styles.fieldHeader}>
              <FieldLabel label={copy.inputLabel} />
              {mode === "link" || mode === "text" || mode === "manual" ? (
                <Pressable onPress={pasteFromClipboard} hitSlop={10}>
                  <ThemedText style={[styles.pasteText, { color: theme.primary }]}>
                    Ngjit
                  </ThemedText>
                </Pressable>
              ) : null}
            </ThemedView>

            {mode === "photo" ? (
              <PhotoPicker imageUri={imageUri} onPress={choosePhoto} />
            ) : (
              <TextInput
                value={sourceValue}
                onChangeText={(next) => {
                  setSourceValue(next);

                  if (!title.trim()) {
                    const nextDraft = normalizeImportDraft({ mode, value: next });
                    setTitle(nextDraft.title ?? "");
                  }
                }}
                placeholder={copy.placeholder}
                placeholderTextColor={theme.textTertiary}
                multiline={mode !== "link"}
                autoCapitalize="none"
                style={[
                  styles.input,
                  mode !== "link" && styles.textArea,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.backgroundElement,
                  },
                ]}
              />
            )}

            <ThemedView
              style={[
                styles.sourcePill,
                {
                  backgroundColor: theme.cardMuted,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText themeColor="textSecondary" style={styles.sourcePillText}>
                Burimi: {sourceLabel(sourceType)}
              </ThemedText>
            </ThemedView>
          </ThemedCard>

          {message ? (
            <ThemedText themeColor="danger" style={styles.message}>
              {message}
            </ThemedText>
          ) : null}
        </ScrollView>

        <ThemedView transparent style={styles.footer}>
          <ThemedButton
            title="Ruaje recetën"
            onPress={saveRecipe}
            disabled={!canSave}
            loading={loading}
            leftIcon={<IconCheck size={19} color="#FFFFFF" strokeWidth={3} />}
          />
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

function getInitialDraft(
  draft: ImportDraft | undefined,
  modeParam: ImportMode | undefined,
  receivedAt: number,
): ImportDraft {
  if (draft) return draft;

  const mode = modeParam ?? "link";
  const normalized = normalizeImportDraft({ mode, value: "" });

  return {
    id: "empty_draft",
    receivedAt,
    ...normalized,
    mode,
    sourceType: mode === "photo" ? "photo" : mode === "manual" ? "manual" : "web",
    title: mode === "photo" ? "Recetë nga foto" : "",
  };
}

function normalizeModeForDraft(draft: ImportDraft): ImportMode {
  if (draft.imageUri) return "photo";
  if (draft.mode === "share" && draft.sourceUrl) return "link";
  if (draft.mode === "share" && draft.sourceText) return "text";
  return draft.mode;
}

function ShareIntentLoadingScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ThemedView transparent style={styles.loadingWrap}>
          <ThemedView
            style={[
              styles.heroIcon,
              { backgroundColor: theme.primarySoft, borderColor: theme.border },
            ]}
          >
            <IconSparkles size={28} color={theme.primary} strokeWidth={2.5} />
          </ThemedView>
          <ThemedText style={styles.title}>Duke importuar recetën…</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Po lexojmë përmbajtjen nga aplikacioni tjetër.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: ImportMode;
  onChange: (mode: ImportMode) => void;
}) {
  const theme = useTheme();
  const modes: { value: ImportMode; label: string; icon: React.ReactNode }[] = [
    { value: "link", label: "Link", icon: <IconLink size={16} color={theme.primary} /> },
    { value: "photo", label: "Foto", icon: <IconPhoto size={16} color={theme.primary} /> },
    {
      value: "text",
      label: "Tekst",
      icon: <IconClipboardList size={16} color={theme.primary} />,
    },
  ];

  return (
    <ThemedView transparent style={styles.modeRow}>
      {modes.map((item) => {
        const active =
          mode === item.value || (mode === "share" && item.value === "link");

        return (
          <Pressable
            key={item.value}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(item.value);
            }}
            style={[
              styles.modeButton,
              {
                backgroundColor: active ? theme.paper : theme.cardMuted,
                borderColor: active ? theme.borderStrong : theme.border,
              },
            ]}
          >
            {item.icon}
            <ThemedText
              style={[
                styles.modeLabel,
                { color: active ? theme.text : theme.textSecondary },
              ]}
            >
              {item.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
      {label}
    </ThemedText>
  );
}

function PhotoPicker({
  imageUri,
  onPress,
}: {
  imageUri?: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.photoPicker,
        {
          borderColor: theme.border,
          backgroundColor: theme.backgroundElement,
        },
      ]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.photoPreview} contentFit="cover" />
      ) : (
        <ThemedView transparent style={styles.photoEmpty}>
          <IconPhoto size={34} color={theme.primary} strokeWidth={2.3} />
          <ThemedText style={styles.photoTitle}>Zgjidh foto</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.photoSubtitle}>
            Screenshot ose foto recete
          </ThemedText>
        </ThemedView>
      )}
    </Pressable>
  );
}

function sourceLabel(source: string) {
  switch (source) {
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "youtube":
      return "YouTube";
    case "whatsapp":
      return "WhatsApp";
    case "photo":
      return "Foto";
    case "manual":
      return "Manual";
    default:
      return "Web";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.huge,
  },
  hero: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "600",
    textAlign: "center",
  },
  modeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  modeButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  modeLabel: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "900",
  },
  formCard: {
    marginTop: Spacing.lg,
    ...Shadows.soft,
  },
  formContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pasteText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: "top",
  },
  photoPicker: {
    minHeight: 190,
    borderWidth: 1,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: 220,
  },
  photoEmpty: {
    minHeight: 190,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  photoTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
  },
  photoSubtitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },
  sourcePill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sourcePillText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "800",
  },
  message: {
    marginTop: Spacing.md,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
});
