import express from "express";
import http from "node:http";
import fs from "node:fs/promises";
import https from "node:https";
import net from "node:net";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const configPath = path.join(__dirname, "config.json");
const settingsPath = path.join(projectRoot, "settings.json");
const workspacePath = path.join(projectRoot, "data", "workspace.json");
let workspaceWriteQueue = Promise.resolve();
const distPath = path.join(projectRoot, "web", "dist");
function configuredPort(value) {
  const candidate = Number(value);
  return Number.isInteger(candidate) && candidate > 0 && candidate <= 65535 ? candidate : 8080;
}
function readAppSettings() {
  try { return JSON.parse(readFileSync(settingsPath, "utf8")); } catch { return {}; }
}
async function writeAppSettings(settings) {
  await fs.writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
}
function normalizeImageDownloadProxy(value) {
  const source = String(value || "").trim();
  if (!source) return "";
  const candidate = /^\d{1,5}$/.test(source)
    ? `http://127.0.0.1:${source}`
    : /^[a-z][a-z0-9+.-]*:\/\//i.test(source) ? source : `http://${source}`;
  const parsed = new URL(candidate);
  if (!new Set(["http:", "https:", "socks4:", "socks4a:", "socks5:", "socks5h:"]).has(parsed.protocol)) throw new Error("图片下载代理必须是 HTTP、HTTPS 或 SOCKS 地址。");
  return candidate;
}
function normalizeImageDownloadProxyEnabled(value) {
  return value === true || value === "true";
}
function normalizeWorkspaceStorageMode(value) {
  return ["browser", "file", "auto"].includes(String(value || "").toLowerCase()) ? String(value).toLowerCase() : "browser";
}
function configuredImageDownloadProxy(profile) {
  if (!profile || !normalizeImageDownloadProxyEnabled(profile.imageDownloadProxyEnabled)) return "";
  try { return normalizeImageDownloadProxy(profile.imageDownloadProxy); } catch { return ""; }
}
const port = configuredPort(readAppSettings().port);
const defaultOutputDir = path.join(projectRoot, "output");
const legacyDefaultOutputDir = "E:\\Canvas\\output";
const imageGenerationTimeoutMs = 180_000;
const imageDownloadTimeoutMs = 60_000;
const modelFetchTimeoutMs = 30_000;
const imageDownloadRetryDelaysMs = [0, 1_000, 3_000];
const verifiedImageResponseOptions = { n: 1 };
const imageSaveJobs = new Map();
const GROK_ASPECT_RATIOS = new Set([
  "1:1", "3:4", "4:3", "9:16", "16:9", "2:3", "3:2",
  "9:19.5", "19.5:9", "9:20", "20:9", "1:2", "2:1", "auto"
]);

const defaultProfile = {
  id: "default",
  name: "\u9ed8\u8ba4\u914d\u7f6e",
  endpoint: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-image-2",
  resolution: "1K",
  ratio: "1:1",
  width: 1024,
  height: 1024,
  size: "1024x1024",
  quality: "high",
  responseFormat: "url",
  referenceImageMode: "file",
  imageEditEndpointMode: "auto",
  outputDir: defaultOutputDir,
  imageDownloadProxyEnabled: false,
  imageDownloadProxy: ""
};

function cleanEndpoint(endpoint) {
  return String(endpoint || "").trim().replace(/\/+$/, "");
}

function generationUrl(endpoint) {
  const normalized = cleanEndpoint(endpoint);
  return normalized.endsWith("/images/generations") ? normalized : `${normalized}/images/generations`;
}

function editsUrl(endpoint) {
  const normalized = cleanEndpoint(endpoint).replace(/\/images\/(generations|edits)$/i, "");
  return `${normalized}/images/edits`;
}

function imageEditUrl(endpoint, mode = "auto") {
  const normalizedMode = String(mode || "auto").toLowerCase();
  const normalizedEndpoint = cleanEndpoint(endpoint);
  if (normalizedMode === "generations" || (normalizedMode === "auto" && /\/images\/generations$/i.test(normalizedEndpoint))) return generationUrl(endpoint);
  return editsUrl(endpoint);
}

function modelsUrl(endpoint) {
  const normalized = cleanEndpoint(endpoint).replace(/\/images\/(generations|edits)$/i, "").replace(/\/models$/i, "");
  return `${normalized}/models`;
}

function isGrokImageModel(model) {
  return /(^|\/)(?:grok-imagine-image(?:-2\.0|-quality)?|grok4\.(?:3|5)-img)$/i.test(String(model || "").trim());
}

function isGrokImageJsonModel(model) {
  return /(^|\/)grok-imagine-image-2\.0$/i.test(String(model || "").trim());
}

function isGptImage2Model(model) {
  return /(^|\/)gpt-image-2$/i.test(String(model || "").trim());
}

function isGeminiImageModel(model) {
  return /(^|\/)(?:gemini-(?:2\.5-flash-image(?:-preview)?|3-pro-image(?:-preview)?|3\.1-flash-image(?:-preview)?))$/i.test(String(model || "").trim());
}

function isSenseNovaImageModel(model) {
  return /(^|\/)sensenova-u1(?:\.5-lite|-fast)$/i.test(String(model || "").trim());
}

function isSenseNovaU15LiteModel(model) {
  return /(^|\/)sensenova-u1\.5-lite$/i.test(String(model || "").trim());
}

function isSenseNovaU1FastModel(model) {
  return /(^|\/)sensenova-u1-fast$/i.test(String(model || "").trim());
}

function senseNovaSize(model, size, ratio) {
  if (isSenseNovaU1FastModel(model)) {
    const sizes = {
      "2:3": "1664x2496", "3:2": "2496x1664", "3:4": "1760x2368", "4:3": "2368x1760",
      "4:5": "1824x2272", "5:4": "2272x1824", "1:1": "2048x2048", "16:9": "2752x1536",
      "9:16": "1536x2752", "21:9": "3072x1376", "9:21": "1344x3136"
    };
    return sizes[String(ratio || "").trim()] || "2752x1536";
  }
  return String(size || "auto").trim() || "auto";
}

function senseNovaRequestFields(model, size, ratio, responseFormat, { editing = false, watermark = true, promptExtend = true, outputFormat = "png" } = {}) {
  return {
    model,
    size: senseNovaSize(model, size, ratio),
    response_format: responseFormat,
    watermark: Boolean(watermark),
    ...(isSenseNovaU15LiteModel(model) ? { prompt_extend: Boolean(promptExtend) } : {}),
    n: 1,
    ...(isSenseNovaU15LiteModel(model) ? { output_format: ["png", "jpeg", "webp"].includes(outputFormat) ? outputFormat : "png" } : {})
  };
}

function geminiBaseEndpoint(endpoint) {
  return cleanEndpoint(endpoint)
    .replace(/\/images\/(?:generations|edits)$/i, "")
    .replace(/\/v1beta\/models\/[^/]+:generateContent$/i, "")
    .replace(/\/v1beta$/i, "")
    .replace(/\/v1$/i, "");
}

function geminiGenerateContentUrl(endpoint, model) {
  return `${geminiBaseEndpoint(endpoint)}/v1beta/models/${encodeURIComponent(String(model || "").trim())}:generateContent`;
}

function geminiTasksUrl(endpoint, taskId) {
  return `${geminiBaseEndpoint(endpoint)}/v1/images/tasks/${encodeURIComponent(String(taskId || "").trim())}`;
}

function geminiImageSize(resolution) {
  const value = String(resolution || "").trim().toUpperCase();
  return ["1K", "2K", "4K"].includes(value) ? value : "";
}

function geminiAspectRatio(ratio) {
  const value = String(ratio || "").trim();
  return value && value !== "auto" && value !== "custom" ? value : "";
}

function geminiAuthHeaders(apiKey) {
  // Google-compatible gateways use x-goog-api-key; Bearer keeps existing
  // OpenAI-compatible Gemini gateways working during the transition.
  return { Authorization: `Bearer ${apiKey}`, "x-goog-api-key": apiKey };
}

