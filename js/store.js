import { auth, googleProvider, db } from './firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { 
  doc, 
  getDoc, 
  setDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/**
 * MindBridgeStore handles data persistence using Firebase Firestore
 * and Authentication.
 */
class MindBridgeStore {
  constructor() {}

  // ── AUTHENTICATION ──
  async signup(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("[DEBUG] Signup Database Error:", error);
      return { error: error.message };
    }
  }

  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { error: error.message };
    }
  }

  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    } catch (error) {
      return { error: error.message };
    }
  }

  async logout() {
    await signOut(auth);
  }

  onAuth(callback) {
    onAuthStateChanged(auth, callback);
  }

  getCurrentUser() {
    return auth.currentUser;
  }

  // ── USER PROFILE & ONBOARDING ──
  async saveOnboarding(data) {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        onboardingComplete: true,
        onboardingData: data,
        email: user.email,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving onboarding:", error);
    }
  }

  async getOnboardingStatus() {
    const user = auth.currentUser;
    if (!user) return { onboardingComplete: false };
    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      return docSnap.exists() ? docSnap.data() : { onboardingComplete: false };
    } catch (error) {
      console.error("Error fetching onboarding:", error);
      return { onboardingComplete: false };
    }
  }

  // ── FIRESTORE DATA COLLECTIONS (REAL-TIME) ──

  async saveEntry(collectionName, data) {
    const user = auth.currentUser;
    if (!user) return null;
    try {
      const colRef = collection(db, 'users', user.uid, collectionName);
      await addDoc(colRef, {
        ...data,
        timestamp: serverTimestamp()
      });
      return true;
    } catch (e) {
      console.error(`Error saving ${collectionName}:`, e);
      return null;
    }
  }

  /**
   * Listen to all user metrics in real-time with state accumulation.
   * Prevents "race conditions" where one collection's initial empty state
   * overwrites another's data in the UI.
   */
  subscribeToOverviewData(callback) {
    const user = auth.currentUser;
    if (!user) return () => {};

    // Internal state to accumulate data across 4 collection listeners
    const state = { 
      moodData: [], 
      sleepData: [], 
      stressData: [], 
      journalEntries: [],
      journalData: [] // For compatibility with Journal.js
    };
    
    const unsubscribes = [];
    const collections = ['mood_entries', 'sleep_entries', 'stress_entries', 'journal_entries'];
    let broadcastTimeout = null;

    const debouncedBroadcast = () => {
      if (broadcastTimeout) clearTimeout(broadcastTimeout);
      broadcastTimeout = setTimeout(() => {
        callback({...state});
      }, 50); // Small buffer to catch multiple simultaneous snapshots
    };

    collections.forEach(colName => {
      const q = query(
        collection(db, 'users', user.uid, colName),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Use estimate or existing timestamp to avoid flickering on new writes
          timestamp: doc.data().timestamp?.toDate()?.toISOString() || new Date().toISOString()
        }));

        if (colName === 'mood_entries') state.moodData = data;
        if (colName === 'sleep_entries') state.sleepData = data;
        if (colName === 'stress_entries') state.stressData = data;
        if (colName === 'journal_entries') {
          state.journalEntries = data;
          state.journalData = data;
        }

        debouncedBroadcast();
      }, (err) => console.error(`Snapshot error for ${colName}:`, err));

      unsubscribes.push(unsub);
    });

    return () => {
      if (broadcastTimeout) clearTimeout(broadcastTimeout);
      unsubscribes.forEach(u => u());
    };
  }

  // Specialized helpers
  async saveMood(score) { return this.saveEntry('mood_entries', { score: parseFloat(score) }); }
  async saveSleep(hours) { return this.saveEntry('sleep_entries', { hours: parseFloat(hours) }); }
  async saveStress(level) { return this.saveEntry('stress_entries', { level: parseFloat(level) }); }
  async saveJournal(title, content) { return this.saveEntry('journal_entries', { title, content }); }
  
  async saveHelpRequest(data) {
    try {
      await addDoc(collection(db, 'help_requests'), {
        uid: auth.currentUser?.uid || 'anonymous',
        ...data,
        status: 'pending',
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("Error saving help request:", e);
    }
  }

  // ── NGO CASE MANAGEMENT ──
  onCaseQueue(callback) {
    const q = query(
      collection(db, 'help_requests'),
      where('status', '==', 'pending'),
      limit(20)
    );
    return onSnapshot(q, (snapshot) => {
      const cases = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Sort manually to bypass Missing Index requirement
      cases.sort((a, b) => {
        const tA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(0);
        const tB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(0);
        return tB - tA;
      });

      callback(cases);
    }, (err) => console.error("Case Queue Error:", err));
  }

  async updateCaseStatus(id, status, staffInfo = null) {
    try {
      const caseRef = doc(db, 'help_requests', id);
      await updateDoc(caseRef, {
        status,
        handledBy: staffInfo,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (e) {
      console.error("Update Case Error:", e);
      return { error: e.message };
    }
  }
  
  // ── USER SETTINGS ──
  async saveSettings(data) {
    const user = auth.currentUser;
    if (!user) return { error: 'Not logged in' };
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { settings: data, settingsUpdatedAt: serverTimestamp() }, { merge: true });
      return { success: true };
    } catch (e) {
      console.error('Save Settings Error:', e);
      return { error: e.message };
    }
  }

  async getSettings() {
    const user = auth.currentUser;
    if (!user) return null;
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      return snap.exists() ? (snap.data().settings || null) : null;
    } catch (e) {
      console.error('Get Settings Error:', e);
      return null;
    }
  }

  // ── NGO DIRECTORY MANAGEMENT ──
  onNGOs(callback) {
    const q = query(
      collection(db, 'ngos'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const ngos = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      callback(ngos);
    }, (err) => console.error("NGO Directory Error:", err));
  }

  async saveNGO(data) {
    try {
      await addDoc(collection(db, 'ngos'), {
        ...data,
        createdAt: serverTimestamp(),
        isActive: true
      });
      return { success: true };
    } catch (e) {
      console.error("Save NGO Error:", e);
      return { error: e.message };
    }
  }

  async updateNGO(id, data) {
    try {
      const ngoRef = doc(db, 'ngos', id);
      await updateDoc(ngoRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (e) {
      console.error("Update NGO Error:", e);
      return { error: e.message };
    }
  }

  async deleteNGO(id) {
    try {
      const ngoRef = doc(db, 'ngos', id);
      await deleteDoc(ngoRef);
      return { success: true };
    } catch (e) {
      console.error("Delete NGO Error:", e);
      return { error: e.message };
    }
  }

  // Fetching for Overview (Legacy/One-time if needed)
  async getOverviewData() {
    // This is now handled by subscription, but keeping for compatibility
    return null;
  }
}

const Store = new MindBridgeStore();
export default Store;
