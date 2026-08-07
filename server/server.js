import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const configPath = path.join(__dirname, "config.json");
const distPath = path.join(projectRoot, "web", "dist");
const port = Number(process.env.PORT || 6000);
const defaultOutputDir = path.join(projectRoot, "output");
const legacyDefaultOutputDir = "E:\\Canvas\\output";
const imageGenerationTimeoutMs = 180_000;
const verifiedImageResponseOptions = { n: 1, response_format: "url", output_format: "png" };

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
  autoSave: true,
  outputDir: defaultOutputDir
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
    autoSave: source.autoSave !== false,
    outputDir: requestedOutputDir && requestedOutputDir !== legacyDefaultOutputDir ? requestedOutputDir : defaultProfile.outputDir
  };
}

function normalizeConfig(raw) {
  if (Array.isArray(raw?.profiles) && raw.profiles.length) {
    const profiles = raw.profiles.map(sanitizeProfile);
    const activeProfileId = profiles.some((profile) => profile.id === raw.activeProfileId) ? raw.activeProfileId : profiles[0].id;
    return { profiles, activeProfileId };
  }
  return {
    profiles: [sanitizeProfile({ ...raw, id: "default", name: raw?.name || defaultProfile.name })],
    activeProfileId: "default"
  };
}

async function writeConfig(state) {
  await fs.writeFile(configPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function readConfig() {
  try {
    const raw = JSON.parse(await fs.readFile(configPath, "utf8"));
    const state = normalizeConfig(raw);
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
    autoSave: profile.autoSave,
    outputDir: profile.outputDir,
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
    for (const key of ["data", "images", "image", "result", "results", "output", "outputs"]) {
      const image = findImage(value[key], depth + 1);
      if (image) return image;
    }
    return null;
  };
  return findImage(payload);
}

function providerResponseText(payload, fallback = "") {
  if (!payload || typeof payload !== "object") return String(fallback || "").slice(0, 12000);
  return JSON.stringify(payload, (key, value) => /^(b64_json|b64Json|base64)$/i.test(key) ? "[image data omitted]" : value, 2).slice(0, 12000);
}

function filenamePart(value) {
  return String(value || "ai-image").slice(0, 50).replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-").replace(/^-+|-+$/g, "") || "ai-image";
}

async function saveImageToDisk(imageUrl, prompt, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });
  let buffer;
  let extension = "png";
  if (imageUrl.startsWith("data:")) {
    const match = imageUrl.match(/^data:([^;,]+)?;base64,(.+)$/);
    if (!match) throw new Error("Invalid base64 image.");
    buffer = Buffer.from(match[2], "base64");
    extension = (match[1] || "image/png").split("/")[1] || "png";
  } else {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Image download returned ${response.status}.`);
    const contentType = response.headers.get("content-type") || "image/png";
    extension = contentType.split("/")[1]?.split(";")[0] || "png";
    buffer = Buffer.from(await response.arrayBuffer());
  }
  const filename = `${Date.now()}-${filenamePart(prompt)}.${extension}`;
  const filePath = path.join(outputDir, filename);
  await fs.writeFile(filePath, buffer);
  return { filePath, fileSize: buffer.length };
}

const app = express();
app.use(express.json({ limit: "30mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ai-canvas", time: new Date().toISOString() });
});

app.get("/api/config", async (_req, res) => {
  res.json(publicConfig(await readConfig()));
});

app.post("/api/config", async (req, res) => {
  const state = await readConfig();
  const body = req.body || {};
  const profileId = String(body.profileId || state.activeProfileId);
  const current = state.profiles.find((profile) => profile.id === profileId) || activeProfile(state);
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
    autoSave: body.autoSave ?? current.autoSave,
    outputDir: body.outputDir ?? current.outputDir,
    apiKey: typeof body.apiKey === "string" && body.apiKey.trim() ? body.apiKey : current.apiKey
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
  const modelsUrl = endpoint.endsWith("/models") ? endpoint : `${endpoint}/models`;
  try {
    const response = await fetch(modelsUrl, { headers: { Authorization: `Bearer ${apiKey}` } });
    const bodyText = await response.text();
    if (!response.ok) return res.status(response.status).json({ ok: false, error: `\u8fde\u63a5\u8fd4\u56de\u72b6\u6001\u7801 ${response.status}\u3002`, detail: bodyText.slice(0, 300) });
    res.json({ ok: true, message: "\u8fde\u63a5\u6210\u529f\u3002" });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message || "\u65e0\u6cd5\u8fde\u63a5 Endpoint\u3002" });
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
  const quality = String(req.body?.quality || config.quality || defaultProfile.quality).trim();
  const referenceImages = (Array.isArray(req.body?.referenceImages) ? req.body.referenceImages : [req.body?.referenceImage]).map((value) => String(value || "").trim()).filter(Boolean).slice(0, 5);
  try {
    let response;
    let bodyText;
    if (referenceImages.length) {
      const form = new FormData();
      form.append("model", model);
      form.append("prompt", prompt);
      form.append("size", size);
      form.append("quality", quality);
      for (const [index, referenceImage] of referenceImages.entries()) {
        form.append("image", await imageBlobFromInput(referenceImage), `reference-${index + 1}.png`);
      }
      ({ response, bodyText } = await fetchImageGeneration(editsUrl(config.endpoint), { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form }));
    } else {
      ({ response, bodyText } = await fetchImageGeneration(generationUrl(config.endpoint), {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, size, quality, ...verifiedImageResponseOptions })
      }));
    }
    let payload = {};
    try { payload = JSON.parse(bodyText); } catch { /* The provider may return a non-JSON error body. */ }
    const responseText = providerResponseText(payload, bodyText);
    const rawResponseText = String(bodyText || "").slice(0, 100000);
    if (!response.ok) return res.status(response.status).json({ ok: false, error: payload?.error?.message || `Image generation returned ${response.status}.`, responseText, rawResponseText });
    const imageUrl = getImageFromPayload(payload);
    if (!imageUrl) return res.status(502).json({ ok: false, error: "\u670d\u52a1\u5546\u6ca1\u6709\u8fd4\u56de\u56fe\u7247 URL \u6216 base64 \u56fe\u7247\u3002", responseText, rawResponseText });
    let savedPath = "";
    let fileSize = 0;
    let saveError = "";
    if (config.autoSave && imageUrl.startsWith("data:")) {
      try {
        const savedImage = await saveImageToDisk(imageUrl, prompt, config.outputDir);
        savedPath = savedImage.filePath;
        fileSize = savedImage.fileSize;
      } catch (error) {
        saveError = error.message || "Automatic save failed.";
      }
    }
    res.json({ ok: true, imageUrl, revisedPrompt: payload?.data?.[0]?.revised_prompt || "", savedPath, fileSize, saveError, responseText, rawResponseText });
    if (config.autoSave && !imageUrl.startsWith("data:")) {
      void saveImageToDisk(imageUrl, prompt, config.outputDir).catch((error) => console.warn("[AI Canvas] Automatic image save failed:", error.message || error));
    }
  } catch (error) {
    if (error?.code === "IMAGE_GENERATION_TIMEOUT") return res.status(504).json({ ok: false, error: error.message, responseText: error.message, rawResponseText: "" });
    const errorMessage = error.message || "\u65e0\u6cd5\u8fde\u63a5\u56fe\u7247\u670d\u52a1\u5546\u3002";
    res.status(502).json({ ok: false, error: errorMessage, responseText: errorMessage, rawResponseText: "" });
  }
});

app.get("/api/image-proxy", async (req, res) => {
  let parsed;
  try { parsed = new URL(String(req.query.url || "")); } catch { return res.status(400).send("Invalid image URL."); }
  if (!/^https?:$/.test(parsed.protocol)) return res.status(400).send("Only http(s) image URLs are supported.");
  try {
    const response = await fetch(parsed);
    if (!response.ok) return res.status(response.status).send("Unable to fetch image.");
    res.setHeader("Content-Type", response.headers.get("content-type") || "image/png");
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.send(Buffer.from(await response.arrayBuffer()));
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
