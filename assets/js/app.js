/**
 * MONETRAC - GLOBAL APP CONTROLLER (INSTANT RENDERING)
 */

const AppState = {
  getTheme() {
    return localStorage.getItem("monetrac_theme") || "light";
  },

  setTheme(theme) {
    localStorage.setItem("monetrac_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    const themeBtn = document.getElementById("btn-toggle-theme");
    if (themeBtn) {
      themeBtn.innerHTML = `<i class="fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}"></i>`;
    }
  },

  getPrivacyMode() {
    return localStorage.getItem("monetrac_privacy_mode") === "true";
  },

  setPrivacyMode(isActive) {
    localStorage.setItem("monetrac_privacy_mode", isActive ? "true" : "false");
    document.body.setAttribute("data-privacy", isActive ? "true" : "false");
    if (isActive) {
      document.body.classList.add("privacy-active");
    } else {
      document.body.classList.remove("privacy-active");
    }

    const privacyBtn = document.getElementById("btn-toggle-privacy");
    if (privacyBtn) {
      if (isActive) {
        privacyBtn.classList.add("active");
        privacyBtn.innerHTML = `<i class="fa-solid fa-eye-slash"></i> <span class="d-none-mobile">Privasi Aktif</span>`;
      } else {
        privacyBtn.classList.remove("active");
        privacyBtn.innerHTML = `<i class="fa-solid fa-eye"></i> <span class="d-none-mobile">Mode Privasi</span>`;
      }
    }

    if (window.onPrivacyChanged) {
      window.onPrivacyChanged(isActive);
    }
  },

  async init(pageId, pageTitle, pageSubtitle) {
    // 1. Render Theme & Privacy Instantly (0ms)
    this.setTheme(this.getTheme());
    this.setPrivacyMode(this.getPrivacyMode());

    // 2. Render Sidebar & Navbar Instantly (Never disappears!)
    Sidebar.render(pageId);
    Navbar.render(pageTitle, pageSubtitle);

    // 3. Authenticate
    const user = await Auth.requireAuth();
    if (!user) return;

    // 4. Update user info on sidebar & navbar
    Sidebar.updateUserCard();
    Navbar.updateUserInfo();
  }
};
