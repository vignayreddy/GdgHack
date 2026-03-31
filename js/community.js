import { db, auth } from './firebase.js';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  limit,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

class CommunityModule {
  constructor() {
    this.communities = [];
    this.myCommunityIds = new Set();
    this.memberCounts = {}; // Real-time counts
    this.activeCommunity = null;
    this.filterMode = 'all'; // Default filter
    this.unsubscribes = [];
    this.initialized = false;
    window.Community = this;
  }

  async _gridJoin(id) {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, "communityMembers", id + "_" + user.uid), {
      userId: user.uid,
      userName: user.email ? user.email.split('@')[0] : 'Member',
      communityId: id,
      joinedAt: serverTimestamp()
    });
    // Automated Exploration: Open detail view instantly upon joining
    this.openDetail(id);
  }

  async init() {
    if (!this.initialized) {
      this._attachEvents();
      this._seedInitialCommunities();
      this.initialized = true;
    }

    // Clear previous listeners
    this.unsubscribes.forEach(u => u());
    this.unsubscribes = [];

    const user = auth.currentUser;
    if (!user) return;

    // 1. Listen to all communities (Simplified query to avoid index requirements for demo)
    const qComm = collection(db, "communities");
    const unsubComm = onSnapshot(qComm, (snap) => {
      this.communities = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this._renderDiscovery();
    });
    this.unsubscribes.push(unsubComm);

    // 2. Listen to ALL memberships for counts
    const qAllMems = query(collection(db, "communityMembers"));
    const unsubAllMems = onSnapshot(qAllMems, (snap) => {
      const counts = {};
      snap.docs.forEach(d => {
        const cid = d.data().communityId;
        counts[cid] = (counts[cid] || 0) + 1;
      });
      this.memberCounts = counts;
      this._renderDiscovery();
      if (this.activeCommunity) {
        this.activeCommunity.memberCount = this.memberCounts[this.activeCommunity.id] || 0;
        this._updateMembershipUI();
      }
    });
    this.unsubscribes.push(unsubAllMems);

    // 3. Listen to MY memberships
    const qMem = query(collection(db, "communityMembers"), where("userId", "==", user.uid));
    const unsubMem = onSnapshot(qMem, (snap) => {
      this.myCommunityIds = new Set(snap.docs.map(d => d.data().communityId));
      this._renderDiscovery();
      if (this.activeCommunity) this._updateMembershipUI();
    });
    this.unsubscribes.push(unsubMem);
    
    // Seed initial communities if none exist
    this._seedInitialCommunities();
  }

  _attachEvents() {
    document.querySelectorAll('.comm-filter-btn').forEach(btn => {
      btn.onclick = (e) => {
        document.querySelectorAll('.comm-filter-btn').forEach(b => {
          b.classList.remove('active');
          b.style.color = 'var(--text-light)';
          b.style.borderBottom = 'none';
        });
        e.target.classList.add('active');
        e.target.style.color = 'var(--sage)';
        e.target.style.borderBottom = '2px solid var(--sage)';
        
        this.filterMode = e.target.dataset.filter;
        this._renderDiscovery();
      };
    });

    // Search
    const searchInput = document.getElementById('comm-search');
    if (searchInput) {
      searchInput.oninput = (e) => {
        this._renderDiscovery(e.target.value.toLowerCase());
      };
    }

    document.getElementById('comm-tab-btn-discovery').onclick = () => this._switchHub('discovery');
    document.getElementById('comm-tab-btn-mentorship').onclick = () => this._switchHub('mentorship');

    // Create Modal UI
    document.getElementById('comm-btn-create').onclick = () => {
      document.getElementById('comm-modal-create').style.display = 'flex';
    };
    document.getElementById('comm-create-close').onclick = () => {
      document.getElementById('comm-modal-create').style.display = 'none';
    };
    document.getElementById('comm-btn-submit-create').onclick = () => this._handleCreateCommunity();

    // Back to Discovery from Detail
    document.getElementById('comm-detail-back').onclick = () => {
       document.getElementById('comm-view-detail').style.display = 'none';
       document.getElementById('comm-view-discovery').style.display = 'block';
       this.activeCommunity = null;
    };

    // Detail Tabs
    document.querySelectorAll('.comm-detail-tab-btn').forEach(btn => {
       btn.onclick = (e) => {
          document.querySelectorAll('.comm-detail-tab-btn').forEach(b => {
            b.classList.remove('active');
            b.style.color = 'var(--text-light)';
            b.style.borderBottom = 'none';
          });
          e.target.classList.add('active');
          e.target.style.color = 'var(--sage)';
          e.target.style.borderBottom = '2px solid var(--sage)';
          
          this._switchDetailTab(e.target.dataset.tab);
       };
    });

    // Posting & Chat
    document.getElementById('comm-btn-post').onclick = () => this._handleNewPost();
    document.getElementById('comm-chat-send').onclick = () => this._handleSendChat();
    document.getElementById('comm-chat-input').onkeypress = (e) => {
      if (e.key === 'Enter') this._handleSendChat();
    };

    // Membership Toggle
    document.getElementById('comm-btn-membership-toggle').onclick = () => this._handleMembershipToggle();
  }

  _switchHub(mode) {
    const isDiscovery = mode === 'discovery';
    document.getElementById('comm-tab-btn-discovery').style.background = isDiscovery ? 'var(--text-mid)' : 'transparent';
    document.getElementById('comm-tab-btn-discovery').style.color = isDiscovery ? 'var(--white)' : 'var(--cream)';
    document.getElementById('comm-tab-btn-mentorship').style.background = !isDiscovery ? 'var(--text-mid)' : 'transparent';
    document.getElementById('comm-tab-btn-mentorship').style.color = !isDiscovery ? 'var(--white)' : 'var(--cream)';

    document.getElementById('comm-view-discovery').style.display = isDiscovery ? 'block' : 'none';
    document.getElementById('comm-view-mentorship').style.display = !isDiscovery ? 'block' : 'none';
    
    // Safety: Hide detail view whenever switching main hub tabs
    const detailView = document.getElementById('comm-view-detail');
    if (detailView) detailView.style.display = 'none';
    this.activeCommunity = null;
    
    // Explicitly initialize mentors if switching
    if (mode === 'mentorship') {
       window.dispatchEvent(new CustomEvent('init-mentors'));
    }
  }

  _renderDiscovery(searchStr = '') {
    const grid = document.getElementById('comm-grid');
    if (!grid) return;

    let filtered = this.communities;
    if (this.filterMode === 'my') {
      filtered = filtered.filter(c => this.myCommunityIds.has(c.id));
    } else if (this.filterMode === 'popular') {
      filtered = [...filtered].sort((a,b) => (b.memberCount || 0) - (a.memberCount || 0));
    }

    if (searchStr) {
      filtered = filtered.filter(c => 
        (c.name || '').toLowerCase().includes(searchStr) || 
        (c.category || '').toLowerCase().includes(searchStr)
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="mono opacity-50 text-center py-20" style="grid-column: 1/-1;">No communities found. Why not lead the way and create one?</div>`;
      return;
    }

    grid.innerHTML = filtered.map(c => {
      const isJoined = this.myCommunityIds.has(c.id);
      return `
      <div class="brutal-card dash-box" style="padding: 0; min-height: auto; cursor: pointer; overflow: hidden; background: var(--white); transition: transform 0.2s;" onclick="Community.openDetail('${c.id}')">
        <div style="height: 140px; background: url('${c.banner || 'assets/default.jpeg'}'); background-size: cover; background-position: center; position: relative;">
          <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);"></div>
          ${c.official ? `<span class="mono" style="position: absolute; top: 15px; left: 15px; background: linear-gradient(135deg, #4f46e5 0%, #7e22ce 100%); color: white; padding: 3px 10px; font-size: 10px; font-weight: 800; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">OFFICIAL</span>` : ''}
          <div class="mono" style="position: absolute; bottom: 12px; left: 15px; color: white; font-size: 10px; font-weight: 800;">${(c.category || 'General').toUpperCase()}</div>
        </div>
        <div style="padding: 20px;">
          <h3 style="font-size: 18px; margin-bottom: 5px;">${c.name || c.title || 'Untitled Group'}</h3>
          <p class="mono" style="font-size: 11px; opacity: 0.6; line-height: 1.5; margin-bottom: 15px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${c.description || 'Supportive space for individuals sharing similar journeys.'}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="mono" style="font-size: 11px; font-weight: 800;">👤 ${this.memberCounts[c.id] || 0} members</div>
            <button class="btn ${isJoined ? 'btn-secondary' : 'btn-primary'} btn-comm-action" 
                    onclick="event.stopPropagation(); ${isJoined ? `Community.openDetail('${c.id}')` : `Community._gridJoin('${c.id}')`}"
                    style="padding: 5px 15px; font-size: 11px; box-shadow: 2px 2px 0 #000;">
               ${isJoined ? 'VIEW' : 'JOIN'}
            </button>
          </div>
        </div>
      </div>
    `;}).join('');
  }

  async openDetail(id) {
    const community = this.communities.find(c => c.id === id);
    if (!community) return;

    this.activeCommunity = community;
    document.getElementById('comm-view-discovery').style.display = 'none';
    document.getElementById('comm-view-detail').style.display = 'block';

    // Populate Hero
    const name = community.name || community.title || 'Untitled Group';
    document.getElementById('comm-detail-title').textContent = name;
    document.getElementById('comm-detail-banner').style.backgroundImage = `url('${community.banner}')`;
    
    // Restore Badges
    const tags = document.getElementById('comm-detail-tags');
    if (tags) {
      tags.innerHTML = community.official ? 
        `<span class="mono" style="background: linear-gradient(135deg, #4f46e5 0%, #7e22ce 100%); color: white; padding: 4px 12px; font-size: 11px; font-weight: 800; border-radius: 4px; margin-right: 10px;">OFFICIAL</span>` : '';
      tags.innerHTML += `<span class="mono" style="background: #eee; padding: 4px 12px; font-size: 11px; font-weight: 800; border-radius: 4px;">${(community.category || 'General').toUpperCase()}</span>`;
    }

    // Initial stat set (will be updated by _updateMembershipUI real-time)
    this._updateMembershipUI();
    this._startDetailListeners();
    
    // Ensure detail view starts on discussion tab
    this._switchDetailTab('discussion');
    document.querySelectorAll('.comm-detail-tab-btn').forEach(b => {
      if (b.dataset.tab === 'discussion') {
        b.classList.add('active');
        b.style.color = 'var(--sage)';
        b.style.borderBottom = '2px solid var(--sage)';
      } else {
        b.classList.remove('active');
        b.style.color = 'var(--text-light)';
        b.style.borderBottom = 'none';
      }
    });

    // SELF-REPAIR: Ensure current user has their name saved in this membership
    const user = auth.currentUser;
    if (user && this.myCommunityIds.has(id)) {
      (async () => {
        const mid = id + "_" + user.uid;
        const name = user.email ? user.email.split('@')[0] : 'Member';
        await setDoc(doc(db, "communityMembers", mid), { 
          userName: name 
        }, { merge: true });
      })();
    }
  }

  _switchDetailTab(tab) {
    const contents = ['discussion', 'chat', 'members', 'about'];
    contents.forEach(t => {
       const el = document.getElementById('comm-detail-' + t);
       if(el) el.style.display = (t === tab) ? 'block' : 'none';
    });
  }

  _updateMembershipUI() {
    const btn = document.getElementById('comm-btn-membership-toggle');
    const stats = document.getElementById('comm-detail-stats');
    if (!this.activeCommunity) return;

    const cid = this.activeCommunity.id;
    const count = this.memberCounts[cid] || 0;
    const isMember = this.myCommunityIds.has(cid);

    if (stats) stats.textContent = `${count} Member${count === 1 ? '' : 's'}`;
    if (btn) {
      btn.textContent = isMember ? 'MEMBER' : 'JOIN';
      btn.style.background = isMember ? 'var(--white)' : 'var(--sage)';
    }
  }

  async _handleMembershipToggle() {
    const user = auth.currentUser;
    const cid = this.activeCommunity.id;
    const isMember = this.myCommunityIds.has(cid);

    if (isMember) {
      const q = query(collection(db, "communityMembers"), where("userId", "==", user.uid), where("communityId", "==", cid));
      const snap = await getDocs(q);
      snap.forEach(async (d) => await deleteDoc(doc(db, "communityMembers", d.id)));
    } else {
      await setDoc(doc(db, "communityMembers", cid + "_" + user.uid), {
        userId: user.uid,
        userName: user.email ? user.email.split('@')[0] : 'Member',
        communityId: cid,
        joinedAt: serverTimestamp()
      });
      // Exploration flow even from detail view
      this.openDetail(cid);
    }
  }

  async _handleCreateCommunity() {
    const name = document.getElementById('comm-new-name').value.trim();
    const category = document.getElementById('comm-new-category').value;
    const description = document.getElementById('comm-new-desc').value.trim();

    if (!name) { alert("Please provide a name."); return; }

    const user = auth.currentUser;
    await addDoc(collection(db, "communities"), {
      name,
      category,
      description,
      ownerId: user.uid,
      official: false,
      memberCount: 1,
      banner: "assets/default.jpeg",
      createdAt: serverTimestamp()
    });

    document.getElementById('comm-modal-create').style.display = 'none';
    document.getElementById('comm-new-name').value = '';
    document.getElementById('comm-new-desc').value = '';
  }

  _startDetailListeners() {
    if (!this.activeCommunity) return;
    const cid = this.activeCommunity.id;

    // Check if we already have specific detail listeners for this community to avoid duplicates
    // But since we clear unsubscribes in init() and startDetailListeners, we are safe.
    
    // 1. Listen to Posts (Removed orderBy to avoid Index errors)
    const qPosts = query(collection(db, "communityPosts"), where("communityId", "==", cid));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort locally for immediate results
      posts.sort((a,b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
      this._renderPosts(posts);
    });
    this.unsubscribes.push(unsubPosts);

    // 2. Listen to Chat (Removed orderBy)
    const qChat = query(collection(db, "chatMessages"), where("communityId", "==", cid));
    const unsubChat = onSnapshot(qChat, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a,b) => (a.timestamp?.toDate() || 0) - (b.timestamp?.toDate() || 0));
      this._renderChat(msgs);
    });
    this.unsubscribes.push(unsubChat);

    // 3. Listen to Members
    const qMembers = query(collection(db, "communityMembers"), where("communityId", "==", cid));
    const unsubMembers = onSnapshot(qMembers, (snap) => {
      const members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      this._renderMembers(members);
    });
    this.unsubscribes.push(unsubMembers);

    this._renderAbout();
  }

  _renderPosts(posts) {
    const list = document.getElementById('comm-posts-list');
    if (!list) return;

    if (posts.length === 0) {
      list.innerHTML = `<div class="mono opacity-50 text-center py-10">No discussions yet. Start one above!</div>`;
      return;
    }

    list.innerHTML = posts.map(p => `
      <div class="brutal-card dash-box" style="padding: 20px; min-height: auto; background: var(--white);">
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
           <div class="user-avatar" style="width: 32px; height: 32px;">${(p.authorName || 'U')[0]}</div>
           <div>
             <div class="mono" style="font-size: 12px; font-weight: 800;">${p.authorName || 'Anonymous'}</div>
             <div class="mono" style="font-size: 9px; opacity: 0.5;">${p.timestamp ? new Date(p.timestamp.toDate()).toLocaleString() : 'Just now'}</div>
           </div>
        </div>
        <p class="mono" style="font-size: 13px; line-height: 1.5;">${p.content}</p>
      </div>
    `).join('');
  }

  _renderChat(msgs) {
    const body = document.getElementById('comm-chat-messages');
    if (!body) return;

    body.innerHTML = msgs.map(m => `
      <div style="display: flex; gap: 10px; ${m.userId === auth.currentUser.uid ? 'flex-direction: row-reverse' : ''}">
        <div class="user-avatar" style="width: 24px; height: 24px; font-size: 10px;">${(m.userName || m.authorName || 'U')[0]}</div>
        <div class="mono" style="max-width: 80%; padding: 8px 12px; background: ${m.userId === auth.currentUser.uid ? 'var(--sage-light)' : 'var(--white)'}; border: 1.5px solid #000; font-size: 11px;">
           ${m.text || m.content}
        </div>
      </div>
    `).join('');
    
    if (body.style.display !== 'none') {
      body.scrollTop = body.scrollHeight;
    }
  }

  _renderMembers(members) {
    const list = document.getElementById('comm-members-list');
    if (!list) return;

    list.innerHTML = members.map(m => {
      let dispName = m.userName || 'Member';
      // UI Fallback for current user
      if (m.userId === auth.currentUser?.uid && !m.userName) {
        dispName = auth.currentUser.email ? auth.currentUser.email.split('@')[0] : 'Member';
      }

      return `
      <div style="display: flex; items-center; gap: 15px; padding: 12px; border-bottom: 1px solid #f0f0f0;">
         <div class="user-avatar" style="width: 32px; height: 32px;">${(dispName || 'M')[0].toUpperCase()}</div>
         <div>
            <div class="mono" style="font-size: 13px; font-weight: 800;">${dispName}</div>
            <div class="mono" style="font-size: 10px; opacity: 0.5;">Joined SafeSpace Community</div>
         </div>
      </div>
    `;}).join('');
  }

  _renderAbout() {
    const container = document.getElementById('comm-detail-about-content');
    if (!container || !this.activeCommunity) return;

    const comm = this.activeCommunity;
    container.innerHTML = `
      <div style="margin-bottom: 25px;">
        <h4 class="mono" style="font-size: 11px; font-weight: 800; opacity: 0.5; margin-bottom: 10px;">DESCRIPTION</h4>
        <div>${comm.description || 'Welcome to this supportive space. Join us in our journey toward mental wellness and community connection.'}</div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
        <div>
          <h4 class="mono" style="font-size: 11px; font-weight: 800; opacity: 0.5; margin-bottom: 10px;">GUIDELINES</h4>
          <ul style="padding-left: 20px;">
            <li>Be respectful and compassionate</li>
            <li>No medical advice - consult pros</li>
            <li>Safe space for all identities</li>
          </ul>
        </div>
        <div>
          <h4 class="mono" style="font-size: 11px; font-weight: 800; opacity: 0.5; margin-bottom: 10px;">COMMUNITY INFO</h4>
          <div style="font-size: 12px;">Category: <b>${comm.category || 'Wellness'}</b></div>
          <div style="font-size: 12px;">Type: <b>${comm.official ? 'OFFICIAL' : 'PEER-LED'}</b></div>
        </div>
      </div>
    `;
  }

  async _handleNewPost() {
    const input = document.getElementById('comm-post-input');
    const content = input.value.trim();
    if (!content || !this.activeCommunity) return;

    const user = auth.currentUser;
    await addDoc(collection(db, "communityPosts"), {
      communityId: this.activeCommunity.id,
      authorId: user.uid,
      authorName: user.email.split('@')[0],
      content,
      timestamp: serverTimestamp()
    });
    input.value = '';
  }

  async _handleSendChat() {
    const input = document.getElementById('comm-chat-input');
    const text = input.value.trim();
    if (!text || !this.activeCommunity) return;

    const user = auth.currentUser;
    await addDoc(collection(db, "chatMessages"), {
      communityId: this.activeCommunity.id,
      userId: user.uid,
      userName: user.email.split('@')[0],
      text,
      timestamp: serverTimestamp()
    });
    input.value = '';
  }

  async _seedInitialCommunities() {
    const q = await getDocs(collection(db, "communities"));
    if (q.empty) {
      const initial = [
        { 
          name: "Stress Management", 
          description: "Daily strategies and support for building resilience and managing modern stress.", 
          banner: "assets/stress.jpeg", 
          category: "Stress", 
          official: true, 
          memberCount: 0 
        },
        { 
          name: "Mindfulness Practitioners", 
          description: "Together we practice being present. Share techniques and guided sessions to reduce anxiety.", 
          banner: "assets/mindful.jpeg", 
          category: "Mindfulness", 
          official: true, 
          memberCount: 0 
        },
        { 
          name: "Sleep Sanctuary", 
          description: "Your safe space for better rest. Tips for sleep hygiene and overcoming insomnia.", 
          banner: "assets/Sleep.jpeg", 
          category: "Sleep", 
          official: true, 
          memberCount: 0 
        },
        { 
          name: "Anxiety Support Group", 
          description: "You are not alone. A compassionate community for sharing experiences and coping with anxiety.", 
          banner: "assets/gratitude.jpeg", 
          category: "Anxiety", 
          official: true, 
          memberCount: 0 
        },
        { 
          name: "CodeNyx Hackathon Hub", 
          description: "Official community for CodeNyx participants. Network, find team members, and stay updated.", 
          banner: "assets/hero.png", 
          category: "General", 
          official: true, 
          memberCount: 0 
        }
      ];
      for (const c of initial) {
        await addDoc(collection(db, "communities"), c);
      }
    } else {
      // Logic for existing installs: Migration to local assets
      this._migrateExistingCommunities();
    }
  }

  async _migrateExistingCommunities() {
    const mapping = {
      "Stress Management": "assets/stress.jpeg",
      "Mindfulness Practitioners": "assets/mindful.jpeg",
      "Sleep Sanctuary": "assets/Sleep.jpeg",
      "Anxiety Support Group": "assets/gratitude.jpeg",
      "CodeNyx Hackathon Hub": "assets/hero.png"
    };

    const q = await getDocs(collection(db, "communities"));
    q.forEach(async (d) => {
      const data = d.data();
      const localBanner = mapping[data.name];
      // Only update if it's an official one and using an external link (or no banner)
      if (localBanner && (!data.banner || data.banner.startsWith('http'))) {
        await setDoc(d.ref, { banner: localBanner }, { merge: true });
      }
    });
  }
}

const Community = new CommunityModule();
export default Community;