async function inlineGeminiImage(value, proxyUrl = "") {
  const input = String(value || "").trim();
  if (input.startsWith("data:")) {
    const match = input.match(/^data:([^;,]+)?;base64,(.+)$/i);
    if (!match) throw new Error("Gemini 参考图 Base64 格式无效。");
    return { mimeType: match[1] || "image/png", data: match[2] };
  }
  if (!isHttpImageUrl(input)) throw new Error("Gemini 参考图必须是 HTTP(S) URL 或 Base64 图片。");
  try {
    if (proxyUrl) {
      const remoteImage = await requestRemoteImageWithProxy(input, imageDownloadTimeoutMs, proxyUrl);
      return { mimeType: String(remoteImage.contentType || "image/png").split(";")[0].trim() || "image/png", data: remoteImage.buffer.toString("base64") };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), imageDownloadTimeoutMs);
    try {
      const response = await fetch(input, { signal: controller.signal, headers: imageDownloadHeaders });
      if (!response.ok) throw new Error(`Gemini 参考图下载返回 ${response.status}。`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length) throw new Error("Gemini 参考图为空。");
      const contentType = String(response.headers.get("content-type") || "image/png").split(";")[0].trim() || "image/png";
      return { mimeType: contentType, data: bytes.toString("base64") };
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Gemini 参考图下载超时（60 秒）。");
    throw error;
  }
}

async function geminiRequestBody(prompt, referenceImages, ratio, resolution, proxyUrl = "") {
  const parts = [{ text: prompt }];
  for (const referenceImage of referenceImages) parts.push({ inlineData: await inlineGeminiImage(referenceImage, proxyUrl) });
  const imageConfig = {};
  const aspectRatio = geminiAspectRatio(ratio);
  const imageSize = geminiImageSize(resolution);
  if (aspectRatio) imageConfig.aspectRatio = aspectRatio;
  if (imageSize) imageConfig.imageSize = imageSize;
  return {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      ...(Object.keys(imageConfig).length ? { imageConfig } : {})
    }
  };
}

function geminiTaskId(payload) {
  if (!payload || typeof payload !== "object") return "";
  return String(payload.task_id || payload.taskId || payload.id || payload.data?.task_id || payload.data?.taskId || "").trim();
}

function geminiTaskStatus(payload) {
  return String(payload?.status || payload?.state || payload?.phase || payload?.data?.status || "").trim().toLowerCase();
}

async function waitForGeminiTask(endpoint, apiKey, initialPayload, proxyUrl = "") {
  const taskId = geminiTaskId(initialPayload);
  if (!taskId || getImageFromPayload(initialPayload)) return initialPayload;
  const startedAt = Date.now();
  let payload = initialPayload;
  while (Date.now() - startedAt < imageGenerationTimeoutMs) {
    const status = geminiTaskStatus(payload);
    if (["failed", "error", "cancelled", "canceled", "rejected", "expired"].includes(status)) return payload;
    if (getImageFromPayload(payload)) return payload;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), modelFetchTimeoutMs);
    try {
      let response;
      let bodyText;
      if (proxyUrl) {
        const result = await requestTextWithProxy(geminiTasksUrl(endpoint, taskId), modelFetchTimeoutMs, proxyUrl, geminiAuthHeaders(apiKey));
        response = { ok: result.status >= 200 && result.status < 300, status: result.status };
        bodyText = result.bodyText;
      } else {
        response = await fetch(geminiTasksUrl(endpoint, taskId), { headers: geminiAuthHeaders(apiKey), signal: controller.signal });
        bodyText = await response.text();
      }
      try { payload = JSON.parse(bodyText); } catch { payload = { error: { message: bodyText }, status: "failed" }; }
      if (!response.ok) return payload;
    } finally {
      clearTimeout(timer);
    }
  }
  throw Object.assign(new Error("Gemini 图片任务超时（180 秒）。"), { code: "IMAGE_GENERATION_TIMEOUT" });
}

function isHttpImageUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function imageUrlReferenceFields(referenceImages) {
  return referenceImages.length === 1 ? { image_url: referenceImages[0] } : { image_urls: referenceImages };
}

function requestLogValue(value, key = "") {
  if (/^(b64_json|b64Json|base64|image_base64|imageBase64|inlineData|inline_data)$/i.test(key)) {
    return "[image data omitted]";
  }
  if (typeof value === "string" && /^data:[^;,]+;base64,/i.test(value)) {
    return "[image data omitted]";
  }
  if (Array.isArray(value)) return value.map((item) => requestLogValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [entryKey, requestLogValue(entryValue, entryKey)]));
  }
  return value;
}

function imageRequestText(url, contentType, body, extraHeaders = {}) {
  return JSON.stringify({
    url,
    method: "POST",
    headers: { Authorization: "Bearer [hidden]", "Content-Type": contentType, ...extraHeaders },
    body: requestLogValue(body)
  }, null, 2);
}

function referenceImageRequestValue(value, index) {
  const source = String(value || "").trim();
  if (/^https?:\/\//i.test(source)) return source;
  if (source.startsWith("data:")) return `[local Base64 reference image ${index + 1}]`;
  return `[reference image ${index + 1}]`;
}

function grokAspectRatio(ratio) {
  const value = String(ratio || "").trim();
  return GROK_ASPECT_RATIOS.has(value) ? value : "auto";
}

function grokResolution(resolution) {
  const value = String(resolution || "").trim().toUpperCase();
  return value === "2K" || value === "4K" ? "2k" : "1k";
}

function grokRequestSizeFields(ratio, resolution) {
  const aspectRatio = grokAspectRatio(ratio);
  return { aspect_ratio: aspectRatio, ...(aspectRatio === "auto" ? {} : { resolution: grokResolution(resolution) }) };
}

function grokQualityField(model, quality) {
  if (!isGrokImageJsonModel(model)) return {};
  return quality === "low" || quality === "medium" ? { quality } : {};
}

function grokReferenceImageFields(referenceImages) {
  // xAI's edits endpoint validates each reference item through its
  // compatibility field `image_url` (including entries in `images`).
  const images = referenceImages.map((url) => ({ image_url: url }));
  return images.length === 1 ? { image: images[0] } : { images };
}

function senseNovaReferenceImageFields(referenceImages) {
  return { images: referenceImages.map((image_url) => ({ image_url })) };
}

function modelIdsFromPayload(payload) {
  const entries = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.models) ? payload.models : Array.isArray(payload) ? payload : [];
  return [...new Set(entries.map((entry) => typeof entry === "string" ? entry : entry?.id || entry?.name || entry?.model).map((model) => String(model || "").trim()).filter(Boolean))];
}

function extractCompleteJsonValues(text) {
  const source = String(text || "");
  const values = [];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== "{" && source[index] !== "[") continue;
    const start = index;
    let depth = 1;
    let quote = false;
    let escaped = false;
    for (index += 1; index < source.length; index += 1) {
      const character = source[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') quote = false;
        continue;
      }
      if (character === '"') { quote = true; continue; }
      if (character === "{" || character === "[") depth += 1;
      if (character === "}" || character === "]") depth -= 1;
      if (depth !== 0) continue;
      const candidate = source.slice(start, index + 1);
      try { JSON.parse(candidate); values.push(candidate); } catch { /* Ignore non-JSON text that contains braces. */ }
      break;
    }
  }
  return values;
}

function isTerminalProviderPayload(payload, depth = 0) {
  if (!payload || typeof payload !== "object" || depth > 3) return false;
  const terminalStates = new Set(["completed", "complete", "succeeded", "success", "done", "failed", "error", "cancelled", "canceled", "rejected", "expired"]);
  for (const key of ["status", "state", "phase"]) {
    if (terminalStates.has(String(payload[key] || "").trim().toLowerCase())) return true;
  }
  for (const key of ["data", "result", "output", "task"]) {
    const value = payload[key];
    if (Array.isArray(value) ? value.some((item) => isTerminalProviderPayload(item, depth + 1)) : isTerminalProviderPayload(value, depth + 1)) return true;
  }
  return false;
}

async function readImageGenerationBody(response) {
  if (!response.body?.getReader) return response.text();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let parsedValueCount = 0;
  let latestCompleteJson = "";
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) return latestCompleteJson || body + decoder.decode();
    body += decoder.decode(chunk.value, { stream: true });
    const completeJsonValues = extractCompleteJsonValues(body);
    for (const completeJson of completeJsonValues.slice(parsedValueCount)) {
      latestCompleteJson = completeJson;
      try {
        const payload = JSON.parse(completeJson);
        if (!getImageFromPayload(payload) && !isTerminalProviderPayload(payload)) continue;
        await reader.cancel().catch(() => undefined);
        return completeJson;
      } catch { /* The candidate was already validated, but keep streaming if parsing unexpectedly fails. */ }
    }
    parsedValueCount = completeJsonValues.length;
  }
}

