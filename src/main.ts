import {
  addIcon,
  Editor,
  ItemView,
  MarkdownFileInfo,
  MarkdownView,
  Notice,
  Plugin,
  TFile,
  WorkspaceLeaf,
} from "obsidian";
import WECHAT_COPY_ICON from "../assets/plugin-icon.svg";
import { appendFooterMarkdown, formatMarkdownForWechat, optimizeForWechat } from "./formatter";
import {
  DEFAULT_SETTINGS,
  WechatFormatterSettings,
  WechatFormatterSettingTab,
} from "./settings";

const VIEW_TYPE = "wechat-official-account-preview";
const ICON_ID = "wechat-copy";

class WechatPreviewView extends ItemView {
  private noteNameEl: HTMLElement | null = null;
  private previewEl: HTMLElement | null = null;
  private footerToggleButton: HTMLButtonElement | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: WechatFormatterPlugin,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "公众号预览";
  }

  getIcon(): string {
    return ICON_ID;
  }

  async onOpen(): Promise<void> {
    this.contentEl.empty();
    this.contentEl.addClass("wechat-formatter-view");

    const toolbar = this.contentEl.createDiv({ cls: "wechat-formatter-toolbar" });
    const heading = toolbar.createDiv({ cls: "wechat-formatter-heading" });
    heading.createEl("strong", { text: "公众号预览" });
    this.noteNameEl = heading.createEl("span", { cls: "wechat-formatter-note-name" });

    const actions = toolbar.createDiv({ cls: "wechat-formatter-actions" });
    this.footerToggleButton = actions.createEl("button", {
      cls: "wechat-formatter-hook-toggle",
      text: "结尾钩子",
    });
    this.footerToggleButton.addEventListener("click", () => {
      void this.plugin.setFooterEnabled(!this.plugin.settings.footerEnabled);
    });

    const copyButton = actions.createEl("button", {
      cls: "mod-cta wechat-formatter-copy",
      text: "复制公众号格式",
    });
    copyButton.addEventListener("click", () => void this.plugin.copyCurrentNote());

    this.previewEl = this.contentEl.createDiv({ cls: "wechat-formatter-preview" });
    this.render(this.plugin.getCurrentMarkdown(), this.plugin.getCurrentFile());
  }

  render(markdown: string, file: TFile | null): void {
    if (!this.previewEl || !this.noteNameEl) return;

    this.noteNameEl.setText(file?.basename ?? "未打开 Markdown 笔记");
    this.updateFooterToggle();
    this.previewEl.empty();

    if (!markdown.trim()) {
      const empty = this.previewEl.createDiv({ cls: "wechat-formatter-empty" });
      empty.createDiv({ cls: "wechat-formatter-empty-icon", text: "文" });
      empty.createEl("p", { text: "打开或输入一篇 Markdown 笔记后，这里会显示公众号效果。" });
      return;
    }

    const content = this.previewEl.createDiv({ cls: "wechat-formatter-content" });
    content.innerHTML = formatMarkdownForWechat(this.plugin.composeMarkdown(markdown));
    this.previewEl.scrollTop = 0;
  }

  private updateFooterToggle(): void {
    if (!this.footerToggleButton) return;

    const configured = this.plugin.hasFooterMarkdown();
    const enabled = configured && this.plugin.settings.footerEnabled;
    this.footerToggleButton.disabled = !configured;
    this.footerToggleButton.setText(
      configured ? `结尾钩子：${enabled ? "开" : "关"}` : "结尾钩子：未配置",
    );
    this.footerToggleButton.classList.toggle("is-active", enabled);
    this.footerToggleButton.setAttribute(
      "aria-pressed",
      enabled ? "true" : "false",
    );
    this.footerToggleButton.setAttribute(
      "title",
      configured ? "控制预览和复制是否包含结尾钩子" : "请先在插件设置中填写结尾钩子",
    );
  }
}

export default class WechatFormatterPlugin extends Plugin {
  settings!: WechatFormatterSettings;
  private currentMarkdown = "";
  private currentFile: TFile | null = null;
  private refreshTimer: number | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();
    addIcon(ICON_ID, WECHAT_COPY_ICON);
    this.registerView(VIEW_TYPE, (leaf) => new WechatPreviewView(leaf, this));
    this.addSettingTab(new WechatFormatterSettingTab(this.app, this));

    this.addRibbonIcon(ICON_ID, "复制为公众号格式", () => {
      void this.copyCurrentNote(true);
    });

    this.addCommand({
      id: "copy-active-note-as-wechat-rich-text",
      name: "复制当前笔记为公众号格式",
      checkCallback: (checking) => {
        if (!this.getActiveMarkdownEditor()) return false;
        if (!checking) void this.copyCurrentNote(true);
        return true;
      },
    });

    this.addCommand({
      id: "open-wechat-preview",
      name: "打开公众号预览",
      callback: () => void this.openPreview(),
    });

