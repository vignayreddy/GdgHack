import Store from './store.js';

/**
 * MoodTracker handles the logic for the detailed Mood dashboard,
 * including Chart.js visualizations, tag-based logging, and cross-metric analysis.
 */
class MoodTracker {
  constructor() {
    this.data = [];
    this.charts = {
      timeline: null,
      distribution: null,
      weekday: null
    };
    this.state = {
      selectedTriggers: [],
      selectedActivities: [],
      filterRange: '30d'
    };
    this.initialized = false;
    
    this.triggerOptions = [
      { id: 'work', label: 'Work' },
      { id: 'relationships', label: 'Relationships' },
      { id: 'health', label: 'Health' },
      { id: 'finances', label: 'Finances' },
      { id: 'family', label: 'Family' },
      { id: 'social', label: 'Social' },
      { id: 'weather', label: 'Weather' },
      { id: 'sleep', label: 'Sleep' }
    ];

    this.activityOptions = [
      { id: 'exercise', label: 'Exercise' },
      { id: 'meditation', label: 'Meditation' },
      { id: 'reading', label: 'Reading' },
      { id: 'nature', label: 'Nature' },
      { id: 'hobbies', label: 'Hobbies' },
      { id: 'socializing', label: 'Socializing' },
      { id: 'entertainment', label: 'Entertainment' },
      { id: 'work', label: 'Deep Work' }
    ];

    this.unsubscribe = null;
  }

  async init() {
    if (!this.initialized) {
      this._renderTags();
      this._attachEvents();
      this.initialized = true;
    }
    
    // Subscribe to Mood Data specifically
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = Store.subscribeToOverviewData((allData) => {
      this.data = allData.moodData;
      this.refreshUI();
    });
  }

  _attachEvents() {
    // Save Entry
    document.getElementById('mood-btn-save')?.addEventListener('click', async () => {
      const btn = document.getElementById('mood-btn-save');
      const score = document.getElementById('mood-form-score').value;
      const notes = document.getElementById('mood-form-notes').value;
      
      btn.disabled = true;
      btn.textContent = 'SAVING...';

      const success = await Store.saveEntry('mood_entries', {
        score: parseFloat(score),
        notes,
        triggers: this.state.selectedTriggers,
        activities: this.state.selectedActivities
      });

      btn.disabled = false;
      btn.textContent = success ? 'SAVED!' : 'FAILED';
      
      if (success) {
        this.state.selectedTriggers = [];
        this.state.selectedActivities = [];
        document.getElementById('mood-form-notes').value = '';
        this._renderTags(); // Reset selection visuals
      }

      setTimeout(() => { btn.textContent = 'SAVE MOOD ENTRY →'; }, 2000);
    });

    // Seed Data
    document.getElementById('mood-btn-seed')?.addEventListener('click', () => this.seedSampleData());

    // Filter Change
    document.getElementById('mood-filters-range')?.addEventListener('change', (e) => {
      this.state.filterRange = e.target.value;
      this.refreshUI();
    });
  }

  _renderTags() {
    const triggerContainer = document.getElementById('mood-triggers-container');
    const activityContainer = document.getElementById('mood-activities-container');

    if (triggerContainer) {
      triggerContainer.innerHTML = this.triggerOptions.map(opt => `
        <button class="tag-btn mono ${this.state.selectedTriggers.includes(opt.id) ? 'selected' : ''}" 
                data-type="trigger" data-id="${opt.id}">${opt.label}</button>
      `).join('');
    }

    if (activityContainer) {
      activityContainer.innerHTML = this.activityOptions.map(opt => `
        <button class="tag-btn mono ${this.state.selectedActivities.includes(opt.id) ? 'selected' : ''}" 
                data-type="activity" data-id="${opt.id}">${opt.label}</button>
      `).join('');
    }

    // Add listener to tags
    [triggerContainer, activityContainer].forEach(container => {
      container?.querySelectorAll('.tag-btn').forEach(btn => {
        btn.onclick = () => {
          const type = btn.dataset.type;
          const id = btn.dataset.id;
          const list = type === 'trigger' ? this.state.selectedTriggers : this.state.selectedActivities;
          
          if (list.includes(id)) {
            const idx = list.indexOf(id);
            list.splice(idx, 1);
          } else {
            list.push(id);
          }
          this._renderTags(); // Re-render to update classes
        };
      });
    });
  }

