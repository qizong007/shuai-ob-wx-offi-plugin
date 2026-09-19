<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="shuai-ob-wx-offi-plugin：将 Obsidian 当前笔记一键复制成微信公众号富文本">
</p>

# Shuai WeChat Formatter（中文）

Shuai WeChat Formatter is an Obsidian plugin that previews the current Markdown note as WeChat Official Account rich text and copies the formatted result to the clipboard.

Key features include live preview, one-click rich-text copy, configurable footer content, extracted link references, adjustable line height and page margins, and split-pane or tab-based preview modes.

[English](./README.md)

## 中文说明

一个面向微信公众号写作者的 Obsidian 插件。打开 Markdown 笔记，点击一次按钮，即可复制带内联样式的富文本，并在主编辑区查看公众号排版预览。

插件完全在本地运行，不会上传笔记内容。

## 功能

- 一键复制当前 Markdown 笔记全文。
- 同时写入 `text/html` 和 `text/plain`，可直接粘贴到微信公众号编辑器。
- 在主编辑区打开分栏预览，不占用 Obsidian 侧边栏。
- 编辑笔记时，预览自动更新。
- 可配置 Markdown 格式的结尾钩子，用于社群、产品、联系方式或广告位。
- 可在预览页随时关闭或重新开启结尾钩子，预览与复制结果保持一致。
- 可选择在右侧分栏或新标签页中打开预览。
- 自动把 Markdown 链接转成编号引用，并在文章最底部生成「引用源」。
- 可在预览中实时调整正文行间距和页边距，复制结果与预览一致。
- 可在设置中保存默认行间距和默认页边距。
- 可在设置中选择正文字体：跟随编辑器（默认）、无衬线或宋体；代码仍使用等宽字体。
- 自动忽略文件开头的 YAML Properties。
- 原始 HTML 会被转义，避免在预览中直接执行。
- 提供左侧 Ribbon 按钮和命令面板命令。

## 支持的 Markdown

| 类型 | 支持情况 |
| --- | --- |
| H1–H6 标题 | 支持 |
| 段落与换行 | 支持 |
| 粗体与斜体 | 支持 |
| 有序、无序列表 | 支持 |
| 引用 | 支持 |
| 行内代码、代码块 | 支持 |
| 链接 | 支持 |
| 标准 Markdown 网络图片 | 支持 |
| 表格、分隔线 | 支持 |
| Obsidian `![[本地图片]]` | 暂不支持自动上传 |

## 安装

插件尚未进入 Obsidian Community Plugins，需要手动安装。

### 从源码构建

需要 Node.js 18 或更高版本。

```bash
git clone git@github.com:qizong007/shuai-ob-wx-offi-plugin.git
cd shuai-ob-wx-offi-plugin
npm install
npm run build
```

构建完成后，在 Obsidian 仓库中创建插件目录：

```text
<你的仓库>/.obsidian/plugins/shuai-wechat-formatter/
```

把以下三个文件复制进去：

```text
main.js
manifest.json
styles.css
```

重启 Obsidian，在「设置 → 第三方插件」中启用「Shuai WeChat Formatter」。插件内部界面仍使用中文。

## 使用

1. 在 Obsidian 中打开一篇 Markdown 笔记。
2. 点击左侧 Ribbon 中间带“帅”字的公众号图标。
3. 插件会复制当前笔记，并在主编辑区打开分栏预览。
4. 进入微信公众号编辑器，直接粘贴。

预览顶部的「复制公众号格式」按钮可以再次复制当前笔记。

## 配置结尾钩子

打开「设置 → Shuai WeChat Formatter」，填写一段 Markdown，例如：

```markdown
### 加入我的社群

获取更多 Obsidian 和 AI 创作内容：<https://example.com>
```

启用后，插件会在正文末尾自动组合：

```markdown
---

### 加入我的社群

获取更多 Obsidian 和 AI 创作内容：<https://example.com>
```

其中 `---` 会渲染成可见分隔线。预览左下角悬浮窗中的「结尾钩子：开/关」按钮会同时控制预览内容和最终复制内容。

## 配置预览打开方式

在「设置 → Shuai WeChat Formatter → 预览打开方式」中选择：

- `右侧分栏`：在当前笔记右边打开预览。
- `新标签页`：在当前标签组中新建一个预览标签页。

切换方式时，已有预览会自动关闭；下次点击插件按钮时按新方式打开。

## 调整文章间距

预览左下角的悬浮控制窗提供两项滑杆：

- `行间距`：范围 `1.2–2.5`，控制正文、列表和引用源的行高。
- `页边距`：范围 `0–48px`，控制最终内容左右两侧的内边距。

悬浮窗同时包含结尾钩子开关和「恢复默认」按钮。预览中的调整是临时值，并会直接影响本次复制结果。

在「设置 → Shuai WeChat Formatter」中可以保存默认值。默认行间距为 `1.8`，默认页边距为 `16px`；插件重新加载时会恢复为这两个设置值。

## 链接与引用源

微信公众号编辑器无法稳定保留普通外链。插件会把 Markdown 链接从正文中抽出，在原位置添加引用编号，并把网址集中放到文章最底部：

```markdown
查看 [Obsidian](https://obsidian.md)
```

会转换为类似：

```text
查看 Obsidian[1]

引用源
[1] Obsidian
    https://obsidian.md
```

如果启用了结尾钩子，顺序固定为「正文 → 结尾钩子 → 引用源」，引用源前会保留明显间距。重复网址只生成一条引用记录。

## 命令

在 Obsidian 命令面板中可以使用：

- `复制当前笔记为公众号格式`
- `打开公众号预览`

## 工作原理

```text
当前 Markdown 笔记
        ↓
解析 Markdown 并生成内联样式 HTML
        ↓
主编辑区实时预览
        ↓
以 HTML + 纯文本写入系统剪贴板
```

公众号编辑器通常会过滤外部 CSS，因此插件把排版样式直接写到 HTML 元素的 `style` 属性中。复制前还会移除阴影、圆角、滤镜和过渡等兼容性较差的样式。

## 本地开发

```bash
npm install
npm test
npm run build
```

- `npm test`：运行格式转换单元测试。
- `npm run build`：执行 TypeScript 类型检查并生成生产版 `main.js`。
- `npm run dev`：监听源码变化并持续构建。

项目结构：

```text
shuai-ob-wx-offi-plugin/
├── assets/
│   ├── plugin-icon.svg
│   └── readme/hero.svg
├── src/
│   ├── formatter.ts
│   └── main.ts
├── tests/
│   └── formatter.test.ts
├── manifest.json
├── styles.css
└── package.json
```

## 已知限制

- Obsidian 的 WikiLink 和 `![[本地图片]]` 尚未转换为公众号可用的图片资源。
- 网络图片能否最终进入公众号素材库，取决于公众号编辑器对图片来源的处理。
- 当前没有针对 Obsidian 移动端做完整实机验证。
- 微信公众号编辑器可能继续过滤部分 HTML 或样式，最终发布前请检查预览。

## 隐私

插件不发送网络请求，不收集数据，也不保存文章副本。笔记内容只在当前 Obsidian 窗口中转换，并在点击复制时写入系统剪贴板。

## 参与贡献

欢迎提交 Issue 或 Pull Request。提交前请运行：

```bash
npm test
npm run build
```

涉及公众号样式兼容性的修改，请在说明中附上 Obsidian 预览和公众号编辑器粘贴结果。

## License

[MIT](./LICENSE)
