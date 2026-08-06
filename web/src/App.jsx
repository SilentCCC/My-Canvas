import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  History as HistoryIcon,
  ImagePlus,
  ImageUp,
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

const cn = {
  appTitle: "AI \u65e0\u9650\u753b\u5e03",
  localWorkspace: "\u672c\u5730\u5de5\u4f5c\u533a",
  promptNode: "Prompt \u8282\u70b9",
  deletePromptNode: "\u5220\u9664 Prompt \u8282\u70b9",
  promptPlaceholder: "\u63cf\u8ff0\u4f60\u60f3\u751f\u6210\u7684\u56fe\u7247...",
  imagePrompt: "\u56fe\u7247 Prompt",
  generating: "\u751f\u6210\u4e2d",
  generate: "\u751f\u6210",
  imageAdded: "\u56fe\u7247\u5df2\u6dfb\u52a0\u5230\u753b\u5e03",
  imageAddedToast: "\u56fe\u7247\u5df2\u6dfb\u52a0\u5230\u753b\u5e03\u3002",
  generatedImage: "\u751f\u6210\u56fe\u7247",
  openImage: "\u6253\u5f00\u56fe\u7247",
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
  apiKey: "API Key",
  keepSavedKey: "\u7559\u7a7a\u4ee5\u4fdd\u7559\u5df2\u4fdd\u5b58\u7684\u5bc6\u94a5",
  keyNote: "\u7531\u672c\u5730 Node \u670d\u52a1\u4fdd\u5b58\uff0c\u6d4f\u89c8\u5668\u4e0d\u4f1a\u8bfb\u53d6\u5bc6\u94a5\u539f\u6587\u3002",
  model: "Model",
  size: "\u5c3a\u5bf8",
  auto: "\u81ea\u52a8",
  quality: "\u8d28\u91cf",
  high: "\u9ad8",
  medium: "\u4e2d",
  low: "\u4f4e",
  saving: "\u4fdd\u5b58\u4e2d",
  saveSettings: "\u4fdd\u5b58\u8bbe\u7f6e",
  testing: "\u6d4b\u8bd5\u4e2d",
  testConnection: "\u6d4b\u8bd5\u8fde\u63a5",
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
  nodeModel: "\u8282\u70b9\u6a21\u578b",
  nodeSize: "\u8282\u70b9\u5c3a\u5bf8",
  nodeQuality: "\u8282\u70b9\u8d28\u91cf",
  profile: "\u914d\u7f6e\u6863",
  profileName: "\u914d\u7f6e\u540d\u79f0",
  newProfile: "\u65b0\u5efa\u914d\u7f6e",
  deleteProfile: "\u5220\u9664\u914d\u7f6e",
  confirmDeleteProfile: "\u786e\u5b9a\u5220\u9664\u5f53\u524d\u914d\u7f6e\u5417\uff1f",
  profileSaved: "\u914d\u7f6e\u6863\u5df2\u4fdd\u5b58\u3002",
  autoSaveMode: "\u4fdd\u5b58\u65b9\u5f0f",
  automatic: "\u81ea\u52a8\u4fdd\u5b58",
  manual: "\u624b\u52a8\u4e0b\u8f7d",
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
  deleteCanvas: "\u5220\u9664\u753b\u5e03",
  renameCanvas: "\u91cd\u547d\u540d\u753b\u5e03",
  confirmDeleteCanvas: "\u786e\u5b9a\u5220\u9664\u5f53\u524d\u753b\u5e03\u5417\uff1f"
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
      model: "gpt-image-2",
      size: "1024x1024",
      quality: "high"
    }
  }
];

const CANVASES_KEY = "ai-canvas-workspaces-v1";

