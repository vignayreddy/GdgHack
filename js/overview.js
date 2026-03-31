import Store from './store.js';

/**
 * MindBridgeOverview handles the 2x2 grid dashboard, real-time sync,
 * and Groq-powered AI insight generation.
 */
class MindBridgeOverview {
  constructor() {
    this.data = { moodData: [], sleepData: [], stressData: [], journalEntries: [] };
    this.unsubscribe = null;
    this.lastAiSync = 0; // Throttle AI calls
    this.aiApiKey = "YOUR_GROQ_API_KEY";
    this.initialized = false;
  }

  async init() {
    if (!this.initialized) {
      this._attachEvents();
      this.initialized = true;
    }
    
    // Start Real-time Subscription (This ensures instant UI updates when Firestore changes)
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = Store.subscribeToOverviewData((freshData) => {
      console.log("Overview: Received real-time update", freshData);
      this.data = freshData;
      this.render(); // Instant visual update
      this._throttledAiSync(); // Async AI generation
    });
  }

  _attachEvents() {
    const logBtnMap = {
      'q-mood-log': { store: 'saveMood', slider: 'q-mood-slider' },
      'q-sleep-log': { store: 'saveSleep', slider: 'q-sleep-slider' },
      'q-stress-log': { store: 'saveStress', slider: 'q-stress-slider' }
    };

    Object.keys(logBtnMap).forEach(btnId => {
      document.getElementById(btnId)?.addEventListener('click', async () => {
        const config = logBtnMap[btnId];
        const val = document.getElementById(config.slider).value;
        const btn = document.getElementById(btnId);
        
        btn.disabled = true;
        btn.textContent = 'LOGGING...';
        
        try {
          const success = await Store[config.store](val);
          
          btn.disabled = false;
          if (success) {
            btn.textContent = 'SAVED!';
            console.log(`Successfully logged ${config.store}`);
          } else {
            btn.textContent = 'FAILED';
            alert("Failed to save entry. Please ensure you are logged in.");
          }
        } catch (err) {
          console.error("Logging error:", err);
          btn.disabled = false;
          btn.textContent = 'ERROR';
        }

        setTimeout(() => { 
          btn.textContent = btnId.includes('mood') ? 'LOG MOOD' : (btnId.includes('sleep') ? 'LOG SLEEP' : 'LOG STRESS'); 
        }, 2000);
      });
    });
  }

  // ── AI INSIGHT GENERATION (GROQ) ──

  async _throttledAiSync() {
    const now = Date.now();
    // Only call AI if data has changed and at least 30s has passed (to avoid rate limits/cost)
    if (now - this.lastAiSync < 30000) return;
    this.lastAiSync = now;
    
    await this.generateAiInsights();
  }

