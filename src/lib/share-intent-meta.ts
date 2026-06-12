type ShareIntentMeta = Record<string, unknown> | null | undefined;

function getMetaString(meta: ShareIntentMeta, keys: string[]) {
  for (const key of keys) {
    const value = meta?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

export function getShareIntentMeta(meta: ShareIntentMeta) {
  const title = getMetaString(meta, ["title", "og:title"]);
  const description = getMetaString(meta, [
    "og:description",
    "description",
    "twitter:description",
  ]);
  const articleText = getMetaString(meta, ["articleText", "bodyText"]);

  return {
    title,
    description,
    htmlText: articleText,
    caption: description ?? articleText,
  };
}
