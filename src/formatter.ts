import { marked } from "marked";

export type WechatFontPreset = "default" | "sans" | "serif";

export type WechatColorTheme =
  | "classic"
  | "ink"
  | "forest"
  | "amber"
  | "grape"
  | "crimson";

export interface WechatColorPalette {
  /** 一级标题底色 */
  headingBackground: string;
  /** 二级标题文字颜色 */
  headingColor: string;
  /** 二级标题下划线、三级标题与引用左边框等强调色 */
  accent: string;
  /** 加粗与“引用源”标题颜色 */
  strongColor: string;
  blockquoteBackground: string;
  codeColor: string;
  codeBackground: string;
  tableHeaderBackground: string;
  hrColor: string;
}

export interface WechatColorThemeDefinition {
  label: string;
  palette: WechatColorPalette;
}

export const COLOR_THEMES: Record<WechatColorTheme, WechatColorThemeDefinition> = {
  classic: {
    label: "石墨灰（默认）",
    palette: {
      headingBackground: "#4a4a4a",
      headingColor: "#1a1a1a",
      accent: "#666666",
      strongColor: "#333333",
      blockquoteBackground: "#f8f8f8",
      codeColor: "#e74c3c",
      codeBackground: "#f8f9fa",
      tableHeaderBackground: "#f5f5f5",
      hrColor: "#666666",
    },
  },
  ink: {
    label: "墨蓝",
    palette: {
      headingBackground: "#1f3a5f",
      headingColor: "#1f3a5f",
      accent: "#2f5b8f",
      strongColor: "#2f5b8f",
      blockquoteBackground: "#f2f6fb",
      codeColor: "#c7254e",
      codeBackground: "#f5f8fc",
      tableHeaderBackground: "#eef3f9",
      hrColor: "#2f5b8f",
    },
  },
  forest: {
    label: "青野绿",
    palette: {
      headingBackground: "#1e5e4e",
      headingColor: "#1e5e4e",
      accent: "#2e7d5b",
      strongColor: "#2e7d5b",
      blockquoteBackground: "#f1f8f4",
      codeColor: "#c0392b",
      codeBackground: "#f4f9f6",
      tableHeaderBackground: "#edf5f0",
      hrColor: "#2e7d5b",
    },
  },
  amber: {
    label: "暖橙",
    palette: {
      headingBackground: "#b3541e",
      headingColor: "#b3541e",
      accent: "#c05621",
      strongColor: "#c05621",
      blockquoteBackground: "#fdf4ec",
      codeColor: "#b91c1c",
      codeBackground: "#fdf6ef",
      tableHeaderBackground: "#faf0e6",
      hrColor: "#d97706",
    },
  },
  grape: {
    label: "绛紫",
    palette: {
      headingBackground: "#5b3a8e",
      headingColor: "#5b3a8e",
      accent: "#6d44a8",
      strongColor: "#6d44a8",
      blockquoteBackground: "#f6f2fb",
      codeColor: "#d6336c",
      codeBackground: "#f9f5fc",
      tableHeaderBackground: "#f2ecf9",
      hrColor: "#7c53b8",
    },
  },
  crimson: {
    label: "朱砂红",
    palette: {
      headingBackground: "#9e2b25",
      headingColor: "#9e2b25",
      accent: "#b03a2e",
      strongColor: "#b03a2e",
      blockquoteBackground: "#fbf1ef",
      codeColor: "#7c2d12",
      codeBackground: "#fbf3f1",
      tableHeaderBackground: "#f7ebe8",
      hrColor: "#c0392b",
    },
  },
};

export const COLOR_THEME_KEYS = Object.keys(COLOR_THEMES) as WechatColorTheme[];

export const normalizeColorTheme = (value: unknown): WechatColorTheme =>
  typeof value === "string" && value in COLOR_THEMES ? (value as WechatColorTheme) : "classic";

export interface WechatLayoutOptions {
  lineHeight: number;
  sidePadding: number;
  fontPreset: WechatFontPreset;
  colorTheme: WechatColorTheme;
}

export const DEFAULT_LAYOUT_OPTIONS: WechatLayoutOptions = {
  lineHeight: 1.8,
  sidePadding: 16,
  fontPreset: "default",
  colorTheme: "classic",
};

const FONT_FAMILIES: Record<WechatFontPreset, string> = {
  default: "",
  sans: "'PingFang SC', 'Microsoft YaHei', Arial, sans-serif",
  serif: "'Songti SC', 'STSong', SimSun, serif",
};

export const normalizeFontPreset = (value: unknown): WechatFontPreset =>
  value === "sans" || value === "serif" ? value : "default";

export const normalizeLineHeight = (value: number): number =>
  Math.round(Math.min(2.5, Math.max(1.2, Number.isFinite(value) ? value : 1.8)) * 10) / 10;

export const normalizeSidePadding = (value: number): number =>
  Math.round(Math.min(48, Math.max(0, Number.isFinite(value) ? value : 16)));

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
  const normalized = Array.from(trimmed)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127 && !/\s/.test(character);
    })
    .join("")
    .toLowerCase();

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

const wrapInlineCodeContent = (text: string): string => {
  const blockStart = text.search(/<(?:p|ul|ol|div|section|blockquote|pre|table)\b/i);
  const inlineEnd = blockStart < 0 ? text.length : blockStart;
  const inlineContent = text.slice(0, inlineEnd);
  return inlineContent.includes("<code ")
    ? `<span style="line-height: inherit;">${inlineContent}</span>${text.slice(inlineEnd)}`
    : text;
};

