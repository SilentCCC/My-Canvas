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
  - 统一版本：`V1.0.23`
  - `package.json` / `package-lock.json`：`1.0.23`
  - README 显示版本：`V1.0.23`
  - 版本规则：每次代码功能或行为修改时，必须递增补丁版本号；例如 `V1.0.23` 修改后为 `V1.0.24`。同步更新 `package.json`、`package-lock.json`、README、`CHANGELOG.md` 和本文件。仅补充或修正 `CHANGELOG.md` 时不递增版本号。

### 已完成的功能

- 本地 Express 服务与 Vite 前端构建。
- 默认服务端口为 `8000`。
- 根目录 `settings.json` 是端口的唯一配置来源；服务端、Vite API 代理和 `start.bat` 都读取其中的 `port`。
- 启动脚本 `start.bat` 支持自动安装依赖、构建并打开 `http://localhost:8000`。
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
  - 可设置模型、分辨率等级、比例尺寸和质量。
  - 默认窗口已加宽，API、模型、分辨率、比例和质量等参数可完整显示。
  - 选中节点后可拖动右下角缩放手柄，自由调整窗口宽高。
  - 参数选择区与生成按钮之间保留更大间距，降低误触风险。
  - 新建 Prompt 节点默认使用正方形宽高。
  - 点击生成后会立即在节点右侧创建图片占位框，API 返回后在原位置显示生成图片。
  - 页面刷新或服务重启后，遗留的“生成中”Prompt 会自动恢复为可生成状态，不会永久锁住生成按钮。
  - 生成中的 Prompt 右上角提供重置图标，可手动解除异常锁定状态。
  - 支持多参考图上传，最多 5 张。
  - 支持从电脑拖入参考图。
  - 支持删除单张参考图。
  - 获取模型后可在 API 设置页逐个高亮模型；Prompt 节点只显示当前配置档已高亮的模型。
  - 生成按钮在已有任务进行时仍可点击，同一个 Prompt 支持并发生成多批图片。
- 图片尺寸选择：
  - 设置页和 Prompt 节点均使用联动的“分辨率等级 + 比例”选择框。
  - image2 和 Gemini 的尺寸菜单顺序为 `auto`、`1K`、`2K`、`4K`；Grok 菜单为 `auto`、`1K`、`2K`。选择 `auto` 后隐藏比例/具体尺寸选择框；image2/Gemini 发送 `size: "auto"`，Grok 发送 `aspect_ratio: "auto"` 且不发送 `resolution`。
  - GPT image2 和 Gemini 保持原有尺寸行为，生成 API 发送最终的 `size`。
  - Grok Imagine 使用独立尺寸配置，只提供官方支持的比例及 `1K`、`2K`，生成 API 发送 `aspect_ratio` 与小写的 `resolution`。
  - 选择数据保存为 `resolution`、`ratio`、`width`、`height`、`size`；请求信息窗口按模型显示实际发送的尺寸字段。
  - 尺寸映射独立维护在 `web/src/config/imageSizes.js`。
  - 非 Grok 模型的 Prompt 节点支持“自定义”分辨率，宽高输入范围为 `1` 到 `16384`，请求会发送最终的 `宽x高` 尺寸。
- 图片节点：
  - 生成后自动添加到画布。
  - 支持拖动、缩放、打开、下载、删除。
  - 双击图片可放大预览。
  - 放大预览支持鼠标滚轮缩放，图生图结果支持原图/生成图分割对比，分割线可跟随光标移动。
  - 图片框右下角有叹号信息图标，悬停可查看临时 URL、下载方式、文件大小、实际尺寸、模型和质量。
  - 信息悬浮卡中的文本支持光标拖选和复制。
  - 即使生成失败或没有图片 URL，叹号图标仍显示；失败状态会额外显示错误原因。
  - 第三方 API 返回远程图片 URL 时，画布通过本地图片代理加载，减少图片域名限制导致的显示失败。
  - 第三方响应体采用分块传输时，读取到完整 JSON 即回填，不强制等待连接关闭。
  - 流式响应包含多条 JSON 时，会继续读取后续事件，不会停在第一条“排队/处理中”状态。
  - 点击图片会在下方自动创建 Prompt 节点。
  - 图片创建的下方 Prompt 会与图片自动连线绑定。
  - 图片创建的下方 Prompt 会自动把该图片作为参考图输入。
