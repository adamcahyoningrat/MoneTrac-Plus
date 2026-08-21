/**
 * MONETRAC - CENTRALIZED SUPABASE CONFIGURATION
 * --------------------------------------------------------------------------
 * Cukup masukkan URL dan Anon Key project Supabase Anda di bawah ini SATU KALI SAJA.
 * Semua pengguna web MoneTrac akan otomatis terhubung ke database terpusat ini
 * dan data setiap pengguna otomatis terisolasi aman dengan Row Level Security (RLS).
 * --------------------------------------------------------------------------
 */

const SupabaseConfig = {
  // GANTI DENGAN KREDENSIAL SUPABASE ANDA:
  SUPABASE_URL: "https://your-project-id.supabase.co", 
  SUPABASE_ANON_KEY: "your-anon-key-here",

  getUrl() {
    // Utamakan URL terpusat, jika masih default cek apakah disimpan di localStorage
    if (this.SUPABASE_URL && !this.SUPABASE_URL.includes("your-project-id")) {
      return this.SUPABASE_URL.trim();
    }
    return localStorage.getItem("monetrac_supabase_url") || this.SUPABASE_URL;
  },

  getAnonKey() {
    // Utamakan Anon Key terpusat
    if (this.SUPABASE_ANON_KEY && !this.SUPABASE_ANON_KEY.includes("your-anon-key")) {
      return this.SUPABASE_ANON_KEY.trim();
    }
    return localStorage.getItem("monetrac_supabase_key") || this.SUPABASE_ANON_KEY;
  },

  saveCredentials(url, key) {
    if (url) localStorage.setItem("monetrac_supabase_url", url.trim());
    if (key) localStorage.setItem("monetrac_supabase_key", key.trim());
    this.initClient();
  },

  isConfigured() {
    const url = this.getUrl();
    const key = this.getAnonKey();
    return url && key && !url.includes("your-project-id") && !key.includes("your-anon-key") && url.startsWith("http");
  },

  client: null,

  initClient() {
    const url = this.getUrl();
    const key = this.getAnonKey();
    if (window.supabase && url && key && url.startsWith("http") && !url.includes("your-project-id")) {
      try {
        this.client = window.supabase.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        window.supabaseClient = this.client;
        return this.client;
      } catch (err) {
        console.error("Failed to initialize Supabase client:", err);
        this.client = null;
      }
    }
    return null;
  },

  getClient() {
    if (!this.client) {
      this.initClient();
    }
    return this.client;
  },

  async testConnection() {
    const client = this.getClient();
    if (!client) {
      return { success: false, message: "Klien Supabase belum terhubung dengan URL & Key yang valid." };
    }
    try {
      const { data, error } = await client.from("categories").select("id").limit(1);
      if (error && error.code !== "PGRST116" && !error.message.includes("does not exist")) {
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          return { success: true, message: "Terkoneksi ke Supabase! (Jalankan supabase_schema.sql di SQL Editor)" };
        }
      }
      return { success: true, message: "Berhasil terhubung ke server database Supabase terpusat!" };
    } catch (e) {
      return { success: false, message: e.message || "Gagal menghubungi server Supabase" };
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  SupabaseConfig.initClient();
});