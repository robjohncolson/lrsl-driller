import type { DocumentLike, StorageLike } from './types.ts';
import { CartridgeLoader } from './cartridge-loader.js';

interface SoundEngineWithBoot {
  init?(): void;
  bootChime?(): void;
}

interface CartridgeLoadingConfig {
  soundEngine?: SoundEngineWithBoot | null;
  getCurrentCartridgeId?: () => string | null;
  setCurrentCartridgeId?: (id: string) => void;
  onLoadCartridge?: (cartridgeId: string) => Promise<void>;
  createLoader?: () => CartridgeLoader;
  documentLike?: DocumentLike | null;
  localStorageLike?: StorageLike | null;
  setTimeoutFn?: (callback: () => void, ms: number) => unknown;
}

interface CartridgeInfo {
  id: string;
  name: string;
  shortCode?: string;
  description?: string;
}

const SUBJECT_COLORS: Record<string, { header: string; btnHover: string; cartridge: string }> = {
  'AP Statistics': {
    header: 'text-purple-600',
    btnHover: 'hover:bg-purple-50 hover:border-purple-300',
    cartridge: 'from-purple-500 to-purple-700'
  },
  'Algebra 2': {
    header: 'text-green-600',
    btnHover: 'hover:bg-green-50 hover:border-green-300',
    cartridge: 'from-green-500 to-green-700'
  },
  default: {
    header: 'text-blue-600',
    btnHover: 'hover:bg-blue-50 hover:border-blue-300',
    cartridge: 'from-blue-500 to-blue-700'
  }
};

const LOADING_STEPS = ['manifest', 'contexts', 'generator', 'grading', 'ai'];

export class CartridgeLoadingController {
  soundEngine: SoundEngineWithBoot | null;
  getCurrentCartridgeId: () => string | null;
  setCurrentCartridgeId: (id: string) => void;
  onLoadCartridge: (cartridgeId: string) => Promise<void>;
  createLoader: () => CartridgeLoader;
  documentLike: DocumentLike | null;
  localStorageLike: StorageLike | null;
  setTimeoutFn: ((callback: () => void, ms: number) => unknown) | undefined;
  state: {
    displayNames: Map<string, string>;
  };

  constructor(config: CartridgeLoadingConfig = {}) {
    this.soundEngine = config.soundEngine || null;
    this.getCurrentCartridgeId = config.getCurrentCartridgeId || (() => null);
    this.setCurrentCartridgeId = config.setCurrentCartridgeId || (() => {});
    this.onLoadCartridge = config.onLoadCartridge || (async () => {});
    this.createLoader = config.createLoader || (() => new CartridgeLoader({ basePath: '/cartridges' }));
    this.documentLike = config.documentLike || globalThis.document || null;
    this.localStorageLike = config.localStorageLike || globalThis.localStorage || null;
    this.setTimeoutFn = config.setTimeoutFn || globalThis.setTimeout?.bind(globalThis);
    this.state = {
      displayNames: new Map()
    };
  }

  getElement(id: string): HTMLElement | null {
    return this.documentLike?.getElementById?.(id) || null;
  }

  querySelectorAll(selector: string): NodeListOf<HTMLElement> | HTMLElement[] {
    return this.documentLike?.querySelectorAll?.(selector) || [];
  }

  setStorageItem(key: string, value: unknown): void {
    this.localStorageLike?.setItem?.(key, String(value));
  }

  wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.setTimeoutFn?.(resolve, ms);
    });
  }

  openDropdown(): void {
    this.getElement('cartridge-dropdown')?.classList.remove('hidden');
    this.getElement('cartridge-dropdown-backdrop')?.classList.remove('hidden');
  }

  closeDropdown(): void {
    this.getElement('cartridge-dropdown')?.classList.add('hidden');
    this.getElement('cartridge-dropdown-backdrop')?.classList.add('hidden');
  }

  toggleDropdown(): void {
    const dropdown = this.getElement('cartridge-dropdown');
    if (!dropdown) return;

    if (dropdown.classList.contains('hidden')) {
      this.openDropdown();
    } else {
      this.closeDropdown();
    }
  }

  showLoading(cartridgeName: string): void {
    const overlay = this.getElement('cartridge-loading-overlay');
    const nameLabel = this.getElement('cartridge-loading-name');
    if (nameLabel) {
      nameLabel.textContent = cartridgeName;
    }

    LOADING_STEPS.forEach((stepId) => {
      const statusElement = this.getElement(`status-${stepId}`);
      if (!statusElement) return;
      statusElement.textContent = 'o';
      statusElement.className = 'w-5 h-5 flex items-center justify-center text-gray-400';
    });

    const progressBar = this.getElement('cartridge-progress-bar');
    if (progressBar?.style) {
      progressBar.style.width = '0%';
    }

    overlay?.classList.remove('hidden');
    this.soundEngine?.init?.();
    this.soundEngine?.bootChime?.();
  }

  hideLoading(): void {
    this.getElement('cartridge-loading-overlay')?.classList.add('hidden');
  }

  updateLoadingProgress(step: string, _filename: string, status: string): void {
    const statusElement = this.getElement(`status-${step}`);
    if (!statusElement) return;

    const progressBar = this.getElement('cartridge-progress-bar');
    const stepIndex = LOADING_STEPS.indexOf(step);

    if (status === 'loading') {
      statusElement.textContent = '...';
      statusElement.className = 'w-5 h-5 flex items-center justify-center text-purple-500 animate-spin';
      return;
    }

    if (status === 'done') {
      statusElement.textContent = 'OK';
      statusElement.className = 'w-5 h-5 flex items-center justify-center text-green-500 font-bold';
      if (progressBar?.style && stepIndex >= 0) {
        progressBar.style.width = `${((stepIndex + 1) / LOADING_STEPS.length) * 100}%`;
      }
      return;
    }

    if (status === 'skipped') {
      statusElement.textContent = '-';
      statusElement.className = 'w-5 h-5 flex items-center justify-center text-gray-400';
      if (progressBar?.style && stepIndex >= 0) {
        progressBar.style.width = `${((stepIndex + 1) / LOADING_STEPS.length) * 100}%`;
      }
      return;
    }

    if (status === 'error') {
      statusElement.textContent = 'X';
      statusElement.className = 'w-5 h-5 flex items-center justify-center text-red-500 font-bold';
    }
  }

  getDisplayName(cartridgeId: string): string {
    return this.state.displayNames.get(cartridgeId) || cartridgeId;
  }

  hasCartridge(cartridgeId: string): boolean {
    return this.state.displayNames.has(cartridgeId);
  }

  syncDisplayedCartridge(cartridgeId: string, displayName: string | null = null): void {
    const resolvedName = displayName || this.getDisplayName(cartridgeId);
    const label = this.getElement('current-cartridge-name');
    const select = this.getElement('cartridge-select') as HTMLSelectElement | null;

    if (label) {
      label.textContent = resolvedName;
    }
    if (select) {
      select.value = cartridgeId;
    }
  }

  async populateCartridgeList(): Promise<Record<string, CartridgeInfo[]>> {
    const loader = this.createLoader();
    const grouped = await loader.getCartridgesBySubject() as Record<string, CartridgeInfo[]>;
    const listElement = this.getElement('cartridge-list');
    const selectElement = this.getElement('cartridge-select');
    if (!listElement || !selectElement) return grouped;

    this.state.displayNames.clear();

    const listMarkup: string[] = [];
    const selectMarkup: string[] = [];

    for (const [subject, cartridges] of Object.entries(grouped)) {
      const colors = SUBJECT_COLORS[subject] || SUBJECT_COLORS.default;
      listMarkup.push(`<div class="text-xs font-bold ${colors.header} uppercase tracking-wide px-2 pt-1">${subject}</div>`);

      cartridges.forEach((cartridge) => {
        this.state.displayNames.set(cartridge.id, cartridge.name);
        const shortCode = cartridge.shortCode || cartridge.id.substring(0, 4).toUpperCase();
        const description = cartridge.description || '';
        listMarkup.push(`
          <button class="cartridge-option w-full flex items-center gap-3 p-2 rounded-lg ${colors.btnHover} transition-colors border-2 border-transparent" data-cartridge="${cartridge.id}">
            <div class="w-10 h-14 bg-gradient-to-b ${colors.cartridge} rounded flex items-center justify-center text-white text-xs font-bold shadow">
              ${shortCode}
            </div>
            <div class="text-left flex-1">
              <div class="font-semibold text-gray-800 text-sm">${cartridge.name}</div>
              <div class="text-xs text-gray-500">${description}</div>
            </div>
          </button>
        `);

        selectMarkup.push(`<option value="${cartridge.id}">${cartridge.name}</option>`);
      });
    }

    listElement.innerHTML = listMarkup.join('');
    selectElement.innerHTML = selectMarkup.join('');
    this.installOptionListeners();
    return grouped;
  }

  installOptionListeners(): void {
    this.querySelectorAll('.cartridge-option').forEach((button) => {
      button.addEventListener('click', () => {
        void this.handleCartridgeOptionClick((button as HTMLElement).dataset.cartridge);
      });
    });
  }

  async handleCartridgeOptionClick(cartridgeId: string | undefined): Promise<boolean> {
    if (!cartridgeId || cartridgeId === this.getCurrentCartridgeId()) {
      this.closeDropdown();
      return false;
    }

    this.closeDropdown();
    this.setCurrentCartridgeId(cartridgeId);
    this.setStorageItem('lastCartridgeId', cartridgeId);
    this.syncDisplayedCartridge(cartridgeId);
    await this.loadCartridgeWithAnimation(cartridgeId);
    return true;
  }

  async loadCartridgeWithAnimation(cartridgeId: string): Promise<string> {
    const displayName = this.getDisplayName(cartridgeId);
    this.showLoading(displayName.substring(0, 8));
    await this.wait(200);
    await this.onLoadCartridge(cartridgeId);
    this.syncDisplayedCartridge(cartridgeId, displayName);
    await this.wait(300);
    this.hideLoading();
    return displayName;
  }

  installEventListeners(): void {
    this.getElement('cartridge-slot-btn')?.addEventListener?.('click', () => this.toggleDropdown());
    this.getElement('cartridge-dropdown-backdrop')?.addEventListener?.('click', () => this.closeDropdown());
  }
}
