import Store from './store.js';

/**
 * NyxWell NGO Directory Module
 * Handles Admin CRUD for support resources and NGOs.
 */
class NGODirectory {
    constructor() {
        this.ngos = [];
        this.modal = document.getElementById('ngo-modal-manage');
        this.list = document.getElementById('ngo-admin-list');
        this.isInitialized = false;
        window.NGODirectory = this;
    }

    async init() {
        if (this.isInitialized) return;
        this._attachListeners();
        
        // Listen to Firestore
        Store.onNGOs((data) => {
            this.ngos = data;
            // Seed if empty
            if (this.ngos.length === 0) {
                this.seedInitialData();
            }
            this.render();
        });

        this.isInitialized = true;
        console.log("NyxWell: NGO Directory Hub Ready.");
    }

    async seedInitialData(isManual = false) {
        if (isManual) {
            if (!confirm("This will inject the 5 official seed NGOs into the database. Continue?")) return;
            const btn = document.getElementById('btn-seed-ngo');
            if (btn) btn.disabled = true;
        }
        console.log("Seeding initial NGO Data...");
        const initialNGOs = [
            {
                name: "Youngistaan Foundation",
                description: "Youth-led NGO focusing on education, youth empowerment & awareness programs. Engages 50,000+ volunteers.",
                phone: "+91 9100142224",
                alternate_phone: "+91 9885342224",
                helpline: false,
                timing: "Office Hours",
                website: "http://www.youngistaanfoundation.org",
                category: "awareness",
                languages: ["English", "Hindi", "Telugu"]
            },
            {
                name: "Vandrevala Foundation",
                description: "Provides free counselling & crisis intervention. One of India’s most trusted mental health NGOs.",
                phone: "+91 9999666555",
                alternate_phone: "",
                helpline: true,
                timing: "24/7",
                website: "https://www.vandrevalafoundation.com",
                category: "mental_health",
                languages: ["Hindi", "English", "Multilingual"]
            },
            {
                name: "Tele-MANAS",
                description: "Government of India initiative for students & youth. Nationwide, multilingual support system.",
                phone: "14416",
                alternate_phone: "",
                helpline: true,
                timing: "24/7",
                website: "https://telemanas.mohfw.gov.in",
                category: "emergency",
                languages: ["All Major Indian Languages"]
            },
            {
                name: "Manas Foundation",
                description: "Working in mental health + social development. Focus on women, youth & community mental health.",
                phone: "+91 11 41708517",
                alternate_phone: "",
                helpline: true,
                timing: "Business Hours",
                website: "https://www.manas.org.in",
                category: "counselling",
                languages: ["Hindi", "English"]
            },
            {
                name: "Parivarthan Counselling Helpline",
                description: "Professional counselling NGO. Focus on emotional support & therapy run by trained counsellors.",
                phone: "+91 7676602602",
                alternate_phone: "",
                helpline: true,
                timing: "1 PM – 10 PM",
                website: "https://parivarthan.org",
                category: "counselling",
                languages: ["English", "Hindi", "Kannada"]
            }
        ];

        for (const ngo of initialNGOs) {
            await Store.saveNGO(ngo);
        }

        if (isManual) {
            const btn = document.getElementById('btn-seed-ngo');
            if (btn) {
                btn.textContent = "✅ DATA INJECTED";
                setTimeout(() => {
                    btn.disabled = false;
                    btn.textContent = "💉 INJECT SEED DATA";
                }, 2000);
            }
        }
    }

    _attachListeners() {
        document.getElementById('btn-add-ngo')?.addEventListener('click', () => this.openModal());
        document.getElementById('ngo-modal-close')?.addEventListener('click', () => this.closeModal());
        document.getElementById('ngo-btn-submit')?.addEventListener('click', () => this.handleSave());
        document.getElementById('btn-seed-ngo')?.addEventListener('click', () => this.seedInitialData(true));
    }

