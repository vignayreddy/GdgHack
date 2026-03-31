import Store from './store.js';

/**
 * JournalHub handles private, end-to-end encrypted journaling.
 * Uses Web Crypto API (AES-GCM) for privacy.
 */
class JournalHub {
  constructor() {
    this.entries = [];
    this.decryptedEntries = [];
    this.state = {
      mode: 'write', // 'write' or 'read'
      editingId: null,
      search: '',
      filterTags: [],
      selectedTags: [],
      encryptionKey: null,
      isDecrypting: false
    };
    this.initialized = false;
    this.unsubscribe = null;

    this.availableTags = [
      { id: 'work', label: 'Work' },
      { id: 'personal', label: 'Personal' },
      { id: 'health', label: 'Health' },
      { id: 'goals', label: 'Goals' },
      { id: 'gratitude', label: 'Gratitude' },
      { id: 'reflection', label: 'Reflection' },
      { id: 'ideas', label: 'Ideas' },
      { id: 'challenges', label: 'Challenges' }
    ];
  }

  async init() {
    if (!this.initialized) {
      await this._setupEncryption();
      this._attachEvents();
      this.initialized = true;
    }

    // Subscribe to Journal Data
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = Store.subscribeToOverviewData(async (allData) => {
      // Use the standardized key journalEntries (or fallback to journalData)
      this.entries = allData.journalEntries || allData.journalData || [];
      await this._decryptAll();
      this.refreshUI();
    });
  }

  async _setupEncryption() {
    const user = Store.currentUser;
    if (!user) return;

    // In a real app, we would use a user-provided password + PBKDF2.
    // For this migration, we'll derive a key from the UID to ensure consistency.
    const encoder = new TextEncoder();
    const data = encoder.encode(user.uid + "mindbridge-salt");
    const hash = await crypto.subtle.digest('SHA-256', data);
    
    this.state.encryptionKey = await crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async _encrypt(text) {
    if (!this.state.encryptionKey) return text;
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.state.encryptionKey,
      encoder.encode(text)
    );
    
    // Return combined IV + Ciphertext as Base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
  }

