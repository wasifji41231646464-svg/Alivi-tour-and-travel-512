/* ================= Admin dashboard logic (Supabase backend) ================= */
/* This file only runs on the secret admin page. Nothing here is linked
   from the public site — Postgres Row Level Security rules are the real
   gate, this is just the UI. */

const loginBox = document.getElementById('loginBox');
const dashBox = document.getElementById('dashBox');
const loginForm = document.getElementById('loginForm');
const loginErr = document.getElementById('loginErr');
const logoutBtn = document.getElementById('logoutBtn');
const adminEmailLabel = document.getElementById('adminEmailLabel');

function showDash(user) {
  loginBox.style.display = 'none';
  dashBox.style.display = 'block';
  adminEmailLabel.textContent = user.email;
  loadPending();
  loadHistory();
  loadAdminPackages();
  loadAdminNotices();
}
function showLogin() {
  loginBox.style.display = 'flex';
  dashBox.style.display = 'none';
}

// Check session on load
db.auth.getSession().then(({ data }) => {
  if (data.session) showDash(data.session.user); else showLogin();
});

// React to login/logout events
auth.onAuthStateChange((event, session) => {
  if (session) showDash(session.user); else showLogin();
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginErr.style.display = 'none';
  const btn = loginForm.querySelector('button');
  btn.disabled = true;
  const { error } = await auth.signInWithPassword({
    email: loginForm.email.value.trim(),
    password: loginForm.password.value
  });
  if (error) {
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
  const d = new Date(ts);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ================= Pending bookings ================= */
async function loadPending() {
  const el = document.getElementById('pendingList');
  el.innerHTML = '<div class="empty-state"><div class="spin" style="margin:0 auto"></div></div>';
  const { data, error } = await db.from('bookings').select('*').eq('status', 'pending').order('created_at', { ascending: false });
  if (error) { el.innerHTML = `<div class="empty-state">Load nahi ho saka: ${error.message}</div>`; return; }
  if (!data || data.length === 0) { el.innerHTML = '<div class="empty-state">Koi pending request nahi hai.</div>'; return; }
  el.innerHTML = '';
  data.forEach(b => el.appendChild(bookingCard(b, true)));
}

function bookingCard(b, actionable) {
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
      <div><b>Package</b>${b.package_type || '—'}</div>
      <div><b>Travelers</b>${b.travelers || '—'}</div>
      <div><b>Submitted</b>${fmt(b.created_at)}</div>
    </div>
    ${b.message ? `<p style="color:var(--muted);font-size:.88rem;margin:0 0 12px;">"${b.message}"</p>` : ''}
    ${actionable ? `<div class="row-actions">
      <button class="btn btn-teal btn-sm" data-act="approve">Approve</button>
      <button class="btn btn-sm" style="background:var(--maroon);color:#fff;" data-act="reject">Reject</button>
    </div>` : ''}
  `;
  if (actionable) {
    card.querySelector('[data-act="approve"]').addEventListener('click', () => setStatus(b.id, 'approved'));
    card.querySelector('[data-act="reject"]').addEventListener('click', () => setStatus(b.id, 'rejected'));
  }
  return card;
}

async function setStatus(id, status) {
  const { error } = await db.from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { showToast('Error: ' + error.message); return; }
  showToast(status === 'approved' ? 'Booking approve ho gayi.' : 'Booking reject ho gayi.');
  loadPending();
  loadHistory();
}

/* ================= History (grouped by package) ================= */
const PKG_LABELS = { hajj: 'Hajj', umrah: 'Umrah', iraq: 'Ziyarat — Iraq', iran: 'Ziyarat — Iran' };

async function loadHistory() {
  const el = document.getElementById('historyList');
  el.innerHTML = '<div class="empty-state"><div class="spin" style="margin:0 auto"></div></div>';
  const { data, error } = await db.from('bookings').select('*').in('status', ['approved', 'rejected']).order('updated_at', { ascending: false });
  if (error) { el.innerHTML = `<div class="empty-state">Load nahi ho saka: ${error.message}</div>`; return; }
  if (!data || data.length === 0) { el.innerHTML = '<div class="empty-state">Abhi tak koi history nahi hai.</div>'; return; }

  el.innerHTML = '';

  // Approved bookings — grouped by package
  const approved = data.filter(b => b.status === 'approved');
  const rejected = data.filter(b => b.status === 'rejected');

  if (approved.length > 0) {
    const groups = {};
    approved.forEach(b => {
      const key = b.package_type || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });

    Object.keys(groups).sort().forEach(key => {
      const label = PKG_LABELS[key] || key;
      const section = document.createElement('div');
      section.style.marginBottom = '30px';
      section.innerHTML = `<h4 style="border-bottom:2px solid var(--gold);padding-bottom:8px;margin-bottom:14px;">${label} <span style="color:var(--muted);font-weight:400;font-size:.85rem;">(${groups[key].length} musafir)</span></h4>`;
      const list = document.createElement('div');
      groups[key].forEach(b => list.appendChild(approvedCard(b)));
      section.appendChild(list);
      el.appendChild(section);
    });
  }

  // Rejected bookings — plain list at the bottom
  if (rejected.length > 0) {
    const section = document.createElement('div');
    section.innerHTML = `<h4 style="border-bottom:2px solid var(--maroon);padding-bottom:8px;margin-bottom:14px;">Rejected <span style="color:var(--muted);font-weight:400;font-size:.85rem;">(${rejected.length})</span></h4>`;
    const list = document.createElement('div');
    rejected.forEach(b => list.appendChild(bookingCard(b, false)));
    section.appendChild(list);
    el.appendChild(section);
  }
}

function approvedCard(b) {
  const card = document.createElement('div');
  card.className = 'card-row';
  card.innerHTML = `
    <div class="top">
      <h4 style="margin:0;">${b.name || 'Unnamed'}</h4>
      <span class="status-pill status-approved">approved</span>
    </div>
    <div class="detail-grid">
      <div><b>Phone</b>${b.phone || '—'}</div>
      <div><b>Email</b>${b.email || '—'}</div>
      <div><b>Travelers</b>${b.travelers || '—'}</div>
      <div><b>Approved</b>${fmt(b.updated_at)}</div>
    </div>
    ${b.message ? `<p style="color:var(--muted);font-size:.88rem;margin:0 0 10px;">"${b.message}"</p>` : ''}
    <div class="field" style="margin-bottom:8px;">
      <label>Extra Details <span style="font-weight:400;color:var(--muted);">— CNIC, passport, payment status, koi bhi note</span></label>
      <textarea rows="2" data-details-for="${b.id}" placeholder="Jaise: CNIC 35202-xxxxxxx-x, Advance payment PKR 50,000 mil chuki hai...">${b.extra_details || ''}</textarea>
    </div>
    <button class="btn btn-teal btn-sm" data-act="save-details">Save Details</button>
  `;
  card.querySelector('[data-act="save-details"]').addEventListener('click', async () => {
    const val = card.querySelector(`[data-details-for="${b.id}"]`).value;
    const { error } = await db.from('bookings').update({ extra_details: val }).eq('id', b.id);
    showToast(error ? 'Error: ' + error.message : 'Details save ho gayi.');
  });
  return card;
}

/* ================= Packages management ================= */
const pkgForm = document.getElementById('pkgForm');
pkgForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const record = {
    title: pkgForm.title.value.trim(),
    category: pkgForm.category.value,
    price: pkgForm.price.value.trim(),
    duration: pkgForm.duration.value.trim(),
    description: pkgForm.description.value.trim(),
    image_url: pkgForm.imageUrl.value.trim(),
    active: true
  };
  const { error } = await db.from('packages').insert([record]);
  if (error) { showToast('Error: ' + error.message); return; }
  showToast('Package add ho gaya.');
  pkgForm.reset();
  loadAdminPackages();
});

async function loadAdminPackages() {
  const el = document.getElementById('pkgAdminList');
  el.innerHTML = '<div class="empty-state"><div class="spin" style="margin:0 auto"></div></div>';
  const { data, error } = await db.from('packages').select('*').order('created_at', { ascending: false });
  if (error) { el.innerHTML = `<div class="empty-state">Load nahi ho saka: ${error.message}</div>`; return; }
  if (!data || data.length === 0) { el.innerHTML = '<div class="empty-state">Koi package nahi hai. Neeche form se add karein.</div>'; return; }
  el.innerHTML = '';
  data.forEach(p => {
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
      await db.from('packages').update({ active: !p.active }).eq('id', p.id);
      loadAdminPackages();
    });
    card.querySelector('[data-act="del"]').addEventListener('click', async () => {
      if (confirm('Yeh package delete karna hai?')) {
        await db.from('packages').delete().eq('id', p.id);
        loadAdminPackages();
      }
    });
    el.appendChild(card);
  });
}

/* ================= Notice board management ================= */
const noticeForm = document.getElementById('noticeForm');
noticeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const record = {
    title: noticeForm.title.value.trim(),
    message: noticeForm.message.value.trim(),
    image_url: noticeForm.imageUrl.value.trim()
  };
  const { error } = await db.from('notices').insert([record]);
  if (error) { showToast('Error: ' + error.message); return; }
  showToast('Notice post ho gaya.');
  noticeForm.reset();
  loadAdminNotices();
});

async function loadAdminNotices() {
  const el = document.getElementById('noticeAdminList');
  el.innerHTML = '<div class="empty-state"><div class="spin" style="margin:0 auto"></div></div>';
  const { data, error } = await db.from('notices').select('*').order('created_at', { ascending: false });
  if (error) { el.innerHTML = `<div class="empty-state">Load nahi ho saka: ${error.message}</div>`; return; }
  if (!data || data.length === 0) { el.innerHTML = '<div class="empty-state">Koi notice nahi hai.</div>'; return; }
  el.innerHTML = '';
  data.forEach(n => {
    const card = document.createElement('div');
    card.className = 'card-row';
    card.innerHTML = `
      <div class="top"><h4 style="margin:0;">${n.title}</h4><span style="font-size:.78rem;color:var(--muted);">${fmt(n.created_at)}</span></div>
      <p style="color:var(--muted);font-size:.9rem;">${n.message}</p>
      <div class="row-actions"><button class="btn btn-sm" style="background:var(--maroon);color:#fff;" data-act="del">Delete</button></div>`;
    card.querySelector('[data-act="del"]').addEventListener('click', async () => {
      if (confirm('Yeh notice delete karna hai?')) {
        await db.from('notices').delete().eq('id', n.id);
        loadAdminNotices();
      }
    });
    el.appendChild(card);
  });
}