- 图片拖入画布：
  - 可从电脑直接拖入图片到工作区任意位置。
  - 支持在画布中使用 `Ctrl+V` 粘贴剪贴板图片。
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
  - 默认窗口已加宽，选中后可拖动右下角缩放手柄自由调整宽高。
  - 新建图片编组节点默认使用正方形宽高。
- 生成日志：
  - 顶部工具栏增加日志按钮。
  - 弹出悬浮框显示每次生成的成功/失败、Prompt、服务端返回文本。
  - 日志中会省略大型 base64 图片数据，避免页面变慢。
- 图片生成超时：
  - 本地服务调用图片 API 最多等待 `180` 秒。
  - 超时后中止 API 请求并返回 `504`，对应图片框会显示“图片生成超时（180 秒）”。
  - 图片生成中的占位框右上角每秒显示当前等待时长，格式为 `等待 00:12`。
  - 浏览器端也有独立的 `180` 秒中止保护，避免旧服务、网络挂起或页面恢复后任务持续等待。
- 画布管理：
  - 支持多个画布。
  - 支持新建画布。
  - 支持删除画布，至少保留一个画布。
  - 支持画布重命名，画布列表右侧有铅笔图标。
- 画布交互：
  - 鼠标滚轮已改为缩放工作区。
  - 平移、缩放、拖动节点、连线、删除节点可用。
  - 页面从待机或后台恢复时会触发画布重绘；渲染异常时显示重新加载界面、错误消息和组件堆栈，避免只剩黑屏。
- 存储容错：
  - 生成历史写入 `localStorage` 失败时会从最旧记录开始裁剪，避免 Base64 图片超出浏览器配额导致画布崩溃。
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
- 图片组批量生成目前是并行请求，尚未提供队列、暂停、重试或进度条；普通 Prompt 已支持重复点击并发生成。
- 图片节点和图片组节点的下方 Prompt 绑定关系目前通过连线和 `sourceNodeId` 记录，尚未做复杂同步，例如移动父节点时自动移动子 Prompt。
- 未做浏览器自动化 UI 回归测试。

## 最近开发记录

### 2026-08-07

- 修改内容：修复第三方响应体读取导致的 180 秒延迟。
- 涉及文件：
  - `server/server.js`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 180 秒超时现在覆盖响应头和响应体读取，不会因 `response.text()` 脱离计时器而继续挂起。
  - 分块或 SSE 响应读到完整 JSON 后立即返回给画布，第三方约 30 秒完成时可及时显示图片。

### 2026-08-07

- 修改内容：优化第三方图片生成结果回填和远程图片加载。
- 涉及文件：
  - `server/server.js`
  - `web/src/App.jsx`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 扩展 OpenAI 兼容 API 的图片 URL/base64 响应字段识别，支持更多第三方返回结构。
  - 远程图片自动保存改为后台执行，避免保存下载阻塞已成功生成图片回填到画布。
  - 远程图片通过本地代理显示，避免浏览器直接加载第三方 URL 失败。

### 2026-08-07

- 修改内容：修复失败图片框不显示叹号和信息的问题。
- 涉及文件：
  - `web/src/App.jsx`
  - `web/src/styles.css`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 图片信息入口不再依赖图片 URL，生成中、成功、失败状态均可查看。
  - 失败状态使用红色叹号，并在悬浮卡中增加具体错误信息。

### 2026-08-07

- 修改内容：在生成图片框右下角增加图片信息悬浮卡。
- 涉及文件：
  - `web/src/App.jsx`
  - `web/src/styles.css`
  - `server/server.js`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 悬停叹号图标即可查看临时 URL、下载方式、文件大小、实际尺寸、模型和质量。
  - 实际尺寸由图片加载后的自然宽高读取；自动保存图片时由服务端返回真实字节数。

### 2026-08-07

- 修改内容：修复待机恢复黑屏风险，并补充前端图片生成超时保护。
- 涉及文件：
  - `web/src/App.jsx`
  - `web/src/styles.css`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 浏览器端在 `180` 秒后主动中止仍未完成的生成请求，并显示超时错误。
  - 页面重新获得焦点时刷新 React Flow 视图；发生渲染异常时提供重新加载入口。
  - 已启动本地服务并通过 `/api/health` 健康检查。