  async generateAiInsights() {
    const insightsList = document.getElementById('overview-insights-list');
    if (!insightsList) return;

    // Trigger AI if we have at least 1 entry across any metric
    const hasData = this.data.moodData.length > 0 || this.data.sleepData.length > 0 || this.data.stressData.length > 0;
    if (!hasData) {
      this._renderStaticInsights("Log a metric above to unlock AI patterns.");
      return;
    }

    insightsList.innerHTML = `<div class="mono" style="font-size:11px; opacity:0.5; padding:10px;">🧠 GENERATING INSIGHTS...</div>`;

    try {
      const summary = `
        User Logs:
        Moods: ${this.data.moodData.map(m => m.score).join(',')}
        Sleep: ${this.data.sleepData.map(s => s.hours).join(',')}
        Stress: ${this.data.stressData.map(s => s.level).join(',')}
      `;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.aiApiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "You are a wellbeing analyst. Based on user logs, generate exactly 3 short insights. Format: Icon|Title|Description. One per line. Example: 📈|Stress Rising|Your stress is up 20%... "
            },
            { role: "user", content: `Analyze this data and give 3 insights: ${summary}` }
          ],
          temperature: 0.6
        })
      });

      const json = await res.json();
      const text = json.choices?.[0]?.message?.content;
      if (!text) return;

      const items = text.split('\n').filter(l => l.includes('|')).slice(0, 3);
      const html = items.map(line => {
        const [icon, title, desc] = line.split('|');
        return `
          <div class="insight-card">
            <div class="insight-icon">${icon || '✨'}</div>
            <div>
              <div class="mono" style="font-weight:700; font-size:12px;">${(title || 'Insight').toUpperCase()}</div>
              <div class="mono" style="font-size:11px; opacity:0.7; margin-top:3px;">${desc || 'Continue your wellbeing journey.'}</div>
            </div>
          </div>
        `;
      }).join('');

      insightsList.innerHTML = html;

    } catch (e) {
      console.error("AI Insight Error:", e);
      this._renderStaticInsights("AI Insights temporarily unavailable.");
    }
  }

  _renderStaticInsights(msg) {
    const list = document.getElementById('overview-insights-list');
    if(list) list.innerHTML = `<div class="mono" style="font-size:11px; opacity:0.5; padding:10px;">${msg}</div>`;
  }

  // ── CALCULATION UTILS ──
  calculateAverage(entries, key) {
    if (!entries || entries.length === 0) return 0;
    const sum = entries.reduce((acc, e) => acc + (e[key] || 0), 0);
    return (sum / entries.length).toFixed(1);
  }

  calculateTrend(entries, key) {
    if (!entries || entries.length < 2) return 'STABLE';
    const first = entries[entries.length - 1][key];
    const last = entries[0][key];
    const diff = last - first;
    if (diff > 0.5) return 'IMPROVING ↗️';
    if (diff < -0.5) return 'DECLINING ↘️';
    return 'STABLE →';
  }

  calculateStreak(entries) {
    const dates = entries.map(e => {
      const d = new Date(e.timestamp);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    });
    const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
    let streak = 0;
    const today = new Date(); today.setHours(0,0,0,0);
    let checkDate = today.getTime();
    if (!uniqueDates.includes(checkDate)) {
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
      checkDate = yesterday.getTime();
    }
    let i = uniqueDates.indexOf(checkDate);
    if (i === -1) return 0;
    while (i < uniqueDates.length) {
      streak++;
      if (uniqueDates[i] - uniqueDates[i+1] === 86400000) i++; else break;
    }
    return streak;
  }

  getMoodEmoji(score) {
    if (score >= 8) return '😄'; if (score >= 6) return '🙂';
    if (score >= 4) return '😐'; if (score >= 2) return '☹️';
    return '😢';
  }

  // ── RENDERING ──
  render() {
    const user = Store.getCurrentUser();
    const name = user?.email ? user.email.split('@')[0] : 'User';

    // Update Greeting & Date
    const greetingEl = document.getElementById('overview-greeting');
    if (greetingEl) greetingEl.textContent = `Welcome back, ${name}!`;
    document.getElementById('overview-date').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Box 2: Metrics Summary (Real-time updates happen here)
    const avgMood = this.calculateAverage(this.data.moodData, 'score');
    document.getElementById('summ-mood-val').textContent = avgMood > 0 ? avgMood + '/10' : '--';
    document.getElementById('summ-mood-emoji').textContent = this.getMoodEmoji(parseFloat(avgMood));
    document.getElementById('summ-mood-trend').textContent = this.calculateTrend(this.data.moodData, 'score');

    const avgSleep = this.calculateAverage(this.data.sleepData, 'hours');
    document.getElementById('summ-sleep-val').textContent = avgSleep > 0 ? avgSleep + ' hrs' : '--';
    document.getElementById('summ-sleep-trend').textContent = this.calculateTrend(this.data.sleepData, 'hours');

    const avgStress = this.calculateAverage(this.data.stressData, 'level');
    document.getElementById('summ-stress-val').textContent = avgStress > 0 ? avgStress + '/10' : '--';
    document.getElementById('summ-stress-trend').textContent = this.calculateTrend(this.data.stressData, 'level');

    const streakVal = this.calculateStreak([...this.data.moodData, ...this.data.sleepData, ...this.data.stressData]);
    document.getElementById('summ-streak-val').textContent = streakVal;
    document.getElementById('summ-streak-fire').textContent = streakVal > 0 ? '🔥' : '';

    // Box 4: Recent Activity
    const activityList = document.getElementById('dash-activity-list');
    if (activityList) {
      const allEntries = [
        ...this.data.moodData.map(d => ({ ...d, type: 'Mood', icon: this.getMoodEmoji(d.score), val: d.score + '/10' })),
        ...this.data.sleepData.map(d => ({ ...d, type: 'Sleep', icon: '💤', val: d.hours + 'h' })),
        ...this.data.stressData.map(d => ({ ...d, type: 'Stress', icon: '🧠', val: 'Lvl ' + d.level }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10); // More logs for scrolling

      if (allEntries.length > 0) {
        activityList.innerHTML = allEntries.map(e => `
          <div class="mini-card" style="flex-direction:row; justify-content:space-between; align-items:center; min-height:auto; box-shadow: 2px 2px 0 var(--text-dark); background:var(--white);">
            <div style="display:flex; align-items:center; gap:12px;">
              <span>${e.icon}</span>
              <div>
                <div class="mono" style="font-size:11px; font-weight:700;">${e.type.toUpperCase()} LOG: ${e.val}</div>
                <div class="mono" style="font-size:9px; opacity:0.5;">${new Date(e.timestamp).toLocaleString()}</div>
              </div>
            </div>
            <span class="mono" style="font-size:9px; font-weight:900; color:var(--coral);">FEED</span>
          </div>
        `).join('');
      } else {
        activityList.innerHTML = '<p class="mono" style="font-size:12px; opacity:0.5;">No activity logs found.</p>';
      }
    }
  }
}

const Overview = new MindBridgeOverview();
export default Overview;