  refreshUI() {
    const filtered = this._getFilteredData();
    this.renderInsights(filtered);
    this.renderHistory(filtered);
    this.renderCharts(filtered);
  }

  _getFilteredData() {
    const now = new Date();
    let startDate = new Date();
    const range = this.state.filterRange;

    if (range === '7d') startDate.setDate(now.getDate() - 7);
    else if (range === '30d') startDate.setDate(now.getDate() - 30);
    else if (range === '90d') startDate.setDate(now.getDate() - 90);
    else if (range === 'all') startDate = new Date(0);

    return this.data.filter(entry => new Date(entry.timestamp) >= startDate);
  }

  // ── INSIGHTS LOGIC ──

  renderInsights(filtered) {
    if (filtered.length === 0) return;

    // 1. Average & Trend
    const avg = (filtered.reduce((acc, e) => acc + e.score, 0) / filtered.length).toFixed(1);
    document.getElementById('mood-avg-val').textContent = avg + '/10';
    document.getElementById('mood-avg-emoji').textContent = this.getMoodEmoji(parseFloat(avg));

    // Trend (Last 50% vs First 50% of filtered range)
    if (filtered.length >= 4) {
      const sorted = [...filtered].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
      const mid = Math.floor(sorted.length / 2);
      const firstHalf = sorted.slice(0, mid);
      const secondHalf = sorted.slice(mid);
      const firstAvg = firstHalf.reduce((s, e) => s + e.score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, e) => s + e.score, 0) / secondHalf.length;
      const diff = secondAvg - firstAvg;

      const icon = document.getElementById('mood-trend-icon');
      const text = document.getElementById('mood-trend-text');
      if (diff > 0.5) { icon.textContent = '↗️'; text.textContent = 'IMPROVING TREND'; }
      else if (diff < -0.5) { icon.textContent = '↘️'; text.textContent = 'DECLINING TREND'; }
      else { icon.textContent = '→'; text.textContent = 'STABLE TREND'; }
    }

    // 2. Patterns
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayAvgs = weekdays.map((name, idx) => {
      const entries = filtered.filter(e => new Date(e.timestamp).getDay() === idx);
      return { name, avg: entries.length ? entries.reduce((s,e) => s+e.score,0)/entries.length : 0 };
    });
    const bestDay = dayAvgs.reduce((a, b) => b.avg > a.avg ? b : a, {name: '--', avg: 0});
    document.getElementById('mood-best-day').textContent = bestDay.name;

    // Variability (Std Dev)
    const variance = filtered.reduce((sq, n) => sq + Math.pow(n.score - avg, 2), 0) / filtered.length;
    document.getElementById('mood-variability').textContent = Math.sqrt(variance).toFixed(1) + ' pts';

