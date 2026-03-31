
/**
 * NyxWell NGO Hub Controller
 * Manages real-time case management and staff coordination.
 */

import Store from './store.js';

export const NGOHub = {
    init() {
        console.log("NyxWell: NGO Hub Controller Initializing...");
        let lastCount = -1;
        
        // Listen for pending cases in real-time
        this.unsubscribe = Store.onCaseQueue((cases) => {
            this.renderQueue(cases);
            
            // Critical Alert System for Hackathon
            if (lastCount !== -1 && cases.length > lastCount) {
                const newest = cases[0];
                if (newest && newest.urgency === 'high' && window.NGOHubExtended) {
                    window.NGOHubExtended.showToast(`CRITICAL: New High-Urge Case detected [${newest.category}]`, 'urgent');
                }
            }
            lastCount = cases.length;
        });
    },

    renderQueue(cases) {
        const containers = [
            document.getElementById('ngo-case-queue'),
            document.getElementById('ngo-full-case-queue')
        ];

        containers.forEach(container => {
            if (!container) return;

            if (cases.length === 0) {
                container.innerHTML = `
                    <div class="mono" style="padding: 40px; text-align: center; opacity: 0.4; border: 1.5px dashed var(--text-dark);">
                        NO PENDING CASES IN QUEUE. COMMUNITY IS STABLE.
                    </div>
                `;
                return;
            }

            container.innerHTML = cases.map(c => this.createCaseHTML(c)).join('');
        });
    },

    createCaseHTML(c) {
        const urgencyColor = c.urgency === 'high' ? 'var(--coral)' : '#F59E0B';
        const urgencyLabel = c.urgency === 'high' ? 'RED TIER' : 'AMBER TIER';
        
        // Format Timestamp
        let timeStr = "JUST NOW";
        if (c.timestamp?.toDate) {
            const date = c.timestamp.toDate();
            timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        return `
            <div class="case-item" style="display: flex; align-items: center; justify-content: space-between; padding: 15px; border: var(--border); background: var(--white); box-shadow: var(--shadow); margin-bottom: 12px; animation: slideIn 0.3s ease-out;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <span class="mono" style="background: ${urgencyColor}; color: white; padding: 4px 8px; font-size: 10px; font-weight: 800;">${urgencyLabel}</span>
                    <div>
                        <div class="mono" style="font-weight: 700; font-size: 13px;">Anonymous Case #${c.id.slice(-4).toUpperCase()}</div>
                        <div class="mono" style="font-size: 11px; opacity: 0.6; margin-bottom: 4px;">Category: ${c.category.toUpperCase()} | Sent at ${timeStr}</div>
                        <div class="mono" style="font-size: 11px; line-height: 1.4; max-width: 500px;">${c.detail}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="window.nyxwell.handleNGOAction('${c.id}', 'assigned')" style="padding: 8px 16px; font-size: 11px;">ASSIGN</button>
                    <button class="btn btn-secondary" onclick="window.nyxwell.handleNGOAction('${c.id}', 'checked')" style="padding: 8px 16px; font-size: 11px;">CHECK</button>
                </div>
            </div>
        `;
    },

    async handleAction(id, type) {
        const org = localStorage.getItem('ngoOrg') || 'Anonymous NGO';
        const role = localStorage.getItem('ngoRole') || 'Staff';
        
        const staffInfo = { org, role, timestamp: new Date().toISOString() };
        
        const result = await Store.updateCaseStatus(id, type, staffInfo);
        
        if (result.success) {
            console.log(`Case ${id} successfully marked as ${type}`);
        } else {
            alert("Action Failed: " + result.error);
        }
    },

    async injectDemoFeed() {
        console.log("NyxWell: Injecting high-fidelity demo feed...");
        
        const demoCases = [
            {
                urgency: 'high',
                category: 'Burnout / Exams',
                detail: 'Subject 8291: Consistent negative check-ins for 72hrs. High-risk markers detected in recent journal entry. Urgent intervention suggested.'
            },
            {
                urgency: 'amber',
                category: 'Social Isolation',
                detail: 'Subject 7142: Detected sudden shift in social frequency. Profile shows withdrawal from community sanctuary for 5 days. Welfare check recommended.'
            },
            {
                urgency: 'high',
                category: 'Nightmare / Sleep',
                detail: 'Subject 9033: High anxiety markers during 3:00 AM self-reflection. Reports recurring sleep paralysis and academic dread.'
            }
        ];

        for (const data of demoCases) {
            await Store.saveHelpRequest(data);
        }
        
        console.log("NyxWell: 3 High-Fidelity cases injected successfully.");
    }
};

// Global expose for app.js
window.NGOHub = NGOHub;
