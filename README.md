# AI Canvas

本地运行的 AI 无限画布。通过 React Flow 管理 Prompt、图片、图片编组和生成结果，并通过本地 Node.js 服务调用 OpenAI 兼容的图片 API。

## 当前进度

- 无限画布支持平移、滚轮缩放、节点拖动、连线、删除和多画布管理。
- Prompt 节点支持选择 API 配置档、模型、质量和联动尺寸。
- 图片尺寸支持 `1K`、`2K`、`4K`，比例支持 `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`9:16`、`16:9`、`9:21`、`21:9`。
- 支持文生图、图生图和最多 5 张参考图，可从电脑拖入图片。
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

## 启动

环境要求：Node.js 18 或更高版本。

Windows 推荐双击根目录的 `start.bat`。手动启动：

```bash
npm.cmd install
npm.cmd run build
npm.cmd run server
```

然后打开 <http://localhost:6000>。

开发模式可以分别运行：

```bash
npm.cmd run dev     # Vite 开发服务器，默认 5173
npm.cmd run server  # API 服务，默认 6000
```

## API 配置

在设置页选择或新建 API 配置档，填写 Endpoint、API Key、模型、尺寸和质量后保存。Endpoint 填写服务商的 API 根地址，例如：

每个 API 配置档还可以选择响应格式：`URL` 或 `Base64`，默认使用 `Base64`。该选择同时应用于文生图和图生图请求。

```text
https://provider.example/v1
```

服务端会自动补充 `/images/generations` 或 `/images/edits`。真实配置保存在 `server/config.json`，该文件包含 API Key，已被 Git 忽略；换电脑后需要重新填写密钥。

内置模型包括 `gpt-image-2`、`grok-imagine-image` 和 `grok-imagine-image-quality`。点击“获取模型”后，返回的模型会按配置档保存；在列表中高亮的模型才会出现在该配置档创建的 Prompt 节点中。

## 生成与调试

服务端对图片生成请求设置 180 秒超时，并支持分块或 SSE 响应在读取到完整 JSON 后及时返回。第三方返回的图片 URL 会通过本地代理加载，远程图片也会在后台自动保存。

如果画布没有获得图片，请先查看顶部“日志”，再悬停对应图片框右下角的叹号。原始响应文本可以帮助判断服务商返回格式、错误信息或缺失图片字段。

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
