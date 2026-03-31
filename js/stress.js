import Store from './store.js';

/**
 * StressTracker handles the logic for the Stress dashboard,
 * including intensity tracking, symptom frequency, and time-of-day analysis.
 */
class StressTracker {
  constructor() {
    this.data = [];
    this.charts = {
      timeline: null,
      weekday: null,
      sources: null,
      symptoms: null,
      timeslot: null
    };
    this.state = {
      selectedSources: [],
      selectedSymptoms: [],
      filterRange: '30d'
    };
    this.initialized = false;
    this.unsubscribe = null;

    this.sourceOptions = [
      { id: 'work', label: 'Work' },
      { id: 'relationships', label: 'Relationships' },
      { id: 'health', label: 'Health' },
      { id: 'finances', label: 'Finances' },
      { id: 'family', label: 'Family' },
      { id: 'environment', label: 'Environment' },
      { id: 'future', label: 'Future' },
      { id: 'social', label: 'Social' }
    ];

    this.symptomOptions = [
      { id: 'tension', label: 'Muscle Tension' },
      { id: 'headache', label: 'Headaches' },
      { id: 'fatigue', label: 'Fatigue' },
      { id: 'digestive', label: 'Digestive' },
      { id: 'sleep', label: 'Sleep Issues' },
      { id: 'focus', label: 'Poor Focus' },
      { id: 'mood', label: 'Mood Changes' },
      { id: 'heart', label: 'Racing Heart' }
    ];
  }

  async init() {
    if (!this.initialized) {
      this._renderSelectables();
      this._attachEvents();
      this.initialized = true;
    }

    // Subscribe to Stress Data
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = Store.subscribeToOverviewData((allData) => {
      this.data = allData.stressData;
      this.refreshUI();
    });
  }

