import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CartridgeLoadingController } from '../../platform/core/cartridge-loading.ts';

const appHtmlPath = join(process.cwd(), 'platform', 'app.html');
const appHtmlContent = readFileSync(appHtmlPath, 'utf-8');

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);

  return {
    add: (...tokens) => tokens.forEach((token) => classes.add(token)),
    remove: (...tokens) => tokens.forEach((token) => classes.delete(token)),
    contains: (token) => classes.has(token)
  };
}

function createElement({ classes = [], value = '', textContent = '' } = {}) {
  const handlers = new Map();

  return {
    classList: createClassList(classes),
    value,
    textContent,
    innerHTML: '',
    className: '',
    style: {},
    addEventListener(eventName, handler) {
      handlers.set(eventName, handler);
    },
    dispatch(eventName, detail = {}) {
      const handler = handlers.get(eventName);
      if (handler) {
        return handler({ target: this, ...detail });
      }
      return undefined;
    }
  };
}

function createLocalStorage(initialValues = {}) {
  const store = new Map(Object.entries(initialValues));

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    }
  };
}

function createDocumentLike() {
  const elements = new Map([
    ['cartridge-dropdown', createElement({ classes: ['hidden'] })],
    ['cartridge-dropdown-backdrop', createElement({ classes: ['hidden'] })],
    ['cartridge-loading-overlay', createElement({ classes: ['hidden'] })],
    ['cartridge-loading-name', createElement()],
    ['status-manifest', createElement()],
    ['status-contexts', createElement()],
    ['status-generator', createElement()],
    ['status-grading', createElement()],
    ['status-ai', createElement()],
    ['cartridge-progress-bar', createElement()],
    ['cartridge-list', createElement()],
    ['cartridge-select', createElement()],
    ['current-cartridge-name', createElement()],
    ['cartridge-slot-btn', createElement()]
  ]);

  return {
    optionButtons: [],
    getElementById(id) {
      return elements.get(id) || null;
    },
    querySelectorAll(selector) {
      if (selector === '.cartridge-option') {
        return this.optionButtons;
      }
      return [];
    }
  };
}

function createOptionButton(cartridgeId) {
  const button = createElement();
  button.dataset = { cartridge: cartridgeId };
  return button;
}

function createController(overrides = {}) {
  const documentLike = overrides.documentLike || createDocumentLike();
  const localStorageLike = overrides.localStorageLike || createLocalStorage();
  const soundEngine = overrides.soundEngine || {
    init: vi.fn(),
    bootChime: vi.fn()
  };
  let currentCartridgeId = overrides.currentCartridgeId || 'lsrl-interpretation';

  const controller = new CartridgeLoadingController({
    soundEngine,
    getCurrentCartridgeId: overrides.getCurrentCartridgeId || (() => currentCartridgeId),
    setCurrentCartridgeId: overrides.setCurrentCartridgeId || ((cartridgeId) => {
      currentCartridgeId = cartridgeId;
    }),
    onLoadCartridge: overrides.onLoadCartridge || vi.fn(async () => {}),
    createLoader: overrides.createLoader || (() => ({
      getCartridgesBySubject: vi.fn(async () => ({
        'AP Statistics': [
          {
            id: 'lsrl-interpretation',
            name: 'LSRL Interpretation',
            description: 'Interpret slopes and intercepts',
            shortCode: 'LSRL'
          }
        ],
        'Algebra 2': [
          {
            id: 'graphing-polynomials',
            name: 'Graphing Polynomials',
            description: 'Analyze polynomial graphs',
            shortCode: 'POLY'
          }
        ]
      }))
    })),
    documentLike,
    localStorageLike,
    setTimeoutFn: overrides.setTimeoutFn || ((callback) => callback())
  });

  controller._getCurrentCartridgeIdForTest = () => currentCartridgeId;
  return controller;
}

