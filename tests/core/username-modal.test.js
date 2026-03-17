import { describe, expect, it, vi, beforeEach } from 'vitest';
import { UsernameModal } from '../../platform/core/username-modal.js';

function createClassList(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
    add: (...tokens) => tokens.forEach((t) => classes.add(t)),
    remove: (...tokens) => tokens.forEach((t) => classes.delete(t)),
    contains: (token) => classes.has(token)
  };
}

function createMockElement({ classes = [], value = '', textContent = '' } = {}) {
  const listeners = {};
  return {
    classList: createClassList(classes),
    value,
    textContent,
    innerHTML: '',
    focus: vi.fn(),
    click: vi.fn(),
    appendChild: vi.fn(),
    addEventListener: vi.fn((event, fn) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    }),
    _fire(event, data) {
      listeners[event]?.forEach((fn) => fn(data || { target: this, key: undefined, preventDefault: vi.fn() }));
    }
  };
}

function createDocumentLike() {
  const elements = {
    'username-modal': createMockElement({ classes: ['hidden'] }),
    'username-input': createMockElement(),
    'username-error': createMockElement({ classes: ['hidden'] }),
    'signin-section': createMockElement(),
    'new-user-section': createMockElement({ classes: ['hidden'] }),
    'realname-input': createMockElement(),
    'password-input': createMockElement(),
    'existing-user-select': createMockElement(),
    'existing-password-input': createMockElement(),
    'existing-password-section': createMockElement({ classes: ['hidden'] }),
    'teacher-password-section': createMockElement({ classes: ['hidden'] }),
    'close-username-modal': createMockElement(),
    'current-username': createMockElement(),
    'new-user-link': createMockElement(),
    'back-to-signin': createMockElement(),
    'regenerate-username': createMockElement(),
    'signin-submit': createMockElement(),
    'register-submit': createMockElement(),
    'user-display': createMockElement(),
    'teacher-password-input': createMockElement(),
    'teacher-submit-btn': createMockElement()
  };

  return {
    getElementById: (id) => elements[id] || null,
    createElement: (tag) => createMockElement(),
    _elements: elements
  };
}

function createMockUserSystem(users = []) {
  return {
    getUsers: vi.fn(() => Promise.resolve(users)),
    verifyUser: vi.fn(() => Promise.resolve({ valid: true, realName: 'Test User' })),
    createUser: vi.fn(() => Promise.resolve({ success: true }))
  };
}

