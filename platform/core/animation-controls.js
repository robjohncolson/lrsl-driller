/**
 * Animation Controls — video play/pause, restart, progress bar, and hide/show toggle
 * for the per-mode Manim animation player.
 *
 * Extracted from app.html Phase 2, seam 7.
 */
export class AnimationControls {
  constructor(config = {}) {
    this.documentLike = config.documentLike || globalThis.document || null;
    this.animationHidden = false;
  }

  getElement(id) {
    return this.documentLike?.getElementById?.(id) || null;
  }

  init() {
    const video = this.getElement('animation-video');
    const playBtn = this.getElement('animation-play-btn');
    const restartBtn = this.getElement('animation-restart-btn');
    const toggleBtn = this.getElement('animation-toggle-btn');
    const progressBar = this.getElement('animation-progress');
    const playIcon = this.getElement('play-icon');
    const pauseIcon = this.getElement('pause-icon');
    const animationContainer = this.getElement('animation-container');

    if (!video || !playBtn) return;

    // Play/Pause toggle
    playBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });

    // Update play/pause icons
    video.addEventListener('play', () => {
      playIcon?.classList.add('hidden');
      pauseIcon?.classList.remove('hidden');
    });

    video.addEventListener('pause', () => {
      playIcon?.classList.remove('hidden');
      pauseIcon?.classList.add('hidden');
    });

    // Restart button
    restartBtn?.addEventListener('click', () => {
      video.currentTime = 0;
      video.play();
    });

    // Progress bar update
    video.addEventListener('timeupdate', () => {
      if (video.duration && progressBar) {
        const percent = (video.currentTime / video.duration) * 100;
        progressBar.style.width = `${percent}%`;
      }
    });

    // Hide/Show toggle
    toggleBtn?.addEventListener('click', () => {
      this.animationHidden = !this.animationHidden;
      if (this.animationHidden) {
        animationContainer?.classList.add('hidden');
        toggleBtn.textContent = 'Show';
        video.pause();
      } else {
        animationContainer?.classList.remove('hidden');
        toggleBtn.textContent = 'Hide';
        video.play().catch(() => {});
      }
    });

    // Click on video to toggle play/pause
    video.addEventListener('click', () => {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    });
  }
}
