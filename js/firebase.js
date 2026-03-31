import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA6DI5PXMGQxFpvBKVpjJU4bim_RL8Z8A8",
    authDomain: "safespaceai-e1bcd.firebaseapp.com",
    projectId: "safespaceai-e1bcd",
    storageBucket: "safespaceai-e1bcd.firebasestorage.app",
    messagingSenderId: "144254507657",
    appId: "1:144254507657:web:27b6dc94610eeebba08458",
    measurementId: "G-ET53EP86WD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const analytics = getAnalytics(app);

export { app, auth, db, googleProvider, analytics };
