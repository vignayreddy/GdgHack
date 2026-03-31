import Store from './store.js';

/**
 * SleepTracker handles the logic for the detailed Sleep dashboard,
 * including sleep debt calculations, bedtime recommendations, and Area charts.
 */
class SleepTracker {
  constructor() {
    this.data = [];
    this.charts = {
      timeline: null,
      weekday: null,
      dist: null
    };
    this.state = {
      selectedFactors: [],
      filterRange: '30d'
    };
    this.initialized = false;
    this.unsubscribe = null;

    this.factorOptions = [
      { id: 'stress', label: 'Stress' },
      { id: 'exercise', label: 'Exercise' },
      { id: 'caffeine', label: 'Caffeine' },
      { id: 'alcohol', label: 'Alcohol' },
      { id: 'screenTime', label: 'Screen Time' },
      { id: 'lateFood', label: 'Late Meal' },
      { id: 'noise', label: 'Noise' },
      { id: 'temperature', label: 'Temperature' }
    ];
  }

  async init() {
    if (!this.initialized) {
      this._renderFactors();
      this._attachEvents();
      this.initialized = true;
    }

    // Subscribe to Sleep Data
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = Store.subscribeToOverviewData((allData) => {
      this.data = allData.sleepData;
      this.refreshUI();
    });
  }

