# AI Canvas

当前版本：`V1.1.6`

更新记录请查看 [CHANGELOG.md](CHANGELOG.md)。

本地运行的 AI 无限画布。通过 React Flow 管理 Prompt、图片、图片编组和生成结果，并通过本地 Node.js 服务调用 OpenAI 兼容的图片 API。

## 当前进度

- 无限画布支持平移、滚轮缩放、节点拖动、连线、删除和多画布管理。
- Prompt 节点支持选择 API 配置档、模型、质量和联动尺寸。
- 图片尺寸支持 `auto`、`1K`、`2K`、`4K`，image2 的固定尺寸遵循 GPT Image 2 的 16 像素倍数、最大边长和总像素约束；选择 `auto` 时隐藏后续比例/具体尺寸选择框。image2/Gemini 按 `size: "auto"` 请求，Grok 按 `aspect_ratio: "auto"` 请求且不发送 `resolution`。
- Prompt 节点尺寸菜单支持“自定义”，可直接填写宽度和高度并按自定义分辨率生成。
- 支持文生图、图生图和最多 5 张参考图，可从电脑拖入图片。
- 设置页支持配置图片下载代理；默认关闭，选择“开”后填写 Clash Verge 端口（如 `7890`）或完整 HTTP/HTTPS/SOCKS 代理地址，服务端下载第三方图片 URL 会通过该代理。
- 浏览器使用的 Clash Verge 系统代理不会自动传递给 Node.js 或 `curl`；如果浏览器能打开第三方图片而画布下载超时，请在设置页将图片下载代理设为“开”并填写 Clash Verge 的本地端口。
- 生成图片节点右下角支持直接打开第三方返回的原始 URL。
- 图片生成失败时，失败图片节点提供“重新生成”按钮，可直接重新调用关联的 Prompt。
- 底部工具栏可创建“效果对比”节点；节点可使用当前 Prompt/参考图，并按行独立选择 API、模型、尺寸、比例和质量。
- 效果对比节点与 Prompt 节点处于同一画布层级，支持拖动、缩放、删除和连线；通过加号动态添加对比行。
- 效果对比节点生成后，会按 API 行顺序从左到右创建图片节点，并分别连回效果对比节点。
- 画布支持 `Ctrl+V` 直接粘贴剪贴板图片，并自动创建图片节点。
- 图片编组节点支持拖入多张图片、删除单张图片，并连接 Prompt 批量生成。
- 同一个 Prompt 在已有图片生成任务进行时仍可再次点击生成，支持并发生成多张结果。
- 生成后立即创建图片占位框，成功或失败状态会回填到对应节点。
- 图片节点支持拖动、缩放、双击放大、滚轮缩放预览、打开、下载和删除。
- 图生图结果预览支持原图/生成图分割对比，分割线可跟随光标移动。
- 图片框右下角叹号可查看临时 URL、下载方式、文件大小、实际尺寸、模型、质量和第三方原始返回信息。
- 顶部日志按钮显示每次生成的 Prompt、状态和原始响应文本；失败、超时、HTTP 错误和非 JSON 响应也会显示。
- API Key 只保存在本地服务端配置中，输入框支持眼睛图标切换显示和隐藏。
- API 设置支持获取端点模型列表；模型按钮可单击高亮，Prompt 节点只显示当前配置档已高亮的模型。
- API 设置右侧提供“高级设置”区域，集中管理图片下载代理开关、代理端口、返回格式和参考图传输方式；这些选项按配置档独立保存。
- `gpt-image-2` 和 Gemini 图生图支持实验性的 HTTP(S) URL 直传：由已有生成图创建的 Prompt 会优先使用原始图片 URL，并以 JSON 的 `image_url`（单图）或 `image_urls`（多图）发送给兼容端点；本地上传和 Base64 参考图仍按原方式上传文件。
- 每张生成图片左下角叹号会显示实际发往第三方 API 的请求地址、脱敏请求头和请求体；右下角叹号显示第三方 JSON 响应的完整结构和非图片字段，Base64 图片内容显示为占位文本。API Key 和本地参考图 Base64 不会写入请求记录；写入本地缓存时也会压缩 Base64 图片数据。
- API 设置中的“参考图传输方式”按配置档独立保存：默认“文件上传（原模式）”；选择“HTTP(S) 图片 URL”后，`gpt-image-2` 和 Gemini 图像模型在参考图全部为 HTTP(S) URL 时使用 URL 直传。
- Grok Imagine（包括 `grok-imagine-image`、`grok-imagine-image-2.0` 和 `grok-imagine-image-quality`）使用独立尺寸协议：具体比例请求发送 `aspect_ratio` 和小写 `resolution`，选择 `auto` 时只发送 `aspect_ratio: "auto"`；Grok 2.0 文生图使用 `/images/generations`，单图编辑使用 `/images/edits` 的 `image` 对象，多图编辑使用 `/images/edits` 的 `images` 数组；参考图可使用公开 URL 或 Base64 data URL。其他 Grok 模型继续使用原有兼容请求。
- 历史记录支持带确认的单条删除，删除后立即释放该条浏览器存储占用；不会删除输出目录中的图片文件。
- API 设置页支持清除浏览器缓存记录；只清除画布和历史记录，保留已获取/高亮模型、服务端 Endpoint、API Key 和配置档。
- Prompt 节点的 API、模型、尺寸、比例和质量选择控件显示对应字段标题。
- Prompt 节点支持选择请求数量 `1` 到 `5` 张；无图片编组时会按数量并发生成。
- Prompt 节点在窄宽度下为模型选择保留整行空间，完整显示模型名称；比例选项继续显示完整的像素尺寸信息。

