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

export type WechatStyleTheme = "classic" | "minimal" | "trend" | "magazine";

interface TableCellFlags {
  header: boolean;
  align: "center" | "left" | "right" | null;
}

/**
 * 一套主题风格对各类 Markdown 元素的渲染模板。
 * 未覆盖的钩子会回退到经典主题的实现。
 */
interface WechatThemeHooks {
  heading: (text: string, level: number) => string;
  paragraph: (text: string) => string;
  strong: (text: string) => string;
  em: (text: string) => string;
  code: (code: string) => string;
  codespan: (text: string) => string;
  blockquote: (quote: string) => string;
  list: (body: string, ordered: boolean, start: number) => string;
  listitem: (text: string) => string;
  image: (url: string, titleAttribute: string, altAttribute: string) => string;
  hr: (margin: string) => string;
  table: (header: string, body: string) => string;
  tablecell: (content: string, flags: TableCellFlags) => string;
}

export interface WechatStyleThemeDefinition {
  label: string;
  description: string;
  /** 非经典主题的固定配色；也用于链接角标、引用源等共享模板 */
  palette: WechatColorPalette;
  hooks: Partial<WechatThemeHooks>;
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

/** 配色选择：具体某套配色，或 "auto" 跟随主题自带色 */
export type WechatColorThemeChoice = WechatColorTheme | "auto";

export const normalizeColorThemeChoice = (value: unknown): WechatColorThemeChoice => {
  if (typeof value === "string" && value in COLOR_THEMES) return value as WechatColorTheme;
  return "auto";
};

/** 把 #rrggbb 转成 rgba()，用于荧光标记等半透明强调色 */
const hexToRgba = (hex: string, alpha: number): string => {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return hex;
  const value = parseInt(match[1], 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};

export type WechatHeaderStyle = "magazine-bar" | "minimal-caption" | "center-badge";

export interface WechatHeaderOptions {
  enabled: boolean;
  style: WechatHeaderStyle;
  /** 品牌名，杂志顶栏左侧与杂志主题章节标题上方共用 */
  brandText: string;
  /** 徽章文字，杂志顶栏右侧或居中徽章 */
  badgeText: string;
}

export const HEADER_STYLES: Record<WechatHeaderStyle, { label: string; description: string }> = {
  "magazine-bar": {
    label: "杂志顶栏",
    description: "左侧品牌小字、右侧徽章，上下细线，模仿杂志刊头。",
  },
  "minimal-caption": {
    label: "极简小字",
    description: "一行灰色小字配下划细线，安静的开场。",
  },
  "center-badge": {
    label: "居中徽章",
    description: "一枚居中的圆角徽章，适合期号或栏目名。",
  },
};

export const HEADER_STYLE_KEYS = Object.keys(HEADER_STYLES) as WechatHeaderStyle[];

export const normalizeHeaderStyle = (value: unknown): WechatHeaderStyle =>
  typeof value === "string" && value in HEADER_STYLES ? (value as WechatHeaderStyle) : "magazine-bar";

/** 品牌名占位符，提示用户在设置中修改 */
export const DEFAULT_BRAND_TEXT = "你的品牌名";

export const DEFAULT_HEADER_OPTIONS: WechatHeaderOptions = {
  enabled: false,
  style: "magazine-bar",
  brandText: DEFAULT_BRAND_TEXT,
  badgeText: "ISSUE 01",
};

export interface WechatLayoutOptions {
  lineHeight: number;
  sidePadding: number;
  fontPreset: WechatFontPreset;
  colorTheme: WechatColorThemeChoice;
  styleTheme: WechatStyleTheme;
  brandText?: string;
  header?: WechatHeaderOptions;
}

export const DEFAULT_LAYOUT_OPTIONS: WechatLayoutOptions = {
  lineHeight: 1.8,
  sidePadding: 16,
  fontPreset: "default",
  colorTheme: "auto",
  styleTheme: "classic",
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

const wrapInlineContent = (text: string): string => {
  const blockStart = text.search(/<(?:p|ul|ol|div|section|blockquote|pre|table|img)\b/i);
  const inlineEnd = blockStart < 0 ? text.length : blockStart;
  const inlineContent = /^<img\b/i.test(text.slice(inlineEnd))
    ? text.slice(0, inlineEnd).replace(/(?:<br\s*\/?>\s*)+$/gi, "")
    : text.slice(0, inlineEnd);
  return inlineContent.trim()
    ? `<span style="line-height: inherit;">${inlineContent}</span>${text.slice(inlineEnd)}`
    : text;
};

const FOOTER_SEPARATOR_MARKER = "<!-- shuai-footer-separator -->";
let footerSeparatorPending = false;
let activePalette: WechatColorPalette = COLOR_THEMES.classic.palette;
let activeLineHeight = DEFAULT_LAYOUT_OPTIONS.lineHeight;

interface LinkReference {
  label: string;
  url: string;
}

const linkReferences: LinkReference[] = [];
const linkReferenceNumbers = new Map<string, number>();

/** 经典主题的渲染模板，即插件最初的排版风格，颜色全部来自调色板 */
const createClassicHooks = (): WechatThemeHooks => ({
  heading: (text, level) => {
    switch (level) {
      case 1:
        return `<p style="text-align: center; margin: 35px 0 30px 0;"><strong style="color: white; background-color: ${activePalette.headingBackground}; font-size: 24px; font-weight: 600; line-height: 1.6; padding: 20px 30px; display: inline-block;">${wrapInlineContent(text)}</strong></p>`;
      case 2:
        return `<h2 style="color: ${activePalette.headingColor}; font-size: 20px; font-weight: 600; line-height: 1.5; margin: 35px 0 20px 0; padding-bottom: 8px; border-bottom: 2px solid ${activePalette.accent};">${wrapInlineContent(text)}</h2>`;
      case 3:
        return `<h3 style="color: ${activePalette.accent}; font-size: 18px; font-weight: 500; line-height: 1.4; margin: 28px 0 12px 0;">${wrapInlineContent(text)}</h3>`;
      default:
        return `<h${level} style="color: #2a2a2a; font-size: ${20 - level}px; font-weight: 500; line-height: 1.4; margin: 14px 0 8px 0;">${wrapInlineContent(text)}</h${level}>`;
    }
  },
  paragraph: (text) =>
    `<p style="color: #1a1a1a; font-size: 16px; line-height: ${activeLineHeight}; margin: 18px 0;">${wrapInlineContent(text)}</p>`,
  strong: (text) =>
    `<strong style="color: ${activePalette.strongColor}; font-weight: 600;">${text}</strong>`,
  em: (text) => `<em style="color: #555; font-style: italic; font-weight: 500;">${text}</em>`,
  code: (code) =>
    `<pre style="background: #f8f8f8; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 15px 0; overflow-x: auto; font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 14px; line-height: 1.5; color: #333; white-space: pre-wrap;"><code>${escapeHtml(code)}</code></pre>`,
  codespan: (text) =>
    `<code style="background: ${activePalette.codeBackground}; color: ${activePalette.codeColor}; padding: 2px 6px; border-radius: 4px; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 14px;">${text}</code>`,
  blockquote: (quote) =>
    `<blockquote style="background: ${activePalette.blockquoteBackground}; border-left: 4px solid ${activePalette.accent}; margin: 15px 0; padding: 15px 20px; border-radius: 0 8px 8px 0; font-style: italic; color: #444;">${quote}</blockquote>`,
  list: (body, ordered, start) => {
    const type = ordered ? "ol" : "ul";
    const startAttribute = ordered && start !== 1 ? ` start="${start}"` : "";
    return `<${type}${startAttribute} style="margin: 12px 0; padding-left: 30px;">${body}</${type}>`;
  },
  listitem: (text) =>
    `<li style="color: #1a1a1a; font-size: 16px; line-height: ${activeLineHeight}; margin: 8px 0;">${wrapInlineContent(text)}</li>`,
  image: (url, titleAttribute, altAttribute) =>
    `<img src="${url}"${titleAttribute}${altAttribute} style="display: block; max-width: 100%; height: auto; border-radius: 8px; margin: 15px auto; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">`,
  hr: (margin) =>
    `<hr style="border: none; height: 2px; background: linear-gradient(to right, transparent, ${activePalette.hrColor}, transparent); margin: ${margin};">`,
  table: (header, body) =>
    `<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;"><thead>${header}</thead><tbody>${body}</tbody></table>`,
  tablecell: (content, flags) => {
    const type = flags.header ? "th" : "td";
    const style = flags.header
      ? `border: 1px solid #e0e0e0; padding: 10px; text-align: left; background: ${activePalette.tableHeaderBackground}; font-weight: 600; color: #1a1a1a;`
      : "border: 1px solid #e0e0e0; padding: 10px; text-align: left;";
    return `<${type} style="${style}">${content}</${type}>`;
  },
});

const classicHooks = createClassicHooks();

/** 杂志主题二级标题的自动编号，每次渲染前重置 */
let magazineSectionNumber = 0;

/** 杂志主题二级标题上方的品牌小字，每次渲染前从布局选项读取 */
let activeBrandText = "";

export const STYLE_THEMES: Record<WechatStyleTheme, WechatStyleThemeDefinition> = {
  classic: {
    label: "经典",
    description: "稳重通用的默认排版，支持切换全部配色方案。",
    palette: COLOR_THEMES.classic.palette,
    hooks: {},
  },
  minimal: {
    label: "极简",
    description: "黑白灰三色，只靠细线与留白分层，没有任何色块。",
    palette: {
      headingBackground: "#111111",
      headingColor: "#111111",
      accent: "#999999",
      strongColor: "#000000",
      blockquoteBackground: "#ffffff",
      codeColor: "#333333",
      codeBackground: "#f5f5f5",
      tableHeaderBackground: "#ffffff",
      hrColor: "#dddddd",
    },
    hooks: {
      heading: (text, level) => {
        switch (level) {
          case 1:
            return `<h1 style="color: ${activePalette.headingColor}; font-size: 22px; font-weight: 700; line-height: 1.4; letter-spacing: 1px; margin: 44px 0 22px; padding-bottom: 14px; border-bottom: 1px solid #ececec;">${wrapInlineContent(text)}</h1>`;
          case 2:
            return `<h2 style="color: ${activePalette.headingColor}; font-size: 17px; font-weight: 600; line-height: 1.5; letter-spacing: 0.5px; margin: 34px 0 14px;">${wrapInlineContent(text)}</h2>`;
          case 3:
            return `<h3 style="color: #777777; font-size: 15px; font-weight: 600; line-height: 1.4; letter-spacing: 2px; margin: 26px 0 10px;">${wrapInlineContent(text)}</h3>`;
          default:
            return `<h${level} style="color: #444444; font-size: ${20 - level}px; font-weight: 600; line-height: 1.4; margin: 14px 0 8px;">${wrapInlineContent(text)}</h${level}>`;
        }
      },
      paragraph: (text) =>
        `<p style="color: #444444; font-size: 15px; line-height: ${activeLineHeight}; margin: 16px 0;">${wrapInlineContent(text)}</p>`,
      em: (text) => `<em style="color: #888888; font-style: italic;">${text}</em>`,
      code: (code) =>
        `<pre style="background: #fafafa; border: 1px solid #eeeeee; padding: 15px; margin: 15px 0; overflow-x: auto; font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 14px; line-height: 1.5; color: #333333; white-space: pre-wrap;"><code>${escapeHtml(code)}</code></pre>`,
      blockquote: (quote) =>
        `<blockquote style="margin: 20px 0; padding: 4px 0 4px 16px; border-left: 1px solid ${activePalette.accent}; color: #888888;">${quote}</blockquote>`,
      listitem: (text) =>
        `<li style="color: #444444; font-size: 15px; line-height: ${activeLineHeight}; margin: 6px 0;">${wrapInlineContent(text)}</li>`,
      image: (url, titleAttribute, altAttribute) =>
        `<img src="${url}"${titleAttribute}${altAttribute} style="display: block; max-width: 100%; height: auto; margin: 20px auto;">`,
      hr: (margin) =>
        `<hr style="border: none; border-top: 1px solid ${activePalette.hrColor}; margin: ${margin};">`,
      table: (header, body) =>
        `<table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; border-top: 2px solid ${activePalette.headingColor}; border-bottom: 2px solid ${activePalette.headingColor};"><thead>${header}</thead><tbody>${body}</tbody></table>`,
      tablecell: (content, flags) => {
        const type = flags.header ? "th" : "td";
        const style = flags.header
          ? `padding: 10px 12px; text-align: left; border-bottom: 1px solid ${activePalette.headingColor}; font-weight: 600; color: ${activePalette.headingColor};`
          : "padding: 10px 12px; text-align: left; border-bottom: 1px solid #eeeeee; color: #444444;";
        return `<${type} style="${style}">${content}</${type}>`;
      },
    },
  },
  trend: {
    label: "新锐",
    description: "克莱因蓝配粗黑标题，荧光标记与深色代码块，现代潮流感。",
    palette: {
      headingBackground: "#111111",
      headingColor: "#111111",
      accent: "#1e50ff",
      strongColor: "#1e50ff",
      blockquoteBackground: "#f5f7ff",
      codeColor: "#1e50ff",
      codeBackground: "#eef2ff",
      tableHeaderBackground: "#111111",
      hrColor: "#1e50ff",
    },
    hooks: {
      heading: (text, level) => {
        switch (level) {
          case 1:
            return `<h1 style="color: #111111; font-size: 24px; font-weight: 900; line-height: 1.35; letter-spacing: -0.5px; margin: 40px 0 22px; padding-left: 14px; border-left: 6px solid ${activePalette.accent};">${wrapInlineContent(text)}</h1>`;
          case 2:
            return `<h2 style="color: #111111; font-size: 19px; font-weight: 800; line-height: 1.5; margin: 34px 0 16px;"><span style="background: linear-gradient(to bottom, transparent 58%, ${hexToRgba(activePalette.accent, 0.28)} 58%); padding: 0 2px;">${wrapInlineContent(text)}</span></h2>`;
          case 3:
            return `<h3 style="color: ${activePalette.accent}; font-size: 16px; font-weight: 700; line-height: 1.4; letter-spacing: 0.5px; margin: 28px 0 12px;">${wrapInlineContent(text)}</h3>`;
          default:
            return `<h${level} style="color: #111111; font-size: ${21 - level}px; font-weight: 700; line-height: 1.4; margin: 16px 0 10px;">${wrapInlineContent(text)}</h${level}>`;
        }
      },
      paragraph: (text) =>
        `<p style="color: #242424; font-size: 16px; line-height: ${activeLineHeight}; margin: 18px 0;">${wrapInlineContent(text)}</p>`,
      em: (text) => `<em style="color: #666666; font-style: italic;">${text}</em>`,
      code: (code) =>
        `<pre style="background: #111827; padding: 16px; margin: 16px 0; overflow-x: auto; font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 14px; line-height: 1.6; color: #e5e7eb; white-space: pre-wrap;"><code>${escapeHtml(code)}</code></pre>`,
      blockquote: (quote) =>
        `<blockquote style="background: ${activePalette.blockquoteBackground}; border-left: 3px solid ${activePalette.accent}; margin: 18px 0; padding: 14px 18px; color: #444444;">${quote}</blockquote>`,
      list: (body, ordered, start) => {
        if (ordered) {
          const startAttribute = start !== 1 ? ` start="${start}"` : "";
          return `<ol${startAttribute} style="margin: 12px 0; padding-left: 26px;">${body}</ol>`;
        }
        const bullet = `<span style="color: ${activePalette.accent}; font-size: 12px; margin-right: 8px;">▪</span>`;
        const withBullets = body.replace(
          /<li style="[^"]*">(?!<span style="color: )/g,
          (li) => `${li}${bullet}`,
        );
        return `<ul style="list-style: none; margin: 12px 0; padding-left: 4px;">${withBullets}</ul>`;
      },
      listitem: (text) =>
        `<li style="color: #242424; font-size: 16px; line-height: ${activeLineHeight}; margin: 8px 0;">${wrapInlineContent(text)}</li>`,
      image: (url, titleAttribute, altAttribute) =>
        `<img src="${url}"${titleAttribute}${altAttribute} style="display: block; max-width: 100%; height: auto; margin: 18px auto; border-radius: 12px;">`,
      tablecell: (content, flags) => {
        const type = flags.header ? "th" : "td";
        const style = flags.header
          ? `border: 1px solid ${activePalette.headingBackground}; padding: 10px 12px; text-align: left; background: ${activePalette.headingBackground}; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;`
          : "border: 1px solid #e5e5e5; padding: 10px 12px; text-align: left; color: #242424;";
        return `<${type} style="${style}">${content}</${type}>`;
      },
    },
  },
  magazine: {
    label: "杂志",
    description: "珊瑚橙主色，大号数字章节标题，杂志画报感。",
    palette: {
      headingBackground: "#e8845c",
      headingColor: "#1a1a1a",
      accent: "#e8845c",
      strongColor: "#1a1a1a",
      blockquoteBackground: "#faf6f1",
      codeColor: "#3a3a3a",
      codeBackground: "#f3f0ec",
      tableHeaderBackground: "#e8845c",
      hrColor: "#e8845c",
    },
    hooks: {
      heading: (text, level) => {
        switch (level) {
          case 1:
            return `<h1 style="color: #1a1a1a; font-size: 26px; font-weight: 900; line-height: 1.35; letter-spacing: -0.5px; margin: 38px 0 20px; padding-top: 16px; border-top: 3px solid ${activePalette.accent};">${wrapInlineContent(text)}</h1>`;
          case 2: {
            magazineSectionNumber += 1;
            const number = String(magazineSectionNumber).padStart(2, "0");
            const kicker = activeBrandText
              ? `<section style="margin-bottom: 4px;"><span style="font-size: 9px; color: ${activePalette.accent}; letter-spacing: 3px; font-weight: 800;">${escapeHtml(activeBrandText)}</span></section>`
              : "";
            return `<section style="display: flex; align-items: flex-end; gap: 16px; margin: 42px 0 22px; padding-bottom: 12px; border-bottom: 1px solid #e5e5e5;"><section style="flex-shrink: 0;">${kicker}<span style="display: block; font-size: 44px; font-weight: 900; color: #d4d4d4; line-height: 0.9; letter-spacing: -2px; font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;">${number}</span></section><span style="flex: 1; font-size: 20px; font-weight: 800; color: #1a1a1a; line-height: 1.3;">${wrapInlineContent(text)}</span></section>`;
          }
          case 3:
            return `<h3 style="color: ${activePalette.accent}; font-size: 16px; font-weight: 800; line-height: 1.4; letter-spacing: 0.5px; margin: 30px 0 14px;">${wrapInlineContent(text)}</h3>`;
          default:
            return `<h${level} style="color: #1a1a1a; font-size: ${21 - level}px; font-weight: 700; line-height: 1.4; margin: 16px 0 10px;">${wrapInlineContent(text)}</h${level}>`;
        }
      },
      paragraph: (text) =>
        `<p style="color: #3a3a3a; font-size: 15px; line-height: ${activeLineHeight}; margin: 16px 0;">${wrapInlineContent(text)}</p>`,
      em: (text) => `<em style="color: #8c7a70; font-style: italic;">${text}</em>`,
      code: (code) =>
        `<pre style="background: ${activePalette.codeBackground}; border: 1px solid #e5e5e5; padding: 15px; margin: 15px 0; overflow-x: auto; font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 14px; line-height: 1.5; color: #3a3a3a; white-space: pre-wrap;"><code>${escapeHtml(code)}</code></pre>`,
      codespan: (text) =>
        `<code style="background: ${activePalette.codeBackground}; color: #1a1a1a; padding: 2px 10px; border-radius: 6px; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 0.92em; font-weight: 600; margin: 0 2px;">${text}</code>`,
      blockquote: (quote) =>
        `<blockquote style="background: ${activePalette.blockquoteBackground}; border-left: 3px solid ${activePalette.accent}; margin: 18px 0; padding: 14px 18px; color: #4a4a4a;">${quote}</blockquote>`,
      list: (body, ordered, start) => {
        if (ordered) {
          const startAttribute = start !== 1 ? ` start="${start}"` : "";
          return `<ol${startAttribute} style="margin: 12px 0; padding-left: 26px;">${body}</ol>`;
        }
        const bullet = `<span style="color: ${activePalette.accent}; font-size: 12px; margin-right: 8px;">●</span>`;
        const withBullets = body.replace(
          /<li style="[^"]*">(?!<span style="color: )/g,
          (li) => `${li}${bullet}`,
        );
        return `<ul style="list-style: none; margin: 12px 0; padding-left: 4px;">${withBullets}</ul>`;
      },
      listitem: (text) =>
        `<li style="color: #3a3a3a; font-size: 15px; line-height: ${activeLineHeight}; margin: 8px 0;">${wrapInlineContent(text)}</li>`,
      image: (url, titleAttribute, altAttribute) =>
        `<img src="${url}"${titleAttribute}${altAttribute} style="display: block; box-sizing: border-box; max-width: 100%; height: auto; margin: 18px auto; border: 2px solid ${activePalette.accent}; border-radius: 16px;">`,
      hr: (margin) =>
        `<hr style="border: none; height: 4px; border-top: 1px solid ${activePalette.accent}; border-bottom: 1px solid #e5e5e5; margin: ${margin};">`,
      table: (header, body) => {
        let rowIndex = 0;
        const zebraBody = body.replace(
          /<tr>/g,
          () => `<tr style="background: ${rowIndex++ % 2 === 0 ? "#fafaf7" : "#ffffff"};">`,
        );
        return `<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; border: 1px solid #e5e5e5;"><thead>${header}</thead><tbody>${zebraBody}</tbody></table>`;
      },
      tablecell: (content, flags) => {
        const type = flags.header ? "th" : "td";
        const style = flags.header
          ? `padding: 10px 12px; font-size: 13px; font-weight: 700; color: #ffffff; background: ${activePalette.accent}; text-align: left; letter-spacing: 0.5px;`
          : "padding: 10px 12px; font-size: 13.5px; color: #3a3a3a; line-height: 1.7; border-bottom: 1px solid #e5e5e5; vertical-align: top;";
        return `<${type} style="${style}">${content}</${type}>`;
      },
    },
  },
};

