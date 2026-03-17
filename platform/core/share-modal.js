/**
 * Share Modal — open/close event wiring for the share URL/QR modal.
 *
 * Extracted from app.html (opportunistic extraction pass).
 */
export function initShareModal(config = {}) {
  const doc = config.documentLike || globalThis.document || null;
  const updateContents = config.updateShareModalContents || (() => {});

  const getEl = (id) => doc?.getElementById?.(id) || null;

  getEl('share-btn')?.addEventListener('click', () => {
    updateContents();
    const modal = getEl('share-modal');
    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
  });

  getEl('share-modal-close')?.addEventListener('click', () => {
    const modal = getEl('share-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  });

  // Close on backdrop click
  getEl('share-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'share-modal') {
      const modal = getEl('share-modal');
      modal?.classList.add('hidden');
      modal?.classList.remove('flex');
    }
  });
}
