import { Component, Fragment, memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AUTO_IMAGE_RESOLUTION, CUSTOM_IMAGE_RESOLUTION, DEFAULT_IMAGE_MODEL, formatImageRatioOption, getImageSizeOptions, getImageSizeSelection, normalizeImageSizeSelection, SUPPORTED_IMAGE_MODELS } from "./config/imageSizes";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  FileDown,
  GripVertical,
  History as HistoryIcon,
  ImagePlus,
  ImageUp,
  Images,
  KeyRound,
  Layers3,
  Loader2,
  Maximize2,
  Move,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  RefreshCw,
  ScrollText,
  Server,
  Settings2,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  NodeResizer,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow
} from "@xyflow/react";

const HISTORY_KEY = "ai-canvas-history-v1";
const DEFAULT_SIZE_SELECTION = getImageSizeSelection({ model: DEFAULT_IMAGE_MODEL });
const IMAGE_GENERATION_TIMEOUT_MS = 180_000;
const IMAGE_SAVE_BROWSER_TIMEOUT_MS = 60_000;

const cn = {
  appTitle: "AI \u65e0\u9650\u753b\u5e03",
  localWorkspace: "\u672c\u5730\u5de5\u4f5c\u533a",
  promptNode: "Prompt \u8282\u70b9",
  deletePromptNode: "\u5220\u9664 Prompt \u8282\u70b9",
  promptPlaceholder: "\u63cf\u8ff0\u4f60\u60f3\u751f\u6210\u7684\u56fe\u7247...",
  imagePrompt: "\u56fe\u7247 Prompt",
  generating: "\u751f\u6210\u4e2d",
  generate: "\u751f\u6210",
  textToImage: "\u6587\u751f\u56fe",
  imageToImage: "\u56fe\u751f\u56fe",
  imageAdded: "\u56fe\u7247\u5df2\u6dfb\u52a0\u5230\u753b\u5e03",
  imageAddedToast: "\u56fe\u7247\u5df2\u6dfb\u52a0\u5230\u753b\u5e03\u3002",
  generatedImage: "\u751f\u6210\u56fe\u7247",
  imagePlaceholder: "\u56fe\u7247\u5c06\u663e\u793a\u5728\u6b64",
  imageSaving: "\u6b63\u5728\u8bfb\u53d6\u672c\u5730\u56fe\u7247...",
  imageSaveFailed: "\u56fe\u7247\u4e0b\u8f7d\u548c\u4fdd\u5b58\u5931\u8d25\u3002",
  retryDownload: "重新下载",
  retryingDownload: "重新下载中",
  waiting: "\u7b49\u5f85",
  temporaryUrl: "\u4e34\u65f6 URL\uff1a",
  downloadMethod: "\u4e0b\u8f7d\u65b9\u5f0f\uff1a",
  fileSize: "\u6587\u4ef6\u5927\u5c0f\uff1a",
  actualSize: "\u5b9e\u9645\u5c3a\u5bf8\uff1a",
  generationDuration: "\u751f\u6210\u8017\u65f6\uff1a",
  apiRequestDuration: "API \u8bf7\u6c42\uff1a",
  imageDownloadDuration: "\u56fe\u7247\u4e0b\u8f7d\uff1a",
  localWriteDuration: "\u672c\u5730\u4fdd\u5b58\uff1a",
  totalDuration: "\u603b\u8017\u65f6\uff1a",
  modelInfo: "\u6a21\u578b\uff1a",
  qualityInfo: "\u8d28\u91cf\uff1a",
  requestInfo: "\u8bf7\u6c42\u4fe1\u606f",
  requestProfile: "\u914d\u7f6e\u6863\uff1a",
  requestReferenceCount: "\u53c2\u8003\u56fe\u6570\uff1a",
  requestResponseFormat: "\u8fd4\u56de\u683c\u5f0f\uff1a",
  requestCount: "\u8bf7\u6c42\u6570\u91cf",
  requestNotSent: "\u672a\u53d1\u9001",
  noReferenceImage: "\u65e0",
  responseInfo: "\u8fd4\u56de\u4fe1\u606f\uff1a",
  rawResponseInfo: "\u539f\u59cb\u54cd\u5e94\uff1a",
  errorInfo: "\u9519\u8bef\uff1a",
  infoUnavailable: "\u672a\u83b7\u53d6",
  openImage: "\u6253\u5f00\u56fe\u7247",
  openUrl: "\u6253\u5f00 URL",
  downloadImage: "\u4e0b\u8f7d\u56fe\u7247",
  deleteImageNode: "\u5220\u9664\u56fe\u7247\u8282\u70b9",
  untitledGeneration: "\u672a\u547d\u540d\u751f\u6210",
  expandSidebar: "\u5c55\u5f00\u4fa7\u8fb9\u680f",
  collapseSidebar: "\u6536\u8d77\u4fa7\u8fb9\u680f",
  canvas: "\u753b\u5e03",
  history: "\u5386\u53f2\u8bb0\u5f55",
  apiSettings: "API \u8bbe\u7f6e",
  create: "\u521b\u5efa",
  addPromptNode: "\u6dfb\u52a0 Prompt \u8282\u70b9",
  localReady: "\u672c\u5730\u670d\u52a1\u5df2\u5c31\u7eea",
  workspace: "\u5de5\u4f5c\u533a",
  untitledCanvas: "\u672a\u547d\u540d\u753b\u5e03",
  zoomOut: "\u7f29\u5c0f",
  fitCanvas: "\u9002\u5e94\u753b\u5e03",
  zoomIn: "\u653e\u5927",
  settings: "\u8bbe\u7f6e",
  newPrompt: "\u65b0\u5efa Prompt",
  selected: "\u5df2\u9009\u62e9",
  items: "\u4e2a",
  dragToPan: "\u62d6\u52a8\u5e73\u79fb",
  scrollToZoom: "\u6eda\u8f6e\u7f29\u653e",
  localApiProxy: "\u672c\u5730 API \u4ee3\u7406",
  settingsIntro: "\u914d\u7f6e\u672c\u5de5\u4f5c\u533a\u4f7f\u7528\u7684 OpenAI \u517c\u5bb9\u56fe\u7247\u751f\u6210\u63a5\u53e3\u3002",
  keySaved: "\u5bc6\u94a5\u5df2\u4fdd\u5b58\u5728\u672c\u5730",
  keyMissing: "\u5c1a\u672a\u914d\u7f6e\u5bc6\u94a5",
  endpoint: "Endpoint \u5730\u5740",
  appendEndpoint: "\u670d\u52a1\u7aef\u4f1a\u5728\u9700\u8981\u65f6\u81ea\u52a8\u8865\u4e0a",
  imageDownloadProxy: "\u56fe\u7247\u4e0b\u8f7d\u4ee3\u7406",
  imageDownloadProxyEnabled: "代理开关",
  advancedSettings: "高级设置",
  advancedSettingsIntro: "下载、返回和参考图传输选项。",
  workspaceStorageMode: "工作区保存位置",
  workspaceStorageModeBrowser: "浏览器缓存",
  workspaceStorageModeFile: "本地文件",
  workspaceStorageModeAuto: "自动",
  workspaceStorageModeHint: "本地文件和自动模式会将工作区保存到项目 data/workspace.json。",
  imageDownloadProxyPort: "\u4ee3\u7406\u7aef\u53e3",
  imageDownloadProxyHint: "\u53ef\u76f4\u63a5\u586b\u5199\u7aef\u53e3\uff08\u5982 7890\uff09\uff0c\u4e5f\u652f\u6301\u5b8c\u6574 HTTP/HTTPS/SOCKS \u5730\u5740\u3002",
  referenceImageMode: "参考图传输方式",
  referenceImageModeFile: "文件上传（原模式）",
  referenceImageModeUrl: "HTTP(S) 图片 URL",
  imageEditEndpointMode: "图生图接口",
  imageEditEndpointModeAuto: "自动（默认）",
  imageEditEndpointModeEdits: "/images/edits",
  imageEditEndpointModeGenerations: "/images/generations",
  imageEditEndpointModeHint: "仅影响带参考图的请求，文生图始终使用 /images/generations。",
  apiKey: "API Key",
  keepSavedKey: "\u7559\u7a7a\u4ee5\u4fdd\u7559\u5df2\u4fdd\u5b58\u7684\u5bc6\u94a5",
  keyNote: "\u7531\u672c\u5730 Node \u670d\u52a1\u4fdd\u5b58\uff0c\u6d4f\u89c8\u5668\u4e0d\u4f1a\u8bfb\u53d6\u5bc6\u94a5\u539f\u6587\u3002",
  model: "Model",
  size: "\u5c3a\u5bf8",
  custom: "\u81ea\u5b9a\u4e49",
  auto: "\u81ea\u52a8",
  quality: "\u8d28\u91cf",
  responseFormat: "\u8fd4\u56de\u683c\u5f0f",
  responseFormatUrl: "URL",
  responseFormatBase64: "Base64",
  high: "\u9ad8",
  medium: "\u4e2d",
  low: "\u4f4e",
  saving: "\u4fdd\u5b58\u4e2d",
  saveSettings: "\u4fdd\u5b58\u8bbe\u7f6e",
  testing: "\u6d4b\u8bd5\u4e2d",
  testConnection: "\u6d4b\u8bd5\u8fde\u63a5",
  fetchModels: "\u83b7\u53d6\u6a21\u578b",
  fetchingModels: "\u83b7\u53d6\u4e2d",
  modelsFetched: "\u5df2\u83b7\u53d6\u5230\u4ee5\u4e0b\u6a21\u578b\uff1a",
  modelsEmpty: "\u8be5\u7aef\u70b9\u6ca1\u6709\u8fd4\u56de\u6a21\u578b\u5217\u8868\u3002",
  modelsFetchFailed: "\u83b7\u53d6\u6a21\u578b\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u5730\u5740\u548c\u5bc6\u94a5\u3002",
  settingsSaved: "\u8bbe\u7f6e\u5df2\u4fdd\u5b58\u3002",
  connectionOk: "\u8fde\u63a5\u6210\u529f\u3002",
  connectionFail: "\u8fde\u63a5\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u5730\u5740\u548c\u5bc6\u94a5\u3002",
  configFiles: "\u914d\u7f6e\u6587\u4ef6",
  moveWorkspace: "\u5728\u4e0d\u540c\u7535\u8111\u4e4b\u95f4\u8fc1\u79fb\u672c\u5de5\u4f5c\u533a\u3002",
  exportJson: "\u5bfc\u51fa JSON",
  importJson: "\u5bfc\u5165 JSON",
  exportWarning: "\u5bfc\u51fa\u6587\u4ef6\u5305\u542b\u5df2\u4fdd\u5b58\u7684 API Key\uff0c\u8bf7\u59a5\u5584\u4fdd\u7ba1\u3002",
  generations: "\u751f\u6210\u8bb0\u5f55",
  historyIntro: "\u6700\u8fd1\u751f\u6210\u7684\u56fe\u7247\u4f1a\u4fdd\u5b58\u5728\u5f53\u524d\u6d4f\u89c8\u5668\u4e2d\u3002",
  clearHistory: "\u6e05\u7a7a\u5386\u53f2",
  clearCache: "\u6e05\u9664\u7f13\u5b58",
  confirmClearCache: "\u786e\u5b9a\u6e05\u9664\u753b\u5e03\u548c\u5386\u53f2\u8bb0\u5f55\u5417\uff1f \u5df2\u83b7\u53d6\u7684\u6a21\u578b\u3001\u9ad8\u4eae\u8bb0\u5f55\u3001API \u5730\u5740\u548c Key \u4e0d\u4f1a\u88ab\u5220\u9664\u3002",
  confirmDeleteHistoryItem: "确定删除这条历史记录吗？",
  noGenerations: "\u8fd8\u6ca1\u6709\u751f\u6210\u8bb0\u5f55",
  historyEmpty: "\u751f\u6210\u56fe\u7247\u540e\u4f1a\u663e\u793a\u5728\u8fd9\u91cc\u3002",
  addToCanvas: "\u6dfb\u52a0\u5230\u753b\u5e03",
  localServerMissing: "\u65e0\u6cd5\u8fde\u63a5\u672c\u5730\u670d\u52a1\u3002",
  downloadFailed: "\u4e0b\u8f7d\u5931\u8d25\uff0c\u8bf7\u5c1d\u8bd5\u5728\u65b0\u6807\u7b7e\u9875\u6253\u5f00\u56fe\u7247\u3002",
  saveFailed: "\u4fdd\u5b58\u5931\u8d25",
  cannotSave: "\u65e0\u6cd5\u4fdd\u5b58\u8bbe\u7f6e\u3002",
  cannotExport: "\u65e0\u6cd5\u5bfc\u51fa\u8bbe\u7f6e\u3002",
  configImported: "\u914d\u7f6e\u5df2\u5bfc\u5165\u3002",
  invalidConfig: "\u914d\u7f6e\u6587\u4ef6\u683c\u5f0f\u65e0\u6548\u3002",
  dismiss: "\u5173\u95ed\u63d0\u793a",
  generationFailed: "\u751f\u6210\u5931\u8d25\u3002",
  regenerate: "重新生成",
  modelRequired: "\u8bf7\u5148\u5728 API \u8bbe\u7f6e\u4e2d\u9ad8\u4eae\u81f3\u5c11\u4e00\u4e2a\u6a21\u578b\u3002",
  generationTimeout: "\u56fe\u7247\u751f\u6210\u8d85\u65f6\uff08180 \u79d2\uff09\u3002",
  nodeModel: "\u8282\u70b9\u6a21\u578b",
  nodeProfile: "\u8282\u70b9 API \u914d\u7f6e",
  nodeSize: "\u8282\u70b9\u5c3a\u5bf8",
  nodeQuality: "\u8282\u70b9\u8d28\u91cf",
  profile: "\u914d\u7f6e\u6863",
  profileName: "\u914d\u7f6e\u540d\u79f0",
  newProfile: "\u65b0\u5efa\u914d\u7f6e",
  deleteProfile: "\u5220\u9664\u914d\u7f6e",
  confirmDeleteProfile: "\u786e\u5b9a\u5220\u9664\u5f53\u524d\u914d\u7f6e\u5417\uff1f",
  profileSaved: "\u914d\u7f6e\u6863\u5df2\u4fdd\u5b58\u3002",
  outputDir: "\u8f93\u51fa\u76ee\u5f55",
  autoSaveHint: "\u81ea\u52a8\u4fdd\u5b58\u7531\u672c\u5730\u670d\u52a1\u5668\u5199\u5165\u8BE5\u6587\u4EF6\u5939\u3002",
  autoSaved: "\u5df2\u81ea\u52a8\u4fdd\u5b58\u5230",
  newCanvas: "\u65b0\u5efa\u753b\u5e03",
  canvasList: "\u753b\u5e03\u5217\u8868",
  canvasCount: "\u4e2a\u753b\u5e03",
  referenceImage: "\u53c2\u8003\u56fe",
  addReferenceImage: "\u4e0a\u4f20\u53c2\u8003\u56fe",
  removeReferenceImage: "\u79fb\u9664\u53c2\u8003\u56fe",
  referenceImageLimit: "最多 5 张参考图",
  referenceImageUnlimited: "参考图数量不限",
  deleteCanvas: "\u5220\u9664\u753b\u5e03",
  renameCanvas: "\u91cd\u547d\u540d\u753b\u5e03",
  confirmDeleteCanvas: "\u786e\u5b9a\u5220\u9664\u5f53\u524d\u753b\u5e03\u5417\uff1f",
  imageGroup: "图片编组",
  addImageGroup: "添加图片编组",
  groupDropHint: "拖入图片到此处",
  groupEmpty: "图片组为空",
  removeGroupImage: "从图片组移除",
  stitchMode: "拼图方式",
  stitchBasis: "分辨率依据",
  stitchButton: "拼图",
  stitchLeftRight: "左右拼图",
  stitchTopBottom: "上下拼图",
  stitchMaxResolution: "最大分辨率",
  stitchMinResolution: "最小分辨率",
  stitchNeedImages: "至少需要两张图片才能拼图。",
  stitchFailed: "拼图失败，请确认图片可以正常读取。",
  logs: "\u65e5\u5fd7",
  generationLogs: "\u751f\u6210\u65e5\u5fd7",
  noLogs: "\u6682\u65e0\u751f\u6210\u8fd4\u56de\u4fe1\u606f",
  close: "\u5173\u95ed",
  comparison: "效果对比",
  comparisonTitle: "效果对比",
  comparisonPrompt: "比较提示词",
  comparisonPromptPlaceholder: "输入要比较的提示词...",
  comparisonApis: "选择 API",
  comparisonApiHint: "选择一个或多个 API 配置档",
  comparisonAddApi: "添加 API",
  comparisonReference: "参考图（可选）",
  comparisonAddReference: "添加参考图",
  comparisonGenerate: "开始对比",
  comparisonGenerating: "生成对比中",
  comparisonNoProfiles: "暂无可用 API 配置档",
  comparisonNoSelection: "请至少选择一个 API 配置档。",
  comparisonNoPrompt: "请输入提示词。",
  comparisonFailed: "生成失败",
  comparisonEmpty: "选择 API 后开始生成对比结果。"
};

const initialNodes = [
  {
    id: "prompt-1",
    type: "prompt",
    position: { x: 140, y: 130 },
    data: {
      prompt: "A quiet reading room in a floating lighthouse, soft morning light, editorial photography",
      status: "idle",
      error: "",
      model: DEFAULT_IMAGE_MODEL,
      ...DEFAULT_SIZE_SELECTION,
      quality: "high"
    }
  }
];

const CANVASES_KEY = "ai-canvas-workspaces-v1";
const FETCHED_MODELS_KEY = "ai-canvas-fetched-models-v1";
const SELECTED_MODELS_KEY = "ai-canvas-selected-models-v1";

function loadFetchedModelsByProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(FETCHED_MODELS_KEY) || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).map(([profileId, models]) => [profileId, Array.isArray(models) ? [...new Set(models.map((model) => String(model || "").trim()).filter(Boolean))] : []]));
  } catch {
    return {};
  }
}

function loadSelectedModelsByProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(SELECTED_MODELS_KEY) || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).map(([profileId, models]) => [profileId, Array.isArray(models) ? [...new Set(models.map((model) => String(model || "").trim()).filter(Boolean))] : []]));
  } catch {
    return {};
  }
}

function restoreInterruptedGenerationState(canvasState) {
  if (!canvasState?.canvases?.length) return canvasState;
  return {
    ...canvasState,
    canvases: canvasState.canvases.map((canvas) => ({
      ...canvas,
      nodes: (canvas.nodes || []).map((node) => {
        if (node?.data?.status !== "generating") return node;
        const error = node.data.error || "上一次生成已中断，请重新生成。";
        return {
          ...node,
          data: {
            ...node.data,
            status: node.type === "prompt" ? "idle" : "error",
            error
          }
        };
      })
    }))
  };
}

function loadCanvasState() {
  try {
    const saved = JSON.parse(localStorage.getItem(CANVASES_KEY) || "null");
    if (saved?.canvases?.length) return restoreInterruptedGenerationState(saved);
  } catch {
    // Ignore malformed local workspace data and start with a clean canvas.
  }
  return { activeId: "canvas-1", canvases: [{ id: "canvas-1", name: "\u672a\u547d\u540d\u753b\u5e03", nodes: initialNodes, edges: [] }] };
}