export const STYLE_THEME_KEYS = Object.keys(STYLE_THEMES) as WechatStyleTheme[];

export const normalizeStyleTheme = (value: unknown): WechatStyleTheme =>
  typeof value === "string" && value in STYLE_THEMES ? (value as WechatStyleTheme) : "classic";

let activeHooks: WechatThemeHooks = classicHooks;

const renderer = new marked.Renderer();

renderer.heading = (text, level) => activeHooks.heading(text, level);

renderer.paragraph = (text) => activeHooks.paragraph(text);

renderer.strong = (text) => activeHooks.strong(text);
renderer.em = (text) => activeHooks.em(text);

renderer.code = (code) => activeHooks.code(code);

renderer.codespan = (text) => activeHooks.codespan(text);

renderer.blockquote = (quote) => activeHooks.blockquote(quote);

renderer.list = (body, ordered, start) => activeHooks.list(body, ordered, start);

renderer.listitem = (text) => activeHooks.listitem(text);

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
  return activeHooks.image(url, titleAttribute, altAttribute);
};

renderer.hr = () => {
  const margin = footerSeparatorPending ? "42px 0" : "25px 0";
  footerSeparatorPending = false;
  return activeHooks.hr(margin);
};

renderer.table = (header, body) => activeHooks.table(header, body);

