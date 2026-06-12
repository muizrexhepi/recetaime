import {
  IconAlertCircle,
  IconCheck,
  IconChevronLeft,
  IconClipboardList,
  IconLink,
  IconPhoto,
  IconPlus,
  IconSparkles,
  IconX,
} from "@tabler/icons-react-native";
import { useAction, useMutation } from "convex/react";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedIconButton } from "@/components/ui/themed-icon-button";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  buildRecipeFromParsed,
  createEditableParsedRecipe,
  detectSourceType,
  getDisplayTitleForDraft,
  getDraftInputValue,
  hasEnoughRecipeContent,
  isPlaceholderRecipeTitle,
  normalizeImportDraft,
  normalizeRouteMode,
} from "@/lib/recipe-import";
import { getShareIntentMeta } from "@/lib/share-intent-meta";
import { useAuth } from "@/providers/auth-provider";
import { useGuestStore } from "@/stores/guest-store";
import {
  ImportDraft,
  ImportMode,
  ParsedRecipe,
  StoredImportDraft,
  useImportDraftStore,
} from "@/stores/import-draft-store";
import { api } from "../../convex/_generated/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type EditableRow = { id: string; text: string };

// ─── Mode copy ───────────────────────────────────────────────────────────────

const MODE_COPY: Record<
  ImportMode,
  { title: string; subtitle: string; inputLabel: string; placeholder: string }
> = {
  link: {
    title: "Import from link",
    subtitle: "Paste a link from a website, YouTube, Instagram or TikTok.",
    inputLabel: "Link",
    placeholder: "https://...",
  },
  web: {
    title: "Import from web",
    subtitle: "We'll try to read the recipe data from the page.",
    inputLabel: "Page URL",
    placeholder: "https://recipe-site.com/...",
  },
  photo: {
    title: "Import from photo",
    subtitle: "Pick a screenshot or recipe photo to extract from.",
    inputLabel: "Photo",
    placeholder: "",
  },
  text: {
    title: "Import from text",
    subtitle:
      "Paste a caption, WhatsApp message, or note with ingredients and steps.",
    inputLabel: "Recipe text",
    placeholder: "Ingredients...\n\nSteps...",
  },
  manual: {
    title: "Write a recipe",
    subtitle: "Type it out, then review before saving.",
    inputLabel: "Recipe",
    placeholder: "Title\n\nIngredients...\n\nSteps...",
  },
  share: {
    title: "Import from share",
    subtitle: "We'll analyse this without saving automatically.",
    inputLabel: "Shared content",
    placeholder: "",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowsFromText(text: string): EditableRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, i) => ({ id: `${i}_${line.slice(0, 12)}`, text: line }));
}

