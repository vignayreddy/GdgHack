import Store from './store.js';
import Overview from './overview.js';
import Mood from './mood.js';
import Sleep from './sleep.js';
import Stress from './stress.js';
import Journal from './journal.js';
import Community from './community.js';
import Mentors from './mentors.js';
import Resources from './resources.js';
import Activity from './activity.js';
import Settings from './settings.js';

/**
 * NyxWellApp handles all UI interactions, authentication states,
 * and page routing for the platform.
 */
class NyxWellApp {
  constructor() {
    this.protectedPages = ['overview', 'mood-tracker', 'sleep-tracker', 'stress-tracker', 'journal', 'community', 'resources', 'activity', 'ngo-impact-map', 'ngo-directory', 'settings'];
    this.quizAnswers = {};
    this.currentUserProfile = null;
    this.currentPage = 'home';
    this.isNGOLoggedIn = localStorage.getItem('ngoLogin') === 'true';
    this.init();
  }

  init() {
    this._attachEventListeners();
    this._restoreNGOSession();
    
    // Explicitly show dashboard if NGO session is restored
    if (this.isNGOLoggedIn) {
      this.showPage('ngo-dashboard');
    }

    // Firebase Auth Observer
    Store.onAuth(async (user) => {
      await this._handleAuthState(user);
    });
  }

  async _handleAuthState(user) {
    // NGO Persistence Guard: Do not force guest redirects if an NGO is logged in
    if (this.isNGOLoggedIn) return;

    const body = document.body;
    
    if (user) {
      body.classList.remove('is-guest');
      body.classList.add('is-user');
      
      // Fetch Firestore profile
      this.currentUserProfile = await Store.getOnboardingStatus();
      
      if (this.currentUserProfile.onboardingComplete) {
        // Logged in + Onboarding done
        if (['home', 'auth', 'welcome', 'onboarding-form'].includes(this.currentPage)) {
          this.showPage('overview');
        }
      } else {
        // Logged in but needs onboarding
        this.showPage('welcome');
      }
    } else {
      // Guest mode
      body.classList.remove('is-user');
      body.classList.add('is-guest');
      this.currentUserProfile = null;
      
      if (this.protectedPages.includes(this.currentPage) || this.currentPage === 'welcome' || this.currentPage === 'onboarding-form') {
        this.showPage('home');
      }
    }
    this.updateNav();
  }