describe('Cartridge loading extraction', () => {
  it('imports and wires the shared cartridge loading controller', () => {
    expect(appHtmlContent).toContain("import { CartridgeLoadingController } from './core/cartridge-loading.ts';");
    expect(appHtmlContent).toContain('cartridgeLoadingController = new CartridgeLoadingController({');
    expect(appHtmlContent).toContain('cartridgeLoadingController.installEventListeners();');
  });

  it('populates the cartridge list and hidden select from the registry', async () => {
    const documentLike = createDocumentLike();
    const controller = createController({ documentLike });

    await controller.populateCartridgeList();

    expect(documentLike.getElementById('cartridge-list').innerHTML).toContain('AP Statistics');
    expect(documentLike.getElementById('cartridge-list').innerHTML).toContain('LSRL Interpretation');
    expect(documentLike.getElementById('cartridge-list').innerHTML).toContain('Graphing Polynomials');
    expect(documentLike.getElementById('cartridge-select').innerHTML).toContain('option value="lsrl-interpretation"');
    expect(documentLike.getElementById('cartridge-select').innerHTML).toContain('option value="graphing-polynomials"');
    expect(controller.hasCartridge('graphing-polynomials')).toBe(true);
  });

  it('opens and closes the dropdown and loading overlay through controller helpers', () => {
    const documentLike = createDocumentLike();
    const soundEngine = {
      init: vi.fn(),
      bootChime: vi.fn()
    };
    const controller = createController({ documentLike, soundEngine });

    controller.openDropdown();
    expect(documentLike.getElementById('cartridge-dropdown').classList.contains('hidden')).toBe(false);
    expect(documentLike.getElementById('cartridge-dropdown-backdrop').classList.contains('hidden')).toBe(false);

    controller.showLoading('LSRL');
    expect(documentLike.getElementById('cartridge-loading-overlay').classList.contains('hidden')).toBe(false);
    expect(documentLike.getElementById('cartridge-loading-name').textContent).toBe('LSRL');
    expect(soundEngine.init).toHaveBeenCalledTimes(1);
    expect(soundEngine.bootChime).toHaveBeenCalledTimes(1);

    controller.hideLoading();
    controller.closeDropdown();
    expect(documentLike.getElementById('cartridge-loading-overlay').classList.contains('hidden')).toBe(true);
    expect(documentLike.getElementById('cartridge-dropdown').classList.contains('hidden')).toBe(true);
    expect(documentLike.getElementById('cartridge-dropdown-backdrop').classList.contains('hidden')).toBe(true);
  });

  it('updates per-step loading progress and synchronizes the selected cartridge display', async () => {
    const documentLike = createDocumentLike();
    const controller = createController({ documentLike });

    await controller.populateCartridgeList();
    controller.updateLoadingProgress('manifest', 'manifest.json', 'loading');
    controller.updateLoadingProgress('manifest', 'manifest.json', 'done');
    controller.syncDisplayedCartridge('graphing-polynomials');

    expect(documentLike.getElementById('status-manifest').textContent).toBe('OK');
    expect(documentLike.getElementById('cartridge-progress-bar').style.width).toBe('20%');
    expect(documentLike.getElementById('current-cartridge-name').textContent).toBe('Graphing Polynomials');
    expect(documentLike.getElementById('cartridge-select').value).toBe('graphing-polynomials');
  });

  it('handles cartridge selection by persisting state and using the animated load path', async () => {
    const documentLike = createDocumentLike();
    const localStorageLike = createLocalStorage();
    const onLoadCartridge = vi.fn(async () => {});
    const controller = createController({
      documentLike,
      localStorageLike,
      onLoadCartridge
    });

    await controller.populateCartridgeList();
    await controller.handleCartridgeOptionClick('graphing-polynomials');

    expect(controller._getCurrentCartridgeIdForTest()).toBe('graphing-polynomials');
    expect(localStorageLike.getItem('lastCartridgeId')).toBe('graphing-polynomials');
    expect(onLoadCartridge).toHaveBeenCalledWith('graphing-polynomials');
    expect(documentLike.getElementById('current-cartridge-name').textContent).toBe('Graphing Polynomials');
    expect(documentLike.getElementById('cartridge-select').value).toBe('graphing-polynomials');
    expect(documentLike.getElementById('cartridge-dropdown').classList.contains('hidden')).toBe(true);
  });

  it('installs event listeners for the slot button and dynamically rendered options', async () => {
    const documentLike = createDocumentLike();
    documentLike.optionButtons = [createOptionButton('graphing-polynomials')];
    const controller = createController({ documentLike });
    const handleClickSpy = vi.spyOn(controller, 'handleCartridgeOptionClick').mockResolvedValue(true);

    controller.installEventListeners();
    await controller.populateCartridgeList();
    documentLike.getElementById('cartridge-slot-btn').dispatch('click');
    documentLike.optionButtons[0].dispatch('click');

    expect(documentLike.getElementById('cartridge-dropdown').classList.contains('hidden')).toBe(false);
    expect(handleClickSpy).toHaveBeenCalledWith('graphing-polynomials');
  });
});
