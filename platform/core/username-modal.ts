/**
 * Username Modal — sign-in / registration UI with keyboard support.
 *
 * Extracted from app.html (opportunistic extraction pass).
 */
import type { DocumentLike, UserSystemLike, UserInfo } from './types.ts';

export interface SignInPayload {
  username: string;
  displayName: string;
  password: string | undefined;
  isTeacher: boolean;
}

export interface RegisterPayload {
  username: string | undefined;
  displayName: string;
}

export interface UsernameModalConfig {
  documentLike?: DocumentLike | null;
  userSystem?: UserSystemLike | null;
  generateUsername?: () => string;
  onSignIn?: (payload: SignInPayload) => void | Promise<void>;
  onRegister?: (payload: RegisterPayload) => void | Promise<void>;
}

export class UsernameModal {
  documentLike: DocumentLike | null;
  userSystem: UserSystemLike | null;
  generateUsername: () => string;
  onSignIn: (payload: SignInPayload) => void | Promise<void>;
  onRegister: (payload: RegisterPayload) => void | Promise<void>;
  isFirstVisit: boolean;
  usersData: UserInfo[];

  constructor(config: UsernameModalConfig = {}) {
    this.documentLike = config.documentLike || globalThis.document || null;
    this.userSystem = config.userSystem || null;
    this.generateUsername = config.generateUsername || (() => 'user-' + Math.random().toString(36).slice(2, 8));
    this.onSignIn = config.onSignIn || (() => {});
    this.onRegister = config.onRegister || (() => {});

    this.isFirstVisit = true;
    this.usersData = [];
  }

  getElement(id: string): HTMLElement | null {
    return this.documentLike?.getElementById?.(id) || null;
  }

  async show(isFirstVisit = false): Promise<void> {
    this.isFirstVisit = isFirstVisit;
    this.getElement('username-modal')?.classList.remove('hidden');
    const usernameInput = this.getElement('username-input') as HTMLInputElement | null;
    if (usernameInput) usernameInput.value = this.generateUsername();
    this.getElement('username-error')?.classList.add('hidden');

    // Reset to sign-in view (primary)
    this.getElement('signin-section')?.classList.remove('hidden');
    this.getElement('new-user-section')?.classList.add('hidden');

    // Clear previous inputs
    const realname = this.getElement('realname-input') as HTMLInputElement | null;
    if (realname) realname.value = '';
    const password = this.getElement('password-input') as HTMLInputElement | null;
    if (password) password.value = '';
    const existingSelect = this.getElement('existing-user-select') as HTMLSelectElement | null;
    if (existingSelect) existingSelect.value = '';
    const existingPassword = this.getElement('existing-password-input') as HTMLInputElement | null;
    if (existingPassword) existingPassword.value = '';
    this.getElement('existing-password-section')?.classList.add('hidden');
    this.getElement('teacher-password-section')?.classList.add('hidden');

    // Show/hide close button based on first visit
    const closeBtn = this.getElement('close-username-modal');
    if (closeBtn) {
      if (isFirstVisit) {
        closeBtn.classList.add('hidden');
      } else {
        closeBtn.classList.remove('hidden');
      }
    }

    // Populate existing users dropdown
    await this.populateExistingUsers();

    // Focus the dropdown (primary action is sign-in now)
    setTimeout(() => {
      (this.getElement('existing-user-select') as HTMLElement | null)?.focus();
    }, 100);
  }

  hide(): void {
    this.getElement('username-modal')?.classList.add('hidden');
  }

  showNewUserForm(): void {
    this.getElement('signin-section')?.classList.add('hidden');
    this.getElement('new-user-section')?.classList.remove('hidden');
    this.getElement('username-error')?.classList.add('hidden');
    const usernameInput = this.getElement('username-input') as HTMLInputElement | null;
    if (usernameInput) usernameInput.value = this.generateUsername();
    setTimeout(() => (this.getElement('realname-input') as HTMLElement | null)?.focus(), 50);
  }

  showSignInForm(): void {
    this.getElement('new-user-section')?.classList.add('hidden');
    this.getElement('signin-section')?.classList.remove('hidden');
    this.getElement('username-error')?.classList.add('hidden');
    setTimeout(() => (this.getElement('existing-user-select') as HTMLElement | null)?.focus(), 50);
  }

  async populateExistingUsers(): Promise<void> {
    const select = this.getElement('existing-user-select');
    if (!select) return;
    select.innerHTML = '<option value="">Select your name...</option>';

    try {
      const users = await this.userSystem?.getUsers?.() || [];
      this.usersData = users;

      // Sort by real_name first, then username
      users.sort((a: UserInfo, b: UserInfo) => {
        const nameA = (a.real_name || a.username).toLowerCase();
        const nameB = (b.real_name || b.username).toLowerCase();
        return nameA.localeCompare(nameB);
      });

      for (const user of users) {
        const option = this.documentLike?.createElement?.('option');
        if (!option) break;
        (option as HTMLOptionElement).value = user.username;
        option.textContent = user.real_name
          ? `${user.real_name} (${user.username})`
          : user.username;
        select.appendChild(option);
      }
    } catch (err) {
      console.warn('Could not load existing users:', err);
    }
  }

