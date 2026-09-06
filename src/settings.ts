import { App, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_LAYOUT_OPTIONS } from "./formatter";
import type WechatFormatterPlugin from "./main";

export interface WechatFormatterSettings {
  footerEnabled: boolean;
  footerMarkdown: string;
  previewOpenMode: "split" | "tab";
  defaultLineHeight: number;
  defaultSidePadding: number;
}

export const DEFAULT_SETTINGS: WechatFormatterSettings = {
  footerEnabled: false,
  footerMarkdown: "",
  previewOpenMode: "split",
  defaultLineHeight: DEFAULT_LAYOUT_OPTIONS.lineHeight,
  defaultSidePadding: DEFAULT_LAYOUT_OPTIONS.sidePadding,
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
      .setName("默认行间距")
      .setDesc("预览首次打开时使用的正文行高，可在预览页临时调整。")
      .addSlider((slider) =>
        slider
          .setLimits(1.2, 2.5, 0.1)
          .setValue(this.plugin.settings.defaultLineHeight)
          .setDynamicTooltip()
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
          .setDynamicTooltip()
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
