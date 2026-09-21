import assert from "node:assert/strict";
import test from "node:test";
import {
  appendFooterMarkdown,
  COLOR_THEMES,
  COLOR_THEME_KEYS,
  DEFAULT_LAYOUT_OPTIONS,
  formatMarkdownForWechat,
  normalizeColorTheme,
  normalizeFontPreset,
  normalizeLineHeight,
  normalizeSidePadding,
  optimizeForWechat,
} from "../src/formatter";

test("renders common Markdown with inline WeChat styles", () => {
  const html = formatMarkdownForWechat("# 标题\n\n## 小标题\n\n正文 **重点**\n\n- 一\n- 二");

  assert.match(html, /background-color: #4a4a4a/);
  assert.match(html, /border-bottom: 2px solid #666/);
  assert.match(html, /<strong style="color: #333/);
  assert.match(html, /<ul style=/);
});

test("removes frontmatter and escapes raw HTML", () => {
  const html = formatMarkdownForWechat("---\ntitle: secret\n---\n\n<script>alert(1)</script>");

  assert.doesNotMatch(html, /title: secret/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test("removes styles unsupported by the WeChat editor", () => {
  const optimized = optimizeForWechat(
    '<div style="border-radius: 8px; box-shadow: 0 1px 2px #000; display: inline-block; white-space: pre-wrap;">内容</div>',
  );

  assert.doesNotMatch(optimized, /border-radius|box-shadow|white-space/);
  assert.match(optimized, /display: inline;/);
});

test("appends an enabled footer behind a rendered separator", () => {
  const markdown = appendFooterMarkdown("正文", "### 加入社群\n\n欢迎加入。", true);
  const html = formatMarkdownForWechat(markdown);

  assert.match(
    markdown,
    /正文\n\n\n<!-- shuai-footer-separator -->\n\n---\n\n\n### 加入社群/,
  );
  assert.doesNotMatch(html, /shuai-footer-separator/);
  assert.match(html, /<hr style="[^"]*margin: 42px 0;/);
  assert.match(html, />加入社群<\/h3>/);
});

test("does not append a disabled or empty footer", () => {
  assert.equal(appendFooterMarkdown("正文", "### 广告", false), "正文");
  assert.equal(appendFooterMarkdown("正文", "   ", true), "正文");
});

test("moves Markdown links to a reference section at the very end", () => {
  const markdown = appendFooterMarkdown(
    "查看 [Obsidian](https://obsidian.md) 和 [文档](https://docs.obsidian.md)。",
    "### 加入社群\n\n访问 [社群页面](https://example.com/group)。",
    true,
  );
  const html = formatMarkdownForWechat(markdown);

  assert.doesNotMatch(html, /<a\s/);
  assert.match(html, /Obsidian<sup[^>]*>\[1\]<\/sup>/);
  assert.match(html, /文档<sup[^>]*>\[2\]<\/sup>/);
  assert.match(html, /社群页面<sup[^>]*>\[3\]<\/sup>/);
  assert.match(html, /margin-top: 48px/);
  assert.ok(html.indexOf("加入社群") < html.indexOf("引用源"));
  assert.ok(html.indexOf("引用源") < html.indexOf("https:\/\/example.com\/group"));
});

test("reuses one reference number for duplicate links", () => {
  const html = formatMarkdownForWechat(
    "[第一次](https://example.com) 和 [第二次](https://example.com)",
  );

  assert.equal((html.match(/https:\/\/example.com/g) ?? []).length, 1);
  assert.equal((html.match(/\[1\]<\/sup>/g) ?? []).length, 2);
});

test("inline code keeps paragraph and list text in one inline container", () => {
  const html = formatMarkdownForWechat("`xxx` 后面接正文。\n\n- `xxx` 后面接列表文字\n  - 嵌套列表");

  assert.match(html, /<p style="[^"]*"><span style="line-height: inherit;">.*<code style=/);
  assert.match(html, /<li style="[^"]*"><span style="line-height: inherit;">.*<code style=/);
  assert.match(html, /<\/span>\s*<ul style=/);
});

test("applies adjustable line height and side padding to the output", () => {
  const html = formatMarkdownForWechat("正文", {
    lineHeight: 2.1,
    sidePadding: 28,
  });

  assert.match(html, /^<section style="line-height: 2.1;/);
  assert.match(html, /padding-left: 28px; padding-right: 28px;/);
  assert.match(html, /line-height: inherit/);
});

test("uses safe layout defaults and clamps invalid values", () => {
  const html = formatMarkdownForWechat("正文");

  assert.match(html, new RegExp(`line-height: ${DEFAULT_LAYOUT_OPTIONS.lineHeight}`));
  assert.match(html, new RegExp(`padding-left: ${DEFAULT_LAYOUT_OPTIONS.sidePadding}px`));
  assert.equal(normalizeLineHeight(9), 2.5);
  assert.equal(normalizeLineHeight(Number.NaN), 1.8);
  assert.equal(normalizeSidePadding(-10), 0);
  assert.equal(normalizeSidePadding(99), 48);
});

test("sets a selected body font while keeping code monospaced", () => {
  const sans = formatMarkdownForWechat("正文 `代码`", { fontPreset: "sans" });
  const serif = formatMarkdownForWechat("正文", { fontPreset: "serif" });
  const original = formatMarkdownForWechat("正文");

  assert.match(sans, /<section style="[^"]*font-family: 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;/);
  assert.match(sans, /<code style="[^"]*font-family: 'SF Mono', Monaco, Consolas, monospace;/);
  assert.match(serif, /<section style="[^"]*font-family: 'Songti SC', 'STSong', SimSun, serif;/);
  assert.doesNotMatch(original, /<section style="[^"]*font-family:/);
  assert.equal(normalizeFontPreset("unexpected"), "default");
});

test("applies the selected color theme across headings, quotes and code", () => {
  const markdown = "# 标题\n\n## 小标题\n\n> 引用\n\n`代码`\n\n---";
  const classic = formatMarkdownForWechat(markdown);
  const ink = formatMarkdownForWechat(markdown, { colorTheme: "ink" });

  assert.match(classic, /background-color: #4a4a4a/);
  assert.match(ink, /background-color: #1f3a5f/);
  assert.match(ink, /border-bottom: 2px solid #2f5b8f/);
  assert.match(ink, /border-left: 4px solid #2f5b8f/);
  assert.match(ink, /background: #f2f6fb/);
  assert.match(ink, /color: #c7254e/);
  assert.match(ink, /transparent, #2f5b8f, transparent/);
  assert.doesNotMatch(ink, /#4a4a4a/);
});

test("falls back to the classic theme for unknown values", () => {
  const html = formatMarkdownForWechat("# 标题", { colorTheme: "unexpected" as never });

  assert.match(html, /background-color: #4a4a4a/);
  assert.equal(normalizeColorTheme("unexpected"), "classic");
  assert.equal(normalizeColorTheme("forest"), "forest");
  assert.ok(COLOR_THEME_KEYS.length >= 2);
  for (const key of COLOR_THEME_KEYS) {
    assert.ok(COLOR_THEMES[key].label.length > 0);
  }
});

test("colors level-2 headings, bold text and references with the theme", () => {
  const markdown = "## 小标题\n\n**重点**\n\n[链接](https://example.com)";
  const classic = formatMarkdownForWechat(markdown);
  const forest = formatMarkdownForWechat(markdown, { colorTheme: "forest" });

  assert.match(classic, /<h2 style="color: #1a1a1a/);
  assert.match(classic, /<strong style="color: #333333/);
  assert.match(forest, /<h2 style="color: #1e5e4e/);
  assert.match(forest, /<strong style="color: #2e7d5b/);
  assert.match(forest, /color: #2e7d5b; font-size: 14px; font-weight: 600[^>]*>引用源/);
  assert.match(forest, /color: #2e7d5b; font-weight: 600;">\[1\] 链接/);
});