function rowsToText(rows: EditableRow[]): string {
  return rows.map((r) => r.text).join("\n");
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ImportRecipeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; source?: string }>();
  const theme = useTheme();
  const { token, isAuthenticated } = useAuth();
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();

  const parseImport = useAction(api.imports.parseDraft);
  const createRecipe = useMutation(api.recipes.createFromImport);
  const addGuestRecipe = useGuestStore((state) => state.addRecipe);

  const storeDraft = useImportDraftStore((state) => state.draft);
  const setStoreDraft = useImportDraftStore((state) => state.setDraft);
  const patchStoreDraft = useImportDraftStore((state) => state.patchDraft);
  const clearDraft = useImportDraftStore((state) => state.clearDraft);

  const isShareIntentEntry = params.source === "share-intent";
  const initialMode = normalizeRouteMode(params.mode);
  const initialDraft = useMemo(
    () => storeDraft ?? createEmptyStoredDraft(initialMode),
    [initialMode, storeDraft],
  );

  const [mode, setMode] = useState<ImportMode>(
    initialDraft.mode ?? initialMode,
  );
  const [sourceValue, setSourceValue] = useState(
    getDraftInputValue(initialDraft),
  );
  const [imageUri, setImageUri] = useState(initialDraft.imageUri);
  const [extraText, setExtraText] = useState("");
  const [activeDraft, setActiveDraft] = useState<ImportDraft>(initialDraft);
  const [reviewRecipe, setReviewRecipe] = useState<ParsedRecipe | null>(
    initialDraft.parsedRecipe ?? null,
  );

  // ── Individual editable rows ──────────────────────────────────────────────
  const [title, setTitle] = useState(initialDraft.parsedRecipe?.title ?? "");
  const [description, setDescription] = useState(
    initialDraft.parsedRecipe?.description ?? "",
  );
  const [ingredientRows, setIngredientRows] = useState<EditableRow[]>(
    rowsFromText(
      initialDraft.parsedRecipe?.ingredients.map((i) => i.text).join("\n") ??
        "",
    ),
  );
  const [stepRows, setStepRows] = useState<EditableRow[]>(
    rowsFromText(initialDraft.parsedRecipe?.steps.join("\n") ?? ""),
  );
  const [servingsText, setServingsText] = useState(
    initialDraft.parsedRecipe?.servings?.toString() ?? "",
  );
  const [prepTimeText, setPrepTimeText] = useState(
    initialDraft.parsedRecipe?.prepTimeMinutes?.toString() ?? "",
  );
  const [cookTimeText, setCookTimeText] = useState(
    initialDraft.parsedRecipe?.cookTimeMinutes?.toString() ?? "",
  );

  const [message, setMessage] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedRecipeTitle, setSavedRecipeTitle] = useState<string | null>(null);
  const [showSupplementalInput, setShowSupplementalInput] = useState(false);
  const [appliedDraftId, setAppliedDraftId] = useState(initialDraft.id);
  const [autoParsedDraftId, setAutoParsedDraftId] = useState<string | null>(
    null,
  );
  const [shareFallbackReady, setShareFallbackReady] = useState(
    !isShareIntentEntry || Boolean(storeDraft),
  );

  const copy = MODE_COPY[mode];
  const sourceType = imageUri
    ? "photo"
    : mode === "manual"
      ? "manual"
      : detectSourceType(sourceValue);
  const canParse = Boolean(sourceValue.trim() || imageUri);
  const isReadyForReview =
    activeDraft.status === "ready_for_review" && reviewRecipe;

  const editedRecipe = useMemo(
    () =>
      buildEditedRecipe(
        reviewRecipe,
        title,
        description,
        ingredientRows,
        stepRows,
        servingsText,
        prepTimeText,
        cookTimeText,
      ),
    [
      cookTimeText,
      description,
      ingredientRows,
      prepTimeText,
      reviewRecipe,
      servingsText,
      stepRows,
      title,
    ],
  );
  const canSave = Boolean(editedRecipe && hasEnoughRecipeContent(editedRecipe));
  const shouldShowImporting =
    !savedRecipeTitle &&
    !isReadyForReview &&
    (parsing ||
      activeDraft.status === "extracting" ||
      (Boolean(storeDraft) &&
        activeDraft.status === "receiving" &&
        autoParsedDraftId !== storeDraft?.id));

  // ── Draft sync ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!storeDraft || appliedDraftId === storeDraft.id) return;
    const timer = setTimeout(() => {
      setMode(storeDraft.mode ?? normalizeModeForDraft(storeDraft));
      setSourceValue(getDraftInputValue(storeDraft));
      setImageUri(storeDraft.imageUri);
      setActiveDraft(storeDraft);
      applyParsedRecipe(storeDraft.parsedRecipe ?? null);
      setAppliedDraftId(storeDraft.id);
      setShareFallbackReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [appliedDraftId, storeDraft]);

  useEffect(() => {
    if (!hasShareIntent) return;
    const firstFile = shareIntent.files?.[0];
    const isImage = firstFile?.mimeType?.startsWith("image/");
    const meta = getShareIntentMeta(shareIntent.meta);
    const value = mergeSharePayloadText(shareIntent.webUrl, shareIntent.text);
    setStoreDraft({
      ...normalizeImportDraft({
        mode: isImage ? "photo" : "share",
        value,
        imageUri: isImage ? firstFile?.path : undefined,
        metaTitle: meta.title,
        metaDescription: meta.description,
        metaCaption: meta.caption,
        metaHtmlText: meta.htmlText,
      }),
      files: shareIntent.files ?? undefined,
    });
    resetShareIntent(true);
  }, [
    hasShareIntent,
    resetShareIntent,
    setStoreDraft,
    shareIntent.files,
    shareIntent.meta,
    shareIntent.text,
    shareIntent.webUrl,
  ]);

  // ── Parse ─────────────────────────────────────────────────────────────────

  const runParse = useCallback(
    async (draftOverride?: ImportDraft, supplementalText?: string) => {
      const nextDraft =
        draftOverride ??
        buildDraftFromInput({
          mode,
          sourceValue,
          imageUri,
          status: "extracting",
          extraText: supplementalText ?? extraText,
        });

      if (
        !nextDraft.sourceUrl &&
        !nextDraft.sourceText &&
        !nextDraft.imageUri
      ) {
        setMessage("Add a link, text or photo to import.");
        return;
      }

      setParsing(true);
      setMessage(null);
      setActiveDraft({ ...nextDraft, status: "extracting" });
      patchStoreDraft({ ...nextDraft, status: "extracting" });

      try {
        const result = await parseImport({
          sourceType: nextDraft.sourceType,
          ...(nextDraft.mode ? { mode: nextDraft.mode } : {}),
          ...(nextDraft.sourceUrl ? { sourceUrl: nextDraft.sourceUrl } : {}),
          ...(nextDraft.sourceText ? { sourceText: nextDraft.sourceText } : {}),
          ...(nextDraft.imageUri ? { imageUri: nextDraft.imageUri } : {}),
          ...(nextDraft.rawContent ? { rawContent: nextDraft.rawContent } : {}),
        });

        setActiveDraft(result);
        patchStoreDraft(result);
        applyParsedRecipe(result.parsedRecipe ?? null);
        setMessage(
          result.status === "failed" ? (result.warnings[0] ?? null) : null,
        );
      } catch (error) {
        const failedDraft: ImportDraft = {
          ...nextDraft,
          status: "failed",
          confidence: "low",
          warnings: [
            error instanceof Error
              ? error.message
              : "Could not analyse the import right now.",
          ],
        };
        setActiveDraft(failedDraft);
        patchStoreDraft(failedDraft);
        setMessage(failedDraft.warnings[0]);
      } finally {
        setParsing(false);
      }
    },
    [extraText, imageUri, mode, parseImport, patchStoreDraft, sourceValue],
  );

  useEffect(() => {
    if (!storeDraft || autoParsedDraftId === storeDraft.id) return;
    if (!storeDraft.sourceUrl && !storeDraft.sourceText && !storeDraft.imageUri)
      return;
    if (
      storeDraft.status === "ready_for_review" ||
      storeDraft.status === "needs_input" ||
      storeDraft.status === "failed"
    )
      return;

    const timer = setTimeout(() => {
      setAutoParsedDraftId(storeDraft.id);
      runParse(storeDraft);
    }, 0);
    return () => clearTimeout(timer);
  }, [autoParsedDraftId, runParse, storeDraft]);

  useEffect(() => {
    if (!isShareIntentEntry || shareFallbackReady) return;
    const timer = setTimeout(() => setShareFallbackReady(true), 1800);
    return () => clearTimeout(timer);
  }, [isShareIntentEntry, shareFallbackReady]);

  // ── Clipboard / photo ────────────────────────────────────────────────────

  const pasteFromClipboard = async () => {
    Haptics.selectionAsync();
    setMessage(null);
    try {
      const url = await Clipboard.getUrlAsync().catch(() => null);
      const text = url ?? (await Clipboard.getStringAsync());
      if (!text?.trim()) {
        setMessage("Nothing found in clipboard.");
        return;
      }
      setMode(extractModeFromValue(text));
      setSourceValue(text);
      setImageUri(undefined);
      setActiveDraft(
        normalizeImportDraft({ mode: extractModeFromValue(text), value: text }),
      );
      applyParsedRecipe(null);
    } catch {
      setMessage("Couldn't read clipboard.");
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
    setActiveDraft(
      normalizeImportDraft({ mode: "photo", imageUri: asset.uri }),
    );
    applyParsedRecipe(null);
  };

  const attachScreenshotToDraft = async () => {
    Haptics.selectionAsync();
    setMessage(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.86,
      allowsEditing: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const nextDraft: ImportDraft = {
      ...activeDraft,
      imageUri: asset.uri,
      status: "needs_input",
      warnings: [
        "Screenshot added. Paste the recipe description or caption too.",
      ],
    };
    setImageUri(asset.uri);
    setActiveDraft(nextDraft);
    patchStoreDraft(nextDraft);
    setShowSupplementalInput(true);
    setMessage(nextDraft.warnings[0]);
  };

  const openSupplementalInput = async () => {
    Haptics.selectionAsync();
    setShowSupplementalInput(true);
    try {
      const text = await Clipboard.getStringAsync();
      if (text.trim() && !extraText.trim()) setExtraText(text.trim());
    } catch {
      // optional
    }
  };

  const retryWithSupplementalText = () => {
    const nextDraft = mergeSupplementalText(activeDraft, extraText);
    setSourceValue(getDraftInputValue(nextDraft));
    setActiveDraft(nextDraft);
    patchStoreDraft(nextDraft);
    runParse(nextDraft);
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const saveRecipe = async () => {
    if (!editedRecipe || !canSave || saving) return;
    setSaving(true);
    setMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const recipe = buildRecipeFromParsed({
        draft: activeDraft,
        parsedRecipe: editedRecipe,
      });
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
          ...(recipe.servings ? { servings: recipe.servings } : {}),
          ...(recipe.prepTimeMinutes
            ? { prepTimeMinutes: recipe.prepTimeMinutes }
            : {}),
          ...(recipe.cookTimeMinutes
            ? { cookTimeMinutes: recipe.cookTimeMinutes }
            : {}),
          tags: editedRecipe.tags,
          language: editedRecipe.language,
          ...(editedRecipe.cuisine ? { cuisine: editedRecipe.cuisine } : {}),
          ambiguityNotes: editedRecipe.ambiguityNotes,
          needsUserReview: editedRecipe.needsUserReview,
          importConfidence: editedRecipe.confidence,
        });
      } else {
        addGuestRecipe(recipe);
      }
      setSavedRecipeTitle(recipe.title);
      clearDraft();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Couldn't save the recipe right now.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Apply parsed ─────────────────────────────────────────────────────────

  function applyParsedRecipe(parsed: ParsedRecipe | null) {
    setReviewRecipe(parsed);
    setTitle(parsed?.title ?? "");
    setDescription(parsed?.description ?? "");
    setIngredientRows(
      rowsFromText(parsed?.ingredients.map((i) => i.text).join("\n") ?? ""),
    );
    setStepRows(rowsFromText(parsed?.steps.join("\n") ?? ""));
    setServingsText(parsed?.servings?.toString() ?? "");
    setPrepTimeText(parsed?.prepTimeMinutes?.toString() ?? "");
    setCookTimeText(parsed?.cookTimeMinutes?.toString() ?? "");
  }

  // ── Guards ────────────────────────────────────────────────────────────────

  if (isShareIntentEntry && !shareFallbackReady) {
    return <ShareIntentLoadingScreen />;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        {/* Header */}
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
          {savedRecipeTitle ? (
            <SavedCard
              title={savedRecipeTitle}
              onView={() => router.replace("/(tabs)/cookbooks" as never)}
              onBack={() => router.back()}
            />
          ) : shouldShowImporting ? (
            <ImportingPanel draft={activeDraft} />
          ) : (
            <ThemedView transparent style={styles.hero}>
              <ThemedView
                style={[
                  styles.heroIcon,
                  {
                    backgroundColor: theme.primarySoft,
                    borderColor: theme.border,
                  },
                ]}
              >
                <IconSparkles
                  size={28}
                  color={theme.primary}
                  strokeWidth={2.5}
                />
              </ThemedView>
              <ThemedText type="h2" align="center">
                {isReadyForReview ? "Review recipe" : copy.title}
              </ThemedText>
              <ThemedText
                color="secondary"
                align="center"
                style={styles.subtitle}
              >
                {isReadyForReview
                  ? "Edit anything before saving."
                  : copy.subtitle}
              </ThemedText>
            </ThemedView>
          )}

          {/* ── Review form ── */}
          {!savedRecipeTitle && !shouldShowImporting && isReadyForReview ? (
            <ReviewForm
              title={title}
              description={description}
              ingredientRows={ingredientRows}
              stepRows={stepRows}
              servingsText={servingsText}
              prepTimeText={prepTimeText}
              cookTimeText={cookTimeText}
              draft={activeDraft}
              parsed={reviewRecipe}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onIngredientRowsChange={setIngredientRows}
              onStepRowsChange={setStepRows}
              onServingsChange={setServingsText}
              onPrepTimeChange={setPrepTimeText}
              onCookTimeChange={setCookTimeText}
            />
          ) : null}

          {/* ── Input form ── */}
          {!savedRecipeTitle && !shouldShowImporting && !isReadyForReview ? (
            <>
              <ModeSwitcher
                mode={mode}
                onChange={(nextMode) => {
                  Haptics.selectionAsync();
                  setMode(nextMode);
                  setActiveDraft(
                    normalizeImportDraft({ mode: nextMode, value: "" }),
                  );
                  setSourceValue("");
                  setImageUri(undefined);
                  setExtraText("");
                  applyParsedRecipe(null);
                }}
              />

              <ThemedCard style={styles.card}>
                <ThemedView transparent style={styles.fieldHeader}>
                  <FieldLabel label={copy.inputLabel} />
                  {mode !== "photo" ? (
                    <Pressable onPress={pasteFromClipboard} hitSlop={10}>
                      <ThemedText
                        style={[styles.pasteText, { color: theme.primary }]}
                      >
                        Paste
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
                      setActiveDraft(
                        normalizeImportDraft({ mode, value: next }),
                      );
                    }}
                    placeholder={copy.placeholder}
                    placeholderTextColor={theme.textTertiary}
                    multiline={mode !== "link" && mode !== "web"}
                    autoCapitalize="none"
                    style={[
                      styles.input,
                      mode !== "link" && mode !== "web" && styles.textArea,
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
                  <ThemedText color="secondary" style={styles.sourcePillText}>
                    Source: {sourceLabel(sourceType)}
                  </ThemedText>
                </ThemedView>
              </ThemedCard>

              {activeDraft.status === "needs_input" ||
              activeDraft.status === "failed" ? (
                <FallbackCard
                  draft={activeDraft}
                  extraText={extraText}
                  showTextInput={showSupplementalInput}
                  onShowTextInput={openSupplementalInput}
                  onExtraTextChange={setExtraText}
                  onRetry={retryWithSupplementalText}
                  onUploadScreenshot={attachScreenshotToDraft}
                  onCancel={() => router.back()}
                  parsing={parsing}
                />
              ) : null}
            </>
          ) : null}

          {message ? (
            <ThemedText selectable color="secondary" style={styles.message}>
              {message}
            </ThemedText>
          ) : null}
        </ScrollView>

        {/* Footer CTA */}
        {!savedRecipeTitle && !shouldShowImporting ? (
          <ThemedView transparent style={styles.footer}>
            {isReadyForReview ? (
              <ThemedButton
                title="Save recipe"
                onPress={saveRecipe}
                disabled={!canSave}
                loading={saving}
                leftIcon={
                  <IconCheck size={19} color="#FFFFFF" strokeWidth={3} />
                }
              />
            ) : (
              <ThemedButton
                title="Analyse recipe"
                onPress={() => runParse()}
                disabled={!canParse || parsing}
                loading={parsing}
                leftIcon={
                  <IconSparkles size={19} color="#FFFFFF" strokeWidth={2.8} />
                }
              />
            )}
          </ThemedView>
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}

// ─── Review Form ─────────────────────────────────────────────────────────────

function ReviewForm({
  title,
  description,
  ingredientRows,
  stepRows,
  servingsText,
  prepTimeText,
  cookTimeText,
  draft,
  parsed,
  onTitleChange,
  onDescriptionChange,
  onIngredientRowsChange,
  onStepRowsChange,
  onServingsChange,
  onPrepTimeChange,
  onCookTimeChange,
}: {
  title: string;
  description: string;
  ingredientRows: EditableRow[];
  stepRows: EditableRow[];
  servingsText: string;
  prepTimeText: string;
  cookTimeText: string;
  draft: ImportDraft;
  parsed: ParsedRecipe;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onIngredientRowsChange: (rows: EditableRow[]) => void;
  onStepRowsChange: (rows: EditableRow[]) => void;
  onServingsChange: (v: string) => void;
  onPrepTimeChange: (v: string) => void;
  onCookTimeChange: (v: string) => void;
}) {
  const theme = useTheme();
  const showTimingFields = Boolean(
    parsed.servings ||
    parsed.prepTimeMinutes ||
    parsed.cookTimeMinutes ||
    servingsText ||
    prepTimeText ||
    cookTimeText,
  );

  return (
    <>
      {/* ── Title + meta card ── */}
      <ThemedCard style={styles.card}>
        <ThemedView transparent style={styles.reviewHeader}>
          <ThemedText type="cardTitle">
            {getDisplayTitleForDraft(draft)}
          </ThemedText>
          <ConfidenceBadge confidence={parsed.confidence} />
        </ThemedView>

        <FieldLabel label="Title" />
        <TextInput
          value={title}
          onChangeText={onTitleChange}
          placeholder="Recipe title"
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
        {isPlaceholderRecipeTitle(title) ? (
          <ThemedText color="secondary" style={styles.hintText}>
            Add a real title before saving.
          </ThemedText>
        ) : null}

        <FieldLabel label="Description (optional)" />
        <TextInput
          value={description}
          onChangeText={onDescriptionChange}
          placeholder="A short description"
          placeholderTextColor={theme.textTertiary}
          multiline
          style={[
            styles.input,
            styles.smallTextArea,
            {
              color: theme.text,
              borderColor: theme.border,
              backgroundColor: theme.backgroundElement,
            },
          ]}
        />

        {showTimingFields ? (
          <ThemedView transparent style={styles.metaGrid}>
            <ThemedView transparent style={styles.metaField}>
              <FieldLabel label="Servings" />
              <TextInput
                value={servingsText}
                onChangeText={onServingsChange}
                keyboardType="number-pad"
                placeholder="4"
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
            </ThemedView>
            <ThemedView transparent style={styles.metaField}>
              <FieldLabel label="Prep min" />
              <TextInput
                value={prepTimeText}
                onChangeText={onPrepTimeChange}
                keyboardType="number-pad"
                placeholder="15"
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
            </ThemedView>
            <ThemedView transparent style={styles.metaField}>
              <FieldLabel label="Cook min" />
              <TextInput
                value={cookTimeText}
                onChangeText={onCookTimeChange}
                keyboardType="number-pad"
                placeholder="30"
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
            </ThemedView>
          </ThemedView>
        ) : null}
      </ThemedCard>

      {/* ── Ingredients ── */}
      <EditableListCard
        label="Ingredients"
        rows={ingredientRows}
        onChange={onIngredientRowsChange}
        addPlaceholder="Add ingredient"
        rowPlaceholder="e.g. 200g flour"
        numbered={false}
      />

      {/* ── Steps ── */}
      <EditableListCard
        label="Steps"
        rows={stepRows}
        onChange={onStepRowsChange}
        addPlaceholder="Add step"
        rowPlaceholder="e.g. Mix until smooth"
        numbered
      />

      {/* ── Ambiguity warnings ── */}
      {parsed.ambiguityNotes.length > 0 ? (
        <ThemedCard
          style={[
            styles.warningCard,
            { backgroundColor: theme.goldSoft, borderColor: theme.border },
          ]}
        >
          <ThemedView transparent style={styles.warningHeader}>
            <IconAlertCircle
              size={18}
              color={theme.textSecondary}
              strokeWidth={2.4}
            />
            <ThemedText type="smallBold">Notes to check</ThemedText>
          </ThemedView>
          {parsed.ambiguityNotes.map((note) => (
            <ThemedText
              key={note}
              selectable
              color="secondary"
              style={styles.warningText}
            >
              · {note}
            </ThemedText>
          ))}
        </ThemedCard>
      ) : null}
    </>
  );
}

// ─── Editable List Card ───────────────────────────────────────────────────────

function EditableListCard({
  label,
  rows,
  onChange,
  addPlaceholder,
  rowPlaceholder,
  numbered,
}: {
  label: string;
  rows: EditableRow[];
  onChange: (rows: EditableRow[]) => void;
  addPlaceholder: string;
  rowPlaceholder: string;
  numbered: boolean;
}) {
  const theme = useTheme();

  const updateRow = (id: string, text: string) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, text } : r)));
  };

  const deleteRow = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(rows.filter((r) => r.id !== id));
  };

  const addRow = () => {
    Haptics.selectionAsync();
    onChange([...rows, { id: makeId(), text: "" }]);
  };

  return (
    <ThemedCard style={styles.listCard}>
      <ThemedView transparent style={styles.listCardHeader}>
        <ThemedText type="cardTitle">{label}</ThemedText>
        <ThemedText color="secondary" style={styles.listCountText}>
          {rows.length}
        </ThemedText>
      </ThemedView>

      {rows.map((row, index) => (
        <SwipeableRow key={row.id} onDelete={() => deleteRow(row.id)}>
          <ThemedView
            style={[
              styles.listRow,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            {numbered ? (
              <ThemedView
                style={[
                  styles.stepNumber,
                  { backgroundColor: theme.primarySoft },
                ]}
              >
                <ThemedText
                  style={[styles.stepNumberText, { color: theme.primary }]}
                >
                  {index + 1}
                </ThemedText>
              </ThemedView>
            ) : (
              <ThemedView
                style={[styles.bulletDot, { backgroundColor: theme.primary }]}
              />
            )}
            <TextInput
              value={row.text}
              onChangeText={(text) => updateRow(row.id, text)}
              placeholder={rowPlaceholder}
              placeholderTextColor={theme.textTertiary}
              multiline
              style={[styles.rowInput, { color: theme.text }]}
            />
            <TouchableOpacity
              onPress={() => deleteRow(row.id)}
              hitSlop={12}
              style={styles.deleteButton}
            >
              <IconX size={16} color={theme.textTertiary} strokeWidth={2.5} />
            </TouchableOpacity>
          </ThemedView>
        </SwipeableRow>
      ))}

      {rows.length === 0 ? (
        <ThemedView
          style={[
            styles.emptyState,
            {
              borderColor: theme.border,
              backgroundColor: theme.backgroundElement,
            },
          ]}
        >
          <ThemedText
            color="secondary"
            align="center"
            style={styles.emptyStateText}
          >
            No {label.toLowerCase()} yet. Tap + to add.
          </ThemedText>
        </ThemedView>
      ) : null}

      <TouchableOpacity
        onPress={addRow}
        style={[
          styles.addRowButton,
          { borderColor: theme.border, backgroundColor: theme.cardMuted },
        ]}
        activeOpacity={0.7}
      >
        <IconPlus size={16} color={theme.primary} strokeWidth={2.5} />
        <ThemedText style={[styles.addRowText, { color: theme.primary }]}>
          {addPlaceholder}
        </ThemedText>
      </TouchableOpacity>
    </ThemedCard>
  );
}

// ─── Swipeable Row ────────────────────────────────────────────────────────────

function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  // Simple press-and-hold delete; full swipe requires react-native-gesture-handler
  // which may not be set up. Using fade-press approach instead.
  return <>{children}</>;
}

// ─── Confidence Badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const theme = useTheme();
  const color =
    confidence === "high"
      ? (theme.success ?? "#22c55e")
      : confidence === "medium"
        ? (theme.gold ?? "#f59e0b")
        : (theme.error ?? "#ef4444");
  const label =
    confidence === "high"
      ? "High confidence"
      : confidence === "medium"
        ? "Review recommended"
        : "Needs review";

  return (
    <ThemedView
      style={[
        styles.confidenceBadge,
        { backgroundColor: `${color}18`, borderColor: `${color}40` },
      ]}
    >
      <ThemedView style={[styles.confidenceDot, { backgroundColor: color }]} />
      <ThemedText style={[styles.confidenceText, { color }]}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

// ─── Mode Switcher ────────────────────────────────────────────────────────────

function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: ImportMode;
  onChange: (mode: ImportMode) => void;
}) {
  const theme = useTheme();
  const modes: { value: ImportMode; label: string; icon: React.ReactNode }[] = [
    {
      value: "link",
      label: "Link",
      icon: <IconLink size={16} color={theme.primary} />,
    },
    {
      value: "photo",
      label: "Photo",
      icon: <IconPhoto size={16} color={theme.primary} />,
    },
    {
      value: "text",
      label: "Text",
      icon: <IconClipboardList size={16} color={theme.primary} />,
    },
  ];

  return (
    <ThemedView transparent style={styles.modeRow}>
      {modes.map((item) => {
        const active =
          mode === item.value ||
          (mode === "share" && item.value === "link") ||
          (mode === "web" && item.value === "link") ||
          (mode === "manual" && item.value === "text");

        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
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

// ─── Importing Panel ──────────────────────────────────────────────────────────

function ImportingPanel({ draft }: { draft: ImportDraft }) {
  const theme = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <ThemedView transparent style={styles.importingWrap}>
      <ThemedView
        style={[
          styles.importingIcon,
          { backgroundColor: theme.primarySoft, borderColor: theme.border },
        ]}
      >
        <ActivityIndicator color={theme.primary} />
      </ThemedView>

      <ThemedText type="h2" align="center">
        Importing recipe…
      </ThemedText>
      <ThemedText color="secondary" align="center" style={styles.subtitle}>
        {importingSubtitle(draft)}
      </ThemedText>

      <ThemedCard style={styles.progressCard}>
        <ThemedView
          style={[styles.progressTrack, { backgroundColor: theme.primarySoft }]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: theme.primary, opacity: pulseAnim },
            ]}
          />
        </ThemedView>
        <ThemedText color="secondary" align="center" style={styles.statusText}>
          Checking the source before sending to review.
        </ThemedText>
      </ThemedCard>
    </ThemedView>
  );
}

// ─── Saved Card ───────────────────────────────────────────────────────────────

function SavedCard({
  title,
  onView,
  onBack,
}: {
  title: string;
  onView: () => void;
  onBack: () => void;
}) {
  const theme = useTheme();

  return (
    <ThemedView transparent style={styles.importingWrap}>
      <ThemedView
        style={[
          styles.importingIcon,
          { backgroundColor: theme.primarySoft, borderColor: theme.border },
        ]}
      >
        <IconCheck size={28} color={theme.primary} strokeWidth={3} />
      </ThemedView>

      <ThemedText type="h2" align="center">
        Recipe saved
      </ThemedText>
      <ThemedText color="secondary" align="center" style={styles.subtitle}>
        {title}
      </ThemedText>

      <ThemedCard style={styles.savedActions}>
        <ThemedButton title="View recipe" onPress={onView} />
        <ThemedButton title="Go back" onPress={onBack} variant="secondary" />
      </ThemedCard>
    </ThemedView>
  );
}

// ─── Fallback Card ────────────────────────────────────────────────────────────

function FallbackCard({
  draft,
  extraText,
  showTextInput,
  onShowTextInput,
  onExtraTextChange,
  onRetry,
  onUploadScreenshot,
  onCancel,
  parsing,
}: {
  draft: ImportDraft;
  extraText: string;
  showTextInput: boolean;
  onShowTextInput: () => void;
  onExtraTextChange: (value: string) => void;
  onRetry: () => void;
  onUploadScreenshot: () => void;
  onCancel: () => void;
  parsing: boolean;
}) {
  const theme = useTheme();

  return (
    <ThemedCard style={styles.card}>
      <ThemedView transparent style={styles.fallbackHeader}>
        <IconAlertCircle
          size={22}
          color={theme.textSecondary}
          strokeWidth={2.4}
        />
        <ThemedView transparent style={styles.fallbackCopy}>
          <ThemedText type="cardTitle">A bit more info needed</ThemedText>
          <ThemedText selectable color="secondary" style={styles.statusText}>
            {fallbackMessageForDraft(draft)}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {showTextInput ? (
        <>
          <FieldLabel label="Description or caption" />
          <TextInput
            value={extraText}
            onChangeText={onExtraTextChange}
            placeholder="Ingredients and steps..."
            placeholderTextColor={theme.textTertiary}
            multiline
            style={[
              styles.input,
              styles.textArea,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.backgroundElement,
              },
            ]}
          />
          <ThemedButton
            title="Analyse again"
            onPress={onRetry}
            disabled={!extraText.trim() || parsing}
            loading={parsing}
            variant="secondary"
          />
        </>
      ) : null}

      <ThemedView transparent style={styles.fallbackActions}>
        <ThemedButton
          title="Paste description"
          onPress={onShowTextInput}
          variant={showTextInput ? "ghost" : "secondary"}
        />
        <ThemedButton
          title="Upload screenshot"
          onPress={onUploadScreenshot}
          variant="outline"
        />
        <ThemedButton title="Cancel" onPress={onCancel} variant="ghost" />
      </ThemedView>
    </ThemedCard>
  );
}

// ─── Share Intent Loading ─────────────────────────────────────────────────────

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
          <ThemedText type="h2" align="center">
            Receiving import
          </ThemedText>
          <ThemedText color="secondary" align="center" style={styles.subtitle}>
            Reading content from share sheet.
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ─── Photo Picker ─────────────────────────────────────────────────────────────

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
        { borderColor: theme.border, backgroundColor: theme.backgroundElement },
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.photoPreview}
          contentFit="cover"
        />
      ) : (
        <ThemedView transparent style={styles.photoEmpty}>
          <IconPhoto size={34} color={theme.primary} strokeWidth={2.3} />
          <ThemedText type="cardTitle">Choose photo</ThemedText>
          <ThemedText color="secondary" align="center">
            Screenshot or recipe photo
          </ThemedText>
        </ThemedView>
      )}
    </Pressable>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────