async function fetchImageGeneration(input, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), imageGenerationTimeoutMs);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    const bodyText = await readImageGenerationBody(response);
    return { response, bodyText };
  } catch (error) {
    if (controller.signal.aborted) {
      const timeoutError = new Error("图片生成超时（180 秒）。");
      timeoutError.code = "IMAGE_GENERATION_TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGeminiGenerationWithProxy(input, apiKey, body, proxyUrl) {
  const result = await requestTextWithProxy(input, imageGenerationTimeoutMs, proxyUrl, {
    ...geminiAuthHeaders(apiKey),
    "Content-Type": "application/json",
    "Content-Length": String(Buffer.byteLength(body))
  }, "POST", body);
  return {
    response: { ok: result.status >= 200 && result.status < 300, status: result.status },
    bodyText: result.bodyText
  };
}

async function imageBlobFromInput(value) {
  const input = String(value || "");
  if (input.startsWith("data:")) {
    const match = input.match(/^data:([^;,]+)?;base64,(.+)$/);
    if (!match) throw new Error("Invalid reference image.");
    return new Blob([Buffer.from(match[2], "base64")], { type: match[1] || "image/png" });
  }
  const response = await fetch(input);
  if (!response.ok) throw new Error(`Reference image download returned ${response.status}.`);
  return new Blob([await response.arrayBuffer()], { type: response.headers.get("content-type") || "image/png" });
}

function sanitizeProfile(profile, index = 0) {
  const source = profile && typeof profile === "object" ? profile : {};
  const requestedOutputDir = String(source.outputDir || "").trim();
  return {
    id: String(source.id || `profile-${index + 1}`),
    name: String(source.name || `配置 ${index + 1}`).trim(),
    endpoint: cleanEndpoint(source.endpoint || defaultProfile.endpoint),
    apiKey: typeof source.apiKey === "string" ? source.apiKey.trim() : "",
    model: String(source.model || defaultProfile.model).trim() || defaultProfile.model,
    resolution: String(source.resolution || defaultProfile.resolution).trim() || defaultProfile.resolution,
    ratio: String(source.ratio || defaultProfile.ratio).trim() || defaultProfile.ratio,
    width: Number.isFinite(Number(source.width)) ? Number(source.width) : defaultProfile.width,
    height: Number.isFinite(Number(source.height)) ? Number(source.height) : defaultProfile.height,
    size: String(source.size || defaultProfile.size).trim() || defaultProfile.size,
    quality: String(source.quality || defaultProfile.quality).trim() || defaultProfile.quality,
    responseFormat: source.responseFormat === "b64_json" ? "b64_json" : "url",
    referenceImageMode: source.referenceImageMode === "url" ? "url" : "file",
    imageEditEndpointMode: ["auto", "edits", "generations"].includes(String(source.imageEditEndpointMode || "").toLowerCase()) ? String(source.imageEditEndpointMode).toLowerCase() : defaultProfile.imageEditEndpointMode,
    outputDir: requestedOutputDir && requestedOutputDir !== legacyDefaultOutputDir ? requestedOutputDir : defaultProfile.outputDir,
    imageDownloadProxyEnabled: normalizeImageDownloadProxyEnabled(source.imageDownloadProxyEnabled),
    imageDownloadProxy: String(source.imageDownloadProxy || "").trim()
  };
}

function normalizeConfig(raw, legacySettings = null) {
  if (Array.isArray(raw?.profiles) && raw.profiles.length) {
    const activeProfileId = raw.profiles.some((profile) => profile?.id === raw.activeProfileId) ? raw.activeProfileId : String(raw.profiles[0]?.id || "profile-1");
    const profiles = raw.profiles.map((profile, index) => {
      const sanitized = sanitizeProfile(profile, index);
      const hasProxyConfig = Object.hasOwn(profile || {}, "imageDownloadProxyEnabled") || Object.hasOwn(profile || {}, "imageDownloadProxy");
      if (!legacySettings || sanitized.id !== activeProfileId || hasProxyConfig) return sanitized;
      return { ...sanitized, imageDownloadProxyEnabled: normalizeImageDownloadProxyEnabled(legacySettings.imageDownloadProxyEnabled), imageDownloadProxy: String(legacySettings.imageDownloadProxy || "").trim() };
    });
    return { profiles, activeProfileId };
  }
  const profile = sanitizeProfile({ ...raw, id: "default", name: raw?.name || defaultProfile.name });
  const hasProxyConfig = Object.hasOwn(raw || {}, "imageDownloadProxyEnabled") || Object.hasOwn(raw || {}, "imageDownloadProxy");
  return {
    profiles: [legacySettings && !hasProxyConfig ? { ...profile, imageDownloadProxyEnabled: normalizeImageDownloadProxyEnabled(legacySettings.imageDownloadProxyEnabled), imageDownloadProxy: String(legacySettings.imageDownloadProxy || "").trim() } : profile],
    activeProfileId: "default"
  };
}

async function writeConfig(state) {
  await fs.writeFile(configPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function readConfig() {
  try {
    const raw = JSON.parse(await fs.readFile(configPath, "utf8"));
    const state = normalizeConfig(raw, readAppSettings());
    if (JSON.stringify(raw) !== JSON.stringify(state)) await writeConfig(state);
    return state;
  } catch {
    const state = { profiles: [{ ...defaultProfile }], activeProfileId: defaultProfile.id };
    await writeConfig(state);
    return state;
  }
}

function activeProfile(state) {
  return state.profiles.find((profile) => profile.id === state.activeProfileId) || state.profiles[0];
}

function publicProfile(profile) {
  return {
    id: profile.id,
    name: profile.name,
    endpoint: profile.endpoint,
    model: profile.model,
    resolution: profile.resolution,
    ratio: profile.ratio,
    width: profile.width,
    height: profile.height,
    size: profile.size,
    quality: profile.quality,
    responseFormat: profile.responseFormat,
    referenceImageMode: profile.referenceImageMode,
    imageEditEndpointMode: profile.imageEditEndpointMode,
    outputDir: profile.outputDir,
    imageDownloadProxyEnabled: Boolean(profile.imageDownloadProxyEnabled),
    imageDownloadProxy: profile.imageDownloadProxy || "",
    hasApiKey: Boolean(profile.apiKey)
  };
}

function publicConfig(state) {
  const active = activeProfile(state);
  return {
    activeProfileId: active.id,
    profiles: state.profiles.map(publicProfile),
    ...publicProfile(active)
  };
}

function getImageFromPayload(payload) {
  const toImageSource = (value, encoded = false) => {
    const candidate = String(value || "").trim();
    if (!candidate) return null;
    if (candidate.startsWith("data:") || /^https?:\/\//i.test(candidate)) return candidate;
    return encoded || candidate.length > 100 ? `data:image/png;base64,${candidate}` : null;
  };
  const findImage = (value, depth = 0) => {
    if (depth > 5 || value == null) return null;
    if (typeof value === "string") return toImageSource(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        const image = findImage(item, depth + 1);
        if (image) return image;
      }
      return null;
    }
    if (typeof value !== "object") return null;
    for (const key of ["url", "image_url", "imageUrl", "download_url", "downloadUrl"]) {
      const image = toImageSource(value[key]);
      if (image) return image;
    }
    for (const key of ["b64_json", "b64Json", "base64", "image_base64", "imageBase64"]) {
      const image = toImageSource(value[key], true);
      if (image) return image;
    }
    for (const key of ["inlineData", "inline_data"]) {
      const inline = value[key];
      if (inline && typeof inline === "object") {
        const mimeType = String(inline.mimeType || inline.mime_type || "image/png").trim() || "image/png";
        const encoded = String(inline.data || inline.bytes || "").trim();
        if (encoded) return `data:${mimeType};base64,${encoded}`;
      }
    }
    for (const key of ["data", "images", "image", "result", "results", "output", "outputs", "candidates", "content", "parts"]) {
      const image = findImage(value[key], depth + 1);
      if (image) return image;
    }
    return null;
  };
  return findImage(payload);
}

function providerResponseText(payload, fallback = "") {
  if (!payload || typeof payload !== "object") return String(fallback || "");
  return JSON.stringify(payload, (key, value) => {
    if (/^(b64_json|b64Json|base64)$/i.test(key)) return "[image data omitted from response]";
    if (key === "data" && this && typeof value === "string" && (this.mimeType || this.mime_type)) return "[image data omitted from response]";
    if (key === "data" && typeof value === "string" && value.length > 512) return "[long data omitted from response]";
    if (typeof value === "string" && /^data:image\//i.test(value) && value.length > 512) return "[image data omitted from response]";
    return value;
  }, 2);
}

function filenamePart(value) {
  return String(value || "ai-image").slice(0, 50).replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-").replace(/^-+|-+$/g, "") || "ai-image";
}

const imageDownloadHeaders = {
  Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
  "User-Agent": "Mozilla/5.0 (AI Canvas image downloader)"
};

function requestRemoteImage(imageUrl, timeoutMs, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error("图片下载重定向次数过多。"));
    let parsed;
    try { parsed = new URL(imageUrl); } catch { return reject(new Error("图片 URL 无效。")); }
    const transport = parsed.protocol === "https:" ? https : parsed.protocol === "http:" ? http : null;
    if (!transport) return reject(new Error("图片 URL 只支持 HTTP 或 HTTPS。"));
    const request = transport.get(parsed, { headers: imageDownloadHeaders }, (response) => {
      const status = Number(response.statusCode || 0);
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        const redirectedUrl = new URL(response.headers.location, parsed).toString();
        requestRemoteImage(redirectedUrl, timeoutMs, redirectCount + 1).then(resolve, reject);
        return;
      }
      if (status < 200 || status >= 300) {
        response.resume();
        reject(new Error(`Image download returned ${status || "unknown status"}.`));
        return;
      }
      const chunks = [];
      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.on("end", () => resolve({ buffer: Buffer.concat(chunks), contentType: response.headers["content-type"] || "image/png" }));
      response.on("error", reject);
    });
    const timeout = setTimeout(() => request.destroy(new Error(`图片下载超时（${Math.round(timeoutMs / 1000)} 秒）。`)), timeoutMs);
    request.setTimeout(timeoutMs, () => request.destroy(new Error(`图片下载超时（${Math.round(timeoutMs / 1000)} 秒）。`)));
    request.once("close", () => clearTimeout(timeout));
    request.once("error", reject);
  });
}

