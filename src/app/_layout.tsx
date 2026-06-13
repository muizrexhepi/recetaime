import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { colors, Colors, Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { normalizeImportDraft } from "@/lib/recipe-import";
import { getShareIntentMeta } from "@/lib/share-intent-meta";
import { AuthProvider, useAuth } from "@/providers/auth-provider";
import { ConvexProvider } from "@/providers/convex-provider";
import { useGuestStore } from "@/stores/guest-store";
import { useImportDraftStore } from "@/stores/import-draft-store";

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  const { isLoading, isAuthenticated, user } = useAuth();

  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();

  const setImportDraft = useImportDraftStore((state) => state.setDraft);

  const guestOnboardingCompleted = useGuestStore(
    (state) => state.onboardingCompleted,
  );

  const isOnboarding = pathname.startsWith("/onboarding");
  const isImporting = pathname.startsWith("/import-recipe");

  const onboardingComplete =
    (isAuthenticated && user?.onboardingCompleted) || guestOnboardingCompleted;

  useEffect(() => {
    if (!hasShareIntent || !onboardingComplete) return;

    const firstFile = shareIntent.files?.[0];
    const isImage = firstFile?.mimeType?.startsWith("image/");
    const meta = getShareIntentMeta(shareIntent.meta);

    const value = [shareIntent.webUrl, shareIntent.text]
      .map((part) => part?.trim())
      .filter(Boolean)
      .filter((part, index, parts) => parts.indexOf(part) === index)
      .join("\n\n");

    setImportDraft({
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

    if (!isImporting) {
      router.push("/import-recipe" as any);
    }
  }, [
    hasShareIntent,
    onboardingComplete,
    isImporting,
    router,
    setImportDraft,
    resetShareIntent,
    shareIntent.files,
    shareIntent.meta,
    shareIntent.text,
    shareIntent.webUrl,
  ]);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      if (!user.onboardingCompleted && !isOnboarding) {
        router.replace("/onboarding" as any);
        return;
      }

      if (user.onboardingCompleted && (pathname === "/" || isOnboarding)) {
        router.replace("/(tabs)/cookbooks" as any);
        return;
      }

      return;
    }

    if (!guestOnboardingCompleted) {
      if (!isOnboarding) {
        router.replace("/onboarding" as any);
      }

      return;
    }

    if (guestOnboardingCompleted && (pathname === "/" || isOnboarding)) {
      router.replace("/(tabs)/cookbooks" as any);
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    guestOnboardingCompleted,
    isOnboarding,
    pathname,
    router,
  ]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen
        name="(modals)"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
          gestureEnabled: true,
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      />

      <Stack.Screen
        name="import-recipe"
        options={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      />

      <Stack.Screen
        name="recipe/[id]"
        options={{
          headerShown: true,
          title: "Receta",
          headerBackTitle: "Recetat",
          headerShadowVisible: false,
          headerTintColor: colors.textPrimary,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            fontFamily: Fonts.bold,
            fontSize: 17,
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Satoshi-Regular": require("../../assets/fonts/Satoshi-Regular.otf"),
    "Satoshi-Medium": require("../../assets/fonts/Satoshi-Medium.otf"),
    "Satoshi-Bold": require("../../assets/fonts/Satoshi-Bold.otf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.light.background,
        }}
      />
    );
  }

  return (
    <ShareIntentProvider
      options={{
        scheme: "recetaime",
        resetOnBackground: false,
        debug: __DEV__,
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ConvexProvider>
          <AuthProvider>
            <BottomSheetModalProvider>
              <StatusBar style="dark" />
              <RootNavigation />
            </BottomSheetModalProvider>
          </AuthProvider>
        </ConvexProvider>
      </GestureHandlerRootView>
    </ShareIntentProvider>
  );
}