function compactResponseTextForStorage(value) {
  const text = String(value || "");
  if (!text) return text;
  try {
    const payload = JSON.parse(text);
    return JSON.stringify(payload, (key, nestedValue) => {
      if (/^(b64_json|b64Json|base64)$/i.test(key)) return "[image data omitted from local cache]";
      if (typeof nestedValue === "string" && /^data:image\//i.test(nestedValue) && nestedValue.length > 512) return "[image data omitted from local cache]";
      return nestedValue;
    }, 2);
  } catch {
    return text.length > 200000 ? `${text.slice(0, 200000)}\n[response truncated in local cache]` : text;
  }
}

function persistHistorySafely(items) {
  const storageItems = items.map((item) => ({ ...item, responseText: compactResponseTextForStorage(item.responseText), rawResponseText: compactResponseTextForStorage(item.rawResponseText) }));
  for (let length = items.length; length >= 0; length -= 1) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(storageItems.slice(0, length)));
      return;
    } catch {
      // Base64 images can exceed the browser quota; retry with fewer old entries.
    }
  }
  try { localStorage.removeItem(HISTORY_KEY); } catch { /* Ignore storage failures. */ }
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function elapsedSeconds(value) {
  const startedAt = Date.parse(value || "");
  return Number.isFinite(startedAt) ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0;
}

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function formatFileSize(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return cn.infoUnavailable;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function generatedImageFilename(model) {
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}${String(now.getMilliseconds()).padStart(3, "0")}`;
  const modelPart = String(model || "ai-image").slice(0, 50).replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-").replace(/^-+|-+$/g, "") || "ai-image";
  return `${timestamp}-${modelPart}.png`;
}

function isGrokImageModel(model) {
  return /(^|\/)(?:grok-imagine-image(?:-2\.0|-quality)?|grok4\.(?:3|5)-img)$/i.test(String(model || "").trim());
}

function isSenseNovaImageModel(model) {
  return /(^|\/)sensenova-u1(?:\.5-lite|-fast)$/i.test(String(model || "").trim());
}

function isSenseNovaU15LiteModel(model) {
  return /(^|\/)sensenova-u1\.5-lite$/i.test(String(model || "").trim());
}

function dataUrlByteSize(value) {
  const match = String(value || "").match(/^data:[^,]+;base64,(.*)$/);
  if (!match) return 0;
  const padding = (match[1].match(/=*$/)?.[0].length || 0);
  return Math.max(0, Math.floor(match[1].length * 0.75) - padding);
}

function displayImageSource(value, profileId = "") {
  const source = String(value || "");
  return /^https?:\/\//i.test(source) ? `/api/image-proxy?url=${encodeURIComponent(source)}${profileId ? `&profileId=${encodeURIComponent(profileId)}` : ""}` : source;
}

function loadCanvasImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image load failed"));
    image.src = displayImageSource(source);
  });
}

async function composeImageSources(sources, direction, resolutionBasis = "min") {
  const images = await Promise.all(sources.map((source) => loadCanvasImage(source)));
  if (images.length < 2) throw new Error(cn.stitchNeedImages);
  const horizontal = direction === "horizontal";
  const useMaximum = resolutionBasis === "max";
  const commonSize = horizontal
    ? (useMaximum ? Math.max : Math.min)(...images.map((image) => image.naturalHeight || image.height))
    : (useMaximum ? Math.max : Math.min)(...images.map((image) => image.naturalWidth || image.width));
  const dimensions = images.map((image) => {
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    return horizontal
      ? { width: Math.max(1, Math.round(width * commonSize / height)), height: commonSize }
      : { width: commonSize, height: Math.max(1, Math.round(height * commonSize / width)) };
  });
  const canvas = document.createElement("canvas");
  canvas.width = horizontal ? dimensions.reduce((sum, item) => sum + item.width, 0) : commonSize;
  canvas.height = horizontal ? commonSize : dimensions.reduce((sum, item) => sum + item.height, 0);
  const context = canvas.getContext("2d");
  if (!context) throw new Error(cn.stitchFailed);
  let offset = 0;
  images.forEach((image, index) => {
    const size = dimensions[index];
    if (horizontal) {
      context.drawImage(image, offset, 0, size.width, size.height);
      offset += size.width;
    } else {
      context.drawImage(image, 0, offset, size.width, size.height);
      offset += size.height;
    }
  });
  return { src: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
}

function PromptNode({ id, data, selected }) {
  const isGenerating = data.status === "generating";
  const referenceInputId = `reference-image-${id}`;
  const [isReferenceDragOver, setIsReferenceDragOver] = useState(false);
  const directReferenceImages = Array.isArray(data.referenceImages) ? data.referenceImages : (data.referenceImage ? [data.referenceImage] : []);
  const connectedReferenceImages = Array.isArray(data.connectedReferenceImages) ? data.connectedReferenceImages : [];
  const referenceImages = [...new Set([...directReferenceImages, ...connectedReferenceImages])].filter(Boolean);
  const isImageToImage = referenceImages.length > 0;
  const modelOptions = Array.isArray(data.modelOptions) ? data.modelOptions : [data.model || DEFAULT_IMAGE_MODEL];
  const activeModel = modelOptions.includes(data.model) ? data.model : (modelOptions[0] || "");
  const sizeSelection = normalizeImageSizeSelection({ ...data, model: activeModel || DEFAULT_IMAGE_MODEL });
  const sizeOptions = getImageSizeOptions(activeModel || DEFAULT_IMAGE_MODEL, sizeSelection.resolution);
  const isCustomSize = sizeSelection.resolution === CUSTOM_IMAGE_RESOLUTION;
  const isAutoSize = sizeSelection.resolution === AUTO_IMAGE_RESOLUTION;
  const isSenseNova = isSenseNovaImageModel(activeModel);
  const isSenseNovaU15Lite = isSenseNovaU15LiteModel(activeModel);
  const requestCount = isSenseNovaU15Lite ? 1 : Math.max(1, Math.min(5, Number(data.requestCount) || 1));
  const modelOptionsKey = modelOptions.join("|");
  const profileOptionsKey = (Array.isArray(data.profiles) ? data.profiles : []).map((profile) => profile?.name || profile?.id || "").join("|");
  const [parameterMinWidth, setParameterMinWidth] = useState(520);
  const parameterRef = useRef(null);
  const updateCustomDimension = (dimension, value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return;
    const nextSelection = normalizeImageSizeSelection({ model: activeModel || DEFAULT_IMAGE_MODEL, resolution: CUSTOM_IMAGE_RESOLUTION, width: dimension === "width" ? numeric : sizeSelection.width, height: dimension === "height" ? numeric : sizeSelection.height });
    data.onSizeChange?.(id, nextSelection);
  };

  useEffect(() => {
    if (isGenerating && !data.generationStartedAt) data.onResetGeneration?.(id);
  }, [data.generationStartedAt, data.onResetGeneration, id, isGenerating]);

  useLayoutEffect(() => {
    const element = parameterRef.current;
    if (!element) return undefined;
    const updateMinWidth = () => {
      const overflowWidth = element.scrollWidth > element.clientWidth + 1 ? element.scrollWidth + 28 : 520;
      setParameterMinWidth((current) => Math.max(current, overflowWidth, 520));
    };
    updateMinWidth();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(updateMinWidth) : null;
    observer?.observe(element);
    return () => observer?.disconnect();
  }, [activeModel, isAutoSize, isCustomSize, isSenseNova, isSenseNovaU15Lite, modelOptionsKey, profileOptionsKey, sizeSelection.height, sizeSelection.ratio, sizeSelection.resolution, sizeSelection.width]);

  return (
    <div className={`canvas-node prompt-node ${selected ? "is-selected" : ""}`}>
      <NodeResizer nodeId={id} isVisible={selected} minWidth={parameterMinWidth} maxWidth={Math.max(920, parameterMinWidth)} minHeight={350} lineClassName="resizer-line" handleClassName="resizer-handle" />
      <Handle type="target" position={Position.Left} className="node-handle" />
      <div className="node-header">
        <div className="node-type">
          <span className="node-icon prompt-icon"><Wand2 size={15} /></span>
          <span>{cn.promptNode}</span>
        </div>
        <div className="node-actions">
          {isGenerating && <button className="icon-button subtle nodrag" onClick={() => data.onResetGeneration?.(id)} aria-label="重置生成状态" title="重置生成状态"><RefreshCw size={15} /></button>}
          <button className="icon-button subtle nodrag" onClick={() => data.onDelete?.(id)} aria-label={cn.deletePromptNode} title={cn.deletePromptNode}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="node-body">
        <textarea
          className="prompt-input nodrag nowheel"
          value={data.prompt || ""}
          onChange={(event) => data.onPromptChange?.(id, event.target.value)}
          placeholder={cn.promptPlaceholder}
          aria-label={cn.imagePrompt}
        />
        <div className={`reference-image-row nodrag ${isReferenceDragOver ? "is-drag-over" : ""}`} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); setIsReferenceDragOver(true); }} onDragLeave={() => setIsReferenceDragOver(false)} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); setIsReferenceDragOver(false); data.onReferenceFiles?.(id, Array.from(event.dataTransfer.files || [])); }}>
          <div className="reference-image-previews">
            {referenceImages.map((src, index) => { const isConnected = connectedReferenceImages.includes(src) && !directReferenceImages.includes(src); return <div className={`reference-image-preview ${isConnected ? "is-connected-reference" : ""}`} key={`${src.slice(0, 24)}-${index}`} title={isConnected ? "来自画布连线" : cn.referenceImage}><img src={displayImageSource(src, data.profileId)} alt={`${cn.referenceImage} ${index + 1}`} draggable="false" />{!isConnected && <button className="icon-button subtle nodrag" onClick={() => data.onReferenceChange?.(id, directReferenceImages.filter((_item, itemIndex) => _item !== src || directReferenceImages.indexOf(_item) !== itemIndex))} aria-label={cn.removeReferenceImage} title={cn.removeReferenceImage}><X size={13} /></button>}</div>; })}
          </div>
          <label className="reference-image-button nodrag" htmlFor={referenceInputId} title={cn.addReferenceImage}><ImageUp size={14} /><span>{referenceImages.length ? `${referenceImages.length} 张` : cn.addReferenceImage}</span></label>
          <input id={referenceInputId} className="reference-image-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { data.onReferenceFiles?.(id, Array.from(event.target.files || [])); event.target.value = ""; }} />
          <span className="reference-image-hint">{cn.referenceImageUnlimited}</span>
        </div>
        <div className="node-parameters" ref={parameterRef}>
          <div className="node-parameter-field">
            <span className="node-parameter-label">API</span>
            <select className="node-select node-profile nodrag" value={data.profileId || data.activeProfileId || data.profiles?.[0]?.id || ""} onChange={(event) => data.onParamChange?.(id, "profileId", event.target.value)} aria-label={cn.nodeProfile} title={cn.nodeProfile}>
              {(data.profiles || []).map((profile, index) => <option value={profile.id} key={profile.id}>{profile.name || `API ${index + 1}`}</option>)}
            </select>
          </div>
          <div className="node-parameter-field node-model-field">
            <span className="node-parameter-label">模型</span>
            <select className="node-select node-model nodrag" value={activeModel} onChange={(event) => data.onParamChange?.(id, "model", event.target.value)} aria-label={cn.nodeModel} disabled={!modelOptions.length}>
              {modelOptions.length ? modelOptions.map((model) => <option key={model} value={model}>{model}</option>) : <option value="">未选择模型</option>}
            </select>
          </div>
          <div className="node-parameter-field">
            <span className="node-parameter-label">尺寸</span>
            <select className="node-select nodrag" value={sizeSelection.resolution} onChange={(event) => data.onSizeChange?.(id, getImageSizeSelection({ model: activeModel || DEFAULT_IMAGE_MODEL, resolution: event.target.value, ratio: sizeSelection.ratio }))} aria-label="分辨率等级">
              {sizeOptions.resolutions.map((resolution) => <option key={resolution} value={resolution}>{resolution}</option>)}
              {!isGrokImageModel(activeModel) && <option value={CUSTOM_IMAGE_RESOLUTION}>{cn.custom}</option>}
            </select>
          </div>
          {!isAutoSize && <div className="node-parameter-field">
            <span className="node-parameter-label">比例</span>
            {isCustomSize ? <div className="custom-size-inputs"><input className="node-select nodrag" type="number" min={isSenseNovaU15LiteModel(activeModel) ? "512" : "1"} max={isSenseNovaU15LiteModel(activeModel) ? "4096" : "16384"} step={isSenseNovaU15LiteModel(activeModel) ? "32" : "1"} value={sizeSelection.width} onChange={(event) => updateCustomDimension("width", event.target.value)} aria-label="自定义宽度" /><span>×</span><input className="node-select nodrag" type="number" min={isSenseNovaU15LiteModel(activeModel) ? "512" : "1"} max={isSenseNovaU15LiteModel(activeModel) ? "4096" : "16384"} step={isSenseNovaU15LiteModel(activeModel) ? "32" : "1"} value={sizeSelection.height} onChange={(event) => updateCustomDimension("height", event.target.value)} aria-label="自定义高度" /></div> : <select className="node-select nodrag" value={sizeSelection.ratio} onChange={(event) => data.onSizeChange?.(id, getImageSizeSelection({ model: activeModel || DEFAULT_IMAGE_MODEL, resolution: sizeSelection.resolution, ratio: event.target.value }))} aria-label={cn.nodeSize}>
              {sizeOptions.ratios.map((ratio) => <option key={ratio} value={ratio}>{formatImageRatioOption(getImageSizeSelection({ model: activeModel || DEFAULT_IMAGE_MODEL, resolution: sizeSelection.resolution, ratio }))}</option>)}
            </select>}
          </div>}
          {isSenseNova ? <>
            {isSenseNovaU15LiteModel(activeModel) && <div className="node-parameter-field">
              <span className="node-parameter-label">输出格式</span>
              <select className="node-select nodrag" value={data.outputFormat || "png"} onChange={(event) => data.onParamChange?.(id, "outputFormat", event.target.value)} aria-label="输出格式">
                <option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WEBP</option>
              </select>
            </div>}
            <div className="node-parameter-field">
              <span className="node-parameter-label">水印开关</span>
              <select className="node-select nodrag" value={data.watermark === false ? "off" : "on"} onChange={(event) => data.onParamChange?.(id, "watermark", event.target.value === "on")} aria-label="水印开关">
                <option value="on">开</option>
                <option value="off">关</option>
              </select>
            </div>
            <div className="node-parameter-field">
              <span className="node-parameter-label">自动润色优化开关</span>
              <select className="node-select nodrag" value={data.promptExtend === false ? "off" : "on"} onChange={(event) => data.onParamChange?.(id, "promptExtend", event.target.value === "on")} aria-label="自动润色优化开关">
                <option value="on">开</option>
                <option value="off">关</option>
              </select>
            </div>
          </> : <div className="node-parameter-field">
            <span className="node-parameter-label">质量</span>
            <select className="node-select nodrag" value={data.quality || "high"} onChange={(event) => data.onParamChange?.(id, "quality", event.target.value)} aria-label={cn.nodeQuality}>
              <option value="high">{cn.high}</option>
              <option value="medium">{cn.medium}</option>
              <option value="low">{cn.low}</option>
              <option value="auto">{cn.auto}</option>
            </select>
          </div>}
          <div className="node-parameter-field">
            <span className="node-parameter-label">请求数量</span>
            <select className="node-select nodrag" value={requestCount} onChange={(event) => data.onParamChange?.(id, "requestCount", Number(event.target.value))} aria-label={cn.requestCount}>
              {(isSenseNovaU15Lite ? [1] : [1, 2, 3, 4, 5]).map((count) => <option key={count} value={count}>{count} 张</option>)}
            </select>
          </div>
        </div>
        <div className="prompt-footer">
          <span className="prompt-hint">{(data.prompt || "").length}/4000</span>
          <button className="generate-button nodrag" onClick={() => data.onGenerate?.(id)} disabled={!activeModel || !(data.prompt || "").trim()}>
            {isGenerating ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
            <span>{isGenerating ? cn.generating : (isImageToImage ? cn.imageToImage : cn.textToImage)}</span>
          </button>
        </div>
        {data.status === "success" && <div className="node-status success"><CheckCircle2 size={14} /> {cn.imageAdded}</div>}
        {data.error && <div className="node-status error"><AlertCircle size={14} /> {data.error}</div>}
      </div>
      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
}

class NodeErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) return <div className="node-render-error"><AlertCircle size={18} /><span>节点渲染异常，等待状态更新后会自动恢复。</span></div>;
    return this.props.children;
  }
}

function ImageNode({ id, data, selected }) {
  const [waitSeconds, setWaitSeconds] = useState(() => elapsedSeconds(data.createdAt));
  const [actualSize, setActualSize] = useState({ width: data.actualWidth || 0, height: data.actualHeight || 0 });
  const [openInfo, setOpenInfo] = useState("");
  useEffect(() => {
    const update = () => setWaitSeconds(elapsedSeconds(data.createdAt));
    update();
    if (data.status !== "generating") return undefined;
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [data.createdAt, data.status]);
  useEffect(() => setActualSize({ width: data.actualWidth || 0, height: data.actualHeight || 0 }), [data.src, data.actualHeight, data.actualWidth]);
  const imageBytes = Number(data.fileSize) || dataUrlByteSize(data.src);
  const imageDimensions = actualSize.width && actualSize.height ? `${actualSize.width} x ${actualSize.height}` : cn.infoUnavailable;
  const displayedImageSize = actualSize.width && actualSize.height ? `${actualSize.width}x${actualSize.height}` : (data.size || "1024x1024");
  const generationDuration = Number(data.generationDurationMs) > 0 ? formatDuration(Math.round(Number(data.generationDurationMs) / 1000)) : "";
  const formatDurationMs = (value) => Number(value) >= 0 ? formatDuration(Math.round(Number(value) / 1000)) : cn.infoUnavailable;
  const imageSource = displayImageSource(data.src, data.profileId);
  const temporaryUrl = data.sourceImageUrl || (data.src?.startsWith("data:") ? "Base64 \u5185\u5d4c\u6570\u636e（\u65e0\u4e34\u65f6 URL）" : (data.src || cn.infoUnavailable));
  const sourceImageUrl = String(data.sourceImageUrl || "");
  const canOpenSourceUrl = /^https?:\/\//i.test(sourceImageUrl);
  const downloadMethod = data.savedPath ? "\u672c\u5730\u81ea\u52a8\u4fdd\u5b58 + \u6d4f\u89c8\u5668\u4e0b\u8f7d" : data.src?.startsWith("data:") ? "\u6d4f\u89c8\u5668\u4e0b\u8f7d（Base64）" : data.src ? "\u6d4f\u89c8\u5668\u4e0b\u8f7d（\u4e34\u65f6 URL）" : cn.infoUnavailable;
  const referenceImageCount = Number.isFinite(Number(data.referenceImageCount)) ? Number(data.referenceImageCount) : (Array.isArray(data.referenceImages) ? data.referenceImages.length : data.referenceImage ? 1 : 0);
  const requestProfile = data.profileName || data.profileId || cn.infoUnavailable;
  const requestPrompt = String(data.prompt || "").trim() || cn.infoUnavailable;
  const handleImageDoubleClick = (event) => {
    event.stopPropagation();
    if (data.src) data.onPreview?.(data.src, data.title, data.comparisonSource, data.profileId);
  };
  const toggleInfo = (type, event) => {
    event.stopPropagation();
    setOpenInfo((current) => current === type ? "" : type);
  };

  return (
    <div className={`canvas-node image-node ${selected ? "is-selected" : ""}`} onClick={(event) => { if (!event.target.closest("button")) data.onShowPrompt?.(id); }} onDoubleClick={(event) => { if (data.src && !event.target.closest("button")) data.onPreview?.(data.src, data.title, data.comparisonSource, data.profileId); }}>
      <NodeResizer isVisible={selected} minWidth={260} minHeight={290} lineClassName="resizer-line" handleClassName="resizer-handle" />
      <Handle type="target" position={Position.Left} className="node-handle" />
      <div className="node-header">
        <div className="node-type">
          <span className="node-icon image-icon"><ImagePlus size={15} /></span>
          <span>{cn.generatedImage}</span>
        </div>
        <div className="node-actions">
          {data.src && <button type="button" className="icon-button subtle nodrag" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); data.onOpen?.(data.src, data.profileId); }} aria-label={cn.openImage} title={cn.openImage}><ExternalLink size={15} /></button>}
          {data.src && <button type="button" className="icon-button subtle nodrag" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); data.onDownload?.(data.src, data.model, data.profileId); }} aria-label={cn.downloadImage} title={cn.downloadImage}><Download size={15} /></button>}
          <button className="icon-button subtle nodrag" onClick={() => data.onDelete?.(id)} aria-label={cn.deleteImageNode} title={cn.deleteImageNode}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="image-frame" onDoubleClick={handleImageDoubleClick}>
        {data.src ? <img src={imageSource} alt={data.title || cn.generatedImage} draggable="false" onDoubleClick={handleImageDoubleClick} onLoad={(event) => { const image = event.currentTarget; setActualSize({ width: image.naturalWidth, height: image.naturalHeight }); data.onImageLoad?.(id, image.naturalWidth, image.naturalHeight); }} /> : <div className={`image-placeholder ${data.status === "error" || data.saveStatus === "error" ? "is-error" : ""}`}><Loader2 size={25} className={data.status === "generating" || ["pending", "server-saving", "browser-saving"].includes(data.saveStatus) ? "spin" : ""} /><span>{data.status === "error" ? (data.error || cn.generationFailed) : data.status === "generating" ? cn.generating : data.saveStatus === "error" ? (data.saveError || cn.imageSaveFailed) : ["pending", "server-saving", "browser-saving"].includes(data.saveStatus) ? cn.imageSaving : cn.imagePlaceholder}</span>{data.status === "error" && data.sourcePromptId && <button type="button" className="small-button regenerate-button nodrag" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); data.onRegenerate?.(data.comparisonNodeId || data.sourcePromptId, data.comparisonTaskIndex, id); }}><RefreshCw size={14} /><span>{cn.regenerate}</span></button>}{data.saveStatus === "error" && data.saveJobId && data.sourceImageUrl && <button type="button" className="small-button retry-download-button nodrag" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); data.onRetryDownload?.(id); }}><Download size={14} /><span>{cn.retryDownload}</span></button>}</div>}
        {data.status === "generating" && <span className="image-wait-time"><Clock3 size={11} /> {cn.waiting} {formatDuration(waitSeconds)}</span>}
        {data.status === "success" && generationDuration && <span className="image-wait-time"><Clock3 size={11} /> 耗时 {generationDuration}</span>}
        <div className="image-overlay"><span>{data.model || "gpt-image-2"}</span><span>{displayedImageSize}</span></div>
        <div className={`image-request-info nodrag ${openInfo === "request" ? "is-open" : ""}`} onClick={(event) => event.stopPropagation()}>
          <button type="button" className="image-info-button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => toggleInfo("request", event)} aria-label={cn.requestInfo} aria-expanded={openInfo === "request"} title={cn.requestInfo}><AlertCircle size={15} /></button>
          <div className="image-info-tooltip image-request-tooltip" role="tooltip">
            <div className="image-info-heading">{cn.requestInfo}</div>
            <div><span>{cn.imagePrompt}</span><strong>{requestPrompt}</strong></div>
        <div><span>{cn.modelInfo}</span><strong>{data.model || cn.infoUnavailable}</strong></div>
            <div><span>{cn.requestCount}</span><strong>{Math.max(1, Math.min(5, Number(data.requestCount) || 1))}</strong></div>
            {isGrokImageModel(data.model) ? <><div><span>aspect_ratio</span><strong>{data.ratio || cn.infoUnavailable}</strong></div><div><span>resolution</span><strong>{data.ratio === "auto" ? cn.requestNotSent : data.resolution || cn.infoUnavailable}</strong></div></> : <div><span>{cn.size}</span><strong>{data.size || cn.infoUnavailable}</strong></div>}
            {isSenseNovaImageModel(data.model) ? <><div><span>水印开关</span><strong>{data.watermark === false ? "关" : "开"}</strong></div><div><span>自动润色优化开关</span><strong>{data.promptExtend === false ? "关" : "开"}</strong></div>{isSenseNovaU15LiteModel(data.model) && <div><span>输出格式</span><strong>{String(data.outputFormat || "png").toUpperCase()}</strong></div>}</> : <div><span>{cn.qualityInfo}</span><strong>{data.quality || cn.infoUnavailable}</strong></div>}
            <div><span>{cn.requestProfile}</span><strong>{requestProfile}</strong></div>
            <div><span>{cn.requestReferenceCount}</span><strong>{referenceImageCount ? `${referenceImageCount}` : cn.noReferenceImage}</strong></div>
            <div><span>{cn.requestResponseFormat}</span><strong>{data.responseFormat || cn.infoUnavailable}</strong></div>
            {data.requestText && <div className="image-info-response"><span>实际请求</span><pre className="image-response-json">{data.requestText}</pre></div>}
          </div>
        </div>
        <div className={`image-response-info nodrag ${openInfo === "response" ? "is-open" : ""}`} onClick={(event) => event.stopPropagation()}>
          <button type="button" className={`image-info-button ${data.status === "error" ? "is-error" : ""}`} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => toggleInfo("response", event)} aria-label={cn.responseInfo} aria-expanded={openInfo === "response"} title={cn.responseInfo}><AlertCircle size={15} /></button>
          <div className="image-info-tooltip image-response-tooltip" role="tooltip">
            <div className="image-info-heading">{cn.responseInfo}</div>
            <div><span>{cn.temporaryUrl}</span><strong>{temporaryUrl}</strong></div>
            <div><span>{cn.downloadMethod}</span><strong>{downloadMethod}</strong></div>
            <div><span>{cn.fileSize}</span><strong>{formatFileSize(imageBytes)}</strong></div>
            <div><span>{cn.actualSize}</span><strong>{imageDimensions}</strong></div>
            <div><span>{cn.apiRequestDuration}</span><strong>{formatDurationMs(data.apiRequestDurationMs)}</strong></div>
            <div><span>{cn.imageDownloadDuration}</span><strong>{formatDurationMs(data.imageDownloadDurationMs)}</strong></div>
            <div><span>{cn.localWriteDuration}</span><strong>{formatDurationMs(data.localWriteDurationMs)}</strong></div>
            <div><span>{cn.totalDuration}</span><strong>{generationDuration || cn.infoUnavailable}</strong></div>
            {(data.rawResponseText || data.responseText || data.error || data.saveError) && <div className="image-info-response"><span>{cn.rawResponseInfo}</span><pre className="image-response-json">{data.rawResponseText || data.responseText || data.error || data.saveError}</pre></div>}
            {data.saveStatus === "error" && <div><span>{cn.errorInfo}</span><strong>{data.saveError || cn.imageSaveFailed}</strong></div>}
            {data.status === "error" && <div><span>{cn.errorInfo}</span><strong>{data.error || cn.generationFailed}</strong></div>}
          </div>
        </div>
      </div>
      <div className="image-caption">
        <span>{data.title || cn.untitledGeneration}</span>
        {canOpenSourceUrl && <button type="button" className="image-open-url-button nodrag" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); data.onOpenUrl?.(sourceImageUrl); }} aria-label={cn.openUrl} title={cn.openUrl}><ExternalLink size={12} /><span>{cn.openUrl}</span></button>}
        <span className="image-time">{formatDate(data.createdAt)}</span>
      </div>
      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
}

function ImageGroupNode({ id, data, selected }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingImageIndex, setDraggingImageIndex] = useState(-1);
  const [dragOverImageIndex, setDragOverImageIndex] = useState(-1);
  const [stitchDirection, setStitchDirection] = useState("horizontal");
  const [resolutionBasis, setResolutionBasis] = useState("max");
  const inputId = `group-images-${id}`;
  const images = Array.isArray(data.images) ? data.images : [];
  const enteringImages = Array.isArray(data.enteringImages) ? data.enteringImages : [];
  const handleDirectionChange = (event) => {
    const direction = event.target.value;
    setStitchDirection(direction);
    setResolutionBasis(direction === "horizontal" ? "max" : "min");
  };
  return <div className={`canvas-node image-group-node ${selected ? "is-selected" : ""}`} onClick={(event) => { if (!event.target.closest("button,label,input,select")) data.onShowPrompt?.(id); }}>
      <NodeResizer nodeId={id} isVisible={selected} minWidth={390} maxWidth={760} minHeight={320} lineClassName="resizer-line" handleClassName="resizer-handle" />
    <div className="node-header">
      <div className="node-type"><span className="node-icon group-icon"><Images size={15} /></span><span>{cn.imageGroup}</span><em className="group-count">{images.length}</em></div>
      <button className="icon-button subtle nodrag" onClick={() => data.onDelete?.(id)} aria-label={cn.deleteCanvas} title={cn.deleteCanvas}><Trash2 size={15} /></button>
    </div>
    <div className={`group-dropzone nodrag ${isDragOver ? "is-drag-over" : ""}`} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); setIsDragOver(false); let draggedImages = []; try { const payload = JSON.parse(event.dataTransfer.getData("application/x-ai-canvas-images") || "[]"); if (Array.isArray(payload)) draggedImages = payload.filter(Boolean); } catch { draggedImages = []; } if (!draggedImages.length) { const draggedImage = event.dataTransfer.getData("application/x-ai-canvas-image"); if (draggedImage) draggedImages = [draggedImage]; } if (draggedImages.length) data.onGroupImagesChange?.(id, [...images, ...draggedImages].slice(0, 50)); data.onGroupFiles?.(id, Array.from(event.dataTransfer.files || [])); }}>
      {images.length ? <div className="group-image-grid">{images.map((src, index) => <div className={`group-image-item ${enteringImages.includes(src) ? "is-entering" : ""} ${draggingImageIndex === index ? "is-dragging" : ""} ${dragOverImageIndex === index ? "is-drag-over" : ""}`} key={`${src.slice(0, 24)}-${index}`} draggable onDragStart={(event) => { setDraggingImageIndex(index); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("application/x-ai-canvas-group-index", String(index)); }} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); if (draggingImageIndex !== index) setDragOverImageIndex(index); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragOverImageIndex(-1); }} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); const sourceIndex = Number(event.dataTransfer.getData("application/x-ai-canvas-group-index")); if (Number.isInteger(sourceIndex) && sourceIndex !== index && sourceIndex >= 0 && sourceIndex < images.length) { const nextImages = [...images]; const [moved] = nextImages.splice(sourceIndex, 1); nextImages.splice(index, 0, moved); data.onGroupImagesChange?.(id, nextImages); } setDraggingImageIndex(-1); setDragOverImageIndex(-1); }} onDragEnd={() => { setDraggingImageIndex(-1); setDragOverImageIndex(-1); }}><img src={src} alt={`${cn.imageGroup} ${index + 1}`} draggable="false" /><button className="icon-button subtle nodrag" onClick={() => data.onGroupImagesChange?.(id, images.filter((_image, imageIndex) => imageIndex !== index))} aria-label={cn.removeGroupImage} title={cn.removeGroupImage}><X size={13} /></button></div>)}</div> : <div className="group-empty"><Images size={24} /><span>{cn.groupEmpty}</span></div>}
      <label className="group-add-button" htmlFor={inputId}><ImageUp size={14} /><span>{cn.groupDropHint}</span></label>
      <input id={inputId} className="reference-image-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { data.onGroupFiles?.(id, Array.from(event.target.files || [])); event.target.value = ""; }} />
    </div>
    <div className="group-actions">
      <div className="group-stitch-field"><span className="node-parameter-label">{cn.stitchMode}</span><select className="node-select nodrag" value={stitchDirection} onChange={handleDirectionChange} aria-label={cn.stitchMode}><option value="horizontal">{cn.stitchLeftRight}</option><option value="vertical">{cn.stitchTopBottom}</option></select></div>
      <div className="group-stitch-field"><span className="node-parameter-label">{cn.stitchBasis}</span><select className="node-select nodrag" value={resolutionBasis} onChange={(event) => setResolutionBasis(event.target.value)} aria-label={cn.stitchBasis}><option value="max">{cn.stitchMaxResolution}</option><option value="min">{cn.stitchMinResolution}</option></select></div>
      <button type="button" className="toolbar-button nodrag group-stitch-button" onClick={() => data.onCompose?.(id, stitchDirection, resolutionBasis)} disabled={images.length < 2}><span>{cn.stitchButton}</span></button>
    </div>
    <Handle type="source" position={Position.Right} className="node-handle group-handle" />
  </div>;
}

function ResilientImageNode(props) {
  const resetKey = [props.data?.status || "", props.data?.src || "", props.data?.error || ""].join(":");
  return <NodeErrorBoundary resetKey={resetKey}><ImageNode {...props} /></NodeErrorBoundary>;
}

function createComparisonEntry(profile, getProfileModelOptions) {
  const profileId = profile?.id || "";
  const modelOptions = getProfileModelOptions?.(profileId) || SUPPORTED_IMAGE_MODELS;
  const model = modelOptions.includes(profile?.model) ? profile.model : (modelOptions[0] || profile?.model || DEFAULT_IMAGE_MODEL);
  return { id: `comparison-row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, profileId, model, ...normalizeImageSizeSelection({ ...profile, model }), quality: profile?.quality || "high", watermark: true, promptExtend: true, outputFormat: "png" };
}

