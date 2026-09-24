import { App, PluginSettingTab, Setting } from "obsidian";
import {
  COLOR_THEMES,
  COLOR_THEME_KEYS,
  DEFAULT_HEADER_OPTIONS,
  DEFAULT_LAYOUT_OPTIONS,
  HEADER_STYLES,
  HEADER_STYLE_KEYS,
  normalizeHeaderStyle,
  STYLE_THEMES,
  STYLE_THEME_KEYS,
  WechatColorThemeChoice,
  WechatFontPreset,
  WechatHeaderStyle,
  WechatStyleTheme,
} from "./formatter";
import type WechatFormatterPlugin from "./main";

export interface WechatFormatterSettings {
  footerEnabled: boolean;
  footerMarkdown: string;
  previewOpenMode: "split" | "tab";
  defaultLineHeight: number;
  defaultSidePadding: number;
  defaultFontPreset: WechatFontPreset;
  defaultColorTheme: WechatColorThemeChoice;
  defaultStyleTheme: WechatStyleTheme;
  brandText: string;
  headerEnabled: boolean;
  headerStyle: WechatHeaderStyle;
  headerBadgeText: string;
  settingsVersion: number;
}

export const DEFAULT_SETTINGS: WechatFormatterSettings = {
  footerEnabled: false,
  footerMarkdown: "",
  previewOpenMode: "split",
  defaultLineHeight: DEFAULT_LAYOUT_OPTIONS.lineHeight,
  defaultSidePadding: DEFAULT_LAYOUT_OPTIONS.sidePadding,
  defaultFontPreset: DEFAULT_LAYOUT_OPTIONS.fontPreset,
  defaultColorTheme: DEFAULT_LAYOUT_OPTIONS.colorTheme,
  defaultStyleTheme: DEFAULT_LAYOUT_OPTIONS.styleTheme,
  brandText: DEFAULT_HEADER_OPTIONS.brandText,
  headerEnabled: DEFAULT_HEADER_OPTIONS.enabled,
  headerStyle: DEFAULT_HEADER_OPTIONS.style,
  headerBadgeText: DEFAULT_HEADER_OPTIONS.badgeText,
  settingsVersion: 2,
};

