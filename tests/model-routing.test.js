import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import * as modelRules from "../shared/imageModels.js";
import { SUPPORTED_IMAGE_MODELS, getImageSizeOptions, getImageSizeSelection } from "../web/src/config/imageSizes.js";

// Evaluate only helpers and the route with in-memory mocks. Importing server.js
// would start a real server and read private configuration, which tests must avoid.
const source = readFileSync(new URL("../server/server.js", import.meta.url), "utf8");
function helper(name) {
  const start = source.search(new RegExp(`^(?:async )?function ${name}\\(`, "m"));
  assert.notEqual(start, -1, `Missing helper: ${name}`);
  const end = source.indexOf("\n}", start);
  return source.slice(start, end + 2);
}
const helpers = [
  "cleanEndpoint", "generationUrl", "editsUrl", "imageEditUrl",
  "geminiBaseEndpoint", "geminiGenerateContentUrl", "geminiImageSize", "geminiAspectRatio",
  "geminiAuthHeaders", "isHttpImageUrl", "inlineGeminiImage", "geminiRequestBody",
  "requestLogValue", "imageRequestText", "referenceImageRequestValue", "imageBlobFromInput",
  "senseNovaSize", "senseNovaRequestFields", "senseNovaReferenceImageFields",
  "grokAspectRatio", "grokResolution", "grokRequestSizeFields", "grokQualityField",
  "grokReferenceImageFields", "imageUrlReferenceFields"
].map(helper).join("\n");
const routeStart = source.indexOf('app.post("/api/generate",');
const routeEnd = source.indexOf('\napp.get("/api/image-save-status/', routeStart);
assert.ok(routeStart >= 0 && routeEnd > routeStart);
const route = source.slice(routeStart, routeEnd);

