/**
 * MONETRAC - AUTHENTICATION & MULTI-USER MANAGEMENT
 */

const Auth = {
  async getCurrentUser() {
    const client = SupabaseConfig.getClient();
    if (!client) {
      // Local fallback mock user for demo/offline mode
      const localUser = localStorage.getItem("monetrac_local_user");
      return localUser ? JSON.parse(localUser) : null;
    }
    try {
      const { data: { user }, error } = await client.auth.getUser();
      if (error || !user) return null;
      return user;
    } catch (e) {
      console.warn("Auth getUser error:", e);
      return null;
    }
  },

  async getSession() {
    const client = SupabaseConfig.getClient();
    if (!client) return null;
    try {
      const { data: { session } } = await client.auth.getSession();
      return session;
    } catch (e) {
      return null;
    }
  },

  async register(email, password, fullName) {
    const client = SupabaseConfig.getClient();
    if (!client) {
      // Mock local register
      const mockUser = {
        id: "local_user_" + Date.now(),
        email: email,
        user_metadata: { full_name: fullName }
      };
      localStorage.setItem("monetrac_local_user", JSON.stringify(mockUser));
      return { success: true, user: mockUser, isLocal: true };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });
      if (error) throw error;
      return { success: true, user: data.user, session: data.session };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async login(email, password) {
    const client = SupabaseConfig.getClient();
    if (!client) {
      // Mock local login
      const mockUser = {
        id: "local_user_demo",
        email: email,
        user_metadata: { full_name: email.split("@")[0] }
      };
      localStorage.setItem("monetrac_local_user", JSON.stringify(mockUser));
      return { success: true, user: mockUser, isLocal: true };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return { success: true, user: data.user, session: data.session };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async logout() {
    const client = SupabaseConfig.getClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.error("Logout error:", e);
      }
    }
    localStorage.removeItem("monetrac_local_user");
    window.location.href = "auth.html";
  },

  async resetPassword(email) {
    const client = SupabaseConfig.getClient();
    if (!client) {
      return { success: false, error: "Supabase belum terkonfigurasi." };
    }
    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/settings.html"
      });
      if (error) throw error;
      return { success: true, message: "Instruksi reset password telah dikirim ke email Anda." };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async requireAuth() {
    const user = await this.getCurrentUser();
    if (!user) {
      window.location.href = "auth.html";
      return null;
    }
    return user;
  },

  async redirectIfAuthenticated() {
    const user = await this.getCurrentUser();
    if (user) {
      window.location.href = "index.html";
    }
  }
};