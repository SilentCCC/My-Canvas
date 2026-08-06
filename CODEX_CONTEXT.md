# CODEX_CONTEXT.md

> 本文件是给 AI 开发助手阅读的项目记忆文件，不是普通用户说明文档。  
> 新电脑、重新打开项目、或长时间中断后继续开发时，请优先阅读本文件。

## 项目基本信息

- 项目名称：AI Canvas / My-Canvas
- 项目目标：开发一个本地运行的 AI 无限画布工具，用节点化方式组织 Prompt、图片、图片编组和图片生成流程。
- 项目用途：
  - 管理多个 AI 图片生成 API 配置。
  - 在无限画布中拖拽、连接和组织 Prompt 与图片。
  - 支持文生图、图生图、多参考图、图片编组批量生成。
  - 方便通过 GitHub 在不同电脑之间迁移开发状态。
- 当前技术栈：
  - 前端：React 18、Vite、@xyflow/react、lucide-react
  - 后端：Node.js、Express
  - 存储：
    - API 配置：`server/config.json`（本地私密文件，Git 忽略）
    - 配置模板：`server/config.example.json`
    - 画布状态：浏览器 `localStorage`
    - 生成历史：浏览器 `localStorage`
    - 自动保存图片：配置中的 `outputDir`
  - Git 分支：`main`
  - 远程仓库：`https://github.com/SilentCCC/My-Canvas.git`

## 当前开发状态

- 当前版本号：
  - `package.json`：`0.1.0`
  - 开发上下文版本：`0.1.0-dev.2026-08-07`

### 已完成的功能

- 本地 Express 服务与 Vite 前端构建。
- 默认服务端口改为 `6000`。
- 启动脚本 `start.bat` 支持自动安装依赖、构建并打开 `http://localhost:6000`。
- API 设置页：
  - 多 API 配置档管理。
  - 支持新建、切换、删除配置档。
  - 左侧菜单显示已保存的 API 配置档，例如 API1、API2。
  - API Key 保存后不回传浏览器。
  - 已保存 API Key 在输入框中显示 `****************` 掩码。
  - API Key 输入框支持眼睛图标切换当前草稿明文/隐藏。
  - 支持导入/导出 JSON 配置。
  - 自动保存输出目录配置。
- Prompt 节点：
  - 编辑 Prompt。
  - 节点内可选择 API 配置档，直接显示 API1/API2/API3，不显示“当前 API”占位项。
  - 可设置模型、尺寸、质量。
  - 支持多参考图上传，最多 5 张。
  - 支持从电脑拖入参考图。
  - 支持删除单张参考图。
  - 自定义尺寸使用两个数字输入框，中间固定显示乘号 `×`。
- 尺寸选项：
  - `1024 x 1024 (1:1)`
  - `1536 x 1024 (3:2)`
  - `1024 x 1536 (2:3)`
  - `1536 x 864 (16:9)`
  - `864 x 1536 (9:16)`
  - 自定义尺寸
  - 自动
- 图片节点：
  - 生成后自动添加到画布。
  - 支持拖动、缩放、打开、下载、删除。
  - 双击图片可放大预览。
  - 点击图片会在下方自动创建 Prompt 节点。
  - 图片创建的下方 Prompt 会与图片自动连线绑定。
  - 图片创建的下方 Prompt 会自动把该图片作为参考图输入。
- 图片拖入画布：
  - 可从电脑直接拖入图片到工作区任意位置。
  - 自动创建图片节点。
  - 点击图片节点可生成绑定 Prompt。
- 图片编组节点（Image Group Node）：
  - 可创建特殊方框节点作为图片容器。
  - 支持从电脑拖入多张图片到编组内部。
  - 支持点击选择多张图片。
  - 支持删除编组内单张图片。
  - 编组节点右侧有连接句柄。
  - 点击编组节点会在下方创建 Prompt 节点并自动连线。
  - 编组连接到 Prompt 后，执行 Prompt 会将组内每张图片分别作为输入，自动创建多个生成任务和结果节点。
- 生成日志：
  - 顶部工具栏增加日志按钮。
  - 弹出悬浮框显示每次生成的成功/失败、Prompt、服务端返回文本。
  - 日志中会省略大型 base64 图片数据，避免页面变慢。
- 画布管理：
  - 支持多个画布。
  - 支持新建画布。
  - 支持删除画布，至少保留一个画布。
  - 支持画布重命名，画布列表右侧有铅笔图标。
- 画布交互：
  - 鼠标滚轮已改为缩放工作区。
  - 平移、缩放、拖动节点、连线、删除节点可用。
- Git 迁移：
  - 已初始化 Git 仓库。
  - 当前远程为 GitHub：`origin/main`
  - `.gitignore` 已排除 `node_modules/`、`.npm-cache/`、`web/dist/`、`output/`、`server/config.json` 等本地/敏感文件。
  - 首次安全提交已推送到 GitHub，后续功能修改尚未提交。

### 正在开发的功能

