export const DEFAULT_IMAGE_MODEL = "gpt-image-2";
export const CUSTOM_IMAGE_RESOLUTION = "custom";
export const AUTO_IMAGE_RESOLUTION = "auto";
export const SUPPORTED_IMAGE_MODELS = [
  DEFAULT_IMAGE_MODEL,
  "grok-imagine-image",
  "grok-imagine-image-quality",
  "gemini-3-pro-image-preview",
  "gemini-3.1-flash-image-preview"
];

export const IMAGE_SIZE_CONFIG = {
  [DEFAULT_IMAGE_MODEL]: {
    resolutions: [AUTO_IMAGE_RESOLUTION, "1K", "2K", "4K"],
    ratios: ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "9:21", "21:9"],
    sizes: {
      "1K": {
        "1:1": [1024, 1024],
        "2:3": [1024, 1536],
        "3:2": [1536, 1024],
        "3:4": [1024, 1365],
        "4:3": [1365, 1024],
        "9:16": [864, 1536],
        "16:9": [1536, 864],
        "9:21": [656, 1536],
        "21:9": [1536, 656]
      },
      "2K": {
        "1:1": [2048, 2048],
        "2:3": [2048, 3072],
        "3:2": [3072, 2048],
        "3:4": [2048, 2732],
        "4:3": [2732, 2048],
        "9:16": [1728, 3072],
        "16:9": [3072, 1728],
        "9:21": [1317, 3072],
        "21:9": [3072, 1317]
      },
      "4K": {
        "1:1": [2880, 2880],
        "2:3": [2560, 3840],
        "3:2": [3840, 2560],
        "3:4": [2880, 3840],
        "4:3": [3840, 2880],
        "9:16": [2160, 3840],
        "16:9": [3840, 2160],
        "9:21": [1728, 3840],
        "21:9": [3840, 1728]
      }
    }
  },
  "grok-imagine-image": {
    resolutions: [AUTO_IMAGE_RESOLUTION, "1K", "2K"],
    ratios: ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "9:19.5", "19.5:9", "9:20", "20:9", "1:2", "2:1"],
    sizes: {
      "1K": {
        "1:1": [1024, 1024],
        "2:3": [1024, 1536],
        "3:2": [1536, 1024],
        "3:4": [1024, 1365],
        "4:3": [1365, 1024],
        "9:16": [864, 1536],
        "16:9": [1536, 864],
        "9:19.5": [709, 1536],
        "19.5:9": [1536, 709],
        "9:20": [691, 1536],
        "20:9": [1536, 691],
        "1:2": [768, 1536],
        "2:1": [1536, 768]
      },
      "2K": {
        "1:1": [2048, 2048],
        "2:3": [2048, 3072],
        "3:2": [3072, 2048],
        "3:4": [2048, 2731],
        "4:3": [2731, 2048],
        "9:16": [1728, 3072],
        "16:9": [3072, 1728],
        "9:19.5": [1418, 3072],
        "19.5:9": [3072, 1418],
        "9:20": [1382, 3072],
        "20:9": [3072, 1382],
        "1:2": [1536, 3072],
        "2:1": [3072, 1536]
      }
    }
  }
};

IMAGE_SIZE_CONFIG["grok-imagine-image-quality"] = IMAGE_SIZE_CONFIG["grok-imagine-image"];

function isGrokImageModel(model) {
  return /(^|\/)grok-imagine-image(?:-quality)?$/i.test(String(model || "").trim());
}

function configForModel(model) {
  if (isGrokImageModel(model)) return IMAGE_SIZE_CONFIG["grok-imagine-image"];
  return IMAGE_SIZE_CONFIG[model] || IMAGE_SIZE_CONFIG[DEFAULT_IMAGE_MODEL];
}

function normalizeCustomDimension(value, fallback) {
  const numeric = Math.round(Number(value));
  return Number.isFinite(numeric) && numeric > 0 ? Math.min(16384, numeric) : fallback;
}

function customImageSizeSelection(width, height) {
  const normalizedWidth = normalizeCustomDimension(width, 1024);
  const normalizedHeight = normalizeCustomDimension(height, 1024);
  return { resolution: CUSTOM_IMAGE_RESOLUTION, ratio: CUSTOM_IMAGE_RESOLUTION, width: normalizedWidth, height: normalizedHeight, size: `${normalizedWidth}x${normalizedHeight}` };
}

function autoImageSizeSelection(model, ratio) {
  const config = configForModel(model);
  if (isGrokImageModel(model)) return { resolution: AUTO_IMAGE_RESOLUTION, ratio: AUTO_IMAGE_RESOLUTION, width: 1024, height: 1024, size: AUTO_IMAGE_RESOLUTION };
  const selectedRatio = config.ratios.includes(ratio) ? ratio : config.ratios[0];
  const [width, height] = config.sizes[config.resolutions.find((resolution) => resolution !== AUTO_IMAGE_RESOLUTION) || config.resolutions[0]][selectedRatio];
  return { resolution: AUTO_IMAGE_RESOLUTION, ratio: selectedRatio, width, height, size: AUTO_IMAGE_RESOLUTION };
}

export function getImageSizeSelection({ model, resolution = "1K", ratio = "1:1", width, height } = {}) {
  if (resolution === CUSTOM_IMAGE_RESOLUTION && !isGrokImageModel(model)) return customImageSizeSelection(width, height);
  const config = configForModel(model);
  if (resolution === AUTO_IMAGE_RESOLUTION) return autoImageSizeSelection(model, ratio);
  const selectedResolution = config.resolutions.includes(resolution) ? resolution : config.resolutions[0];
  const selectedRatio = config.ratios.includes(ratio) ? ratio : config.ratios[0];
  const [resolvedWidth, resolvedHeight] = config.sizes[selectedResolution][selectedRatio];
  return { resolution: selectedResolution, ratio: selectedRatio, width: resolvedWidth, height: resolvedHeight, size: `${resolvedWidth}x${resolvedHeight}` };
}

export function getImageSizeOptions(model) {
  const config = configForModel(model);
  return { resolutions: config.resolutions, ratios: config.ratios };
}

export function normalizeImageSizeSelection({ model, resolution, ratio, size, width, height } = {}) {
  if (resolution === CUSTOM_IMAGE_RESOLUTION && !isGrokImageModel(model)) {
    const sizeMatch = String(size || "").match(/^(\d+)x(\d+)$/i);
    return customImageSizeSelection(width ?? sizeMatch?.[1], height ?? sizeMatch?.[2]);
  }
  const config = configForModel(model);
  const requestedSize = String(size || "");
  if (requestedSize.toLowerCase() === AUTO_IMAGE_RESOLUTION) return autoImageSizeSelection(model, ratio);
  for (const currentResolution of config.resolutions) {
    if (currentResolution === AUTO_IMAGE_RESOLUTION) continue;
    for (const currentRatio of config.ratios) {
      const [width, height] = config.sizes[currentResolution][currentRatio];
      if (requestedSize === `${width}x${height}`) return getImageSizeSelection({ model, resolution: currentResolution, ratio: currentRatio });
    }
  }
  return getImageSizeSelection({ model, resolution, ratio });
}

export function formatImageRatioOption(selection) {
  return `${selection.ratio} (${selection.width} x ${selection.height})`;
}