  _attachEvents() {
    // Save Entry
    document.getElementById('sleep-btn-save')?.addEventListener('click', async () => {
      const btn = document.getElementById('sleep-btn-save');
      const hours = document.getElementById('sleep-form-hours').value;
      const quality = document.getElementById('sleep-form-quality').value;
      const bedtime = document.getElementById('sleep-form-bed').value;
      const wakeTime = document.getElementById('sleep-form-wake').value;
      const notes = document.getElementById('sleep-form-notes').value;

      btn.disabled = true;
      btn.textContent = 'SAVING...';

      const success = await Store.saveEntry('sleep_entries', {
        hours: parseFloat(hours),
        quality: parseInt(quality),
        bedtime,
        wakeTime,
        factors: this.state.selectedFactors,
        notes
      });

      btn.disabled = false;
      btn.textContent = success ? 'SAVED!' : 'FAILED';

      if (success) {
        this.state.selectedFactors = [];
        document.getElementById('sleep-form-notes').value = '';
        this._renderFactors();
      }
      setTimeout(() => btn.textContent = 'SAVE SLEEP ENTRY →', 2000);
    });

    // Auto-calculate hours from range input
    document.getElementById('sleep-form-hours').addEventListener('input', (e) => {
      document.getElementById('sleep-form-hours-val').textContent = parseFloat(e.target.value).toFixed(1);
    });

    // Time inputs auto-calculate duration
    ['sleep-form-bed', 'sleep-form-wake'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => this._syncTimeDuration());
    });

    // Quality slider text/emoji
    document.getElementById('sleep-form-quality').addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      const emoji = this.getQualityEmoji(val);
      const text = this.getQualityText(val).toUpperCase() + ' QUALITY';
      document.getElementById('sleep-form-quality-emoji').textContent = emoji;
      document.getElementById('sleep-form-quality-text').textContent = text;
    });

    // Filter range
    document.getElementById('sleep-filters-range')?.addEventListener('change', (e) => {
      this.state.filterRange = e.target.value;
      this.refreshUI();
    });

    // Seed Data
    document.getElementById('sleep-btn-seed')?.addEventListener('click', () => this.seedSampleData());
  }

  _syncTimeDuration() {
    const bed = document.getElementById('sleep-form-bed').value;
    const wake = document.getElementById('sleep-form-wake').value;
    if (!bed || !wake) return;

    const [bH, bM] = bed.split(':').map(Number);
    const [wH, wM] = wake.split(':').map(Number);

    let diffMinutes = (wH * 60 + wM) - (bH * 60 + bM);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Next day

    const hours = (diffMinutes / 60).toFixed(1);
    document.getElementById('sleep-form-hours').value = hours;
    document.getElementById('sleep-form-hours-val').textContent = hours;
  }

  _renderFactors() {
    const container = document.getElementById('sleep-factors-container');
    if (!container) return;

    container.innerHTML = this.factorOptions.map(opt => `
      <button class="tag-btn mono ${this.state.selectedFactors.includes(opt.id) ? 'selected' : ''}" 
              data-id="${opt.id}">${opt.label}</button>
    `).join('');

    container.querySelectorAll('.tag-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        if (this.state.selectedFactors.includes(id)) {
          this.state.selectedFactors = this.state.selectedFactors.filter(x => x !== id);
        } else {
          this.state.selectedFactors.push(id);
        }
        this._renderFactors();
      };
    });
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
    const avg = filtered.reduce((s, e) => s + e.hours, 0) / filtered.length;
    document.getElementById('sleep-avg-val').textContent = avg.toFixed(1) + ' hrs';

    const qualAvg = filtered.reduce((s, e) => s + (e.quality || 3), 0) / filtered.length;
    document.getElementById('sleep-avg-quality').textContent = this.getQualityText(Math.round(qualAvg)) + ' ' + this.getQualityEmoji(Math.round(qualAvg));

    // 2. Patterns
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayAvgs = weekdays.map((name, idx) => {
      const entries = filtered.filter(e => new Date(e.timestamp).getDay() === idx);
      return { name, avg: entries.length ? entries.reduce((s,e) => s+e.hours,0)/entries.length : 0 };
    });
    const bestDay = dayAvgs.reduce((a, b) => b.avg > a.avg ? b : a, {name: '--', avg: 0});
    const worstDay = dayAvgs.filter(d => d.avg > 0).reduce((a, b) => b.avg < a.avg ? b : a, {name: '--', avg: 24});
    document.getElementById('sleep-best-day').textContent = bestDay.name;
    document.getElementById('sleep-worst-day').textContent = worstDay.name;

    // 3. Sleep Health (Debt & Rec bedtime)
    const optimal = 8;
    const last7Days = this.data.filter(e => new Date(e.timestamp) >= new Date(Date.now() - 7*24*60*60*1000));
    const debt = Math.max(0, (optimal * last7Days.length) - last7Days.reduce((s,e) => s+e.hours,0));
    document.getElementById('sleep-debt-val').textContent = debt.toFixed(1) + ' hrs';

    // Rec Bedtime (Avg Wake Time - 8 hours)
    const wakeEntries = last7Days.filter(e => e.wakeTime);
    if (wakeEntries.length) {
      let totalMin = wakeEntries.reduce((s, e) => {
        const [h, m] = e.wakeTime.split(':').map(Number);
        return s + (h * 60 + m);
      }, 0) / wakeEntries.length;
      
      let bedMin = (totalMin - optimal * 60 + 1440) % 1440;
      const recH = Math.floor(bedMin / 60).toString().padStart(2, '0');
      const recM = Math.floor(bedMin % 60).toString().padStart(2, '0');
      document.getElementById('sleep-rec-bedtime').textContent = `${recH}:${recM}`;
    }

    const tip = document.getElementById('sleep-health-tip');
    if (debt > 5) tip.textContent = 'WARNING: SIGNIFICANT SLEEP DEBT!';
    else if (debt > 2) tip.textContent = 'TIP: TRY TO GET MORE SLEEP THIS WEEK.';
    else tip.textContent = 'YOUR SLEEP SCHEDULE LOOKS HEALTHY.';
  }

  renderCharts(filtered) {
    if (filtered.length === 0) return;
    const sorted = [...filtered].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Timeline (Area)
    this._createChart('timeline', 'line', {
      labels: sorted.map(e => new Date(e.timestamp).toLocaleDateString(undefined, {month:'short', day:'numeric'})),
      datasets: [{
        label: 'Sleep Duration',
        data: sorted.map(e => e.hours),
        backgroundColor: 'rgba(38, 70, 83, 0.2)',
        borderColor: '#264653',
        fill: true,
        tension: 0.4,
        borderWidth: 3
      }]
    }, { scales: { y: { min: 0, max: 12 } } });

    // Weekday Bar
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayAvgs = weekdays.map((_, idx) => {
      const e = filtered.filter(x => new Date(x.timestamp).getDay() === idx);
      return e.length ? e.reduce((s,x)=>s+x.hours,0)/e.length : 0;
    });
    this._createChart('weekday', 'bar', {
      labels: weekdays,
      datasets: [{
        label: 'Avg Hours',
        data: dayAvgs,
        backgroundColor: dayAvgs.map(h => h < 6 ? '#E63946' : h < 7 ? '#F4A261' : '#2A9D8F'),
        borderWidth: 2, borderColor: '#000'
      }]
    }, { scales: { y: { min: 0, max: 12 } }, plugins: { legend: { display: false } } });

    // Distribution
    const dist = [0,0,0,0]; // <6, 6-7, 7-9, 9+
    filtered.forEach(e => {
      if (e.hours < 6) dist[0]++;
      else if (e.hours < 7) dist[1]++;
      else if (e.hours <= 9) dist[2]++;
      else dist[3]++;
    });
    this._createChart('dist', 'bar', {
      labels: ['<6h', '6-7h', '7-9h', '9h+'],
      datasets: [{
        data: dist,
        backgroundColor: ['#E63946', '#F4A261', '#2A9D8F', '#264653'],
        borderWidth: 2, borderColor: '#000'
      }]
    }, { plugins: { legend: { display: false } } });
  }

  _createChart(id, type, data, options) {
    const canvas = document.getElementById(`chart-sleep-${id}`);
    if (!canvas) return;
    if (this.charts[id]) { this.charts[id].data = data; this.charts[id].update(); }
    else { this.charts[id] = new Chart(canvas, { type, data, options: { responsive: true, maintainAspectRatio: false, ...options } }); }
  }

  renderHistory(filtered) {
    const list = document.getElementById('sleep-entries-list');
    if (!list) return;
    const sorted = [...filtered].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20);
    
    list.innerHTML = sorted.map(e => `
      <div class="brutal-card" style="padding: 15px; background: var(--white); box-shadow: 4px 4px 0 var(--text-dark);">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
              <span style="font-size: 20px;">💤</span>
              <span class="mono" style="font-weight: 800;">${e.hours}h (${this.getQualityEmoji(e.quality)})</span>
            </div>
            <div class="mono" style="font-size: 10px; opacity: 0.6;">${new Date(e.timestamp).toLocaleString()}</div>
            <div class="mono" style="font-size: 11px; margin-top: 5px; font-weight: 700;">${e.bedtime} - ${e.wakeTime}</div>
          </div>
          <div class="mono" style="font-size: 9px; padding: 2px 6px; border: 1px solid #000; background: ${e.hours >= 7 ? 'var(--sage-light)' : 'var(--coral-light)'};">
            ${this.getDurationText(e.hours).toUpperCase()}
          </div>
        </div>
        ${e.notes ? `<p class="mono" style="font-size: 11px; margin: 10px 0; opacity: 0.8;">${e.notes}</p>` : ''}
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
          ${(e.factors || []).map(f => `<span class="mono" style="font-size: 8px; padding: 1px 4px; border: 1px solid #000; background: #eee;">${f.toUpperCase()}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  getQualityEmoji(q) {
    const emojis = ['', '😫', '😕', '😐', '🙂', '😴'];
    return emojis[q] || '😐';
  }
  getQualityText(q) {
    const texts = ['', 'Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'];
    return texts[q] || 'Fair';
  }
  getDurationText(h) {
    if (h < 5) return 'Too Little';
    if (h < 7) return 'Poor';
    if (h <= 9) return 'Optimal';
    return 'Overslept';
  }

  async seedSampleData() {
    const samples = [
      { hours: 8, quality: 4, bedtime: '22:30', wakeTime: '06:30', factors: ['exercise'], notes: 'Great night sleep.', offset: 0 },
      { hours: 5.5, quality: 2, bedtime: '00:30', wakeTime: '06:00', factors: ['stress', 'screenTime'], notes: 'Stayed up late working.', offset: 1 },
      { hours: 7.5, quality: 3, bedtime: '23:00', wakeTime: '06:30', factors: ['temperature'], notes: 'A bit warm in the room.', offset: 2 },
      { hours: 9, quality: 5, bedtime: '22:00', wakeTime: '07:00', factors: ['no_caffeine', 'exercise'], notes: 'Total blackout, felt amazing.', offset: 3 },
      { hours: 6, quality: 3, bedtime: '23:30', wakeTime: '05:30', factors: ['noise'], notes: 'Early flight today.', offset: 4 }
    ];
    for (const s of samples) {
      const d = new Date(); d.setDate(d.getDate() - s.offset);
      await Store.saveEntry('sleep_entries', { ...s, timestamp: d.toISOString() });
    }
  }
}

const Sleep = new SleepTracker();
export default Sleep;
