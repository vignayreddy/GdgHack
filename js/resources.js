import { db } from './firebase.js';
import Store from './store.js';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

class ResourcesModule {
  constructor() {
    this.resources = [];
    this.ngos = [];
    this.filterType = 'all';
    this.searchTerm = '';
    this.initialized = false;
    window.Resources = this;
  }

  async init() {
    if (this.initialized) return;
    this._attachEvents();
    this._loadNGOs();
    await this._loadResources();
    this.initialized = true;
  }

  _loadNGOs() {
    Store.onNGOs((data) => {
      this.ngos = data.filter(n => n.isActive);
      this.render();
    });
  }

  async _loadResources() {
    try {
      const snap = await getDocs(collection(db, "resources"));
      this.resources = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Seed if empty AND fallback to local data for immediate view
      if (this.resources.length === 0) {
        console.log("Seeding resources...");
        // Use local data immediately for first render
        this.resources = this._getLocalData();
        this.render();
        
        // Background seed
        this._seedResources().catch(err => console.error("Seeding failed:", err));
      } else {
        this.render();
      }
    } catch (e) {
      console.error("Firestore Load Failed, using local fallback:", e);
      this.resources = this._getLocalData();
      this.render();
    }
  }

  _getLocalData() {
    return [
      // EMERGENCY
      { id: 'l1', title: "Crisis Text Line", desc: "Text HOME to 741741 for free 24/7 crisis counseling.", contact: "741741", link: "https://www.crisistextline.org", type: "Helpline", isEmergency: true, icon: "💬" },
      { id: 'l2', title: "National Suicide Prevention Lifeline", desc: "24/7, free and confidential support for people in distress.", contact: "988", link: "https://988lifeline.org", type: "Helpline", isEmergency: true, icon: "📞" },
      
      // HELPLINES (INDIA)
      { id: 'l3', title: "iCall — TISS Mental Health Helpline", desc: "Professional counsellors available Mon–Sat, 8am–10pm. Free for students and youth under 25.", contact: "9152987821", link: "https://icallhelpline.org", type: "Helpline", isEmergency: false, location: "India", icon: "☎️" },
      { id: 'l4', title: "Vandrevala Foundation 24/7 Helpline", desc: "Round-the-clock multilingual crisis support in Hindi, English, and regional languages.", contact: "1860-2662-345", link: "https://www.vandrevalafoundation.com", type: "Helpline", isEmergency: false, location: "India", icon: "🎧" },
      
      // EXERCISES
      { id: 'e1', title: "The 5-4-3-2-1 Grounding Technique", desc: "Instantly calm your mind by identifying 5 things you see, 4 you can touch, 3 you can hear, 2 you smell, and 1 you taste.", meta: "3 min exercise", link: "https://www.mayoclinichealthsystem.org/hometown-health/speaking-of-health/5-4-3-2-1-countdown-to-make-anxiety-blast-off", type: "Exercise", isEmergency: false, icon: "🧘" },
      { id: 'e2', title: "4-7-8 Breathing for Stress Relief", desc: "A powerful rhythmic breathing pattern that acts as a natural tranquilizer for the nervous system.", meta: "5 min exercise", link: "https://www.healthline.com/health/4-7-8-breathing", type: "Exercise", isEmergency: false, icon: "🌬️" },
      { id: 'e3', title: "Box Breathing Focus Tool", desc: "Used by elite athletes and Navy SEALs to regain focus and composure under intense pressure.", meta: "4 min exercise", link: "https://www.webmd.com/balance/what-is-box-breathing", type: "Exercise", isEmergency: false, icon: "📦" },

      // ARTICLES
      { id: 'a1', title: "Coping with Academic Pressure in India", desc: "Why competitive education systems affect mental health, and how to protect yourself.", meta: "5 min read", link: "https://www.indiatoday.in/education-today/featurephilia/story/how-to-deal-with-academic-pressure-tips-for-students-1815298-2021-06-15", type: "Article", isEmergency: false, icon: "📄" },
      { id: 'a2', title: "How to Talk to Parents About Mental Health", desc: "Practical scripts and tips for starting difficult conversations with Indian family members.", meta: "7 min read", link: "https://www.vogue.in/wellness/content/how-to-talk-to-your-indian-parents-about-mental-health", type: "Article", isEmergency: false, icon: "🗣️" },
      
      // VIDEOS
      { id: 'v1', title: "7 Minute Guided Meditation for Focus [Hindi]", desc: "Practical session designed to help you calm down and improve concentration before study sessions.", meta: "7 min · YouTube", link: "https://www.youtube.com/watch?v=R9U0yL-t70Y", type: "Video", isEmergency: false, icon: "🎥" },
      { id: 'v2', title: "Exam Anxiety: Invisible yet Omnipresent", desc: "Shaurya Srivastava shares a powerful personal account of board exam stress and coping strategies.", meta: "12 min · TEDx", link: "https://www.youtube.com/watch?v=Jm9n2g5XJ-g", type: "Video", isEmergency: false, icon: "🎥" },
      { id: 'v3', title: "Silent Struggles: India's Youth Crisis", desc: "Dr. Samyak Jain highlights the mental health challenges faced by Indian youth and how to build resilience.", meta: "15 min · TEDx", link: "https://www.youtube.com/watch?v=7yB1D99G9Ww", type: "Video", isEmergency: false, icon: "🎥" }
    ];
  }

