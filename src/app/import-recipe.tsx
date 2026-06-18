import {
  IconAlertCircle,
  IconArrowRight,
  IconChefHat,
  IconCheck,
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
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedCard } from "@/components/ui/themed-card";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { Fonts, Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  buildRecipeFromParsed,
  detectSourceType,
  getDraftInputValue,
  hasEnoughRecipeContent,
  isPlaceholderRecipeTitle,
  normalizeImportDraft,
  normalizeRouteMode,
} from "@/lib/recipe-import";
import { uploadRecipeImageSet } from "@/lib/recipe-image-upload";
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

type SavedRecipeTarget = {
  title: string;
  id: string;
  source: "account" | "guest";
};

// ─── Copy ────────────────────────────────────────────────────────────────────

const MODE_COPY: Record<
  ImportMode,
  { title: string; subtitle: string; inputLabel: string; placeholder: string }
> = {
  link: {
    title: "Importo nga linku",
    subtitle: "Ngjit një link nga web, YouTube, Instagram ose TikTok.",
    inputLabel: "Linku",
    placeholder: "https://...",
  },
  web: {
    title: "Importo nga web",
    subtitle: "Do të provojmë ta lexojmë recetën nga faqja.",
    inputLabel: "URL e faqes",
    placeholder: "https://faqja-recetave.com/...",
  },
  photo: {
    title: "Importo nga foto",
    subtitle: "Zgjidh një screenshot ose foto recete.",
    inputLabel: "Foto",
    placeholder: "",
  },
  text: {
    title: "Importo nga tekst",
    subtitle: "Ngjit caption, mesazh WhatsApp ose shënim me përbërës dhe hapa.",
    inputLabel: "Teksti i recetës",
    placeholder: "Përbërësit...\n\nHapat...",
  },
  manual: {
    title: "Shkruaj recetë",
    subtitle: "Shkruaje vetë dhe rishikoje para ruajtjes.",
    inputLabel: "Receta",
    placeholder: "Titulli\n\nPërbërësit...\n\nHapat...",
  },
  share: {
    title: "Importo nga shpërndarja",
    subtitle: "Do ta analizojmë pa e ruajtur automatikisht.",
    inputLabel: "Përmbajtja e shpërndarë",
    placeholder: "",
  },
};

// ─── Small helpers ───────────────────────────────────────────────────────────

function rowsFromText(text: string): EditableRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      id: `${index}_${line.slice(0, 14)}_${Math.random().toString(36).slice(2, 6)}`,
      text: line,
    }));
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
    ...normalizeImportDraft({
      mode,
      value: "",
      status: "idle",
    }),
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
    rawContent: {
      ...draft.rawContent,
      caption: sourceText,
    },
    warnings: [],
  };
}

function buildDraftFromInput({
  mode,
  sourceValue,
  imageUri,
  status,
  extraText,
}: {
  mode: ImportMode;
  sourceValue: string;
  imageUri?: string;
  status: ImportDraft["status"];
  extraText?: string;
}): ImportDraft {
  const value = [sourceValue, extraText]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join("\n\n");

  return normalizeImportDraft({
    mode,
    value,
    imageUri,
    status,
  });
}