renderer.tablerow = (content) => `<tr>${content}</tr>`;

renderer.tablecell = (content, flags) => activeHooks.tablecell(content, flags);

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

/** 渲染文章开头栏，颜色跟随当前主题的主色调 */
const renderHeader = (header: WechatHeaderOptions | undefined, accent: string): string => {
  if (!header?.enabled) return "";

  const brand = escapeHtml(header.brandText.trim());
  const badge = escapeHtml(header.badgeText.trim());

  switch (normalizeHeaderStyle(header.style)) {
    case "magazine-bar": {
      if (!brand && !badge) return "";
      const brandSpan = brand
        ? `<span style="font-size: 12px; font-weight: 800; letter-spacing: 4px; color: ${accent};">${brand}</span>`
        : "";
      const badgeSpan = badge
        ? `<span style="font-size: 10px; background: ${accent}; color: #ffffff; padding: 4px 12px; letter-spacing: 2px; font-weight: 700; border-radius: 4px;">${badge}</span>`
        : "";
      return `<section style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid ${accent}; border-bottom: 1px solid #e5e5e5; padding: 10px 0; margin-bottom: 26px;">${brandSpan}${badgeSpan}</section>`;
    }
    case "minimal-caption": {
      if (!brand) return "";
      return `<p style="margin: 0 0 26px; padding-bottom: 12px; border-bottom: 1px solid #ececec; color: #999999; font-size: 12px; letter-spacing: 3px;">${brand}</p>`;
    }
    case "center-badge": {
      const text = badge || brand;
      if (!text) return "";
      return `<p style="text-align: center; margin: 4px 0 28px;"><span style="background: ${accent}; color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 2px; padding: 5px 16px; border-radius: 999px;">${text}</span></p>`;
    }
  }
};