function proxyPort(parsed) {
  return Number(parsed.port || (parsed.protocol === "https:" ? 443 : 80));
}

function proxyAuthorization(parsed) {
  if (!parsed.username && !parsed.password) return undefined;
  return `Basic ${Buffer.from(`${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`).toString("base64")}`;
}

function readSocketBytes(socket, expectedLength, timeoutMs) {
  return new Promise((resolve, reject) => {
    let buffer = Buffer.alloc(0);
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      socket.off("data", onData);
      socket.off("error", onError);
      socket.off("close", onClose);
    };
    const fail = (error) => { cleanup(); reject(error); };
    const onData = (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.length < expectedLength) return;
      const result = buffer.subarray(0, expectedLength);
      const remainder = buffer.subarray(expectedLength);
      cleanup();
      if (remainder.length) socket.unshift(remainder);
      resolve(result);
    };
    const onError = (error) => fail(error);
    const onClose = () => fail(new Error("代理连接已关闭。"));
    socket.on("data", onData);
    socket.once("error", onError);
    socket.once("close", onClose);
    timer = setTimeout(() => fail(new Error(`代理连接超时（${Math.round(timeoutMs / 1000)} 秒）。`)), timeoutMs);
  });
}

async function connectSocksProxy(proxy, target, timeoutMs) {
  const socket = net.createConnection({ host: proxy.hostname, port: proxyPort(proxy) });
  const timeout = setTimeout(() => socket.destroy(new Error(`代理连接超时（${Math.round(timeoutMs / 1000)} 秒）。`)), timeoutMs);
  try {
    await new Promise((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
    });
    if (proxy.protocol === "socks5:" || proxy.protocol === "socks5h:") {
      const hasAuth = Boolean(proxy.username || proxy.password);
      socket.write(Buffer.from([5, hasAuth ? 2 : 1, ...(hasAuth ? [0, 2] : [0])]));
      const greeting = await readSocketBytes(socket, 2, timeoutMs);
      if (greeting[0] !== 5 || greeting[1] === 255) throw new Error("SOCKS5 代理不接受当前认证方式。");
      if (greeting[1] === 2) {
        const username = Buffer.from(decodeURIComponent(proxy.username));
        const password = Buffer.from(decodeURIComponent(proxy.password));
        if (username.length > 255 || password.length > 255) throw new Error("SOCKS5 代理账号或密码过长。");
        socket.write(Buffer.concat([Buffer.from([1, username.length]), username, Buffer.from([password.length]), password]));
        const authResult = await readSocketBytes(socket, 2, timeoutMs);
        if (authResult[1] !== 0) throw new Error("SOCKS5 代理认证失败。");
      }
      const hostname = Buffer.from(target.hostname);
      const address = Buffer.concat([Buffer.from([5, 1, 0, 3, hostname.length]), hostname, Buffer.from([(target.port || (target.protocol === "https:" ? 443 : 80)) >> 8, (target.port || (target.protocol === "https:" ? 443 : 80)) & 255])]);
      socket.write(address);
      const reply = await readSocketBytes(socket, 4, timeoutMs);
      if (reply[0] !== 5 || reply[1] !== 0) throw new Error(`SOCKS5 代理连接失败（状态码 ${reply[1]}）。`);
      const addressLength = reply[3] === 1 ? 4 : reply[3] === 4 ? 16 : (await readSocketBytes(socket, 1, timeoutMs))[0];
      await readSocketBytes(socket, addressLength + 2, timeoutMs);
      return socket;
    }
    const targetPort = target.port || (target.protocol === "https:" ? 443 : 80);
    let address;
    if (proxy.protocol === "socks4:") {
      const ipv4 = target.hostname.split(".").map((part) => Number(part));
      if (ipv4.length !== 4 || ipv4.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) throw new Error("SOCKS4 代理需要 IPv4 目标地址。");
      address = Buffer.from(ipv4);
    } else {
      address = Buffer.from([0, 0, 0, 1]);
    }
    const username = Buffer.from(decodeURIComponent(proxy.username || ""));
    const hostname = proxy.protocol === "socks4a:" ? Buffer.from(target.hostname) : Buffer.alloc(0);
    socket.write(Buffer.concat([Buffer.from([4, 1, targetPort >> 8, targetPort & 255]), address, username, Buffer.from([0]), hostname, Buffer.from([0])]));
    const reply = await readSocketBytes(socket, 8, timeoutMs);
    if (reply[1] !== 90) throw new Error(`SOCKS4 代理连接失败（状态码 ${reply[1]}）。`);
    return socket;
  } catch (error) {
    socket.destroy();
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function connectHttpProxy(proxy, target, timeoutMs) {
  return new Promise((resolve, reject) => {
    const transport = proxy.protocol === "https:" ? https : http;
    const request = transport.request({
      hostname: proxy.hostname,
      port: proxyPort(proxy),
      method: "CONNECT",
      path: `${target.hostname}:${target.port || (target.protocol === "https:" ? 443 : 80)}`,
      headers: { Host: `${target.hostname}:${target.port || (target.protocol === "https:" ? 443 : 80)}`, ...(proxyAuthorization(proxy) ? { "Proxy-Authorization": proxyAuthorization(proxy) } : {}) },
      rejectUnauthorized: true
    });
    const timer = setTimeout(() => request.destroy(new Error(`代理连接超时（${Math.round(timeoutMs / 1000)} 秒）。`)), timeoutMs);
    request.once("connect", (response, socket, head) => {
      clearTimeout(timer);
      if (response.statusCode !== 200) {
        socket.destroy();
        reject(new Error(`HTTP 代理连接失败（状态码 ${response.statusCode || "unknown"}）。`));
        return;
      }
      if (head?.length) socket.unshift(head);
      resolve(socket);
    });
    request.once("error", (error) => { clearTimeout(timer); reject(error); });
    request.end();
  });
}

async function requestRemoteImageWithProxy(imageUrl, timeoutMs, proxyUrl, redirectCount = 0) {
  if (redirectCount > 5) throw new Error("图片下载重定向次数过多。");
  const target = new URL(imageUrl);
  const proxy = new URL(proxyUrl);
  if (!["http:", "https:"].includes(target.protocol)) throw new Error("图片 URL 只支持 HTTP 或 HTTPS。");
  if (!["http:", "https:", "socks4:", "socks4a:", "socks5:", "socks5h:"].includes(proxy.protocol)) throw new Error("图片下载代理协议不受支持。");
  const socket = proxy.protocol.startsWith("socks") ? await connectSocksProxy(proxy, target, timeoutMs) : await connectHttpProxy(proxy, target, timeoutMs);
  return new Promise((resolve, reject) => {
    const transport = target.protocol === "https:" ? https : http;
    const request = transport.request({
      hostname: target.hostname,
      port: target.port || (target.protocol === "https:" ? 443 : 80),
      path: `${target.pathname || "/"}${target.search || ""}`,
      method: "GET",
      headers: imageDownloadHeaders,
      agent: false,
      socket
    }, (response) => {
      const status = Number(response.statusCode || 0);
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        socket.destroy();
        const redirectedUrl = new URL(response.headers.location, target).toString();
        requestRemoteImageWithProxy(redirectedUrl, timeoutMs, proxyUrl, redirectCount + 1).then(resolve, reject);
        return;
      }
      if (status < 200 || status >= 300) {
        response.resume();
        reject(new Error(`Image download returned ${status || "unknown status"}.`));
        return;
      }
      const chunks = [];
      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve({ buffer, contentType: response.headers["content-type"] || "image/png" });
      });
      response.on("error", reject);
    });
    const timer = setTimeout(() => request.destroy(new Error(`图片下载超时（${Math.round(timeoutMs / 1000)} 秒）。`)), timeoutMs);
    request.setTimeout(timeoutMs, () => request.destroy(new Error(`图片下载超时（${Math.round(timeoutMs / 1000)} 秒）。`)));
    request.once("close", () => clearTimeout(timer));
    request.once("error", (error) => { clearTimeout(timer); reject(error); });
    request.end();
  });
}