    // 3. Extremes
    const highest = filtered.reduce((a, b) => b.score > a.score ? b : a, filtered[0]);
    const lowest = filtered.reduce((a, b) => b.score < a.score ? b : a, filtered[0]);
    document.getElementById('mood-highest-day').textContent = new Date(highest.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'});
    document.getElementById('mood-lowest-day').textContent = new Date(lowest.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'});
  }

  // ── CHARTS ──

  renderCharts(filtered) {
    if (filtered.length === 0) return;
    const isDark = false; // Add dark mode check if needed

    // Timeline Chart
    const sorted = [...filtered].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
    this._createOrUpdateChart('timeline', 'line', {
      labels: sorted.map(e => new Date(e.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'})),
      datasets: [{
        label: 'Mood Level',
        data: sorted.map(e => e.score),
        borderColor: '#E63946',
        backgroundColor: 'rgba(230, 57, 70, 0.1)',
        tension: 0.4,
        fill: true,
        borderWidth: 3
      }]
    }, { 
      scales: { y: { min: 1, max: 10 } },
      plugins: { legend: { display: false } }
    });

    // Distribution Chart
    const dist = [0,0,0,0,0]; // 1-2, 3-4, 5-6, 7-8, 9-10
    filtered.forEach(e => {
      const idx = Math.min(Math.floor((e.score - 1) / 2), 4);
      dist[idx]++;
    });
    this._createOrUpdateChart('distribution', 'bar', {
      labels: ['1-2', '3-4', '5-6', '7-8', '9-10'],
      datasets: [{
        data: dist,
        backgroundColor: ['#F44336', '#FF9800', '#FFC107', '#8BC34A', '#4CAF50'],
        borderWidth: 2,
        borderColor: '#000'
      }]
    }, { plugins: { legend: { display: false } } });

    // Weekday Averages
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayAvgs = weekdays.map((name, idx) => {
      const entries = filtered.filter(e => new Date(e.timestamp).getDay() === idx);
      return entries.length ? entries.reduce((s,e) => s+e.score,0)/entries.length : 0;
    });
    this._createOrUpdateChart('weekday', 'bar', {
      labels: weekdays,
      datasets: [{
        data: dayAvgs,
        backgroundColor: '#264653',
        borderWidth: 2,
        borderColor: '#000'
      }]
    }, { scales: { y: { min: 0, max: 10 } }, plugins: { legend: { display: false } } });
  }

  _createOrUpdateChart(id, type, data, options = {}) {
    const canvas = document.getElementById(`chart-${id}`);
    if (!canvas) return;

    if (this.charts[id]) {
      this.charts[id].data = data;
      this.charts[id].update();
    } else {
      this.charts[id] = new Chart(canvas, {
        type,
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          ...options
        }
      });
    }
  }

  renderHistory(filtered) {
    const list = document.getElementById('mood-entries-list');
    if (!list) return;

    const sorted = [...filtered].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
    
    if (sorted.length === 0) {
      list.innerHTML = '<p class="mono" style="font-size: 12px; opacity: 0.5;">No history entries found in this range.</p>';
      return;
    }

    list.innerHTML = sorted.map(e => `
      <div class="brutal-card" style="padding: 15px; background: var(--white); box-shadow: 4px 4px 0 var(--text-dark);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">${this.getMoodEmoji(e.score)}</span>
            <span class="mono" style="font-weight: 800; font-size: 14px;">MOOD: ${e.score}/10</span>
          </div>
          <span class="mono" style="font-size: 10px; opacity: 0.6;">${new Date(e.timestamp).toLocaleString()}</span>
        </div>
        ${e.notes ? `<p class="mono" style="font-size: 12px; opacity: 0.8; margin: 10px 0;">${e.notes}</p>` : ''}
        <div style="display: flex; flex-wrap: wrap; gap: 5px;">
          ${(e.triggers || []).map(t => `<span class="mono" style="font-size: 9px; padding: 2px 6px; border: 1px solid #000; background: var(--sage-light);">${t.toUpperCase()}</span>`).join('')}
          ${(e.activities || []).map(a => `<span class="mono" style="font-size: 9px; padding: 2px 6px; border: 1px solid #000; background: var(--coral-light);">${a.toUpperCase()}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  getMoodEmoji(score) {
    if (score >= 9) return '😄'; if (score >= 7) return '🙂';
    if (score >= 5) return '😐'; if (score >= 3) return '☹️';
    return '😢';
  }

  async seedSampleData() {
    const samples = [
        { score: 8, triggers: ['work'], activities: ['exercise', 'socializing'], notes: 'Finished a major sprint!', dayOffset: 0 },
        { score: 4, triggers: ['weather', 'health'], activities: ['hobbies'], notes: 'Feeling a bit sluggish.', dayOffset: 1 },
        { score: 6, triggers: ['social'], activities: ['nature'], notes: 'Nice walk in the park.', dayOffset: 2 },
        { score: 9, triggers: ['family'], activities: ['meditation'], notes: 'Wonderful dinner with siblings.', dayOffset: 3 },
        { score: 3, triggers: ['finances'], activities: ['journaling'], notes: 'Stressed about bills.', dayOffset: 4 },
        { score: 7, triggers: ['hobbies'], activities: ['reading'], notes: 'Highly focused day.', dayOffset: 5 },
        { score: 5, triggers: ['work'], activities: ['work'], notes: 'Just another Monday.', dayOffset: 6 },
    ];
    
    for(const s of samples) {
        const d = new Date(); d.setDate(d.getDate() - s.dayOffset);
        await Store.saveEntry('mood_entries', {
            score: s.score,
            triggers: s.triggers,
            activities: s.activities,
            notes: s.notes,
            timestamp: d.toISOString()
        });
    }
  }
}

const Mood = new MoodTracker();
export default Mood;
