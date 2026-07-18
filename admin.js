/* ================= Admin dashboard logic ================= */
/* This file only runs on the secret admin page. Nothing here is linked
   from the public site — Firestore security rules are the real gate,
   this is just the UI. */

const loginBox = document.getElementById('loginBox');
const dashBox = document.getElementById('dashBox');
const loginForm = document.getElementById('loginForm');
const loginErr = document.getElementById('loginErr');
const logoutBtn = document.getElementById('logoutBtn');
const adminEmailLabel = document.getElementById('adminEmailLabel');

auth.onAuthStateChanged(user => {
  if (user) {
    loginBox.style.display = 'none';
    dashBox.style.display = 'block';
    adminEmailLabel.textContent = user.email;
    loadPending();
    loadHistory();
    loadAdminPackages();
    loadAdminNotices();
  } else {
    loginBox.style.display = 'flex';
    dashBox.style.display = 'none';
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginErr.style.display = 'none';
  const btn = loginForm.querySelector('button');
  btn.disabled = true;
  try {
    await auth.signInWithEmailAndPassword(loginForm.email.value.trim(), loginForm.password.value);
  } catch (err) {
    loginErr.textContent = 'Login nakaam — email ya password ghalat hai.';
    loginErr.style.display = 'block';
  }
  btn.disabled = false;
});

logoutBtn.addEventListener('click', () => auth.signOut());

/* ---------- Tabs ---------- */
document.querySelectorAll('.admin-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.panel).classList.add('active');
  });
});

