/* ================= Shared site behaviour ================= */

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.navtoggle');
  const links = document.querySelector('.navlinks');
  if (btn && links) {
    btn.addEventListener('click', () => links.classList.toggle('open'));
  }
});

// Small helper toast (used on contact page too)
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ================= Notice board (public read) ================= */
async function loadNotices(targetId) {
  const el = document.getElementById(targetId);
  if (!el || typeof db === 'undefined') return;
  try {
    const snap = await db.collection('notices').orderBy('createdAt', 'desc').limit(6).get();
    if (snap.empty) {
      el.innerHTML = '<div class="notice-empty">Filhaal koi notice nahi hai — Currently no announcements.</div>';
      return;
    }
    el.innerHTML = '';
    snap.forEach(doc => {
      const n = doc.data();
      const item = document.createElement('div');
      item.className = 'notice';
      item.innerHTML = `
        ${n.imageUrl ? `<img src="${n.imageUrl}" alt="">` : ''}
        <div class="txt">
          <time>${timeAgo(n.createdAt)}</time>
          <h4>${n.title || ''}</h4>
          <p>${n.message || ''}</p>
        </div>`;
      el.appendChild(item);
    });
  } catch (e) {
    el.innerHTML = '<div class="notice-empty">Notice board load nahi ho saka. Firebase config check karein.</div>';
    console.error(e);
  }
}

/* ================= Packages (public read) ================= */
const FALLBACK_PACKAGES = [
  { title: 'Umrah — Economy', category: 'umrah', price: 'PKR 1,80,000', duration: '10 Din / 10 Days',
    desc: 'Sharing accommodation, direct flights, visa aur ziyarat included.',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Kaaba_111.jpg' },
  { title: 'Umrah — VIP Deluxe', category: 'umrah', price: 'PKR 3,50,000', duration: '14 Din / 14 Days',
    desc: '5-star hotels, Haram ke qareeb rehaish, private transport.',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/The_Ka%27ba,_Great_Mosque_of_Mecca,_Saudi_Arabia_(4).jpg' },
  { title: 'Hajj Package', category: 'hajj', price: 'Rabta karein / Contact us', duration: '30-40 Din / Days',
    desc: 'Mukammal Hajj package, tajurbekar guides ke sath.',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Green_dome,_Masjid_e_Nabawi,_Medina,_KSA.jpg' },
  { title: 'Ziyarat-e-Iraq', category: 'iraq', price: 'PKR 2,20,000', duration: '8 Din / 8 Days',
    desc: 'Karbala, Najaf, Kazmain aur Samarra ki ziyarat.',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/The_shrine_of_Imam_Hussain_in_Karbala.jpg' },
  { title: 'Ziyarat-e-Iran', category: 'iran', price: 'PKR 1,95,000', duration: '7 Din / 7 Days',
    desc: 'Mashhad — Imam Reza (a.s) ki ziyarat, Qom aur Shiraz.',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Golden_Dome_of_Imam_Reza_shrine_by_Omidyadegar_at_night.jpg' },
  { title: 'Combined Iran + Iraq Ziyarat', category: 'iran', price: 'PKR 3,10,000', duration: '14 Din / 14 Days',
    desc: 'Dono mulkon ki muqaddas ziyargahon ka mukammal safar.',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Shrine_of_Imam_Ali_Najaf_August_2023.jpg' },
];

function pkgCardHTML(p) {
  const label = { umrah: 'Umrah', hajj: 'Hajj', iran: 'Ziyarat • Iran', iraq: 'Ziyarat • Iraq' }[p.category] || p.category;
  return `
    <div class="pkg-card" data-cat="${p.category}">
      <div class="pkg-img">
        <img src="${p.img || p.imageUrl || ''}" alt="${p.title}">
        <span class="pkg-badge">${label}</span>
      </div>
      <div class="pkg-body">
        <h3>${p.title}</h3>
        <p class="desc">${p.desc || p.description || ''}</p>
        <div class="pkg-meta">
          <div class="pkg-price">${p.price}<small>fi kas / per person</small></div>
          <div class="pkg-dur">${p.duration || ''}</div>
        </div>
        <a href="contact.html" class="btn btn-teal btn-block">Book Now — Booking Karein</a>
      </div>
    </div>`;
}

async function loadPackages(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  let list = FALLBACK_PACKAGES;
  if (typeof db !== 'undefined') {
    try {
      const snap = await db.collection('packages').where('active', '==', true).get();
      if (!snap.empty) {
        list = [];
        snap.forEach(doc => list.push(doc.data()));
      }
    } catch (e) { console.warn('Using fallback packages —', e.message); }
  }
  el.innerHTML = list.map(pkgCardHTML).join('');
  el.dataset.loaded = '1';

  // filter tabs
  document.querySelectorAll('.pkg-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.pkg-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;
      document.querySelectorAll('.pkg-card').forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.cat === cat) ? '' : 'none';
      });
    });
  });
}

/* ================= Booking form ================= */
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;
  const msgBox = document.getElementById('formMsg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const data = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      packageType: form.packageType.value,
      travelers: form.travelers.value,
      message: form.message.value.trim(),
      status: 'pending',
      createdAt: (typeof firebase !== 'undefined') ? firebase.firestore.FieldValue.serverTimestamp() : new Date()
    };

    if (!data.name || !data.phone) {
      msgBox.className = 'form-msg err';
      msgBox.textContent = 'Naam aur phone number zaroori hai — Name and phone are required.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Bhej rahe hain...';

    try {
      if (typeof db === 'undefined') throw new Error('no-db');
      await db.collection('bookings').add(data);
      msgBox.className = 'form-msg ok';
      msgBox.textContent = 'Shukriya! Aapki request mil gayi hai. Admin approve karne ke baad hum aap se rabta karenge. — Thank you, we will contact you soon.';
      form.reset();
    } catch (err) {
      console.error(err);
      msgBox.className = 'form-msg err';
      msgBox.textContent = 'Form abhi save nahi ho saka. Firebase config set hui hai ya nahi check karein, ya WhatsApp/call kar dein.';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit Request';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadNotices('noticeList');
  loadPackages('pkgGrid');
  initBookingForm();
});
