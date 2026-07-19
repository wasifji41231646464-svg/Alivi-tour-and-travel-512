/* =========================================================================
   SUPABASE CONFIG — ISE FILE KO BADALNA HAI
   -------------------------------------------------------------------------
   1. https://supabase.com par jaakar FREE account banayein (card nahi chahiye)
   2. "New Project" banayein
   3. Left menu > Project Settings > API par jaayein
   4. Wahan se "Project URL" aur "anon public" key copy karein
   5. Neeche paste kar dein
   SETUP-GUIDE.md mein pura tareeqa step-by-step likha hai.
   ========================================================================= */

const SUPABASE_URL = "https://qdmzepxwoluunhiiehzl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkbXplcHh3b2x1dW5oaWllaHpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzODcxMzYsImV4cCI6MjA5OTk2MzEzNn0.lhiLU3R65g6ihIBqkySmiV6wWyl7m0r-rso6DBxDwng";

// Initialize client (supabase-js loaded via <script> tag in each HTML page)
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const auth = db.auth;