    openModal(id = null) {
        if (!this.modal) return;
        
        const form = {
            id: document.getElementById('ngo-edit-id'),
            name: document.getElementById('ngo-form-name'),
            desc: document.getElementById('ngo-form-desc'),
            phone: document.getElementById('ngo-form-phone'),
            timing: document.getElementById('ngo-form-timing'),
            website: document.getElementById('ngo-form-website'),
            category: document.getElementById('ngo-form-category'),
            isHelpline: document.getElementById('ngo-form-ishelpline'),
            languages: document.getElementById('ngo-form-languages')
        };

        if (id) {
            const ngo = this.ngos.find(n => n.id === id);
            if (ngo) {
                form.id.value = ngo.id;
                form.name.value = ngo.name;
                form.desc.value = ngo.description;
                form.phone.value = ngo.phone;
                form.timing.value = ngo.timing;
                form.website.value = ngo.website;
                form.category.value = ngo.category;
                form.isHelpline.value = ngo.helpline.toString();
                form.languages.value = ngo.languages ? ngo.languages.join(", ") : "";
            }
        } else {
            // Reset form
            Object.values(form).forEach(el => { if (el) el.value = ""; });
            form.category.value = "mental_health";
            form.isHelpline.value = "false";
        }

        this.modal.style.display = 'flex';
    }

    closeModal() {
        if (this.modal) this.modal.style.display = 'none';
    }

    async handleSave() {
        const data = {
            name: document.getElementById('ngo-form-name').value,
            description: document.getElementById('ngo-form-desc').value,
            phone: document.getElementById('ngo-form-phone').value,
            timing: document.getElementById('ngo-form-timing').value,
            website: document.getElementById('ngo-form-website').value,
            category: document.getElementById('ngo-form-category').value,
            helpline: document.getElementById('ngo-form-ishelpline').value === 'true',
            languages: document.getElementById('ngo-form-languages').value.split(',').map(l => l.trim()).filter(l => l)
        };

        const id = document.getElementById('ngo-edit-id').value;

        if (id) {
            await Store.updateNGO(id, data);
        } else {
            await Store.saveNGO(data);
        }

        this.closeModal();
    }

    async toggleStatus(id) {
        const ngo = this.ngos.find(n => n.id === id);
        if (ngo) {
            await Store.updateNGO(id, { isActive: !ngo.isActive });
        }
    }

    async deleteNGO(id) {
        if (confirm("Are you sure you want to delete this resource? This action cannot be undone.")) {
            await Store.deleteNGO(id);
        }
    }

    render() {
        if (!this.list) return;

        if (this.ngos.length === 0) {
            this.list.innerHTML = `<tr><td colspan="6" class="mono" style="padding: 40px; text-align: center; opacity: 0.4;">NO RESOURCES REGISTERED.</td></tr>`;
            return;
        }

        this.list.innerHTML = this.ngos.map(ngo => `
            <tr>
                <td>
                    <div style="font-weight: 800; font-size: 16px;">${ngo.name}</div>
                    <div class="mono" style="font-size: 10px; opacity: 0.6; line-height: 1.4; margin-top: 5px; max-width: 300px; white-space: normal;">${ngo.description}</div>
                </td>
                <td>
                    <span class="ngo-badge" style="background: var(--sage-light); color: var(--sage); border-color: var(--sage);">${ngo.category}</span>
                </td>
                <td class="mono" style="font-size: 11px; font-weight: 700; color: #555;">${ngo.timing}</td>
                <td>
                    <span class="ngo-badge" style="background: ${ngo.helpline ? 'var(--coral-light)' : '#f9f9f9'}; color: ${ngo.helpline ? 'var(--coral)' : '#999'}; border-color: ${ngo.helpline ? 'var(--coral)' : '#ddd'};">
                        ${ngo.helpline ? '🔴 HELPLINE' : 'STANDARD'}
                    </span>
                </td>
                <td>
                    <span class="ngo-badge" style="background: ${ngo.isActive ? '#edfff2' : '#fff0f0'}; color: ${ngo.isActive ? '#25a244' : '#e63946'}; border-color: ${ngo.isActive ? '#25a244' : '#e63946'};">
                        ● ${ngo.isActive ? 'ACTIVE' : 'DISABLED'}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 8px;">
                      <button class="btn-table" onclick="window.NGODirectory.openModal('${ngo.id}')">EDIT</button>
                      <button class="btn-table" onclick="window.NGODirectory.toggleStatus('${ngo.id}')" style="min-width: 80px;">${ngo.isActive ? 'DISABLE' : 'ENABLE'}</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

export default new NGODirectory();
