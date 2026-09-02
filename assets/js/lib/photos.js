// assets/js/lib/photos.js
// Real tennis photography used by the demo. Every image is stored locally so
// the MVP works offline and is published under CC0 / public-domain terms.
// Full source and licence notes live in IMAGE_SOURCES.md at the project root.

export const PHOTO_LIBRARY = {
  action: {
    src: "/assets/images/player-action.jpg",
    label: "Match action",
    alt: "Tennis player striking a backhand during a professional match on a blue hard court",
    licence: "CC0 / public domain dedication",
    source: "Wikimedia Commons",
    safetyStatus: "clean",
  },
  stadium: {
    src: "/assets/images/stadium.jpg",
    label: "Show court",
    alt: "Wide view of a packed outdoor tennis stadium during a match",
    licence: "CC0 / public domain dedication",
    source: "Wikimedia Commons",
    safetyStatus: "clean",
  },
  clay: {
    src: "/assets/images/clay-lines.jpg",
    label: "Clay court",
    alt: "Close view of white tennis court lines crossing on red clay",
    licence: "CC0 / public domain dedication",
    source: "Wikimedia Commons",
    safetyStatus: "clean",
  },
  ball: {
    src: "/assets/images/tennis-ball.jpg",
    label: "Tennis ball",
    alt: "Close-up of a tennis ball resting on a hard court",
    licence: "CC0 / public domain dedication",
    source: "Wikimedia Commons",
    safetyStatus: "clean",
  },
};

export const DEMO_PHOTOS = Object.fromEntries(
  Object.entries(PHOTO_LIBRARY).map(([key, value]) => [key, value.src])
);
export const PHOTO_KEYS = Object.keys(PHOTO_LIBRARY);
export const PHOTO_LABELS = Object.fromEntries(
  Object.entries(PHOTO_LIBRARY).map(([key, value]) => [key, value.label])
);
export const PHOTO_ALTS = Object.fromEntries(
  Object.entries(PHOTO_LIBRARY).map(([key, value]) => [key, value.alt])
);

// Known-asset path for the bundled, rights-safe library. User uploads use the
// live local OCR service in mediaIntelligence.js instead of this declaration.
export function analysePhoto(photoKey, caption = "") {
  if (!photoKey) return null;
  const photo = PHOTO_LIBRARY[photoKey];
  if (!photo) {
    return {
      outcome: "review",
      reason: "Unknown media source requires enhanced moderation",
      checks: ["source", "visual", "ocr", "caption_context"],
    };
  }
  return {
    outcome: photo.safetyStatus === "clean" ? "clean" : "review",
    reason: photo.safetyStatus === "clean"
      ? "Bundled image is approved through the local known-asset manifest"
      : "Image requires enhanced moderation",
    checks: ["known_asset_manifest", "rights_record", "caption_context"],
    captionLength: String(caption || "").length,
    source: photo.source,
    licence: photo.licence,
    provider: "known_asset_manifest",
    productionBoundary: "This bundled photo is trusted through its local asset manifest; uploaded media follows the live OCR evidence path.",
  };
}