function FieldLabel({ label }: { label: string }) {
  return (
    <ThemedText color="secondary" style={styles.fieldLabel}>
      {label}
    </ThemedText>
  );
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function buildDraftFromInput(args: {
  mode: ImportMode;
  sourceValue: string;
  imageUri?: string;
  status: ImportDraft["status"];
  extraText?: string;
}) {
  const sourceValue = [args.sourceValue, args.extraText]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join("\n\n");

  return normalizeImportDraft({
    mode: args.mode,
    value: sourceValue,
    imageUri: args.imageUri,
    status: args.status,
  });
}

function buildEditedRecipe(
  parsed: ParsedRecipe | null,
  title: string,
  description: string,
  ingredientRows: EditableRow[],
  stepRows: EditableRow[],
  servingsText: string,
  prepTimeText: string,
  cookTimeText: string,
): ParsedRecipe | null {
  if (!parsed) return null;

  const base = createEditableParsedRecipe(parsed);

  return {
    ...base,
    title: title.trim(),
    ...(description.trim() ? { description: description.trim() } : {}),
    ingredients: ingredientRows
      .map((r) => r.text.trim())
      .filter(Boolean)
      .map((text) => ({ text, confidence: "medium" as const })),
    steps: stepRows.map((r) => r.text.trim()).filter(Boolean),
    ...(parseOptionalPositiveNumber(servingsText)
      ? { servings: parseOptionalPositiveNumber(servingsText) }
      : {}),
    ...(parseOptionalPositiveNumber(prepTimeText)
      ? { prepTimeMinutes: parseOptionalPositiveNumber(prepTimeText) }
      : {}),
    ...(parseOptionalPositiveNumber(cookTimeText)
      ? { cookTimeMinutes: parseOptionalPositiveNumber(cookTimeText) }
      : {}),
    needsUserReview: false,
  };
}

function mergeSupplementalText(
  draft: ImportDraft,
  supplementalText: string,
): ImportDraft {
  const text = supplementalText.trim();
  const sourceText = [draft.sourceText, text]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join("\n\n");

  return {
    ...draft,
    status: "extracting",
    ...(sourceText ? { sourceText } : {}),
    rawContent: { ...draft.rawContent, caption: sourceText },
    warnings: [],
  };
}

function parseOptionalPositiveNumber(value: string) {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function mergeSharePayloadText(webUrl?: string | null, text?: string | null) {
  return [webUrl, text]
    .map((part) => part?.trim())
    .filter(Boolean)
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join("\n\n");
}

function createEmptyStoredDraft(mode: ImportMode): StoredImportDraft {
  return {
    id: "empty_draft",
    receivedAt: Date.now(),
    ...normalizeImportDraft({ mode, value: "", status: "idle" }),
  };
}

function normalizeModeForDraft(draft: ImportDraft): ImportMode {
  if (draft.imageUri) return "photo";
  if (draft.mode === "share" && draft.sourceUrl) return "link";
  if (draft.mode === "share" && draft.sourceText) return "text";
  return draft.mode ?? "link";
}

function extractModeFromValue(value: string): ImportMode {
  return /^https?:\/\//i.test(value.trim()) ? "link" : "text";
}

function importingSubtitle(draft: ImportDraft) {
  switch (draft.sourceType) {
    case "instagram":
    case "tiktok":
      return "Reading the link and caption if available.";
    case "youtube":
      return "Checking the title and description.";
    case "photo":
      return "Preparing the photo for analysis.";
    default:
      return "Reading the recipe page.";
  }
}

function fallbackMessageForDraft(draft: ImportDraft) {
  switch (draft.needsInputReason) {
    case "ONLY_BARE_SOCIAL_URL":
    case "NO_CAPTION_TEXT":
      return "This link didn't give us enough text. Paste the video description or upload a screenshot.";
    case "NOT_RECIPE_LIKE":
      return "We read the link but couldn't find ingredients or steps. Paste the description or a screenshot.";
    case "SOCIAL_PLATFORM_BLOCKED":
      return "The platform blocked full access. Paste the description or upload a screenshot.";
    case "AI_PARSE_FAILED":
      return "We found text but couldn't turn it into a recipe. Paste a fuller description or screenshot.";
    default:
      return (
        draft.warnings[0] ??
        "Not enough ingredients and steps found to save as a recipe."
      );
  }
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
      return "Photo";
    case "manual":
      return "Manual";
    default:
      return "Web";
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 140,
    gap: Spacing.lg,
  },
  hero: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    maxWidth: 340,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  importingWrap: {
    minHeight: 520,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.xxxl,
  },
  importingIcon: {
    width: 70,
    height: 70,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressCard: {
    width: "100%",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  progressFill: {
    width: "58%",
    height: "100%",
    borderRadius: Radius.full,
  },
  savedActions: {
    width: "100%",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statusText: {
    fontSize: 15,
    lineHeight: 21,
  },

  // Mode switcher
  modeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  modeButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  modeLabel: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    fontWeight: "700",
  },

  // Cards
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  listCard: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  listCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  listCountText: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    fontWeight: "700",
  },
  warningCard: {
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Individual list rows
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    flexShrink: 0,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  stepNumberText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  rowInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 2,
    paddingBottom: 2,
  },
  deleteButton: {
    paddingTop: 4,
    paddingLeft: Spacing.xs,
    flexShrink: 0,
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
  },
  addRowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  addRowText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    fontWeight: "700",
  },

  // Confidence badge
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    fontWeight: "700",
  },

  // Review header
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },

  // Meta grid
  metaGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  metaField: {
    flex: 1,
    gap: Spacing.sm,
  },

  // Input fields
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  smallTextArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: "top",
  },

  // Field label / hint
  fieldLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Source pill
  sourcePill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sourcePillText: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Paste
  pasteText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    fontWeight: "800",
  },

  // Photo picker
  photoPicker: {
    minHeight: 210,
    borderWidth: 1,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: 260,
  },
  photoEmpty: {
    flex: 1,
    minHeight: 210,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.xl,
  },

  // Field header
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },

  // Fallback
  fallbackHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  fallbackCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  fallbackActions: {
    gap: Spacing.sm,
  },

  // Message
  message: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },

  // Footer
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
});