async function requestTextWithProxy(requestUrl, timeoutMs, proxyUrl, headers = {}, method = "GET", requestBody = "", redirectCount = 0) {
  if (redirectCount > 5) throw new Error("模型请求重定向次数过多。");
  const target = new URL(requestUrl);
  const proxy = new URL(proxyUrl);
  if (!["http:", "https:"].includes(target.protocol)) throw new Error("模型地址只支持 HTTP 或 HTTPS。");
  if (!["http:", "https:", "socks4:", "socks4a:", "socks5:", "socks5h:"].includes(proxy.protocol)) throw new Error("代理协议不受支持。");
  const socket = proxy.protocol.startsWith("socks") ? await connectSocksProxy(proxy, target, timeoutMs) : await connectHttpProxy(proxy, target, timeoutMs);
  return new Promise((resolve, reject) => {
    const transport = target.protocol === "https:" ? https : http;
    const request = transport.request({ hostname: target.hostname, port: target.port || (target.protocol === "https:" ? 443 : 80), path: `${target.pathname || "/"}${target.search || ""}`, method, headers, agent: false, socket }, (response) => {
      const status = Number(response.statusCode || 0);
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        socket.destroy();
        const redirectedUrl = new URL(response.headers.location, target).toString();
        requestTextWithProxy(redirectedUrl, timeoutMs, proxyUrl, headers, method, requestBody, redirectCount + 1).then(resolve, reject);
        return;
      }
      const chunks = [];
      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.on("end", () => resolve({ status, bodyText: Buffer.concat(chunks).toString("utf8") }));
      response.on("error", reject);
    });
    const timer = setTimeout(() => request.destroy(new Error(`模型请求超时（${Math.round(timeoutMs / 1000)} 秒）。`)), timeoutMs);
    request.setTimeout(timeoutMs, () => request.destroy(new Error(`模型请求超时（${Math.round(timeoutMs / 1000)} 秒）。`)));
    request.once("close", () => clearTimeout(timer));
    request.once("error", (error) => { clearTimeout(timer); reject(error); });
    request.end(requestBody);
  });
}

function modelFetchProxy(body, activeProfile) {
  const proxyEnabled = Object.hasOwn(body || {}, "imageDownloadProxyEnabled")
    ? normalizeImageDownloadProxyEnabled(body.imageDownloadProxyEnabled)
    : normalizeImageDownloadProxyEnabled(activeProfile?.imageDownloadProxyEnabled);
  if (!proxyEnabled) return "";
  const proxyValue = Object.hasOwn(body || {}, "imageDownloadProxy") ? body.imageDownloadProxy : activeProfile?.imageDownloadProxy;
  return normalizeImageDownloadProxy(proxyValue);
}

async function fetchModelsResponse(endpoint, apiKey, proxyUrl = "") {
  const headers = { Authorization: `Bearer ${apiKey}` };
  if (proxyUrl) return requestTextWithProxy(modelsUrl(endpoint), modelFetchTimeoutMs, proxyUrl, headers);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), modelFetchTimeoutMs);
  try {
    const response = await fetch(modelsUrl(endpoint), { headers, signal: controller.signal });
    return { status: response.status, bodyText: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

async function saveImageToDisk(imageUrl, model, outputDir, imageDownloadProxy = "") {
  let buffer;
  let extension = "png";
  let imageDownloadDurationMs = 0;
  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:([^;,]+)?;base64,(.+)$/);
    if (!match) throw new Error("Invalid base64 image.");
    buffer = Buffer.from(match[2], "base64");
    extension = (match[1] || "image/png").split("/")[1] || "png";
  } else {
    const downloadStartedAt = Date.now();
    let remoteImage;
    const proxyUrl = imageDownloadProxy;
    if (proxyUrl) {
      try {
        remoteImage = await requestRemoteImageWithProxy(imageUrl, imageDownloadTimeoutMs, proxyUrl);
      } catch (error) {
        throw new Error(`通过图片下载代理失败：${error.message || "proxy download failed"}`);
      }
    } else try {
      remoteImage = await requestRemoteImage(imageUrl, imageDownloadTimeoutMs);
    } catch (nativeError) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), imageDownloadTimeoutMs);
        try {
          const response = await fetch(imageUrl, { signal: controller.signal, headers: imageDownloadHeaders });
          if (!response.ok) throw new Error(`Image download returned ${response.status}.`);
          remoteImage = { buffer: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get("content-type") || "image/png" };
        } finally {
          clearTimeout(timeout);
        }
      } catch (fetchError) {
        if (fetchError?.name === "AbortError") throw new Error(`图片下载超时（${Math.round(imageDownloadTimeoutMs / 1000)} 秒）。`);
        throw new Error(`${nativeError.message || "Native image download failed."}; fetch fallback: ${fetchError.message || "fetch failed"}`);
      }
    }
    const contentType = remoteImage.contentType || "image/png";
    const contentSubtype = contentType.split("/")[1]?.split(";")[0]?.toLowerCase();
    extension = contentSubtype || "png";
    buffer = remoteImage.buffer;
    imageDownloadDurationMs = Date.now() - downloadStartedAt;
  }
  const now = new Date();
  const timestamp = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("") + "-" + [String(now.getHours()).padStart(2, "0"), String(now.getMinutes()).padStart(2, "0"), String(now.getSeconds()).padStart(2, "0"), String(now.getMilliseconds()).padStart(3, "0")].join("");
  const filename = `${timestamp}-${filenamePart(model)}.${extension}`;
  const filePath = path.join(outputDir, filename);
  const localWriteStartedAt = Date.now();
  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(filePath, buffer);
  return { filePath, fileSize: buffer.length, imageDownloadDurationMs, localWriteDurationMs: Date.now() - localWriteStartedAt };
}