function loadCanvasState() {
  try {
    const saved = JSON.parse(localStorage.getItem(CANVASES_KEY) || "null");
    if (saved?.canvases?.length) return saved;
    const legacy = JSON.parse(localStorage.getItem("ai-canvas-workflow-v1") || "null");
    if (legacy?.nodes) return { activeId: "canvas-1", canvases: [{ id: "canvas-1", name: "\u672a\u547d\u540d\u753b\u5e03", nodes: legacy.nodes, edges: legacy.edges || [] }] };
  } catch {
    // Ignore malformed local workspace data and start with a clean canvas.
  }
  return { activeId: "canvas-1", canvases: [{ id: "canvas-1", name: "\u672a\u547d\u540d\u753b\u5e03", nodes: initialNodes, edges: [] }] };
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

function PromptNode({ id, data, selected }) {
  const isGenerating = data.status === "generating";
  const referenceInputId = `reference-image-${id}`;
  const [isReferenceDragOver, setIsReferenceDragOver] = useState(false);
  const referenceImages = Array.isArray(data.referenceImages) ? data.referenceImages : (data.referenceImage ? [data.referenceImage] : []);

  return (
    <div className={`canvas-node prompt-node ${selected ? "is-selected" : ""}`}>
      <NodeResizer isVisible={selected} minWidth={320} maxWidth={560} minHeight={310} lineClassName="resizer-line" handleClassName="resizer-handle" />
      <Handle type="target" position={Position.Left} className="node-handle" />
      <div className="node-header">
        <div className="node-type">
          <span className="node-icon prompt-icon"><Wand2 size={15} /></span>
          <span>{cn.promptNode}</span>
        </div>
        <button className="icon-button subtle nodrag" onClick={() => data.onDelete?.(id)} aria-label={cn.deletePromptNode} title={cn.deletePromptNode}>
          <Trash2 size={15} />
        </button>
      </div>
      <div className="node-body">
        <textarea
          className="prompt-input nodrag nowheel"
          value={data.prompt || ""}
          onChange={(event) => data.onPromptChange?.(id, event.target.value)}
          placeholder={cn.promptPlaceholder}
          aria-label={cn.imagePrompt}
        />
        <div className={`reference-image-row nodrag ${isReferenceDragOver ? "is-drag-over" : ""}`} onDragOver={(event) => { event.preventDefault(); setIsReferenceDragOver(true); }} onDragLeave={() => setIsReferenceDragOver(false)} onDrop={(event) => { event.preventDefault(); setIsReferenceDragOver(false); data.onReferenceFiles?.(id, Array.from(event.dataTransfer.files || [])); }}>
          <div className="reference-image-previews">
            {referenceImages.map((src, index) => <div className="reference-image-preview" key={`${src.slice(0, 24)}-${index}`}><img src={src} alt={`${cn.referenceImage} ${index + 1}`} draggable="false" /><button className="icon-button subtle nodrag" onClick={() => data.onReferenceChange?.(id, referenceImages.filter((_item, itemIndex) => itemIndex !== index))} aria-label={cn.removeReferenceImage} title={cn.removeReferenceImage}><X size={13} /></button></div>)}
          </div>
          {referenceImages.length < 5 && <label className="reference-image-button nodrag" htmlFor={referenceInputId} title={cn.addReferenceImage}><ImageUp size={14} /><span>{referenceImages.length ? `${referenceImages.length}/5` : cn.addReferenceImage}</span></label>}
          <input id={referenceInputId} className="reference-image-input" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { data.onReferenceFiles?.(id, Array.from(event.target.files || [])); event.target.value = ""; }} />
          <span className="reference-image-hint">{cn.referenceImageLimit}</span>
        </div>
        <div className="node-parameters">
          <input className="node-model nodrag" value={data.model || "gpt-image-2"} onChange={(event) => data.onParamChange?.(id, "model", event.target.value)} aria-label={cn.nodeModel} placeholder="gpt-image-2" />
          <select className="node-select nodrag" value={data.size || "1024x1024"} onChange={(event) => data.onParamChange?.(id, "size", event.target.value)} aria-label={cn.nodeSize}>
            <option value="1024x1024">1024 x 1024</option>
            <option value="1536x1024">1536 x 1024</option>
            <option value="1024x1536">1024 x 1536</option>
            <option value="auto">{cn.auto}</option>
          </select>
          <select className="node-select nodrag" value={data.quality || "high"} onChange={(event) => data.onParamChange?.(id, "quality", event.target.value)} aria-label={cn.nodeQuality}>
            <option value="high">{cn.high}</option>
            <option value="medium">{cn.medium}</option>
            <option value="low">{cn.low}</option>
            <option value="auto">{cn.auto}</option>
          </select>
        </div>
        <div className="prompt-footer">
          <span className="prompt-hint">{(data.prompt || "").length}/4000</span>
          <button className="generate-button nodrag" onClick={() => data.onGenerate?.(id)} disabled={isGenerating || !(data.prompt || "").trim()}>
            {isGenerating ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
            <span>{isGenerating ? cn.generating : cn.generate}</span>
          </button>
        </div>
        {data.status === "success" && <div className="node-status success"><CheckCircle2 size={14} /> {cn.imageAdded}</div>}
        {data.error && <div className="node-status error"><AlertCircle size={14} /> {data.error}</div>}
      </div>
      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
}

function ImageNode({ id, data, selected }) {
  return (
    <div className={`canvas-node image-node ${selected ? "is-selected" : ""}`}>
      <NodeResizer isVisible={selected} minWidth={260} minHeight={290} lineClassName="resizer-line" handleClassName="resizer-handle" />
      <Handle type="target" position={Position.Left} className="node-handle" />
      <div className="node-header">
        <div className="node-type">
          <span className="node-icon image-icon"><ImagePlus size={15} /></span>
          <span>{cn.generatedImage}</span>
        </div>
        <div className="node-actions">
          <button className="icon-button subtle nodrag" onClick={() => data.onOpen?.(data.src)} aria-label={cn.openImage} title={cn.openImage}>
            <ExternalLink size={15} />
          </button>
          <button className="icon-button subtle nodrag" onClick={() => data.onDownload?.(data.src, data.title)} aria-label={cn.downloadImage} title={cn.downloadImage}>
            <Download size={15} />
          </button>
          <button className="icon-button subtle nodrag" onClick={() => data.onDelete?.(id)} aria-label={cn.deleteImageNode} title={cn.deleteImageNode}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="image-frame">
        <img src={data.src} alt={data.title || cn.generatedImage} draggable="false" />
        <div className="image-overlay"><span>{data.model || "gpt-image-2"}</span><span>{data.size || "1024x1024"}</span></div>
      </div>
      <div className="image-caption">
        <span>{data.title || cn.untitledGeneration}</span>
        <span className="image-time">{formatDate(data.createdAt)}</span>
      </div>
    </div>
  );
}

const nodeTypes = { prompt: memo(PromptNode), image: memo(ImageNode) };

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
        <button className={`nav-item ${activePanel === "settings" ? "is-active" : ""}`} onClick={() => setActivePanel("settings")} title={cn.apiSettings}>
          <Settings2 size={17} /><span>{cn.apiSettings}</span>
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
      {!collapsed && <div className="sidebar-footer"><div className="local-status"><span className="status-dot" /> {cn.localReady}</div><span className="version">v0.1</span></div>}
    </aside>
  );
}

