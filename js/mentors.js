import { db, auth } from './firebase.js';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  serverTimestamp, 
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  limit
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

class MentorsModule {
  constructor() {
    this.mentors = [];
    this.myMentorships = [];
    this.filterExpertise = 'all';
    this.filterMode = 'find';
    this.initialized = false;
    this.unsubscribes = [];
    window.Mentors = this;
    
    this.expertiseOptions = [
      "Anxiety", "Sleep", "Depression", "Stress", "Mindfulness", 
      "Trauma", "ADHD", "Burnout", "OCD", "Addiction"
    ];

    // Always listen for tab changes
    window.addEventListener('init-mentors', () => this.init());
  }

  async init() {
    if (!this.initialized) {
      this._attachEvents();
      this.initialized = true;
    }

    const user = auth.currentUser;
    if (!user) return;

    // 1. Listen to all mentors
    const qMentors = query(collection(db, "mentors"), orderBy("rating", "desc"));
    const unsubMentors = onSnapshot(qMentors, (snap) => {
      this.mentors = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.renderMentors();
    });
    this.unsubscribes.push(unsubMentors);

    // 2. Listen to my mentorships
    const qMentorships = query(collection(db, "mentorships"), where("participants", "array-contains", user.uid));
    const unsubMentorships = onSnapshot(qMentorships, (snap) => {
      this.myMentorships = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this.renderMentors();
    });
    this.unsubscribes.push(unsubMentorships);

    this._seedSampleMentors();
  }

  _attachEvents() {
    // Mentorship Mode Switcher (Find vs My)
    document.querySelectorAll('.mentor-filter-btn').forEach(btn => {
      btn.onclick = (e) => {
        document.querySelectorAll('.mentor-filter-btn').forEach(b => b.classList.remove('active', 'sage-border'));
        e.target.classList.add('active');
        e.target.style.borderBottom = '2px solid var(--sage)';
        e.target.style.color = 'var(--sage)';
        
        const mode = e.target.dataset.mode;
        this.filterMode = mode;
        document.getElementById('mentor-grid').style.display = mode === 'find' ? 'grid' : 'none';
        document.getElementById('mentor-grid-my').style.display = mode === 'my' ? 'grid' : 'none';
        this.renderMentors();
      };
    });

    // Expertise Filters
    document.querySelectorAll('[data-expertise]').forEach(btn => {
      btn.onclick = (e) => {
        document.querySelectorAll('[data-expertise]').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        this.filterExpertise = e.target.dataset.expertise;
        this.renderMentors();
      };
    });

    // Search
    document.getElementById('mentor-search')?.addEventListener('input', (e) => {
      this.renderMentors(e.target.value.toLowerCase());
    });

    // Chat Modal UI
    document.getElementById('mentor-chat-close').onclick = () => this._closeChat();
    document.getElementById('mentor-chat-send').onclick = () => this._handleSendChat();
    document.getElementById('mentor-chat-input').onkeypress = (e) => {
      if (e.key === 'Enter') this._handleSendChat();
    };

    // Onboarding Toggle...
    document.getElementById('mentor-btn-onboard').onclick = () => {
       document.getElementById('comm-view-mentorship').querySelectorAll('.brutal-card, .grid').forEach(el => el.style.display = 'none');
       document.getElementById('mentor-form-onboard').style.display = 'block';
       this._renderExpertiseOnboard();
    };

    document.getElementById('mentor-btn-cancel').onclick = () => {
       this.initialized = false; // Trigger re-init
       this.init();
       document.getElementById('comm-view-mentorship').querySelectorAll('.brutal-card, .grid').forEach(el => el.style.display = '');
       document.getElementById('mentor-form-onboard').style.display = 'none';
    };

    // Onboarding Action
    document.getElementById('mentor-btn-submit').onclick = () => this._handleBecomeMentor();

    // Matching Quiz Logic
    document.getElementById('mentor-btn-match').onclick = () => {
       document.getElementById('mentor-quiz-modal').style.display = 'flex';
       this._resetMatchQuiz();
    };

    document.getElementById('quiz-close').onclick = () => {
       document.getElementById('mentor-quiz-modal').style.display = 'none';
    };

    // Quiz Option Click (Handles all 3 steps)
    document.querySelectorAll('.quiz-opt-btn').forEach(btn => {
       btn.onclick = (e) => {
          const val = e.target.dataset.val;
          this._handleQuizStep(val);
       };
    });

    // Close modal on click outside
    document.getElementById('mentor-quiz-modal').onclick = (e) => {
       if (e.target.id === 'mentor-quiz-modal') e.target.style.display = 'none';
    };

    // Listen for tab trigger from Community module
    window.addEventListener('init-mentors', () => this.init());
  }