function ComparisonNode({ id, data, selected }) {
  const profiles = Array.isArray(data.profiles) ? data.profiles : [];
  const getProfileModelOptions = data.getProfileModelOptions || (() => SUPPORTED_IMAGE_MODELS);
  const rows = Array.isArray(data.entries) && data.entries.length ? data.entries : [createComparisonEntry(profiles.find((item) => item.id === data.activeProfileId) || profiles[0], getProfileModelOptions)];
  const updateNode = (patch) => data.onComparisonChange?.(id, patch);
  const updateRow = (rowId, patch) => updateNode({ entries: rows.map((row) => row.id === rowId ? { ...row, ...patch } : row) });
  const changeProfile = (row, profileId) => {
    const profile = profiles.find((item) => item.id === profileId) || profiles[0];
    const next = createComparisonEntry(profile, getProfileModelOptions);
    updateRow(row.id, { ...next, id: row.id });
  };
  const changeModel = (row, model) => updateRow(row.id, { model, ...normalizeImageSizeSelection({ ...row, model }) });
  const addRow = () => updateNode({ entries: [...rows, createComparisonEntry(profiles.find((item) => item.id === data.activeProfileId) || profiles[0], getProfileModelOptions)] });
  const removeRow = (rowId) => updateNode({ entries: rows.length > 1 ? rows.filter((row) => row.id !== rowId) : rows });
  const addReferenceFiles = (files) => {
    const current = Array.isArray(data.referenceImages) ? data.referenceImages : [];
    const remaining = Math.max(0, 5 - current.length);
    const selectedFiles = (Array.isArray(files) ? files : []).filter((file) => file?.type?.startsWith("image/")).slice(0, remaining);
    const readFile = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = reject; reader.readAsDataURL(file); });
    Promise.all(selectedFiles.map(readFile)).then((images) => updateNode({ referenceImages: [...current, ...images] })).catch(() => undefined);
  };
  const referenceImages = Array.isArray(data.referenceImages) ? data.referenceImages : [];
  const isGenerating = data.status === "generating";
  const canGenerate = String(data.prompt || "").trim() && rows.length && rows.every((row) => row.profileId) && !isGenerating;
  const inputId = `comparison-references-${id}`;
  return <div className={`canvas-node comparison-node ${selected ? "is-selected" : ""}`}>
    <NodeResizer nodeId={id} isVisible={selected} minWidth={720} maxWidth={1180} minHeight={390} lineClassName="resizer-line" handleClassName="resizer-handle" />
    <Handle type="target" position={Position.Left} className="node-handle" />
    <div className="node-header">
      <div className="node-type"><span className="node-icon prompt-icon"><Sparkles size={15} /></span><span>{cn.comparisonTitle}</span><em className="group-count">{rows.length}</em></div>
      <div className="node-actions"><button className="icon-button subtle nodrag" onClick={() => data.onDelete?.(id)} aria-label={cn.deletePromptNode} title={cn.deletePromptNode}><Trash2 size={15} /></button></div>
    </div>
    <div className="node-body comparison-node-body">
      <textarea className="prompt-input nodrag nowheel" value={data.prompt || ""} onChange={(event) => updateNode({ prompt: event.target.value, error: "" })} placeholder={cn.comparisonPromptPlaceholder} aria-label={cn.imagePrompt} />
      <div className="reference-image-row nodrag">
        <div className="reference-image-previews">{referenceImages.map((src, index) => <div className="reference-image-preview" key={`${src.slice(0, 24)}-${index}`}><img src={src} alt={`${cn.referenceImage} ${index + 1}`} /><button className="icon-button subtle nodrag" onClick={() => updateNode({ referenceImages: referenceImages.filter((_item, itemIndex) => itemIndex !== index) })} aria-label={cn.removeReferenceImage} title={cn.removeReferenceImage}><X size={13} /></button></div>)}</div>
        {referenceImages.length < 5 && <label className="reference-image-button nodrag" htmlFor={inputId}><ImageUp size={14} /><span>{referenceImages.length ? `${referenceImages.length}/5` : cn.addReferenceImage}</span></label>}
        <input id={inputId} className="reference-image-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { addReferenceFiles(Array.from(event.target.files || [])); event.target.value = ""; }} />
        <span className="reference-image-hint">{cn.referenceImageLimit}</span>
      </div>
      <div className="comparison-node-rows"><div className="comparison-node-row-heading"><span className="node-parameter-label">API 对比参数</span><button type="button" className="icon-button subtle nodrag comparison-add-api" onClick={addRow} aria-label={cn.comparisonAddApi} title={cn.comparisonAddApi}><Plus size={16} /></button></div>{rows.map((row) => {
        const profile = profiles.find((item) => item.id === row.profileId);
         const options = getProfileModelOptions(row.profileId).length ? getProfileModelOptions(row.profileId) : [row.model || DEFAULT_IMAGE_MODEL];
         const sizeSelection = normalizeImageSizeSelection(row);
         const sizeOptions = getImageSizeOptions(row.model || DEFAULT_IMAGE_MODEL, sizeSelection.resolution);
        const isAutoSize = sizeSelection.resolution === AUTO_IMAGE_RESOLUTION;
        return <div className="comparison-node-row" key={row.id}>
          <div className="node-parameter-field"><span className="node-parameter-label">API</span><select className="node-select nodrag" value={row.profileId} onChange={(event) => changeProfile(row, event.target.value)}>{profiles.map((item) => <option key={item.id} value={item.id}>{item.name || item.id}</option>)}</select></div>
          <div className="node-parameter-field node-model-field"><span className="node-parameter-label">{cn.model}</span><select className="node-select node-model nodrag" value={row.model} onChange={(event) => changeModel(row, event.target.value)}>{options.map((model) => <option key={model} value={model}>{model}</option>)}</select></div>
          <div className="node-parameter-field"><span className="node-parameter-label">{cn.size}</span><select className="node-select nodrag" value={sizeSelection.resolution} onChange={(event) => updateRow(row.id, getImageSizeSelection({ ...row, resolution: event.target.value, ratio: sizeSelection.ratio }))}>{sizeOptions.resolutions.map((resolution) => <option key={resolution} value={resolution}>{resolution}</option>)}</select></div>
          {!isAutoSize && <div className="node-parameter-field"><span className="node-parameter-label">比例</span><select className="node-select nodrag" value={sizeSelection.ratio} onChange={(event) => updateRow(row.id, getImageSizeSelection({ ...row, resolution: sizeSelection.resolution, ratio: event.target.value }))}>{sizeOptions.ratios.map((ratio) => <option key={ratio} value={ratio}>{formatImageRatioOption(getImageSizeSelection({ ...row, resolution: sizeSelection.resolution, ratio }))}</option>)}</select></div>}
          {isSenseNovaImageModel(row.model) ? <><div className="node-parameter-field"><span className="node-parameter-label">水印开关</span><select className="node-select nodrag" value={row.watermark === false ? "off" : "on"} onChange={(event) => updateRow(row.id, { watermark: event.target.value === "on" })}><option value="on">开</option><option value="off">关</option></select></div><div className="node-parameter-field"><span className="node-parameter-label">自动润色优化开关</span><select className="node-select nodrag" value={row.promptExtend === false ? "off" : "on"} onChange={(event) => updateRow(row.id, { promptExtend: event.target.value === "on" })}><option value="on">开</option><option value="off">关</option></select></div>{isSenseNovaU15LiteModel(row.model) && <div className="node-parameter-field"><span className="node-parameter-label">输出格式</span><select className="node-select nodrag" value={row.outputFormat || "png"} onChange={(event) => updateRow(row.id, { outputFormat: event.target.value })}><option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WEBP</option></select></div>}</> : <div className="node-parameter-field"><span className="node-parameter-label">{cn.quality}</span><select className="node-select nodrag" value={row.quality || "high"} onChange={(event) => updateRow(row.id, { quality: event.target.value })}><option value="high">{cn.high}</option><option value="medium">{cn.medium}</option><option value="low">{cn.low}</option><option value="auto">{cn.auto}</option></select></div>}
          {rows.length > 1 && <button type="button" className="icon-button subtle nodrag comparison-remove-api" onClick={() => removeRow(row.id)} aria-label={cn.removeReferenceImage} title={cn.removeReferenceImage}><X size={14} /></button>}
          {!profile && <p className="comparison-form-error">{cn.comparisonNoProfiles}</p>}
        </div>;
      })}</div>
      <div className="prompt-footer"><span className="prompt-hint">{(data.prompt || "").length}/4000</span><button className="generate-button nodrag" onClick={() => data.onGenerate?.(id)} disabled={!canGenerate}>{isGenerating ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}<span>{isGenerating ? cn.comparisonGenerating : cn.comparisonGenerate}</span></button></div>
      {data.error && <div className="node-status error"><AlertCircle size={14} /> {data.error}</div>}
    </div>
    <Handle type="source" position={Position.Right} className="node-handle" />
  </div>;
}

class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "", retryKey: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || String(error || "未知画布错误") };
  }

  componentDidCatch(error, errorInfo) {
    const details = [error?.message, errorInfo?.componentStack].filter(Boolean).join("\n\n");
    if (details) this.setState({ errorMessage: details });
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) this.setState((current) => ({ hasError: false, errorMessage: "", retryKey: current.retryKey + 1 }));
  }

  render() {
    if (this.state.hasError) return <div className="canvas-render-error"><AlertCircle size={20} /><div><strong>画布需要重新加载</strong><pre className="canvas-error-detail">{this.state.errorMessage || "未知画布错误"}</pre></div><button className="toolbar-button" onClick={() => this.setState((current) => ({ hasError: false, errorMessage: "", retryKey: current.retryKey + 1 }))}><RefreshCw size={15} /><span>重新加载</span></button></div>;
    return <Fragment key={`canvas-recovery-${this.state.retryKey}`}>{this.props.children}</Fragment>;
  }
}

const nodeTypes = { prompt: memo(PromptNode), comparison: memo(ComparisonNode), image: memo(ResilientImageNode), imageGroup: memo(ImageGroupNode) };

function Sidebar({ activePanel, setActivePanel, collapsed, setCollapsed, canvases, activeCanvasId, onSelectCanvas, onCreateCanvas, onDeleteCanvas, onRenameCanvas, nodeCount, historyCount }) {
  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="brand-row">
        {!collapsed && <div className="brand-mark"><Sparkles size={16} /></div>}
        {!collapsed && <div className="brand-copy"><strong>{cn.appTitle}</strong><span>{cn.localWorkspace}</span></div>}
        <button className="icon-button sidebar-toggle" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? cn.expandSidebar : cn.collapseSidebar} title={collapsed ? cn.expandSidebar : cn.collapseSidebar}>
          {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
      </div>
      <nav className="main-nav" aria-label="Primary">
        <button className={`nav-item ${activePanel === "canvas" ? "is-active" : ""}`} onClick={() => setActivePanel("canvas")} title={cn.canvas}>
          <Layers3 size={17} /><span>{cn.canvas}</span><em>{nodeCount}</em>
        </button>
        <button className={`nav-item ${activePanel === "history" ? "is-active" : ""}`} onClick={() => setActivePanel("history")} title={cn.history}>
          <HistoryIcon size={17} /><span>{cn.history}</span><em>{historyCount}</em>
        </button>
        <button className={`nav-item ${activePanel === "settings" ? "is-active" : ""}`} onClick={() => setActivePanel("settings")} title={cn.settings}>
          <Settings2 size={17} /><span>{cn.settings}</span>
        </button>
      </nav>
      <div className="sidebar-divider" />
      <div className="sidebar-section">
        {!collapsed && <div className="sidebar-label">{cn.canvasList}</div>}
        <button className="create-node-button" onClick={onCreateCanvas} title={cn.newCanvas}>
          <span className="create-node-icon"><Plus size={16} /></span>
          {!collapsed && <span>{cn.newCanvas}</span>}
        </button>
        {!collapsed && <div className="canvas-list">{canvases.map((canvas) => <div key={canvas.id} className={`canvas-list-item ${canvas.id === activeCanvasId ? "is-active" : ""}`}><button className="canvas-select-button" onClick={() => onSelectCanvas(canvas.id)} title={canvas.name}><Layers3 size={14} /><span>{canvas.name}</span></button><button className="canvas-rename-button" onClick={(event) => { event.stopPropagation(); onRenameCanvas(canvas.id); }} aria-label={cn.renameCanvas} title={cn.renameCanvas}><Pencil size={13} /></button>{canvases.length > 1 && <button className="canvas-delete-button" onClick={(event) => { event.stopPropagation(); onDeleteCanvas(canvas.id); }} aria-label={cn.deleteCanvas} title={cn.deleteCanvas}><Trash2 size={13} /></button>}</div>)}</div>}
      </div>
      {!collapsed && <div className="sidebar-footer"><div className="local-status"><span className="status-dot" /> {cn.localReady}</div><span className="version">V1.1.54</span></div>}
    </aside>
  );
}

function Topbar({ onFitView, onZoomIn, onZoomOut, onOpenSettings, onOpenLogs, selectedCount }) {
  return (
    <header className="topbar">
      <div className="breadcrumbs"><span>{cn.workspace}</span><ChevronRight size={14} /><strong>{cn.untitledCanvas}</strong></div>
      <div className="topbar-actions">
        <div className="view-actions">
          <button className="icon-button" onClick={onZoomOut} aria-label={cn.zoomOut} title={cn.zoomOut}><ZoomOut size={16} /></button>
          <button className="icon-button" onClick={onFitView} aria-label={cn.fitCanvas} title={cn.fitCanvas}><Maximize2 size={16} /></button>
          <button className="icon-button" onClick={onZoomIn} aria-label={cn.zoomIn} title={cn.zoomIn}><ZoomIn size={16} /></button>
        </div>
        <button className="toolbar-button" onClick={onOpenLogs}><ScrollText size={16} /><span>{cn.logs}</span></button>
        <button className="toolbar-button" onClick={onOpenSettings}><Settings2 size={16} /><span>{cn.settings}</span></button>
      </div>
      {selectedCount > 0 && <div className="selection-count">{cn.selected} {selectedCount} {cn.items}</div>}
    </header>
  );
}

function GenerationLogsDialog({ logs, onClose }) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="logs-dialog" role="dialog" aria-modal="true" aria-label={cn.generationLogs} onMouseDown={(event) => event.stopPropagation()}><div className="dialog-header"><div><strong>{cn.generationLogs}</strong><span>{logs.length}</span></div><button className="icon-button subtle" onClick={onClose} aria-label={cn.close} title={cn.close}><X size={16} /></button></div>{logs.length ? <div className="logs-list">{logs.map((log) => <article className={`log-entry ${log.ok ? "success" : "error"}`} key={log.id}><div className="log-entry-meta"><span>{formatDate(log.createdAt)}</span><span>{log.ok ? "成功" : "失败"}</span></div><p>{log.prompt}</p><pre>{log.text}</pre></article>)}</div> : <div className="logs-empty"><ScrollText size={26} /><span>{cn.noLogs}</span></div>}</section></div>;
}

