# Alvi Tours & Travels — Website Setup Guide

Yeh guide aapko step-by-step batayegi ke website ko live kaise karna hai.
Poora process teen hisson mein hai:

1. Firebase set up karna (free database, jahan bookings/packages/notices save hongi)
2. GitHub Pages par website upload karna
3. Google par register karwana

---

## HISSA 1: Firebase Setup (10 minute)

Firebase Google ka free service hai. Isse aapki website "zinda" ho jaati hai —
customer jahan se bhi form fill kare, aapko turant dikhega.

### Step 1.1 — Project banayein
1. [console.firebase.google.com](https://console.firebase.google.com) par jaayein, Gmail se login karein
2. **"Add project"** dabayein
3. Naam dein: `alvi-tours-travels` (ya jo chahein)
4. Google Analytics ka option **off** kar dein (zaroorat nahi), phir "Create project"

### Step 1.2 — Web app add karein
1. Project dashboard par **`</>`** (web) icon par click karein
2. App ka nickname dein: `alvi-website`
3. "Firebase Hosting" ka checkbox **skip** kar dein (hum GitHub Pages use kar rahe hain)
4. Register karne ke baad, aapko ek code milega jaisa neeche hai — bas `firebaseConfig` wala hissa copy karein:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "alvi-tours-travels.firebaseapp.com",
  projectId: "alvi-tours-travels",
  storageBucket: "alvi-tours-travels.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

5. Website folder mein `firebase-config.js` file kholein, aur `PASTE_YOUR_...` wali saari values apne asal values se badal dein.

### Step 1.3 — Firestore Database on karein
1. Left menu mein **Build > Firestore Database** par jaayein
2. **"Create database"** dabayein
3. Location: `asia-south1` (Mumbai, Pakistan ke qareeb) ya jo bhi default aaye, select karein
4. **"Start in test mode"** select karein abhi ke liye (hum baad mein security rules lagayenge)

### Step 1.4 — Security Rules lagayein (zaroori — warna koi bhi data delete kar sakta hai)
Firestore Database > **Rules** tab mein jaayein, aur yeh paste kar dein:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Booking forms: koi bhi banaa sakta hai (customer), lekin sirf admin dekh/badal saka
    match /bookings/{id} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    // Packages: sab dekh sakte hain, sirf admin add/edit/delete kar sakta hai
    match /packages/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Notices: sab dekh sakte hain, sirf admin post/delete kar sakta hai
    match /notices/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**"Publish"** dabayein.

### Step 1.5 — Admin login banayein (yeh secret rahega)
1. Left menu mein **Build > Authentication** par jaayein
2. **"Get started"** dabayein
3. **Email/Password** provider ko enable karein
4. **Users** tab mein **"Add user"** dabayein
5. Apna email aur ek mazboot password dalein — **bas yehi aapka admin login hoga**

Koi bhi is email/password ke bagair admin panel access nahi kar sakta — aur website
par kahin bhi "Sign up" ya "Login" ka button nahi hai, is liye normal visitors ko
pata bhi nahi chalega ke admin panel exist karta hai.

---

## HISSA 2: GitHub Pages Par Upload Karna

1. [github.com](https://github.com) par account banayein (agar nahi hai)
2. Naya repository banayein, naam bilkul yeh rakhein: **`yourusername.github.io`**
   (apna GitHub username daal kar)
3. Repository public rakhein
4. Website ki saari files (`index.html`, `packages.html`, `contact.html`,
   `admin-alvi8420.html`, `style.css`, `app.js`, `admin.js`, `firebase-config.js`)
   upload kar dein (drag-and-drop se ya "Add file > Upload files")
5. Settings > Pages > Source mein "main" branch select karke Save karein
6. 1-2 minute mein site live: `https://yourusername.github.io`

### Admin panel ka URL
Aapka admin panel is URL par hoga:
```
https://yourusername.github.io/admin-alvi8420.html
```
Ise sirf apne paas mahfooz rakhein. Agar chahein to extra security ke liye
`admin-alvi8420.html` file ka naam badal kar kuch aur mushkil naam rakh dein
(jaise `admin-xk92pq.html`) — jitna mushkil naam utna mushkil guess karna.

---

## HISSA 3: Google Par Register / Index Karwana

1. [search.google.com/search-console](https://search.google.com/search-console) par jaayein
2. **"Add Property"** > apna URL `https://yourusername.github.io` dalein
3. Verification: "HTML tag" method choose karein, jo tag milega wo `index.html`,
   `packages.html`, `contact.html` — teenon ke `<head>` mein paste kar dein
4. Verify dabayein
5. Search bar mein apna URL paste karke **"Request Indexing"** dabayein
6. 1-2 din mein `site:yourusername.github.io` search karke check kar sakte hain

---

## Baad Mein Kya Badal Sakte Hain

- **Apni photos:** `index.html` mein jahan bhi `<img src="...">` hai, wahan apni
  photo ka link daal dein, ya GitHub repo mein photo upload karke uska relative
  path (jaise `images/kaaba.jpg`) daal dein.
- **Packages:** Admin panel se "Manage Packages" tab mein naye package add/hide/delete
  kar sakte hain — website automatically update ho jaayegi.
- **Notice Board:** Admin panel > "Notice Board" tab se koi bhi notice post karein,
  wo turant home page par sab ko dikhega.
- **Ayat/Hadees:** `index.html` mein "RELIGIOUS REFERENCES" wala section dhoondh
  kar text badal sakte hain — publish se pehle Mufti sahab se check zaroor karwa lein.

---

## Koi Masla Ho To

- Agar form submit nahi ho raha: `firebase-config.js` mein values sahi hain ya nahi check karein
- Agar admin login nahi ho raha: Firebase Console > Authentication > Users mein email/password sahi hai ya nahi dekhein
- Agar packages/notices nahi dikh rahe: Firestore Rules "Publish" hui hain ya nahi confirm karein