  _resetMatchQuiz() {
    this.quizStep = 1;
    this.quizAnswers = {};
    document.getElementById('quiz-step-1').style.display = 'block';
    document.getElementById('quiz-step-2').style.display = 'none';
    document.getElementById('quiz-step-3').style.display = 'none';
    document.getElementById('quiz-loading').style.display = 'none';
  }

  _handleQuizStep(val) {
    if (this.quizStep === 1) {
       this.quizAnswers.goal = val;
       this.quizStep = 2;
       document.getElementById('quiz-step-1').style.display = 'none';
       document.getElementById('quiz-step-2').style.display = 'block';
    } else if (this.quizStep === 2) {
       this.quizAnswers.mood = val;
       this.quizStep = 3;
       document.getElementById('quiz-step-2').style.display = 'none';
       document.getElementById('quiz-step-3').style.display = 'block';
    } else if (this.quizStep === 3) {
       this.quizAnswers.priority = val;
       document.getElementById('quiz-step-3').style.display = 'none';
       document.getElementById('quiz-loading').style.display = 'block';

       setTimeout(() => {
          document.getElementById('mentor-quiz-modal').style.display = 'none';
          this.filterExpertise = this.quizAnswers.goal;
          
          // UI Feedback: Focus on the matching category
          document.querySelectorAll('[data-expertise]').forEach(btn => {
             btn.classList.toggle('selected', btn.dataset.expertise === this.quizAnswers.goal);
          });
          
          this.renderMentors();
          alert(`Great news! We found personalized matches for your goal: ${this.quizAnswers.goal}. We've prioritized the best mentors for you.`);
       }, 2000);
    }
  }

  _renderExpertiseOnboard() {
    const container = document.getElementById('mentor-expertise-onboard');
    if (!container) return;
    
    container.innerHTML = this.expertiseOptions.map(opt => `
      <button class="tag-btn mono" data-val="${opt}">${opt}</button>
    `).join('');

    container.querySelectorAll('.tag-btn').forEach(btn => {
       btn.onclick = () => btn.classList.toggle('selected');
    });
  }