function saveImageJob(jobId) {
  return (async () => {
    const job = imageSaveJobs.get(jobId);
    if (!job) return;
    let lastError;
    for (let attempt = 0; attempt < imageDownloadRetryDelaysMs.length; attempt += 1) {
      const delay = imageDownloadRetryDelaysMs[attempt];
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      const current = imageSaveJobs.get(jobId);
      if (!current || current.status === "completed" || current.status === "browser-saving") return;
      imageSaveJobs.set(jobId, { ...current, status: "server-saving", downloadAttempt: attempt + 1 });
      try {
        const savedImage = await saveImageToDisk(current.sourceImageUrl, current.model, current.outputDir, current.imageDownloadProxy);
        imageSaveJobs.set(jobId, { status: "completed", sourceImageUrl: current.sourceImageUrl, savedPath: savedImage.filePath, localImageUrl: localImageUrl(savedImage.filePath), fileSize: savedImage.fileSize, imageDownloadDurationMs: savedImage.imageDownloadDurationMs, localWriteDurationMs: savedImage.localWriteDurationMs, downloadAttempt: attempt + 1, updatedAt: Date.now() });
        return;
      } catch (error) {
        lastError = error;
      }
    }
    const current = imageSaveJobs.get(jobId);
    if (current && current.status !== "completed" && current.status !== "browser-saving") {
      imageSaveJobs.set(jobId, { ...current, status: "error", error: lastError?.message || "Image download and save failed.", updatedAt: Date.now() });
    }
  })().catch((error) => {
    const current = imageSaveJobs.get(jobId);
    if (current && current.status !== "completed" && current.status !== "browser-saving") imageSaveJobs.set(jobId, { ...current, status: "error", error: error.message || "Image download and save failed.", updatedAt: Date.now() });
  });
}

function localImageUrl(filePath) {
  return `/api/saved-image?file=${encodeURIComponent(Buffer.from(filePath, "utf8").toString("base64url"))}`;
}

function pathIsWithin(filePath, root) {
  const relative = path.relative(path.resolve(root), path.resolve(filePath));
  return relative && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

async function localImageRoots() {
  const state = await readConfig();
  return [...new Set(state.profiles.map((profile) => profile.outputDir))];
}

const app = express();
app.use(express.json({ limit: "30mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ai-canvas", time: new Date().toISOString() });
});

app.get("/api/settings", (_req, res) => {
  res.json({ ok: true, workspaceStorageMode: normalizeWorkspaceStorageMode(readAppSettings().workspaceStorageMode) });
});

app.post("/api/settings", async (req, res) => {
  const settings = readAppSettings();
  settings.workspaceStorageMode = normalizeWorkspaceStorageMode(req.body?.workspaceStorageMode);
  await writeAppSettings(settings);
  res.json({ ok: true, workspaceStorageMode: settings.workspaceStorageMode });
});

app.get("/api/workspace", async (_req, res) => {
  try {
    const workspace = JSON.parse(await fs.readFile(workspacePath, "utf8"));
    res.json({ ok: true, workspace });
  } catch (error) {
    if (error?.code === "ENOENT") return res.json({ ok: true, workspace: null });
    res.status(500).json({ ok: false, error: "读取本地工作区失败。" });
  }
});

app.post("/api/workspace", async (req, res) => {
  try {
    const content = `${JSON.stringify(req.body?.workspace || {}, null, 2)}\n`;
    workspaceWriteQueue = workspaceWriteQueue.catch(() => undefined).then(async () => {
      await fs.mkdir(path.dirname(workspacePath), { recursive: true });
      const temporaryPath = `${workspacePath}.${process.pid}.tmp`;
      await fs.writeFile(temporaryPath, content, "utf8");
      await fs.rename(temporaryPath, workspacePath);
    });
    await workspaceWriteQueue;
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: "保存本地工作区失败。" });
  }
});

app.delete("/api/workspace", async (_req, res) => {
  try {
    workspaceWriteQueue = workspaceWriteQueue.catch(() => undefined).then(() => fs.rm(workspacePath, { force: true }));
    await workspaceWriteQueue;
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: "清除本地工作区失败。" });
  }
});

app.get("/api/config", async (_req, res) => {
  res.json(publicConfig(await readConfig()));
});

app.get("/api/config/key", async (req, res) => {
  const remoteAddress = String(req.socket.remoteAddress || "");
  if (!new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]).has(remoteAddress)) return res.status(403).json({ ok: false, error: "API Key can only be viewed locally." });
  const state = await readConfig();
  const profileId = String(req.query.profileId || state.activeProfileId);
  const profile = state.profiles.find((item) => item.id === profileId);
  if (!profile) return res.status(404).json({ ok: false, error: "Configuration profile not found." });
  res.json({ ok: true, apiKey: profile.apiKey });
});

app.post("/api/config", async (req, res) => {
  const state = await readConfig();
  const body = req.body || {};
  const profileId = String(body.profileId || state.activeProfileId);
  const current = state.profiles.find((profile) => profile.id === profileId) || activeProfile(state);
  let imageDownloadProxy = Object.hasOwn(body, "imageDownloadProxy") ? String(body.imageDownloadProxy || "").trim() : current.imageDownloadProxy;
  if (Object.hasOwn(body, "imageDownloadProxy")) {
    try { normalizeImageDownloadProxy(imageDownloadProxy); } catch (error) { return res.status(400).json({ ok: false, error: error.message || "图片下载代理无效。" }); }
  }
  const next = sanitizeProfile({
    ...current,
    id: current.id,
    name: body.name ?? current.name,
    endpoint: body.endpoint ?? current.endpoint,
    model: body.model ?? current.model,
    resolution: body.resolution ?? current.resolution,
    ratio: body.ratio ?? current.ratio,
    width: body.width ?? current.width,
    height: body.height ?? current.height,
    size: body.size ?? current.size,
    quality: body.quality ?? current.quality,
    responseFormat: body.responseFormat ?? current.responseFormat,
    referenceImageMode: body.referenceImageMode ?? current.referenceImageMode,
    imageEditEndpointMode: body.imageEditEndpointMode ?? current.imageEditEndpointMode,
    outputDir: body.outputDir ?? current.outputDir,
    apiKey: typeof body.apiKey === "string" && body.apiKey.trim() ? body.apiKey : current.apiKey,
    imageDownloadProxyEnabled: Object.hasOwn(body, "imageDownloadProxyEnabled") ? body.imageDownloadProxyEnabled : current.imageDownloadProxyEnabled,
    imageDownloadProxy
  });
  const index = state.profiles.findIndex((profile) => profile.id === current.id);
  if (index >= 0) state.profiles[index] = next;
  else state.profiles.push(next);
  state.activeProfileId = next.id;
  await writeConfig(state);
  res.json({ ok: true, config: publicConfig(state) });
});

app.post("/api/config/profiles", async (req, res) => {
  const state = await readConfig();
  const action = String(req.body?.action || "");
  if (action === "create") {
    const id = `profile-${Date.now()}`;
    state.profiles.push(sanitizeProfile({ ...defaultProfile, id, name: req.body?.name || "\u65b0\u914d\u7f6e" }));
    state.activeProfileId = id;
  } else if (action === "activate") {
    const id = String(req.body?.id || "");
    if (state.profiles.some((profile) => profile.id === id)) state.activeProfileId = id;
  } else if (action === "delete") {
    const id = String(req.body?.id || "");
    if (state.profiles.length > 1) {
      state.profiles = state.profiles.filter((profile) => profile.id !== id);
      if (!state.profiles.some((profile) => profile.id === state.activeProfileId)) state.activeProfileId = state.profiles[0].id;
    }
  } else if (action === "reorder") {
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.map((id) => String(id || "")).filter(Boolean)
      : [];
    const existingIds = state.profiles.map((profile) => profile.id);
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length !== existingIds.length || uniqueIds.some((id) => !existingIds.includes(id))) {
      return res.status(400).json({ ok: false, error: "配置档顺序数据无效。" });
    }
    const profilesById = new Map(state.profiles.map((profile) => [profile.id, profile]));
    state.profiles = uniqueIds.map((id) => profilesById.get(id));
  }
  await writeConfig(state);
  res.json({ ok: true, config: publicConfig(state) });
});

app.get("/api/config/export", async (_req, res) => {
  const state = await readConfig();
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="ai-canvas-config.json"');
  res.send(JSON.stringify(state, null, 2));
});

app.post("/api/config/import", async (req, res) => {
  const imported = req.body?.config && typeof req.body.config === "object" ? req.body.config : req.body;
  const state = normalizeConfig(imported);
  await writeConfig(state);
  res.json({ ok: true, config: publicConfig(state) });
});

