/**
 * MONETRAC - SUPABASE CONFIGURATION & CLIENT INITIALIZER
 */

const SupabaseConfig = {
  DEFAULT_URL: "https://your-project.supabase.co",
  DEFAULT_ANON_KEY: "your-anon-key",

  getUrl() {
    return localStorage.getItem("monetrac_supabase_url") || this.DEFAULT_URL;
  },

  getAnonKey() {
    return localStorage.getItem("monetrac_supabase_key") || this.DEFAULT_ANON_KEY;
  },

  saveCredentials(url, key) {
    if (url) localStorage.setItem("monetrac_supabase_url", url.trim());
    if (key) localStorage.setItem("monetrac_supabase_key", key.trim());
    this.initClient();
  },

  isConfigured() {
    const url = this.getUrl();
    const key = this.getAnonKey();
    return url && key && url !== this.DEFAULT_URL && key !== this.DEFAULT_ANON_KEY && url.startsWith("http");
  },

  client: null,

  initClient() {
    const url = this.getUrl();
    const key = this.getAnonKey();
    if (window.supabase && url && key && url.startsWith("http") && url !== this.DEFAULT_URL) {
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
      return { success: false, message: "Klien Supabase belum terkonfigurasi dengan URL & Key yang valid." };
    }
    try {
      const { data, error } = await client.from("categories").select("id").limit(1);
      if (error && error.code !== "PGRST116" && !error.message.includes("does not exist")) {
        // Even if table is empty, success
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          return { success: true, message: "Terkoneksi ke Supabase! (Catatan: Tabel database belum dibuat, silakan jalankan skrip supabase_schema.sql di SQL Editor)" };
        }
      }
      return { success: true, message: "Berhasil terkoneksi ke database Supabase!" };
    } catch (e) {
      return { success: false, message: e.message || "Gagal menghubungkan ke Supabase" };
    }
  }
};

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
  SupabaseConfig.initClient();
});