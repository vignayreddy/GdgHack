
import { db, auth } from './firebase.js';
import { 
    collection, 
    query, 
    onSnapshot, 
    orderBy, 
    limit 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/**
 * NGO Extended Hub: Volunteer Management & Impact Reporting
 * High-fidelity modules for organizational oversight.
 */

export const NGOHubExtended = {
    init() {
        this.initVolunteers();
        this.initAnalytics();
        this.initImpact();
        this.initAIInsights();
        console.log("NyxWell: NGO Extended Hub Initialized.");
    },

    // ── TACTICAL AI DECK ──
    initAIInsights() {
        const deck = document.getElementById('ngo-tactical-deck');
        if (!deck) return;

        const insights = [
            {
                title: "BURNOUT FORECAST",
                value: "Low (12%)",
                desc: "Detected stability for the next 72hrs based on current mentor load distribution.",
                action: "OPTIMIZE LOAD",
                color: "var(--sage)"
            },
            {
                title: "DEMO-TRENDS",
                value: "+18% Youth",
                desc: "Detected surge in exam-period stress markers between 10 PM - 2 AM.",
                action: "DEPLOY GUIDELINES",
                color: "#F59E0B"
            }
        ];

        deck.innerHTML = insights.map(i => `
            <div class="brutal-card" style="padding: 20px; border-color: ${i.color}; background: white;">
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 15px;">
                    <div style="width: 6px; height: 6px; background: ${i.color}; border-radius: 50%;"></div>
                    <span class="mono" style="font-size: 9px; font-weight: 800;">${i.title}</span>
                </div>
                <div class="stat-num" style="font-size: 22px; margin-bottom: 5px;">${i.value}</div>
                <p class="mono" style="font-size: 10px; opacity: 0.6; margin-bottom: 15px; line-height: 1.4;">${i.desc}</p>
                <button class="nav-link mono" style="font-size: 9px; border: 1px solid ${i.color}; color: ${i.color}; background: none; font-weight: 700; padding: 5px;">${i.action} →</button>
            </div>
        `).join('');
    },

    // ── CASE INVESTIGATION ──
    renderCaseHistory(id) {
        // Populating Modal Metadata
        const idDisplay = document.getElementById('investigation-case-id');
        const detailDisplay = document.getElementById('investigation-case-detail');
        if (idDisplay) idDisplay.innerText = `Case #${id.slice(-4).toUpperCase()}`;
        if (detailDisplay) detailDisplay.innerText = "System analyzing student background from encrypted mood history... Loading situational context.";

        // Render Sparkline
        const ctx = document.getElementById('caseMoodSparkline');
        if (ctx) {
            if (this.sparklineChart) this.sparklineChart.destroy();
            
            const labels = ['72H', '48H', '24H', '12H', 'NOW'];
            const data = [3.5, 3.2, 2.8, 1.5, 1.2]; // Example downward trend
            
            this.sparklineChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        borderColor: '#2C2112',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: '#2C2112',
                        fill: true,
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { 
                        x: { display: true, ticks: { font: { size: 8 } } },
                        y: { min: 1, max: 5, grid: { display: false }, ticks: { display: false } }
                    }
                }
            });
        }
    },

    // ── DEEP ANALYTICS ──
    initAnalytics() {
        const grid = document.getElementById('ngo-analytics-grid');
        if (!grid) return;

        this.renderActivityHeatmap();

        grid.innerHTML = `
            <div class="brutal-card" style="padding: 25px;">
                <h3 class="mono" style="font-size: 14px; font-weight: 700; border-bottom: 1.5px solid var(--text-dark); padding-bottom: 10px; margin-bottom: 20px;">COHORT RISK DISTRIBUTION</h3>
                <div class="v-stack" style="gap: 15px;">
                    ${[
                        { label: 'ACADEMIC PRESSURE', val: 65, color: 'var(--red)' },
                        { label: 'SOCIAL ISOLATION', val: 42, color: '#E0A458' },
                        { label: 'ANXIETY MARKERS', val: 82, color: 'var(--red)' },
                        { label: 'SLEEP DEFICIENCY', val: 30, color: 'var(--sage)' }
                    ].map(r => `
                        <div>
                            <div class="mono" style="font-size: 10px; display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>${r.label}</span>
                                <span style="color: ${r.color};">${r.val}%</span>
                            </div>
                            <div style="height: 10px; background: #EEE; position: relative;">
                                <div style="height: 100%; background: ${r.color}; width: ${r.val}%;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="brutal-card" style="padding: 25px;">
                <h3 class="mono" style="font-size: 14px; font-weight: 700; border-bottom: 1.5px solid var(--text-dark); padding-bottom: 10px; margin-bottom: 20px;">DEMOGRAPHIC HEATMAP (REGIONAL)</h3>
                <div class="v-stack" style="gap: 12px;">
                    ${[
                        { region: 'NORTH INDIA (NCR)', status: 'HIGH LOAD', intensity: 88, color: 'var(--red)' },
                        { region: 'SOUTH (BANGALORE)', status: 'MODERATE', intensity: 45, color: '#E0A458' },
                        { region: 'WEST (MUMBAI)', status: 'STABLE', intensity: 22, color: 'var(--sage)' },
                        { region: 'EAST (KOLKATA)', status: 'STABLE', intensity: 18, color: 'var(--sage)' }
                    ].map(r => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid rgba(0,0,0,0.05); background: rgba(0,0,0,0.02);">
                            <div class="mono" style="font-size: 11px; font-weight: 700;">${r.region}</div>
                            <div class="mono" style="font-size: 9px; padding: 2px 6px; background: ${r.color}; color: white;">${r.status}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    renderActivityHeatmap() {
        const container = document.getElementById('ngo-activity-heatmap');
        if (!container) return;

        // Generate 52 weeks x 7 days
        const colors = ['#f5f5f5', '#e1eade', '#c3d5bf', '#a5c0a0', '#7fa882', '#5f7e62'];
        let html = '<div style="display: grid; grid-template-rows: repeat(7, 10px); grid-template-columns: repeat(52, 10px); grid-auto-flow: column; gap: 3px;">';
        
        for (let i = 0; i < 364; i++) {
            const level = Math.floor(Math.random() * colors.length);
            html += `<div style="width: 10px; height: 10px; background: ${colors[level]}; border-radius: 1px;"></div>`;
        }
        
        html += '</div>';
        container.innerHTML = html;
    },

    // ── VOLUNTEER COORDINATOR ──
    initVolunteers() {
        const grid = document.getElementById('ngo-volunteer-grid');
        if (!grid) return;

        // Listen to 'mentors' collection
        const q = query(collection(db, 'mentors'), orderBy('rating', 'desc'), limit(12));
        
        onSnapshot(q, (snapshot) => {
            const mentors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.renderVolunteers(mentors);
        });
    },

    renderVolunteers(mentors) {
        const grid = document.getElementById('ngo-volunteer-grid');
        if (!grid) return;

        grid.innerHTML = mentors.map((m, idx) => {
            // Generate Mock Load & Burnout for the hackathon demo
            const loadCount = Math.floor(Math.random() * 6); // 0-5 active sessions
            const burnoutIndex = Math.floor(Math.random() * 40) + (loadCount * 12); // Higher load = higher burnout
            const statusColor = burnoutIndex > 70 ? 'var(--red)' : (burnoutIndex > 40 ? '#E0A458' : 'var(--sage)');
            
            return `
                <div class="brutal-card" style="padding: 20px; border-color: ${loadCount >= 5 ? 'var(--red)' : 'var(--text-dark)'};">
                    <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                        <div style="width: 50px; height: 50px; background: var(--sage); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700;">
                            ${m.name.charAt(0)}
                        </div>
                        <div>
                            <div class="mono" style="font-weight: 700; font-size: 14px;">${m.name.toUpperCase()}</div>
                            <div class="mono" style="font-size: 10px; opacity: 0.6;">${m.expertise || 'Generalist'}</div>
                        </div>
                    </div>

                    <div class="v-stack" style="gap: 10px;">
                        <div>
                            <div class="mono" style="font-size: 10px; display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span>ACTIVE LOAD</span>
                                <span>${loadCount} / 5 SESSIONS</span>
                            </div>
                            <div style="height: 4px; background: #EEE; position: relative;">
                                <div style="height: 100%; background: var(--text-dark); width: ${(loadCount / 5) * 100}%;"></div>
                            </div>
                        </div>

                        <div>
                            <div class="mono" style="font-size: 10px; display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <span>BURNOUT INDEX</span>
                                <span style="color: ${statusColor};">${burnoutIndex}%</span>
                            </div>
                            <div style="height: 4px; background: #EEE; position: relative;">
                                <div style="height: 100%; background: ${statusColor}; width: ${burnoutIndex}%;"></div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 20px; display: flex; gap: 10px;">
                        <button class="nav-link mono" style="font-size: 9px; flex: 1; border: 1px solid var(--text-dark); padding: 5px;" onclick="window.nyxwell.notifyVolunteer('${m.id}')">WELLNESS CHECK</button>
                        <button class="nav-link mono" style="font-size: 9px; flex: 1; border: 1px solid var(--text-dark); padding: 5px; background: var(--text-dark); color: white;" onclick="window.nyxwell.showPage('ngo-cases')">ASSIGN CASE</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // ── IMPACT REPORTER ──
    initImpact() {
        const summary = document.getElementById('ngo-impact-summary');
        if (!summary) return;

        // Static Insight Generation for Hackathon
        summary.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div class="v-stack" style="gap: 20px;">
                    <div>
                        <div style="font-size: 24px; font-weight: 700;">84.2%</div>
                        <div class="mono" style="font-size: 10px; opacity: 0.6;">POSITIVE RESOLUTION RATE</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: 700;">12.4m</div>
                        <div class="mono" style="font-size: 10px; opacity: 0.6;">AVG. RESPONSE TIME</div>
                    </div>
                </div>
                <div class="v-stack" style="gap: 20px;">
                    <div>
                        <div style="font-size: 24px; font-weight: 700;">4.8/5</div>
                        <div class="mono" style="font-size: 10px; opacity: 0.6;">STUDENT SATISFACTION INDEX</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: 700;">142</div>
                        <div class="mono" style="font-size: 10px; opacity: 0.6;">TOTAL LIVES IMPACTED (30D)</div>
                    </div>
                </div>
            </div>

            <div style="margin-top: 30px; padding: 20px; border: 1.5px dashed var(--text-dark); background: rgba(0,0,0,0.02);">
                <div class="mono" style="font-weight: 700; margin-bottom: 10px;">INSTITUTIONAL FORECAST</div>
                <div class="mono" style="font-size: 12px; line-height: 1.5; opacity: 0.8;">
                    Predictive analysis suggests a 15% increase in "Exam-Related Stress" over the next 14 days. 
                    Suggesting immediate reallocation of 4 Peer Mentors to the [Academic Burnout] queue.
                </div>
            </div>
            
            <button class="nav-link mono" style="margin-top: 20px; font-weight: 700; font-size: 11px;">[ DOWNLOAD FULL REPORT .PDF ]</button>
        `;
    },

    // ── REAL-TIME TOASTS ──
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'brutal-card mono shake';
        toast.style = `
            position: fixed; 
            bottom: 20px; 
            right: 20px; 
            background: ${type === 'urgent' ? 'var(--red)' : 'var(--sage)'}; 
            color: white; 
            padding: 15px 25px; 
            z-index: 9999;
            box-shadow: 10px 10px 0px rgba(0,0,0,0.2);
            font-size: 13px;
            font-weight: 700;
        `;
        toast.innerHTML = (type === 'urgent' ? '⚠️ CRITICAL: ' : 'ℹ️ ') + message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'all 0.5s ease-in';
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    }
};

window.NGOHubExtended = NGOHubExtended;