app.post("/api/test", async (req, res) => {
  const state = await readConfig();
  const active = activeProfile(state);
  const endpoint = cleanEndpoint(req.body?.endpoint ?? active.endpoint);
  const apiKey = String(req.body?.apiKey || active.apiKey || "").trim();
  if (!endpoint) return res.status(400).json({ ok: false, error: "\u8bf7\u5148\u586b\u5199 Endpoint \u5730\u5740\u3002" });
  if (!apiKey) return res.status(400).json({ ok: false, error: "\u5c1a\u672a\u914d\u7f6e API Key\u3002" });
  try {
    const response = await fetch(modelsUrl(endpoint), { headers: { Authorization: `Bearer ${apiKey}` } });
    const bodyText = await response.text();
    if (!response.ok) return res.status(response.status).json({ ok: false, error: `\u8fde\u63a5\u8fd4\u56de\u72b6\u6001\u7801 ${response.status}\u3002`, detail: bodyText.slice(0, 300) });
    res.json({ ok: true, message: "\u8fde\u63a5\u6210\u529f\u3002" });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message || "\u65e0\u6cd5\u8fde\u63a5 Endpoint\u3002" });
  }
});

app.post("/api/models", async (req, res) => {
  const state = await readConfig();
  const active = activeProfile(state);
  const body = req.body || {};
  const endpoint = cleanEndpoint(body.endpoint ?? active.endpoint);
  const apiKey = String(body.apiKey || active.apiKey || "").trim();
  if (!endpoint) return res.status(400).json({ ok: false, error: "\u8bf7\u5148\u586b\u5199 Endpoint \u5730\u5740\u3002" });
  if (!apiKey) return res.status(400).json({ ok: false, error: "\u5c1a\u672a\u914d\u7f6e API Key\u3002" });
  try {
    const response = await fetchModelsResponse(endpoint, apiKey, modelFetchProxy(body, active));
    const bodyText = response.bodyText;
    let payload = {};
    try { payload = JSON.parse(bodyText); } catch { /* Some providers return a non-JSON error body. */ }
    if (response.status < 200 || response.status >= 300) return res.status(response.status || 502).json({ ok: false, error: `\u83b7\u53d6\u6a21\u578b\u5931\u8d25\uff0c\u72b6\u6001\u7801 ${response.status || "unknown"}\u3002`, detail: providerResponseText(payload, bodyText) });
    res.json({ ok: true, models: modelIdsFromPayload(payload) });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message || "\u65e0\u6cd5\u83b7\u53d6\u6a21\u578b\u5217\u8868\u3002" });
  }
});

