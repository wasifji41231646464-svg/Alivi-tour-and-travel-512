# Alvi Tours & Travels — Website Setup Guide (Supabase Backend)

Yeh guide aapko step-by-step batayegi ke website ko live kaise karna hai.
Poora process teen hisson mein hai:

1. Supabase set up karna (free database — **koi card nahi chahiye**)
2. GitHub Pages par website upload karna
3. Google par register karwana

---

## HISSA 1: Supabase Setup (15 minute)

Supabase Firebase jaisa hi free backend hai, lekin **bina credit card ke** free
tier deta hai. Isse aapki website "zinda" ho jaati hai — customer jahan se bhi
form fill kare, aapko turant dikhega.

### Step 1.1 — Account aur project banayein
1. [supabase.com](https://supabase.com) par jaayein, **"Start your project"** dabayein
2. GitHub ya Google se login karein (free, card nahi maangega)
3. **"New project"** dabayein
4. Naam dein: `alvi-tours-travels`
5. Database password khud generate ya set kar lein (kahin likh kar rakh lein, safe jagah)
6. Region: **Southeast Asia (Singapore)** ya jo bhi Pakistan ke qareeb ho, select karein
7. **"Create new project"** dabayein — 1-2 minute wait karein jab tak project ready ho

### Step 1.2 — Tables banayein (Database Schema)
1. Left menu mein **SQL Editor** par jaayein
2. **"New query"** dabayein
3. Yeh poora code paste karke **"Run"** dabayein:

```sql
-- Bookings table
create table bookings (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  email text,
  package_type text,
  travelers int,
  message text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz
);

-- Packages table
create table packages (
  id uuid primary key default gen_random_uuid(),
  title text,
  category text,
  price text,
  duration text,
  description text,
  image_url text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Notices table
create table notices (
  id uuid primary key default gen_random_uuid(),
  title text,
  message text,
  image_url text,
  created_at timestamptz default now()
);

-- Security ON karna
alter table bookings enable row level security;
alter table packages enable row level security;
alter table notices enable row level security;

-- Bookings: koi bhi (customer) form submit kar sakta hai, sirf logged-in
-- admin dekh/badal/delete kar sakta hai
create policy "public insert bookings" on bookings for insert to anon with check (true);
create policy "auth read bookings" on bookings for select to authenticated using (true);
create policy "auth update bookings" on bookings for update to authenticated using (true);
create policy "auth delete bookings" on bookings for delete to authenticated using (true);

-- Packages: sab dekh sakte hain, sirf admin add/edit/delete kar sakta hai
create policy "public read packages" on packages for select to anon using (true);
create policy "auth write packages" on packages for all to authenticated using (true) with check (true);

-- Notices: sab dekh sakte hain, sirf admin post/delete kar sakta hai
create policy "public read notices" on notices for select to anon using (true);
create policy "auth write notices" on notices for all to authenticated using (true) with check (true);
```

Agar "Success. No rows returned" dikhe to sab theek ho gaya.

### Step 1.3 — Config keys nikalna
1. Left menu mein **Project Settings** (gear icon) → **API** par jaayein
2. **"Project URL"** copy karein
3. **"anon public"** key copy karein (yeh public/safe key hai, security asal mein upar wali Row Level Security rules se hoti hai)
4. Website folder mein `supabase-config.js` file kholein, `PASTE_YOUR_PROJECT_URL_HERE` aur `PASTE_YOUR_ANON_PUBLIC_KEY_HERE` ko apni asal values se badal dein

### Step 1.4 — Admin login banayein (yeh secret rahega)
1. Left menu mein **Authentication** → **Users** par jaayein
2. **"Add user"** → **"Create new user"** dabayein
3. Apna email aur ek mazboot password dalein
4. **"Auto Confirm User"** ka toggle **ON** rakhein (zaroori hai, warna email verify karwana padega)
5. **"Create user"** dabayein

**Bas yehi aapka admin login hai.** Koi bhi is email/password ke bagair admin
panel access nahi kar sakta — aur website par kahin bhi "Sign up" ya "Login"
ka button nahi hai, is liye normal visitors ko pata bhi nahi chalega ke admin
panel exist karta hai.

---

## HISSA 2: GitHub Pages Par Upload Karna

1. [github.com](https://github.com) par account banayein (agar nahi hai)
2. Naya repository banayein, naam bilkul yeh rakhein: **`yourusername.github.io`**
3. Repository public rakhein
4. Website ki saari files upload kar dein:
   - `index.html`, `packages.html`, `contact.html`, `admin-alvi8420.html`
   - `style.css`, `app.js`, `admin.js`, `supabase-config.js`
5. Settings > Pages > Source mein "main" branch select karke Save karein
6. 1-2 minute mein site live: `https://yourusername.github.io`

### Admin panel ka URL
```
https://yourusername.github.io/admin-alvi8420.html
```
Ise sirf apne paas mahfooz rakhein. Extra security ke liye chahen to
`admin-alvi8420.html` file ka naam badal kar kuch aur mushkil naam rakh dein.

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
  path daal dein.
- **Packages:** Admin panel se "Manage Packages" tab mein naye package add/hide/delete
  kar sakte hain — website automatically update ho jaayegi.
- **Notice Board:** Admin panel > "Notice Board" tab se koi bhi notice post karein,
  wo turant home page par sab ko dikhega.

---

## Koi Masla Ho To

- Agar form submit nahi ho raha: `supabase-config.js` mein URL aur key sahi hain ya nahi check karein
- Agar admin login nahi ho raha: Supabase > Authentication > Users mein email/password sahi hai ya nahi, aur "Auto Confirm" on tha ya nahi dekhein
- Agar packages/notices nahi dikh rahe: SQL Editor mein Step 1.2 wala code chal gaya tha ya nahi confirm karein (Table Editor mein tables dikhni chahiye)