### 2026-08-07

- 修改内容：在生成图片框右上角增加实时等待计时。
- 涉及文件：
  - `web/src/App.jsx`
  - `web/src/styles.css`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 用户可以直接看到当前图片任务已经等待的时间。
  - 生成成功或失败后计时器自动停止，避免继续累加。

### 2026-08-07

- 修改内容：增加图片生成的 180 秒服务端超时控制。
- 涉及文件：
  - `server/server.js`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 图片 API 长时间无响应时会在 180 秒后停止等待。
  - 超时会返回明确的 `504` 错误，并由前端在对应图片框中显示。

### 2026-08-07

- 修改内容：调整新节点默认比例，并增加生成图片占位框与结果回填。
- 涉及文件：
  - `web/src/App.jsx`
  - `web/src/styles.css`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 新建 Prompt 和图片编组节点初始宽高改为正方形。
  - 点击生成后立即在 Prompt 右侧显示图片框，生成成功后将图片回填到同一框内。
  - 图片编组批量生成会按照任务数量创建对应的多个图片框；失败任务在对应框中显示错误。

### 2026-08-07

- 修改内容：修复 Prompt/图片编组节点缩放手柄无法拖动的问题。
- 涉及文件：
  - `web/src/App.jsx`
  - `web/src/styles.css`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - Prompt 和图片编组内部根元素改为填充 React Flow 外层节点尺寸，缩放后视觉尺寸同步变化。
  - 为新建及绑定 Prompt、图片编组节点提供初始宽高，避免固定 CSS 尺寸阻止调整。
  - 显式传入 `nodeId`，并提高缩放控制层级、启用指针事件，确保右下角手柄可长按拖动。

### 2026-08-07

- 修改内容：优化 Prompt 节点和图片编组节点的窗口尺寸与缩放交互。
- 涉及文件：
  - `web/src/App.jsx`
  - `web/src/styles.css`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 加宽 Prompt 节点并重新分配参数列宽，完整显示 API、模型、分辨率、比例和质量信息。
  - 为 Prompt 节点和图片编组节点增加醒目的右下角缩放标识，可拖动自由调整窗口宽高。
  - 增加参数选择区与生成按钮的间距，降低误触生成按钮的概率。

### 2026-08-07

- 修改内容：重构图片生成尺寸选择为联动的分辨率和比例选择框。
- 涉及文件：
  - `web/src/config/imageSizes.js`
  - `web/src/App.jsx`
  - `web/src/styles.css`
  - `server/server.js`
  - `server/config.example.json`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 可在 `1K`、`2K`、`4K` 间切换，同时保持用户选定比例并更新实际像素尺寸。
  - Prompt 节点和 API 配置档保存完整的尺寸选择数据，旧画布的 `size` 数据仍可识别。
  - GPT-image-2 请求继续仅发送最终 `size`，例如 `3072x1728`。

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
- 图片/编组节点生成的绑定 Prompt 不会跟随父节点移动。
- 浏览器本地存储保存图片 data URL，图片过多时可能导致 localStorage 过大或保存失败。
- 尚未加入自动化测试，主要依靠 `npm.cmd run build` 和手工浏览器验证。
- 当前工作区有未提交修改；继续开发前建议先查看 `git status`。
- 当前 API1（`img.yunfei.best`）可能采用异步任务协议：若最终响应只包含任务 ID、状态或查询地址而不包含图片 URL/Base64，需要按该服务商文档实现专用查询接口；不能安全地猜测轮询路径。
- 画布与 `gpt-image2-generator` 技能已确认使用同一 Endpoint、模型和 API Key；技能成功的关键请求参数为 `n: 1`、`response_format: "url"`、`output_format: "png"`。

## 下一步开发计划

按优先级：

- 最高优先级：确认并支持 API1 的异步任务查询协议。
  - 功能需求描述：从原始响应中确认任务 ID、任务状态及结果查询 URL/接口，完成后轮询并回填最终图片。
  - 实现注意事项：需要保留完整的脱敏响应示例或服务商文档；不要猜测查询 URL，也不要记录 API Key。