  _attachEventListeners() {
    // Navigation (Universal)
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-page]');
      if (target) {
        e.preventDefault();
        const page = target.dataset.page;
        this.showPage(page);
      }
    });

    // Auth Toggles & Buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('#toggle-auth')) {
        const isLogin = document.getElementById('auth-title').textContent === 'Login';
        this.renderAuth(isLogin ? 'signup' : 'login');
      }
      
      if (e.target.closest('#auth-submit')) this.handleAuthSubmission();
      if (e.target.closest('#btn-ngo-submit')) this.handleNGOSubmission();
      if (e.target.closest('#btn-google')) this.handleGoogleLogin();
      
      if (e.target.closest('#btn-start-onboarding')) this.showPage('onboarding-form');
      if (e.target.closest('#btn-ngo-start-onboarding')) this.showPage('ngo-onboarding');
      
      if (e.target.closest('#btn-complete-onboarding')) this.handleOnboardingCompletion();
      if (e.target.closest('#btn-ngo-complete-onboarding')) this.handleNGOOnboardingCompletion();
      
      if (e.target.closest('#nav-logout-btn')) {
        this.isNGOLoggedIn = false;
        localStorage.removeItem('ngoLogin');
        localStorage.removeItem('ngoOrg');
        localStorage.removeItem('ngoRole');
        localStorage.removeItem('ngoRegion');
        Store.logout();
        this.showPage('home');
      }
      
      // Feature actions
      if (e.target.closest('#submit-help')) this.handleHelpRequest();
    });

    // Selectors
    document.addEventListener('click', (e) => {
      if (e.target.closest('.mood-btn')) {
        const btn = e.target.closest('.mood-btn');
        const parent = btn.parentElement;
        parent.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        window.selectedMood = btn.querySelector('.mood-emoji')?.textContent || btn.textContent;
      }
      
      if (e.target.closest('.chip')) {
        e.target.closest('.chip').classList.toggle('selected');
      }
    });
  }

  // ── NAVIGATION ENGINE ──
  async showPage(name) {
    const user = Store.getCurrentUser();
    const isNGOPage = name.startsWith('ngo-');
    
    // 1. NGO Auth Guard & Persistance
    if (isNGOPage) {
      const isIntro = ['ngo-auth', 'ngo-welcome', 'ngo-onboarding', 'auth-selection'].includes(name);
      if (!isIntro && !this.isNGOLoggedIn) {
        name = 'ngo-auth';
      }
    } else {
      // 2. Standard User Force Redirect Logic
      if (user && name === 'home') name = 'overview';
      if (!user && name === 'overview') name = 'home';
      
      // 3. Youth Auth Guard
      if (this.protectedPages.includes(name) && !user) {
        this.renderAuth('login');
        return;
      } 
    }
    
    // 4. Onboarding Guard (Youth Only)
    if (user && !isNGOPage) {
      if (!this.currentUserProfile) this.currentUserProfile = await Store.getOnboardingStatus();
      if (!this.currentUserProfile.onboardingComplete) {
        if (!['welcome', 'onboarding-form', 'home', 'auth'].includes(name)) {
          name = 'welcome';
        }
      }
    }

    this.currentPage = name;

    // 5. UI Toggle (Body role classes)
    document.body.classList.remove('is-guest', 'is-user', 'is-ngo');
    
    // Only apply NGO sidebar layout for the actual dashboard pages
    const isNGODashboardView = isNGOPage && !['ngo-auth', 'ngo-welcome', 'ngo-onboarding'].includes(name);

    if (isNGODashboardView) {
      document.body.classList.add('is-ngo');
    } else if (user) {
      document.body.classList.add('is-user');
    } else {
      document.body.classList.add('is-guest');
    }

    // 5. Page visibility
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    
    const pageEl = document.getElementById('page-' + name);
    if (pageEl) pageEl.classList.add('active');
    
    // Update active state in sidebar
    const activeLinks = document.querySelectorAll(`[data-page="${name}"]`);
    activeLinks.forEach(link => link.classList.add('active'));
    
    window.scrollTo(0, 0);

    // 5. Context Specific logic
    if (name === 'welcome' && user) {
      document.getElementById('welcome-username').textContent = user.email ? user.email.split('@')[0] : 'User';
    }
    if (name === 'overview' && user) {
      Overview.init();
    }
    if (name === 'mood-tracker' && user) {
      Mood.init();
    }
    if (name === 'sleep-tracker' && user) {
      Sleep.init();
    }
    if (name === 'stress-tracker' && user) {
      Stress.init();
    }
    if (name === 'journal' && user) {
      Journal.init();
    }
    
    // SAFETY: Wrap Community/Mentors to prevent regression in other trackers
    if (name === 'community' && user) {
      try {
        Community.init();
        Mentors.init();
      } catch (e) {
        console.error("Community Module Error:", e);
      }
    }

    if (name === 'resources' && user) {
      Resources.init();
    }

    if (name === 'activity' && user) {
      Activity.init();
    }

    if (name === 'settings' && user) {
      Settings.init();
    }

    if (name === 'ngo-dashboard' || name === 'ngo-cases') {
      if (window.initNGODashboardChart) window.initNGODashboardChart();
      if (window.NGOHub) window.NGOHub.init();
    }

    if (name === 'ngo-volunteers' || name === 'ngo-reports') {
      if (window.NGOHubExtended) window.NGOHubExtended.init();
    }

    if (name === 'ngo-impact-map') {
      if (window.NGOMap) {
        window.NGOMap.init();
        window.NGOMap.refresh();
      }
    }

    if (name === 'ngo-directory') {
      if (window.NGODirectory) window.NGODirectory.init();
    }
    
    this.updateNav();
  }

  // ── NGO CASE MANAGEMENT ──
  handleNGOAction(id, type) {
    if (window.NGOHub) {
      window.NGOHub.handleAction(id, type);
    }
  }

  handleNGOInject() {
    if (window.NGOHub) {
      window.NGOHub.injectDemoFeed();
    }
  }

  notifyVolunteer(id) {
    if (window.NGOHubExtended) {
      window.NGOHubExtended.showToast(`WELLNESS CHECK ALERT SENT TO VOLUNTEER ID: #${id.slice(-4)}`, 'info');
    }
  }

  updateNav() {
    const user = Store.getCurrentUser();
    const userSpan = document.getElementById('nav-user-span');
    const avatar = document.getElementById('sidebar-avatar');

    if (user) {
      const name = user.email ? user.email.split('@')[0] : 'User';
      if (userSpan) userSpan.textContent = name;
      if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
    }
  }

  _updateOverviewStats() {
    const stats = Store.getStats();
    const stressEl = document.getElementById('dash-stress');
    if (stressEl) stressEl.textContent = stats.avgStress || '--';
  }

  // ── AUTHENTICATION ──
  renderAuth(mode) {
    const title = document.getElementById('auth-title');
    const toggleText = document.getElementById('toggle-auth');
    const submitBtn = document.getElementById('auth-submit');
    const confirmBox = document.getElementById('auth-confirm-box');

    if (mode === 'signup') {
      title.textContent = 'Create Account';
      toggleText.innerHTML = 'Already have an account? <u>Login</u>';
      submitBtn.textContent = 'SIGN UP →';
      if(confirmBox) confirmBox.classList.remove('hidden');
    } else {
      title.textContent = 'Login';
      toggleText.innerHTML = 'New here? <u>Create an account</u>';
      submitBtn.textContent = 'LOGIN →';
      if(confirmBox) confirmBox.classList.add('hidden');
    }
    this.showPage('auth');
  }

  async handleAuthSubmission() {
    const emailVal = document.getElementById('auth-email').value;
    const passVal = document.getElementById('auth-password').value;
    const confirmVal = document.getElementById('auth-confirm-password').value;
    const isSignup = document.getElementById('auth-title').textContent === 'Create Account';

    console.log("[DEBUG] Auth Submission Triggered", { mode: isSignup ? 'signup' : 'login', email: emailVal });

    if (!emailVal || !passVal) {
      alert('Please fill all fields');
      return;
    }

    if (isSignup && passVal !== confirmVal) {
      console.log("[DEBUG] Password Match Failure:", { pass: passVal, confirm: confirmVal });
      alert("Passwords don't match");
      return;
    }

    const result = isSignup 
      ? await Store.signup(emailVal, passVal)
      : await Store.login(emailVal, passVal);

    if (result.error) {
      console.error("[DEBUG] Auth Error:", result.error);
      alert(result.error);
    }
  }

  async handleGoogleLogin() {
    const result = await Store.loginWithGoogle();
    if (result.error) alert(result.error);
  }

  // ── ONBOARDING ──
  async handleOnboardingCompletion() {
    const data = {
      age: document.getElementById('onboard-age').value,
      gender: document.getElementById('onboard-gender').value,
      sleep: document.getElementById('onboard-sleep').value,
      employment: document.getElementById('onboard-employment').value
    };

    if (!data.age || !data.gender) {
      alert('Please fill required fields');
      return;
    }

    await Store.saveOnboarding(data);
    this.currentUserProfile = await Store.getOnboardingStatus();
    this.showPage('overview');
  }

  // ── FEATURES ──
  handleHelpRequest() {
    const category = document.getElementById('help-category').value;
    const detail = document.getElementById('help-detail').value;
    const urgency = window.selectedUrgency || 'low';
    const contact = document.getElementById('help-contact').value;

    Store.saveHelpRequest({ category, detail, urgency, contact });
    document.getElementById('help-form').classList.add('hidden');
    document.getElementById('help-success').classList.remove('hidden');
  }

  // NGO AUTHENTICATION & ONBOARDING (DEMO)
  async handleNGOSubmission() {
    const email = document.getElementById('ngo-auth-email').value;
    const pass = document.getElementById('ngo-auth-password').value;
    
    // Fixed Secure Credentials for NGO Portal
    if (email === 'staff@nyxwell.org' && pass === '2026') {
       this.isNGOLoggedIn = true;
       localStorage.setItem('ngoLogin', 'true');
       this.showPage('ngo-welcome');
    } else {
       alert("Unauthorized Access: Invalid Staff Credentials");
    }
  }

  async handleNGOOnboardingCompletion() {
    const org = document.getElementById('ngo-org-name').value;
    const role = document.getElementById('ngo-role').value;
    const region = document.getElementById('ngo-region').value;
    // Update Dashboard UI & Persist
    const orgHeader = org.toUpperCase() + " | " + region.toUpperCase();
    const roleHeader = "The Hub: " + role.toUpperCase();
    
    const orgEl = document.getElementById('ngo-staff-org');
    const greetEl = document.getElementById('ngo-staff-greeting');
    if (orgEl) orgEl.textContent = orgHeader;
    if (greetEl) greetEl.textContent = roleHeader;

    localStorage.setItem('ngoOrg', org);
    localStorage.setItem('ngoRole', role);
    localStorage.setItem('ngoRegion', region);

    this.showPage('ngo-dashboard');
  }

  // ── NGO SESSION PERSISTENCE ──
  _restoreNGOSession() {
    if (!this.isNGOLoggedIn) return;

    const org = localStorage.getItem('ngoOrg');
    const role = localStorage.getItem('ngoRole');
    const region = localStorage.getItem('ngoRegion');

    if (org && role) {
      const orgEl = document.getElementById('ngo-staff-org');
      const greetEl = document.getElementById('ngo-staff-greeting');
      if (orgEl) orgEl.textContent = org.toUpperCase() + " | " + (region ? region.toUpperCase() : "");
      if (greetEl) greetEl.textContent = "The Hub: " + role.toUpperCase();
    }

    // Force redirect to dashboard if they were on a dashboard page sub-route before refresh
    // Note: showPage handles the Auth Guard internally
  }
}

// Global instance for onclick triggers
window.nyxwell = new NyxWellApp();
