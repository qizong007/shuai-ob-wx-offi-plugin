import { marked } from "marked";

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );

const safeUrl = (value: string, image = false): string => {
  const trimmed = value.trim();
  const normalized = trimmed.replace(/[\u0000-\u001F\u007F\s]+/g, "").toLowerCase();

  if (normalized.startsWith("javascript:") || normalized.startsWith("vbscript:")) {
    return "";
  }

  if (normalized.startsWith("data:") && !(image && normalized.startsWith("data:image/"))) {
    return "";
  }

  return escapeHtml(trimmed);
};

const stripFrontmatter = (markdown: string): string =>
  markdown.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/, "");

const FOOTER_SEPARATOR_MARKER = "<!-- shuai-footer-separator -->";
let footerSeparatorPending = false;

interface LinkReference {
  label: string;
  url: string;
}

const linkReferences: LinkReference[] = [];
const linkReferenceNumbers = new Map<string, number>();

const renderer = new marked.Renderer();

renderer.heading = (text, level) => {
  switch (level) {
    case 1:
      return `<p style="text-align: center; margin: 35px 0 30px 0;"><strong style="color: white; background-color: #4a4a4a; font-size: 24px; font-weight: 600; line-height: 1.6; padding: 20px 30px; display: inline-block;">${text}</strong></p>`;
    case 2:
      return `<h2 style="color: #1a1a1a; font-size: 20px; font-weight: 600; line-height: 1.5; margin: 35px 0 20px 0; padding-bottom: 8px; border-bottom: 2px solid #666;">${text}</h2>`;
    case 3:
      return `<h3 style="color: #2a2a2a; font-size: 18px; font-weight: 500; line-height: 1.4; margin: 28px 0 12px 0;">${text}</h3>`;
    default:
      return `<h${level} style="color: #2a2a2a; font-size: ${20 - level}px; font-weight: 500; line-height: 1.4; margin: 14px 0 8px 0;">${text}</h${level}>`;
  }
};

renderer.paragraph = (text) =>
  `<p style="color: #1a1a1a; font-size: 16px; line-height: 1.8; margin: 18px 0;">${text}</p>`;

renderer.strong = (text) => `<strong style="color: #333; font-weight: 600;">${text}</strong>`;
renderer.em = (text) => `<em style="color: #555; font-style: italic; font-weight: 500;">${text}</em>`;

renderer.code = (code) =>
  `<pre style="background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 15px 0; overflow-x: auto; font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 14px; line-height: 1.5; color: #333; white-space: pre-wrap;"><code>${escapeHtml(code)}</code></pre>`;

renderer.codespan = (text) =>
  `<code style="background: #f8f9fa; color: #e74c3c; padding: 2px 6px; border-radius: 4px; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 14px;">${text}</code>`;

renderer.blockquote = (quote) =>
  `<blockquote style="background: #f8f8f8; border-left: 4px solid #666; margin: 15px 0; padding: 15px 20px; border-radius: 0 8px 8px 0; font-style: italic; color: #444;">${quote}</blockquote>`;

renderer.list = (body, ordered, start) => {
  const type = ordered ? "ol" : "ul";
  const startAttribute = ordered && start !== 1 ? ` start="${start}"` : "";
  return `<${type}${startAttribute} style="margin: 12px 0; padding-left: 30px;">${body}</${type}>`;
};

renderer.listitem = (text) =>
  `<li style="color: #1a1a1a; font-size: 16px; line-height: 1.8; margin: 8px 0;">${text}</li>`;

renderer.link = (href, title, text) => {
  const url = safeUrl(href ?? "");
  if (!url) return text;

  let referenceNumber = linkReferenceNumbers.get(url);
  if (!referenceNumber) {
    linkReferences.push({
      label: text.replace(/<[^>]*>/g, ""),
      url,
    });
    referenceNumber = linkReferences.length;
    linkReferenceNumbers.set(url, referenceNumber);
  }

  return `${text}<sup style="color: #666; font-size: 11px; line-height: 1; vertical-align: super;">[${referenceNumber}]</sup>`;
};

renderer.image = (href, title, text) => {
  const url = safeUrl(href ?? "", true);
  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";
  const altAttribute = text ? ` alt="${escapeHtml(text)}"` : "";
  return `<img src="${url}"${titleAttribute}${altAttribute} style="max-width: 100%; height: auto; border-radius: 8px; margin: 15px 0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">`;
};

renderer.hr = () => {
  const margin = footerSeparatorPending ? "42px 0" : "25px 0";
  footerSeparatorPending = false;
  return `<hr style="border: none; height: 2px; background: linear-gradient(to right, transparent, #666, transparent); margin: ${margin};">`;
};

renderer.table = (header, body) =>
  `<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;"><thead>${header}</thead><tbody>${body}</tbody></table>`;

renderer.tablerow = (content) => `<tr>${content}</tr>`;

renderer.tablecell = (content, flags) => {
  const type = flags.header ? "th" : "td";
  const style = flags.header
    ? "border: 1px solid #e0e0e0; padding: 10px; text-align: left; background: #f5f5f5; font-weight: 600; color: #1a1a1a;"
    : "border: 1px solid #e0e0e0; padding: 10px; text-align: left;";
  return `<${type} style="${style}">${content}</${type}>`;
};

renderer.html = (html) => {
  if (html.trim() === FOOTER_SEPARATOR_MARKER) {
    footerSeparatorPending = true;
    return "";
  }
  return escapeHtml(html);
};

marked.setOptions({
  breaks: true,
  gfm: true,
  renderer,
});

const renderLinkReferences = (): string => {
  if (!linkReferences.length) return "";

  const items = linkReferences
    .map(
      ({ label, url }, index) =>
        `<li style="color: #555; font-size: 13px; line-height: 1.7; margin: 10px 0; word-break: break-all;"><span style="font-weight: 600;">[${index + 1}] ${label}</span><br><span style="color: #777;">${url}</span></li>`,
    )
    .join("");

  return `<section style="margin-top: 48px; padding-top: 18px; border-top: 1px solid #e0e0e0;"><p style="color: #333; font-size: 14px; font-weight: 600; line-height: 1.6; margin: 0 0 12px 0;">引用源</p><ol style="list-style: none; margin: 0; padding-left: 0;">${items}</ol></section>`;
};

export const formatMarkdownForWechat = (markdown: string): string => {
  linkReferences.length = 0;
  linkReferenceNumbers.clear();
  footerSeparatorPending = false;
  const html = marked.parse(stripFrontmatter(markdown)).trim();
  return `${html}${renderLinkReferences()}`;
};

export const appendFooterMarkdown = (
  markdown: string,
  footerMarkdown: string,
  enabled: boolean,
): string => {
  if (!enabled || !footerMarkdown.trim()) return markdown;
  return `${markdown.trimEnd()}\n\n\n${FOOTER_SEPARATOR_MARKER}\n\n---\n\n\n${footerMarkdown.trim()}`;
};

export const optimizeForWechat = (html: string): string =>
  html
    .replace(/box-shadow:[^;]*;?/g, "")
    .replace(/border-radius:[^;]*;?/g, "")
    .replace(/backdrop-filter:[^;]*;?/g, "")
    .replace(/transform:[^;]*;?/g, "")
    .replace(/transition:[^;]*;?/g, "")
    .replace(/display:\s*inline-block;?/g, "display: inline;")
    .replace(/white-space:[^;]*;?/g, "");
