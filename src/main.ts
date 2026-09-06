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
import {
  appendFooterMarkdown,
  formatMarkdownForWechat,
  normalizeLineHeight,
  normalizeSidePadding,
  optimizeForWechat,
} from "./formatter";
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
  private lineHeightInput: HTMLInputElement | null = null;
  private lineHeightValueEl: HTMLElement | null = null;
  private sidePaddingInput: HTMLInputElement | null = null;
  private sidePaddingValueEl: HTMLElement | null = null;

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
    const copyButton = actions.createEl("button", {
      cls: "mod-cta wechat-formatter-copy",
      text: "复制公众号格式",
    });
    copyButton.addEventListener("click", () => void this.plugin.copyCurrentNote());

    const floatingControls = this.contentEl.createDiv({
      cls: "wechat-formatter-floating-controls",
    });
    const floatingHeader = floatingControls.createDiv({
      cls: "wechat-formatter-floating-header",
    });
    floatingHeader.createEl("strong", { text: "排版调整" });

    const lineHeightControl = floatingControls.createEl("label", {
      cls: "wechat-formatter-range-control",
    });
    lineHeightControl.createSpan({ text: "行间距" });
    this.lineHeightInput = lineHeightControl.createEl("input", {
      attr: { type: "range", min: "1.2", max: "2.5", step: "0.1" },
    });
    this.lineHeightInput.addEventListener("input", () => {
      this.plugin.setPreviewLineHeight(Number(this.lineHeightInput?.value));
    });
    this.lineHeightValueEl = lineHeightControl.createEl("output");

    const sidePaddingControl = floatingControls.createEl("label", {
      cls: "wechat-formatter-range-control",
    });
    sidePaddingControl.createSpan({ text: "页边距" });
    this.sidePaddingInput = sidePaddingControl.createEl("input", {
      attr: { type: "range", min: "0", max: "48", step: "2" },
    });
    this.sidePaddingInput.addEventListener("input", () => {
      this.plugin.setPreviewSidePadding(Number(this.sidePaddingInput?.value));
    });
    this.sidePaddingValueEl = sidePaddingControl.createEl("output");

    const floatingActions = floatingControls.createDiv({
      cls: "wechat-formatter-floating-actions",
    });
    this.footerToggleButton = floatingActions.createEl("button", {
      cls: "wechat-formatter-hook-toggle",
      text: "结尾钩子",
    });
    this.footerToggleButton.addEventListener("click", () => {
      void this.plugin.setFooterEnabled(!this.plugin.settings.footerEnabled);
    });

    const resetButton = floatingActions.createEl("button", {
      cls: "wechat-formatter-reset-layout",
      text: "恢复默认",
    });
    resetButton.addEventListener("click", () => this.plugin.resetPreviewLayout());

    this.previewEl = this.contentEl.createDiv({ cls: "wechat-formatter-preview" });
    this.render(this.plugin.getCurrentMarkdown(), this.plugin.getCurrentFile());
  }

  render(markdown: string, file: TFile | null): void {
    if (!this.previewEl || !this.noteNameEl) return;

    this.noteNameEl.setText(file?.basename ?? "未打开 Markdown 笔记");
    this.updateFooterToggle();
    this.updateLayoutControls();
    this.previewEl.empty();

    if (!markdown.trim()) {
      const empty = this.previewEl.createDiv({ cls: "wechat-formatter-empty" });
      empty.createDiv({ cls: "wechat-formatter-empty-icon", text: "文" });
      empty.createEl("p", { text: "打开或输入一篇 Markdown 笔记后，这里会显示公众号效果。" });
      return;
    }

    const content = this.previewEl.createDiv({ cls: "wechat-formatter-content" });
    content.innerHTML = this.plugin.formatMarkdown(markdown);
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

  private updateLayoutControls(): void {
    const lineHeight = this.plugin.getPreviewLineHeight();
    const sidePadding = this.plugin.getPreviewSidePadding();

    if (this.lineHeightInput) this.lineHeightInput.value = String(lineHeight);
    if (this.lineHeightValueEl) this.lineHeightValueEl.setText(lineHeight.toFixed(1));
    if (this.sidePaddingInput) this.sidePaddingInput.value = String(sidePadding);
    if (this.sidePaddingValueEl) this.sidePaddingValueEl.setText(`${sidePadding}px`);
  }
}

export default class WechatFormatterPlugin extends Plugin {
  settings!: WechatFormatterSettings;
  private currentMarkdown = "";
  private currentFile: TFile | null = null;
  private refreshTimer: number | null = null;
  private previewLineHeight = 1.8;
  private previewSidePadding = 16;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.resetPreviewLayout(false);
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

  formatMarkdown(markdown: string): string {
    return formatMarkdownForWechat(this.composeMarkdown(markdown), {
      lineHeight: this.previewLineHeight,
      sidePadding: this.previewSidePadding,
    });
  }

  getPreviewLineHeight(): number {
    return this.previewLineHeight;
  }

  getPreviewSidePadding(): number {
    return this.previewSidePadding;
  }

  setPreviewLineHeight(value: number): void {
    this.previewLineHeight = normalizeLineHeight(value);
    this.refreshViews();
  }

  setPreviewSidePadding(value: number): void {
    this.previewSidePadding = normalizeSidePadding(value);
    this.refreshViews();
  }

  resetPreviewLayout(refresh = true): void {
    this.previewLineHeight = normalizeLineHeight(this.settings.defaultLineHeight);
    this.previewSidePadding = normalizeSidePadding(this.settings.defaultSidePadding);
    if (refresh) this.refreshViews();
  }

  async setDefaultLineHeight(value: number): Promise<void> {
    this.settings.defaultLineHeight = normalizeLineHeight(value);
    await this.saveSettings();
    this.resetPreviewLayout();
  }

  async setDefaultSidePadding(value: number): Promise<void> {
    this.settings.defaultSidePadding = normalizeSidePadding(value);
    await this.saveSettings();
    this.resetPreviewLayout();
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

    const html = optimizeForWechat(this.formatMarkdown(markdown));
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
    this.settings.defaultLineHeight = normalizeLineHeight(this.settings.defaultLineHeight);
    this.settings.defaultSidePadding = normalizeSidePadding(this.settings.defaultSidePadding);
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