function fixture(profileOverrides = {}) {
  const profile = { id: "test", endpoint: "https://provider.invalid/v1", apiKey: "test-key", responseFormat: "url", ...profileOverrides };
  const requests = [];
  const pollModels = [];
  const recordRequest = async (url, options) => {
    const form = options.body instanceof FormData ? options.body : null;
    requests.push({ url, ...options, form, body: form ? Object.fromEntries(form) : JSON.parse(options.body) });
    return { response: { ok: true, status: 200 }, bodyText: '{"data":[{"url":"https://image.invalid/result.png"}]}' };
  };
  const context = vm.createContext({
    ...modelRules,
    GROK_ASPECT_RATIOS: new Set(["auto", "1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "9:19.5", "19.5:9", "9:20", "20:9", "1:2", "2:1"]),
    app: { post: (_path, handler) => { context.handler = handler; } },
    readConfig: async () => ({ profiles: [profile] }), activeProfile: () => profile,
    defaultProfile: { model: "gpt-image-2", size: "1024x1024", ratio: "1:1", resolution: "1K", quality: "high" },
    configuredImageDownloadProxy: config => config.proxy || "",
    verifiedImageResponseOptions: { n: 1 },
    fetchImageGeneration: recordRequest,
    fetchGeminiGenerationWithProxy: (url, key, body, proxy) => recordRequest(url, { body, proxy }),
    waitForGeminiTask: async (endpoint, key, payload) => { pollModels.push(endpoint); return payload; },
    providerResponseText: payload => JSON.stringify(payload),
    getImageFromPayload: payload => payload.data[0].url,
    imageSaveJobs: new Map(), saveImageJob: async () => {},
    Buffer, Blob, FormData, AbortController, setTimeout, clearTimeout,
    imageDownloadTimeoutMs: 60000, imageDownloadHeaders: {},
    fetch: async () => { throw new Error("Unexpected network request"); }
  });
  vm.runInContext(`${helpers}\n${route}`, context);
  async function generate(body, expectedStatus = 200) {
    let output;
    let status = 200;
    const res = { status: value => { status = value; return res; }, json: value => { output = value; } };
    await context.handler({ body: { prompt: "test prompt", model: "gemini-nano-banana-2.1", ...body } }, res);
    assert.equal(status, expectedStatus, output?.error);
    assert.equal(output.ok, expectedStatus === 200, output?.error);
    return output;
  }
  return { context, requests, pollModels, generate };
}

test("Gemini names include old models, new aliases, case and path prefixes", () => {
  const { context } = fixture();
  for (const model of [...SUPPORTED_IMAGE_MODELS.filter(model => model.startsWith("gemini-")), "gemini-future-image-9.0", " GEMINI-NANO-BANANA-2.1 ", "models/gemini-nano-banana-2.1", "provider/gemini-future"]) {
    assert.equal(context.isGeminiImageModel(model), true, model);
  }
  for (const model of ["", null, "gemini-", "other-gemini-image", "gemini-invalid/name", "gemini-invalid name", "gpt-image-2", "seedream-v5-pro", "grok-imagine-image", "sensenova-u1.5-lite"]) {
    assert.equal(context.isGeminiImageModel(model), false, String(model));
  }
});

test("new and future Gemini models use native JSON and preserve model names", async () => {
  for (const model of ["gemini-nano-banana-2.1", "gemini-future-image-9.0"]) {
    const { generate, requests, pollModels } = fixture();
    await generate({ model, resolution: "2K", ratio: "16:9" });
    assert.equal(requests[0].url, `https://provider.invalid/v1beta/models/${model}:generateContent`);
    assert.equal(requests[0].headers["Content-Type"], "application/json");
    assert.deepEqual(requests[0].body.contents, [{ role: "user", parts: [{ text: "test prompt" }] }]);
    assert.deepEqual(requests[0].body.generationConfig, { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "16:9", imageSize: "2K" } });
    assert.equal("size" in requests[0].body, false);
    assert.equal(pollModels.length, 1);
  }
});

test("Gemini reference images use inlineData even with URL transmission selected", async () => {
  const { generate, requests } = fixture({ referenceImageMode: "url" });
  const output = await generate({ referenceImages: ["data:image/png;base64,cGljdHVyZQ==", "data:image/jpeg;base64,cGljdHVyZTI="] });
  assert.ok(requests[0].url.endsWith(":generateContent"));
  assert.deepEqual(requests[0].body.contents[0].parts.slice(1), [
    { inlineData: { mimeType: "image/png", data: "cGljdHVyZQ==" } },
    { inlineData: { mimeType: "image/jpeg", data: "cGljdHVyZTI=" } }
  ]);
  assert.equal(output.requestText.includes("cGljdHVyZQ=="), false);
  assert.equal(output.requestText.includes("test-key"), false);
});

test("Gemini native generation retains proxy handling", async () => {
  const { generate, requests } = fixture({ proxy: "http://127.0.0.1:7890" });
  await generate({});
  assert.equal(requests[0].proxy, "http://127.0.0.1:7890");
  assert.ok(requests[0].url.endsWith(":generateContent"));
});

test("Gemini auto sizing omits image config fields", async () => {
  const { generate, requests } = fixture();
  await generate({ resolution: "auto", ratio: "auto" });
  assert.equal("imageConfig" in requests[0].body.generationConfig, false);
});

test("unrecognized names retain generic OpenAI compatible generation", async () => {
  const { generate, requests, pollModels } = fixture();
  await generate({ model: "other-new-image-model" });
  assert.equal(requests[0].url, "https://provider.invalid/v1/images/generations");
  assert.equal(requests[0].body.model, "other-new-image-model");
  assert.equal(requests[0].body.size, "1024x1024");
  assert.equal(pollModels.length, 0);
});

test("new Gemini model is built in and retains Gemini size options", () => {
  assert.ok(SUPPORTED_IMAGE_MODELS.includes("gemini-nano-banana-2.1"));
  assert.deepEqual(getImageSizeOptions("gemini-nano-banana-2.1"), getImageSizeOptions("gemini-3-pro-image"));
  assert.deepEqual(getImageSizeOptions("gemini-future-image-9.0"), getImageSizeOptions("gemini-3-pro-image"));
});

const localRefs = ["data:image/png;base64,cGljdHVyZQ==", "data:image/jpeg;base64,cGljdHVyZTI="];

test("all family prefixes accept future models, case and provider prefixes", () => {
  for (const family of ["gemini", "grok", "seedream", "sensenova", "gpt"]) {
    for (const name of [`${family}-future-image-9.0`, ` PROVIDER/${family.toUpperCase()}-FUTURE-9.0 `]) {
      assert.equal(modelRules.imageModelFamily(name), family, name);
    }
    for (const name of [`${family}-`, `not-${family}-image`, `${family}-invalid name`]) {
      assert.equal(modelRules.imageModelFamily(name), "openai", name);
    }
  }
  for (const name of ["grok4.3-img", "GROK4.5-IMG", "provider/grok4.3-img"]) {
    assert.equal(modelRules.imageModelFamily(name), "grok", name);
  }
  for (const name of [null, "", "not-recognized", "gemini-invalid/name"]) {
    assert.equal(modelRules.imageModelFamily(name), "openai", String(name));
  }
});

test("Seedream future names inherit JSON generation and image[] multipart editing", async () => {
  for (const model of ["seedream-future-image", "provider/SEEDREAM-NEW-9"]) {
    const { generate, requests } = fixture();
    await generate({ model });
    assert.equal(requests[0].url, "https://provider.invalid/v1/images/generations");
    assert.deepEqual(requests[0].body, { model, prompt: "test prompt", n: 1, size: "1024x1024", quality: "high", output_format: "png", response_format: "b64_json" });
    const output = await generate({ model, referenceImages: localRefs, quality: "auto" });
    assert.equal(requests[1].url, "https://provider.invalid/v1/images/edits");
    assert.equal(requests[1].form.getAll("image[]").length, 2);
    assert.equal(requests[1].form.has("image"), false);
    assert.equal(requests[1].body.output_format, "png");
    assert.equal(requests[1].body.response_format, "b64_json");
    assert.equal(requests[1].form.has("quality"), false);
    assert.equal(output.requestText.includes("cGljdHVyZQ=="), false);
  }
});

test("Grok future names inherit aspect ratio, resolution and multipart editing", async () => {
  for (const model of ["grok-future-image", "provider/GROK-NEW-9", "grok4.3-img", "grok4.5-img"]) {
    const { generate, requests } = fixture();
    await generate({ model, ratio: "16:9", resolution: "2K" });
    assert.equal(requests[0].body.model, model);
    assert.equal(requests[0].body.aspect_ratio, "16:9");
    assert.equal(requests[0].body.resolution, "2k");
    assert.equal("size" in requests[0].body, false);
    await generate({ model, ratio: "auto", resolution: "auto", referenceImages: localRefs });
    assert.equal(requests[1].form.getAll("image[]").length, 2);
    assert.equal(requests[1].body.aspect_ratio, "auto");
    assert.equal(requests[1].form.has("resolution"), false);
    assert.equal(requests[1].form.has("size"), false);
    await generate({ model, referenceImages: localRefs.slice(0, 1) });
    assert.equal(requests[2].form.getAll("image").length, 1);
  }
});

test("exact Grok 2.0 preserves JSON edits and its quality exception", async () => {
  for (const model of ["grok-imagine-image-2.0", "provider/GROK-IMAGINE-IMAGE-2.0"]) {
    const { generate, requests } = fixture();
    await generate({ model, referenceImages: [localRefs[0]], quality: "high" });
    assert.equal(requests[0].form, null);
    assert.deepEqual(requests[0].body.image, { image_url: localRefs[0] });
    assert.equal("quality" in requests[0].body, false);
    await generate({ model, referenceImages: localRefs, quality: "low" });
    assert.deepEqual(requests[1].body.images, localRefs.map(image_url => ({ image_url })));
    assert.equal(requests[1].body.quality, "low");
  }
  assert.equal(modelRules.isGrokImageJsonModel("grok-imagine-image-2.0-new"), false);
});

test("SenseNova future names use common JSON fields and JSON references, not Lite-only options", async () => {
  for (const model of ["sensenova-future-image", "provider/SENSENOVA-NEW-9"]) {
    const { generate, requests } = fixture();
    await generate({ model, watermark: false, promptExtend: false, outputFormat: "webp" });
    assert.deepEqual(requests[0].body, { model, size: "1024x1024", response_format: "url", watermark: false, n: 1, prompt: "test prompt" });
    await generate({ model, referenceImages: localRefs });
    assert.equal(requests[1].url, "https://provider.invalid/v1/images/edits");
    assert.equal(requests[1].form, null);
    assert.deepEqual(requests[1].body.images, localRefs.map(image_url => ({ image_url })));
    assert.equal("quality" in requests[1].body, false);
    assert.equal("prompt_extend" in requests[1].body, false);
    assert.equal("output_format" in requests[1].body, false);
  }
});

test("SenseNova Lite preserves its optional fields, Fast rejects references and retains fixed dimensions", async () => {
  const { generate, requests } = fixture();
  await generate({ model: "provider/SENSENOVA-U1.5-LITE", promptExtend: false, outputFormat: "webp", referenceImages: localRefs });
  assert.equal(requests[0].body.prompt_extend, false);
  assert.equal(requests[0].body.output_format, "webp");
  assert.equal(requests[0].body.n, 1);
  await generate({ model: "provider/SENSENOVA-U1-FAST", ratio: "9:16" });
  assert.equal(requests[1].body.size, "1536x2752");
  assert.equal("prompt_extend" in requests[1].body, false);
  const output = await generate({ model: "sensenova-u1-fast", referenceImages: localRefs }, 502);
  assert.match(output.error, /不支持参考图/);
  assert.equal(requests.length, 2);
  await generate({ model: "sensenova-u1-fast-new", referenceImages: localRefs });
  assert.equal(requests[2].form, null);
  assert.equal(requests[2].body.size, "1024x1024");
});

test("GPT future names use OpenAI defaults, keeping URL-reference mode specific to GPT Image 2", async () => {
  const { generate, requests } = fixture({ referenceImageMode: "url" });
  const model = "provider/GPT-FUTURE-IMAGE";
  await generate({ model });
  assert.deepEqual(requests[0].body, { model, prompt: "test prompt", size: "1024x1024", quality: "high", n: 1, response_format: "url", output_format: "png" });
  await generate({ model, referenceImages: localRefs });
  assert.equal(requests[1].url, "https://provider.invalid/v1/images/edits");
  assert.equal(requests[1].form.getAll("image").length, 2);
  await generate({ model: "provider/GPT-IMAGE-2", referenceImages: ["https://image.invalid/reference.png"] });
  assert.equal(requests[2].form, null);
  assert.equal(requests[2].body.image_url, "https://image.invalid/reference.png");
  await generate({ model: "gpt-image-2", referenceImages: localRefs });
  assert.equal(requests[3].form.getAll("image").length, 2);
  assert.equal(modelRules.isGptImage2Model("gpt-image-2-new"), false);
});

test("family size menus and exact model constraints stay in sync for new, uppercase and namespaced names", () => {
  for (const model of ["grok-future-image", "provider/GROK-NEW-9"]) {
    assert.deepEqual(getImageSizeOptions(model), getImageSizeOptions("grok-imagine-image"));
    assert.equal(getImageSizeSelection({ model, resolution: "auto", ratio: "16:9" }).ratio, "auto");
  }
  for (const model of ["seedream-future-image", "provider/SEEDREAM-NEW-9"]) {
    assert.deepEqual(getImageSizeOptions(model), getImageSizeOptions("seedream-v5-pro"));
  }
  for (const name of ["sensenova-u1.5-lite", "sensenova-u1-fast", "gpt-image-2", "gemini-nano-banana-2.1", "seedream-v5-pro"]) {
    assert.deepEqual(getImageSizeOptions(`provider/${name.toUpperCase()}`), getImageSizeOptions(name));
  }
  assert.equal(getImageSizeSelection({ model: "provider/SENSENOVA-U1.5-LITE", resolution: "custom", width: 513, height: 513 }).size, "512x512");
  assert.equal(getImageSizeSelection({ model: "sensenova-future-image", resolution: "custom", width: 513, height: 513 }).size, "513x513");
  for (const model of ["gpt-future-image", "sensenova-future-image", "unknown-image"]) {
    assert.deepEqual(getImageSizeOptions(model), getImageSizeOptions("gpt-image-2"));
  }
});

test("Gemini HTTP references still become inlineData rather than URL fields", async () => {
  const { context, generate, requests } = fixture({ referenceImageMode: "url" });
  const downloaded = [];
  context.fetch = async url => {
    downloaded.push(url);
    return { ok: true, headers: { get: () => "image/png" }, arrayBuffer: async () => Buffer.from("picture") };
  };
  await generate({ referenceImages: ["https://image.invalid/reference.png"] });
  assert.deepEqual(downloaded, ["https://image.invalid/reference.png"]);
  assert.deepEqual(requests[0].body.contents[0].parts[1], { inlineData: { mimeType: "image/png", data: "cGljdHVyZQ==" } });
});

test("unknown model editing remains multipart and request logs redact keys and image data for all families", async () => {
  for (const model of ["gemini-future-image", "grok-future-image", "seedream-future-image", "sensenova-future-image", "gpt-future-image", "unknown-image"]) {
    const { generate, requests } = fixture();
    const output = await generate({ model, referenceImages: localRefs });
    assert.equal(output.requestText.includes("test-key"), false, model);
    assert.equal(output.requestText.includes("cGljdHVyZQ=="), false, model);
    if (model === "unknown-image") {
      assert.equal(requests[0].form.getAll("image").length, 2);
      assert.equal(requests[0].url, "https://provider.invalid/v1/images/edits");
    }
  }
});

test("GPT Image 2 fixed dimensions keep their existing constraints", () => {
  for (const resolution of ["1K", "2K", "4K"]) {
    for (const ratio of getImageSizeOptions("gpt-image-2", resolution).ratios) {
      const { width, height } = getImageSizeSelection({ model: "gpt-image-2", resolution, ratio });
      assert.equal(width % 16, 0);
      assert.equal(height % 16, 0);
      assert.ok(Math.max(width, height) <= 3840);
      assert.ok(width * height >= 655360 && width * height <= 8294400);
      assert.ok(Math.max(width, height) / Math.min(width, height) <= 3);
    }
  }
});
