/**
 * Celebration Module - Confetti, toasts, and visual effects
 */

export class Celebration {
  constructor() {
    this.confettiColors = ['#fbbf24', '#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7'];
  }

  /**
   * Screen flash effect
   */
  screenFlash(color = 'rgba(34, 197, 94, 0.3)') {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      inset: 0;
      background-color: ${color};
      z-index: 9999;
      pointer-events: none;
      animation: flash 0.5s ease-out forwards;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 500);
  }

  /**
   * Confetti explosion
   */
  confetti(count = 50) {
    const container = document.createElement('div');
    container.style.cssText = 'position: fixed; inset: 0; pointer-events: none; z-index: 9998; overflow: hidden;';
    document.body.appendChild(container);

    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      const color = this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
      const left = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const duration = 2 + Math.random() * 2;
      const size = 8 + Math.random() * 8;

      confetti.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        left: ${left}%;
        top: -20px;
        opacity: 1;
        border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
        animation: confetti-fall ${duration}s ease-out ${delay}s forwards;
      `;

      container.appendChild(confetti);
    }

    setTimeout(() => container.remove(), 5000);
  }

  /**
   * Gold star celebration (full effect)
   */
  goldStar() {
    this.screenFlash('rgba(251, 191, 36, 0.4)');
    this.confetti(80);
    this.showStarToast('gold');
  }

  /**
   * Silver star celebration
   */
  silverStar() {
    this.screenFlash('rgba(156, 163, 175, 0.3)');
    this.confetti(30);
    this.showStarToast('silver');
  }

  /**
   * Bronze star celebration
   */
  bronzeStar() {
    this.screenFlash('rgba(217, 119, 6, 0.2)');
    this.showStarToast('bronze');
  }

  /**
   * Tin star celebration
   */
  tinStar() {
    this.showStarToast('tin');
  }

  /**
   * Celebrate star by type
   */
  celebrate(starType) {
    switch (starType) {
      case 'gold': this.goldStar(); break;
      case 'silver': this.silverStar(); break;
      case 'bronze': this.bronzeStar(); break;
      case 'tin': this.tinStar(); break;
    }
  }

  /**
   * Show star earned toast
   */
  showStarToast(starType) {
    const config = {
      gold: { emoji: '⭐', color: 'from-yellow-400 to-orange-500', text: 'Gold Star!', sub: 'Perfect score with no hints!' },
      silver: { emoji: '🥈', color: 'from-gray-400 to-gray-500', text: 'Silver Star!', sub: 'Great job!' },
      bronze: { emoji: '🥉', color: 'from-amber-500 to-amber-600', text: 'Bronze Star!', sub: 'Nice work!' },
      tin: { emoji: '○', color: 'from-stone-400 to-stone-500', text: 'Tin Star!', sub: 'Keep practicing!' }
    };

    const { emoji, color, text, sub } = config[starType] || config.tin;

    const toast = document.createElement('div');
    toast.className = `fixed top-1/3 left-1/2 -translate-x-1/2 bg-gradient-to-r ${color} text-white rounded-2xl shadow-2xl p-6 z-50 text-center pointer-events-none`;
    toast.innerHTML = `
      <div class="text-5xl mb-3">${emoji}</div>
      <div class="text-xl font-bold mb-1">${text}</div>
      <div class="opacity-90">${sub}</div>
    `;

    document.body.appendChild(toast);

    // Animate in
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -50%) scale(0.5)';
    toast.style.transition = 'all 0.3s ease-out';
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%, 0) scale(1)';
    });

    // Animate out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -20px) scale(0.9)';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  /**
   * Show notification toast (for other users' achievements)
   */
  showNotification(username, message, avatar = '⭐') {
    const toast = document.createElement('div');
    toast.className = 'fixed top-20 right-4 bg-white rounded-lg shadow-xl p-4 z-50 border-l-4 border-yellow-400';
    toast.style.cssText = 'animation: slide-in 0.3s ease-out;';
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl">${avatar}</span>
        <div>
          <div class="font-medium text-gray-800">${username}</div>
          <div class="text-sm text-gray-500">${message}</div>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /**
   * Show rank up celebration
   */
  rankUp(rankName, rankIcon) {
    this.screenFlash('rgba(139, 92, 246, 0.3)');
    this.confetti(60);

    const toast = document.createElement('div');
    toast.className = 'fixed top-1/3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl shadow-2xl p-8 z-50 text-center pointer-events-none';
    toast.innerHTML = `
      <div class="text-6xl mb-4">${rankIcon}</div>
      <div class="text-sm uppercase tracking-wide opacity-80 mb-2">Rank Up!</div>
      <div class="text-2xl font-bold">${rankName}</div>
    `;

    document.body.appendChild(toast);

    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -50%) scale(0.5)';
    toast.style.transition = 'all 0.4s ease-out';
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%, 0) scale(1)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -20px) scale(0.9)';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  /**
   * Streak pulse animation on element
   */
  streakPulse(element) {
    element.classList.add('streak-pulse');
    setTimeout(() => element.classList.remove('streak-pulse'), 500);
  }

  /**
   * Show generic toast notification
   * @param {string} message - The message to display
   * @param {string} type - 'success', 'error', 'info', 'warning'
   * @param {number} duration - How long to show (ms)
   */
  showToast(message, type = 'info', duration = 3000) {
    const colors = {
      success: 'bg-green-500 border-green-600',
      error: 'bg-red-500 border-red-600',
      info: 'bg-blue-500 border-blue-600',
      warning: 'bg-orange-500 border-orange-600'
    };

    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };

    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 ${colors[type] || colors.info} text-white rounded-lg shadow-xl px-4 py-3 z-50 flex items-center gap-3 border-l-4`;
    toast.style.cssText = 'animation: slide-in 0.3s ease-out;';
    toast.innerHTML = `
      <span class="text-xl">${icons[type] || icons.info}</span>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Add required CSS to document
   */
  static injectStyles() {
    if (document.getElementById('celebration-styles')) return;

    const style = document.createElement('style');
    style.id = 'celebration-styles';
    style.textContent = `
      @keyframes flash {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes confetti-fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
      @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .streak-pulse {
        animation: pulse 0.5s ease-in-out;
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }
    `;
    document.head.appendChild(style);
  }
}

// Singleton instance
export const celebration = new Celebration();

// Auto-inject styles
if (typeof document !== 'undefined') {
  Celebration.injectStyles();
}

export default celebration;