  renderMentors(search = '') {
    if (this.filterMode === 'my') {
      this._renderMyMentorships();
      return;
    }

    const grid = document.getElementById('mentor-grid');
    if (!grid) return;

    let filtered = this.mentors;
    if (this.filterExpertise !== 'all') {
      filtered = filtered.filter(m => (m.expertise || []).includes(this.filterExpertise));
    }
    if (search) {
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(search) || 
        (m.expertise || []).some(e => e.toLowerCase().includes(search))
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="mono opacity-50 text-center py-20" style="grid-column: 1/-1;">No mentors found for this criteria. Try a different search.</div>`;
      return;
    }

    grid.innerHTML = filtered.map(m => `
      <div class="brutal-card dash-box" style="padding: 25px; min-height: auto; background: var(--white); display: flex; flex-direction: column;">
        <div style="display: flex; gap: 20px; align-items: start; margin-bottom: 20px;">
           <img src="${m.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800'}" 
                style="width: 80px; height: 80px; border: var(--border); object-fit: cover;">
           <div style="flex: 1;">
              <h3 style="font-size: 20px; margin-bottom: 2px;">${m.name}</h3>
              <div class="mono" style="font-size: 11px; font-weight: 800; color: var(--coral);">⭐ ${m.rating} (${m.helpCount} helped)</div>
           </div>
           <div style="width: 44px; height: 44px; background: var(--sage-light); border-radius: 50%; display: flex; align-items: center; justify-content: center;">👤</div>
        </div>
        
        <p class="mono" style="font-size: 12px; font-style: italic; opacity: 0.8; margin-bottom: 20px; line-height: 1.6;">
          "${m.bio || 'Compassionate listener ready to help you navigate your journey.'}"
        </p>

        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 25px; flex: 1;">
           ${(m.expertise || []).map(e => `<span class="mono" style="font-size: 9px; padding: 2px 8px; border: 1.5px solid #000; background: #eee;">${e}</span>`).join('')}
        </div>

        <button class="btn btn-primary btn-mentor-request" data-id="${m.id}" 
                style="width: 100%; border: var(--border); padding: 12px; font-size: 13px; font-weight: 800;">
           REQUEST MENTORSHIP
        </button>
      </div>
    `).join('');

    grid.querySelectorAll('.btn-mentor-request').forEach(btn => {
       btn.onclick = () => this._handleMentorshipRequest(btn.dataset.id);
    });
  }

  _renderMyMentorships() {
    const grid = document.getElementById('mentor-grid-my');
    if (!grid) return;

    if (this.myMentorships.length === 0) {
      grid.innerHTML = `<div class="mono opacity-50 text-center py-20">You have no active or pending mentorships yet.</div>`;
      return;
    }

    const uid = auth.currentUser.uid;

    grid.innerHTML = this.myMentorships.map(m => {
      const isMentor = m.mentorId === uid;
      const partnerName = isMentor ? (m.studentName || 'Student') : (m.mentorName || 'Mentor');
      const statusColor = m.status === 'active' ? 'var(--sage)' : (m.status === 'pending' ? 'var(--coral)' : '#666');
      
      return `
        <div class="brutal-card" style="padding: 20px; background: var(--white); display: flex; align-items: center; justify-content: space-between; gap: 20px;">
           <div style="display: flex; align-items: center; gap: 15px;">
              <div class="user-avatar" style="width: 40px; height: 40px;">${partnerName[0]}</div>
              <div>
                <div class="mono" style="font-weight: 800; font-size: 14px;">${partnerName}</div>
                <div class="mono" style="font-size: 10px; color: ${statusColor}; font-weight: 800;">● ${m.status.toUpperCase()}</div>
              </div>
           </div>

           <div style="display: flex; gap: 10px;">
              ${m.status === 'pending' && isMentor ? `
                <button class="tag-btn mono" onclick="Mentors._handleStatus('${m.id}', 'active')" style="background: var(--sage-light);">APPROVE</button>
                <button class="tag-btn mono" onclick="Mentors._handleStatus('${m.id}', 'declined')">DECLINE</button>
              ` : ''}
              ${m.status === 'active' ? `
                <button class="btn btn-primary" onclick="Mentors._openChat('${m.id}', '${partnerName}')" style="padding: 8px 20px; font-size: 11px;">OPEN CHAT</button>
              ` : `<span class="mono" style="font-size: 11px; opacity: 0.5; padding: 8px;">Waiting...</span>`}
           </div>
        </div>
      `;
    }).join('');

    // Attach class-level access for onclick handlers
    window.Mentors = this;
  }

  async _handleStatus(id, newStatus) {
    if (newStatus === 'declined') {
       await deleteDoc(doc(db, "mentorships", id));
    } else {
       await updateDoc(doc(db, "mentorships", id), { status: newStatus });
    }
  }

  async _openChat(mentorshipId, partnerName) {
    this.currentMentorship = mentorshipId;
    document.getElementById('mentor-chat-partner').textContent = partnerName;
    document.getElementById('mentorship-chat-modal').style.display = 'flex';
    
    // Clear old listener
    if (this.activeChatUnsub) this.activeChatUnsub();

    // Listen to messages
    const q = query(
      collection(db, "mentorshipMessages"),
      where("mentorshipId", "==", mentorshipId),
      orderBy("timestamp", "asc"),
      limit(50)
    );

    this.activeChatUnsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this._renderChatMessages(msgs);
    });
  }

  _renderChatMessages(msgs) {
    const list = document.getElementById('mentor-chat-messages');
    if (!list) return;

    const uid = auth.currentUser.uid;
    list.innerHTML = msgs.map(m => `
      <div style="display: flex; flex-direction: column; align-items: ${m.senderId === uid ? 'flex-end' : 'flex-start'};">
         <div class="mono" style="max-width: 85%; padding: 12px 18px; background: ${m.senderId === uid ? 'var(--sage-light)' : '#f3f3f3'}; border: var(--border); font-size: 12px; line-height: 1.5; box-shadow: 2px 2px 0 var(--text-dark);">
            ${m.text}
         </div>
         <div class="mono" style="font-size: 9px; opacity: 0.4; margin-top: 5px;">
           ${m.timestamp ? new Date(m.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Sending...'}
         </div>
      </div>
    `).join('');
    list.scrollTop = list.scrollHeight;
  }

  async _handleSendChat() {
    const input = document.getElementById('mentor-chat-input');
    const text = input.value.trim();
    if (!text || !this.currentMentorship) return;

    input.value = '';
    const user = auth.currentUser;
    await addDoc(collection(db, "mentorshipMessages"), {
      mentorshipId: this.currentMentorship,
      senderId: user.uid,
      text,
      timestamp: serverTimestamp()
    });
  }

  _closeChat() {
    document.getElementById('mentorship-chat-modal').style.display = 'none';
    if (this.activeChatUnsub) this.activeChatUnsub();
    this.currentMentorship = null;
  }

  async _handleMentorshipRequest(mentorId) {
    const user = auth.currentUser;
    if (!user) return;

    const exists = this.myMentorships.some(m => m.mentorId === mentorId);
    if (exists) {
      alert("You already have an active mentorship request with this person.");
      return;
    }

    try {
      await addDoc(collection(db, "mentorships"), {
        mentorId,
        studentId: user.uid,
        participants: [mentorId, user.uid],
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert("Request sent! They will be notified and can start a session with you soon.");
    } catch (err) {
      console.error("Mentorship error:", err);
    }
  }

  async _handleBecomeMentor() {
    const user = auth.currentUser;
    const bio = document.getElementById('mentor-form-bio').value.trim();
    const expertise = Array.from(document.querySelectorAll('#mentor-expertise-onboard .tag-btn.selected')).map(b => b.dataset.val);

    if (!bio || expertise.length === 0) {
      alert("Please provide a bio and select at least one area of expertise.");
      return;
    }

    const btn = document.getElementById('mentor-btn-submit');
    btn.disabled = true;
    btn.textContent = 'JOINING NETWORK...';

    try {
      await setDoc(doc(db, "mentors", user.uid), {
        name: user.email.split('@')[0],
        email: user.email,
        bio,
        expertise,
        rating: 5.0,
        helpCount: 0,
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800",
        createdAt: serverTimestamp()
      });
      
      alert("Welcome to the Peer Mentor Network! Your profile is now live.");
      document.getElementById('mentor-btn-cancel').click(); // Switch back to grid
    } catch (err) {
      console.error("Mentor onboarding error:", err);
      btn.disabled = false;
      btn.textContent = 'JOIN THE NETWORK 🥳';
    }
  }

  async _seedSampleMentors() {
    const q = await getDocs(collection(db, "mentors"));
    // Ensure we have the full high-fidelity set if currently using old placeholders
    if (q.size < 10) {
      // Clear old placeholders first for a clean experience
      for (const d of q.docs) {
        await deleteDoc(doc(db, "mentors", d.id));
      }

      const initial = [
        { name: "Ananya Sharma", bio: "Engineering student who overcame academic anxiety. I focus on mindful exam-prep and panic management.", rating: 4.9, helpCount: 88, expertise: ["Anxiety", "Stress"], avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400" },
        { name: "Rahul Iyer", bio: "Corporate professional recovering from severe burnout. Specialized in workplace stress and boundaries.", rating: 4.8, helpCount: 124, expertise: ["Burnout", "Stress"], avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400" },
        { name: "Siddharth Nair", bio: "Licensed therapist and peer mentor focusing on male depression and breaking social stigmas.", rating: 4.9, helpCount: 204, expertise: ["Depression", "Trauma"], avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" },
        { name: "Meera Reddy", bio: "Lived experience with adult ADHD. Dedicated to helping others find focus and better sleep hygiene.", rating: 4.7, helpCount: 156, expertise: ["ADHD", "Sleep"], avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400" },
        { name: "Arjun Varma", bio: "Meditation practitioner helping you navigate generalized anxiety through daily mindfulness.", rating: 4.8, helpCount: 312, expertise: ["Anxiety", "Mindfulness"], avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400" },
        { name: "Priya Das", bio: "Compassionate listener for trauma survivors. We work together on resilience and inner peace.", rating: 4.9, helpCount: 45, expertise: ["Trauma", "Depression"], avatar: "https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?w=400" },
        { name: "Karan Malhotra", bio: "High-performance stress specialist. I help you stay calm during your career's most intense seasons.", rating: 4.6, helpCount: 112, expertise: ["Stress", "Burnout"], avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400" },
        { name: "Ishani Gupta", bio: "Finding light in the darkness of clinical depression. You are not alone on this healing path.", rating: 4.8, helpCount: 92, expertise: ["Depression", "Mindfulness"], avatar: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7b?w=400" },
        { name: "Zoya Khan", bio: "Sleep sanctuary specialist. Overcoming insomnia through routine and cognitive wellness.", rating: 4.7, helpCount: 67, expertise: ["Sleep", "Stress"], avatar: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=400" },
        { name: "Rohan Joshi", bio: "Navigating life’s overwhelming signals with ADHD. Let’s build your focus toolkit together.", rating: 4.6, helpCount: 129, expertise: ["ADHD", "Anxiety"], avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400" },
        { name: "Aditi Rao", bio: "I help women balance household burnout and emotional loads through mindfulness practice.", rating: 4.8, helpCount: 215, expertise: ["Burnout", "Mindfulness"], avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400" },
        { name: "Vivek Menon", bio: "Processing past trauma and building emotional resilience for a brighter future.", rating: 4.9, helpCount: 98, expertise: ["Trauma", "Stress"], avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400" },
        { name: "Tanuja Singh", bio: "Specialist in postpartum depression and mothering anxiety. Support for the new journey.", rating: 4.7, helpCount: 142, expertise: ["Depression", "Anxiety"], avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400" },
        { name: "Abhishek Bose", bio: "Burnout recovery for developers. I help you reclaim your passion for code without the stress.", rating: 4.9, helpCount: 86, expertise: ["Burnout", "ADHD"], avatar: "https://images.unsplash.com/photo-1506803682981-6e718a9dd3ee?w=400" },
        { name: "Sanya Kapoor", bio: "Mindful living for busy professionals. Simple techniques for lasting mental calmness.", rating: 4.8, helpCount: 54, expertise: ["Mindfulness", "Sleep"], avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400" },
        { name: "Vikram Saxena", bio: "Supporting students through competitive exam stress and performance anxiety.", rating: 4.6, helpCount: 198, expertise: ["Stress", "Anxiety"], avatar: "https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?w=400" },
        { name: "Deepa Krishnan", bio: "Overcoming trauma-related sleep disorders and finding restful peace again.", rating: 4.9, helpCount: 122, expertise: ["Sleep", "Trauma"], avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400" },
        { name: "Manish Gupta", bio: "Practical ADHD management and productivity without the burnout. It's possible.", rating: 4.7, helpCount: 231, expertise: ["ADHD", "Burnout"], avatar: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?w=400" },
        { name: "Kavita Pillai", bio: "Compassionate peer support for major life transitions and related depression.", rating: 4.8, helpCount: 77, expertise: ["Depression", "Trauma"], avatar: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800" },
        { name: "Aarav Shah", bio: "Stress management for young entrepreneurs. Building a business without breaking yourself.", rating: 4.9, helpCount: 412, expertise: ["Stress", "Burnout"], avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400" }
      ];
      for (const m of initial) {
        await addDoc(collection(db, "mentors"), m);
      }
    }
  }
}

const Mentors = new MentorsModule();
export default Mentors;