1. 提交当前已完成的重要功能
   - 功能需求描述：将最近的端口、联动尺寸、日志、图片编组、绑定 Prompt 等改动提交到 GitHub。
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
   - 功能需求描述：用浏览器自动化检查页面不黑屏、设置页菜单存在、画布可以创建节点，并覆盖 Prompt/图片编组节点缩放。
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
  - 开发代理读取根目录 `settings.json`，当前指向 `http://localhost:8000`。
- `web/src/main.jsx`
  - React 挂载入口。
- `web/src/App.jsx`
  - 当前最核心文件。
  - 包含主要 React 状态、节点类型、画布、设置页、历史记录、日志弹窗、图片预览和生成逻辑。
- `web/src/config/imageSizes.js`
  - 图片模型的尺寸配置模块。
  - 当前包含 GPT image2 的 `1K`、`2K`、`4K` 映射，以及 Grok Imagine 独立的比例和 `1K`、`2K` 映射；Gemini 继续复用 GPT image2 配置。
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
    4. 打开 `http://localhost:8000`
- 开发模式：
  - 后端：`npm.cmd run server`
  - 前端：`npm.cmd run dev`
  - Vite 开发端口默认 `5173`，API 代理读取 `settings.json`，当前目标端口为 `8000`。
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
   - 每次代码功能或行为修改均递增补丁版本号，例如 `V1.0.1` 到 `V1.0.2`，并同步 `package.json`、`package-lock.json`、README、`CHANGELOG.md` 和本文件；仅补充或修正 `CHANGELOG.md` 时不递增版本号。
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

### 2026-08-07（最新）

- 修改内容：保留并显示第三方图片 API 的完整原始响应。
- 涉及文件：
  - `server/server.js`
  - `web/src/App.jsx`
  - `web/src/styles.css`
  - `CODEX_CONTEXT.md`
  - `README.md`
  - `package.json`
- 解决的问题：
  - 成功、HTTP 错误、没有图片 URL、超时和网络错误均会把可获得的响应文本写入生成日志。
  - 对应图片节点的信息叹号悬浮卡会显示原始响应，长文本可滚动查看，便于判断第三方 API 为什么没有回填图片。
  - README 已同步当前功能、启动方式、调试方式和重要文件；package.json 已补充项目描述与 Node.js 版本要求。

### 2026-08-08（最新）

- 修改内容：修复流式图片接口可能停在第一条任务状态的问题。
- 涉及文件：
  - `server/server.js`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 服务商在同一连接中先推送排队/处理中 JSON、后续再推送结果时，服务端会继续读取后续事件并寻找图片结果。
  - 读取到任务成功或失败状态但仍没有图片时，会及时返回该原始响应用于诊断，不再只能等待到 180 秒超时。
  - 若服务商使用独立任务结果接口，仍需依据原始响应或 API 文档补充专用轮询规则。

### 2026-08-08（请求格式修复）

- 修改内容：将画布文生图请求对齐已验证成功的 `gpt-image2-generator` 技能。
- 涉及文件：
  - `server/server.js`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 画布和技能使用同一个 `https://img.yunfei.best/v1` Endpoint、`gpt-image-2` 模型和 API Key，但画布此前没有发送 `n`、`response_format`、`output_format`。
  - 画布文生图现在发送 `n: 1`、`response_format: "url"`、`output_format: "png"`，服务端可以按 `data[0].url` 回填图片。
  - 图生图 multipart 请求暂未增加未经技能验证的字段，避免影响已有参考图流程。

当前建议提交信息：

```text
fix: align canvas image response format with generator skill
```

### 2026-08-08（生成按钮恢复）

- 修改内容：恢复异常中断后被锁定的 Prompt 生成按钮。
- 涉及文件：
  - `web/src/App.jsx`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - `localStorage` 会保存节点状态，旧任务在超时、刷新或服务重启时可能长期保留为 `generating`，从而禁用生成按钮。
  - 加载画布时会自动将遗留 Prompt 恢复为 `idle`，未完成图片节点标记为错误。
  - 新任务记录开始时间；生成中的 Prompt 增加重置状态图标，方便手动解除异常锁定。

当前建议提交信息：