    this.registerEvent(
      this.app.workspace.on("editor-change", (editor, info) => {
        this.captureEditor(editor, info);
        this.scheduleRefresh();
      }),
    );

    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        void this.captureFile(file);
      }),
    );

    this.app.workspace.onLayoutReady(() => {
      const active = this.getActiveMarkdownEditor();
      if (active?.editor) this.captureEditor(active.editor, active);
      else void this.captureFile(this.app.workspace.getActiveFile());
    });
  }

  onunload(): void {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  getCurrentMarkdown(): string {
    const active = this.getActiveMarkdownEditor();
    if (active?.editor) {
      this.captureEditor(active.editor, active);
    }
    return this.currentMarkdown;
  }

  getCurrentFile(): TFile | null {
    return this.currentFile;
  }

  composeMarkdown(markdown: string): string {
    return appendFooterMarkdown(
      markdown,
      this.settings.footerMarkdown,
      this.settings.footerEnabled,
    );
  }

  hasFooterMarkdown(): boolean {
    return Boolean(this.settings.footerMarkdown.trim());
  }

  async setFooterEnabled(enabled: boolean): Promise<void> {
    this.settings.footerEnabled = enabled;
    await this.saveSettings();
    this.refreshViews();
  }

  async setFooterMarkdown(markdown: string): Promise<void> {
    this.settings.footerMarkdown = markdown;
    await this.saveSettings();
    this.refreshViews();
  }

  async setPreviewOpenMode(mode: "split" | "tab"): Promise<void> {
    if (this.settings.previewOpenMode === mode) return;
    this.settings.previewOpenMode = mode;
    await this.saveSettings();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async copyCurrentNote(openPreview = false): Promise<void> {
    const markdown = this.getCurrentMarkdown();

    if (!markdown.trim()) {
      new Notice("请先打开一篇有内容的 Markdown 笔记");
      if (openPreview) await this.openPreview();
      return;
    }

    const html = optimizeForWechat(formatMarkdownForWechat(this.composeMarkdown(markdown)));
    const plainText = this.htmlToPlainText(html);

    try {
      await this.writeRichText(html, plainText);
      new Notice("已复制公众号格式，可直接粘贴到编辑器");
    } catch (error) {
      console.error("微信公众号格式助手：复制失败", error);
      new Notice("复制失败，请在公众号预览中重试");
    }

    if (openPreview) await this.openPreview();
  }

  async openPreview(): Promise<void> {
    const previewLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE);
    const existingLeaf = previewLeaves.find((leaf) => leaf.getRoot() === this.app.workspace.rootSplit);

    for (const leaf of previewLeaves) {
      if (leaf !== existingLeaf) leaf.detach();
    }

    const leaf =
      existingLeaf ??
      (this.settings.previewOpenMode === "tab"
        ? this.app.workspace.getLeaf("tab")
        : this.app.workspace.getLeaf("split", "vertical"));

    if (!existingLeaf) {
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }

    await this.app.workspace.revealLeaf(leaf);
    this.refreshViews();
  }

  private getActiveMarkdownEditor(): MarkdownFileInfo | MarkdownView | null {
    const activeEditor = this.app.workspace.activeEditor;
    if (activeEditor?.editor && activeEditor.file?.extension === "md") return activeEditor;

    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView?.file?.extension === "md") return activeView;

    const matchingView = this.app.workspace
      .getLeavesOfType("markdown")
      .map((leaf) => leaf.view)
      .find(
        (view): view is MarkdownView =>
          view instanceof MarkdownView && view.file?.path === this.currentFile?.path,
      );
    return matchingView ?? null;
  }

  private captureEditor(editor: Editor, info: MarkdownFileInfo | MarkdownView): void {
    if (info.file?.extension !== "md") return;
    this.currentMarkdown = editor.getValue();
    this.currentFile = info.file;
  }

  private async captureFile(file: TFile | null): Promise<void> {
    if (!file || file.extension !== "md") return;
    const markdown = await this.app.vault.cachedRead(file);
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile && activeFile.path !== file.path) return;

    this.currentFile = file;
    this.currentMarkdown = markdown;
    this.refreshViews();
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer !== null) window.clearTimeout(this.refreshTimer);
    this.refreshTimer = window.setTimeout(() => {
      this.refreshTimer = null;
      this.refreshViews();
    }, 250);
  }

  private refreshViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      if (leaf.view instanceof WechatPreviewView) {
        leaf.view.render(this.currentMarkdown, this.currentFile);
      }
    }
  }

  private async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  private async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private htmlToPlainText(html: string): string {
    const element = document.createElement("div");
    element.innerHTML = html;
    return element.innerText;
  }

  private async writeRichText(html: string, plainText: string): Promise<void> {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plainText], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      return;
    }

    const selection = window.getSelection();
    const previousRanges: Range[] = [];
    if (selection) {
      for (let index = 0; index < selection.rangeCount; index += 1) {
        previousRanges.push(selection.getRangeAt(index));
      }
    }

    const clipboardEl = document.body.createDiv({ cls: "wechat-formatter-clipboard" });
    clipboardEl.innerHTML = html;
    clipboardEl.contentEditable = "true";
    const range = document.createRange();
    range.selectNodeContents(clipboardEl);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const copied = document.execCommand("copy");
    clipboardEl.remove();
    selection?.removeAllRanges();
    for (const previousRange of previousRanges) selection?.addRange(previousRange);

    if (!copied) throw new Error("Clipboard API unavailable");
  }
}
