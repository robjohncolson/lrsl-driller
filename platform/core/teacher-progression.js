/**
 * Teacher Progression Controls — UI + server ops for overriding
 * gold-star requirements on a per-mode basis.
 *
 * Extracted from app.html (opportunistic extraction pass).
 */
export class TeacherProgressionControls {
  constructor(config = {}) {
    this.documentLike = config.documentLike || globalThis.document || null;
    this.getPlatform = config.getPlatform || (() => null);
    this.getCartridgeId = config.getCartridgeId || (() => null);
    this.getServerUrl = config.getServerUrl || (() => null);
    this.getTeacherPassword = config.getTeacherPassword || (() => null);
    this.getUserSystem = config.getUserSystem || (() => null);
    this.isTeacherModeActive = config.isTeacherModeActive || (() => false);
    this.celebration = config.celebration || null;
    this.renderModeTabs = config.renderModeTabs || (() => {});
    this.fetchFn = config.fetchFn || globalThis.fetch?.bind(globalThis);
    this.confirmFn = config.confirmFn || globalThis.confirm?.bind(globalThis);
  }

  getElement(id) {
    return this.documentLike?.getElementById?.(id) || null;
  }

  updateControls() {
    const panel = this.getElement('teacher-progression-panel');
    if (!panel) return;

    if (!this.isTeacherModeActive()) {
      panel.classList.add('hidden');
      return;
    }

    const platform = this.getPlatform();
    if (!platform?.currentMode || !platform?.gameEngine) {
      panel.classList.add('hidden');
      return;
    }

    panel.classList.remove('hidden');

    const currentModeId = platform.currentMode;
    const modes = platform.currentCartridge?.manifest?.modes || [];
    const mode = modes.find(m => m.id === currentModeId);
    const modeName = mode?.name || currentModeId;

    this.getElement('progression-level-name').textContent = modeName;

    const currentReq = platform.gameEngine.getRequiredGold(currentModeId);
    const hasOverride = platform.gameEngine.hasOverride(currentModeId);
    const manifestDefault = platform.gameEngine.getManifestDefault(currentModeId);

    const goldInput = this.getElement('gold-req-input');
    if (goldInput) goldInput.value = currentReq;

    const statusEl = this.getElement('progression-override-status');
    if (statusEl) {
      if (hasOverride) {
        statusEl.classList.remove('hidden');
        statusEl.textContent = `(Override: ${currentReq}, default: ${manifestDefault})`;
      } else {
        statusEl.classList.add('hidden');
      }
    }
  }

  async saveOverride() {
    const platform = this.getPlatform();
    const modeId = platform?.currentMode;
    const cartridgeId = this.getCartridgeId();
    if (!modeId || !cartridgeId) return;

    const goldInput = this.getElement('gold-req-input');
    const goldRequired = parseInt(goldInput?.value, 10);

    if (isNaN(goldRequired) || goldRequired < 1 || goldRequired > 10) {
      this.celebration?.showToast?.('Gold required must be between 1 and 10', 'error');
      return;
    }

    try {
      const serverUrl = this.getServerUrl();
      const gameId = 'default';
      const resp = await this.fetchFn(`${serverUrl}/api/progression-overrides/${cartridgeId}/${modeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goldRequired,
          password: this.getTeacherPassword(),
          gameId,
          username: this.getUserSystem()?.currentUser?.username
        })
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to save');
      }

      platform.gameEngine.updateOverride(modeId, goldRequired);
      this.renderModeTabs();

      const modeName = platform.currentCartridge?.manifest?.modes?.find(m => m.id === modeId)?.name || modeId;
      this.celebration?.showToast?.(`${modeName} now requires ${goldRequired} gold star${goldRequired > 1 ? 's' : ''}`, 'success');
    } catch (err) {
      console.error('[Progression] Save error:', err);
      this.celebration?.showToast?.('Failed to save progression override', 'error');
    }
  }

  async resetOverride() {
    const platform = this.getPlatform();
    const modeId = platform?.currentMode;
    const cartridgeId = this.getCartridgeId();
    if (!modeId || !cartridgeId) return;

    try {
      const serverUrl = this.getServerUrl();
      const gameId = 'default';
      const resp = await this.fetchFn(`${serverUrl}/api/progression-overrides/${cartridgeId}/${modeId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: this.getTeacherPassword(),
          gameId
        })
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to reset');
      }

      platform.gameEngine.removeOverride(modeId);
      this.renderModeTabs();

      const manifestDefault = platform.gameEngine.getManifestDefault(modeId);
      const modeName = platform.currentCartridge?.manifest?.modes?.find(m => m.id === modeId)?.name || modeId;
      this.celebration?.showToast?.(`${modeName} reset to default (${manifestDefault} gold)`, 'success');
    } catch (err) {
      console.error('[Progression] Reset error:', err);
      this.celebration?.showToast?.('Failed to reset progression override', 'error');
    }
  }

  async resetAllOverrides() {
    const platform = this.getPlatform();
    const cartridgeId = this.getCartridgeId();
    if (!cartridgeId) return;

    const modes = platform?.currentCartridge?.manifest?.modes;
    if (!modes?.length) return;

    const modesWithOverrides = modes.filter(m => platform.gameEngine.hasOverride(m.id));
    if (modesWithOverrides.length === 0) {
      this.celebration?.showToast?.('No overrides to reset', 'info');
      return;
    }

    if (!this.confirmFn?.(`Reset ${modesWithOverrides.length} progression override(s) to manifest defaults?`)) {
      return;
    }

    try {
      const serverUrl = this.getServerUrl();
      const gameId = 'default';
      let resetCount = 0;

      for (const mode of modesWithOverrides) {
        const resp = await this.fetchFn(`${serverUrl}/api/progression-overrides/${cartridgeId}/${mode.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: this.getTeacherPassword(),
            gameId
          })
        });

        if (resp.ok) {
          platform.gameEngine.removeOverride(mode.id);
          resetCount++;
        }
      }

      this.renderModeTabs();
      this.updateControls();

      this.celebration?.showToast?.(`Reset ${resetCount} override(s) to manifest defaults`, 'success');
    } catch (err) {
      console.error('[Progression] Reset all error:', err);
      this.celebration?.showToast?.('Failed to reset progression overrides', 'error');
    }
  }

  initEventListeners() {
    this.getElement('save-gold-req-btn')?.addEventListener('click', () => this.saveOverride());
    this.getElement('reset-gold-req-btn')?.addEventListener('click', () => this.resetOverride());
    this.getElement('reset-all-overrides-btn')?.addEventListener('click', () => this.resetAllOverrides());
  }
}