describe('UsernameModal', () => {
  let modal;
  let doc;
  let userSystem;
  let onSignIn;
  let onRegister;

  beforeEach(() => {
    doc = createDocumentLike();
    userSystem = createMockUserSystem([
      { username: 'alice', real_name: 'Alice Smith' },
      { username: 'bob', real_name: 'Bob Jones' }
    ]);
    onSignIn = vi.fn();
    onRegister = vi.fn();
    modal = new UsernameModal({
      documentLike: doc,
      userSystem,
      generateUsername: () => 'test-user-123',
      onSignIn,
      onRegister
    });
  });

  it('should construct with defaults', () => {
    const m = new UsernameModal();
    expect(m.isFirstVisit).toBe(true);
    expect(m.usersData).toEqual([]);
  });

  describe('show()', () => {
    it('should unhide the modal and populate users', async () => {
      await modal.show(false);
      const modalEl = doc._elements['username-modal'];
      expect(modalEl.classList.contains('hidden')).toBe(false);
      expect(userSystem.getUsers).toHaveBeenCalled();
    });

    it('should hide close button on first visit', async () => {
      await modal.show(true);
      const closeBtn = doc._elements['close-username-modal'];
      expect(closeBtn.classList.contains('hidden')).toBe(true);
    });

    it('should show close button on return visit', async () => {
      await modal.show(false);
      const closeBtn = doc._elements['close-username-modal'];
      expect(closeBtn.classList.contains('hidden')).toBe(false);
    });

    it('should set generated username', async () => {
      await modal.show();
      expect(doc._elements['username-input'].value).toBe('test-user-123');
    });
  });

  describe('hide()', () => {
    it('should add hidden class to modal', () => {
      modal.hide();
      expect(doc._elements['username-modal'].classList.contains('hidden')).toBe(true);
    });
  });

  describe('showNewUserForm()', () => {
    it('should show new user section and hide sign-in section', () => {
      modal.showNewUserForm();
      expect(doc._elements['signin-section'].classList.contains('hidden')).toBe(true);
      expect(doc._elements['new-user-section'].classList.contains('hidden')).toBe(false);
    });
  });

  describe('showSignInForm()', () => {
    it('should show sign-in section and hide new user section', () => {
      modal.showSignInForm();
      expect(doc._elements['new-user-section'].classList.contains('hidden')).toBe(true);
      expect(doc._elements['signin-section'].classList.contains('hidden')).toBe(false);
    });
  });

  describe('populateExistingUsers()', () => {
    it('should fetch and sort users', async () => {
      await modal.populateExistingUsers();
      expect(userSystem.getUsers).toHaveBeenCalled();
      expect(modal.usersData).toHaveLength(2);
    });

    it('should handle getUsers failure gracefully', async () => {
      userSystem.getUsers.mockRejectedValue(new Error('network error'));
      await expect(modal.populateExistingUsers()).resolves.not.toThrow();
    });
  });

  describe('signIn()', () => {
    it('should show error when no user selected', async () => {
      doc._elements['existing-user-select'].value = '';
      await modal.signIn();
      expect(doc._elements['username-error'].classList.contains('hidden')).toBe(false);
      expect(onSignIn).not.toHaveBeenCalled();
    });

    it('should show error on verify failure', async () => {
      doc._elements['existing-user-select'].value = 'alice';
      userSystem.verifyUser.mockResolvedValue({ error: 'Wrong password' });
      await modal.signIn();
      expect(doc._elements['username-error'].textContent).toBe('Wrong password');
      expect(onSignIn).not.toHaveBeenCalled();
    });

    it('should call onSignIn with user details on success', async () => {
      doc._elements['existing-user-select'].value = 'alice';
      doc._elements['existing-password-input'].value = 'pass123';
      userSystem.verifyUser.mockResolvedValue({ valid: true, realName: 'Alice Smith', isTeacher: false });
      await modal.signIn();
      expect(onSignIn).toHaveBeenCalledWith({
        username: 'alice',
        displayName: 'Alice Smith',
        password: 'pass123',
        isTeacher: false
      });
    });

    it('should pass isTeacher flag through', async () => {
      doc._elements['existing-user-select'].value = 'alice';
      userSystem.verifyUser.mockResolvedValue({ valid: true, realName: 'Alice', isTeacher: true });
      await modal.signIn();
      expect(onSignIn).toHaveBeenCalledWith(expect.objectContaining({ isTeacher: true }));
    });
  });

  describe('register()', () => {
    it('should show error when real name is empty', async () => {
      doc._elements['realname-input'].value = '';
      await modal.register();
      expect(doc._elements['username-error'].textContent).toBe('Please enter your name');
      expect(onRegister).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', async () => {
      doc._elements['realname-input'].value = 'Test User';
      doc._elements['password-input'].value = '';
      await modal.register();
      expect(doc._elements['username-error'].textContent).toBe('Please choose a password');
      expect(onRegister).not.toHaveBeenCalled();
    });

    it('should show error on createUser failure', async () => {
      doc._elements['realname-input'].value = 'Test';
      doc._elements['password-input'].value = 'pass';
      doc._elements['username-input'].value = 'testuser';
      userSystem.createUser.mockResolvedValue({ error: 'Username taken' });
      await modal.register();
      expect(doc._elements['username-error'].textContent).toBe('Username taken');
      expect(onRegister).not.toHaveBeenCalled();
    });

    it('should call onRegister with user details on success', async () => {
      doc._elements['realname-input'].value = 'Test User';
      doc._elements['password-input'].value = 'pass123';
      doc._elements['username-input'].value = 'test-user-123';
      await modal.register();
      expect(onRegister).toHaveBeenCalledWith({
        username: 'test-user-123',
        displayName: 'Test User'
      });
    });
  });

  describe('initEventListeners()', () => {
    it('should register event listeners without throwing', () => {
      expect(() => modal.initEventListeners()).not.toThrow();
    });

    it('should not throw with missing elements', () => {
      const emptyModal = new UsernameModal({
        documentLike: { getElementById: () => null }
      });
      expect(() => emptyModal.initEventListeners()).not.toThrow();
    });
  });
});
