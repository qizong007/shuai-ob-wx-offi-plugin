import assert from "node:assert/strict";
import test from "node:test";
import {
  appendFooterMarkdown,
  COLOR_THEMES,
  COLOR_THEME_KEYS,
  DEFAULT_HEADER_OPTIONS,
  DEFAULT_LAYOUT_OPTIONS,
  formatMarkdownForWechat,
  HEADER_STYLES,
  HEADER_STYLE_KEYS,
  normalizeColorTheme,
  normalizeFontPreset,
  normalizeColorThemeChoice,
  normalizeHeaderStyle,
  normalizeLineHeight,
  normalizeSidePadding,
  normalizeStyleTheme,
  optimizeForWechat,
  STYLE_THEMES,
  STYLE_THEME_KEYS,
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
  assert.match(html, />加入社群<\/span><\/h3>/);
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

test("keeps mixed inline text together with an explicit paragraph line height", () => {
  const html = formatMarkdownForWechat(
    "正文 **加粗** 和 *斜体*，还有 [链接](https://example.com) 与 `代码`。",
    { lineHeight: 2.1 },
  );

  assert.match(html, /<p style="[^"]*line-height: 2.1;[^\"]*"><span style="line-height: inherit;">正文 /);
  assert.match(html, /<\/code>。<\/span><\/p>/);
  assert.match(html, /<sup[^>]*>\[1\]<\/sup>/);
});

test("centers images without adding fixed content widths", () => {
  const html = optimizeForWechat(
    formatMarkdownForWechat("![插图](https://example.com/image.png)"),
  );

  assert.match(html, /<img[^>]*style="display: block; max-width: 100%; height: auto; [^"]*margin: 15px auto;/);
  assert.doesNotMatch(html, /<span[^>]*><img/);
  assert.doesNotMatch(html, /width: \d+px/);
});

test("does not leave a line break in text immediately before a block image", () => {
  const html = optimizeForWechat(formatMarkdownForWechat(
    "20. 完成啦！\n![截图](https://example.com/one.png)\n\n操作完了。\n![截图](https://example.com/two.png)\n\n正常换行\n第二行",
  ));

  assert.match(html, /<li[^>]*><span style="line-height: inherit;">完成啦！<\/span><img/);
  assert.match(html, /<p[^>]*><span style="line-height: inherit;">操作完了。<\/span><img/);
  assert.doesNotMatch(html, /<br><\/span><img/);
  assert.match(html, /正常换行<br>第二行<\/span>/);
});

