type RedirectSystemPathOptions = {
  path: string;
  initial: boolean;
};

export function redirectSystemPath({
  path,
}: RedirectSystemPathOptions): string {
  try {
    const raw = String(path ?? "");
    const decoded = safeDecode(raw);

    if (isShareIntentPath(raw) || isShareIntentPath(decoded)) {
      return "/import-recipe?source=share-intent";
    }

    return raw;
  } catch {
    return "/";
  }
}

function isShareIntentPath(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized.includes("dataurl=") ||
    normalized.includes("recetaimesharekey") ||
    normalized.includes("nonce=")
  );
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
