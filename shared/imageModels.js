// Shared by the backend, parameter menus and size selection. This classifies
// request templates only; it does not guarantee a model supports image generation.
function modelName(model) {
  return String(model || "").trim().split("/").pop().toLowerCase();
}

export function imageModelFamily(model) {
  const name = modelName(model);
  if (!name || /\s/.test(name)) return "openai";
  // Keep legacy aliases which do not use the grok- prefix.
  if (/^grok4\.(?:3|5)-img$/.test(name)) return "grok";
  const family = name.match(/^(gemini|grok|seedream|sensenova|gpt)-.+$/)?.[1];
  return family || "openai";
}

export function isGeminiImageModel(model) {
  return imageModelFamily(model) === "gemini";
}

export function isGrokImageModel(model) {
  return imageModelFamily(model) === "grok";
}

export function isSeedreamImageModel(model) {
  return imageModelFamily(model) === "seedream";
}

export function isSenseNovaImageModel(model) {
  return imageModelFamily(model) === "sensenova";
}

export function isGptImageModel(model) {
  return imageModelFamily(model) === "gpt";
}

// Exact model exceptions must not be inherited by future family members.
export function isGrokImageJsonModel(model) {
  return modelName(model) === "grok-imagine-image-2.0";
}

export function isGptImage2Model(model) {
  return modelName(model) === "gpt-image-2";
}

export function isSenseNovaU15LiteModel(model) {
  return modelName(model) === "sensenova-u1.5-lite";
}

export function isSenseNovaU1FastModel(model) {
  return modelName(model) === "sensenova-u1-fast";
}