test("applies adjustable line height and side padding to the output", () => {
  const html = formatMarkdownForWechat("正文", {
    lineHeight: 2.1,
    sidePadding: 28,
  });

  assert.match(html, /^<section style="line-height: 2.1;/);
  assert.match(html, /padding-left: 28px; padding-right: 28px;/);
  assert.match(html, /<p style="[^"]*line-height: 2.1;/);
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

test("minimal style theme renders a monochrome decoration-free layout", () => {
  const markdown = "# 大标题\n\n## 小节\n\n正文 **重点** `代码`\n\n> 引用\n\n| 列 |\n| --- |\n| 值 |";
  const html = formatMarkdownForWechat(markdown, { styleTheme: "minimal" });

  assert.match(html, /<h1 style="color: #111111;[^"]*border-bottom: 1px solid #ececec/);
  assert.match(html, /<h2 style="color: #111111; font-size: 17px/);
  assert.match(html, /<p style="color: #444444; font-size: 15px/);
  assert.match(html, /<strong style="color: #000000/);
  assert.match(html, /border-left: 1px solid #999999/);
  assert.match(html, /border-top: 2px solid #111111/);
  assert.doesNotMatch(html, /background-color/);
});

test("trend style theme renders klein-blue accents and a dark code block", () => {
  const markdown =
    "# 大标题\n\n## 小节\n\n正文 **重点**\n\n> 引用\n\n- 甲\n\n```js\nconst a = 1;\n```\n\n| 列 |\n| --- |\n| 值 |";
  const html = formatMarkdownForWechat(markdown, { styleTheme: "trend" });

  assert.match(html, /<h1 style="color: #111111;[^"]*border-left: 6px solid #1e50ff/);
  assert.match(html, /background: linear-gradient\(to bottom, transparent 58%, rgba\(30, 80, 255, 0.28\) 58%\)/);
  assert.match(html, /<strong style="color: #1e50ff/);
  assert.match(html, /border-left: 3px solid #1e50ff/);
  assert.match(html, /<span style="color: #1e50ff; font-size: 12px; margin-right: 8px;">▪<\/span>/);
  assert.match(html, /<pre style="background: #111827/);
  assert.match(html, /background: #111111; font-weight: 700; color: #ffffff/);
});

test("magazine style theme numbers section headings and styles tables", () => {
  const markdown =
    "# 刊首\n\n## 第一件事\n\n正文 `要点`\n\n## 第二件事\n\n- 甲\n- 乙\n\n| 列 |\n| --- |\n| 一 |\n| 二 |";
  const html = formatMarkdownForWechat(markdown, { styleTheme: "magazine" });

  assert.match(html, /border-top: 3px solid #e8845c/);
  assert.match(html, />01<\/span><\/section><span style="flex: 1;[^"]*"><span[^>]*>第一件事/);
  assert.match(html, />02<\/span><\/section><span style="flex: 1;[^"]*"><span[^>]*>第二件事/);
  assert.match(html, /<code style="background: #f3f0ec;[^"]*font-weight: 600/);
  assert.match(html, /<span style="color: #e8845c; font-size: 12px; margin-right: 8px;">●<\/span>/);
  assert.match(html, /color: #ffffff; background: #e8845c/);
  assert.match(html, /<tr style="background: #fafaf7;">/);
  assert.match(html, /<tr style="background: #ffffff;">/);
});

test("magazine section headings show the configurable brand kicker", () => {
  const withBrand = formatMarkdownForWechat("## 章节", {
    styleTheme: "magazine",
    brandText: "AI共学社",
  });
  const withoutBrand = formatMarkdownForWechat("## 章节", {
    styleTheme: "magazine",
    brandText: "  ",
  });

  assert.match(
    withBrand,
    /<span style="font-size: 9px; color: #e8845c; letter-spacing: 3px; font-weight: 800;">AI共学社<\/span>/,
  );
  assert.doesNotMatch(withoutBrand, /letter-spacing: 3px/);
  // 未传品牌名时使用占位符，提醒用户去设置里修改
  const fallback = formatMarkdownForWechat("## 章节", { styleTheme: "magazine" });
  assert.match(fallback, />你的品牌名<\/span>/);
});

test("magazine section numbering resets between renders", () => {
  const first = formatMarkdownForWechat("## 甲\n\n## 乙", { styleTheme: "magazine" });
  const second = formatMarkdownForWechat("## 丙", { styleTheme: "magazine" });

  assert.match(first, />02<\/span>/);
  assert.match(second, />01<\/span>/);
  assert.doesNotMatch(second, />02<\/span>/);
});

test("falls back to the classic style theme for unknown values", () => {
  const html = formatMarkdownForWechat("# 标题", { styleTheme: "unexpected" as never });

  assert.match(html, /background-color: #4a4a4a/);
  assert.equal(normalizeStyleTheme("unexpected"), "classic");
  assert.equal(normalizeStyleTheme("magazine"), "magazine");
  assert.deepEqual(STYLE_THEME_KEYS, ["classic", "minimal", "trend", "magazine"]);
  for (const key of STYLE_THEME_KEYS) {
    assert.ok(STYLE_THEMES[key].label.length > 0);
    assert.ok(STYLE_THEMES[key].description.length > 0);
  }
});

test("color themes recolor every style theme, not just classic", () => {
  const markdown = "# 大标题\n\n## 小节\n\n**重点**\n\n- 列表项\n\n[链接](https://example.com)";
  const minimal = formatMarkdownForWechat(markdown, {
    styleTheme: "minimal",
    colorTheme: "crimson",
  });
  const magazine = formatMarkdownForWechat(markdown, {
    styleTheme: "magazine",
    colorTheme: "forest",
  });
  const trend = formatMarkdownForWechat(markdown, { styleTheme: "trend", colorTheme: "ink" });

  assert.match(minimal, /<h2 style="color: #9e2b25/);
  assert.match(minimal, /<sup style="color: #b03a2e/);
  assert.match(magazine, /font-size: 9px; color: #2e7d5b; letter-spacing: 3px/);
  assert.match(magazine, /<span style="color: #2e7d5b; font-size: 12px; margin-right: 8px;">●<\/span>/);
  assert.match(trend, /border-left: 6px solid #2f5b8f/);
  assert.match(trend, /rgba\(47, 91, 143, 0.28\)/);
});

test("auto color theme keeps each style theme's own palette", () => {
  const markdown = "# 大标题\n\n## 小节";
  const minimal = formatMarkdownForWechat(markdown, { styleTheme: "minimal" });
  const magazine = formatMarkdownForWechat(markdown, { styleTheme: "magazine" });
  const trend = formatMarkdownForWechat(markdown, { styleTheme: "trend" });

  assert.match(minimal, /<h2 style="color: #111111/);
  assert.match(magazine, /font-size: 9px; color: #e8845c; letter-spacing: 3px/);
  assert.match(trend, /border-left: 6px solid #1e50ff/);
  assert.match(trend, /rgba\(30, 80, 255, 0.28\)/);
  assert.equal(normalizeColorThemeChoice("auto"), "auto");
  assert.equal(normalizeColorThemeChoice("forest"), "forest");
  assert.equal(normalizeColorThemeChoice("unexpected"), "auto");
  assert.equal(normalizeColorThemeChoice(undefined), "auto");
});

test("renders no header unless explicitly enabled", () => {
  const html = formatMarkdownForWechat("# 标题");

  assert.doesNotMatch(html, /ISSUE 01/);
  assert.doesNotMatch(html, /你的品牌名<\/span><span/);
});

test("magazine-bar header renders brand and badge with the theme accent", () => {
  const html = formatMarkdownForWechat("# 标题", {
    header: {
      enabled: true,
      style: "magazine-bar",
      brandText: "AI共学社",
      badgeText: "ISSUE 02",
    },
  });

  assert.match(
    html,
    /<section style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #666666; border-bottom: 1px solid #e5e5e5;[^"]*">/,
  );
  assert.match(html, /letter-spacing: 4px; color: #666666;">AI共学社<\/span>/);
  assert.match(html, /background: #666666; color: #ffffff;[^"]*">ISSUE 02<\/span>/);
  // 刊头在正文之前
  assert.ok(html.indexOf("AI共学社") < html.indexOf("标题"));
});

test("header accent follows the classic color theme", () => {
  const html = formatMarkdownForWechat("# 标题", {
    colorTheme: "forest",
    header: { enabled: true, style: "magazine-bar", brandText: "品牌", badgeText: "" },
  });

  assert.match(html, /letter-spacing: 4px; color: #2e7d5b;">品牌<\/span>/);
  assert.doesNotMatch(html, /ISSUE/);
});

test("minimal-caption and center-badge headers render their own shapes", () => {
  const caption = formatMarkdownForWechat("正文", {
    header: { enabled: true, style: "minimal-caption", brandText: "周刊", badgeText: "忽略我" },
  });
  const badge = formatMarkdownForWechat("正文", {
    styleTheme: "magazine",
    header: { enabled: true, style: "center-badge", brandText: "", badgeText: "VOL.12" },
  });

  assert.match(caption, /border-bottom: 1px solid #ececec; color: #999999;[^"]*">周刊<\/p>/);
  assert.doesNotMatch(caption, /忽略我/);
  assert.match(badge, /background: #e8845c; color: #ffffff;[^"]*border-radius: 999px;">VOL.12<\/span>/);
});

test("header style values are normalized", () => {
  assert.equal(normalizeHeaderStyle("unexpected"), "magazine-bar");
  assert.equal(normalizeHeaderStyle("center-badge"), "center-badge");
  assert.deepEqual(HEADER_STYLE_KEYS, ["magazine-bar", "minimal-caption", "center-badge"]);
  for (const key of HEADER_STYLE_KEYS) {
    assert.ok(HEADER_STYLES[key].label.length > 0);
  }
  assert.ok(DEFAULT_HEADER_OPTIONS.brandText.length > 0);
});