const renderLinkReferences = (): string => {
  if (!linkReferences.length) return "";

  const items = linkReferences
    .map(
      ({ label, url }, index) =>
        `<li style="color: #555; font-size: 13px; line-height: ${activeLineHeight}; margin: 10px 0; word-break: break-all;"><span style="line-height: inherit;"><span style="color: ${activePalette.strongColor}; font-weight: 600;">[${index + 1}] ${label}</span><br><span style="color: #777;">${url}</span></span></li>`,
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
  magazineSectionNumber = 0;
  activeBrandText =
    typeof layout.brandText === "string" ? layout.brandText.trim() : DEFAULT_BRAND_TEXT;
  const styleTheme = normalizeStyleTheme(layout.styleTheme);
  const styleDefinition = STYLE_THEMES[styleTheme];
  const colorChoice = normalizeColorThemeChoice(layout.colorTheme);
  activePalette =
    colorChoice === "auto" ? styleDefinition.palette : COLOR_THEMES[colorChoice].palette;
  activeHooks = { ...classicHooks, ...styleDefinition.hooks };
  const lineHeight = normalizeLineHeight(layout.lineHeight ?? DEFAULT_LAYOUT_OPTIONS.lineHeight);
  activeLineHeight = lineHeight;
  const html = marked.parse(stripFrontmatter(markdown)).trim();
  const sidePadding = normalizeSidePadding(
    layout.sidePadding ?? DEFAULT_LAYOUT_OPTIONS.sidePadding,
  );
  const fontFamily = FONT_FAMILIES[normalizeFontPreset(layout.fontPreset)];
  const fontStyle = fontFamily ? ` font-family: ${fontFamily};` : "";
  const headerHtml = renderHeader(layout.header, activePalette.accent);
  return `<section style="line-height: ${lineHeight}; padding-left: ${sidePadding}px; padding-right: ${sidePadding}px;${fontStyle}">${headerHtml}${html}${renderLinkReferences()}</section>`;
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
