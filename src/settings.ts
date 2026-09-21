import { App, PluginSettingTab, Setting } from "obsidian";
import {
  COLOR_THEMES,
  COLOR_THEME_KEYS,
  DEFAULT_LAYOUT_OPTIONS,
  WechatColorTheme,
  WechatFontPreset,
} from "./formatter";
import type WechatFormatterPlugin from "./main";

export interface WechatFormatterSettings {
  footerEnabled: boolean;
  footerMarkdown: string;
  previewOpenMode: "split" | "tab";
  defaultLineHeight: number;
  defaultSidePadding: number;
  defaultFontPreset: WechatFontPreset;
  defaultColorTheme: WechatColorTheme;
}

export const DEFAULT_SETTINGS: WechatFormatterSettings = {
  footerEnabled: false,
  footerMarkdown: "",
  previewOpenMode: "split",
  defaultLineHeight: DEFAULT_LAYOUT_OPTIONS.lineHeight,
  defaultSidePadding: DEFAULT_LAYOUT_OPTIONS.sidePadding,
  defaultFontPreset: DEFAULT_LAYOUT_OPTIONS.fontPreset,
  defaultColorTheme: DEFAULT_LAYOUT_OPTIONS.colorTheme,
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

    new Setting(containerEl)
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

    new Setting(containerEl)
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

    new Setting(containerEl)
      .setName("默认配色方案")
      .setDesc("预览首次打开和复制时使用的配色，可在预览页面临时切换。")
      .addDropdown((dropdown) => {
        for (const key of COLOR_THEME_KEYS) {
          dropdown.addOption(key, COLOR_THEMES[key].label);
        }
        dropdown
          .setValue(this.plugin.settings.defaultColorTheme)
          .onChange(async (value) => {
            await this.plugin.setDefaultColorTheme(value);
          });
      });

    new Setting(containerEl)
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

    new Setting(containerEl)
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

    new Setting(containerEl)
      .setName("启用结尾钩子")
      .setDesc("复制和预览时，在正文末尾追加分隔线与配置的 Markdown 内容。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.footerEnabled).onChange(async (value) => {
          await this.plugin.setFooterEnabled(value);
        }),
      );

    const footerSetting = new Setting(containerEl)
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
}
