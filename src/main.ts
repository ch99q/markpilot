import { Notice, Plugin } from 'obsidian';
import { MemoryCache } from './api/cache';
import { APIClient, OpenAIClient } from './api/openai';
import { CHAT_VIEW_TYPE, ChatView } from './chat/view';
import { inlineCompletionsExtension } from './editor/extension';
import {
  DEFAULT_SETTINGS,
  MarkpilotSettings,
  MarkpilotSettingTab,
} from './settings';

export default class Markpilot extends Plugin {
  settings: MarkpilotSettings;
  client: APIClient;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new MarkpilotSettingTab(this.app, this));

    const client = new OpenAIClient(this);
    const cache = new MemoryCache(client, this);
    this.client = cache;

    this.registerEditorExtension(
      inlineCompletionsExtension(
        this.client.fetchCompletions.bind(this.client),
        this,
      ),
    );
    this.registerView(CHAT_VIEW_TYPE, (leaf) => new ChatView(leaf, this));
    if (this.settings.chat.enabled) {
      this.activateView();
    }

    if (
      (this.settings.completions.enabled || this.settings.chat.enabled) &&
      !this.settings.apiKey?.startsWith('sk')
    ) {
      new Notice(
        'OpenAI API key is not set. Please register it in the settings tab to use the features.',
      );
    }

    this.addCommand({
      id: 'enable-completions',
      name: 'Enable inline completions',
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.completions.enabled = true;
        this.saveSettings();
        new Notice('Inline completions enabled.');
        return true;
      },
    });
    this.addCommand({
      id: 'disable-completions',
      name: 'Disable inline completions',
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.completions.enabled = false;
        this.saveSettings();
        new Notice('Inline completions disabled.');
        return true;
      },
    });
    this.addCommand({
      id: 'enable-chat-view',
      name: 'Enable chat view',
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.chat.enabled = true;
        this.saveSettings();
        this.activateView();
        new Notice('Chat view enabled.');
        return true;
      },
    });
    this.addCommand({
      id: 'disable-chat-view',
      name: 'Disable chat view',
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.chat.enabled = false;
        this.saveSettings();
        this.deactivateView();
        new Notice('Chat view disabled.');
        return true;
      },
    });
    this.addCommand({
      id: 'clear-chat-history',
      name: 'Clear chat history',
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.chat.history = {
          messages: [],
          response: '',
        };
        this.saveSettings();
        this.reloadView();
        new Notice('Chat history cleared.');
        return true;
      },
    });
    this.addCommand({
      id: 'enable-cache',
      name: 'Enable cache',
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.cache.enabled = true;
        this.saveSettings();
        new Notice('Cache enabled.');
        return true;
      },
    });
    this.addCommand({
      id: 'disable-cache',
      name: 'Disable cache',
      checkCallback: (checking: boolean) => {
        if (checking) {
          return true;
        }
        this.settings.cache.enabled = false;
        this.saveSettings();
        new Notice('Cache disabled.');
        return true;
      },
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async reloadView() {
    await this.deactivateView();
    await this.activateView();
  }

  async activateView() {
    const { workspace } = this.app;

    const leaves = workspace.getLeavesOfType(CHAT_VIEW_TYPE);
    if (leaves.length > 0) {
      return;
    }

    const newLeaf = workspace.getRightLeaf(false);
    await newLeaf?.setViewState({ type: CHAT_VIEW_TYPE, active: true });
  }

  async deactivateView() {
    const { workspace } = this.app;

    const leaves = workspace.getLeavesOfType(CHAT_VIEW_TYPE);
    for (const leaf of leaves) {
      leaf.detach();
    }
  }
}
