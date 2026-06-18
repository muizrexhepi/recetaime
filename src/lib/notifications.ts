import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushRegistrationResult = {
  status: string;
  expoPushToken?: string;
};

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("meal-reminders", {
      name: "Kujtesa vaktesh",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 120, 180],
      lightColor: "#E94B35",
    });
  }

  const existingPermission = await Notifications.getPermissionsAsync();
  let status = existingPermission.status;

  if (status !== "granted") {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    status = requestedPermission.status;
  }

  if (status !== "granted") {
    return { status };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error("Mungon Expo projectId për push notifications.");
  }

  const expoPushToken = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;

  return {
    status,
    expoPushToken,
  };
}

export async function scheduleRecipePrepReminderAsync(recipeTitle: string) {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: "Koha për përgatitje",
      body: `Mos harro përbërësit për ${recipeTitle}.`,
      data: { url: "/(tabs)/cookbooks" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60 * 4,
    },
  });
}