function fmt(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ================= Pending bookings ================= */
async function loadPending() {
  const el = document.getElementById('pendingList');
  el.innerHTML = '<div class="empty-state"><div class="spin" style="margin:0 auto"></div></div>';
  try {
    const snap = await db.collection('bookings').where('status', '==', 'pending').orderBy('createdAt', 'desc').get();
    if (snap.empty) { el.innerHTML = '<div class="empty-state">Koi pending request nahi hai.</div>'; return; }
    el.innerHTML = '';
    snap.forEach(doc => el.appendChild(bookingCard(doc.id, doc.data(), true)));
  } catch (e) {
    el.innerHTML = `<div class="empty-state">Load nahi ho saka: ${e.message}</div>`;
  }
}

function bookingCard(id, b, actionable) {
  const card = document.createElement('div');
  card.className = 'card-row';
  card.innerHTML = `
    <div class="top">
      <h4 style="margin:0;">${b.name || 'Unnamed'}</h4>
      <span class="status-pill status-${b.status}">${b.status}</span>
    </div>
    <div class="detail-grid">
      <div><b>Phone</b>${b.phone || '—'}</div>
      <div><b>Email</b>${b.email || '—'}</div>
      <div><b>Package</b>${b.packageType || '—'}</div>
      <div><b>Travelers</b>${b.travelers || '—'}</div>
      <div><b>Submitted</b>${fmt(b.createdAt)}</div>
    </div>
    ${b.message ? `<p style="color:var(--muted);font-size:.88rem;margin:0 0 12px;">"${b.message}"</p>` : ''}
    ${actionable ? `<div class="row-actions">
      <button class="btn btn-teal btn-sm" data-act="approve">Approve</button>
      <button class="btn btn-sm" style="background:var(--maroon);color:#fff;" data-act="reject">Reject</button>
    </div>` : ''}
  `;
  if (actionable) {
    card.querySelector('[data-act="approve"]').addEventListener('click', () => setStatus(id, 'approved'));
    card.querySelector('[data-act="reject"]').addEventListener('click', () => setStatus(id, 'rejected'));
  }
  return card;
}

async function setStatus(id, status) {
  try {
    await db.collection('bookings').doc(id).update({
      status,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast(status === 'approved' ? 'Booking approve ho gayi.' : 'Booking reject ho gayi.');
    loadPending();
    loadHistory();
  } catch (e) { showToast('Error: ' + e.message); }
}

/* ================= History ================= */
async function loadHistory() {
  const el = document.getElementById('historyList');
  el.innerHTML = '<div class="empty-state"><div class="spin" style="margin:0 auto"></div></div>';
  try {
    const snap = await db.collection('bookings').where('status', 'in', ['approved', 'rejected']).orderBy('updatedAt', 'desc').limit(100).get();
    if (snap.empty) { el.innerHTML = '<div class="empty-state">Abhi tak koi history nahi hai.</div>'; return; }
    el.innerHTML = '';
    snap.forEach(doc => el.appendChild(bookingCard(doc.id, doc.data(), false)));
  } catch (e) {
    el.innerHTML = `<div class="empty-state">Load nahi ho saka: ${e.message}</div>`;
  }
}

/* ================= Packages management ================= */
const pkgForm = document.getElementById('pkgForm');
pkgForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    title: pkgForm.title.value.trim(),
    category: pkgForm.category.value,
    price: pkgForm.price.value.trim(),
    duration: pkgForm.duration.value.trim(),
    description: pkgForm.description.value.trim(),
    imageUrl: pkgForm.imageUrl.value.trim(),
    active: true,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  try {
    await db.collection('packages').add(data);
    showToast('Package add ho gaya.');
    pkgForm.reset();
    loadAdminPackages();
  } catch (e) { showToast('Error: ' + e.message); }
});

async function loadAdminPackages() {
  const el = document.getElementById('pkgAdminList');
  el.innerHTML = '<div class="empty-state"><div class="spin" style="margin:0 auto"></div></div>';
  try {
    const snap = await db.collection('packages').orderBy('createdAt', 'desc').get();
    if (snap.empty) { el.innerHTML = '<div class="empty-state">Koi package nahi hai. Neeche form se add karein.</div>'; return; }
    el.innerHTML = '';
    snap.forEach(doc => {
      const p = doc.data();
      const card = document.createElement('div');
      card.className = 'card-row';
      card.innerHTML = `
        <div class="top">
          <h4 style="margin:0;">${p.title}</h4>
          <span class="status-pill ${p.active ? 'status-approved' : 'status-rejected'}">${p.active ? 'Active' : 'Hidden'}</span>
        </div>
        <div class="detail-grid">
          <div><b>Category</b>${p.category}</div>
          <div><b>Price</b>${p.price}</div>
          <div><b>Duration</b>${p.duration || '—'}</div>
        </div>
        <div class="row-actions">
          <button class="btn btn-sm btn-teal" data-act="toggle">${p.active ? 'Hide' : 'Show'}</button>
          <button class="btn btn-sm" style="background:var(--maroon);color:#fff;" data-act="del">Delete</button>
        </div>`;
      card.querySelector('[data-act="toggle"]').addEventListener('click', async () => {
        await db.collection('packages').doc(doc.id).update({ active: !p.active });
        loadAdminPackages();
      });
      card.querySelector('[data-act="del"]').addEventListener('click', async () => {
        if (confirm('Yeh package delete karna hai?')) {
          await db.collection('packages').doc(doc.id).delete();
          loadAdminPackages();
        }
      });
      el.appendChild(card);
    });
  } catch (e) {
    el.innerHTML = `<div class="empty-state">Load nahi ho saka: ${e.message}</div>`;
  }
}

/* ================= Notice board management ================= */
const noticeForm = document.getElementById('noticeForm');
noticeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    title: noticeForm.title.value.trim(),
    message: noticeForm.message.value.trim(),
    imageUrl: noticeForm.imageUrl.value.trim(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  try {
    await db.collection('notices').add(data);
    showToast('Notice post ho gaya.');
    noticeForm.reset();
    loadAdminNotices();
  } catch (e) { showToast('Error: ' + e.message); }
});

async function loadAdminNotices() {
  const el = document.getElementById('noticeAdminList');
  el.innerHTML = '<div class="empty-state"><div class="spin" style="margin:0 auto"></div></div>';
  try {
    const snap = await db.collection('notices').orderBy('createdAt', 'desc').get();
    if (snap.empty) { el.innerHTML = '<div class="empty-state">Koi notice nahi hai.</div>'; return; }
    el.innerHTML = '';
    snap.forEach(doc => {
      const n = doc.data();
      const card = document.createElement('div');
      card.className = 'card-row';
      card.innerHTML = `
        <div class="top"><h4 style="margin:0;">${n.title}</h4><span style="font-size:.78rem;color:var(--muted);">${fmt(n.createdAt)}</span></div>
        <p style="color:var(--muted);font-size:.9rem;">${n.message}</p>
        <div class="row-actions"><button class="btn btn-sm" style="background:var(--maroon);color:#fff;" data-act="del">Delete</button></div>`;
      card.querySelector('[data-act="del"]').addEventListener('click', async () => {
        if (confirm('Yeh notice delete karna hai?')) {
          await db.collection('notices').doc(doc.id).delete();
          loadAdminNotices();
        }
      });
      el.appendChild(card);
    });
  } catch (e) {
    el.innerHTML = `<div class="empty-state">Load nahi ho saka: ${e.message}</div>`;
  }
}