function Topbar({ onFitView, onZoomIn, onZoomOut, onOpenSettings, selectedCount }) {
  return (
    <header className="topbar">
      <div className="breadcrumbs"><span>{cn.workspace}</span><ChevronRight size={14} /><strong>{cn.untitledCanvas}</strong></div>
      <div className="topbar-actions">
        <div className="view-actions">
          <button className="icon-button" onClick={onZoomOut} aria-label={cn.zoomOut} title={cn.zoomOut}><ZoomOut size={16} /></button>
          <button className="icon-button" onClick={onFitView} aria-label={cn.fitCanvas} title={cn.fitCanvas}><Maximize2 size={16} /></button>
          <button className="icon-button" onClick={onZoomIn} aria-label={cn.zoomIn} title={cn.zoomIn}><ZoomIn size={16} /></button>
        </div>
        <button className="toolbar-button" onClick={onOpenSettings}><Settings2 size={16} /><span>{cn.settings}</span></button>
      </div>
      {selectedCount > 0 && <div className="selection-count">{cn.selected} {selectedCount} {cn.items}</div>}
    </header>
  );
}

function CanvasBoard({ nodes, onNodesChange, edges, setEdges, onEdgesChange, onAddPrompt, onSelectedChange, canvasRef, onInit }) {
  const reactFlow = useReactFlow();
  const onConnect = useCallback((connection) => setEdges((current) => addEdge({ ...connection, animated: true, style: { stroke: "#f4b860", strokeWidth: 1.5 } }, current)), [setEdges]);
  const handleAddPrompt = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const position = rect ? reactFlow.screenToFlowPosition({ x: rect.left + rect.width / 2 - 170, y: rect.top + rect.height / 2 - 120 }) : { x: 100, y: 100 };
    onAddPrompt(position);
  }, [canvasRef, onAddPrompt, reactFlow]);
  const handleSelection = useCallback(({ nodes: selected }) => onSelectedChange(selected.length), [onSelectedChange]);

  return (
    <div className="canvas-shell" ref={canvasRef}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onSelectionChange={handleSelection}
        onPaneClick={() => onSelectedChange(0)}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.1 }}
        deleteKeyCode={["Backspace", "Delete"]}
        selectionOnDrag
        panOnScroll
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
          <span className="toolbar-divider" />
          <button className="icon-button" onClick={() => reactFlow.zoomOut({ duration: 180 })} aria-label={cn.zoomOut} title={cn.zoomOut}><ZoomOut size={16} /></button>
          <button className="icon-button" onClick={() => reactFlow.fitView({ padding: 0.2, duration: 250 })} aria-label={cn.fitCanvas} title={cn.fitCanvas}><Maximize2 size={16} /></button>
          <button className="icon-button" onClick={() => reactFlow.zoomIn({ duration: 180 })} aria-label={cn.zoomIn} title={cn.zoomIn}><ZoomIn size={16} /></button>
        </div>
      </ReactFlow>
    </div>
  );
}

