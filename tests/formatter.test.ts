import assert from "node:assert/strict";
import test from "node:test";
import { formatMarkdownForWechat, optimizeForWechat } from "../src/formatter";

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