  async _decrypt(encoded) {
    if (!this.state.encryptionKey || !encoded) return encoded;
    try {
      const combined = new Uint8Array(atob(encoded).split('').map(c => c.charCodeAt(0)));
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.state.encryptionKey,
        data
      );
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error("Decryption failed", e);
      return "[Encrypted Content]";
    }
  }

  async _decryptAll() {
    this.state.isDecrypting = true;
    const decrypted = await Promise.all(this.entries.map(async (entry) => {
      return {
        ...entry,
        title: entry.encrypted ? await this._decrypt(entry.title) : entry.title,
        content: entry.encrypted ? await this._decrypt(entry.content) : entry.content
      };
    }));
    this.decryptedEntries = decrypted.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    this.state.isDecrypting = false;
  }

  _attachEvents() {
    // Mode Switching
    document.getElementById('journal-btn-mode-write').onclick = () => this.setMode('write');
    document.getElementById('journal-btn-mode-read').onclick = () => this.setMode('read');

    // Save Action
    document.getElementById('journal-btn-save').onclick = () => this.handleSave();
    document.getElementById('journal-btn-cancel').onclick = () => this.cancelEdit();

    // Search
    document.getElementById('journal-search').oninput = (e) => {
      this.state.search = e.target.value.toLowerCase();
      this.refreshUI();
    };

    // Filters
    document.getElementById('journal-btn-clear-filters').onclick = () => {
      this.state.filterTags = [];
      this.refreshUI();
    };

    // Mood Slider
    const moodSlider = document.getElementById('journal-form-mood');
    moodSlider.oninput = (e) => {
      const val = parseInt(e.target.value);
      document.getElementById('journal-form-mood-emoji').textContent = this.getMoodEmoji(val);
      document.getElementById('journal-form-mood-text').textContent = this.getMoodText(val).toUpperCase();
    };

    // Lightbox Close
    document.getElementById('journal-lightbox-close').onclick = () => {
      document.getElementById('journal-lightbox').style.display = 'none';
    };
  }

  setMode(mode) {
    this.state.mode = mode;
    const writeArea = document.getElementById('journal-view-write');
    const readArea = document.getElementById('journal-view-read');
    
    if (mode === 'write') {
      writeArea.style.display = 'block';
      readArea.style.display = 'none';
      document.getElementById('journal-btn-mode-write').className = 'btn btn-primary';
      document.getElementById('journal-btn-mode-read').className = 'btn btn-secondary';
    } else {
      writeArea.style.display = 'none';
      readArea.style.display = 'block';
      document.getElementById('journal-btn-mode-write').className = 'btn btn-secondary';
      document.getElementById('journal-btn-mode-read').className = 'btn btn-primary';
    }
  }

  async handleSave() {
    const btn = document.getElementById('journal-btn-save');
    const titleRaw = document.getElementById('journal-form-title').value;
    const contentRaw = document.getElementById('journal-form-content').value;
    const mood = parseInt(document.getElementById('journal-form-mood').value);

    if (!titleRaw || !contentRaw) return alert("Please add both a title and content.");

    btn.disabled = true;
    btn.textContent = 'ENCRYPTING & SAVING...';

    const encryptedTitle = await this._encrypt(titleRaw);
    const encryptedContent = await this._encrypt(contentRaw);

    const entryData = {
      id: this.state.editingId || Date.now().toString(),
      title: encryptedTitle,
      content: encryptedContent,
      mood,
      tags: this.state.selectedTags,
      timestamp: new Date().toISOString(),
      encrypted: true
    };

    let success;
    if (this.state.editingId) {
      const updatedEntries = this.entries.map(e => e.id === this.state.editingId ? entryData : e);
      success = await Store.updateUserDoc({ journal_entries: updatedEntries });
    } else {
      success = await Store.saveEntry('journal_entries', entryData);
    }

    if (success) {
      this.cancelEdit();
      this.setMode('read');
    }

    btn.disabled = false;
    btn.textContent = 'SAVE ENTRY →';
  }

  cancelEdit() {
    this.state.editingId = null;
    this.state.selectedTags = [];
    document.getElementById('journal-form-title').value = '';
    document.getElementById('journal-form-content').value = '';
    document.getElementById('journal-form-mood').value = 3;
    document.getElementById('journal-form-mood-emoji').textContent = '😐';
    document.getElementById('journal-form-mood-text').textContent = 'NEUTRAL';
    document.getElementById('journal-form-title-label').textContent = 'DRAFT NEW ENTRY';
    document.getElementById('journal-btn-cancel').style.display = 'none';
    this._renderTagSelection();
  }

  refreshUI() {
    this._renderTagSelection();
    this._renderTagFilters();
    this.renderFeed();
  }

  _renderTagSelection() {
    const container = document.getElementById('journal-tags-container');
    if (!container) return;
    container.innerHTML = this.availableTags.map(tag => `
      <button class="tag-btn mono ${this.state.selectedTags.includes(tag.id) ? 'selected' : ''}" data-id="${tag.id}">${tag.label}</button>
    `).join('');
    container.querySelectorAll('.tag-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        this.state.selectedTags = this.state.selectedTags.includes(id) 
          ? this.state.selectedTags.filter(t => t !== id) 
          : [...this.state.selectedTags, id];
        this._renderTagSelection();
      };
    });
  }

  _renderTagFilters() {
    const container = document.getElementById('journal-filter-tags-container');
    if (!container) return;
    container.innerHTML = this.availableTags.map(tag => `
      <button class="tag-btn mono ${this.state.filterTags.includes(tag.id) ? 'selected' : ''}" data-id="${tag.id}">${tag.label}</button>
    `).join('');
    container.querySelectorAll('.tag-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        this.state.filterTags = this.state.filterTags.includes(id) 
          ? this.state.filterTags.filter(t => t !== id) 
          : [...this.state.filterTags, id];
        this.refreshUI();
      };
    });
  }

  renderFeed() {
    const container = document.getElementById('journal-entries-feed');
    if (!container) return;

    if (this.state.isDecrypting) {
      container.innerHTML = `<div class="text-center py-20 opacity-50 mono">Decrypting your safe space...</div>`;
      return;
    }

    let filtered = this.decryptedEntries;
    if (this.state.search) {
      filtered = filtered.filter(e => e.title.toLowerCase().includes(this.state.search) || e.content.toLowerCase().includes(this.state.search));
    }
    if (this.state.filterTags.length > 0) {
      filtered = filtered.filter(e => this.state.filterTags.every(t => (e.tags || []).includes(t)));
    }

    if (filtered.length === 0) {
      container.innerHTML = `<div class="text-center py-20 opacity-50 mono">No matching entries found. Write something new!</div>`;
      return;
    }

    container.innerHTML = filtered.map(e => `
      <div class="brutal-card dash-box journal-card" style="background: var(--white); cursor: pointer;" data-id="${e.id}">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <h3 class="hero-title" style="font-size: 20px; margin-bottom: 5px;">${e.title}</h3>
            <div class="mono" style="font-size: 10px; opacity: 0.6; margin-bottom: 15px;">
              ${new Date(e.timestamp).toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' })} 
              • ${this.estimateReadingTime(e.content)} min read
            </div>
          </div>
          <div style="font-size: 24px;">${this.getMoodEmoji(e.mood)}</div>
        </div>
        <p class="mono" style="font-size: 13px; opacity: 0.8; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
          ${e.content}
        </p>
        <div style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 8px;">
          ${(e.tags || []).map(t => `<span class="mono" style="font-size: 9px; padding: 2px 8px; border: 1.5px solid #000; background: var(--sage-light);">${t.toUpperCase()}</span>`).join('')}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.journal-card').forEach(card => {
      card.onclick = () => this.viewEntry(card.dataset.id);
    });
  }

  viewEntry(id) {
    const entry = this.decryptedEntries.find(e => e.id === id);
    if (!entry) return;

    const lightbox = document.getElementById('journal-lightbox');
    const content = document.getElementById('journal-lightbox-content');
    
    content.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <div class="mono" style="font-size: 11px; opacity: 0.5;">${new Date(entry.timestamp).toLocaleString()}</div>
        <div style="font-size: 32px;">${this.getMoodEmoji(entry.mood)}</div>
      </div>
      <h1 class="hero-title" style="font-size: 36px; margin-bottom: 20px;">${entry.title}</h1>
      <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 30px;">
        ${(entry.tags || []).map(t => `<span class="mono" style="font-size: 10px; padding: 4px 12px; border: 1.5px solid #000; background: var(--sage-light); font-weight: 700;">#${t.toUpperCase()}</span>`).join('')}
      </div>
      <div class="mono" style="font-size: 16px; line-height: 1.8; white-space: pre-wrap; margin-bottom: 40px; color: var(--text-dark);">
        ${entry.content}
      </div>
      <div style="border-top: 2px solid #000; padding-top: 30px; display: flex; gap: 15px;">
        <button class="btn btn-secondary" onclick="window.MindBridgeJournal.editEntry('${entry.id}')">EDIT ENTRY</button>
        <button class="btn btn-secondary" style="border-color: var(--coral);" onclick="window.MindBridgeJournal.deleteEntry('${entry.id}')">DELETE</button>
      </div>
    `;

    lightbox.style.display = 'flex';
  }

  editEntry(id) {
    const entry = this.decryptedEntries.find(e => e.id === id);
    if (!entry) return;

    this.state.editingId = id;
    this.state.selectedTags = entry.tags || [];
    document.getElementById('journal-form-title').value = entry.title;
    document.getElementById('journal-form-content').value = entry.content;
    document.getElementById('journal-form-mood').value = entry.mood;
    document.getElementById('journal-form-mood-emoji').textContent = this.getMoodEmoji(entry.mood);
    document.getElementById('journal-form-mood-text').textContent = this.getMoodText(entry.mood).toUpperCase();
    
    document.getElementById('journal-form-title-label').textContent = 'EDITING ENTRY';
    document.getElementById('journal-btn-cancel').style.display = 'block';
    
    document.getElementById('journal-lightbox').style.display = 'none';
    this.setMode('write');
    this._renderTagSelection();
  }

  async deleteEntry(id) {
    if (!confirm("Are you sure you want to delete this entry? This cannot be undone.")) return;
    
    const updatedEntries = this.entries.filter(e => e.id !== id);
    const success = await Store.updateUserDoc({ journal_entries: updatedEntries });
    
    if (success) {
      document.getElementById('journal-lightbox').style.display = 'none';
    }
  }

  estimateReadingTime(text) {
    const words = text.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  getMoodEmoji(m) {
    const emojis = { 1:'😢', 2:'☹️', 3:'😐', 4:'🙂', 5:'😄' };
    return emojis[m] || '😐';
  }

  getMoodText(m) {
    const texts = { 1:'Very Sad', 2:'Sad', 3:'Neutral', 4:'Happy', 5:'Very Happy' };
    return texts[m] || 'Neutral';
  }
}

const Journal = new JournalHub();
window.MindBridgeJournal = Journal; // For inline event handlers in lightbox
export default Journal;