```text
fix: recover interrupted prompt generation state
```

### 2026-08-08（信息复制）

- 修改内容：允许复制图片信息悬浮卡中的返回内容。
- 涉及文件：
  - `web/src/styles.css`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 临时 URL、服务商原始响应、错误信息等文本现在可以使用光标选中并通过 `Ctrl+C` 复制。
  - 文本选择时不会触发 React Flow 节点拖动。

当前建议提交信息：

```text
fix: allow copying image response details
```

### 2026-08-08（第三方 API 文档核对）

- 上下文版本：`0.1.0-dev.2026-08-08.18`
- 修改内容：只读核对第三方 `image2` API 文档与画布当前请求实现，未修改功能代码。
- 涉及文件：
  - `CODEX_CONTEXT.md`
  - 对照检查：`server/server.js`
- 已确认：
  - 文生图接口为 `POST /v1/images/generations`，使用 `Authorization: Bearer`。
  - 图生图接口为 `POST /v1/images/edits`，使用 `multipart/form-data`。
  - 文档示例要求 `response_format: "b64_json"`，并从 `data[0].b64_json` 读取结果。
  - 当前画布的响应解析已支持 `data[0].b64_json`。
- 当前风险：
  - 画布文生图请求仍发送 `response_format: "url"`，与文档示例不一致，可能导致第三方成功生成但画布没有图片结果。
  - 画布图生图请求未发送文档示例中的 `response_format: "b64_json"`。
  - 文档只展示单个 `image` 字段，尚未确认重复提交 5 个 `image` 字段是否被第三方支持。
- 下一步计划：先保留完整原始响应，确认 API 返回协议后，再决定是否统一改为 `b64_json`；不要猜测异步查询接口路径。
- 建议提交信息：
```text
docs: record third-party image API compatibility findings
```

### 2026-08-08（图生图接口接入）

- 上下文版本：`0.1.0-dev.2026-08-08.19`
- 修改内容：完成第三方 image2 图生图请求格式对齐。
- 涉及文件：
  - `server/server.js`
  - `web/src/App.jsx`
  - `CODEX_CONTEXT.md`
- 已完成：
  - Prompt 有参考图时继续调用 `POST /v1/images/edits` 并以 `multipart/form-data` 提交图片。
  - 图生图请求增加 `response_format: "b64_json"`，与第三方文档示例一致。
  - 服务端既有的 `data[0].b64_json` 解析会将结果转换为画布可显示和保存的 data URL。
  - Prompt 存在直接参考图时，生成按钮显示“图生图”；没有参考图时显示“文生图”。
- 已知限制：第三方文档只展示单图 `image` 字段；画布仍按既有需求允许提交最多 5 张同名 `image`，需要使用真实 API 手工确认多图行为。
- 建议提交信息：
```text
feat: enable documented image-to-image generation
```
### 2026-08-08（响应格式设置）

- 上下文版本：`0.1.0-dev.2026-08-08.20`
- 修改内容：在 API 设置中增加响应格式选择。
- 涉及文件：
  - `server/server.js`
  - `web/src/App.jsx`
  - `server/config.example.json`
  - `CODEX_CONTEXT.md`
- 已完成：
  - 支持 `url` 和 `b64_json` 两种响应格式。
  - 默认响应格式为 `url`，兼容现有画布和技能验证过的请求。
  - 当前 API 配置档独立保存所选响应格式。
  - 文生图和图生图请求都会读取该设置；URL 模式额外发送 `output_format: "png"`。
- 建议提交信息：
```text
feat: make image response format configurable
```

### 2026-08-08（等待期间画布错误隔离）

- 上下文版本：`0.1.0-dev.2026-08-08.21`
- 修改内容：隔离图片节点和 React Flow 画布的运行时渲染错误，避免等待生图时整页进入“画布需要重新加载”状态。
- 涉及文件：
  - `web/src/App.jsx`
  - `web/src/styles.css`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 图片节点渲染异常时不再冒泡到根错误边界并卸载整个应用。
  - React Flow 视图异常时只显示局部恢复入口，父级生成请求和状态继续保留。
  - 图片结果或错误状态变化后，局部错误边界会自动尝试恢复渲染。