app.post("/api/generate", async (req, res) => {
  const state = await readConfig();
  const requestedProfileId = String(req.body?.profileId || "");
  const config = state.profiles.find((profile) => profile.id === requestedProfileId) || activeProfile(state);
  const prompt = String(req.body?.prompt || "").trim();
  const apiKey = String(config.apiKey || "").trim();
  if (!prompt) return res.status(400).json({ ok: false, error: "Prompt \u4e0d\u80fd\u4e3a\u7a7a\u3002" });
  if (!apiKey) return res.status(400).json({ ok: false, error: "\u8bf7\u5148\u5728 API \u8bbe\u7f6e\u4e2d\u586b\u5199 API Key\u3002" });
  const model = String(req.body?.model || config.model || defaultProfile.model).trim();
  const size = String(req.body?.size || config.size || defaultProfile.size).trim();
  const ratio = String(req.body?.ratio || config.ratio || defaultProfile.ratio).trim();
  const resolution = String(req.body?.resolution || config.resolution || defaultProfile.resolution).trim();
  const grokModel = isGrokImageModel(model);
  const requestedQuality = String(req.body?.quality || config.quality || defaultProfile.quality).trim().toLowerCase();
  const quality = ["low", "medium", "high"].includes(requestedQuality) ? requestedQuality : "";
  const watermark = req.body?.watermark !== false && req.body?.watermark !== "false";
  const promptExtend = req.body?.promptExtend !== false && req.body?.promptExtend !== "false";
  const outputFormat = ["png", "jpeg", "webp"].includes(String(req.body?.outputFormat || "").toLowerCase()) ? String(req.body.outputFormat).toLowerCase() : "png";
  const responseFormat = config.responseFormat === "url" ? "url" : "b64_json";
  const imageEditEndpoint = imageEditUrl(config.endpoint, config.imageEditEndpointMode);
  const referenceImages = (Array.isArray(req.body?.referenceImages) ? req.body.referenceImages : [req.body?.referenceImage]).map((value) => String(value || "").trim()).filter(Boolean).slice(0, 5);
  const grokJsonModel = isGrokImageJsonModel(model);
  let requestText = "";
  try {
    const apiRequestStartedAt = Date.now();
    let response;
    let bodyText;
    if (isSenseNovaU1FastModel(model) && referenceImages.length) {
      throw new Error("SenseNova U1 Fast 不支持参考图，请移除参考图后重试。");
    } else if (isSenseNovaU15LiteModel(model) && referenceImages.length) {
      const requestBody = {
        ...senseNovaRequestFields(model, size, ratio, responseFormat, { editing: true, watermark, promptExtend, outputFormat }),
        prompt,
        ...senseNovaReferenceImageFields(referenceImages)
      };
      requestText = imageRequestText(editsUrl(config.endpoint), "application/json", requestBody);
      ({ response, bodyText } = await fetchImageGeneration(editsUrl(config.endpoint), {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }));
    } else if (isGeminiImageModel(model)) {
      const requestBody = await geminiRequestBody(prompt, referenceImages, ratio, resolution, configuredImageDownloadProxy(config));
      const requestUrl = geminiGenerateContentUrl(config.endpoint, model);
      requestText = imageRequestText(requestUrl, "application/json", requestBody, { "x-goog-api-key": "[hidden]" });
      const requestBodyText = JSON.stringify(requestBody);
      const proxyUrl = configuredImageDownloadProxy(config);
      if (proxyUrl) {
        ({ response, bodyText } = await fetchGeminiGenerationWithProxy(requestUrl, apiKey, requestBodyText, proxyUrl));
      } else {
        ({ response, bodyText } = await fetchImageGeneration(requestUrl, {
          method: "POST",
          headers: { ...geminiAuthHeaders(apiKey), "Content-Type": "application/json" },
          body: requestBodyText
        }));
      }
    } else if (grokJsonModel && referenceImages.length) {
      const requestBody = {
        model,
        prompt,
        ...grokReferenceImageFields(referenceImages),
        ...grokRequestSizeFields(ratio, resolution),
        ...grokQualityField(model, quality),
        ...(responseFormat === "b64_json" ? { response_format: "b64_json" } : {})
      };
      requestText = imageRequestText(imageEditEndpoint, "application/json", requestBody);
      ({ response, bodyText } = await fetchImageGeneration(imageEditEndpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }));
    } else if ((isGptImage2Model(model) || isGeminiImageModel(model)) && config.referenceImageMode === "url" && referenceImages.length && referenceImages.every(isHttpImageUrl)) {
      const requestBody = {
        model,
        prompt,
        ...imageUrlReferenceFields(referenceImages),
        size,
        ...(quality ? { quality } : {}),
        ...verifiedImageResponseOptions,
        response_format: responseFormat,
        ...(responseFormat === "url" ? { output_format: "png" } : {})
      };
      requestText = imageRequestText(imageEditEndpoint, "application/json", requestBody);
      ({ response, bodyText } = await fetchImageGeneration(imageEditEndpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }));
    } else if (referenceImages.length) {
      const form = new FormData();
      form.append("model", model);
      form.append("prompt", prompt);
      if (grokModel) {
        for (const [field, value] of Object.entries(grokRequestSizeFields(ratio, resolution))) form.append(field, value);
      } else {
        form.append("size", size);
      }
      if (quality && !grokModel) form.append("quality", quality);
      form.append("response_format", responseFormat);
      const imageField = grokModel && referenceImages.length > 1 ? "image[]" : "image";
      for (const [index, referenceImage] of referenceImages.entries()) {
        form.append(imageField, await imageBlobFromInput(referenceImage), `reference-${index + 1}.png`);
      }
      requestText = imageRequestText(imageEditEndpoint, "multipart/form-data", {
        model,
        prompt,
        ...(grokModel ? grokRequestSizeFields(ratio, resolution) : { size }),
        ...(quality && !grokModel ? { quality } : {}),
        response_format: responseFormat,
        [imageField]: referenceImages.map(referenceImageRequestValue)
      });
      ({ response, bodyText } = await fetchImageGeneration(imageEditEndpoint, { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form }));
    } else {
      const requestBody = grokModel
        ? { model, prompt, ...grokRequestSizeFields(ratio, resolution), ...(grokJsonModel ? grokQualityField(model, quality) : (quality ? { quality } : {})), ...(grokJsonModel ? {} : verifiedImageResponseOptions), ...(grokJsonModel ? (responseFormat === "b64_json" ? { response_format: "b64_json" } : {}) : { response_format: responseFormat, ...(responseFormat === "url" ? { output_format: "png" } : {}) }) }
        : isSenseNovaImageModel(model)
          ? { ...senseNovaRequestFields(model, size, ratio, responseFormat, { watermark, promptExtend, outputFormat }), prompt }
        : { model, prompt, size, ...(quality ? { quality } : {}), ...verifiedImageResponseOptions, response_format: responseFormat, ...(responseFormat === "url" ? { output_format: "png" } : {}) };
      requestText = imageRequestText(generationUrl(config.endpoint), "application/json", requestBody);
      ({ response, bodyText } = await fetchImageGeneration(generationUrl(config.endpoint), {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }));
    }
    let payload = {};
    try { payload = JSON.parse(bodyText); } catch { /* The provider may return a non-JSON error body. */ }
    if (response.ok && isGeminiImageModel(model)) payload = await waitForGeminiTask(config.endpoint, apiKey, payload, configuredImageDownloadProxy(config));
    const responseText = providerResponseText(payload, bodyText);
    const rawResponseText = responseText;
    const apiRequestDurationMs = Date.now() - apiRequestStartedAt;
    if (!response.ok) return res.status(response.status).json({ ok: false, error: payload?.error?.message || `Image generation returned ${response.status}.`, requestText, responseText, rawResponseText });
    const imageUrl = getImageFromPayload(payload);
    if (!imageUrl) return res.status(502).json({ ok: false, error: "\u670d\u52a1\u5546\u6ca1\u6709\u8fd4\u56de\u56fe\u7247 URL \u6216 base64 \u56fe\u7247\u3002", requestText, responseText, rawResponseText });
    const sourceImageUrl = imageUrl;
    const saveJobId = `save-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    imageSaveJobs.set(saveJobId, { status: "pending", sourceImageUrl, model, outputDir: config.outputDir, imageDownloadProxy: configuredImageDownloadProxy(config), createdAt: Date.now() });
    void saveImageJob(saveJobId);
    res.json({ ok: true, imageUrl: sourceImageUrl, sourceImageUrl, saveJobId, saveStatus: "pending", revisedPrompt: payload?.data?.[0]?.revised_prompt || "", apiRequestDurationMs, requestText, responseText, rawResponseText });
  } catch (error) {
    if (error?.code === "IMAGE_GENERATION_TIMEOUT") return res.status(504).json({ ok: false, error: error.message, requestText, responseText: error.message, rawResponseText: "" });
    const errorMessage = error.message || "\u65e0\u6cd5\u8fde\u63a5\u56fe\u7247\u670d\u52a1\u5546\u3002";
    res.status(502).json({ ok: false, error: errorMessage, requestText, responseText: errorMessage, rawResponseText: "" });
  }
});

app.get("/api/image-save-status/:jobId", (req, res) => {
  const job = imageSaveJobs.get(String(req.params.jobId || ""));
  if (!job) return res.status(404).json({ ok: false, error: "Image save job not found." });
  res.json({ ok: true, ...job });
  if (job.status === "completed") imageSaveJobs.delete(String(req.params.jobId || ""));
});

app.post("/api/image-save-fallback/:jobId", async (req, res) => {
  const jobId = String(req.params.jobId || "");
  const job = imageSaveJobs.get(jobId);
  if (!job) return res.status(404).json({ ok: false, error: "Image save job not found." });
  if (job.status === "completed") return res.json({ ok: true, ...job });
  if (job.status !== "pending" && job.status !== "error") return res.status(409).json({ ok: false, error: "Image save job is not available." });
  imageSaveJobs.set(jobId, { ...job, status: "pending", error: "", updatedAt: Date.now() });
  void saveImageJob(jobId);
  res.json({ ok: true, status: "pending" });
});

app.post("/api/image-save-upload/:jobId", async (req, res) => {
  const jobId = String(req.params.jobId || "");
  const job = imageSaveJobs.get(jobId);
  if (!job) return res.status(404).json({ ok: false, error: "Image save job not found." });
  if (job.status === "completed") return res.json({ ok: true, ...job });
  if (job.status !== "pending" && job.status !== "error") return res.status(409).json({ ok: false, error: "Image save job is not available." });
  const imageData = String(req.body?.imageData || "");
  const browserDownloadDurationMs = Number(req.body?.imageDownloadDurationMs);
  if (!/^data:image\/[a-z0-9.+-]+;base64,/i.test(imageData)) return res.status(400).json({ ok: false, error: "Invalid image data." });
  imageSaveJobs.set(jobId, { ...job, status: "browser-saving" });
  try {
    const savedImage = await saveImageToDisk(imageData, job.model, job.outputDir, job.imageDownloadProxy);
    const completed = { status: "completed", savedPath: savedImage.filePath, localImageUrl: localImageUrl(savedImage.filePath), fileSize: savedImage.fileSize, imageDownloadDurationMs: Number.isFinite(browserDownloadDurationMs) && browserDownloadDurationMs >= 0 ? browserDownloadDurationMs : 0, localWriteDurationMs: savedImage.localWriteDurationMs, updatedAt: Date.now() };
    imageSaveJobs.set(jobId, completed);
    res.json({ ok: true, ...completed });
  } catch (error) {
    imageSaveJobs.set(jobId, { ...job, status: "pending" });
    res.status(500).json({ ok: false, error: error.message || "Local image save failed." });
  }
});

function localImageUrlForPath(filePath) {
  return localImageUrl(filePath);
}

app.get("/api/saved-image", async (req, res) => {
  let filePath;
  try { filePath = Buffer.from(String(req.query.file || ""), "base64url").toString("utf8"); } catch { return res.status(400).send("Invalid image file."); }
  if (!filePath) return res.status(400).send("Invalid image file.");
  try {
    const roots = await localImageRoots();
    if (!roots.some((root) => pathIsWithin(filePath, root))) return res.status(403).send("Image file is outside configured storage.");
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) return res.status(404).send("Image file not found.");
    res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
    res.sendFile(path.resolve(filePath));
  } catch {
    res.status(404).send("Image file not found.");
  }
});

app.get("/api/image-proxy", async (req, res) => {
  let parsed;
  try { parsed = new URL(String(req.query.url || "")); } catch { return res.status(400).send("Invalid image URL."); }
  if (!/^https?:$/.test(parsed.protocol)) return res.status(400).send("Only http(s) image URLs are supported.");
  try {
    const state = await readConfig();
    const profileId = String(req.query.profileId || state.activeProfileId);
    const profile = state.profiles.find((item) => item.id === profileId) || activeProfile(state);
    const proxyUrl = configuredImageDownloadProxy(profile);
    let image;
    if (proxyUrl) {
      image = await requestRemoteImageWithProxy(parsed.toString(), imageDownloadTimeoutMs, proxyUrl);
    } else {
      try {
        image = await requestRemoteImage(parsed.toString(), imageDownloadTimeoutMs);
      } catch {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), imageDownloadTimeoutMs);
        try {
          const response = await fetch(parsed, { signal: controller.signal, headers: imageDownloadHeaders });
          if (!response.ok) return res.status(response.status).send("Unable to fetch image.");
          image = { buffer: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get("content-type") || "image/png" };
        } finally {
          clearTimeout(timeout);
        }
      }
    }
    res.setHeader("Content-Type", image.contentType || "image/png");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.send(image.buffer);
  } catch (error) {
    res.status(502).send(error.message || "Unable to fetch image.");
  }
});

app.use(express.static(distPath));
app.get("*", async (_req, res) => {
  try {
    await fs.access(path.join(distPath, "index.html"));
    res.sendFile(path.join(distPath, "index.html"));
  } catch {
    res.status(503).send("Web build not found. Run npm run build first.");
  }
});

app.listen(port, () => {
  console.log(`AI Canvas is running at http://localhost:${port}`);
});
