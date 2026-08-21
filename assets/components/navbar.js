/**
 * MONETRAC - NAVBAR COMPONENT
 */

const Navbar = {
  render(pageTitle = "Dashboard", pageSubtitle = "Selamat datang kembali!") {
    const container = document.getElementById("navbar-container");
    if (!container) return;

    const privacyActive = AppState.getPrivacyMode();
    const currentTheme = AppState.getTheme();

    container.innerHTML = `
      <div class="navbar-wrapper">
        <div class="navbar-left">
          <button class="nav-icon-btn mobile-toggle-btn" id="mobile-menu-btn" title="Buka Menu">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div class="navbar-page-title">
            <h1>${pageTitle}</h1>
            <p>${pageSubtitle}</p>
          </div>
        </div>

        <div class="navbar-right">
          <!-- Privacy Toggle Button -->
          <button class="nav-action-btn ${privacyActive ? 'active' : ''}" id="btn-toggle-privacy" title="Sembunyikan / Tampilkan Nominal Saldo">
            <i class="fa-solid ${privacyActive ? 'fa-eye-slash' : 'fa-eye'}"></i>
            <span class="d-none-mobile">${privacyActive ? 'Privasi Aktif' : 'Mode Privasi'}</span>
          </button>

          <!-- Dark/Light Theme Toggle -->
          <button class="nav-icon-btn" id="btn-toggle-theme" title="Ganti Tema Gelap/Terang">
            <i class="fa-solid ${currentTheme === 'light' ? 'fa-moon' : 'fa-sun'}"></i>
          </button>

          <!-- Quick Add Transaction Button -->
          <button class="btn btn-primary btn-sm d-none-mobile" id="btn-quick-add-tx">
            <i class="fa-solid fa-plus"></i>
            <span>Transaksi Baru</span>
          </button>

          <!-- User Avatar & Mini Profile -->
          <a href="settings.html" class="user-avatar" id="nav-user-avatar" title="Pengaturan Akun">
            <i class="fa-solid fa-user"></i>
          </a>
        </div>
      </div>
    `;

    this.bindEvents();
    this.updateUserInfo();
  },

  async updateUserInfo() {
    const user = await Auth.getCurrentUser();
    const avatarEl = document.getElementById("nav-user-avatar");
    if (user && avatarEl) {
      const name = (user.user_metadata && user.user_metadata.full_name) || (user.email ? user.email.split("@")[0] : "User");
      avatarEl.innerHTML = name.substring(0, 2).toUpperCase();
      avatarEl.title = `${name} (${user.email || 'Online'})`;
    }
  },

  bindEvents() {
    // Privacy Toggle
    const privacyBtn = document.getElementById("btn-toggle-privacy");
    if (privacyBtn) {
      privacyBtn.addEventListener("click", () => {
        const current = AppState.getPrivacyMode();
        AppState.setPrivacyMode(!current);
        Utils.showToast(
          !current ? "Mode Privasi aktif (Saldo disamarkan)" : "Mode Privasi nonaktif (Saldo terlihat)",
          "info",
          "Mode Privasi"
        );
      });
    }

    // Theme Toggle
    const themeBtn = document.getElementById("btn-toggle-theme");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const current = AppState.getTheme();
        const next = current === "light" ? "dark" : "light";
        AppState.setTheme(next);
      });
    }

    // Quick Add Transaction
    const addBtn = document.getElementById("btn-quick-add-tx");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        Modal.openTransactionModal();
      });
    }

    // Mobile Menu Toggle
    const mobileBtn = document.getElementById("mobile-menu-btn");
    if (mobileBtn) {
      mobileBtn.addEventListener("click", () => {
        const sidebar = document.querySelector(".sidebar-wrapper");
        const overlay = document.querySelector(".sidebar-overlay");
        if (sidebar) sidebar.classList.toggle("mobile-open");
        if (overlay) overlay.classList.toggle("active");
      });
    }
  }
};