- 测试结果：`npm.cmd run build`、`/api/health` 均通过；尚未用真实长时间第三方请求复现验证。
- 建议提交信息：
```text
fix: isolate canvas render errors during image generation
```

### 2026-08-08（生成按钮锁定与结果节点排序）

- 上下文版本：`0.1.0-dev.2026-08-08.22`
- 修改内容：防止同一个 Prompt 在生成期间重复提交，让同一个 Prompt 的多批生成图片按顺序向下排列，并补齐 URL 图片的文件大小读取。
- 涉及文件：
  - `web/src/App.jsx`
  - `CODEX_CONTEXT.md`
- 解决的问题：
  - 增加基于 `useRef` 的生成请求锁，处理 React 状态更新前的快速重复点击。
  - 生成按钮在 `generating` 状态下保持禁用，任务结束或失败后自动释放锁。
  - 结果节点记录来源 Prompt，下一批节点从已有结果的底部继续布局，避免窗口重叠。
  - 远程图片通过本地代理读取 `blob.size`，回写图片节点后在信息卡中显示文件大小。
- 下一步计划：进行真实第三方 API 的重复生成测试，确认按钮锁和纵向排列在图生图编组场景下也符合预期。

建议提交信息：

```text
fix: lock duplicate image generation and stack result nodes
```

### 2026-08-10（并发生成、模型选择和预览交互）

- 上下文版本：`0.1.0-dev.2026-08-10.01`
- 修改内容：更新生成并发行为、端点模型选择、剪贴板粘贴、图像对比预览、滚轮缩放和错误容错。
- 涉及文件：
  - `web/src/App.jsx`
  - `web/src/styles.css`
  - `README.md`
  - `CODEX_CONTEXT.md`
- 已完成：
  - 移除同一 Prompt 的生成中锁定；每次点击创建独立请求和唯一结果节点，允许并发生成多张图片。
  - API 设置中的获取模型列表按配置档保存；模型按钮支持高亮切换，Prompt 节点只注入当前配置档已高亮的模型。
  - 画布监听 `Ctrl+V`，可将剪贴板中的图片放入工作区。
  - 图生图结果双击预览时保存原始参考图，预览中支持原图/生成图分割对比；分割线跟随光标，滚轮可在 `0.5x` 到 `4x` 之间缩放。
  - 画布错误边界保留错误消息和组件堆栈，历史记录写入失败时自动裁剪旧记录，避免 `localStorage` 配额错误中断画布。
- 验证结果：`npm.cmd run build`、`git diff --check` 通过。
- 当前注意事项：模型获取后需要在设置页点击模型使其高亮；没有高亮模型时，Prompt 节点不会提供可生成的模型选项。
- 建议提交信息：

```text
feat: support concurrent generation and interactive image preview
```

### 2026-08-11（Gemini 图片模型）

- 上下文版本：`0.1.0-dev.2026-08-11.01`
- 修改内容：增加 Gemini 图片预览模型到内置模型列表。
- 涉及文件：
  - `web/src/config/imageSizes.js`
  - `README.md`
  - `CODEX_CONTEXT.md`
- 已完成：
  - 支持 `gemini-3-pro-image-preview`。
  - 支持 `gemini-3.1-flash-image-preview`。
  - 两个模型复用当前联动尺寸配置，并可在 API 配置和 Prompt 节点中选择；后端会原样向配置的第三方 Endpoint 发送模型名。
- 验证结果：待运行 `npm.cmd run build`。
- 建议提交信息：

```text
feat: add Gemini image preview models
```

### 2026-08-11（Prompt 自定义分辨率）

- 上下文版本：`0.1.0-dev.2026-08-11.02`
- 修改内容：在 Prompt 节点的分辨率菜单中增加自定义尺寸输入。
- 涉及文件：
  - `web/src/config/imageSizes.js`
  - `web/src/App.jsx`
  - `web/src/styles.css`
  - `README.md`
  - `CODEX_CONTEXT.md`
- 已完成：选择“自定义”后显示宽度和高度输入框；宽高保存为 `width`、`height` 和最终 `size`，文生图与图生图请求都会使用自定义尺寸。
- 尺寸限制：每个维度为 `1` 到 `16384` 像素。
- 建议提交信息：

```text
feat: support custom prompt image dimensions
```