  async _seedResources() {
    const sampleData = this._getLocalData();
    // Clear existing to avoid dupes during debug if needed, but here we just add if empty
    for (const res of sampleData) {
      delete res.id; // Let Firestore generate ID
      await addDoc(collection(db, "resources"), res);
    }
  }

  _attachEvents() {
    document.querySelectorAll('.res-tab-btn').forEach(btn => {
      btn.onclick = (e) => {
        document.querySelectorAll('.res-tab-btn').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        this.filterType = e.target.dataset.type;
        this.render();
      };
    });

    document.getElementById('res-search')?.addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.render();
    });
  }

  render() {
    const mainGrid = document.getElementById('res-grid-main');
    const emergencyGrid = document.getElementById('res-grid-emergency');
    const emergencySection = document.getElementById('res-emergency-section');
    
    if (!mainGrid || !emergencyGrid) return;

    // Filter Logic
    let filtered = this.resources.filter(r => {
      const matchesType = this.filterType === 'all' || r.type === this.filterType;
      const matchesSearch = r.title.toLowerCase().includes(this.searchTerm) || 
                            r.desc.toLowerCase().includes(this.searchTerm);
      return matchesType && matchesSearch;
    });

    // 1. Separate Emergency
    const emergencies = [
      ...filtered.filter(r => r.isEmergency),
      ...this.ngos.filter(n => n.helpline && n.timing === '24/7')
    ];
    
    const nonEmergencies = [
      ...filtered.filter(r => !r.isEmergency),
      ...this.ngos.filter(n => !(n.helpline && n.timing === '24/7'))
    ];

    // 2. Render Emergency Section
    if (emergencies.length > 0 && (this.filterType === 'all' || this.filterType === 'Helpline')) {
      emergencySection.style.display = 'block';
      emergencyGrid.innerHTML = emergencies.map(r => r.name ? this._createNGOCard(r) : this._createCard(r)).join('');
    } else {
      emergencySection.style.display = 'none';
    }

    // 3. Render Main Grid
    if (nonEmergencies.length === 0) {
      mainGrid.innerHTML = `<div class="mono opacity-50 py-20 text-center" style="grid-column: 1/-1;">No resources found for "${this.searchTerm}"</div>`;
    } else {
      mainGrid.innerHTML = nonEmergencies.map(r => r.name ? this._createNGOCard(r) : this._createCard(r)).join('');
    }
  }

  _createNGOCard(ngo) {
    const isEmerg = ngo.helpline && ngo.timing === '24/7';
    return `
      <div class="brutal-card dash-box res-card" style="padding: 30px; background: var(--white); border-color: ${isEmerg ? 'var(--coral)' : 'var(--sage)'};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
           <span class="mono" style="padding: 4px 10px; background: ${isEmerg ? 'var(--coral-light)' : 'var(--sage-light)'}; color: ${isEmerg ? 'var(--coral)' : 'var(--sage)'}; border-radius: 6px; font-size: 10px; font-weight: 800;">
              ${isEmerg ? '🔴 EMERGENCY 24/7' : '🏛️ VERIFIED NGO'}
           </span>
        </div>
        
        <h3 style="font-size: 20px; margin-bottom: 12px;">${ngo.name}</h3>
        <p class="mono" style="font-size: 13px; line-height: 1.6; opacity: 0.7; margin-bottom: 25px;">${ngo.description}</p>
        
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 15px;">
           <div class="mono" style="font-size: 12px; font-weight: 700;">
              📞 ${ngo.phone}
           </div>
           <a href="${ngo.website}" target="_blank" class="mono" style="font-size: 12px; text-decoration: none; color: var(--sage); font-weight: 800;">
              VISIT →
           </a>
        </div>
      </div>
    `;
  }

  _createCard(r) {
    const isHelpline = r.type === 'Helpline';
    const tagColor = isHelpline ? 'var(--coral-light)' : (r.type === 'Article' ? '#f0f0ff' : '#ecfdf5');
    const tagTextColor = isHelpline ? 'var(--coral)' : (r.type === 'Article' ? '#6366f1' : '#059669');

    return `
      <div class="brutal-card dash-box res-card" style="padding: 30px; background: var(--white); border-radius: 16px; border-width: 2px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
           <span class="mono" style="padding: 4px 10px; background: ${tagColor}; color: ${tagTextColor}; border-radius: 6px; font-size: 10px; font-weight: 800; display: flex; align-items: center; gap: 5px;">
              ${r.icon} ${r.type.toUpperCase()}
           </span>
        </div>
        
        <h3 style="font-size: 20px; margin-bottom: 12px; line-height: 1.4;">${r.title}</h3>
        <p class="mono" style="font-size: 13px; line-height: 1.6; opacity: 0.7; margin-bottom: 25px;">${r.desc}</p>
        
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 15px;">
           <div class="mono" style="font-size: 12px; font-weight: 700;">
              ${r.contact ? `📞 ${r.contact}` : (r.meta ? `⏱️ ${r.meta}` : '')}
           </div>
           <a href="${r.link}" target="_blank" class="mono" style="font-size: 12px; text-decoration: none; color: var(--sage); font-weight: 800; display: flex; align-items: center; gap: 5px;">
              ACCESS →
           </a>
        </div>
      </div>
    `;
  }
}

export default new ResourcesModule();
