import Store from './store.js';

/**
 * NyxWell Settings Module
 * Saves/loads user profile, health goals, notifications & emergency contact
 * to/from Firestore under users/{uid}.settings
 */
class SettingsModule {
  constructor() {
    this.initialized = false;
    window.Settings = this;
  }

  async init() {
    if (this.initialized) {
      // Re-fill form on every visit in case user changed account
      await this._loadIntoForm();
      return;
    }
    this._attachEvents();
    await this._loadIntoForm();
    this.initialized = true;
    console.log('NyxWell: Settings Module Ready.');
  }

  _attachEvents() {
    document.getElementById('btn-save-settings')?.addEventListener('click', () => this.save());
    document.getElementById('btn-reset-settings')?.addEventListener('click', () => this.resetToDefaults());
    document.getElementById('btn-export-data')?.addEventListener('click', () => this.exportData());
    document.getElementById('btn-delete-account')?.addEventListener('click', () => this.deleteAccount());
  }

  // ── READ FROM FORM ──
  _readForm() {
    return {
      displayName:    document.getElementById('set-display-name')?.value.trim() || '',
      age:            document.getElementById('set-age')?.value || '',
      gender:         document.getElementById('set-gender')?.value || '',
      bio:            document.getElementById('set-bio')?.value.trim() || '',
      goals: {
        mood:         document.getElementById('set-mood-goal')?.value || '7',
        sleep:        document.getElementById('set-sleep-goal')?.value || '8',
        stress:       document.getElementById('set-stress-goal')?.value || '5',
        focus:        document.getElementById('set-focus')?.value || '',
        reminderTime: document.getElementById('set-reminder-time')?.value || '09:00',
        experience:   document.getElementById('set-experience')?.value || 'beginner',
      },
      emergency: {
        name:  document.getElementById('set-ec-name')?.value.trim() || '',
        phone: document.getElementById('set-ec-phone')?.value.trim() || '',
      },
      notifications: {
        checkin: document.getElementById('set-notif-checkin')?.checked ?? true,
        weekly:  document.getElementById('set-notif-weekly')?.checked ?? true,
        mentor:  document.getElementById('set-notif-mentor')?.checked ?? true,
      }
    };
  }

  // ── WRITE TO FORM ──
  _fillForm(s) {
    if (!s) return;
    this._set('set-display-name', s.displayName);
    this._set('set-age',          s.age);
    this._set('set-gender',       s.gender);
    this._set('set-bio',          s.bio);

    if (s.goals) {
      this._set('set-mood-goal',     s.goals.mood);
      this._set('set-sleep-goal',    s.goals.sleep);
      this._set('set-stress-goal',   s.goals.stress);
      this._set('set-focus',         s.goals.focus);
      this._set('set-reminder-time', s.goals.reminderTime);
      this._set('set-experience',    s.goals.experience);
    }

    if (s.emergency) {
      this._set('set-ec-name',  s.emergency.name);
      this._set('set-ec-phone', s.emergency.phone);
    }

    if (s.notifications) {
      this._check('set-notif-checkin', s.notifications.checkin);
      this._check('set-notif-weekly',  s.notifications.weekly);
      this._check('set-notif-mentor',  s.notifications.mentor);
    }
  }

  _set(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null && val !== '') el.value = val;
  }

  _check(id, val) {
    const el = document.getElementById(id);
    if (el) el.checked = !!val;
  }

  // ── LOAD ──
  async _loadIntoForm() {
    // Always pre-fill email from auth
    const user = Store.getCurrentUser();
    const emailEl = document.getElementById('set-email');
    if (emailEl && user) emailEl.value = user.email || '';

    const saved = await Store.getSettings();
    if (saved) {
      this._fillForm(saved);
    }
  }

  // ── SAVE ──
  async save() {
    const btn = document.getElementById('btn-save-settings');
    btn.textContent = '⏳ SAVING...';
    btn.disabled = true;

    const data = this._readForm();
    const result = await Store.saveSettings(data);

    if (result?.success) {
      // Also update the overview greeting with display name
      const greeting = document.getElementById('overview-greeting');
      if (greeting && data.displayName) {
        greeting.textContent = `Welcome back, ${data.displayName}!`;
      }
      this._showBanner();
      btn.textContent = '✅ SAVED!';
      setTimeout(() => {
        btn.textContent = '💾 SAVE ALL SETTINGS';
        btn.disabled = false;
      }, 2000);
    } else {
      btn.textContent = '❌ SAVE FAILED';
      btn.disabled = false;
      setTimeout(() => { btn.textContent = '💾 SAVE ALL SETTINGS'; }, 2000);
    }
  }

  _showBanner() {
    const banner = document.getElementById('settings-save-banner');
    if (!banner) return;
    banner.style.display = 'block';
    setTimeout(() => { banner.style.display = 'none'; }, 3000);
  }

  // ── RESET ──
  resetToDefaults() {
    if (!confirm('Reset all settings to defaults? Your profile info will be cleared.')) return;
    const defaults = {
      displayName: '', age: '', gender: '', bio: '',
      goals: { mood: '7', sleep: '8', stress: '5', focus: '', reminderTime: '09:00', experience: 'beginner' },
      emergency: { name: '', phone: '' },
      notifications: { checkin: true, weekly: true, mentor: true }
    };
    this._fillForm(defaults);
  }

  // ── EXPORT DATA ──
  async exportData() {
    const btn = document.getElementById('btn-export-data');
    btn.textContent = '⏳ GENERATING...';
    btn.disabled = true;

    try {
      const user = Store.getCurrentUser();
      const settings = await Store.getSettings();
      const profile = await Store.getOnboardingStatus();

      const exportObj = {
        exportedAt: new Date().toISOString(),
        uid: user?.uid,
        email: user?.email,
        profile: profile?.onboardingData || {},
        settings: settings || {},
      };

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `nyxwell-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      btn.textContent = '✅ DOWNLOADED';
    } catch (e) {
      btn.textContent = '❌ EXPORT FAILED';
      console.error('Export error:', e);
    }

    setTimeout(() => {
      btn.textContent = '📦 EXPORT MY DATA (JSON)';
      btn.disabled = false;
    }, 2500);
  }

  // ── DELETE ACCOUNT ──
  async deleteAccount() {
    if (!confirm('⚠️ Are you absolutely sure? This will permanently delete your account and all data. This CANNOT be undone.')) return;
    if (!confirm('Last warning — your mood logs, journal entries and all wellness data will be gone forever. Continue?')) return;

    const btn = document.getElementById('btn-delete-account');
    btn.textContent = '⏳ DELETING...';
    btn.disabled = true;

    try {
      const user = Store.getCurrentUser();
      await user.delete();
      alert('Your account has been deleted. We hope to support you again some day. 💚');
      window.nyxwell?.showPage('home');
    } catch (e) {
      // Firebase requires recent login for account deletion
      if (e.code === 'auth/requires-recent-login') {
        alert('For security, please log out and log back in before deleting your account.');
      } else {
        alert('Delete failed: ' + e.message);
      }
      btn.textContent = '🗑️ DELETE ACCOUNT';
      btn.disabled = false;
    }
  }
}

export default new SettingsModule();