## 效果对比节点

在画布底部工具栏点击“效果对比”即可创建节点。节点创建时会优先带入当前选中 Prompt 的提示词和参考图；也可以直接在节点内编辑提示词或重新上传参考图。

每一行配置对应一次独立请求。点击参数区右侧的加号可以增加 API 行，再分别选择 API、模型、尺寸、比例和质量。点击“开始对比”后，图片会按行顺序从左到右创建在节点右侧，并自动与效果对比节点连线。

效果对比节点和 Prompt 节点一样，可以在画布上拖动、缩放、删除，也可以继续和其他节点连线。每个 API 请求完成后会立即回填对应图片、历史记录和本地保存任务，不会等待其他 API 完成；单张失败图片的“重新生成”只会重试对应 API 行。

## 启动

环境要求：Node.js 18 或更高版本。

Windows 推荐双击根目录的 `start.bat`。手动启动：

```bash
npm.cmd install
npm.cmd run build
npm.cmd run server
```

然后打开 <http://localhost:8000>。

默认端口保存在根目录的 `settings.json`。修改其中的 `port` 后重启服务；`start.bat`、服务端和 Vite 开发代理会自动使用该端口。

开发模式可以分别运行：

```bash
npm.cmd run dev     # Vite 开发服务器，默认 5173
npm.cmd run server  # API 服务，当前由 settings.json 配置为 8000
```

## API 配置

在设置页选择或新建 API 配置档，填写 Endpoint、API Key、模型、尺寸和质量后保存。Endpoint 填写服务商的 API 根地址，例如：

每个 API 配置档还可以选择响应格式：`URL` 或 `Base64`，默认使用 `URL`。该选择同时应用于文生图和图生图请求。

```text
https://provider.example/v1
```

服务端会自动补充 `/images/generations` 或 `/images/edits`。真实配置保存在 `server/config.json`，该文件包含 API Key，已被 Git 忽略；换电脑后需要重新填写密钥。

图片下载代理保存在根目录 `settings.json`。关闭代理时服务端直连；开启代理后，服务端使用 Node.js 原生 HTTPS 流式下载通过填写的代理保存图片和加载远程图片预览，不依赖 Windows curl/Schannel。点击生成图片节点右下角的“打开 URL”时由浏览器直接访问原始地址，仍使用浏览器自身的代理设置。

内置模型包括 `gpt-image-2`、`grok-imagine-image`、`grok-imagine-image-2.0`、`grok-imagine-image-quality`、`gemini-3-pro-image-preview` 和 `gemini-3.1-flash-image-preview`。点击“获取模型”后，返回的模型会按配置档保存；在列表中高亮的模型才会出现在该配置档创建的 Prompt 节点中。

## 生成与调试

服务端对图片生成请求设置 180 秒超时，并支持分块或 SSE 响应在读取到完整 JSON 后及时返回。第三方返回的图片 URL 会通过本地代理加载，远程图片也会在后台自动保存。

如果画布没有获得图片，请先查看顶部“日志”，再悬停对应图片框右下角的叹号。原始响应文本可以帮助判断服务商返回格式、错误信息或缺失图片字段。

不同服务商的原始响应字段不相同。image2 通常会返回 `revised_prompt`、`moderation`、`output_format`、`quality`、`size` 和 Token 用量；Grok 通常只返回图片 `url`、`mime_type` 和费用信息。画布会显示服务商实际返回的完整非 Base64 字段，不会为服务商没有返回的字段生成虚假内容。

历史记录使用浏览器本地存储；Base64 图片过多时会自动裁剪最旧记录，避免超出浏览器存储配额导致画布报错。画布渲染错误会保留错误消息和组件堆栈，点击“重新加载”后恢复。

## 重要文件

- `web/src/App.jsx`：React 状态、画布、节点、设置页、日志和生成流程。
- `web/src/config/imageSizes.js`：独立的图片尺寸配置，便于扩展其他模型。
- `web/src/styles.css`：界面和节点样式。
- `server/server.js`：Express API、第三方图片请求、超时、响应解析、图片代理和自动保存。
- `server/config.example.json`：不含密钥的配置模板。
- `CODEX_CONTEXT.md`：供 AI 开发助手阅读的项目上下文和开发记忆。
- `package.json`：Node.js 脚本、依赖和运行环境要求。

## 安全

不要提交 `server/config.json`、API Key、`node_modules/`、`.npm-cache/`、`web/dist/` 或 `output/`。导出的配置 JSON 可能包含 API Key，请不要公开分享。