function CanvasBoard({ nodes, onNodesChange, edges, setEdges, onEdgesChange, onAddPrompt, onAddGroup, onAddImageFile, onOpenComparison, onAddImagesToGroup, onRestoreNodePositions, onSelectedChange, canvasRef, onInit }) {
  const reactFlow = useReactFlow();
  const cutterRef = useRef(null);
  const groupDragVisualRef = useRef({ images: [], group: null });
  const dragStartPositionsRef = useRef(new Map());
  const [cutterLine, setCutterLine] = useState(null);
  const onConnect = useCallback((connection) => {
    if (!connection?.source || !connection?.target || connection.source === connection.target) return;
    const sourceNode = nodes.find((node) => node.id === connection.source);
    const targetNode = nodes.find((node) => node.id === connection.target);
    const validInput = (sourceNode?.type === "image" || sourceNode?.type === "imageGroup") && targetNode?.type === "prompt";
    const validOutput = (sourceNode?.type === "prompt" || sourceNode?.type === "comparison") && targetNode?.type === "image";
    if (!validInput && !validOutput) return;
    setEdges((current) => {
      if (current.some((edge) => edge.source === connection.source && edge.target === connection.target)) return current;
      return addEdge({ ...connection, animated: true, style: { stroke: "#f4b860", strokeWidth: 1.5 } }, current);
    });
  }, [nodes, setEdges]);
  const handleEdgeClick = useCallback((event, edge) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    event.stopPropagation();
    setEdges((current) => current.filter((item) => item.id !== edge.id));
  }, [setEdges]);
  const clearGroupDragVisual = useCallback(() => {
    groupDragVisualRef.current.images.forEach((element) => element.classList.remove("is-dragging-to-group"));
    groupDragVisualRef.current.group?.classList.remove("is-image-group-drop-target");
    groupDragVisualRef.current = { images: [], group: null };
  }, []);
  const handleNodeDragStart = useCallback((_event, draggedNode) => {
    clearGroupDragVisual();
    if (draggedNode.type !== "image" || !draggedNode.data?.src) return;
    const selectedImages = nodes.filter((node) => node.type === "image" && node.selected && node.data?.src);
    const imageNodes = draggedNode.selected && selectedImages.length ? selectedImages : [draggedNode];
    dragStartPositionsRef.current = new Map(imageNodes.map((node) => [node.id, { ...(node.position || {}) }]));
  }, [clearGroupDragVisual, nodes]);
  const handleNodeDrag = useCallback((event, draggedNode) => {
    if (draggedNode.type !== "image" || !draggedNode.data?.src) {
      clearGroupDragVisual();
      return;
    }
    const pointer = event.changedTouches?.[0] || event.touches?.[0] || event;
    const nodeElements = [...(canvasRef.current?.querySelectorAll(".react-flow__node[data-id]") || [])];
    const selectedImageIds = new Set((draggedNode.selected ? nodes.filter((node) => node.type === "image" && node.selected && node.data?.src) : [draggedNode]).map((node) => node.id));
    const imageElements = nodeElements.filter((element) => selectedImageIds.has(element.getAttribute("data-id") || ""));
    const groupIds = new Set(nodes.filter((node) => node.type === "imageGroup").map((node) => node.id));
    const groupElement = nodeElements.find((element) => {
      if (!groupIds.has(element.getAttribute("data-id") || "")) return false;
      const rect = element.getBoundingClientRect();
      return pointer.clientX >= rect.left && pointer.clientX <= rect.right && pointer.clientY >= rect.top && pointer.clientY <= rect.bottom;
    }) || null;
    const previous = groupDragVisualRef.current;
    previous.images.filter((element) => !imageElements.includes(element)).forEach((element) => element.classList.remove("is-dragging-to-group"));
    if (previous.group !== groupElement) previous.group?.classList.remove("is-image-group-drop-target");
    if (groupElement) {
      imageElements.forEach((element) => element.classList.add("is-dragging-to-group"));
      groupElement.classList.add("is-image-group-drop-target");
    } else {
      imageElements.forEach((element) => element.classList.remove("is-dragging-to-group"));
    }
    groupDragVisualRef.current = { images: groupElement ? imageElements : [], group: groupElement };
  }, [canvasRef, clearGroupDragVisual, nodes]);
  const handleNodeDragStop = useCallback((_event, draggedNode) => {
    clearGroupDragVisual();
    const restorePositions = Object.fromEntries(dragStartPositionsRef.current);
    dragStartPositionsRef.current = new Map();
    if (draggedNode.type !== "image" || !draggedNode.data?.src) return;
    const selectedImages = nodes.filter((node) => node.type === "image" && node.selected && node.data?.src);
    const imageNodes = draggedNode.selected && selectedImages.length ? selectedImages : [draggedNode];
    const pointer = _event.changedTouches?.[0] || _event.touches?.[0] || _event;
    const groupById = new Map(nodes.filter((node) => node.type === "imageGroup").map((node) => [node.id, node]));
    const targetGroup = [...(canvasRef.current?.querySelectorAll(".react-flow__node[data-id]") || [])].map((element) => {
      const group = groupById.get(element.getAttribute("data-id") || "");
      if (!group) return null;
      const rect = element.getBoundingClientRect();
      return pointer.clientX >= rect.left && pointer.clientX <= rect.right && pointer.clientY >= rect.top && pointer.clientY <= rect.bottom ? group : null;
    }).find(Boolean);
    if (targetGroup) {
      const images = imageNodes.map((node) => displayImageSource(node.data.src, node.data.profileId)).filter(Boolean).slice(0, 50);
      if (images.length) onAddImagesToGroup?.(targetGroup.id, images);
      if (images.length) onRestoreNodePositions?.(restorePositions);
      return;
    }
    const positionOf = (node) => node.positionAbsolute || node.computedPosition || node.position || { x: 0, y: 0 };
    const dimensionOf = (node, key, fallback) => {
      const value = node.measured?.[key] ?? node[key] ?? node.style?.[key];
      const numeric = Number(value);
      return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
    };
    const draggedPosition = positionOf(draggedNode);
    const center = {
      x: draggedPosition.x + dimensionOf(draggedNode, "width", 360) / 2,
      y: draggedPosition.y + dimensionOf(draggedNode, "height", 430) / 2
    };
    const positionedTargetGroup = nodes.find((node) => {
      if (node.type !== "imageGroup") return false;
      const position = positionOf(node);
      const width = dimensionOf(node, "width", 460);
      const height = dimensionOf(node, "height", 460);
      return center.x >= position.x && center.x <= position.x + width && center.y >= position.y && center.y <= position.y + height;
    });
    if (!positionedTargetGroup) return;
    const images = imageNodes.map((node) => displayImageSource(node.data.src, node.data.profileId)).filter(Boolean).slice(0, 50);
    if (images.length) onAddImagesToGroup?.(positionedTargetGroup.id, images);
    if (images.length) onRestoreNodePositions?.(restorePositions);
  }, [canvasRef, clearGroupDragVisual, nodes, onAddImagesToGroup, onRestoreNodePositions]);
  useEffect(() => clearGroupDragVisual, [clearGroupDragVisual]);
  const handleCutterStart = useCallback((event) => {
    if (!event.ctrlKey || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    cutterRef.current = { start: point, end: point };
    setCutterLine({ start: point, end: point });
  }, [canvasRef]);
  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!cutterRef.current) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const end = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      cutterRef.current.end = end;
      setCutterLine({ start: cutterRef.current.start, end });
    };
    const handlePointerUp = () => {
      const cutter = cutterRef.current;
      if (!cutter) return;
      cutterRef.current = null;
      setCutterLine(null);
      const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
      const intersects = (a, b, c, d) => {
        const abC = cross(a, b, c); const abD = cross(a, b, d); const cdA = cross(c, d, a); const cdB = cross(c, d, b);
        return ((abC >= 0 && abD <= 0) || (abC <= 0 && abD >= 0)) && ((cdA >= 0 && cdB <= 0) || (cdA <= 0 && cdB >= 0));
      };
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || Math.hypot(cutter.end.x - cutter.start.x, cutter.end.y - cutter.start.y) < 8) return;
      const nodeMap = new Map(nodes.map((node) => [node.id, node]));
      const center = (node) => {
        const position = node.computedPosition || node.position || { x: 0, y: 0 };
        const width = node.measured?.width || node.width || 200;
        const height = node.measured?.height || node.height || 120;
        return reactFlow.flowToScreenPosition({ x: position.x + width / 2, y: position.y + height / 2 });
      };
      const crossedIds = edges.filter((edge) => {
        const source = nodeMap.get(edge.source); const target = nodeMap.get(edge.target);
        if (!source || !target) return false;
        const a = center(source); const b = center(target);
        return intersects(cutter.start, cutter.end, { x: a.x - rect.left, y: a.y - rect.top }, { x: b.x - rect.left, y: b.y - rect.top });
      }).map((edge) => edge.id);
      if (crossedIds.length) setEdges((current) => current.filter((edge) => !crossedIds.includes(edge.id)));
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => { window.removeEventListener("pointermove", handlePointerMove); window.removeEventListener("pointerup", handlePointerUp); };
  }, [canvasRef, edges, nodes, reactFlow, setEdges]);
  const handleAddPrompt = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const position = rect ? reactFlow.screenToFlowPosition({ x: rect.left + rect.width / 2 - 170, y: rect.top + rect.height / 2 - 120 }) : { x: 100, y: 100 };
    onAddPrompt(position);
  }, [canvasRef, onAddPrompt, reactFlow]);
  const handleSelection = useCallback(({ nodes: selected }) => onSelectedChange(selected.length), [onSelectedChange]);
  const handleAddGroup = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const position = rect ? reactFlow.screenToFlowPosition({ x: rect.left + rect.width / 2 - 160, y: rect.top + rect.height / 2 - 130 }) : { x: 120, y: 120 };
    onAddGroup(position);
  }, [canvasRef, onAddGroup, reactFlow]);
  const handleAddComparison = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const position = rect ? reactFlow.screenToFlowPosition({ x: rect.left + rect.width / 2 - 380, y: rect.top + rect.height / 2 - 210 }) : { x: 180, y: 180 };
    onOpenComparison(position);
  }, [canvasRef, onOpenComparison, reactFlow]);
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const file = Array.from(event.dataTransfer.files || []).find((item) => item.type.startsWith("image/"));
    if (!file) return;
    onAddImageFile(file, reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY }));
  }, [onAddImageFile, reactFlow]);
  const handlePaste = useCallback((event) => {
    if (event.target instanceof Element && event.target.closest("input,textarea,[contenteditable=\"true\"]")) return;
    const clipboardItems = Array.from(event.clipboardData?.items || []);
    const clipboardImage = clipboardItems.find((item) => item.type.startsWith("image/"))?.getAsFile();
    const file = clipboardImage || Array.from(event.clipboardData?.files || []).find((item) => item.type.startsWith("image/"));
    if (!file) return;
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    const position = rect ? reactFlow.screenToFlowPosition({ x: rect.left + rect.width / 2 - 180, y: rect.top + rect.height / 2 - 180 }) : { x: 160, y: 140 };
    onAddImageFile(file, position);
  }, [canvasRef, onAddImageFile, reactFlow]);
  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const canvasResetKey = [nodes.length, edges.length, nodes.map((node) => [node.id, node.data?.status || "", node.data?.src ? "image" : ""].join(":")).join("|")].join(":");
  return (
    <div className="canvas-shell" ref={canvasRef} tabIndex={0} onMouseDown={handleCutterStart} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
      <CanvasErrorBoundary resetKey={canvasResetKey}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onEdgeClick={handleEdgeClick}
        onInit={onInit}
        onSelectionChange={handleSelection}
        onPaneClick={() => onSelectedChange(0)}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.1 }}
        deleteKeyCode={["Backspace", "Delete"]}
        selectionOnDrag
        selectionKeyCode="Shift"
        multiSelectionKeyCode="Shift"
        panOnScroll={false}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        minZoom={0.2}
        maxZoom={2.4}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#303540" />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap position="bottom-right" pannable zoomable nodeColor={(node) => node.type === "image" ? "#7dc7b9" : "#eeaf5d"} maskColor="rgba(12, 14, 21, 0.78)" />
        <div className="canvas-hint"><Move size={14} /> {cn.dragToPan} <span>-</span> {cn.scrollToZoom}</div>
        <div className="canvas-toolbar-floating">
          <button className="primary-button" onClick={handleAddPrompt}><Plus size={16} /><span>{cn.newPrompt}</span></button>
          <button className="toolbar-button" onClick={handleAddGroup}><Images size={16} /><span>{cn.addImageGroup}</span></button>
          <button className="toolbar-button" onClick={handleAddComparison}><Sparkles size={16} /><span>{cn.comparison}</span></button>
          <span className="toolbar-divider" />
          <button className="icon-button" onClick={() => reactFlow.zoomOut({ duration: 180 })} aria-label={cn.zoomOut} title={cn.zoomOut}><ZoomOut size={16} /></button>
          <button className="icon-button" onClick={() => reactFlow.fitView({ padding: 0.2, duration: 250 })} aria-label={cn.fitCanvas} title={cn.fitCanvas}><Maximize2 size={16} /></button>
          <button className="icon-button" onClick={() => reactFlow.zoomIn({ duration: 180 })} aria-label={cn.zoomIn} title={cn.zoomIn}><ZoomIn size={16} /></button>
        </div>
      </ReactFlow>
      {cutterLine && <svg className="edge-cutter-overlay" aria-hidden="true"><line x1={cutterLine.start.x} y1={cutterLine.start.y} x2={cutterLine.end.x} y2={cutterLine.end.y} /></svg>}
      </CanvasErrorBoundary>
    </div>
  );
}

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || String(error || "未知画布错误") };
  }

  componentDidCatch(error, errorInfo) {
    const details = [error?.message, errorInfo?.componentStack].filter(Boolean).join("\n\n");
    if (details) this.setState({ errorMessage: details });
  }

  render() {
    if (this.state.hasError) return <div className="app-recovery"><div><AlertCircle size={24} /><strong>画布需要重新加载</strong><pre className="canvas-error-detail">{this.state.errorMessage || "未知画布错误"}</pre><button className="toolbar-button" onClick={() => window.location.reload()}><RefreshCw size={15} /><span>重新加载</span></button></div></div>;
    return this.props.children;
  }
}