  _attachEvents() {
    // Save Entry
    document.getElementById('stress-btn-save')?.addEventListener('click', async () => {
      const btn = document.getElementById('stress-btn-save');
      const level = document.getElementById('stress-form-level').value;
      const notes = document.getElementById('stress-form-notes').value;

      btn.disabled = true;
      btn.textContent = 'SAVING...';

      const success = await Store.saveEntry('stress_entries', {
        level: parseInt(level),
        sources: this.state.selectedSources,
        symptoms: this.state.selectedSymptoms,
        notes
      });

      btn.disabled = false;
      btn.textContent = success ? 'SAVED!' : 'FAILED';

      if (success) {
        this.state.selectedSources = [];
        this.state.selectedSymptoms = [];
        document.getElementById('stress-form-notes').value = '';
        this._renderSelectables();
      }
      setTimeout(() => btn.textContent = 'SAVE STRESS ENTRY →', 2000);
    });

    // Slider UI updates
    document.getElementById('stress-form-level').addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      document.getElementById('stress-form-level-val').textContent = val;
      document.getElementById('stress-form-level-text').textContent = this.getStressLevelText(val).toUpperCase() + ' STRESS';
    });

    // Filter range
    document.getElementById('stress-filters-range')?.addEventListener('change', (e) => {
      this.state.filterRange = e.target.value;
      this.refreshUI();
    });

    // Seed Data
    document.getElementById('stress-btn-seed')?.addEventListener('click', () => this.seedSampleData());
  }

  _renderSelectables() {
    // Render Sources
    const srcContainer = document.getElementById('stress-sources-container');
    if (srcContainer) {
      srcContainer.innerHTML = this.sourceOptions.map(opt => `
        <button class="tag-btn mono ${this.state.selectedSources.includes(opt.id) ? 'selected' : ''}" 
                data-id="${opt.id}">${opt.label}</button>
      `).join('');
      srcContainer.querySelectorAll('.tag-btn').forEach(btn => {
        btn.onclick = () => {
          const id = btn.dataset.id;
          this.state.selectedSources = this.state.selectedSources.includes(id) 
            ? this.state.selectedSources.filter(x => x !== id) 
            : [...this.state.selectedSources, id];
          this._renderSelectables();
        };
      });
    }

    // Render Symptoms
    const symContainer = document.getElementById('stress-symptoms-container');
    if (symContainer) {
      symContainer.innerHTML = this.symptomOptions.map(opt => `
        <button class="tag-btn mono ${this.state.selectedSymptoms.includes(opt.id) ? 'selected' : ''}" 
                data-id="${opt.id}" style="border-color: var(--coral);">${opt.label}</button>
      `).join('');
      symContainer.querySelectorAll('.tag-btn').forEach(btn => {
        btn.onclick = () => {
          const id = btn.dataset.id;
          this.state.selectedSymptoms = this.state.selectedSymptoms.includes(id) 
            ? this.state.selectedSymptoms.filter(x => x !== id) 
            : [...this.state.selectedSymptoms, id];
          this._renderSelectables();
        };
      });
    }
  }

  refreshUI() {
    const filtered = this._getFilteredData();
    this.renderInsights(filtered);
    this.renderCharts(filtered);
    this.renderHistory(filtered);
  }

  _getFilteredData() {
    const now = new Date();
    let startDate = new Date();
    const range = this.state.filterRange;

    if (range === '7d') startDate.setDate(now.getDate() - 7);
    else if (range === '30d') startDate.setDate(now.getDate() - 30);
    else if (range === 'all') startDate = new Date(0);

    return this.data.filter(e => new Date(e.timestamp) >= startDate);
  }

  renderInsights(filtered) {
    if (filtered.length === 0) return;

    // 1. Average & Trend
    const avg = filtered.reduce((s, e) => s + e.level, 0) / filtered.length;
    document.getElementById('stress-avg-val').textContent = avg.toFixed(1) + '/10';
    document.getElementById('stress-avg-emoji').textContent = this.getStressEmoji(Math.round(avg));

    // Trend Logic
    const sorted = [...filtered].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
    if (sorted.length >= 4) {
      const mid = Math.floor(sorted.length / 2);
      const h1 = sorted.slice(0, mid).reduce((s,e)=>s+e.level,0)/mid;
      const h2 = sorted.slice(mid).reduce((s,e)=>s+e.level,0)/(sorted.length - mid);
      const diff = h2 - h1;
      const icon = document.getElementById('stress-trend-icon');
      const text = document.getElementById('stress-trend-text');
      if (diff > 0.5) { icon.textContent = '↗'; text.textContent = 'INCREASING'; text.style.color = 'var(--coral)'; }
      else if (diff < -0.5) { icon.textContent = '↘'; text.textContent = 'DECREASING'; text.style.color = 'var(--sage)'; }
      else { icon.textContent = '→'; text.textContent = 'STABLE TREND'; text.style.color = 'inherit'; }
    }

    // 2. Top Sources List
    const sourcesMap = {};
    filtered.forEach(e => (e.sources || []).forEach(s => sourcesMap[s] = (sourcesMap[s] || 0) + 1));
    const top = Object.entries(sourcesMap).sort((a,b) => b[1] - a[1]).slice(0, 3);
    const topList = document.getElementById('stress-top-sources-list');
    if (top.length > 0) {
      topList.innerHTML = top.map(([id, count]) => {
        const label = this.sourceOptions.find(o => o.id === id)?.label || id;
        const pct = Math.round((count / filtered.length) * 100);
        return `<div style="display: flex; justify-content: space-between;">
          <span style="opacity: 0.6;">${label}:</span>
          <span style="font-weight: 700;">${pct}%</span>
        </div>`;
      }).join('');
    }

    // 3. Patterns
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayAvgs = weekdays.map((name, idx) => {
      const e = filtered.filter(x => new Date(x.timestamp).getDay() === idx);
      return { name, level: e.length ? e.reduce((s,x)=>s+x.level,0)/e.length : 0 };
    });
    const highest = dayAvgs.reduce((a, b) => b.level > a.level ? b : a, {name:'--', level:0});
    const lowest = dayAvgs.filter(d => d.level > 0).reduce((a, b) => b.level < a.level ? b : a, {name:'--', level:11});
    document.getElementById('stress-highest-day').textContent = highest.name;
    document.getElementById('stress-lowest-day').textContent = lowest.name;
  }

  renderCharts(filtered) {
    if (filtered.length === 0) return;
    const sorted = [...filtered].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));

    // 1. Timeline (Area)
    this._createChart('timeline', 'line', {
      labels: sorted.map(e => new Date(e.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'})),
      datasets: [{
        label: 'Stress Level',
        data: sorted.map(e => e.level),
        backgroundColor: 'rgba(230, 57, 70, 0.2)',
        borderColor: '#E63946',
        fill: true, tension: 0.4, borderWidth: 3
      }]
    }, { scales: { y: { min: 0, max: 10 } } });

    // 2. Weekday (Bar)
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayAvgs = weekdays.map((_, idx) => {
      const e = filtered.filter(x => new Date(x.timestamp).getDay() === idx);
      return e.length ? e.reduce((s,x)=>s+x.level,0)/e.length : 0;
    });
    this._createChart('weekday', 'bar', {
      labels: weekdays,
      datasets: [{
        data: dayAvgs,
        backgroundColor: dayAvgs.map(v => v > 7 ? '#E63946' : v > 4 ? '#F4A261' : '#2A9D8F'),
        borderWidth: 2, borderColor: '#000'
      }]
    }, { scales: { y: { min: 0, max: 10 } }, plugins: { legend: { display: false } } });

    // 3. Sources (Horizontal Bar)
    const srcMap = {};
    filtered.forEach(e => (e.sources || []).forEach(s => srcMap[s] = (srcMap[s] || 0) + 1));
    const srcData = Object.entries(srcMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
    this._createChart('sources', 'bar', {
      labels: srcData.map(x => this.sourceOptions.find(o => o.id === x[0])?.label || x[0]),
      datasets: [{
        data: srcData.map(x => x[1]),
        backgroundColor: '#264653', borderWidth: 2, borderColor: '#000'
      }]
    }, { indexAxis: 'y', plugins: { legend: { display: false } } });

    // 4. Symptoms (Horizontal Bar)
    const symMap = {};
    filtered.forEach(e => (e.symptoms || []).forEach(s => symMap[s] = (symMap[s] || 0) + 1));
    const symData = Object.entries(symMap).sort((a,b) => b[1] - a[1]).slice(0, 5);
    this._createChart('symptoms', 'bar', {
      labels: symData.map(x => this.symptomOptions.find(o => o.id === x[0])?.label || x[0]),
      datasets: [{
        data: symData.map(x => x[1]),
        backgroundColor: '#E76F51', borderWidth: 2, borderColor: '#000'
      }]
    }, { indexAxis: 'y', plugins: { legend: { display: false } } });

    // 5. Time Slot (Bar)
    const slots = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const counts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    filtered.forEach(e => {
      const slot = this.getTimeSlot(new Date(e.timestamp));
      slots[slot] += e.level;
      counts[slot]++;
    });
    this._createChart('timeslot', 'bar', {
      labels: ['Morning', 'Afternoon', 'Evening', 'Night'],
      datasets: [{
        data: ['morning', 'afternoon', 'evening', 'night'].map(s => counts[s] ? slots[s]/counts[s] : 0),
        backgroundColor: ['#2A9D8F', '#E9C46A', '#F4A261', '#264653'],
        borderWidth: 2, borderColor: '#000'
      }]
    }, { plugins: { legend: { display: false } } });
  }

  _createChart(id, type, data, options) {
    const canvas = document.getElementById(`chart-stress-${id}`);
    if (!canvas) return;
    if (this.charts[id]) { this.charts[id].data = data; this.charts[id].update(); }
    else { this.charts[id] = new Chart(canvas, { type, data, options: { responsive: true, maintainAspectRatio: false, ...options } }); }
  }

  renderHistory(filtered) {
    const list = document.getElementById('stress-entries-list');
    if (!list) return;
    const sorted = [...filtered].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20);
    
    list.innerHTML = sorted.map(e => `
      <div class="brutal-card" style="padding: 15px; background: var(--white); box-shadow: 4px 4px 0 var(--text-dark);">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
              <span style="font-size: 20px;">${this.getStressEmoji(e.level)}</span>
              <span class="mono" style="font-weight: 800;">Stress Level: ${e.level}/10</span>
            </div>
            <div class="mono" style="font-size: 10px; opacity: 0.6;">${new Date(e.timestamp).toLocaleString()}</div>
          </div>
          <div class="mono" style="font-size: 9px; padding: 2px 6px; border: 1px solid #000; background: ${e.level > 7 ? 'var(--coral-light)' : 'var(--sage-light)'};">
            ${this.getStressLevelText(e.level).toUpperCase()}
          </div>
        </div>
        ${e.notes ? `<p class="mono" style="font-size: 11px; margin: 10px 0; opacity: 0.8;">${e.notes}</p>` : ''}
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
          ${(e.sources || []).map(f => `<span class="mono" style="font-size: 8px; padding: 1px 4px; border: 1px solid #000; background: #eee;">SOURCE: ${f.toUpperCase()}</span>`).join('')}
          ${(e.symptoms || []).map(f => `<span class="mono" style="font-size: 8px; padding: 1px 4px; border: 1px solid #000; background: #fff1f1;">SYM: ${f.toUpperCase()}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  getStressEmoji(l) {
    if (l <= 2) return '😌';
    if (l <= 4) return '🙂';
    if (l <= 6) return '😐';
    if (l <= 8) return '😟';
    return '😫';
  }
  getStressLevelText(l) {
    if (l <= 2) return 'Very Calm';
    if (l <= 4) return 'Calm';
    if (l <= 6) return 'Moderate';
    if (l <= 8) return 'High Stress';
    return 'Extreme Stress';
  }
  getTimeSlot(date) {
    const h = date.getHours();
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
  }

  async seedSampleData() {
    const samples = [
      { level: 8, sources: ['work', 'finances'], symptoms: ['tension', 'headache'], notes: 'Quarterly reviews.', offset: 0 },
      { level: 4, sources: ['health'], symptoms: ['fatigue'], notes: 'Manageable.', offset: 1 },
      { level: 6, sources: ['family', 'relationships'], symptoms: ['mood'], notes: 'Long day.', offset: 2 },
      { level: 9, sources: ['work', 'future'], symptoms: ['heart', 'sleep'], notes: 'Major deadline.', offset: 3 },
      { level: 3, sources: ['environment'], symptoms: [], notes: 'Relaxing weekend.', offset: 4 }
    ];
    for (const s of samples) {
      const d = new Date(); d.setDate(d.getDate() - s.offset);
      await Store.saveEntry('stress_entries', { ...s, timestamp: d.toISOString() });
    }
  }
}

const Stress = new StressTracker();
export default Stress;
