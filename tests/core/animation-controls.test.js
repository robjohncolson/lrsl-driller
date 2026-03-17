import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AnimationControls } from '../../platform/core/animation-controls.js';

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
    add: (...tokens) => tokens.forEach((t) => classes.add(t)),
    remove: (...tokens) => tokens.forEach((t) => classes.delete(t)),
    contains: (token) => classes.has(token)
  };
}

function createMockVideo() {
  const listeners = {};
  return {
    paused: true,
    currentTime: 0,
    duration: 100,
    classList: createClassList(),
    play: vi.fn(() => {
      listeners.play?.forEach((fn) => fn());
      return Promise.resolve();
    }),
    pause: vi.fn(() => {
      listeners.pause?.forEach((fn) => fn());
    }),
    addEventListener: vi.fn((event, fn) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    }),
    _fire(event) {
      listeners[event]?.forEach((fn) => fn());
    },
    _listeners: listeners
  };
}

function createMockElement({ classes = [], textContent = '' } = {}) {
  const listeners = {};
  return {
    classList: createClassList(classes),
    textContent,
    style: {},
    addEventListener: vi.fn((event, fn) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    }),
    _fire(event) {
      listeners[event]?.forEach((fn) => fn());
    }
  };
}

function createDocumentLike() {
  const video = createMockVideo();
  const playBtn = createMockElement();
  const restartBtn = createMockElement();
  const toggleBtn = createMockElement({ textContent: 'Hide' });
  const progressBar = createMockElement();
  const playIcon = createMockElement();
  const pauseIcon = createMockElement({ classes: ['hidden'] });
  const animationContainer = createMockElement();

  const elements = {
    'animation-video': video,
    'animation-play-btn': playBtn,
    'animation-restart-btn': restartBtn,
    'animation-toggle-btn': toggleBtn,
    'animation-progress': progressBar,
    'play-icon': playIcon,
    'pause-icon': pauseIcon,
    'animation-container': animationContainer
  };

  return {
    getElementById: (id) => elements[id] || null,
    _elements: elements
  };
}

describe('AnimationControls', () => {
  let controls;
  let doc;

  beforeEach(() => {
    doc = createDocumentLike();
    controls = new AnimationControls({ documentLike: doc });
    controls.init();
  });

  it('should construct without errors', () => {
    expect(controls).toBeDefined();
    expect(controls.animationHidden).toBe(false);
  });

  it('should not throw when video or playBtn is missing', () => {
    const emptyDoc = { getElementById: () => null };
    const c = new AnimationControls({ documentLike: emptyDoc });
    expect(() => c.init()).not.toThrow();
  });

  describe('play/pause button', () => {
    it('should call video.play() when video is paused', () => {
      const video = doc._elements['animation-video'];
      const playBtn = doc._elements['animation-play-btn'];
      video.paused = true;
      playBtn._fire('click');
      expect(video.play).toHaveBeenCalled();
    });

    it('should call video.pause() when video is playing', () => {
      const video = doc._elements['animation-video'];
      const playBtn = doc._elements['animation-play-btn'];
      video.paused = false;
      playBtn._fire('click');
      expect(video.pause).toHaveBeenCalled();
    });
  });

  describe('play/pause icons', () => {
    it('should hide play icon and show pause icon on play', () => {
      const video = doc._elements['animation-video'];
      const playIcon = doc._elements['play-icon'];
      const pauseIcon = doc._elements['pause-icon'];
      video._fire('play');
      expect(playIcon.classList.contains('hidden')).toBe(true);
      expect(pauseIcon.classList.contains('hidden')).toBe(false);
    });

    it('should show play icon and hide pause icon on pause', () => {
      const video = doc._elements['animation-video'];
      const playIcon = doc._elements['play-icon'];
      const pauseIcon = doc._elements['pause-icon'];
      video._fire('pause');
      expect(playIcon.classList.contains('hidden')).toBe(false);
      expect(pauseIcon.classList.contains('hidden')).toBe(true);
    });
  });

  describe('restart button', () => {
    it('should reset currentTime to 0 and play', () => {
      const video = doc._elements['animation-video'];
      const restartBtn = doc._elements['animation-restart-btn'];
      video.currentTime = 50;
      restartBtn._fire('click');
      expect(video.currentTime).toBe(0);
      expect(video.play).toHaveBeenCalled();
    });
  });

  describe('progress bar', () => {
    it('should update width on timeupdate', () => {
      const video = doc._elements['animation-video'];
      const progressBar = doc._elements['animation-progress'];
      video.currentTime = 25;
      video.duration = 100;
      video._fire('timeupdate');
      expect(progressBar.style.width).toBe('25%');
    });

    it('should not update when duration is 0', () => {
      const video = doc._elements['animation-video'];
      const progressBar = doc._elements['animation-progress'];
      video.duration = 0;
      video._fire('timeupdate');
      expect(progressBar.style.width).toBeUndefined();
    });
  });

  describe('hide/show toggle', () => {
    it('should hide animation container and pause video on first click', () => {
      const toggleBtn = doc._elements['animation-toggle-btn'];
      const container = doc._elements['animation-container'];
      const video = doc._elements['animation-video'];
      toggleBtn._fire('click');
      expect(container.classList.contains('hidden')).toBe(true);
      expect(toggleBtn.textContent).toBe('Show');
      expect(video.pause).toHaveBeenCalled();
      expect(controls.animationHidden).toBe(true);
    });

    it('should show animation container and play video on second click', () => {
      const toggleBtn = doc._elements['animation-toggle-btn'];
      const container = doc._elements['animation-container'];
      const video = doc._elements['animation-video'];
      toggleBtn._fire('click'); // hide
      toggleBtn._fire('click'); // show
      expect(container.classList.contains('hidden')).toBe(false);
      expect(toggleBtn.textContent).toBe('Hide');
      expect(controls.animationHidden).toBe(false);
    });
  });

  describe('video click', () => {
    it('should toggle play/pause on video click', () => {
      const video = doc._elements['animation-video'];
      video.paused = true;
      video._fire('click');
      expect(video.play).toHaveBeenCalled();

      video.paused = false;
      video._fire('click');
      expect(video.pause).toHaveBeenCalled();
    });
  });
});