function SettingsView({ config, apiKeyDraft, setApiKeyDraft, workspaceStorageMode, onWorkspaceStorageModeChange, onChange, onSizeChange, onSave, onTest, onFetchModels, onToggleFetchedModel, onRevealApiKey, onExport, onImport, onSelectProfile, onCreateProfile, onDeleteProfile, onReorderProfiles, onClearCache, saveState, testState, modelFetchState, modelFetchError, fetchedModels, selectedModels, importRef }) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [draggingProfileId, setDraggingProfileId] = useState("");
  const [dragOverProfileId, setDragOverProfileId] = useState("");
  const sizeSelection = normalizeImageSizeSelection(config);
  const sizeOptions = getImageSizeOptions(config.model);
  const isAutoSize = sizeSelection.resolution === AUTO_IMAGE_RESOLUTION;
  const toggleApiKeyVisibility = async () => {
    if (showApiKey) return setShowApiKey(false);
    if (!apiKeyDraft && config.hasApiKey && !await onRevealApiKey?.()) return;
    setShowApiKey(true);
  };
  return (
    <section className="settings-view page-view">
      <div className="page-heading">
        <div><span className="eyebrow"><Server size={14} /> {cn.localApiProxy}</span><h1>{cn.apiSettings}</h1><p>{cn.settingsIntro}</p></div>
        <div className="settings-state">{config.hasApiKey ? <><CheckCircle2 size={15} /> {cn.keySaved}</> : <><AlertCircle size={15} /> {cn.keyMissing}</>}</div>
      </div>
      <div className="settings-workspace">
        <aside className="settings-profile-menu" aria-label={cn.profile}>
          <div className="settings-profile-menu-title">{cn.profile}</div>
          <div className="settings-profile-list">{(config.profiles || []).map((profile, index) => <div className={`settings-profile-row ${draggingProfileId === profile.id ? "is-dragging" : ""} ${dragOverProfileId === profile.id ? "is-drag-over" : ""}`} key={profile.id} draggable={Boolean(onReorderProfiles)} title="长按并拖动以调整配置档顺序" onDragStart={(event) => { setDraggingProfileId(profile.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", profile.id); }} onDragOver={(event) => { event.preventDefault(); if (draggingProfileId && draggingProfileId !== profile.id) setDragOverProfileId(profile.id); }} onDragLeave={() => setDragOverProfileId("")} onDrop={(event) => { event.preventDefault(); const sourceId = event.dataTransfer.getData("text/plain") || draggingProfileId; setDraggingProfileId(""); setDragOverProfileId(""); if (sourceId && sourceId !== profile.id) onReorderProfiles?.(sourceId, profile.id); }} onDragEnd={() => { setDraggingProfileId(""); setDragOverProfileId(""); }}><span className="settings-profile-drag-handle" aria-hidden="true"><GripVertical size={15} /></span><button className={`settings-profile-item ${profile.id === config.activeProfileId ? "is-active" : ""}`} onClick={() => onSelectProfile(profile.id)}><span className="settings-profile-dot" /><span>{profile.name || `API ${index + 1}`}</span></button>{profile.id === config.activeProfileId && (config.profiles || []).length > 1 && <button className="icon-button danger settings-profile-delete" onClick={onDeleteProfile} aria-label={cn.deleteProfile} title={cn.deleteProfile}><Trash2 size={14} /></button>}</div>)}</div>
          <button className="settings-profile-add" onClick={onCreateProfile}><Plus size={15} /> <span>{cn.newProfile}</span></button>
        </aside>
        <div className="settings-workspace-main">
      <div className="settings-layout">
        <div className="settings-form">
          <label className="field-label" htmlFor="profile-name">{cn.profileName}</label>
          <input id="profile-name" value={config.name || ""} onChange={(event) => onChange("name", event.target.value)} placeholder={cn.profileName} />
          <label className="field-label" htmlFor="endpoint">{cn.endpoint}</label>
          <div className="field-with-icon"><Server size={16} /><input id="endpoint" value={config.endpoint} onChange={(event) => onChange("endpoint", event.target.value)} placeholder="https://provider.example/v1" /></div>
          <p className="field-note">{cn.appendEndpoint} <code>/images/generations</code>.</p>

          <label className="field-label" htmlFor="api-key">{cn.apiKey}</label>
          <div className="field-with-icon api-key-field"><KeyRound size={16} /><input id="api-key" type={showApiKey ? "text" : "password"} value={apiKeyDraft} onChange={(event) => setApiKeyDraft(event.target.value)} placeholder={config.hasApiKey ? "****************" : "sk-..."} autoComplete="off" /><button type="button" className="icon-button field-toggle" onClick={toggleApiKeyVisibility} aria-label={showApiKey ? "隐藏 API Key" : "显示 API Key"} title={showApiKey ? "隐藏 API Key" : "显示 API Key"}>{showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
          <p className="field-note">{cn.keyNote}</p>

          <div className="field-grid model-size-grid">
            <div><div className="model-field-heading"><label className="field-label" htmlFor="model">{cn.model}</label><button className="toolbar-button model-fetch-button" onClick={onFetchModels} disabled={modelFetchState === "loading"}>{modelFetchState === "loading" ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />}<span>{modelFetchState === "loading" ? cn.fetchingModels : cn.fetchModels}</span></button></div><input id="model" list="image-model-options" value={config.model} onChange={(event) => onChange("model", event.target.value)} placeholder="gpt-image-2" />{modelFetchState === "success" && <div className="model-fetch-results"><span>{cn.modelsFetched}</span><div>{fetchedModels.map((model) => <button type="button" key={model} className={selectedModels.includes(model) ? "is-selected" : ""} aria-pressed={selectedModels.includes(model)} onClick={() => onToggleFetchedModel(model)}>{model}</button>)}</div></div>}{modelFetchState === "empty" && <p className="model-fetch-empty">{cn.modelsEmpty}</p>}{modelFetchState === "error" && <p className="model-fetch-error">{modelFetchError || cn.modelsFetchFailed}</p>}</div>
            <div><label className="field-label" htmlFor="image-resolution">{cn.size}</label><div className="size-selection-controls"><select id="image-resolution" value={sizeSelection.resolution} onChange={(event) => onSizeChange(getImageSizeSelection({ model: config.model, resolution: event.target.value, ratio: sizeSelection.ratio }))} aria-label="分辨率等级">{sizeOptions.resolutions.map((resolution) => <option key={resolution} value={resolution}>{resolution}</option>)}</select>{!isAutoSize && <select value={sizeSelection.ratio} onChange={(event) => onSizeChange(getImageSizeSelection({ model: config.model, resolution: sizeSelection.resolution, ratio: event.target.value }))} aria-label={cn.size}>{sizeOptions.ratios.map((ratio) => <option key={ratio} value={ratio}>{formatImageRatioOption(getImageSizeSelection({ model: config.model, resolution: sizeSelection.resolution, ratio }))}</option>)}</select>}</div></div>
          </div>
          <label className="field-label" htmlFor="quality">{cn.quality}</label>
          <select id="quality" value={config.quality} onChange={(event) => onChange("quality", event.target.value)}><option value="high">{cn.high}</option><option value="medium">{cn.medium}</option><option value="low">{cn.low}</option><option value="auto">{cn.auto}</option></select>
          <label className="field-label" htmlFor="output-dir">{cn.outputDir}</label>
          <input id="output-dir" value={config.outputDir || ""} onChange={(event) => onChange("outputDir", event.target.value)} placeholder="output" />
          <p className="field-note">{cn.autoSaveHint}</p>

          <div className="settings-actions">
            <button className="primary-button" onClick={onSave} disabled={saveState === "saving"}>{saveState === "saving" ? <Loader2 size={16} className="spin" /> : <Check size={16} />}<span>{saveState === "saving" ? cn.saving : cn.saveSettings}</span></button>
            <button className="toolbar-button" onClick={onTest} disabled={testState === "testing"}>{testState === "testing" ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}<span>{testState === "testing" ? cn.testing : cn.testConnection}</span></button>
          </div>
          {saveState === "saved" && <div className="inline-result success"><CheckCircle2 size={15} /> {cn.settingsSaved}</div>}
          {testState === "success" && <div className="inline-result success"><CheckCircle2 size={15} /> {cn.connectionOk}</div>}
          {testState === "error" && <div className="inline-result error"><AlertCircle size={15} /> {cn.connectionFail}</div>}
        </div>
        <aside className="settings-aside">
          <div className="aside-heading"><span className="aside-icon"><FileDown size={16} /></span><div><strong>{cn.configFiles}</strong><span>{cn.moveWorkspace}</span></div></div>
          <div className="config-actions"><button className="toolbar-button" onClick={onExport}><Download size={16} /><span>{cn.exportJson}</span></button><button className="toolbar-button" onClick={() => importRef.current?.click()}><Upload size={16} /><span>{cn.importJson}</span></button><button className="toolbar-button danger" onClick={onClearCache}><Trash2 size={16} /><span>{cn.clearCache}</span></button><input ref={importRef} type="file" accept="application/json,.json" onChange={onImport} hidden /></div>
          <p className="field-note">{cn.exportWarning}</p>
          <div className="settings-aside-divider" />
          <div className="aside-heading"><span className="aside-icon advanced-settings-icon"><Settings2 size={16} /></span><div><strong>{cn.advancedSettings}</strong><span>{cn.advancedSettingsIntro}</span></div></div>
          <div className="advanced-settings-fields">
            <label className="field-label" htmlFor="workspace-storage-mode">{cn.workspaceStorageMode}</label>
            <select id="workspace-storage-mode" value={workspaceStorageMode || "browser"} onChange={(event) => onWorkspaceStorageModeChange?.(event.target.value)}><option value="browser">{cn.workspaceStorageModeBrowser}</option><option value="file">{cn.workspaceStorageModeFile}</option><option value="auto">{cn.workspaceStorageModeAuto}</option></select>
            <p className="field-note">{cn.workspaceStorageModeHint}</p>
            <label className="field-label" htmlFor="image-download-proxy-enabled">{cn.imageDownloadProxyEnabled}</label>
            <select id="image-download-proxy-enabled" value={config.imageDownloadProxyEnabled ? "on" : "off"} onChange={(event) => onChange("imageDownloadProxyEnabled", event.target.value === "on")}><option value="off">关</option><option value="on">开</option></select>
            {config.imageDownloadProxyEnabled && <><label className="field-label" htmlFor="image-download-proxy">{cn.imageDownloadProxyPort}</label><div className="field-with-icon"><Server size={16} /><input id="image-download-proxy" value={config.imageDownloadProxy || ""} onChange={(event) => onChange("imageDownloadProxy", event.target.value)} placeholder="7890" autoComplete="off" /></div><p className="field-note">{cn.imageDownloadProxyHint}</p></>}
            <label className="field-label" htmlFor="response-format">{cn.responseFormat}</label>
            <select id="response-format" value={config.responseFormat || "url"} onChange={(event) => onChange("responseFormat", event.target.value)}><option value="url">{cn.responseFormatUrl}</option><option value="b64_json">{cn.responseFormatBase64}</option></select>
            <label className="field-label" htmlFor="reference-image-mode">{cn.referenceImageMode}</label>
            <select id="reference-image-mode" value={config.referenceImageMode || "file"} onChange={(event) => onChange("referenceImageMode", event.target.value)}><option value="file">{cn.referenceImageModeFile}</option><option value="url">{cn.referenceImageModeUrl}</option></select>
            <label className="field-label" htmlFor="image-edit-endpoint-mode">{cn.imageEditEndpointMode}</label>
            <select id="image-edit-endpoint-mode" value={config.imageEditEndpointMode || "auto"} onChange={(event) => onChange("imageEditEndpointMode", event.target.value)}><option value="auto">{cn.imageEditEndpointModeAuto}</option><option value="edits">{cn.imageEditEndpointModeEdits}</option><option value="generations">{cn.imageEditEndpointModeGenerations}</option></select>
            <p className="field-note">{cn.imageEditEndpointModeHint}</p>
          </div>
        </aside>
      </div>
        </div>
      </div>
    </section>
  );
}

function HistoryInfoButtons({ item }) {
  const imageBytes = Number(item.fileSize) || dataUrlByteSize(item.src);
  const generationDuration = Number(item.generationDurationMs) > 0 ? formatDuration(Math.round(Number(item.generationDurationMs) / 1000)) : "";
  const formatDurationMs = (value) => Number(value) >= 0 ? formatDuration(Math.round(Number(value) / 1000)) : cn.infoUnavailable;
  const temporaryUrl = item.sourceImageUrl || (item.src?.startsWith("data:") ? "Base64 内嵌数据（无临时 URL）" : (item.src || cn.infoUnavailable));
  const downloadMethod = item.savedPath ? "本地自动保存 + 浏览器下载" : item.src?.startsWith("data:") ? "浏览器下载（Base64）" : item.src ? "浏览器下载（临时 URL）" : cn.infoUnavailable;
  const referenceImageCount = Number.isFinite(Number(item.referenceImageCount)) ? Number(item.referenceImageCount) : (Array.isArray(item.referenceImages) ? item.referenceImages.length : item.referenceImage ? 1 : 0);
  const requestProfile = item.profileName || item.profileId || cn.infoUnavailable;
  const requestPrompt = String(item.prompt || "").trim() || cn.infoUnavailable;
  return <>
    <div className="image-request-info" onClick={(event) => event.stopPropagation()}>
      <button type="button" className="image-info-button" aria-label={cn.requestInfo} title={cn.requestInfo}><AlertCircle size={15} /></button>
      <div className="image-info-tooltip image-request-tooltip" role="tooltip">
        <div className="image-info-heading">{cn.requestInfo}</div>
        <div><span>{cn.imagePrompt}</span><strong>{requestPrompt}</strong></div>
        <div><span>{cn.modelInfo}</span><strong>{item.model || cn.infoUnavailable}</strong></div>
        <div><span>{cn.requestCount}</span><strong>{Math.max(1, Math.min(5, Number(item.requestCount) || 1))}</strong></div>
        {isGrokImageModel(item.model) ? <><div><span>aspect_ratio</span><strong>{item.ratio || cn.infoUnavailable}</strong></div><div><span>resolution</span><strong>{item.ratio === "auto" ? cn.requestNotSent : item.resolution || cn.infoUnavailable}</strong></div></> : <div><span>{cn.size}</span><strong>{item.size || cn.infoUnavailable}</strong></div>}
        <div><span>{cn.qualityInfo}</span><strong>{item.quality || cn.infoUnavailable}</strong></div>
        <div><span>{cn.requestProfile}</span><strong>{requestProfile}</strong></div>
        <div><span>{cn.requestReferenceCount}</span><strong>{referenceImageCount ? `${referenceImageCount}` : cn.noReferenceImage}</strong></div>
        <div><span>{cn.requestResponseFormat}</span><strong>{item.responseFormat || cn.infoUnavailable}</strong></div>
        {item.requestText && <div className="image-info-response"><span>实际请求</span><pre className="image-response-json">{item.requestText}</pre></div>}
      </div>
    </div>
    <div className="image-response-info" onClick={(event) => event.stopPropagation()}>
      <button type="button" className={`image-info-button ${item.status === "error" ? "is-error" : ""}`} aria-label={cn.responseInfo} title={cn.responseInfo}><AlertCircle size={15} /></button>
      <div className="image-info-tooltip image-response-tooltip" role="tooltip">
        <div className="image-info-heading">{cn.responseInfo}</div>
        <div><span>{cn.temporaryUrl}</span><strong>{temporaryUrl}</strong></div>
        <div><span>{cn.downloadMethod}</span><strong>{downloadMethod}</strong></div>
        <div><span>{cn.fileSize}</span><strong>{formatFileSize(imageBytes)}</strong></div>
        <div><span>{cn.actualSize}</span><strong>{item.actualWidth && item.actualHeight ? `${item.actualWidth} x ${item.actualHeight}` : cn.infoUnavailable}</strong></div>
        <div><span>{cn.apiRequestDuration}</span><strong>{formatDurationMs(item.apiRequestDurationMs)}</strong></div>
        <div><span>{cn.imageDownloadDuration}</span><strong>{formatDurationMs(item.imageDownloadDurationMs)}</strong></div>
        <div><span>{cn.localWriteDuration}</span><strong>{formatDurationMs(item.localWriteDurationMs)}</strong></div>
        <div><span>{cn.totalDuration}</span><strong>{generationDuration || cn.infoUnavailable}</strong></div>
        {(item.rawResponseText || item.responseText || item.error) && <div className="image-info-response"><span>{cn.rawResponseInfo}</span><pre className="image-response-json">{item.rawResponseText || item.responseText || item.error}</pre></div>}
        {item.status === "error" && <div><span>{cn.errorInfo}</span><strong>{item.error || cn.generationFailed}</strong></div>}
      </div>
    </div>
  </>;
}

function HistoryView({ history, onAddHistoryImage, onClearHistory, onDeleteHistoryItem, onDownload }) {
  return (
    <section className="history-view page-view">
      <div className="page-heading"><div><span className="eyebrow"><Clock3 size={14} /> {cn.generations}</span><h1>{cn.history}</h1><p>{cn.historyIntro}</p></div>{history.length > 0 && <button className="toolbar-button danger" onClick={onClearHistory}><Trash2 size={16} /><span>{cn.clearHistory}</span></button>}</div>
      {history.length === 0 ? <div className="empty-state"><HistoryIcon size={30} /><strong>{cn.noGenerations}</strong><span>{cn.historyEmpty}</span></div> : <div className="history-grid">{history.map((item) => <article className="history-card" key={item.id}><div className="history-image">{item.src ? <img src={item.src} alt={item.prompt} /> : <div className={`image-placeholder ${item.saveStatus === "error" ? "is-error" : ""}`}><Loader2 size={22} className={item.saveStatus === "error" ? "" : "spin"} /><span>{item.saveStatus === "error" ? (item.saveError || cn.imageSaveFailed) : cn.imageSaving}</span></div>}<HistoryInfoButtons item={item} /></div><div className="history-card-body"><div className="history-meta"><span>{item.model}</span><span>{formatDate(item.createdAt)}</span></div><p>{item.prompt}</p><div className="history-card-actions"><button className="small-button" onClick={() => onAddHistoryImage(item)} disabled={!item.src}><Plus size={14} /> {cn.addToCanvas}</button><button className="icon-button subtle" onClick={() => onDownload(item.src, item.model)} disabled={!item.src} aria-label={cn.downloadImage} title={cn.downloadImage}><Download size={15} /></button><button className="icon-button subtle danger" onClick={() => onDeleteHistoryItem(item.id)} aria-label="删除这条历史记录" title="删除这条历史记录"><Trash2 size={15} /></button></div></div></article>)}</div>}
    </section>
  );
}

function ImagePreviewDialog({ preview, onClose }) {
  const [splitPosition, setSplitPosition] = useState(50);
  const [zoom, setZoom] = useState(1);
  const generatedSource = displayImageSource(preview.src, preview.profileId);
  const originalSource = displayImageSource(preview.originalSrc, preview.profileId);
  const hasComparison = Boolean(preview.originalSrc && preview.originalSrc !== preview.src);
  const handleWheel = useCallback((event) => {
    event.preventDefault();
    setZoom((current) => Math.max(0.5, Math.min(4, current - event.deltaY * 0.001)));
  }, []);
  const handleComparisonPointerMove = useCallback((event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width) return;
    setSplitPosition(Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)));
  }, []);
  return <div className="dialog-backdrop image-preview-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="image-preview-dialog" role="dialog" aria-modal="true" aria-label={preview.title || cn.generatedImage} onMouseDown={(event) => event.stopPropagation()} onWheel={handleWheel}>
      <button className="icon-button image-preview-close" onClick={onClose} aria-label={cn.close} title={cn.close}><X size={18} /></button>
      {hasComparison ? <div className="image-comparison-stage" onPointerMove={handleComparisonPointerMove} style={{ transform: `scale(${zoom})` }}>
        <img className="image-comparison-layer" src={originalSource} alt="" draggable="false" />
        <img className="image-comparison-layer image-comparison-generated" src={generatedSource} alt={preview.title || cn.generatedImage} draggable="false" style={{ clipPath: `inset(0 0 0 ${splitPosition}%)` }} />
        <div className="image-comparison-divider" style={{ left: `${splitPosition}%` }} />
        <input className="image-comparison-slider" type="range" min="0" max="100" value={splitPosition} onChange={(event) => setSplitPosition(Number(event.target.value))} aria-label="图片对比位置" />
      </div> : <img src={generatedSource} alt={preview.title || cn.generatedImage} draggable="false" style={{ transform: `scale(${zoom})` }} />}
      <span>{preview.title}</span>
    </section>
  </div>;
}

function ComparisonDialog({ config, getProfileModelOptions, initialPrompt, initialReferences, results, comparisonState, onGenerate, onClose }) {
  const profiles = Array.isArray(config.profiles) ? config.profiles : [];
  const createRow = (profileId) => {
    const profile = profiles.find((item) => item.id === profileId) || profiles[0];
    const modelOptions = getProfileModelOptions(profile?.id || "");
    const model = modelOptions.includes(profile?.model) ? profile.model : (modelOptions[0] || profile?.model || DEFAULT_IMAGE_MODEL);
    return { id: `comparison-row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, profileId: profile?.id || "", model, ...normalizeImageSizeSelection({ ...profile, model }), quality: profile?.quality || "high", watermark: true, promptExtend: true, outputFormat: "png" };
  };
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [references, setReferences] = useState(Array.isArray(initialReferences) ? initialReferences : []);
  const [rows, setRows] = useState(() => [createRow(config.activeProfileId)]);
  const [windowPosition, setWindowPosition] = useState(null);
  const dragRef = useRef(null);

  useEffect(() => {
    setPrompt(initialPrompt || "");
    setReferences(Array.isArray(initialReferences) ? initialReferences : []);
    setRows([createRow(config.activeProfileId)]);
    setWindowPosition(null);
  }, [config.activeProfileId, initialPrompt, initialReferences]);

  const handleWindowPointerDown = (event) => {
    if (event.button !== 0 || event.target.closest("button")) return;
    const dialog = event.currentTarget.closest(".comparison-dialog");
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    setWindowPosition({ left: rect.left, top: rect.top });
    dragRef.current = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top, width: rect.width, height: rect.height };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handleWindowPointerMove = (event) => {
    if (!dragRef.current) return;
    const { offsetX, offsetY, width, height } = dragRef.current;
    const left = Math.max(0, Math.min(window.innerWidth - width, event.clientX - offsetX));
    const top = Math.max(0, Math.min(window.innerHeight - height, event.clientY - offsetY));
    setWindowPosition({ left, top });
  };
  const handleWindowPointerUp = (event) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const updateRow = (rowId, patch) => setRows((current) => current.map((row) => row.id === rowId ? { ...row, ...patch } : row));
  const changeProfile = (row, profileId) => {
    const profile = profiles.find((item) => item.id === profileId) || profiles[0];
    const modelOptions = getProfileModelOptions(profile?.id || "");
    const model = modelOptions.includes(profile?.model) ? profile.model : (modelOptions[0] || profile?.model || DEFAULT_IMAGE_MODEL);
    updateRow(row.id, { profileId: profile?.id || "", model, ...normalizeImageSizeSelection({ ...profile, model }), quality: profile?.quality || "high" });
  };
  const changeModel = (row, model) => updateRow(row.id, { model, ...normalizeImageSizeSelection({ ...row, model }) });
  const addRow = () => setRows((current) => [...current, createRow(config.activeProfileId)]);
  const removeRow = (rowId) => setRows((current) => current.length > 1 ? current.filter((row) => row.id !== rowId) : current);
  const addReferenceFiles = (files) => {
    const remaining = Math.max(0, 5 - references.length);
    const selectedFiles = (Array.isArray(files) ? files : []).filter((file) => file?.type?.startsWith("image/")).slice(0, remaining);
    const readFile = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    Promise.all(selectedFiles.map(readFile)).then((images) => setReferences((current) => [...current, ...images])).catch(() => undefined);
  };
  const canGenerate = prompt.trim() && rows.length && rows.every((row) => row.profileId) && comparisonState !== "loading";

  return <div className="comparison-window-layer" role="presentation">
    <section className="comparison-dialog" role="dialog" aria-modal="false" aria-label={cn.comparisonTitle} style={windowPosition ? { left: `${windowPosition.left}px`, top: `${windowPosition.top}px`, transform: "none" } : undefined}>
      <div className="dialog-header comparison-node-header" onPointerDown={handleWindowPointerDown} onPointerMove={handleWindowPointerMove} onPointerUp={handleWindowPointerUp} onPointerCancel={handleWindowPointerUp}><div><span className="node-icon prompt-icon"><Wand2 size={15} /></span><strong>{cn.comparisonTitle}</strong><span>{rows.length}</span></div><button className="icon-button subtle" onClick={onClose} aria-label={cn.close} title={cn.close}><X size={16} /></button></div>
      <div className="comparison-content">
        <div className="comparison-form">
          <label className="field-label comparison-prompt-label" htmlFor="comparison-prompt">{cn.comparisonPrompt}</label>
          <textarea id="comparison-prompt" className="prompt-input comparison-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={cn.comparisonPromptPlaceholder} />
          <div className="comparison-section-heading"><strong>{cn.comparisonApis}</strong><button type="button" className="icon-button subtle comparison-add-api" onClick={addRow} aria-label={cn.comparisonAddApi} title={cn.comparisonAddApi}><Plus size={16} /></button></div>
          <div className="comparison-api-rows">{rows.map((row) => {
            const profile = profiles.find((item) => item.id === row.profileId);
            const modelOptions = getProfileModelOptions(row.profileId);
            const options = modelOptions.length ? modelOptions : [row.model || DEFAULT_IMAGE_MODEL];
            const sizeSelection = normalizeImageSizeSelection(row);
            const sizeOptions = getImageSizeOptions(row.model || DEFAULT_IMAGE_MODEL, sizeSelection.resolution);
            const isAutoSize = sizeSelection.resolution === AUTO_IMAGE_RESOLUTION;
            return <div className="comparison-api-row" key={row.id}>
              <div className="node-parameter-field comparison-api-field"><span className="node-parameter-label">API</span><select className="node-select" value={row.profileId} onChange={(event) => changeProfile(row, event.target.value)}>{profiles.map((item) => <option key={item.id} value={item.id}>{item.name || item.id}</option>)}</select></div>
              <div className="node-parameter-field comparison-api-field comparison-model-field"><span className="node-parameter-label">{cn.model}</span><select className="node-select comparison-model-select" value={row.model} onChange={(event) => changeModel(row, event.target.value)}>{options.map((model) => <option key={model} value={model}>{model}</option>)}</select></div>
              <div className="node-parameter-field comparison-api-field"><span className="node-parameter-label">{cn.size}</span><select className="node-select" value={sizeSelection.resolution} onChange={(event) => updateRow(row.id, getImageSizeSelection({ ...row, model: row.model, resolution: event.target.value, ratio: sizeSelection.ratio }))}>{sizeOptions.resolutions.map((resolution) => <option key={resolution} value={resolution}>{resolution}</option>)}</select></div>
              {!isAutoSize && <div className="node-parameter-field comparison-api-field"><span className="node-parameter-label">比例</span><select className="node-select" value={sizeSelection.ratio} onChange={(event) => updateRow(row.id, getImageSizeSelection({ ...row, model: row.model, resolution: sizeSelection.resolution, ratio: event.target.value }))}>{sizeOptions.ratios.map((ratio) => <option key={ratio} value={ratio}>{formatImageRatioOption(getImageSizeSelection({ ...row, model: row.model, resolution: sizeSelection.resolution, ratio }))}</option>)}</select></div>}
              {isSenseNovaImageModel(row.model) ? <><div className="node-parameter-field comparison-api-field"><span className="node-parameter-label">水印开关</span><select className="node-select" value={row.watermark === false ? "off" : "on"} onChange={(event) => updateRow(row.id, { watermark: event.target.value === "on" })}><option value="on">开</option><option value="off">关</option></select></div><div className="node-parameter-field comparison-api-field"><span className="node-parameter-label">自动润色优化开关</span><select className="node-select" value={row.promptExtend === false ? "off" : "on"} onChange={(event) => updateRow(row.id, { promptExtend: event.target.value === "on" })}><option value="on">开</option><option value="off">关</option></select></div>{isSenseNovaU15LiteModel(row.model) && <div className="node-parameter-field comparison-api-field"><span className="node-parameter-label">输出格式</span><select className="node-select" value={row.outputFormat || "png"} onChange={(event) => updateRow(row.id, { outputFormat: event.target.value })}><option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WEBP</option></select></div>}</> : <div className="node-parameter-field comparison-api-field"><span className="node-parameter-label">{cn.quality}</span><select className="node-select" value={row.quality || "high"} onChange={(event) => updateRow(row.id, { quality: event.target.value })}><option value="high">{cn.high}</option><option value="medium">{cn.medium}</option><option value="low">{cn.low}</option><option value="auto">{cn.auto}</option></select></div>}
              {rows.length > 1 && <button type="button" className="icon-button subtle comparison-remove-api" onClick={() => removeRow(row.id)} aria-label={cn.removeReferenceImage} title={cn.removeReferenceImage}><X size={14} /></button>}
              {!profile && <p className="comparison-form-error">{cn.comparisonNoProfiles}</p>}
            </div>;
          })}</div>
          <div className="comparison-section-heading"><strong>{cn.comparisonReference}</strong><span>{references.length}/5</span></div>
          <div className="comparison-reference-list">{references.map((src, index) => <div className="comparison-reference-item" key={`${src.slice(0, 24)}-${index}`}><img src={src} alt={`${cn.referenceImage} ${index + 1}`} /><button type="button" className="icon-button subtle" onClick={() => setReferences((current) => current.filter((_item, itemIndex) => itemIndex !== index))} aria-label={cn.removeReferenceImage} title={cn.removeReferenceImage}><X size={13} /></button></div>)}{references.length < 5 && <label className="comparison-add-reference" htmlFor="comparison-reference-input"><ImageUp size={15} /><span>{cn.comparisonAddReference}</span></label>}<input id="comparison-reference-input" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(event) => { addReferenceFiles(Array.from(event.target.files || [])); event.target.value = ""; }} /></div>
          <button className="primary-button comparison-generate-button" disabled={!canGenerate} onClick={() => onGenerate({ prompt: prompt.trim(), referenceImages: references, entries: rows })}>{comparisonState === "loading" ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}<span>{comparisonState === "loading" ? cn.comparisonGenerating : cn.comparisonGenerate}</span></button>
          {!prompt.trim() && <p className="comparison-form-error">{cn.comparisonNoPrompt}</p>}
          {!rows.length && <p className="comparison-form-error">{cn.comparisonNoSelection}</p>}
        </div>
        <div className="comparison-results">{results.length ? results.map((result) => <article className={`comparison-result ${result.error ? "is-error" : ""}`} key={result.rowId}><div className="comparison-result-heading"><strong>{result.profileName || result.profileId}</strong><span>{result.model || cn.infoUnavailable}</span></div>{result.imageUrl ? <img src={displayImageSource(result.imageUrl, result.profileId)} alt={`${result.profileName || result.profileId} ${cn.generatedImage}`} /> : <div className="comparison-result-placeholder">{result.error || cn.comparisonFailed}</div>}</article>) : <div className="comparison-results-empty"><Images size={28} /><span>{cn.comparisonEmpty}</span></div>}</div>
      </div>
    </section>
  </div>;
}

function AppShell() {
  const [activePanel, setActivePanel] = useState("canvas");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const handlersRef = useRef({});
  const stablePromptChange = useCallback((id, prompt) => handlersRef.current.updatePrompt?.(id, prompt), []);
  const stableReferenceChange = useCallback((id, value) => handlersRef.current.updateReference?.(id, value), []);
  const stableReferenceFiles = useCallback((id, files) => handlersRef.current.referenceFiles?.(id, files), []);
  const stableGroupImagesChange = useCallback((id, images) => handlersRef.current.updateGroupImages?.(id, images), []);
  const stableGroupFiles = useCallback((id, files) => handlersRef.current.groupFiles?.(id, files), []);
  const stableComposeGroup = useCallback((id, direction, resolutionBasis) => handlersRef.current.composeGroup?.(id, direction, resolutionBasis), []);
  const stableGenerate = useCallback((id, comparisonTaskIndex, comparisonImageId) => handlersRef.current.generateImage?.(id, comparisonTaskIndex, comparisonImageId), []);
  const stableDelete = useCallback((id) => handlersRef.current.deleteNode?.(id), []);
  const stableDownload = useCallback((src, title, profileId) => handlersRef.current.downloadImage?.(src, title, profileId), []);
  const stableOpen = useCallback((src, profileId) => handlersRef.current.openImage?.(src, profileId), []);
  const stableOpenUrl = useCallback((src) => handlersRef.current.openUrl?.(src), []);
  const stableRetryDownload = useCallback((id) => handlersRef.current.retryDownload?.(id), []);
  const stablePreview = useCallback((src, title, originalSrc, profileId) => handlersRef.current.previewImage?.(src, title, originalSrc, profileId), []);
  const stableShowPrompt = useCallback((id) => handlersRef.current.showPromptForImage?.(id), []);
  const stableParamChange = useCallback((id, key, value) => handlersRef.current.updateNodeParam?.(id, key, value), []);
  const stableSizeChange = useCallback((id, selection) => handlersRef.current.updateNodeSize?.(id, selection), []);
  const stableComparisonChange = useCallback((id, patch) => handlersRef.current.updateComparison?.(id, patch), []);
  const stableComparisonGenerate = useCallback((id) => handlersRef.current.generateComparison?.(id), []);
  const stableFileSize = useCallback((id, fileSize) => handlersRef.current.updateFileSize?.(id, fileSize), []);
  const stableImageLoad = useCallback((id, width, height) => handlersRef.current.imageLoad?.(id, width, height), []);
  const stableResetGeneration = useCallback((id) => handlersRef.current.resetGeneration?.(id), []);
  const [config, setConfig] = useState({ activeProfileId: "default", profiles: [{ id: "default", name: "默认配置", endpoint: "https://api.openai.com/v1", model: DEFAULT_IMAGE_MODEL, ...DEFAULT_SIZE_SELECTION, quality: "high", responseFormat: "url", referenceImageMode: "file", imageEditEndpointMode: "auto", outputDir: "output", hasApiKey: false }], id: "default", name: "默认配置", endpoint: "https://api.openai.com/v1", model: DEFAULT_IMAGE_MODEL, ...DEFAULT_SIZE_SELECTION, quality: "high", responseFormat: "url", referenceImageMode: "file", imageEditEndpointMode: "auto", outputDir: "output", imageDownloadProxyEnabled: false, imageDownloadProxy: "", hasApiKey: false });
  const [workspaceStorageMode, setWorkspaceStorageMode] = useState("browser");
  const workspaceStorageReady = useRef(false);
  const workspaceHydrationPending = useRef(false);
  const workspaceSaveTimer = useRef(null);
  const [workspaceHydrationToken, setWorkspaceHydrationToken] = useState(0);
  const [modelFetchState, setModelFetchState] = useState("idle");
  const [modelFetchError, setModelFetchError] = useState("");
  const [fetchedModelsByProfile, setFetchedModelsByProfile] = useState(loadFetchedModelsByProfile);
  const [selectedModelsByProfile, setSelectedModelsByProfile] = useState(loadSelectedModelsByProfile);
  const initialCanvasState = useMemo(() => loadCanvasState(), []);
  const [canvasState, setCanvasState] = useState(initialCanvasState);
  const activeCanvasId = canvasState.activeId;
  const activeCanvas = canvasState.canvases.find((canvas) => canvas.id === activeCanvasId) || canvasState.canvases[0];
  const activeFetchedModels = fetchedModelsByProfile[config.activeProfileId] || [];
  const activeSelectedModels = selectedModelsByProfile[config.activeProfileId] || [];
  const imageModelOptions = useMemo(() => [...new Set([...SUPPORTED_IMAGE_MODELS, ...activeFetchedModels])], [activeFetchedModels]);
  const getProfileModelOptions = useCallback((profileId) => {
    const fetchedModels = fetchedModelsByProfile[profileId];
    if (!Array.isArray(fetchedModels)) return SUPPORTED_IMAGE_MODELS;
    const selectedModels = selectedModelsByProfile[profileId];
    return Array.isArray(selectedModels) ? selectedModels.filter((model) => fetchedModels.includes(model)) : fetchedModels;
  }, [fetchedModelsByProfile, selectedModelsByProfile]);
  const seededNodes = useMemo(() => (activeCanvas?.nodes || []).map((node) => ({ ...node, data: { ...node.data, profiles: config.profiles, activeProfileId: config.activeProfileId, getProfileModelOptions, modelOptions: getProfileModelOptions(node.data?.profileId || config.activeProfileId), onPromptChange: stablePromptChange, onReferenceChange: stableReferenceChange, onReferenceFiles: stableReferenceFiles, onGroupImagesChange: stableGroupImagesChange, onGroupFiles: stableGroupFiles, onCompose: stableComposeGroup, onGenerate: stableGenerate, onComparisonChange: stableComparisonChange, onComparisonGenerate: stableComparisonGenerate, onRegenerate: stableGenerate, onRetryDownload: stableRetryDownload, onResetGeneration: stableResetGeneration, onDelete: stableDelete, onDownload: stableDownload, onOpen: stableOpen, onOpenUrl: stableOpenUrl, onShowPrompt: stableShowPrompt, onPreview: stablePreview, onFileSize: stableFileSize, onImageLoad: stableImageLoad, onParamChange: stableParamChange, onSizeChange: stableSizeChange } })), [activeCanvas, activeCanvasId, config.activeProfileId, config.profiles, getProfileModelOptions, stableComparisonChange, stableComparisonGenerate, stableComposeGroup, stableDelete, stableDownload, stableFileSize, stableGenerate, stableGroupFiles, stableGroupImagesChange, stableImageLoad, stableOpen, stableOpenUrl, stableParamChange, stablePreview, stablePromptChange, stableReferenceChange, stableReferenceFiles, stableResetGeneration, stableRetryDownload, stableShowPrompt, stableSizeChange]);
  const [nodes, setNodes, onNodesChange] = useNodesState(seededNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(activeCanvas?.edges || []);
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
  });
  const [generationLogs, setGenerationLogs] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [testState, setTestState] = useState("idle");
  const [toast, setToast] = useState("");
  const [selectedCount, setSelectedCount] = useState(0);
  const [flowInstance, setFlowInstance] = useState(null);
  const canvasRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => {
    fetch("/api/config").then((response) => response.json()).then((value) => setConfig((current) => ({ ...current, ...value }))).catch(() => setToast(cn.localServerMissing));
    fetch("/api/settings").then((response) => response.json()).then(async (value) => {
      const mode = ["browser", "file", "auto"].includes(value.workspaceStorageMode) ? value.workspaceStorageMode : "browser";
      setWorkspaceStorageMode(mode);
      if (mode === "browser") {
        workspaceStorageReady.current = true;
        return;
      }
      workspaceStorageReady.current = false;
      try {
        const response = await fetch("/api/workspace");
        const result = await response.json().catch(() => ({}));
        if (response.ok && result.workspace?.canvases?.length) {
          const restoredWorkspace = restoreInterruptedGenerationState(result.workspace);
          workspaceHydrationPending.current = true;
          setCanvasState(restoredWorkspace);
          setWorkspaceHydrationToken((current) => current + 1);
        } else {
          workspaceStorageReady.current = true;
        }
      } catch {
        workspaceStorageReady.current = true;
      }
    }).catch(() => { workspaceStorageReady.current = true; });
  }, []);
  useEffect(() => {
    if (!workspaceHydrationToken) return;
    // The file is loaded asynchronously; use the restored canvas to replace
    // React Flow's initial nodes before persistence is enabled again.
    setNodes(seededNodes);
    setEdges(activeCanvas?.edges || []);
  }, [workspaceHydrationToken]);
  useEffect(() => {
    if (!workspaceHydrationToken || !workspaceHydrationPending.current || !activeCanvas) return;
    const currentNodeIds = nodes.map((node) => node.id).join("|");
    const expectedNodeIds = (activeCanvas.nodes || []).map((node) => node.id).join("|");
    const currentEdgeIds = edges.map((edge) => edge.id).join("|");
    const expectedEdgeIds = (activeCanvas.edges || []).map((edge) => edge.id).join("|");
    if (currentNodeIds !== expectedNodeIds || currentEdgeIds !== expectedEdgeIds) return;
    workspaceHydrationPending.current = false;
    workspaceStorageReady.current = true;
  }, [activeCanvas, edges, nodes, workspaceHydrationToken]);
  useEffect(() => {
    const connectedReferencesByPrompt = new Map();
    edges.forEach((edge) => {
      const target = nodes.find((node) => node.id === edge.target && node.type === "prompt");
      if (!target) return;
      const source = nodes.find((node) => node.id === edge.source && (node.type === "image" || node.type === "imageGroup"));
      if (!source) return;
      const references = source.type === "imageGroup"
        ? (Array.isArray(source.data?.images) ? source.data.images : [])
        : [source.data?.sourceImageUrl || source.data?.src || ""];
      const current = connectedReferencesByPrompt.get(target.id) || [];
      connectedReferencesByPrompt.set(target.id, [...new Set([...current, ...references])].filter(Boolean));
    });
    let changed = false;
    const nextNodes = nodes.map((node) => {
      if (node.type !== "prompt") return node;
      const nextReferences = connectedReferencesByPrompt.get(node.id) || [];
      const previousReferences = Array.isArray(node.data?.connectedReferenceImages) ? node.data.connectedReferenceImages : [];
      if (nextReferences.length === previousReferences.length && nextReferences.every((value, index) => value === previousReferences[index])) return node;
      changed = true;
      return { ...node, data: { ...node.data, connectedReferenceImages: nextReferences } };
    });
    if (changed) setNodes(nextNodes);
  }, [edges, nodes, setNodes]);
  useEffect(() => {
    const refreshCanvas = () => {
      if (document.hidden) return;
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
        const viewport = flowInstance?.getViewport?.();
        if (viewport) flowInstance.setViewport?.(viewport, { duration: 0 });
      });
    };
    document.addEventListener("visibilitychange", refreshCanvas);
    window.addEventListener("focus", refreshCanvas);
    return () => { document.removeEventListener("visibilitychange", refreshCanvas); window.removeEventListener("focus", refreshCanvas); };
  }, [flowInstance]);
  useEffect(() => { if (!config.profiles?.length) return; setNodes((current) => current.map((node) => {
    const modelOptions = getProfileModelOptions(node.data?.profileId || config.activeProfileId);
    const model = node.type === "prompt" ? (modelOptions.length ? (modelOptions.includes(node.data?.model) ? node.data.model : modelOptions[0]) : "") : node.data?.model;
    return { ...node, data: { ...node.data, profiles: config.profiles, activeProfileId: config.activeProfileId, ...(node.type === "prompt" ? { modelOptions, model } : {}) } };
  })); }, [config.activeProfileId, config.profiles, getProfileModelOptions, setNodes]);
  useEffect(() => {
    const models = fetchedModelsByProfile[config.activeProfileId];
    setModelFetchState(Array.isArray(models) ? (models.length ? "success" : "empty") : "idle");
    setModelFetchError("");
  }, [config.activeProfileId, fetchedModelsByProfile]);
  useEffect(() => {
    try { localStorage.setItem(FETCHED_MODELS_KEY, JSON.stringify(fetchedModelsByProfile)); } catch { /* Keep model discovery available for this session if storage is full. */ }
  }, [fetchedModelsByProfile]);
  useEffect(() => {
    try { localStorage.setItem(SELECTED_MODELS_KEY, JSON.stringify(selectedModelsByProfile)); } catch { /* Keep model selection available for this session if storage is full. */ }
  }, [selectedModelsByProfile]);
  useEffect(() => { if (!toast) return undefined; const timer = window.setTimeout(() => setToast(""), 3600); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (!workspaceStorageReady.current) return;
    setCanvasState((current) => ({
      ...current,
      canvases: current.canvases.map((canvas) => canvas.id === activeCanvasId ? { ...canvas, nodes, edges, updatedAt: new Date().toISOString() } : canvas)
    }));
  }, [activeCanvasId, edges, nodes]);
  useEffect(() => {
    if (!workspaceStorageReady.current) return;
    const serialized = JSON.stringify(canvasState, (key, value) => key === "responseText" || key === "rawResponseText" ? compactResponseTextForStorage(value) : value);
    if (workspaceStorageMode === "browser") {
      try { localStorage.setItem(CANVASES_KEY, serialized); } catch { /* Keep the current session usable if storage is full. */ }
      return;
    }
    if (workspaceSaveTimer.current) window.clearTimeout(workspaceSaveTimer.current);
    workspaceSaveTimer.current = window.setTimeout(() => {
      workspaceSaveTimer.current = null;
      fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspace: JSON.parse(serialized) }) }).catch(() => undefined);
    }, 250);
    return () => {
      if (workspaceSaveTimer.current) {
        window.clearTimeout(workspaceSaveTimer.current);
        workspaceSaveTimer.current = null;
      }
    };
  }, [canvasState, workspaceStorageMode]);

  const changeWorkspaceStorageMode = useCallback(async (nextMode) => {
    const mode = ["browser", "file", "auto"].includes(nextMode) ? nextMode : "browser";
    const serialized = JSON.stringify(canvasState, (key, value) => key === "responseText" || key === "rawResponseText" ? compactResponseTextForStorage(value) : value);
    try {
      if (mode === "browser") localStorage.setItem(CANVASES_KEY, serialized);
      else {
        const response = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspace: JSON.parse(serialized) }) });
        if (!response.ok) throw new Error("workspace save failed");
      }
      await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceStorageMode: mode }) });
      setWorkspaceStorageMode(mode);
      if (mode !== "browser") localStorage.removeItem(CANVASES_KEY);
      setToast("工作区保存位置已切换");
    } catch { setToast("工作区保存位置切换失败"); }
  }, [canvasState]);

  const updateNodeData = useCallback((id, patch) => setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, ...patch } } : node)), [setNodes]);
  const addImagesToGroup = useCallback((groupId, imageSources) => {
    const additions = Array.isArray(imageSources) ? imageSources.filter(Boolean) : [];
    if (!additions.length) return;
    const entryToken = `group-entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setNodes((current) => current.map((node) => {
      if (node.id !== groupId || node.type !== "imageGroup") return node;
      const existing = Array.isArray(node.data?.images) ? node.data.images : [];
      const addedImages = additions.filter((source) => !existing.includes(source));
      if (!addedImages.length) return node;
      return { ...node, data: { ...node.data, images: [...new Set([...existing, ...additions])].slice(0, 50), enteringImages: addedImages, imageEntryToken: entryToken } };
    }));
    window.setTimeout(() => {
      setNodes((current) => current.map((node) => node.id === groupId && node.data?.imageEntryToken === entryToken ? { ...node, data: { ...node.data, enteringImages: [], imageEntryToken: "" } } : node));
    }, 360);
  }, [setNodes]);
  const restoreNodePositions = useCallback((positions) => {
    const savedPositions = positions && typeof positions === "object" ? positions : {};
    if (!Object.keys(savedPositions).length) return;
    window.requestAnimationFrame(() => {
      setNodes((current) => current.map((node) => savedPositions[node.id] ? { ...node, position: { ...savedPositions[node.id] } } : node));
    });
  }, [setNodes]);
  const updateFileSize = useCallback((id, fileSize) => {
    const value = Number(fileSize);
    if (!Number.isFinite(value) || value <= 0) return;
    updateNodeData(id, { fileSize: value });
  }, [updateNodeData]);
  const updatePrompt = useCallback((id, prompt) => updateNodeData(id, { prompt: prompt.slice(0, 4000), status: "idle", error: "" }), [updateNodeData]);
  const updateReference = useCallback((id, referenceImages) => {
    const images = (Array.isArray(referenceImages) ? referenceImages : []).filter(Boolean);
    updateNodeData(id, { referenceImages: images, referenceImage: images[0] || "", status: "idle", error: "" });
  }, [updateNodeData]);
  const referenceFiles = useCallback((id, files) => {
    const imageFiles = (Array.isArray(files) ? files : []).filter((file) => file?.type?.startsWith("image/"));
    if (!imageFiles.length) return;
    const source = nodes.find((node) => node.id === id);
    const existing = Array.isArray(source?.data?.referenceImages) ? source.data.referenceImages : (source?.data?.referenceImage ? [source.data.referenceImage] : []);
    const readFile = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = reject; reader.readAsDataURL(file); });
    Promise.all(imageFiles.map(readFile)).then((images) => updateReference(id, [...existing, ...images])).catch(() => undefined);
  }, [nodes, updateReference]);
  const updateGroupImages = useCallback((id, images) => updateNodeData(id, { images: (Array.isArray(images) ? images : []).filter(Boolean) }), [updateNodeData]);
  const groupFiles = useCallback((id, files) => {
    const imageFiles = (Array.isArray(files) ? files : []).filter((file) => file?.type?.startsWith("image/"));
    if (!imageFiles.length) return;
    const source = nodes.find((node) => node.id === id);
    const existing = Array.isArray(source?.data?.images) ? source.data.images : [];
    const readFile = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = reject; reader.readAsDataURL(file); });
    Promise.all(imageFiles.map(readFile)).then((images) => updateGroupImages(id, [...existing, ...images])).catch(() => undefined);
  }, [nodes, updateGroupImages]);
  const composeGroup = useCallback(async (id, direction, resolutionBasis = "min") => {
    const group = nodes.find((node) => node.id === id && node.type === "imageGroup");
    const images = Array.isArray(group?.data?.images) ? group.data.images.filter(Boolean) : [];
    if (images.length < 2) { setToast(cn.stitchNeedImages); return; }
    try {
      const result = await composeImageSources(images, direction, resolutionBasis);
      const outputId = `image-stitch-${Date.now()}`;
      const position = { x: (Number(group.position?.x) || 0) + 520, y: Number(group.position?.y) || 0 };
      const title = `${direction === "horizontal" ? cn.stitchLeftRight : cn.stitchTopBottom}-${resolutionBasis === "max" ? cn.stitchMaxResolution : cn.stitchMinResolution}-${new Date().toLocaleString("zh-CN", { hour12: false }).replace(/[/: ]/g, "-")}.png`;
      const data = { id: outputId, src: result.src, title, prompt: title, model: direction === "horizontal" ? cn.stitchLeftRight : cn.stitchTopBottom, status: "success", saveStatus: "completed", actualWidth: result.width, actualHeight: result.height, fileSize: dataUrlByteSize(result.src), createdAt: new Date().toISOString(), onDelete: stableDelete, onDownload: stableDownload, onOpen: stableOpen, onOpenUrl: stableOpenUrl, onPreview: stablePreview, onFileSize: stableFileSize, onImageLoad: stableImageLoad, onShowPrompt: stableShowPrompt, onRegenerate: stableGenerate };
      setNodes((current) => [...current, { id: outputId, type: "image", position, style: { width: 360 }, data }]);
      setEdges((current) => [...current, { id: `edge-${id}-${outputId}`, source: id, target: outputId, animated: true, style: { stroke: "#86a9e9", strokeWidth: 1.5 } }]);
      setToast(`${direction === "horizontal" ? cn.stitchLeftRight : cn.stitchTopBottom}已完成`);
    } catch { setToast(cn.stitchFailed); }
  }, [nodes, setEdges, setNodes, stableDelete, stableDownload, stableFileSize, stableGenerate, stableImageLoad, stableOpen, stableOpenUrl, stablePreview, stableShowPrompt]);
  const updateNodeParam = useCallback((id, key, value) => setNodes((current) => current.map((node) => {
    if (node.id !== id) return node;
    const patch = { [key]: value, status: "idle", error: "" };
    if (key === "profileId") {
      const modelOptions = getProfileModelOptions(value);
      patch.modelOptions = modelOptions;
      if (modelOptions.length && !modelOptions.includes(node.data?.model)) patch.model = modelOptions[0];
    }
    return { ...node, data: { ...node.data, ...patch } };
  })), [getProfileModelOptions, setNodes]);
  const updateNodeSize = useCallback((id, selection) => updateNodeData(id, { ...selection, status: "idle", error: "" }), [updateNodeData]);
  const updateComparison = useCallback((id, patch) => updateNodeData(id, { ...patch, status: "idle", error: "" }), [updateNodeData]);
  const resetGeneration = useCallback((id) => updateNodeData(id, { status: "idle", error: "", generationStartedAt: "" }), [updateNodeData]);
  const deleteNode = useCallback((id) => { setNodes((current) => current.filter((node) => node.id !== id)); setEdges((current) => current.filter((edge) => edge.source !== id && edge.target !== id)); }, [setEdges, setNodes]);

  const downloadImage = useCallback(async (src, model = "ai-image", profileId = "") => {
    try {
      const response = await fetch(displayImageSource(src, profileId));
      if (!response.ok) throw new Error("download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = generatedImageFilename(model);
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    } catch { setToast(cn.downloadFailed); }
  }, []);

  const openImage = useCallback((src, profileId = "") => window.open(displayImageSource(src, profileId), "_blank", "noopener,noreferrer"), []);
  const openUrl = useCallback((src) => {
    const url = String(src || "");
    if (/^https?:\/\//i.test(url)) window.open(url, "_blank", "noopener,noreferrer");
  }, []);
  const openImagePreview = useCallback((src, title, originalSrc = "", profileId = "") => setPreviewImage({ src, title, originalSrc, profileId }), []);
  const addComparisonAt = useCallback((position) => {
    const selectedNode = nodes.find((node) => node.selected);
    const sourceNode = selectedNode?.type === "prompt" || selectedNode?.type === "comparison" ? selectedNode : selectedNode?.data?.sourcePromptId ? nodes.find((node) => node.id === selectedNode.data.sourcePromptId) : nodes.find((node) => node.type === "prompt");
    const selectedProfile = (config.profiles || []).find((profile) => profile.id === config.activeProfileId) || config.profiles?.[0];
    const id = `comparison-${Date.now()}`;
    const entry = createComparisonEntry(selectedProfile, getProfileModelOptions);
    setNodes((current) => [...current, { id, type: "comparison", position, style: { width: 760, height: 520 }, data: { prompt: sourceNode?.data?.prompt || "", referenceImages: Array.isArray(sourceNode?.data?.referenceImages) ? sourceNode.data.referenceImages : selectedNode?.type === "image" && selectedNode.data?.src ? [selectedNode.data.src] : [], entries: [entry], profiles: config.profiles, activeProfileId: config.activeProfileId, getProfileModelOptions, status: "idle", error: "", onComparisonChange: stableComparisonChange, onComparisonGenerate: stableComparisonGenerate, onGenerate: stableComparisonGenerate, onDelete: stableDelete } }]);
    setActivePanel("canvas");
  }, [config.activeProfileId, config.profiles, getProfileModelOptions, nodes, setNodes, stableComparisonChange, stableComparisonGenerate, stableDelete]);
  const appendGenerationLog = useCallback((entry) => setGenerationLogs((current) => [{ id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString(), ...entry }, ...current].slice(0, 50)), []);
  const appendHistory = useCallback((item) => setHistory((current) => {
    const next = [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, 50);
    persistHistorySafely(next);
    return next;
  }), []);
  const updateHistoryItem = useCallback((id, patch) => setHistory((current) => {
    const next = current.map((item) => item.id === id ? { ...item, ...patch } : item);
    persistHistorySafely(next);
    return next;
  }), []);
  const updateImageLoad = useCallback((id, width, height) => {
    if (!Number.isFinite(Number(width)) || !Number.isFinite(Number(height)) || width <= 0 || height <= 0) return;
    const patch = { actualWidth: Number(width), actualHeight: Number(height) };
    updateNodeData(id, patch);
    updateHistoryItem(id, patch);
  }, [updateHistoryItem, updateNodeData]);
  const pollImageSave = useCallback(async (jobId, sourceImageUrl, nodeId, historyId, startedAt) => {
    const uploadBrowserImage = async () => {
      if (!sourceImageUrl) return false;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), IMAGE_SAVE_BROWSER_TIMEOUT_MS);
      try {
        const downloadStartedAt = Date.now();
        const response = await fetch(sourceImageUrl, { cache: "no-store", signal: controller.signal });
        if (!response.ok) return false;
        const blob = await response.blob();
        if (!blob.size) return false;
        const imageData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const upload = await fetch(`/api/image-save-upload/${encodeURIComponent(jobId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageData, imageDownloadDurationMs: Date.now() - downloadStartedAt }) });
        return upload.ok;
      } catch {
        return false;
      } finally {
        window.clearTimeout(timeout);
      }
    };
    const applyCompletedJob = (job) => {
      const patch = { src: job.localImageUrl || "", savedPath: job.savedPath || "", fileSize: job.fileSize || 0, imageDownloadDurationMs: job.imageDownloadDurationMs, localWriteDurationMs: job.localWriteDurationMs, saveStatus: "completed", generationDurationMs: startedAt ? Date.now() - startedAt : undefined };
      setNodes((current) => current.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, ...patch } } : node));
      updateHistoryItem(historyId, patch);
    };
    for (let attempt = 0; attempt < 180; attempt += 1) {
      try {
        const response = await fetch(`/api/image-save-status/${encodeURIComponent(jobId)}`);
        if (!response.ok) return;
        const job = await response.json();
        if (job.status === "pending" || job.status === "server-saving" || job.status === "browser-saving") {
          await new Promise((resolve) => window.setTimeout(resolve, 500));
          continue;
        }
        if (job.status === "completed") {
          applyCompletedJob(job);
        }
        if (job.status === "error") {
          const browserSaved = await uploadBrowserImage();
          if (browserSaved) {
            await new Promise((resolve) => window.setTimeout(resolve, 250));
            continue;
          }
          const saveError = job.error || "图片下载和保存失败。";
          setNodes((current) => current.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, saveStatus: "error", saveError } } : node));
          updateHistoryItem(historyId, { saveStatus: "error", saveError });
        }
        return;
      } catch {
        return;
      }
    }
  }, [setNodes, updateHistoryItem]);

  const retryImageDownload = useCallback(async (nodeId) => {
    const node = nodes.find((item) => item.id === nodeId);
    const jobId = String(node?.data?.saveJobId || "");
    if (!jobId || !node?.data?.sourceImageUrl) return;
    setNodes((current) => current.map((item) => item.id === nodeId ? { ...item, data: { ...item.data, saveStatus: "pending", saveError: "" } } : item));
    updateHistoryItem(nodeId, { saveStatus: "pending", saveError: "" });
    try {
      const response = await fetch(`/api/image-save-fallback/${encodeURIComponent(jobId)}`, { method: "POST" });
      if (!response.ok) throw new Error("retry failed");
      void pollImageSave(jobId, node.data.sourceImageUrl, nodeId, nodeId, Date.now() - (Number(node.data.generationDurationMs) || 0));
    } catch {
      const saveError = "重新下载失败，请稍后重试。";
      setNodes((current) => current.map((item) => item.id === nodeId ? { ...item, data: { ...item.data, saveStatus: "error", saveError } } : item));
      updateHistoryItem(nodeId, { saveStatus: "error", saveError });
    }
  }, [nodes, pollImageSave, setNodes, updateHistoryItem]);

  const generateImage = useCallback(async (id) => {
    const source = nodes.find((node) => node.id === id);
    const prompt = String(source?.data?.prompt || "").trim();
    if (!source || !prompt) return;
    let outputNodeIds = [];
    updateNodeData(id, { status: "generating", error: "", generationStartedAt: new Date().toISOString() });
    try {
      const model = String(source.data.model || "").trim();
      if (!model) throw new Error(cn.modelRequired);
      const sizeSelection = normalizeImageSizeSelection({ model, resolution: source.data.resolution || config.resolution, ratio: source.data.ratio || config.ratio, size: source.data.size || config.size, width: source.data.width || config.width, height: source.data.height || config.height });
      const size = sizeSelection.size;
      const quality = String(source.data.quality || config.quality).trim();
      const watermark = source.data.watermark !== false;
      const promptExtend = source.data.promptExtend !== false;
      const outputFormat = ["png", "jpeg", "webp"].includes(String(source.data.outputFormat || "").toLowerCase()) ? String(source.data.outputFormat).toLowerCase() : "png";
      const requestCount = isSenseNovaU15LiteModel(model) ? 1 : Math.max(1, Math.min(5, Number(source.data.requestCount) || 1));
      const directReferences = Array.isArray(source.data.referenceImages) ? source.data.referenceImages : (source.data.referenceImage ? [source.data.referenceImage] : []);
      const linkedImages = edges.filter((edge) => edge.target === id).flatMap((edge) => {
        const image = nodes.find((node) => node.id === edge.source && node.type === "image");
        return image ? [image.data?.sourceImageUrl || image.data?.src || ""] : [];
      }).filter(Boolean);
      const groupedImages = edges.filter((edge) => edge.target === id).flatMap((edge) => {
        const group = nodes.find((node) => node.id === edge.source && node.type === "imageGroup");
        return Array.isArray(group?.data?.images) ? group.data.images : [];
      });
      const referenceImages = [...new Set([...directReferences, ...linkedImages])].filter(Boolean);
      const tasks = groupedImages.length
        ? groupedImages.map((image) => [...new Set([image, ...directReferences, ...linkedImages])].filter(Boolean))
        : Array.from({ length: requestCount }, () => referenceImages);
      const createdAt = new Date().toISOString();
      const generationBatchId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const sourceWidth = Number(source.width || source.measured?.width || source.style?.width || 580);
      const existingOutputBottom = nodes
        .filter((node) => node.type === "image" && node.data?.sourcePromptId === id)
        .reduce((bottom, node) => {
          const top = Number(node.position?.y) || source.position.y;
          const height = Number(node.height || node.measured?.height || node.style?.height || 430);
          return Math.max(bottom, top + height);
        }, source.position.y);
      const outputStartY = existingOutputBottom > source.position.y ? existingOutputBottom + 32 : source.position.y;
      const requestProfileId = source.data.profileId || config.activeProfileId;
      const requestProfile = (config.profiles || []).find((profile) => profile.id === requestProfileId);
      const outputNodes = tasks.map((referenceImages, index) => {
        const imageId = `image-${generationBatchId}-${index}`;
        return { id: imageId, type: "image", position: { x: source.position.x + sourceWidth + 80, y: outputStartY + index * 450 }, style: { width: 360, height: 430 }, data: { id: imageId, sourcePromptId: id, src: "", comparisonSource: referenceImages[0] || "", prompt, title: prompt, model, quality, watermark, promptExtend, outputFormat, requestCount, ...sizeSelection, profileId: requestProfileId, profileName: requestProfile?.name || requestProfileId, referenceImageCount: referenceImages.length, responseFormat: requestProfile?.responseFormat || config.responseFormat || "url", createdAt, status: "generating", error: "", onDelete: stableDelete, onRegenerate: stableGenerate, onRetryDownload: stableRetryDownload, onDownload: stableDownload, onOpen: stableOpen, onOpenUrl: stableOpenUrl, onPreview: stablePreview, onFileSize: stableFileSize, onImageLoad: stableImageLoad, onShowPrompt: stableShowPrompt } };
      });
      outputNodeIds = outputNodes.map((node) => node.id);
      setNodes((current) => [...current, ...outputNodes]);
      setEdges((current) => [...current, ...outputNodes.map((node) => ({ id: `edge-${id}-${node.id}`, source: id, target: node.id, animated: true, style: { stroke: "#f4b860", strokeWidth: 1.5 } }))]);
      const results = await Promise.all(tasks.map(async (referenceImages, taskIndex) => {
        const generationStartedAt = Date.now();
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), IMAGE_GENERATION_TIMEOUT_MS);
        try {
          const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, model, size, ratio: sizeSelection.ratio, resolution: sizeSelection.resolution, quality, watermark, promptExtend, outputFormat, profileId: source.data.profileId || config.activeProfileId, referenceImages }), signal: controller.signal });
          const responseBodyText = await response.text();
          let result = {};
          try { result = JSON.parse(responseBodyText); } catch { result = { responseText: responseBodyText, rawResponseText: responseBodyText }; }
          if (!response.ok || !result.imageUrl) {
            const responseText = result.responseText || "";
            const rawResponseText = result.rawResponseText || "";
            appendGenerationLog({ ok: false, prompt, text: rawResponseText || responseText || result.error || cn.generationFailed });
            return { error: result.error || cn.generationFailed, requestText: result.requestText || "", responseText, rawResponseText };
          }
          const responseText = result.responseText || "";
          const rawResponseText = result.rawResponseText || "";
          appendGenerationLog({ ok: true, prompt, text: rawResponseText || responseText || JSON.stringify({ ok: true, savedPath: result.savedPath || "", revisedPrompt: result.revisedPrompt || "" }, null, 2) });
          return { result, responseText, rawResponseText, generationDurationMs: Date.now() - generationStartedAt };
        } catch (error) {
          const message = controller.signal.aborted ? cn.generationTimeout : (error.message || cn.generationFailed);
          appendGenerationLog({ ok: false, prompt, text: message });
          return { error: message, responseText: message, rawResponseText: "", generationDurationMs: Date.now() - generationStartedAt };
        } finally {
          window.clearTimeout(timeout);
        }
      }));
      const successful = results.filter((entry) => entry.result);
      results.forEach((entry, index) => {
        if (!entry.result) return;
        appendHistory({ id: outputNodeIds[index], src: "", sourceImageUrl: entry.result.sourceImageUrl || "", saveJobId: entry.result.saveJobId || "", prompt, model, quality, outputFormat, requestCount, ...sizeSelection, profileId: requestProfileId, profileName: requestProfile?.name || requestProfileId, referenceImageCount: tasks[index]?.length || 0, responseFormat: requestProfile?.responseFormat || config.responseFormat || "url", createdAt, savedPath: "", fileSize: 0, apiRequestDurationMs: entry.result.apiRequestDurationMs, imageDownloadDurationMs: undefined, localWriteDurationMs: undefined, generationDurationMs: entry.generationDurationMs || 0, saveStatus: entry.result.saveStatus || "pending", status: "success", requestText: entry.result.requestText || entry.requestText || "", responseText: entry.result.responseText || entry.responseText || "", rawResponseText: entry.result.rawResponseText || entry.rawResponseText || "" });
        if (entry.result.saveJobId) window.setTimeout(() => pollImageSave(entry.result.saveJobId, entry.result.sourceImageUrl || entry.result.imageUrl, outputNodeIds[index], outputNodeIds[index], Date.now() - (entry.generationDurationMs || 0)), 0);
      });
      setNodes((current) => current.map((node) => {
        const outputIndex = outputNodeIds.indexOf(node.id);
        if (outputIndex < 0) return node;
        const entry = results[outputIndex];
        if (!entry?.result) return { ...node, data: { ...node.data, status: "error", error: entry?.error || cn.generationFailed, requestText: entry?.requestText || "", responseText: entry?.responseText || "", rawResponseText: entry?.rawResponseText || "" } };
        return { ...node, data: { ...node.data, src: "", sourceImageUrl: entry.result.sourceImageUrl || "", saveJobId: entry.result.saveJobId || "", savedPath: "", fileSize: 0, apiRequestDurationMs: entry.result.apiRequestDurationMs, imageDownloadDurationMs: undefined, localWriteDurationMs: undefined, generationDurationMs: entry.generationDurationMs || 0, saveStatus: entry.result.saveStatus || "pending", status: "success", error: "", requestText: entry.result.requestText || entry.requestText || "", responseText: entry.result.responseText || entry.responseText || "", rawResponseText: entry.result.rawResponseText || entry.rawResponseText || "" } };
      }));
      if (!successful.length) throw new Error(results.find((entry) => entry.error)?.error || cn.generationFailed);
      const failedCount = results.length - successful.length;
      updateNodeData(id, { status: failedCount ? "error" : "success", error: failedCount ? `${failedCount} 个生成任务失败。` : "", generationStartedAt: "" });
      setToast(successful.length > 1 ? `已添加 ${successful.length} 张生成图片。` : cn.imageAddedToast);
    } catch (error) {
      if (outputNodeIds.length) setNodes((current) => current.map((node) => outputNodeIds.includes(node.id) && !node.data?.src ? { ...node, data: { ...node.data, status: "error", error: error.message || cn.generationFailed, responseText: error.message || cn.generationFailed, rawResponseText: "" } } : node));
      updateNodeData(id, { status: "error", error: error.message || cn.generationFailed, generationStartedAt: "" });
    }
  }, [appendGenerationLog, appendHistory, config.activeProfileId, config.model, config.quality, config.size, edges, nodes, pollImageSave, setEdges, setNodes, stableDelete, stableDownload, stableFileSize, stableOpen, stableOpenUrl, stablePreview, stableShowPrompt, updateNodeData]);

  const generateComparison = useCallback(async (id, comparisonTaskIndex = null) => {
    const source = nodes.find((node) => node.id === id && node.type === "comparison");
    const prompt = String(source?.data?.prompt || "").trim();
    const entries = Array.isArray(source?.data?.entries) ? source.data.entries.filter((entry) => entry?.profileId) : [];
    if (!source || !prompt || !entries.length) return;
    const retryTaskIndex = Number.isInteger(comparisonTaskIndex) ? comparisonTaskIndex : null;
    if (retryTaskIndex !== null && (retryTaskIndex < 0 || retryTaskIndex >= entries.length)) return;
    let outputNodeIds = [];
    updateNodeData(id, { status: "generating", error: "", generationStartedAt: new Date().toISOString() });
    try {
      const referenceImages = Array.isArray(source.data.referenceImages) ? source.data.referenceImages : [];
      const createdAt = new Date().toISOString();
      const generationBatchId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const sourceWidth = Number(source.width || source.measured?.width || source.style?.width || 760);
      const existingOutputRight = nodes.filter((node) => node.type === "image" && node.data?.sourcePromptId === id).reduce((right, node) => {
        const left = Number(node.position?.x) || source.position.x + sourceWidth + 80;
        const width = Number(node.width || node.measured?.width || node.style?.width || 360);
        return Math.max(right, left + width);
      }, source.position.x + sourceWidth + 80);
      const outputStartX = existingOutputRight > source.position.x + sourceWidth + 80 ? existingOutputRight + 32 : source.position.x + sourceWidth + 80;
      const tasks = entries.map((entry) => {
        const model = String(entry.model || DEFAULT_IMAGE_MODEL).trim();
        const sizeSelection = normalizeImageSizeSelection({ ...entry, model });
        const profile = (config.profiles || []).find((item) => item.id === entry.profileId);
        return { entry, model, sizeSelection, profile };
      });
      const comparisonOutputNodes = nodes.filter((node) => node.type === "image" && node.data?.sourcePromptId === id).sort((left, right) => (Number(left.position?.x) || 0) - (Number(right.position?.x) || 0));
      const existingRetryNode = retryTaskIndex === null ? null : nodes.find((node) => node.type === "image" && node.data?.comparisonNodeId === id && node.data?.comparisonTaskIndex === retryTaskIndex) || comparisonOutputNodes[retryTaskIndex];
      if (retryTaskIndex !== null && !existingRetryNode) return;
      const runTaskIndexes = retryTaskIndex === null ? tasks.map((_task, index) => index) : [retryTaskIndex];
      const runTasks = runTaskIndexes.map((taskIndex) => tasks[taskIndex]);
      const outputNodes = retryTaskIndex === null ? tasks.map((task, index) => {
        const imageId = `image-${generationBatchId}-${index}`;
        return { id: imageId, type: "image", position: { x: outputStartX + index * 392, y: source.position.y }, style: { width: 360, height: 430 }, data: { id: imageId, sourcePromptId: id, comparisonNodeId: id, comparisonTaskIndex: index, src: "", comparisonSource: referenceImages[0] || "", prompt, title: `${task.profile?.name || task.entry.profileId} - ${task.model}`, model: task.model, quality: task.entry.quality || task.profile?.quality || "high", outputFormat: task.entry.outputFormat || "png", requestCount: 1, ...task.sizeSelection, profileId: task.entry.profileId, profileName: task.profile?.name || task.entry.profileId, referenceImageCount: referenceImages.length, responseFormat: task.profile?.responseFormat || config.responseFormat || "url", createdAt, status: "generating", error: "", onDelete: stableDelete, onRegenerate: stableGenerate, onRetryDownload: stableRetryDownload, onDownload: stableDownload, onOpen: stableOpen, onOpenUrl: stableOpenUrl, onPreview: stablePreview, onFileSize: stableFileSize, onImageLoad: stableImageLoad, onShowPrompt: stableShowPrompt } };
      }) : [];
      outputNodeIds = retryTaskIndex === null ? outputNodes.map((node) => node.id) : [existingRetryNode.id];
      if (retryTaskIndex === null) {
        setNodes((current) => [...current, ...outputNodes]);
        setEdges((current) => [...current, ...outputNodes.map((node) => ({ id: `edge-${id}-${node.id}`, source: id, target: node.id, animated: true, style: { stroke: "#f4b866", strokeWidth: 1.5 } }))]);
      } else {
        setNodes((current) => current.map((node) => node.id === existingRetryNode.id ? { ...node, data: { ...node.data, status: "generating", error: "", saveError: "" } } : node));
      }
      const applyComparisonResult = (entry, taskIndex) => {
        const task = tasks[taskIndex];
        const outputIndex = runTaskIndexes.indexOf(taskIndex);
        const outputNodeId = outputNodeIds[outputIndex];
        if (entry.result) {
          appendHistory({ id: outputNodeId, src: "", sourceImageUrl: entry.result.sourceImageUrl || "", saveJobId: entry.result.saveJobId || "", prompt, model: task.model, quality: task.entry.quality || task.profile?.quality || "high", requestCount: 1, ...task.sizeSelection, profileId: task.entry.profileId, profileName: task.profile?.name || task.entry.profileId, referenceImageCount: referenceImages.length, responseFormat: task.profile?.responseFormat || config.responseFormat || "url", createdAt, savedPath: "", fileSize: 0, apiRequestDurationMs: entry.result.apiRequestDurationMs, imageDownloadDurationMs: undefined, localWriteDurationMs: undefined, generationDurationMs: entry.generationDurationMs || 0, saveStatus: entry.result.saveStatus || "pending", status: "success", requestText: entry.result.requestText || entry.requestText || "", responseText: entry.result.responseText || entry.responseText || "", rawResponseText: entry.result.rawResponseText || entry.rawResponseText || "" });
          setNodes((current) => current.map((node) => node.id !== outputNodeId ? node : { ...node, data: { ...node.data, sourceImageUrl: entry.result.sourceImageUrl || "", saveJobId: entry.result.saveJobId || "", apiRequestDurationMs: entry.result.apiRequestDurationMs, generationDurationMs: entry.generationDurationMs || 0, saveStatus: entry.result.saveStatus || "pending", status: "success", error: "", requestText: entry.result.requestText || entry.requestText || "", responseText: entry.result.responseText || entry.responseText || "", rawResponseText: entry.result.rawResponseText || entry.rawResponseText || "", model: task.model, ...task.sizeSelection } }));
          if (entry.result.saveJobId) window.setTimeout(() => pollImageSave(entry.result.saveJobId, entry.result.sourceImageUrl || entry.result.imageUrl, outputNodeId, outputNodeId, Date.now() - (entry.generationDurationMs || 0)), 0);
        } else {
          setNodes((current) => current.map((node) => node.id !== outputNodeId ? node : { ...node, data: { ...node.data, status: "error", error: entry.error || cn.generationFailed, requestText: entry.requestText || "", responseText: entry.responseText || "", rawResponseText: entry.rawResponseText || "" } }));
        }
      };
      const results = await Promise.all(runTasks.map(async (task, resultIndex) => {
        const taskIndex = runTaskIndexes[resultIndex];
        const generationStartedAt = Date.now();
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), IMAGE_GENERATION_TIMEOUT_MS);
        try {
          const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, model: task.model, size: task.sizeSelection.size, ratio: task.sizeSelection.ratio, resolution: task.sizeSelection.resolution, quality: task.entry.quality || task.profile?.quality || "high", outputFormat: task.entry.outputFormat || "png", profileId: task.entry.profileId, referenceImages }), signal: controller.signal });
          const responseBodyText = await response.text();
          let result = {};
          try { result = JSON.parse(responseBodyText); } catch { result = { responseText: responseBodyText, rawResponseText: responseBodyText }; }
          if (!response.ok || !result.imageUrl) {
            const responseText = result.responseText || "";
            const rawResponseText = result.rawResponseText || "";
            appendGenerationLog({ ok: false, prompt, text: rawResponseText || responseText || result.error || cn.generationFailed });
            const entry = { error: result.error || cn.generationFailed, requestText: result.requestText || "", responseText, rawResponseText };
            applyComparisonResult(entry, taskIndex);
            return entry;
          }
          const responseText = result.responseText || "";
          const rawResponseText = result.rawResponseText || "";
          appendGenerationLog({ ok: true, prompt, text: rawResponseText || responseText || JSON.stringify({ ok: true, model: task.model }, null, 2) });
          const entry = { result, responseText, rawResponseText, generationDurationMs: Date.now() - generationStartedAt };
          applyComparisonResult(entry, taskIndex);
          return entry;
        } catch (error) {
          const message = controller.signal.aborted ? cn.generationTimeout : (error.message || cn.generationFailed);
          appendGenerationLog({ ok: false, prompt, text: message });
          const entry = { error: message, responseText: message, rawResponseText: "", generationDurationMs: Date.now() - generationStartedAt };
          applyComparisonResult(entry, taskIndex);
          return entry;
        } finally {
          window.clearTimeout(timeout);
        }
      }));
      const successful = results.filter((entry) => entry.result);
      if (!successful.length) throw new Error(results.find((entry) => entry.error)?.error || cn.generationFailed);
      const failedCount = results.length - successful.length;
      if (retryTaskIndex === null) {
        updateNodeData(id, { status: failedCount ? "error" : "success", error: failedCount ? `${failedCount} 个生成任务失败。` : "", generationStartedAt: "" });
        setToast(successful.length > 1 ? `已添加 ${successful.length} 张对比图片。` : cn.imageAddedToast);
      } else {
        const otherOutputs = nodes.filter((node) => node.type === "image" && (node.data?.comparisonNodeId === id || node.data?.sourcePromptId === id) && node.id !== outputNodeIds[0]);
        const remainingFailures = otherOutputs.filter((node) => node.data?.status === "error").length;
        const remainingGenerating = otherOutputs.some((node) => node.data?.status === "generating");
        updateNodeData(id, { status: remainingFailures ? "error" : remainingGenerating ? "generating" : "success", error: remainingFailures ? `${remainingFailures} 个生成任务失败。` : "", generationStartedAt: "" });
        setToast(cn.imageAddedToast);
      }
    } catch (error) {
      if (outputNodeIds.length) setNodes((current) => current.map((node) => outputNodeIds.includes(node.id) && !node.data?.src ? { ...node, data: { ...node.data, status: "error", error: error.message || cn.generationFailed } } : node));
      updateNodeData(id, { status: "error", error: error.message || cn.generationFailed, generationStartedAt: "" });
    }
  }, [appendGenerationLog, appendHistory, config.activeProfileId, config.profiles, config.responseFormat, edges, nodes, pollImageSave, setEdges, setNodes, stableDelete, stableDownload, stableFileSize, stableGenerate, stableOpen, stableOpenUrl, stablePreview, stableRetryDownload, stableShowPrompt, updateNodeData]);

  const addPromptAt = useCallback((position) => {
    const id = `prompt-${Date.now()}`;
    const modelOptions = getProfileModelOptions(config.activeProfileId);
    const model = modelOptions.includes(config.model) ? config.model : (modelOptions[0] || "");
    const sizeSelection = normalizeImageSizeSelection({ ...config, model });
    setNodes((current) => [...current, { id, type: "prompt", position, style: { width: 580, height: 580 }, data: { prompt: "", referenceImages: [], profileId: config.activeProfileId || "", profiles: config.profiles, modelOptions, status: "idle", error: "", model, requestCount: 1, watermark: true, promptExtend: true, ...sizeSelection, quality: config.quality, onPromptChange: stablePromptChange, onReferenceChange: stableReferenceChange, onReferenceFiles: stableReferenceFiles, onGenerate: stableGenerate, onResetGeneration: stableResetGeneration, onDelete: stableDelete, onParamChange: stableParamChange, onSizeChange: stableSizeChange } }]);
    setActivePanel("canvas");
  }, [config, getProfileModelOptions, setNodes, stableDelete, stableGenerate, stableParamChange, stablePromptChange, stableReferenceChange, stableReferenceFiles, stableResetGeneration, stableSizeChange]);

  const addGroupAt = useCallback((position) => {
    const id = `group-${Date.now()}`;
    setNodes((current) => [...current, { id, type: "imageGroup", position, style: { width: 460, height: 460 }, data: { images: [], onDelete: stableDelete, onGroupImagesChange: stableGroupImagesChange, onGroupFiles: stableGroupFiles, onCompose: stableComposeGroup } }]);
    setActivePanel("canvas");
  }, [setNodes, stableComposeGroup, stableDelete, stableGroupFiles, stableGroupImagesChange]);

  const addPrompt = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const position = flowInstance && rect ? flowInstance.screenToFlowPosition({ x: rect.left + rect.width / 2 - 170, y: rect.top + rect.height / 2 - 120 }) : { x: 160 + nodes.length * 36, y: 150 + nodes.length * 28 };
    addPromptAt(position);
  }, [addPromptAt, flowInstance, nodes.length]);

  const showPromptForImage = useCallback((sourceId) => {
    const sourceNode = nodes.find((node) => node.id === sourceId && (node.type === "image" || node.type === "imageGroup"));
    if (!sourceNode || nodes.some((node) => node.type === "prompt" && (node.data?.sourceNodeId === sourceId || node.data?.sourceImageId === sourceId))) return;
    const id = `prompt-${Date.now()}`;
    const isImage = sourceNode.type === "image";
    const modelOptions = getProfileModelOptions(config.activeProfileId);
    const sourceModel = sourceNode.data.model || config.model;
    const model = modelOptions.includes(sourceModel) ? sourceModel : (modelOptions[0] || "");
    const sizeSelection = normalizeImageSizeSelection({ model, resolution: sourceNode.data.resolution || config.resolution, ratio: sourceNode.data.ratio || config.ratio, size: sourceNode.data.size || config.size, width: sourceNode.data.width || config.width, height: sourceNode.data.height || config.height });
    const sourceHeight = Number(sourceNode.height || sourceNode.measured?.height || sourceNode.style?.height || (isImage ? 390 : 460));
    const promptReferenceImage = isImage ? (sourceNode.data.sourceImageUrl || sourceNode.data.src || "") : "";
    const promptNode = { id, type: "prompt", position: { x: sourceNode.position.x, y: sourceNode.position.y + sourceHeight + 60 }, style: { width: 580, height: 580 }, data: { sourceNodeId: sourceId, sourceImageId: isImage ? sourceId : "", prompt: "", referenceImages: promptReferenceImage ? [promptReferenceImage] : [], profileId: config.activeProfileId || "", profiles: config.profiles, modelOptions, status: "idle", error: "", model, requestCount: 1, watermark: true, promptExtend: true, ...sizeSelection, quality: config.quality, onPromptChange: stablePromptChange, onReferenceChange: stableReferenceChange, onReferenceFiles: stableReferenceFiles, onGenerate: stableGenerate, onResetGeneration: stableResetGeneration, onDelete: stableDelete, onParamChange: stableParamChange, onSizeChange: stableSizeChange } };
    setNodes((current) => [...current, promptNode]);
    setEdges((current) => current.some((edge) => edge.source === sourceId && edge.target === id) ? current : [...current, { id: `edge-${sourceId}-${id}`, source: sourceId, target: id, animated: true, style: { stroke: isImage ? "#7dc7b9" : "#86a9e9", strokeWidth: 1.5 } }]);
  }, [config, getProfileModelOptions, nodes, setEdges, setNodes, stableDelete, stableGenerate, stableParamChange, stablePromptChange, stableReferenceChange, stableReferenceFiles, stableResetGeneration, stableSizeChange]);

  const generateByNode = useCallback((id, comparisonTaskIndex, comparisonImageId) => {
    const node = nodes.find((item) => item.id === id);
    if (node?.type !== "comparison") return generateImage(id);
    let taskIndex = comparisonTaskIndex;
    if (!Number.isInteger(taskIndex) && comparisonImageId) {
      const comparisonImage = nodes.find((item) => item.id === comparisonImageId && item.type === "image");
      taskIndex = comparisonImage?.data?.comparisonTaskIndex;
      if (!Number.isInteger(taskIndex)) {
        const comparisonImages = nodes.filter((item) => item.type === "image" && item.data?.sourcePromptId === id).sort((left, right) => (Number(left.position?.x) || 0) - (Number(right.position?.x) || 0));
        taskIndex = comparisonImages.findIndex((item) => item.id === comparisonImageId);
      }
    }
    return Number.isInteger(taskIndex) && taskIndex >= 0 ? generateComparison(id, taskIndex) : generateComparison(id);
  }, [generateComparison, generateImage, nodes]);
  handlersRef.current = { updatePrompt, updateReference, referenceFiles, updateGroupImages, groupFiles, composeGroup, updateNodeParam, updateNodeSize, updateComparison, updateFileSize, imageLoad: updateImageLoad, resetGeneration, generateImage: generateByNode, generateComparison, deleteNode, downloadImage, openImage, openUrl, retryDownload: retryImageDownload, previewImage: openImagePreview, showPromptForImage };

  const selectCanvas = useCallback((canvasId) => {
    if (canvasId === activeCanvasId) return;
    const next = canvasState.canvases.find((canvas) => canvas.id === canvasId);
    if (!next) return;
    setCanvasState((current) => ({ ...current, activeId: canvasId }));
    setNodes(next.nodes.map((node) => ({ ...node, data: { ...node.data, profiles: config.profiles, activeProfileId: config.activeProfileId, getProfileModelOptions, modelOptions: getProfileModelOptions(node.data?.profileId || config.activeProfileId), onPromptChange: stablePromptChange, onReferenceChange: stableReferenceChange, onReferenceFiles: stableReferenceFiles, onGroupImagesChange: stableGroupImagesChange, onGroupFiles: stableGroupFiles, onCompose: stableComposeGroup, onGenerate: stableGenerate, onComparisonChange: stableComparisonChange, onComparisonGenerate: stableComparisonGenerate, onRegenerate: stableGenerate, onRetryDownload: stableRetryDownload, onResetGeneration: stableResetGeneration, onDelete: stableDelete, onDownload: stableDownload, onOpen: stableOpen, onOpenUrl: stableOpenUrl, onShowPrompt: stableShowPrompt, onPreview: stablePreview, onFileSize: stableFileSize, onImageLoad: stableImageLoad, onParamChange: stableParamChange, onSizeChange: stableSizeChange } })));
    setEdges(next.edges || []);
    setActivePanel("canvas");
  }, [activeCanvasId, canvasState.canvases, config.activeProfileId, config.profiles, getProfileModelOptions, setEdges, setNodes, stableComparisonChange, stableComparisonGenerate, stableComposeGroup, stableDelete, stableDownload, stableFileSize, stableGenerate, stableGroupFiles, stableGroupImagesChange, stableImageLoad, stableOpen, stableOpenUrl, stableParamChange, stablePreview, stablePromptChange, stableReferenceChange, stableReferenceFiles, stableResetGeneration, stableRetryDownload, stableShowPrompt, stableSizeChange]);

  const createCanvas = useCallback(() => {
    const id = `canvas-${Date.now()}`;
    const nextCanvas = { id, name: "\u753b\u5e03 " + (canvasState.canvases.length + 1), nodes: [], edges: [], updatedAt: new Date().toISOString() };
    setCanvasState((current) => ({ activeId: id, canvases: [...current.canvases, nextCanvas] }));
    setNodes([]);
    setEdges([]);
    setActivePanel("canvas");
  }, [canvasState.canvases.length, setEdges, setNodes]);

  const renameCanvas = useCallback((canvasId) => {
    const canvas = canvasState.canvases.find((item) => item.id === canvasId);
    if (!canvas) return;
    const nextName = window.prompt(cn.renameCanvas, canvas.name)?.trim();
    if (!nextName || nextName === canvas.name) return;
    setCanvasState((current) => ({ ...current, canvases: current.canvases.map((item) => item.id === canvasId ? { ...item, name: nextName, updatedAt: new Date().toISOString() } : item) }));
  }, [canvasState.canvases]);

  const deleteCanvas = useCallback((canvasId) => {
    if (canvasState.canvases.length <= 1 || !window.confirm(cn.confirmDeleteCanvas)) return;
    const remaining = canvasState.canvases.filter((canvas) => canvas.id !== canvasId);
    if (!remaining.length) return;
    const nextActiveId = canvasId === activeCanvasId ? remaining[0].id : activeCanvasId;
    const nextActive = remaining.find((canvas) => canvas.id === nextActiveId) || remaining[0];
    setCanvasState({ activeId: nextActive.id, canvases: remaining });
    if (canvasId === activeCanvasId) {
    setNodes(nextActive.nodes.map((node) => ({ ...node, data: { ...node.data, profiles: config.profiles, activeProfileId: config.activeProfileId, getProfileModelOptions, modelOptions: getProfileModelOptions(node.data?.profileId || config.activeProfileId), onPromptChange: stablePromptChange, onReferenceChange: stableReferenceChange, onReferenceFiles: stableReferenceFiles, onGroupImagesChange: stableGroupImagesChange, onGroupFiles: stableGroupFiles, onCompose: stableComposeGroup, onGenerate: stableGenerate, onComparisonChange: stableComparisonChange, onComparisonGenerate: stableComparisonGenerate, onRegenerate: stableGenerate, onRetryDownload: stableRetryDownload, onResetGeneration: stableResetGeneration, onDelete: stableDelete, onDownload: stableDownload, onOpen: stableOpen, onOpenUrl: stableOpenUrl, onShowPrompt: stableShowPrompt, onPreview: stablePreview, onFileSize: stableFileSize, onImageLoad: stableImageLoad, onParamChange: stableParamChange, onSizeChange: stableSizeChange } })));
      setEdges(nextActive.edges || []);
    }
    setActivePanel("canvas");
  }, [activeCanvasId, canvasState.canvases, config.activeProfileId, config.profiles, getProfileModelOptions, setEdges, setNodes, stableComparisonChange, stableComparisonGenerate, stableComposeGroup, stableDelete, stableDownload, stableFileSize, stableGenerate, stableGroupFiles, stableGroupImagesChange, stableImageLoad, stableOpen, stableOpenUrl, stableParamChange, stablePreview, stablePromptChange, stableReferenceChange, stableReferenceFiles, stableResetGeneration, stableRetryDownload, stableShowPrompt, stableSizeChange]);

  const saveSettings = useCallback(async () => {
    setSaveState("saving");
    try {
      const response = await fetch("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId: config.activeProfileId, name: config.name, endpoint: config.endpoint, model: config.model, resolution: config.resolution, ratio: config.ratio, width: config.width, height: config.height, size: config.size, quality: config.quality, responseFormat: config.responseFormat || "url", referenceImageMode: config.referenceImageMode || "file", imageEditEndpointMode: config.imageEditEndpointMode || "auto", outputDir: config.outputDir, imageDownloadProxyEnabled: Boolean(config.imageDownloadProxyEnabled), imageDownloadProxy: config.imageDownloadProxy || "", apiKey: apiKeyDraft.trim() || undefined }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || cn.saveFailed);
      setConfig((current) => ({ ...current, ...result.config })); setSaveState("saved");
    } catch { setSaveState("error"); setToast(cn.cannotSave); }
  }, [apiKeyDraft, config]);

  const selectProfile = useCallback(async (profileId) => {
    const profile = (config.profiles || []).find((item) => item.id === profileId);
    if (!profile) return;
    setConfig((current) => ({ ...current, ...profile, activeProfileId: profileId }));
    setApiKeyDraft("");
    setSaveState("idle");
    setTestState("idle");
    await fetch("/api/config/profiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "activate", id: profileId }) });
  }, [config.profiles]);

  const createProfile = useCallback(async () => {
    const response = await fetch("/api/config/profiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", name: cn.newProfile }) });
    const result = await response.json().catch(() => ({}));
    if (response.ok) { setConfig((current) => ({ ...current, ...result.config })); setApiKeyDraft(""); setSaveState("idle"); setTestState("idle"); }
  }, []);

  const deleteProfile = useCallback(async () => {
    if ((config.profiles || []).length <= 1 || !window.confirm(cn.confirmDeleteProfile)) return;
    const response = await fetch("/api/config/profiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id: config.activeProfileId }) });
    const result = await response.json().catch(() => ({}));
    if (response.ok) { setConfig((current) => ({ ...current, ...result.config })); setApiKeyDraft(""); setSaveState("idle"); setTestState("idle"); }
  }, [config.activeProfileId, config.profiles]);

  const reorderProfiles = useCallback(async (sourceId, targetId) => {
    const currentProfiles = Array.isArray(config.profiles) ? config.profiles : [];
    const sourceIndex = currentProfiles.findIndex((profile) => profile.id === sourceId);
    const targetIndex = currentProfiles.findIndex((profile) => profile.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
    const nextProfiles = [...currentProfiles];
    const [moved] = nextProfiles.splice(sourceIndex, 1);
    nextProfiles.splice(targetIndex, 0, moved);
    setConfig((current) => ({ ...current, profiles: nextProfiles }));
    try {
      const response = await fetch("/api/config/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", ids: nextProfiles.map((profile) => profile.id) })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "配置档排序保存失败");
      setConfig((current) => ({ ...current, ...result.config }));
    } catch {
      setConfig((current) => ({ ...current, profiles: currentProfiles }));
      setToast("配置档排序保存失败");
    }
  }, [config.profiles]);

  const testConnection = useCallback(async () => {
    setTestState("testing");
    try {
      const response = await fetch("/api/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: config.endpoint, apiKey: apiKeyDraft.trim() || undefined }) });
      if (!response.ok) throw new Error("connection failed");
      setTestState("success");
    } catch { setTestState("error"); }
  }, [apiKeyDraft, config.endpoint]);

  const revealApiKey = useCallback(async () => {
    try {
      const response = await fetch(`/api/config/key?profileId=${encodeURIComponent(config.activeProfileId)}`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok || typeof result.apiKey !== "string") return false;
      setApiKeyDraft(result.apiKey);
      return true;
    } catch {
      return false;
    }
  }, [config.activeProfileId]);

  const fetchModels = useCallback(async () => {
    setModelFetchState("loading");
    setModelFetchError("");
    try {
      const response = await fetch("/api/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: config.endpoint, apiKey: apiKeyDraft.trim() || undefined, imageDownloadProxyEnabled: Boolean(config.imageDownloadProxyEnabled), imageDownloadProxy: config.imageDownloadProxy || "" }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || cn.modelsFetchFailed);
      const models = Array.isArray(result.models) ? [...new Set(result.models.filter(Boolean))] : [];
      setFetchedModelsByProfile((current) => ({ ...current, [config.activeProfileId]: models }));
      setSelectedModelsByProfile((current) => {
        const existing = Array.isArray(current[config.activeProfileId]) ? current[config.activeProfileId] : [];
        return { ...current, [config.activeProfileId]: existing.filter((model) => models.includes(model)) };
      });
      setModelFetchState(models.length ? "success" : "empty");
    } catch (error) {
      setModelFetchError(error.message || cn.modelsFetchFailed);
      setModelFetchState("error");
    }
  }, [apiKeyDraft, config.activeProfileId, config.endpoint, config.imageDownloadProxy, config.imageDownloadProxyEnabled]);

  const toggleFetchedModel = useCallback((model) => {
    const profileId = config.activeProfileId;
    setSelectedModelsByProfile((current) => {
      const selected = Array.isArray(current[profileId]) ? current[profileId] : [];
      const next = selected.includes(model) ? selected.filter((item) => item !== model) : [...selected, model];
      return { ...current, [profileId]: next };
    });
  }, [config.activeProfileId]);

  const exportConfig = useCallback(async () => {
    const response = await fetch("/api/config/export");
    if (!response.ok) return setToast(cn.cannotExport);
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "ai-canvas-config.json"; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  }, []);

  const importConfig = useCallback(async (event) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const response = await fetch("/api/config/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) });
      const result = await response.json(); if (!response.ok) throw new Error("import failed");
      setConfig((current) => ({ ...current, ...result.config })); setApiKeyDraft(""); setToast(cn.configImported);
    } catch { setToast(cn.invalidConfig); }
  }, []);

  const addHistoryImage = useCallback((item) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const position = flowInstance && rect ? flowInstance.screenToFlowPosition({ x: rect.left + rect.width / 2 - 170, y: rect.top + rect.height / 2 - 150 }) : { x: 200, y: 160 };
    const id = `image-${Date.now()}`;
    setNodes((current) => [...current, { id, type: "image", position, style: { width: 360 }, data: { ...item, id, title: item.prompt, onDelete: stableDelete, onRegenerate: stableGenerate, onRetryDownload: stableRetryDownload, onDownload: stableDownload, onOpen: stableOpen, onOpenUrl: stableOpenUrl, onPreview: stablePreview, onFileSize: stableFileSize, onImageLoad: stableImageLoad, onShowPrompt: stableShowPrompt } }]);
    setActivePanel("canvas");
  }, [flowInstance, setNodes, stableDelete, stableDownload, stableFileSize, stableGenerate, stableImageLoad, stableOpen, stableOpenUrl, stablePreview, stableRetryDownload, stableShowPrompt]);

  const addImageFileAt = useCallback((file, position) => {
    if (!file?.type?.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const id = `image-${Date.now()}`;
      const src = String(reader.result || "");
      const item = { id, src, prompt: file.name || cn.generatedImage, model: config.model, ...normalizeImageSizeSelection(config), createdAt: new Date().toISOString() };
      setNodes((current) => [...current, { id, type: "image", position, style: { width: 360 }, data: { ...item, title: item.prompt, onDelete: stableDelete, onDownload: stableDownload, onOpen: stableOpen, onOpenUrl: stableOpenUrl, onPreview: stablePreview, onFileSize: stableFileSize, onShowPrompt: stableShowPrompt } }]);
      setToast(cn.imageAddedToast);
    };
    reader.readAsDataURL(file);
  }, [config.model, config.size, setNodes, stableDelete, stableDownload, stableFileSize, stableImageLoad, stableOpen, stableOpenUrl, stablePreview, stableShowPrompt]);

  const clearHistory = useCallback(() => { setHistory([]); localStorage.removeItem(HISTORY_KEY); }, []);
  const deleteHistoryItem = useCallback((id) => {
    if (!window.confirm(cn.confirmDeleteHistoryItem)) return;
    setHistory((current) => {
      const next = current.filter((item) => item.id !== id);
      persistHistorySafely(next);
      return next;
    });
  }, []);
  const clearBrowserCache = useCallback(async () => {
    if (!window.confirm(cn.confirmClearCache)) return;
    let workspaceCleared = workspaceStorageMode === "browser";
    try {
      [HISTORY_KEY, CANVASES_KEY, "ai-canvas-workflow-v1"].forEach((key) => localStorage.removeItem(key));
      const response = await fetch("/api/workspace", { method: "DELETE" });
      workspaceCleared = response.ok || workspaceCleared;
    } catch {
      // Browser mode can still be cleared if the local service is unavailable.
    }
    if (!workspaceCleared) {
      setToast("清除本地工作区失败，请确认本地服务已启动。");
      return;
    }
    window.location.reload();
  }, [workspaceStorageMode]);
  const handleZoomIn = useCallback(() => flowInstance?.zoomIn({ duration: 180 }), [flowInstance]);
  const handleZoomOut = useCallback(() => flowInstance?.zoomOut({ duration: 180 }), [flowInstance]);
  const handleFitView = useCallback(() => flowInstance?.fitView({ padding: 0.2, duration: 250 }), [flowInstance]);

  const visibleNodeCount = nodes.length;
  const view = activePanel === "settings" ? <SettingsView config={config} apiKeyDraft={apiKeyDraft} setApiKeyDraft={setApiKeyDraft} workspaceStorageMode={workspaceStorageMode} onWorkspaceStorageModeChange={changeWorkspaceStorageMode} onChange={(key, value) => { setConfig((current) => ({ ...current, [key]: value })); setSaveState("idle"); setTestState("idle"); }} onSizeChange={(selection) => { setConfig((current) => ({ ...current, ...selection })); setSaveState("idle"); setTestState("idle"); }} onSelectProfile={selectProfile} onCreateProfile={createProfile} onDeleteProfile={deleteProfile} onReorderProfiles={reorderProfiles} onClearCache={clearBrowserCache} onSave={saveSettings} onTest={testConnection} onFetchModels={fetchModels} onToggleFetchedModel={toggleFetchedModel} onRevealApiKey={revealApiKey} onExport={exportConfig} onImport={importConfig} saveState={saveState} testState={testState} modelFetchState={modelFetchState} modelFetchError={modelFetchError} fetchedModels={activeFetchedModels} selectedModels={activeSelectedModels} importRef={importRef} /> : activePanel === "history" ? <HistoryView history={history} onAddHistoryImage={addHistoryImage} onClearHistory={clearHistory} onDeleteHistoryItem={deleteHistoryItem} onDownload={downloadImage} /> : <>
    <Topbar onFitView={handleFitView} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onOpenSettings={() => setActivePanel("settings")} onOpenLogs={() => setLogsOpen(true)} selectedCount={selectedCount} />
    <CanvasBoard nodes={nodes} onNodesChange={onNodesChange} edges={edges} setEdges={setEdges} onEdgesChange={onEdgesChange} onAddPrompt={addPromptAt} onAddGroup={addGroupAt} onAddImageFile={addImageFileAt} onOpenComparison={addComparisonAt} onAddImagesToGroup={addImagesToGroup} onRestoreNodePositions={restoreNodePositions} onSelectedChange={setSelectedCount} canvasRef={canvasRef} onInit={setFlowInstance} />
  </>;

  return <div className="app-frame"><datalist id="image-model-options">{imageModelOptions.map((model) => <option key={model} value={model} />)}</datalist><Sidebar activePanel={activePanel} setActivePanel={setActivePanel} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} canvases={canvasState.canvases} activeCanvasId={activeCanvasId} onSelectCanvas={selectCanvas} onCreateCanvas={createCanvas} onDeleteCanvas={deleteCanvas} onRenameCanvas={renameCanvas} nodeCount={visibleNodeCount} historyCount={history.length} /><main className="main-area">{view}</main>{logsOpen && <GenerationLogsDialog logs={generationLogs} onClose={() => setLogsOpen(false)} />}{previewImage && <ImagePreviewDialog preview={previewImage} onClose={() => setPreviewImage(null)} />}{toast && <div className="toast"><CheckCircle2 size={16} />{toast}<button className="icon-button subtle" onClick={() => setToast("")} aria-label={cn.dismiss}><X size={14} /></button></div>}</div>;
}

export default function App() {
  return <AppErrorBoundary><ReactFlowProvider><AppShell /></ReactFlowProvider></AppErrorBoundary>;
}