export class WechatFormatterSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: WechatFormatterPlugin,
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("wechat-formatter-settings");

    const pageHeading = new Setting(containerEl).setName("微信公众号排版").setHeading();
    pageHeading.settingEl.addClass("wechat-formatter-settings-title");
    containerEl.createEl("p", {
      cls: "wechat-formatter-settings-intro",
      text: "设置预览打开方式、默认排版和文章结尾内容。预览页中的临时调整不会覆盖这里的默认值。",
    });

    const previewSection = this.createSection(containerEl, "预览");

    new Setting(previewSection)
      .setName("预览打开方式")
      .setDesc("选择点击预览或复制按钮后，公众号预览出现的位置。")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("split", "右侧分栏")
          .addOption("tab", "新标签页")
          .setValue(this.plugin.settings.previewOpenMode)
          .onChange(async (value) => {
            await this.plugin.setPreviewOpenMode(value === "tab" ? "tab" : "split");
          }),
      );

    const typographySection = this.createSection(containerEl, "默认排版");

    new Setting(typographySection)
      .setName("正文字体")
      .setDesc("用于预览和复制后的正文；代码块仍使用等宽字体。实际显示取决于设备已安装的字体。")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("default", "跟随编辑器（默认）")
          .addOption("sans", "无衬线（苹方 / 微软雅黑）")
          .addOption("serif", "衬线（宋体）")
          .setValue(this.plugin.settings.defaultFontPreset)
          .onChange(async (value) => {
            await this.plugin.setDefaultFontPreset(value);
          }),
      );

    new Setting(typographySection)
      .setName("主题风格")
      .setDesc("整套排版风格：经典支持自由配色；极简、新锐、杂志为固定视觉设计。")
      .addDropdown((dropdown) => {
        for (const key of STYLE_THEME_KEYS) {
          dropdown.addOption(key, `${STYLE_THEMES[key].label} — ${STYLE_THEMES[key].description}`);
        }
        dropdown
          .setValue(this.plugin.settings.defaultStyleTheme)
          .onChange(async (value) => {
            await this.plugin.setDefaultStyleTheme(value);
          });
      });

    new Setting(typographySection)
      .setName("默认配色方案")
      .setDesc("控制所有主题的主色调；选择“跟随主题”时使用每套主题自带的颜色。")
      .addDropdown((dropdown) => {
        dropdown.addOption("auto", "跟随主题（默认）");
        for (const key of COLOR_THEME_KEYS) {
          dropdown.addOption(key, COLOR_THEMES[key].label);
        }
        dropdown
          .setValue(this.plugin.settings.defaultColorTheme)
          .onChange(async (value) => {
            await this.plugin.setDefaultColorTheme(value);
          });
      });

    new Setting(typographySection)
      .setName("默认行间距")
      .setDesc("预览首次打开时使用的正文行高，可在预览页临时调整。")
      .addSlider((slider) =>
        slider
          .setLimits(1.2, 2.5, 0.1)
          .setValue(this.plugin.settings.defaultLineHeight)
          .onChange(async (value) => {
            await this.plugin.setDefaultLineHeight(value);
          }),
      );

    new Setting(typographySection)
      .setName("默认页边距")
      .setDesc("预览首次打开时使用的左右内边距，单位为 px。")
      .addSlider((slider) =>
        slider
          .setLimits(0, 48, 2)
          .setValue(this.plugin.settings.defaultSidePadding)
          .onChange(async (value) => {
            await this.plugin.setDefaultSidePadding(value);
          }),
      );

    const headerSection = this.createSection(containerEl, "开头与品牌");

    new Setting(headerSection)
      .setName("品牌名")
      .setDesc("显示在杂志主题每个章节标题的上方，也用于开头刊头栏的左侧文字。")
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_HEADER_OPTIONS.brandText)
          .setValue(this.plugin.settings.brandText)
          .onChange(async (value) => {
            await this.plugin.setBrandText(value);
          }),
      );

    new Setting(headerSection)
      .setName("启用开头刊头")
      .setDesc("复制和预览时，在正文开头插入一条刊头栏，可在预览页面临时开关。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.headerEnabled).onChange(async (value) => {
          await this.plugin.setHeaderEnabled(value);
        }),
      );

    new Setting(headerSection)
      .setName("开头样式")
      .setDesc("刊头栏的视觉样式，颜色会跟随当前主题的主色调。")
      .addDropdown((dropdown) => {
        for (const key of HEADER_STYLE_KEYS) {
          dropdown.addOption(key, `${HEADER_STYLES[key].label} — ${HEADER_STYLES[key].description}`);
        }
        dropdown
          .setValue(normalizeHeaderStyle(this.plugin.settings.headerStyle))
          .onChange(async (value) => {
            await this.plugin.setHeaderStyle(value);
          });
      });

    new Setting(headerSection)
      .setName("徽章文字")
      .setDesc("杂志顶栏右侧的徽章，或居中徽章样式的文字；留空则不显示徽章。")
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_HEADER_OPTIONS.badgeText)
          .setValue(this.plugin.settings.headerBadgeText)
          .onChange(async (value) => {
            await this.plugin.setHeaderBadgeText(value);
          }),
      );

    const footerSection = this.createSection(containerEl, "结尾内容");

    new Setting(footerSection)
      .setName("启用结尾钩子")
      .setDesc("复制和预览时，在正文末尾追加分隔线与配置的 Markdown 内容。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.footerEnabled).onChange(async (value) => {
          await this.plugin.setFooterEnabled(value);
        }),
      );

    const footerSetting = new Setting(footerSection)
      .setName("结尾钩子 Markdown")
      .setDesc("适合填写社群、产品、联系方式或广告位。插件会在它前面自动添加一条可见分隔线。")
      .addTextArea((textArea) => {
        textArea
          .setPlaceholder("### 加入社群\n\n扫码或点击链接，获取更多内容。")
          .setValue(this.plugin.settings.footerMarkdown)
          .onChange(async (value) => {
            await this.plugin.setFooterMarkdown(value);
          });
        textArea.inputEl.addClass("wechat-formatter-settings-textarea");
      });
    footerSetting.settingEl.addClass("wechat-formatter-footer-setting");
  }

  private createSection(containerEl: HTMLElement, title: string): HTMLElement {
    const section = containerEl.createEl("section", {
      cls: "wechat-formatter-settings-section",
    });
    const header = section.createDiv({ cls: "wechat-formatter-settings-section-header" });
    new Setting(header).setName(title).setHeading();
    return section.createDiv({ cls: "wechat-formatter-settings-section-content" });
  }
}
