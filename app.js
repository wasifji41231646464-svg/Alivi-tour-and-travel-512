/* ================= Shared site behaviour (Supabase backend) ================= */

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
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ================= Notice board (public read) ================= */
async function loadNotices(targetId) {
  const el = document.getElementById(targetId);
  if (!el || typeof db === 'undefined') return;
  try {
    const { data, error } = await db.from('notices').select('*').order('created_at', { ascending: false }).limit(6);
    if (error) throw error;
    if (!data || data.length === 0) {
      el.innerHTML = '<div class="notice-empty">Filhaal koi notice nahi hai — Currently no announcements.</div>';
      return;
    }
    el.innerHTML = '';
    data.forEach(n => {
      const item = document.createElement('div');
      item.className = 'notice';
      item.innerHTML = `
        ${n.image_url ? `<img src="${n.image_url}" alt="">` : ''}
        <div class="txt">
          <time>${timeAgo(n.created_at)}</time>
          <h4>${n.title || ''}</h4>
          <p>${n.message || ''}</p>
        </div>`;
      el.appendChild(item);
    });
  } catch (e) {
    el.innerHTML = '<div class="notice-empty">Notice board load nahi ho saka. Supabase config check karein.</div>';
    console.error(e);
  }
}

/* ================= Packages (public read) ================= */
const FALLBACK_PACKAGES = [
  { title: 'Hajj Package', category: 'hajj', price: 'Rabta karein / Contact us', duration: '30-40 Din / Days',
    desc: 'Mukammal Hajj package, tajurbekar guides ke sath.',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Green_dome,_Masjid_e_Nabawi,_Medina,_KSA.jpg' },
  { title: 'Umrah — Economy', category: 'umrah', price: 'PKR 1,80,000', duration: '10 Din / 10 Days',
    desc: 'Sharing accommodation, direct flights, visa aur ziyarat included.',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Kaaba_111.jpg' },
  { title: 'Umrah — VIP Deluxe', category: 'umrah', price: 'PKR 3,50,000', duration: '14 Din / 14 Days',
    desc: '5-star hotels, Haram ke qareeb rehaish, private transport.',
    img: 'https://commons.wikimedia.org/wiki/Special:FilePath/The_Ka%27ba,_Great_Mosque_of_Mecca,_Saudi_Arabia_(4).jpg' },
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
  const label = { hajj: 'Hajj', umrah: 'Umrah', iran: 'Ziyarat • Iran', iraq: 'Ziyarat • Iraq' }[p.category] || p.category;
  return `
    <div class="pkg-card" data-cat="${p.category}">
      <div class="pkg-img">
        <img src="${p.img || p.image_url || ''}" alt="${p.title}">
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
      const { data, error } = await db.from('packages').select('*').eq('active', true);
      if (error) throw error;
      if (data && data.length > 0) list = data;
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
    const record = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      package_type: form.packageType.value,
      travelers: parseInt(form.travelers.value) || 1,
      message: form.message.value.trim(),
      status: 'pending'
    };

    if (!record.name || !record.phone) {
      msgBox.className = 'form-msg err';
      msgBox.textContent = 'Naam aur phone number zaroori hai — Name and phone are required.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Bhej rahe hain...';

    try {
      if (typeof db === 'undefined') throw new Error('no-db');
      const { error } = await db.from('bookings').insert([record]);
      if (error) throw error;
      msgBox.className = 'form-msg ok';
      msgBox.textContent = 'Shukriya! Aapki request mil gayi hai. Admin approve karne ke baad hum aap se rabta karenge. — Thank you, we will contact you soon.';
      form.reset();
    } catch (err) {
      console.error(err);
      msgBox.className = 'form-msg err';
      msgBox.textContent = 'Form abhi save nahi ho saka. Supabase config set hui hai ya nahi check karein, ya WhatsApp/call kar dein.';
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