const FOOTER_SEPARATOR_MARKER = "<!-- shuai-footer-separator -->";
let footerSeparatorPending = false;
let activePalette: WechatColorPalette = COLOR_THEMES.classic.palette;

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
      return `<p style="text-align: center; margin: 35px 0 30px 0;"><strong style="color: white; background-color: ${activePalette.headingBackground}; font-size: 24px; font-weight: 600; line-height: 1.6; padding: 20px 30px; display: inline-block;">${text}</strong></p>`;
    case 2:
      return `<h2 style="color: ${activePalette.headingColor}; font-size: 20px; font-weight: 600; line-height: 1.5; margin: 35px 0 20px 0; padding-bottom: 8px; border-bottom: 2px solid ${activePalette.accent};">${text}</h2>`;
    case 3:
      return `<h3 style="color: ${activePalette.accent}; font-size: 18px; font-weight: 500; line-height: 1.4; margin: 28px 0 12px 0;">${text}</h3>`;
    default:
      return `<h${level} style="color: #2a2a2a; font-size: ${20 - level}px; font-weight: 500; line-height: 1.4; margin: 14px 0 8px 0;">${text}</h${level}>`;
  }
};

renderer.paragraph = (text) =>
  `<p style="color: #1a1a1a; font-size: 16px; line-height: inherit; margin: 18px 0;">${wrapInlineCodeContent(text)}</p>`;

renderer.strong = (text) =>
  `<strong style="color: ${activePalette.strongColor}; font-weight: 600;">${text}</strong>`;
renderer.em = (text) => `<em style="color: #555; font-style: italic; font-weight: 500;">${text}</em>`;

renderer.code = (code) =>
  `<pre style="background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 15px 0; overflow-x: auto; font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 14px; line-height: 1.5; color: #333; white-space: pre-wrap;"><code>${escapeHtml(code)}</code></pre>`;

renderer.codespan = (text) =>
  `<code style="background: ${activePalette.codeBackground}; color: ${activePalette.codeColor}; padding: 2px 6px; border-radius: 4px; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 14px;">${text}</code>`;

renderer.blockquote = (quote) =>
  `<blockquote style="background: ${activePalette.blockquoteBackground}; border-left: 4px solid ${activePalette.accent}; margin: 15px 0; padding: 15px 20px; border-radius: 0 8px 8px 0; font-style: italic; color: #444;">${quote}</blockquote>`;

renderer.list = (body, ordered, start) => {
  const type = ordered ? "ol" : "ul";
  const startAttribute = ordered && start !== 1 ? ` start="${start}"` : "";
  return `<${type}${startAttribute} style="margin: 12px 0; padding-left: 30px;">${body}</${type}>`;
};

renderer.listitem = (text) =>
  `<li style="color: #1a1a1a; font-size: 16px; line-height: inherit; margin: 8px 0;">${wrapInlineCodeContent(text)}</li>`;

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

  return `${text}<sup style="color: ${activePalette.accent}; font-size: 11px; line-height: 1; vertical-align: super;">[${referenceNumber}]</sup>`;
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
  return `<hr style="border: none; height: 2px; background: linear-gradient(to right, transparent, ${activePalette.hrColor}, transparent); margin: ${margin};">`;
};

renderer.table = (header, body) =>
  `<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;"><thead>${header}</thead><tbody>${body}</tbody></table>`;

renderer.tablerow = (content) => `<tr>${content}</tr>`;

renderer.tablecell = (content, flags) => {
  const type = flags.header ? "th" : "td";
  const style = flags.header
    ? `border: 1px solid #e0e0e0; padding: 10px; text-align: left; background: ${activePalette.tableHeaderBackground}; font-weight: 600; color: #1a1a1a;`
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
        `<li style="color: #555; font-size: 13px; line-height: inherit; margin: 10px 0; word-break: break-all;"><span style="color: ${activePalette.strongColor}; font-weight: 600;">[${index + 1}] ${label}</span><br><span style="color: #777;">${url}</span></li>`,
    )
    .join("");

  return `<section style="margin-top: 48px; padding-top: 18px; border-top: 1px solid #e0e0e0;"><p style="color: ${activePalette.strongColor}; font-size: 14px; font-weight: 600; line-height: 1.6; margin: 0 0 12px 0;">引用源</p><ol style="list-style: none; margin: 0; padding-left: 0;">${items}</ol></section>`;
};

export const formatMarkdownForWechat = (
  markdown: string,
  layout: Partial<WechatLayoutOptions> = {},
): string => {
  linkReferences.length = 0;
  linkReferenceNumbers.clear();
  footerSeparatorPending = false;
  activePalette = COLOR_THEMES[normalizeColorTheme(layout.colorTheme)].palette;
  const html = marked.parse(stripFrontmatter(markdown)).trim();
  const lineHeight = normalizeLineHeight(layout.lineHeight ?? DEFAULT_LAYOUT_OPTIONS.lineHeight);
  const sidePadding = normalizeSidePadding(
    layout.sidePadding ?? DEFAULT_LAYOUT_OPTIONS.sidePadding,
  );
  const fontFamily = FONT_FAMILIES[normalizeFontPreset(layout.fontPreset)];
  const fontStyle = fontFamily ? ` font-family: ${fontFamily};` : "";
  return `<section style="line-height: ${lineHeight}; padding-left: ${sidePadding}px; padding-right: ${sidePadding}px;${fontStyle}">${html}${renderLinkReferences()}</section>`;
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