- 图片编组节点与 Prompt 的批量图生图工作流仍需继续手工测试。
- 图片节点/编组节点生成的绑定 Prompt 需要继续验证连线、输入图片和批量输出位置是否符合实际使用习惯。
- 生成日志只记录当前会话内日志，刷新页面后会清空。

### 未完成的功能

- 没有持久化生成日志。
- 没有画布导入/导出整体项目文件。
- 没有对自定义尺寸做服务商能力校验；服务商不支持时会由 API 返回错误。
- 图片组批量生成目前是并行请求，尚未提供队列、暂停、重试或进度条。
- 图片节点和图片组节点的下方 Prompt 绑定关系目前通过连线和 `sourceNodeId` 记录，尚未做复杂同步，例如移动父节点时自动移动子 Prompt。
- 未做浏览器自动化 UI 回归测试。

## 最近开发记录

### 2026-08-07

- 修改内容：创建 `CODEX_CONTEXT.md` 项目记忆文件。
- 涉及文件：
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 为以后换电脑、重新打开项目、或让 Codex 接续开发提供项目上下文。
  - 明确记录当前功能状态、已知问题、开发规范和下一步计划。

### 2026-08-07

- 修改内容：实现图片编组节点（Image Group Node）。
- 涉及文件：
  - `web/src/App.jsx`
  - `web/src/styles.css`
- 解决的问题：
  - 可将多张图片拖入一个编组容器。
  - 编组连接 Prompt 后可将组内图片批量作为图生图输入。
  - 点击编组节点可在下方生成并绑定 Prompt。

### 2026-08-07

- 修改内容：图片节点点击后生成绑定 Prompt，滚轮改为缩放工作区。
- 涉及文件：
  - `web/src/App.jsx`
- 解决的问题：
  - 图片生成的 Prompt 与图片自动连线。
  - 图片作为参考图自动进入下方 Prompt。
  - 鼠标滚轮从上下滑动改为缩放画布。

### 2026-08-07

- 修改内容：增加生成日志、图片双击放大、API Key 掩码。
- 涉及文件：
  - `web/src/App.jsx`
  - `web/src/styles.css`
  - `server/server.js`
- 解决的问题：
  - 用户可以查看每次生成的 API 返回文本。
  - 图片可双击放大预览。
  - 保存后的 API Key 显示为 `****************`，避免误以为没有保存。

### 2026-08-07

- 修改内容：设置页左侧增加 API 配置菜单。
- 涉及文件：
  - `web/src/App.jsx`
  - `web/src/styles.css`
- 解决的问题：
  - 已保存的 API1、API2 可在设置页左侧菜单中直接切换。

### 2026-08-07

- 修改内容：默认端口改为 `6000`，新增尺寸选项和自定义尺寸。
- 涉及文件：
  - `server/server.js`
  - `web/vite.config.js`
  - `start.bat`
  - `README.md`
  - `web/src/App.jsx`
  - `web/src/styles.css`
- 解决的问题：
  - 默认访问地址统一为 `http://localhost:6000`。
  - 支持 `1536x864`、`864x1536` 和自定义宽高。

### 2026-08-06

- 修改内容：初始化 Git，清理敏感文件和依赖缓存后推送 GitHub。
- 涉及文件：
  - `.gitignore`
  - `server/config.example.json`
- 解决的问题：
  - 避免 API Key、`node_modules`、`.npm-cache`、构建产物进入远程仓库。
  - 项目可通过 GitHub 安全迁移。

## 当前问题和已知 Bug

- `server/config.json` 是本地私密文件，Git 忽略；换电脑后会自动生成空配置，但需要用户重新填写 API Key。
- 生成日志当前只保存在 React 状态中，刷新页面会丢失。
- 图片组批量生成并行请求数量等于组内图片数量，图片很多时可能触发服务商限流。
- 自定义尺寸没有前端校验服务商是否支持。
- 图片/编组节点生成的绑定 Prompt 不会跟随父节点移动。
- 浏览器本地存储保存图片 data URL，图片过多时可能导致 localStorage 过大或保存失败。
- 尚未加入自动化测试，主要依靠 `npm.cmd run build` 和手工浏览器验证。
- 当前工作区有未提交修改；继续开发前建议先查看 `git status`。

## 下一步开发计划

按优先级：

1. 提交当前已完成的重要功能
   - 功能需求描述：将最近的端口、尺寸、日志、图片编组、绑定 Prompt 等改动提交到 GitHub。
   - 实现注意事项：提交前检查 `server/config.json` 未被暂存，运行 `npm.cmd run build`。

2. 优化图片组批量生成
   - 功能需求描述：增加队列、进度、失败重试和并发数量限制。
   - 实现注意事项：不要一次性无限并发；建议加入每组最多并发 2-3 个任务。

3. 优化节点绑定体验
   - 功能需求描述：父图片/图片组移动时，下方绑定 Prompt 可选择跟随移动。
   - 实现注意事项：避免破坏 React Flow 的节点拖动状态；优先通过显式关系字段实现。

4. 持久化生成日志
   - 功能需求描述：刷新页面后仍可查看最近生成日志。
   - 实现注意事项：日志中必须继续省略 base64；只保存文本摘要。