function SettingsView({ config, apiKeyDraft, setApiKeyDraft, onChange, onSave, onTest, onExport, onImport, onSelectProfile, onCreateProfile, onDeleteProfile, saveState, testState, importRef }) {
  const [showApiKey, setShowApiKey] = useState(false);
  return (
    <section className="settings-view page-view">
      <div className="page-heading">
        <div><span className="eyebrow"><Server size={14} /> {cn.localApiProxy}</span><h1>{cn.apiSettings}</h1><p>{cn.settingsIntro}</p></div>
        <div className="settings-state">{config.hasApiKey ? <><CheckCircle2 size={15} /> {cn.keySaved}</> : <><AlertCircle size={15} /> {cn.keyMissing}</>}</div>
      </div>
      <div className="profile-toolbar">
        <label className="field-label" htmlFor="profile-select">{cn.profile}</label>
        <div className="profile-controls">
          <select id="profile-select" value={config.activeProfileId || ""} onChange={(event) => onSelectProfile(event.target.value)}>
            {(config.profiles || []).map((profile) => <option value={profile.id} key={profile.id}>{profile.name}</option>)}
          </select>
          <button className="icon-button" onClick={onCreateProfile} aria-label={cn.newProfile} title={cn.newProfile}><Plus size={16} /></button>
          {(config.profiles || []).length > 1 && <button className="icon-button danger" onClick={onDeleteProfile} aria-label={cn.deleteProfile} title={cn.deleteProfile}><Trash2 size={16} /></button>}
        </div>
      </div>
      <div className="settings-layout">
        <div className="settings-form">
          <label className="field-label" htmlFor="profile-name">{cn.profileName}</label>
          <input id="profile-name" value={config.name || ""} onChange={(event) => onChange("name", event.target.value)} placeholder={cn.profileName} />
          <label className="field-label" htmlFor="endpoint">{cn.endpoint}</label>
          <div className="field-with-icon"><Server size={16} /><input id="endpoint" value={config.endpoint} onChange={(event) => onChange("endpoint", event.target.value)} placeholder="https://provider.example/v1" /></div>
          <p className="field-note">{cn.appendEndpoint} <code>/images/generations</code>.</p>

          <label className="field-label" htmlFor="api-key">{cn.apiKey}</label>
          <div className="field-with-icon api-key-field"><KeyRound size={16} /><input id="api-key" type={showApiKey ? "text" : "password"} value={apiKeyDraft} onChange={(event) => setApiKeyDraft(event.target.value)} placeholder={config.hasApiKey ? cn.keepSavedKey : "sk-..."} autoComplete="off" /><button type="button" className="icon-button field-toggle" onClick={() => setShowApiKey((value) => !value)} aria-label={showApiKey ? "隐藏 API Key" : "显示 API Key"} title={showApiKey ? "隐藏 API Key" : "显示 API Key"}>{showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
          <p className="field-note">{cn.keyNote}</p>

          <div className="field-grid">
            <div><label className="field-label" htmlFor="model">{cn.model}</label><input id="model" value={config.model} onChange={(event) => onChange("model", event.target.value)} placeholder="gpt-image-2" /></div>
            <div><label className="field-label" htmlFor="size">{cn.size}</label><select id="size" value={config.size} onChange={(event) => onChange("size", event.target.value)}><option value="1024x1024">1024 x 1024</option><option value="1536x1024">1536 x 1024</option><option value="1024x1536">1024 x 1536</option><option value="auto">{cn.auto}</option></select></div>
          </div>
          <label className="field-label" htmlFor="quality">{cn.quality}</label>
          <select id="quality" value={config.quality} onChange={(event) => onChange("quality", event.target.value)}><option value="high">{cn.high}</option><option value="medium">{cn.medium}</option><option value="low">{cn.low}</option><option value="auto">{cn.auto}</option></select>

          <div className="field-grid">
            <div><label className="field-label" htmlFor="save-mode">{cn.autoSaveMode}</label><select id="save-mode" value={config.autoSave === false ? "manual" : "auto"} onChange={(event) => onChange("autoSave", event.target.value === "auto")}><option value="auto">{cn.automatic}</option><option value="manual">{cn.manual}</option></select></div>
            <div><label className="field-label" htmlFor="output-dir">{cn.outputDir}</label><input id="output-dir" value={config.outputDir || ""} onChange={(event) => onChange("outputDir", event.target.value)} placeholder="output" /></div>
          </div>
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
          <div className="config-actions"><button className="toolbar-button" onClick={onExport}><Download size={16} /><span>{cn.exportJson}</span></button><button className="toolbar-button" onClick={() => importRef.current?.click()}><Upload size={16} /><span>{cn.importJson}</span></button><input ref={importRef} type="file" accept="application/json,.json" onChange={onImport} hidden /></div>
          <p className="field-note">{cn.exportWarning}</p>
        </aside>
      </div>
    </section>
  );
}

function HistoryView({ history, onAddHistoryImage, onClearHistory, onDownload }) {
  return (
    <section className="history-view page-view">
      <div className="page-heading"><div><span className="eyebrow"><Clock3 size={14} /> {cn.generations}</span><h1>{cn.history}</h1><p>{cn.historyIntro}</p></div>{history.length > 0 && <button className="toolbar-button danger" onClick={onClearHistory}><Trash2 size={16} /><span>{cn.clearHistory}</span></button>}</div>
      {history.length === 0 ? <div className="empty-state"><HistoryIcon size={30} /><strong>{cn.noGenerations}</strong><span>{cn.historyEmpty}</span></div> : <div className="history-grid">{history.map((item) => <article className="history-card" key={item.id}><div className="history-image"><img src={item.src} alt={item.prompt} /></div><div className="history-card-body"><div className="history-meta"><span>{item.model}</span><span>{formatDate(item.createdAt)}</span></div><p>{item.prompt}</p><div className="history-card-actions"><button className="small-button" onClick={() => onAddHistoryImage(item)}><Plus size={14} /> {cn.addToCanvas}</button><button className="icon-button subtle" onClick={() => onDownload(item.src, item.prompt)} aria-label={cn.downloadImage} title={cn.downloadImage}><Download size={15} /></button></div></div></article>)}</div>}
    </section>
  );
}

function AppShell() {
  const [activePanel, setActivePanel] = useState("canvas");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const handlersRef = useRef({});
  const stablePromptChange = useCallback((id, prompt) => handlersRef.current.updatePrompt?.(id, prompt), []);
  const stableReferenceChange = useCallback((id, value) => handlersRef.current.updateReference?.(id, value), []);
  const stableReferenceFiles = useCallback((id, files) => handlersRef.current.referenceFiles?.(id, files), []);
  const stableGenerate = useCallback((id) => handlersRef.current.generateImage?.(id), []);
  const stableDelete = useCallback((id) => handlersRef.current.deleteNode?.(id), []);
  const stableDownload = useCallback((src, title) => handlersRef.current.downloadImage?.(src, title), []);
  const stableOpen = useCallback((src) => handlersRef.current.openImage?.(src), []);
  const stableParamChange = useCallback((id, key, value) => handlersRef.current.updateNodeParam?.(id, key, value), []);
  const initialCanvasState = useMemo(() => loadCanvasState(), []);
  const [canvasState, setCanvasState] = useState(initialCanvasState);
  const activeCanvasId = canvasState.activeId;
  const activeCanvas = canvasState.canvases.find((canvas) => canvas.id === activeCanvasId) || canvasState.canvases[0];
  const seededNodes = useMemo(() => (activeCanvas?.nodes || []).map((node) => ({ ...node, data: { ...node.data, onPromptChange: stablePromptChange, onReferenceChange: stableReferenceChange, onReferenceFiles: stableReferenceFiles, onGenerate: stableGenerate, onDelete: stableDelete, onParamChange: stableParamChange } })), [activeCanvasId, stableDelete, stableGenerate, stableParamChange, stablePromptChange, stableReferenceChange, stableReferenceFiles]);
  const [nodes, setNodes, onNodesChange] = useNodesState(seededNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(activeCanvas?.edges || []);
  const [config, setConfig] = useState({ activeProfileId: "default", profiles: [{ id: "default", name: "默认配置", endpoint: "https://api.openai.com/v1", model: "gpt-image-2", size: "1024x1024", quality: "high", autoSave: true, outputDir: "output", hasApiKey: false }], id: "default", name: "默认配置", endpoint: "https://api.openai.com/v1", model: "gpt-image-2", size: "1024x1024", quality: "high", autoSave: true, outputDir: "output", hasApiKey: false });
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
  });
  const [saveState, setSaveState] = useState("idle");
  const [testState, setTestState] = useState("idle");
  const [toast, setToast] = useState("");
  const [selectedCount, setSelectedCount] = useState(0);
  const [flowInstance, setFlowInstance] = useState(null);
  const canvasRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => { fetch("/api/config").then((response) => response.json()).then((value) => setConfig((current) => ({ ...current, ...value }))).catch(() => setToast(cn.localServerMissing)); }, []);
  useEffect(() => { if (!toast) return undefined; const timer = window.setTimeout(() => setToast(""), 3600); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => {
    setCanvasState((current) => ({
      ...current,
      canvases: current.canvases.map((canvas) => canvas.id === activeCanvasId ? { ...canvas, nodes, edges, updatedAt: new Date().toISOString() } : canvas)
    }));
  }, [activeCanvasId, edges, nodes]);
  useEffect(() => {
    try { localStorage.setItem(CANVASES_KEY, JSON.stringify(canvasState)); } catch { /* Keep the current session usable if storage is full. */ }
  }, [canvasState]);

  const updateNodeData = useCallback((id, patch) => setNodes((current) => current.map((node) => node.id === id ? { ...node, data: { ...node.data, ...patch } } : node)), [setNodes]);
  const updatePrompt = useCallback((id, prompt) => updateNodeData(id, { prompt: prompt.slice(0, 4000), status: "idle", error: "" }), [updateNodeData]);
  const updateReference = useCallback((id, referenceImages) => {
    const images = (Array.isArray(referenceImages) ? referenceImages : []).filter(Boolean).slice(0, 5);
    updateNodeData(id, { referenceImages: images, referenceImage: images[0] || "", status: "idle", error: "" });
  }, [updateNodeData]);
  const referenceFiles = useCallback((id, files) => {
    const imageFiles = (Array.isArray(files) ? files : []).filter((file) => file?.type?.startsWith("image/"));
    if (!imageFiles.length) return;
    const source = nodes.find((node) => node.id === id);
    const existing = Array.isArray(source?.data?.referenceImages) ? source.data.referenceImages : (source?.data?.referenceImage ? [source.data.referenceImage] : []);
    const readFile = (file) => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = reject; reader.readAsDataURL(file); });
    Promise.all(imageFiles.slice(0, Math.max(0, 5 - existing.length)).map(readFile)).then((images) => updateReference(id, [...existing, ...images])).catch(() => undefined);
  }, [nodes, updateReference]);
  const updateNodeParam = useCallback((id, key, value) => updateNodeData(id, { [key]: value, status: "idle", error: "" }), [updateNodeData]);
  const deleteNode = useCallback((id) => { setNodes((current) => current.filter((node) => node.id !== id)); setEdges((current) => current.filter((edge) => edge.source !== id && edge.target !== id)); }, [setEdges, setNodes]);

  const downloadImage = useCallback(async (src, prompt = "ai-canvas-image") => {
    try {
      const response = src.startsWith("data:") ? await fetch(src) : await fetch(`/api/image-proxy?url=${encodeURIComponent(src)}`);
      if (!response.ok) throw new Error("download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${String(prompt).slice(0, 36).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "ai-canvas-image"}.png`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    } catch { setToast(cn.downloadFailed); }
  }, []);

  const openImage = useCallback((src) => window.open(src, "_blank", "noopener,noreferrer"), []);
  const appendHistory = useCallback((item) => setHistory((current) => { const next = [item, ...current.filter((entry) => entry.id !== item.id)].slice(0, 50); localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); return next; }), []);

  const generateImage = useCallback(async (id) => {
    const source = nodes.find((node) => node.id === id);
    const prompt = String(source?.data?.prompt || "").trim();
    if (!source || !prompt) return;
    updateNodeData(id, { status: "generating", error: "" });
    try {
      const model = String(source.data.model || config.model).trim();
      const size = String(source.data.size || config.size).trim();
      const quality = String(source.data.quality || config.quality).trim();
      const referenceImages = Array.isArray(source.data.referenceImages) ? source.data.referenceImages : (source.data.referenceImage ? [source.data.referenceImage] : []);
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, model, size, quality, referenceImages }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.imageUrl) throw new Error(result.error || cn.generationFailed);
      const imageId = `image-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const item = { id: imageId, src: result.imageUrl, prompt, model, size, createdAt, savedPath: result.savedPath || "" };
      const imageNode = { id: imageId, type: "image", position: { x: source.position.x + 430, y: source.position.y + 12 }, style: { width: 360 }, data: { ...item, title: prompt, onDelete: stableDelete, onDownload: stableDownload, onOpen: stableOpen } };
      setNodes((current) => [...current, imageNode]);
      setEdges((current) => [...current, { id: `edge-${id}-${imageId}`, source: id, target: imageId, animated: true, style: { stroke: "#f4b860", strokeWidth: 1.5 } }]);
      appendHistory(item);
      updateNodeData(id, { status: "success", error: "" });
      setToast(result.savedPath ? `${cn.imageAddedToast} ${cn.autoSaved} ${result.savedPath}` : cn.imageAddedToast);
    } catch (error) {
      updateNodeData(id, { status: "error", error: error.message || cn.generationFailed });
    }
  }, [appendHistory, config.model, config.quality, config.size, nodes, setEdges, setNodes, stableDelete, stableDownload, stableOpen, updateNodeData]);

  const addPromptAt = useCallback((position) => {
    const id = `prompt-${Date.now()}`;
    setNodes((current) => [...current, { id, type: "prompt", position, data: { prompt: "", referenceImages: [], status: "idle", error: "", model: config.model, size: config.size, quality: config.quality, onPromptChange: stablePromptChange, onReferenceChange: stableReferenceChange, onReferenceFiles: stableReferenceFiles, onGenerate: stableGenerate, onDelete: stableDelete, onParamChange: stableParamChange } }]);
    setActivePanel("canvas");
  }, [config.model, config.quality, config.size, setNodes, stableDelete, stableGenerate, stableParamChange, stablePromptChange, stableReferenceChange, stableReferenceFiles]);

  const addPrompt = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const position = flowInstance && rect ? flowInstance.screenToFlowPosition({ x: rect.left + rect.width / 2 - 170, y: rect.top + rect.height / 2 - 120 }) : { x: 160 + nodes.length * 36, y: 150 + nodes.length * 28 };
    addPromptAt(position);
  }, [addPromptAt, flowInstance, nodes.length]);

  handlersRef.current = { updatePrompt, updateReference, referenceFiles, updateNodeParam, generateImage, deleteNode, downloadImage, openImage };

  const selectCanvas = useCallback((canvasId) => {
    if (canvasId === activeCanvasId) return;
    const next = canvasState.canvases.find((canvas) => canvas.id === canvasId);
    if (!next) return;
    setCanvasState((current) => ({ ...current, activeId: canvasId }));
    setNodes(next.nodes.map((node) => ({ ...node, data: { ...node.data, onPromptChange: stablePromptChange, onReferenceChange: stableReferenceChange, onReferenceFiles: stableReferenceFiles, onGenerate: stableGenerate, onDelete: stableDelete, onParamChange: stableParamChange } })));
    setEdges(next.edges || []);
    setActivePanel("canvas");
  }, [activeCanvasId, canvasState.canvases, setEdges, setNodes, stableDelete, stableGenerate, stableParamChange, stablePromptChange, stableReferenceChange, stableReferenceFiles]);

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
      setNodes(nextActive.nodes.map((node) => ({ ...node, data: { ...node.data, onPromptChange: stablePromptChange, onReferenceChange: stableReferenceChange, onReferenceFiles: stableReferenceFiles, onGenerate: stableGenerate, onDelete: stableDelete, onParamChange: stableParamChange } })));
      setEdges(nextActive.edges || []);
    }
    setActivePanel("canvas");
  }, [activeCanvasId, canvasState.canvases, setEdges, setNodes, stableDelete, stableGenerate, stableParamChange, stablePromptChange, stableReferenceChange, stableReferenceFiles]);

  const saveSettings = useCallback(async () => {
    setSaveState("saving");
    try {
      const response = await fetch("/api/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profileId: config.activeProfileId, name: config.name, endpoint: config.endpoint, model: config.model, size: config.size, quality: config.quality, autoSave: config.autoSave, outputDir: config.outputDir, apiKey: apiKeyDraft.trim() || undefined }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || cn.saveFailed);
      setConfig((current) => ({ ...current, ...result.config })); setApiKeyDraft(""); setSaveState("saved");
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

  const testConnection = useCallback(async () => {
    setTestState("testing");
    try {
      const response = await fetch("/api/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: config.endpoint, apiKey: apiKeyDraft.trim() || undefined }) });
      if (!response.ok) throw new Error("connection failed");
      setTestState("success");
    } catch { setTestState("error"); }
  }, [apiKeyDraft, config.endpoint]);

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
    setNodes((current) => [...current, { id, type: "image", position, style: { width: 360 }, data: { ...item, id, title: item.prompt, onDelete: stableDelete, onDownload: stableDownload, onOpen: stableOpen } }]);
    setActivePanel("canvas");
  }, [flowInstance, setNodes, stableDelete, stableDownload, stableOpen]);

  const clearHistory = useCallback(() => { setHistory([]); localStorage.removeItem(HISTORY_KEY); }, []);
  const handleZoomIn = useCallback(() => flowInstance?.zoomIn({ duration: 180 }), [flowInstance]);
  const handleZoomOut = useCallback(() => flowInstance?.zoomOut({ duration: 180 }), [flowInstance]);
  const handleFitView = useCallback(() => flowInstance?.fitView({ padding: 0.2, duration: 250 }), [flowInstance]);

  const visibleNodeCount = nodes.length;
  const view = activePanel === "settings" ? <SettingsView config={config} apiKeyDraft={apiKeyDraft} setApiKeyDraft={setApiKeyDraft} onChange={(key, value) => { setConfig((current) => ({ ...current, [key]: value })); setSaveState("idle"); setTestState("idle"); }} onSelectProfile={selectProfile} onCreateProfile={createProfile} onDeleteProfile={deleteProfile} onSave={saveSettings} onTest={testConnection} onExport={exportConfig} onImport={importConfig} saveState={saveState} testState={testState} importRef={importRef} /> : activePanel === "history" ? <HistoryView history={history} onAddHistoryImage={addHistoryImage} onClearHistory={clearHistory} onDownload={downloadImage} /> : <>
    <Topbar onFitView={handleFitView} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onOpenSettings={() => setActivePanel("settings")} selectedCount={selectedCount} />
    <CanvasBoard nodes={nodes} onNodesChange={onNodesChange} edges={edges} setEdges={setEdges} onEdgesChange={onEdgesChange} onAddPrompt={addPromptAt} onSelectedChange={setSelectedCount} canvasRef={canvasRef} onInit={setFlowInstance} />
  </>;

  return <div className="app-frame"><Sidebar activePanel={activePanel} setActivePanel={setActivePanel} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} canvases={canvasState.canvases} activeCanvasId={activeCanvasId} onSelectCanvas={selectCanvas} onCreateCanvas={createCanvas} onDeleteCanvas={deleteCanvas} onRenameCanvas={renameCanvas} nodeCount={visibleNodeCount} historyCount={history.length} /><main className="main-area">{view}</main>{toast && <div className="toast"><CheckCircle2 size={16} />{toast}<button className="icon-button subtle" onClick={() => setToast("")} aria-label={cn.dismiss}><X size={14} /></button></div>}</div>;
}

export default function App() {
  return <ReactFlowProvider><AppShell /></ReactFlowProvider>;
}
