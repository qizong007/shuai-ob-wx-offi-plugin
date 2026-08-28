import assert from "node:assert/strict";
import test from "node:test";
import {
  appendFooterMarkdown,
  formatMarkdownForWechat,
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