  _showError(message: string): void {
    const errorEl = this.getElement('username-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }

  async signIn(): Promise<void> {
    const existingSelect = this.getElement('existing-user-select') as HTMLSelectElement | null;
    const existingPassword = this.getElement('existing-password-input') as HTMLInputElement | null;

    if (!existingSelect?.value) {
      this._showError('Please select your name');
      return;
    }

    const result = await this.userSystem?.verifyUser?.(existingSelect.value, existingPassword?.value);
    if (result?.error) {
      this._showError(result.error);
      return;
    }

    // Use real name from server response or fall back to stored data
    const displayName = result?.realName
      || this.usersData.find(u => u.username === existingSelect.value)?.real_name
      || existingSelect.value;

    this.hide();

    await this.onSignIn({
      username: existingSelect.value,
      displayName,
      password: existingPassword?.value,
      isTeacher: result?.isTeacher || false
    });
  }

  async register(): Promise<void> {
    const usernameInput = this.getElement('username-input') as HTMLInputElement | null;
    const realNameInput = this.getElement('realname-input') as HTMLInputElement | null;
    const passwordInput = this.getElement('password-input') as HTMLInputElement | null;

    const username = usernameInput?.value?.trim();
    const realName = realNameInput?.value?.trim();
    const password = passwordInput?.value;

    if (!realName) {
      this._showError('Please enter your name');
      return;
    }

    if (!password) {
      this._showError('Please choose a password');
      return;
    }

    const result = await this.userSystem?.createUser?.(username!, realName, password);
    if (result?.error) {
      this._showError(result.error);
      return;
    }

    this.hide();

    await this.onRegister({
      username,
      displayName: realName || username!
    });
  }

  initEventListeners(): void {
    // Toggle between sign-in and new user forms
    this.getElement('new-user-link')?.addEventListener('click', () => this.showNewUserForm());
    this.getElement('back-to-signin')?.addEventListener('click', () => this.showSignInForm());

    // Existing user dropdown - show password field when selected
    this.getElement('existing-user-select')?.addEventListener('change', (e: Event) => {
      const passwordSection = this.getElement('existing-password-section');
      const passwordInput = this.getElement('existing-password-input') as HTMLElement | null;
      if ((e.target as HTMLSelectElement).value) {
        passwordSection?.classList.remove('hidden');
        setTimeout(() => passwordInput?.focus(), 50);
      } else {
        passwordSection?.classList.add('hidden');
      }
    });

    this.getElement('regenerate-username')?.addEventListener('click', () => {
      const input = this.getElement('username-input') as HTMLInputElement | null;
      if (input) input.value = this.generateUsername();
    });

    // Sign in and register button handlers
    this.getElement('signin-submit')?.addEventListener('click', () => this.signIn());
    this.getElement('register-submit')?.addEventListener('click', () => this.register());

    this.getElement('close-username-modal')?.addEventListener('click', () => this.hide());
    this.getElement('user-display')?.addEventListener('click', () => this.show(false));

    // Keyboard support
    this._initKeyboardListeners();
  }

  _initKeyboardListeners(): void {
    // Enter key to submit from registration form fields
    ['realname-input', 'password-input'].forEach(id => {
      this.getElement(id)?.addEventListener('keydown', (e: Event) => {
        if ((e as KeyboardEvent).key === 'Enter') {
          e.preventDefault();
          this.register();
        }
      });
    });

    // Enter key to submit from existing user password field
    this.getElement('existing-password-input')?.addEventListener('keydown', (e: Event) => {
      if ((e as KeyboardEvent).key === 'Enter') {
        e.preventDefault();
        this.signIn();
      }
    });

    // Enter key to submit from teacher password field
    this.getElement('teacher-password-input')?.addEventListener('keydown', (e: Event) => {
      if ((e as KeyboardEvent).key === 'Enter') {
        e.preventDefault();
        this.getElement('teacher-submit-btn')?.click();
      }
    });

    // R key to regenerate username when focused on username field
    this.getElement('username-input')?.addEventListener('keydown', (e: Event) => {
      if ((e as KeyboardEvent).key === 'r' || (e as KeyboardEvent).key === 'R') {
        e.preventDefault();
        const input = this.getElement('username-input') as HTMLInputElement | null;
        if (input) input.value = this.generateUsername();
      }
    });

    // Focus existing password when selecting from dropdown
    this.getElement('existing-user-select')?.addEventListener('keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter' && (e.target as HTMLSelectElement).value) {
        e.preventDefault();
        const passwordSection = this.getElement('existing-password-section');
        if (passwordSection && !passwordSection.classList.contains('hidden')) {
          this.getElement('existing-password-input')?.focus();
        } else {
          this.signIn();
        }
      }
    });
  }
}