5. 增加画布导入/导出
   - 功能需求描述：导出当前画布 JSON，换浏览器或电脑后可导入恢复。
   - 实现注意事项：如果包含图片 data URL，文件可能很大；需要提示用户。

6. 增加 UI 回归测试
   - 功能需求描述：用浏览器自动化检查页面不黑屏、设置页菜单存在、画布可以创建节点。
   - 实现注意事项：当前项目未安装 Playwright；如要安装需确认依赖策略。

## 项目结构说明

- `package.json`
  - 项目脚本和依赖声明。
  - 常用脚本：
    - `npm.cmd run build`
    - `npm.cmd run server`
    - `npm.cmd run dev`
- `package-lock.json`
  - npm 依赖锁定文件。
- `README.md`
  - 面向用户的简要启动说明。
- `start.bat`
  - Windows 一键启动脚本。
  - 自动安装依赖、构建前端、启动本地服务并打开浏览器。
- `server/server.js`
  - Express 后端入口。
  - 提供静态文件服务、API 配置读写、连接测试、图片生成代理、图片代理、自动保存图片。
  - `/api/generate` 同时支持文生图和图生图。
  - 图生图使用 OpenAI 兼容的 `/images/edits` multipart 请求。
- `server/config.json`
  - 本地真实 API 配置文件。
  - 包含 API Key。
  - Git 忽略，不应提交。
- `server/config.example.json`
  - 可提交的配置模板，不含密钥。
- `web/index.html`
  - Vite 前端 HTML 入口。
- `web/vite.config.js`
  - Vite 配置。
  - 开发代理指向 `http://localhost:6000`。
- `web/src/main.jsx`
  - React 挂载入口。
- `web/src/App.jsx`
  - 当前最核心文件。
  - 包含主要 React 状态、节点类型、画布、设置页、历史记录、日志弹窗、图片预览和生成逻辑。
- `web/src/styles.css`
  - 全局 UI 样式、节点样式、设置页、弹窗、响应式布局。
- `web/dist/`
  - 构建产物。
  - Git 忽略。
- `node_modules/`
  - npm 安装依赖。
  - Git 忽略。
- `.npm-cache/`
  - npm 缓存目录。
  - Git 忽略。
- `.gitignore`
  - 排除依赖、缓存、构建产物、输出文件和本地密钥配置。

## 技术环境

- 操作系统：Windows（当前路径为 `G:\codex\Canvas`）
- Shell：PowerShell
- Node 版本：`v24.18.0`
- npm 版本：`11.16.0`
- Python 版本：当前 shell 中不可用/无法访问，项目正常开发不依赖 Python。
- 依赖环境：
  - React
  - Vite
  - Express
  - @xyflow/react
  - lucide-react
- 安装命令：
  - `npm.cmd install`
- 构建命令：
  - `npm.cmd run build`
- 启动方式：
  - 推荐：双击 `start.bat`
  - 手动：
    1. `npm.cmd install`
    2. `npm.cmd run build`
    3. `npm.cmd run server`
    4. 打开 `http://localhost:6000`
- 开发模式：
  - 后端：`npm.cmd run server`
  - 前端：`npm.cmd run dev`
  - Vite 开发端口默认 `5173`，API 代理到 `6000`。
- Git 上传常用命令：
  - `git status`
  - `git add .`
  - `git commit -m "描述这次修改"`
  - `git push`

## 开发规范

- 不要随意重构现有架构。
- 修改前先理解现有代码逻辑。
- 新功能优先模块化，但不要为小功能过度抽象。
- 保持已有功能稳定。
- 每次修改后至少运行 `npm.cmd run build`。
- 涉及服务端修改时运行 `node --check server/server.js`。
- 不要提交 `server/config.json`、`node_modules/`、`.npm-cache/`、`web/dist/`。
- API Key 永远不要写入仓库或日志。
- 生成日志中不要保存完整 base64 图片数据。
- 前端状态主要集中在 `web/src/App.jsx`，修改时注意 hook 依赖和初始化顺序，避免黑屏。
- React Flow 节点类型新增时，需要同步：
  - 节点组件
  - `nodeTypes`
  - 节点创建函数
  - 画布切换/加载时的 handler 注入
  - 样式文件
- 图片/Prompt/图片组之间的关系优先通过 React Flow edge 和节点 data 字段记录，不要只靠视觉位置推断。

## AI 继续开发提示

继续开发前，请先阅读：
1. CODEX_CONTEXT.md
2. README.md
3. package.json

理解当前项目状态后再修改代码。

不要删除已有功能，不要大范围重构，除非明确要求。

## CODEX_CONTEXT.md 维护规则

以后每完成一个重要功能，请自动更新 `CODEX_CONTEXT.md`：

1. 更新当前版本。
2. 更新已完成列表。
3. 更新最近修改记录。
4. 更新下一步计划。
5. 提供建议的 git commit 信息。

建议的 git commit 信息格式：

```text
feat: 描述新增功能
fix: 描述修复问题
docs: 更新项目上下文
```

当前建议提交信息：

```text
docs: add Codex project context
```