function buildEditedRecipe(
  base: ParsedRecipe | null,
  title: string,
  description: string,
  ingredientRows: EditableRow[],
  stepRows: EditableRow[],
  servingsText: string,
  prepTimeText: string,
  cookTimeText: string,
  tipsText: string,
): ParsedRecipe | null {
  if (!base) return null;

  const ingredients = ingredientRows
    .map((row, index) => {
      const original = base.ingredients[index];
      const text = row.text.trim();

      if (!text) return null;

      return {
        ...(original ?? {}),
        text,
        confidence: original?.confidence ?? base.confidence ?? "medium",
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const steps = stepRows.map((row) => row.text.trim()).filter(Boolean);
  const servings = parseOptionalPositiveNumber(servingsText);
  const prepTimeMinutes = parseOptionalPositiveNumber(prepTimeText);
  const cookTimeMinutes = parseOptionalPositiveNumber(cookTimeText);
  const tips = tipsText
    .split(/\r?\n/)
    .map((tip) => tip.trim())
    .filter(Boolean);

  return {
    ...base,
    title: title.trim() || base.title,
    ...(description.trim() ? { description: description.trim() } : {}),
    ingredients,
    steps,
    ...(tips.length > 0 ? { tips } : {}),
    ...(servings ? { servings } : {}),
    ...(prepTimeMinutes ? { prepTimeMinutes } : {}),
    ...(cookTimeMinutes ? { cookTimeMinutes } : {}),
    language: "sq",
    tags: base.tags ?? [],
    ambiguityNotes: base.ambiguityNotes ?? [],
    needsUserReview: true,
    confidence: base.confidence ?? "medium",
  };
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
  const generateImageUploadUrl = useMutation(api.recipes.generateImageUploadUrl);
  const addGuestRecipe = useGuestStore((state) => state.addRecipe);
  const guestId = useGuestStore((state) => state.guestId);

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
  const [tipsText, setTipsText] = useState(
    initialDraft.parsedRecipe?.tips?.join("\n") ?? "",
  );

  const [message, setMessage] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedRecipe, setSavedRecipe] = useState<SavedRecipeTarget | null>(
    null,
  );
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
        tipsText,
      ),
    [
      cookTimeText,
      description,
      ingredientRows,
      prepTimeText,
      reviewRecipe,
      servingsText,
      stepRows,
      tipsText,
      title,
    ],
  );

  const canSave = Boolean(editedRecipe && hasEnoughRecipeContent(editedRecipe));
  const shouldShowImporting =
    !savedRecipe &&
    !isReadyForReview &&
    (parsing ||
      activeDraft.status === "extracting" ||
      (Boolean(storeDraft) &&
        activeDraft.status === "receiving" &&
        autoParsedDraftId !== storeDraft?.id));

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

  const runParse = useCallback(
    async (draftOverride?: ImportDraft, supplementalText?: string) => {
      let nextDraft =
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
        setMessage("Shto një link, tekst ose foto për importim.");
        return;
      }

      setParsing(true);
      setMessage(null);
      setActiveDraft({ ...nextDraft, status: "extracting" });
      patchStoreDraft({ ...nextDraft, status: "extracting" });

      try {
        if (nextDraft.imageUri && !nextDraft.imageStorageId) {
          const uploaded = await uploadRecipeImageSet(
            nextDraft.imageUri,
            generateImageUploadUrl,
          );

          nextDraft = {
            ...nextDraft,
            ...uploaded,
          };

          setActiveDraft({ ...nextDraft, status: "extracting" });
          patchStoreDraft({ ...nextDraft, status: "extracting" });
        }

        const result = await parseImport({
          sourceType: nextDraft.sourceType,
          ...(token ? { token } : {}),
          ...(!token ? { guestId } : {}),
          ...(nextDraft.mode ? { mode: nextDraft.mode } : {}),
          ...(nextDraft.sourceUrl ? { sourceUrl: nextDraft.sourceUrl } : {}),
          ...(nextDraft.sourceText ? { sourceText: nextDraft.sourceText } : {}),
          ...(nextDraft.imageUri ? { imageUri: nextDraft.imageUri } : {}),
          ...(nextDraft.imageStorageId ? { imageStorageId: nextDraft.imageStorageId as any } : {}),
          ...(nextDraft.thumbnailStorageId ? { thumbnailStorageId: nextDraft.thumbnailStorageId as any } : {}),
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
              : "Nuk mund ta analizonim importin tani.",
          ],
        };

        setActiveDraft(failedDraft);
        patchStoreDraft(failedDraft);
        setMessage(failedDraft.warnings[0]);
      } finally {
        setParsing(false);
      }
    },
    [extraText, generateImageUploadUrl, guestId, imageUri, mode, parseImport, patchStoreDraft, sourceValue, token],
  );

  useEffect(() => {
    if (!storeDraft || autoParsedDraftId === storeDraft.id) return;
    if (!storeDraft.sourceUrl && !storeDraft.sourceText && !storeDraft.imageUri)
      return;
    if (
      storeDraft.status === "ready_for_review" ||
      storeDraft.status === "needs_input" ||
      storeDraft.status === "failed"
    ) {
      return;
    }

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

  const pasteFromClipboard = async () => {
    Haptics.selectionAsync();
    setMessage(null);

    try {
      const url = await Clipboard.getUrlAsync().catch(() => null);
      const text = url ?? (await Clipboard.getStringAsync());

      if (!text?.trim()) {
        setMessage("Nuk u gjet asgjë në clipboard.");
        return;
      }

      const nextMode = extractModeFromValue(text);
      setMode(nextMode);
      setSourceValue(text);
      setImageUri(undefined);
      setActiveDraft(normalizeImportDraft({ mode: nextMode, value: text }));
      applyParsedRecipe(null);
    } catch {
      setMessage("Nuk mund ta lexonim clipboard-in.");
    }
  };

  const applyPickedPhoto = async (uri: string) => {
    if (reviewRecipe && activeDraft.status === "ready_for_review") {
      const localPreviewDraft: ImportDraft = {
        ...activeDraft,
        imageUri: uri,
        imageUrl: uri,
        imageThumbnailUrl: uri,
        status: "ready_for_review",
      };

      setImageUri(uri);
      setActiveDraft(localPreviewDraft);
      patchStoreDraft(localPreviewDraft);
      setParsing(true);
      setMessage(null);

      try {
        const uploaded = await uploadRecipeImageSet(uri, generateImageUploadUrl);
        const nextDraft: ImportDraft = {
          ...localPreviewDraft,
          ...uploaded,
          status: "ready_for_review",
        };

        setActiveDraft(nextDraft);
        patchStoreDraft(nextDraft);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Nuk mundëm ta ngarkonim foton.",
        );
      } finally {
        setParsing(false);
      }
      return;
    }

    setMode("photo");
    setImageUri(uri);
    setSourceValue("");
    setActiveDraft(normalizeImportDraft({ mode: "photo", imageUri: uri }));
    applyParsedRecipe(null);
  };

  const pickPhotoFromLibrary = async () => {
    Haptics.selectionAsync();
    setMessage(null);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.86,
      allowsEditing: false,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    await applyPickedPhoto(asset.uri);
  };

  const takeRecipePhoto = async () => {
    Haptics.selectionAsync();
    setMessage(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setMessage("Lejo kamerën për të fotografuar recetën.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.86,
      allowsEditing: false,
    });

    if (result.canceled) return;

    await applyPickedPhoto(result.assets[0].uri);
  };

  const choosePhoto = async () => {
    Alert.alert("Shto foto", "Zgjidh një screenshot ose fotografo recetën.", [
      { text: "Galeria", onPress: () => void pickPhotoFromLibrary() },
      { text: "Kamera", onPress: () => void takeRecipePhoto() },
      { text: "Anulo", style: "cancel" },
    ]);
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
      imageStorageId: undefined,
      thumbnailStorageId: undefined,
      imageUrl: undefined,
      imageThumbnailUrl: undefined,
      status: "extracting",
      warnings: [],
    };

    setImageUri(asset.uri);
    setActiveDraft(nextDraft);
    patchStoreDraft(nextDraft);
    setShowSupplementalInput(false);
    runParse(nextDraft);
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

  const continueWithoutImage = () => {
    if (!activeDraft.parsedRecipe) {
      setMessage("Nuk arritëm ta lexojmë mirë recetën.");
      return;
    }

    const nextDraft: ImportDraft = {
      ...activeDraft,
      status: "ready_for_review",
      warnings: activeDraft.warnings ?? [],
    };

    setActiveDraft(nextDraft);
    patchStoreDraft(nextDraft);
    applyParsedRecipe(activeDraft.parsedRecipe);
  };

  const saveRecipe = async () => {
    if (!editedRecipe || !canSave || saving) return;

    setSaving(true);
    setMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let draftForSave = activeDraft;

      if (
        draftForSave.imageUri &&
        (!draftForSave.imageStorageId || !draftForSave.thumbnailStorageId)
      ) {
        const uploaded = await uploadRecipeImageSet(
          draftForSave.imageUri,
          generateImageUploadUrl,
        );

        draftForSave = {
          ...draftForSave,
          ...uploaded,
          imageUrl: draftForSave.imageUrl ?? draftForSave.imageUri,
          imageThumbnailUrl:
            draftForSave.imageThumbnailUrl ?? draftForSave.imageUri,
        };

        setActiveDraft(draftForSave);
        patchStoreDraft(draftForSave);
      }

      const recipe = buildRecipeFromParsed({
        draft: draftForSave,
        parsedRecipe: editedRecipe,
      });

      if (isAuthenticated && token) {
        const shouldPersistImageUrl =
          recipe.imageUrl &&
          !recipe.imageUrl.startsWith("file:") &&
          !recipe.imageStorageId &&
          !recipe.thumbnailStorageId;
        const shouldPersistThumbnailUrl =
          recipe.imageThumbnailUrl &&
          !recipe.imageThumbnailUrl.startsWith("file:") &&
          !recipe.thumbnailStorageId;
        const recipeId = await createRecipe({
          token,
          title: recipe.title,
          ...(recipe.description ? { description: recipe.description } : {}),
          sourceType: recipe.sourceType,
          ...(recipe.sourcePlatform ? { sourcePlatform: recipe.sourcePlatform } : {}),
          ...(recipe.sourceUrl ? { sourceUrl: recipe.sourceUrl } : {}),
          ...(recipe.sourceText ? { sourceText: recipe.sourceText } : {}),
          ...(recipe.sourceTitle ? { sourceTitle: recipe.sourceTitle } : {}),
          ...(recipe.sourceAuthor ? { sourceAuthor: recipe.sourceAuthor } : {}),
          ...(recipe.sourceThumbnailUrl ? { sourceThumbnailUrl: recipe.sourceThumbnailUrl } : {}),
          ...(shouldPersistImageUrl ? { imageUrl: recipe.imageUrl } : {}),
          ...(shouldPersistThumbnailUrl ? { imageThumbnailUrl: recipe.imageThumbnailUrl } : {}),
          ...(recipe.imageStorageId ? { imageStorageId: recipe.imageStorageId as any } : {}),
          ...(recipe.thumbnailStorageId ? { thumbnailStorageId: recipe.thumbnailStorageId as any } : {}),
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          ...(recipe.tips ? { tips: recipe.tips } : {}),
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
          extractionConfidence: editedRecipe.confidence,
          extractionWarnings: [
            ...(editedRecipe.warnings ?? []),
            ...(editedRecipe.missingInfo ?? []),
            ...(editedRecipe.ambiguityNotes ?? []),
          ],
          needsUserReview: editedRecipe.needsUserReview,
          importConfidence: editedRecipe.confidence,
        });

        setSavedRecipe({
          title: recipe.title,
          id: String(recipeId),
          source: "account",
        });
      } else {
        const localId = addGuestRecipe({
          ...recipe,
          ...(recipe.imageUrl || draftForSave.imageUri
            ? { imageUrl: recipe.imageUrl ?? draftForSave.imageUri }
            : {}),
          ...(recipe.imageThumbnailUrl || draftForSave.imageUri
            ? { imageThumbnailUrl: recipe.imageThumbnailUrl ?? draftForSave.imageUri }
            : {}),
        });
        setSavedRecipe({
          title: recipe.title,
          id: localId,
          source: "guest",
        });
      }

      clearDraft();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nuk mund ta ruanim recetën tani.",
      );
    } finally {
      setSaving(false);
    }
  };

  function applyParsedRecipe(parsed: ParsedRecipe | null) {
    setReviewRecipe(parsed);
    setTitle(parsed?.title ?? "");
    setDescription(parsed?.description ?? "");
    setIngredientRows(
      rowsFromText(
        parsed?.ingredients.map((ingredient) => ingredient.text).join("\n") ??
          "",
      ),
    );
    setStepRows(rowsFromText(parsed?.steps.join("\n") ?? ""));
    setServingsText(parsed?.servings?.toString() ?? "");
    setPrepTimeText(parsed?.prepTimeMinutes?.toString() ?? "");
    setCookTimeText(parsed?.cookTimeMinutes?.toString() ?? "");
    setTipsText(parsed?.tips?.join("\n") ?? "");
  }

  if (isShareIntentEntry && !shareFallbackReady) {
    return <ShareIntentLoadingScreen />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isReadyForReview ? "Rishiko recetën" : "Importo recetë",
          headerBackTitle: "Prapa",
          headerShadowVisible: false,
          headerTintColor: theme.textPrimary,
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTitleStyle: {
            fontFamily: Fonts.bold,
            fontSize: 17,
          },
        }}
      />

      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.content}
          >
            {savedRecipe ? (
              <SavedCard
                title={savedRecipe.title}
                source={savedRecipe.source}
                onView={() =>
                  router.replace({
                    pathname: "/recipe/[id]",
                    params: {
                      id: savedRecipe.id,
                      source: savedRecipe.source,
                    },
                  } as any)
                }
                onBack={() => router.back()}
              />
            ) : shouldShowImporting ? (
              <ImportingPanel draft={activeDraft} />
            ) : isReadyForReview ? null : (
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
                  {copy.title}
                </ThemedText>

                <ThemedText
                  color="secondary"
                  align="center"
                  style={styles.subtitle}
                >
                  {copy.subtitle}
                </ThemedText>
              </ThemedView>
            )}

            {!savedRecipe && !shouldShowImporting && isReadyForReview ? (
              <ReviewForm
                title={title}
                description={description}
                ingredientRows={ingredientRows}
                stepRows={stepRows}
                servingsText={servingsText}
                prepTimeText={prepTimeText}
              cookTimeText={cookTimeText}
              tipsText={tipsText}
              draft={activeDraft}
              parsed={reviewRecipe}
              onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                onIngredientRowsChange={setIngredientRows}
                onStepRowsChange={setStepRows}
                onServingsChange={setServingsText}
              onPrepTimeChange={setPrepTimeText}
              onCookTimeChange={setCookTimeText}
              onTipsChange={setTipsText}
              onChangeImage={choosePhoto}
            />
            ) : null}

            {!savedRecipe && !shouldShowImporting && !isReadyForReview ? (
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

                <ThemedCard
                  style={[
                    styles.inputCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.borderLight,
                    },
                  ]}
                >
                  <ThemedView transparent style={styles.fieldHeader}>
                    <FieldLabel label={copy.inputLabel} />

                    {mode !== "photo" ? (
                      <Pressable onPress={pasteFromClipboard} hitSlop={10}>
                        <ThemedText
                          style={[styles.pasteText, { color: theme.primary }]}
                        >
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
                          backgroundColor: theme.paper,
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
                      Burimi: {sourceLabel(sourceType)}
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
                  onContinueWithoutImage={continueWithoutImage}
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

          {!savedRecipe && !shouldShowImporting ? (
            <ThemedView transparent style={styles.footer}>
              {isReadyForReview ? (
                <ThemedButton
                  title="Ruaj recetën"
                  onPress={saveRecipe}
                  disabled={!canSave}
                  loading={saving}
                  leftIcon={
                    <IconCheck size={19} color="#FFFFFF" strokeWidth={3} />
                  }
                />
              ) : (
                <ThemedButton
                  title="Analizo recetën"
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
    </>
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
  tipsText,
  draft,
  parsed,
  onTitleChange,
  onDescriptionChange,
  onIngredientRowsChange,
  onStepRowsChange,
  onServingsChange,
  onPrepTimeChange,
  onCookTimeChange,
  onTipsChange,
  onChangeImage,
}: {
  title: string;
  description: string;
  ingredientRows: EditableRow[];
  stepRows: EditableRow[];
  servingsText: string;
  prepTimeText: string;
  cookTimeText: string;
  tipsText: string;
  draft: ImportDraft;
  parsed: ParsedRecipe;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onIngredientRowsChange: (rows: EditableRow[]) => void;
  onStepRowsChange: (rows: EditableRow[]) => void;
  onServingsChange: (value: string) => void;
  onPrepTimeChange: (value: string) => void;
  onCookTimeChange: (value: string) => void;
  onTipsChange: (value: string) => void;
  onChangeImage: () => void;
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
      <Pressable onPress={onChangeImage}>
      <ThemedCard
        style={[
          styles.reviewImageCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.borderLight,
          },
        ]}
      >
        {draft.imageThumbnailUrl || draft.imageUrl || draft.imageUri ? (
          <Image
            source={{ uri: draft.imageThumbnailUrl ?? draft.imageUrl ?? draft.imageUri }}
            style={styles.reviewImage}
            contentFit="cover"
          />
        ) : (
          <ThemedView
            style={[
              styles.reviewImagePlaceholder,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <IconChefHat size={46} color={theme.primary} strokeWidth={2.1} />
            <ThemedText style={styles.reviewImagePlaceholderText} color="secondary">
              Shto foto
            </ThemedText>
          </ThemedView>
        )}
      </ThemedCard>
      </Pressable>

      <ThemedCard
        style={[
          styles.reviewMetaCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.borderLight,
          },
        ]}
      >
        <ThemedView transparent style={styles.formCardHeader}>
          <ThemedText type="cardTitle">Detajet e recetës</ThemedText>
          <ConfidenceBadge confidence={parsed.confidence} />
        </ThemedView>

        <FieldLabel label="Titulli" />

        <TextInput
          value={title}
          onChangeText={onTitleChange}
          placeholder="Titulli i recetës"
          placeholderTextColor={theme.textTertiary}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          style={[
            styles.input,
            styles.whiteInput,
            {
              color: theme.text,
              borderColor: theme.border,
              backgroundColor: theme.paper,
            },
          ]}
        />

        {isPlaceholderRecipeTitle(title) ? (
          <ThemedText color="secondary" style={styles.hintText}>
            Shto një titull më të qartë para ruajtjes.
          </ThemedText>
        ) : null}

        <FieldLabel label="Përshkrimi" />

        <TextInput
          value={description}
          onChangeText={onDescriptionChange}
          placeholder="Përshkrim i shkurtër"
          placeholderTextColor={theme.textTertiary}
          multiline
          scrollEnabled={false}
          style={[
            styles.input,
            styles.smallTextArea,
            styles.whiteInput,
            {
              color: theme.text,
              borderColor: theme.border,
              backgroundColor: theme.paper,
            },
          ]}
        />

        {showTimingFields ? (
          <ThemedView transparent style={styles.metaGrid}>
            <ThemedView transparent style={styles.metaField}>
              <FieldLabel label="Porcione" />

              <TextInput
                value={servingsText}
                onChangeText={onServingsChange}
                keyboardType="number-pad"
                placeholder="4"
                placeholderTextColor={theme.textTertiary}
                style={[
                  styles.input,
                  styles.compactInput,
                  styles.whiteInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.paper,
                  },
                ]}
              />
            </ThemedView>

            <ThemedView transparent style={styles.metaField}>
              <FieldLabel label="Përgatitje" />

              <TextInput
                value={prepTimeText}
                onChangeText={onPrepTimeChange}
                keyboardType="number-pad"
                placeholder="15"
                placeholderTextColor={theme.textTertiary}
                style={[
                  styles.input,
                  styles.compactInput,
                  styles.whiteInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.paper,
                  },
                ]}
              />
            </ThemedView>

            <ThemedView transparent style={styles.metaField}>
              <FieldLabel label="Gatim" />

              <TextInput
                value={cookTimeText}
                onChangeText={onCookTimeChange}
                keyboardType="number-pad"
                placeholder="30"
                placeholderTextColor={theme.textTertiary}
                style={[
                  styles.input,
                  styles.compactInput,
                  styles.whiteInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.paper,
                  },
                ]}
              />
            </ThemedView>
          </ThemedView>
        ) : null}
      </ThemedCard>

      <EditableListSection
        label="Përbërësit"
        rows={ingredientRows}
        onChange={onIngredientRowsChange}
        addPlaceholder="Shto përbërës"
        rowPlaceholder="p.sh. 200 g miell"
        numbered={false}
      />

      <EditableListSection
        label="Hapat"
        rows={stepRows}
        onChange={onStepRowsChange}
        addPlaceholder="Shto hap"
        rowPlaceholder="p.sh. Përzieji derisa masa të bëhet homogjene"
        numbered
      />

      <ThemedCard
        style={[
          styles.reviewMetaCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.borderLight,
          },
        ]}
      >
        <FieldLabel label="Këshilla" />
        <TextInput
          value={tipsText}
          onChangeText={onTipsChange}
          placeholder="Shto këshilla, nga një për rresht"
          placeholderTextColor={theme.textTertiary}
          multiline
          scrollEnabled={false}
          style={[
            styles.input,
            styles.smallTextArea,
            styles.whiteInput,
            {
              color: theme.text,
              borderColor: theme.border,
              backgroundColor: theme.paper,
            },
          ]}
        />
      </ThemedCard>

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

            <ThemedText type="smallBold">Kontrolloji këto</ThemedText>
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

function EditableListSection({
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
    onChange(rows.map((row) => (row.id === id ? { ...row, text } : row)));
  };

  const deleteRow = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(rows.filter((row) => row.id !== id));
  };

  const addRow = () => {
    Haptics.selectionAsync();
    onChange([...rows, { id: makeId(), text: "" }]);
  };

  return (
    <ThemedView transparent style={styles.editSection}>
      <ThemedView transparent style={styles.editSectionHeader}>
        <ThemedText type="cardTitle">{label}</ThemedText>

        <ThemedText color="secondary" style={styles.listCountText}>
          {rows.length}
        </ThemedText>
      </ThemedView>

      <ThemedView transparent style={styles.editRows}>
        {rows.map((row, index) => (
          <ThemedView
            key={row.id}
            style={[
              numbered ? styles.stepRowCard : styles.ingredientRowCard,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.borderLight,
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
              scrollEnabled={false}
              style={[
                numbered ? styles.stepInput : styles.rowInput,
                { color: theme.text },
              ]}
            />

            <TouchableOpacity
              onPress={() => deleteRow(row.id)}
              hitSlop={12}
              style={styles.deleteButton}
            >
              <IconX size={18} color={theme.textTertiary} strokeWidth={2.5} />
            </TouchableOpacity>
          </ThemedView>
        ))}
      </ThemedView>

      {rows.length === 0 ? (
        <ThemedView
          style={[
            styles.emptyState,
            {
              borderColor: theme.border,
              backgroundColor: theme.paper,
            },
          ]}
        >
          <ThemedText
            color="secondary"
            align="center"
            style={styles.emptyStateText}
          >
            Ende nuk ka {label.toLowerCase()}. Shto një më poshtë.
          </ThemedText>
        </ThemedView>
      ) : null}

      <TouchableOpacity
        onPress={addRow}
        style={[
          styles.addRowButton,
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}
        activeOpacity={0.7}
      >
        <IconPlus size={16} color={theme.primary} strokeWidth={2.5} />

        <ThemedText style={[styles.addRowText, { color: theme.primary }]}>
          {addPlaceholder}
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

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
      ? "Besueshmëri e lartë"
      : confidence === "medium"
        ? "Duhet kontrolluar"
        : "Kontroll i nevojshëm";

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
      label: "Foto",
      icon: <IconPhoto size={16} color={theme.primary} />,
    },
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

function PhotoPicker({
  imageUri,
  onPress,
}: {
  imageUri?: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.photoPicker,
        {
          borderColor: theme.border,
          backgroundColor: theme.paper,
        },
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.photoPreview}
          contentFit="cover"
        />
      ) : (
        <>
          <IconPhoto size={32} color={theme.primary} strokeWidth={2.2} />
          <ThemedText type="cardTitle">Zgjidh foto</ThemedText>
          <ThemedText color="secondary" align="center">
            Screenshot ose foto recete
          </ThemedText>
        </>
      )}
    </TouchableOpacity>
  );
}

function FallbackCard({
  draft,
  extraText,
  showTextInput,
  onShowTextInput,
  onExtraTextChange,
  onRetry,
  onUploadScreenshot,
  onContinueWithoutImage,
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
  onContinueWithoutImage: () => void;
  onCancel: () => void;
  parsing: boolean;
}) {
  const theme = useTheme();
  const isMissingImage = draft.needsInputReason === "NO_IMAGE_AVAILABLE";

  return (
    <ThemedCard
      style={[
        styles.warningCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.borderLight,
        },
      ]}
    >
      <ThemedView transparent style={styles.fallbackHeader}>
        <IconAlertCircle
          size={22}
          color={theme.textSecondary}
          strokeWidth={2.4}
        />

        <ThemedView transparent style={styles.fallbackCopy}>
          <ThemedText type="cardTitle">
            Na duhen pak më shumë të dhëna
          </ThemedText>
          <ThemedText selectable color="secondary" style={styles.statusText}>
            {fallbackMessageForDraft(draft)}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {showTextInput ? (
        <>
          <FieldLabel label="Përshkrimi ose caption-i" />
          <TextInput
            value={extraText}
            onChangeText={onExtraTextChange}
            placeholder="Përbërësit dhe hapat..."
            placeholderTextColor={theme.textTertiary}
            multiline
            scrollEnabled={false}
            style={[
              styles.input,
              styles.textArea,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.paper,
              },
            ]}
          />

          <ThemedButton
            title="Analizo përsëri"
            onPress={onRetry}
            disabled={!extraText.trim() || parsing}
            loading={parsing}
            variant="secondary"
          />
        </>
      ) : null}

      <ThemedView transparent style={styles.fallbackActions}>
        {isMissingImage ? null : (
          <ThemedButton
            title="Ngjit përshkrimin"
            onPress={onShowTextInput}
            variant={showTextInput ? "ghost" : "secondary"}
          />
        )}
        <ThemedButton
          title="Shto screenshot"
          onPress={onUploadScreenshot}
          variant={isMissingImage ? "secondary" : "outline"}
        />
        {isMissingImage ? (
          <ThemedButton
            title="Vazhdo pa foto"
            onPress={onContinueWithoutImage}
            variant="outline"
          />
        ) : (
          <ThemedButton title="Anulo" onPress={onCancel} variant="ghost" />
        )}
      </ThemedView>
    </ThemedCard>
  );
}

function ImportingPanel({ draft }: { draft: ImportDraft }) {
  return (
    <ThemedView transparent style={styles.importingWrap}>
      <LoadingIllustration />

      <ThemedView transparent style={styles.loadingTextBlock}>
        <ThemedText
          type="cardTitle"
          align="center"
          style={styles.importingTitle}
        >
          Duke importuar...
        </ThemedText>

        <ThemedText
          color="secondary"
          align="center"
          style={styles.loadingSubtitle}
        >
          {importingSubtitle(draft)}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function LoadingIllustration() {
  const [floatAnim] = useState(() => new Animated.Value(0));
  const [rotateAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1250,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1250,
          useNativeDriver: true,
        }),
      ]),
    );

    const rotateLoop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 4200,
        useNativeDriver: true,
      }),
    );

    floatLoop.start();
    rotateLoop.start();

    return () => {
      floatLoop.stop();
      rotateLoop.stop();
    };
  }, [floatAnim, rotateAnim]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.illustrationWrap}>
      <Animated.View
        style={[
          styles.illustrationLeaf,
          {
            transform: [{ translateY }, { rotate: "3deg" }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.illustrationMango,
          {
            transform: [{ translateY }, { rotate: "-8deg" }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.illustrationLemon,
          {
            transform: [{ translateY }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.illustrationPasta,
          {
            transform: [{ translateY }, { rotate: "4deg" }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.illustrationSpark,
          {
            transform: [{ rotate }],
          },
        ]}
      >
        <IconSparkles size={36} color="#9B4DE0" strokeWidth={2.8} />
      </Animated.View>
    </View>
  );
}

function ShareIntentLoadingScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ThemedView transparent style={styles.loadingWrap}>
          <LoadingIllustration />

          <ThemedText
            type="cardTitle"
            align="center"
            style={styles.importingTitle}
          >
            Duke importuar...
          </ThemedText>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

function SavedCard({
  title,
  source,
  onView,
  onBack,
}: {
  title: string;
  source: "account" | "guest";
  onView: () => void;
  onBack: () => void;
}) {
  const theme = useTheme();

  return (
    <ThemedView transparent style={styles.savedWrap}>
      <ThemedView transparent style={styles.savedIllustration}>
        <LoadingIllustration />

        <ThemedView
          style={[
            styles.savedCheck,
            {
              backgroundColor: theme.primary,
              borderColor: theme.background,
            },
          ]}
        >
          <IconCheck size={25} color="#FFFFFF" strokeWidth={3.2} />
        </ThemedView>
      </ThemedView>

      <ThemedText type="h2" align="center">
        Receta u ruajt me sukses.
      </ThemedText>

      <ThemedText
        color="secondary"
        align="center"
        numberOfLines={3}
        style={styles.savedSubtitle}
      >
        {title}
      </ThemedText>

      <ThemedView transparent style={styles.savedActions}>
        <ThemedButton
          title="Shiko recetën"
          onPress={onView}
          rightIcon={
            <IconArrowRight size={18} color="#FFFFFF" strokeWidth={2.6} />
          }
        />

        <ThemedButton
          title={source === "guest" ? "Kthehu te recetat" : "Kthehu"}
          onPress={onBack}
          variant="ghost"
        />
      </ThemedView>
    </ThemedView>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <ThemedText color="secondary" style={styles.fieldLabel}>
      {label}
    </ThemedText>
  );
}

function importingSubtitle(draft: ImportDraft) {
  switch (draft.sourceType) {
    case "instagram":
    case "tiktok":
      return "Po lexojmë linkun dhe përshkrimin nëse është i disponueshëm.";
    case "youtube":
      return "Po kontrollojmë titullin dhe përshkrimin.";
    case "photo":
      return "Po përgatisim foton për analizë.";
    default:
      return "Po lexojmë faqen e recetës.";
  }
}

function fallbackMessageForDraft(draft: ImportDraft) {
  switch (draft.needsInputReason) {
    case "ONLY_BARE_SOCIAL_URL":
    case "NO_CAPTION_TEXT":
      return "Ky link nuk dha mjaft tekst. Ngjit përshkrimin e videos ose ngarko një screenshot.";
    case "NOT_RECIPE_LIKE":
      return "E lexuam linkun, por nuk gjetëm përbërës ose hapa. Ngjit përshkrimin ose një screenshot.";
    case "SOCIAL_PLATFORM_BLOCKED":
      return "Platforma nuk lejoi lexim të plotë. Ngjit përshkrimin ose ngarko një screenshot.";
    case "SOCIAL_SCRAPER_NOT_CONFIGURED":
      return "Leximi automatik për këtë platformë nuk është aktivizuar ende. Ngjit përshkrimin ose ngarko një screenshot.";
    case "SOCIAL_SCRAPER_FAILED":
      return "Nuk arritëm ta lexojmë postimin automatikisht. Ngjit përshkrimin ose ngarko një screenshot.";
    case "AI_PARSE_FAILED":
      return "Gjetëm tekst, por nuk arritëm ta kthejmë në recetë. Ngjit një përshkrim më të plotë ose screenshot.";
    default:
      return (
        draft.warnings[0] ??
        "Nuk u gjetën mjaft përbërës dhe hapa për ta ruajtur si recetë."
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
      return "Foto";
    case "manual":
      return "Manuale";
    default:
      return "Web";
  }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
    paddingBottom: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 142,
    gap: Spacing.xl,
  },
  hero: {
    alignItems: "center",
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  heroIcon: {
    width: 70,
    height: 70,
    borderRadius: Radius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
  },
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
  inputCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
    borderRadius: Radius.xxl,
    borderWidth: 1,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pasteText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    fontWeight: "700",
  },
  fieldLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 22,
  },
  whiteInput: {
    shadowColor: "transparent",
  },
  textArea: {
    minHeight: 150,
    textAlignVertical: "top",
  },
  smallTextArea: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  compactInput: {
    minHeight: 54,
    fontFamily: Fonts.medium,
    fontSize: 18,
  },
  sourcePill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  sourcePillText: {
    fontSize: 13,
    lineHeight: 18,
  },
  photoPicker: {
    minHeight: 220,
    borderWidth: 1,
    borderRadius: Radius.xxl,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: 260,
  },
  reviewImageCard: {
    padding: 0,
    borderWidth: 1,
    borderRadius: Radius.xxl,
    overflow: "hidden",
  },
  reviewImage: {
    width: "100%",
    aspectRatio: 1.35,
  },
  reviewImagePlaceholder: {
    width: "100%",
    aspectRatio: 1.35,
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  reviewImagePlaceholderText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
  reviewImageActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  reviewImageActionButton: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },
  formCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  reviewMetaCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.xxl,
  },
  confidenceBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },
  confidenceText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    fontWeight: "700",
  },
  hintText: {
    fontSize: 13,
    lineHeight: 19,
  },
  metaGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  metaField: {
    flex: 1,
    gap: Spacing.xs,
  },
  editSection: {
    gap: Spacing.md,
  },
  editSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listCountText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    fontWeight: "700",
  },
  editRows: {
    gap: Spacing.sm,
  },
  ingredientRowCard: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  stepRowCard: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  rowInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 23,
    paddingTop: 0,
    paddingBottom: 0,
  },
  stepInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    paddingTop: 0,
    paddingBottom: 0,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 9,
    flexShrink: 0,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    flexShrink: 0,
  },
  stepNumberText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  deleteButton: {
    paddingTop: 3,
    paddingLeft: Spacing.xs,
    flexShrink: 0,
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    lineHeight: 20,
  },
  addRowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  addRowText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    fontWeight: "700",
  },
  warningCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.xxl,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 21,
  },
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
  statusText: {
    fontSize: 14,
    lineHeight: 21,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  importingWrap: {
    minHeight: 560,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  loadingTextBlock: {
    alignItems: "center",
    gap: Spacing.sm,
    width: "100%",
  },
  importingTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  loadingSubtitle: {
    maxWidth: 300,
    fontSize: 15,
    lineHeight: 22,
  },
  illustrationWrap: {
    width: 180,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationLeaf: {
    position: "absolute",
    left: 58,
    top: 18,
    width: 62,
    height: 60,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 42,
    borderBottomLeftRadius: 14,
    backgroundColor: "#9BD456",
  },
  illustrationMango: {
    position: "absolute",
    right: 26,
    top: 72,
    width: 76,
    height: 64,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 34,
    borderBottomRightRadius: 44,
    borderBottomLeftRadius: 28,
    backgroundColor: "#FFA86A",
  },
  illustrationLemon: {
    position: "absolute",
    left: 34,
    bottom: 20,
    width: 66,
    height: 82,
    borderRadius: 40,
    backgroundColor: "#FFD51F",
    transform: [{ rotate: "-14deg" }],
  },
  illustrationPasta: {
    position: "absolute",
    right: 46,
    bottom: 12,
    width: 62,
    height: 42,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 26,
    backgroundColor: "#4D8DDF",
  },
  illustrationSpark: {
    position: "absolute",
    right: 40,
    top: 28,
  },
  savedWrap: {
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.md,
    gap: Spacing.lg,
    alignItems: "center",
  },
  savedIllustration: {
    width: 230,
    height: 210,
    alignItems: "center",
    justifyContent: "center",
  },
  savedCheck: {
    position: "absolute",
    right: 38,
    bottom: 34,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  savedSubtitle: {
    maxWidth: 300,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
  },
  savedActions: {
    width: "100%",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  message: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 14,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
});
