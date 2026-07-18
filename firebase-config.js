/* =========================================================================
   FIREBASE CONFIG — ISE FILE KO BADALNA HAI
   -------------------------------------------------------------------------
   1. https://console.firebase.google.com par jaakar FREE project banayein
   2. Project Settings > General > "Your apps" > Web app (</>) add karein
   3. Wahan se milne wala config object neeche paste kar dein
   4. SETUP-GUIDE.md file mein pura tareeqa step-by-step likha hai
   ========================================================================= */

const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

// Initialize (compat SDK — loaded via <script> tags in each HTML page)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
