import { fetch } from "expo/fetch";
import { File } from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

async function resizeLocalImage(uri: string, width: number, compress: number) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width } }],
    {
      compress,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return result.uri;
}

async function uploadLocalImage(uri: string, getUploadUrl: () => Promise<string>) {
  const uploadUrl = await getUploadUrl();
  const file = new File(uri);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "image/jpeg",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Nuk mundëm ta ngarkonim foton.");
  }

  const json = (await response.json()) as { storageId: string };
  return json.storageId;
}

export async function uploadRecipeImageSet(
  imageUri: string,
  getUploadUrl: () => Promise<string>,
) {
  const [optimizedUri, thumbnailUri] = await Promise.all([
    resizeLocalImage(imageUri, 1800, 0.82),
    resizeLocalImage(imageUri, 640, 0.72),
  ]);

  const [imageStorageId, thumbnailStorageId] = await Promise.all([
    uploadLocalImage(optimizedUri, getUploadUrl),
    uploadLocalImage(thumbnailUri, getUploadUrl),
  ]);

  return {
    imageStorageId,
    thumbnailStorageId,
  };
}
