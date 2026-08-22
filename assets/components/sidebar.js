/**
 * MONETRAC+ - SIDEBAR & NAVIGATION COMPONENT
 */

const Sidebar = {
  render(activePage = "dashboard") {
    const container = document.getElementById("sidebar-container");
    if (!container) return;

    const navItems = [
      { id: "dashboard", href: "dashboard.html", icon: "fa-chart-pie", label: "Dashboard" },
      { id: "transactions", href: "transactions.html", icon: "fa-receipt", label: "Transaksi" },
      { id: "accounts", href: "accounts.html", icon: "fa-building-columns", label: "Akun & Dompet" },
      { id: "savings", href: "savings.html", icon: "fa-piggy-bank", label: "Target Tabungan", badge: "Baru" },
      { id: "categories", href: "categories.html", icon: "fa-tags", label: "Kategori" },
      { id: "budget", href: "budget.html", icon: "fa-chart-simple", label: "Anggaran (Budget)" },
      { id: "kpi", href: "kpi.html", icon: "fa-gauge-high", label: "KPI Keuangan" },
      { id: "reports", href: "reports.html", icon: "fa-file-invoice-dollar", label: "Laporan & Cetak" },
      { id: "settings", href: "settings.html", icon: "fa-gear", label: "Pengaturan" }
    ];

    container.innerHTML = `
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
      <aside class="sidebar-wrapper">
        <div class="sidebar-brand">
          <img src="assets/img/logo-icon.svg" alt="MoneTrac+ Logo" class="brand-logo-img">
          <div class="brand-text">Mone<span class="brand-accent">Trac</span><span class="brand-plus">+</span></div>
          <button class="modal-close d-mobile-only" id="mobile-sidebar-close" style="margin-left:auto;font-size:1.4rem;">&times;</button>
        </div>

        <nav class="sidebar-menu" style="display:flex;flex-direction:column;gap:6px;padding:16px 12px;overflow-y:auto;flex:1;">
          <div class="menu-category">Menu Utama</div>
          ${navItems.map(item => `
            <a href="${item.href}" class="menu-item ${activePage === item.id ? 'active' : ''}" style="display:flex;align-items:center;width:100%;gap:12px;padding:11px 14px;border-radius:12px;text-decoration:none;box-sizing:border-box;">
              <i class="fa-solid ${item.icon}"></i>
              <span>${item.label}</span>
              ${item.badge ? `<span style="margin-left:auto;background:var(--accent-gradient);color:#fff;font-size:0.68rem;padding:2px 7px;border-radius:999px;font-weight:700;">${item.badge}</span>` : ''}
            </a>
          `).join('')}
        </nav>

        <div class="sidebar-footer">
          <div class="user-mini-card">
            <div class="user-avatar" id="sidebar-user-avatar">
              <i class="fa-solid fa-user"></i>
            </div>
            <div class="user-info">
              <div class="user-name" id="sidebar-user-name">Memuat...</div>
              <div class="user-role" id="sidebar-user-status">Supabase Sync</div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm btn-block" id="btn-sidebar-logout" style="gap:6px;">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      <!-- Mobile Bottom App Bar -->
      <div class="mobile-bottom-nav">
        <a href="dashboard.html" class="mobile-nav-item ${activePage === 'dashboard' ? 'active' : ''}">
          <i class="fa-solid fa-chart-pie"></i>
          <span>Dashboard</span>
        </a>
        <a href="transactions.html" class="mobile-nav-item ${activePage === 'transactions' ? 'active' : ''}">
          <i class="fa-solid fa-receipt"></i>
          <span>Transaksi</span>
        </a>
        <button class="mobile-nav-add" onclick="Modal.openTransactionModal()" title="Tambah Transaksi">
          <i class="fa-solid fa-plus"></i>
        </button>
        <a href="savings.html" class="mobile-nav-item ${activePage === 'savings' ? 'active' : ''}">
          <i class="fa-solid fa-piggy-bank"></i>
          <span>Tabungan</span>
        </a>
        <a href="accounts.html" class="mobile-nav-item ${activePage === 'accounts' ? 'active' : ''}">
          <i class="fa-solid fa-wallet"></i>
          <span>Akun</span>
        </a>
      </div>
    `;

    this.bindEvents();
    this.updateUserCard();
  },

  async updateUserCard() {
    const user = await Auth.getCurrentUser();
    const nameEl = document.getElementById("sidebar-user-name");
    const avatarEl = document.getElementById("sidebar-user-avatar");
    const statusEl = document.getElementById("sidebar-user-status");

    if (user) {
      const name = (user.user_metadata && user.user_metadata.full_name) || (user.email ? user.email.split("@")[0] : "User");
      if (nameEl) nameEl.textContent = name;
      if (avatarEl) avatarEl.textContent = name.substring(0, 2).toUpperCase();
      if (statusEl) {
        statusEl.textContent = SupabaseConfig.isConfigured() ? "Supabase Cloud" : "Local Mode";
      }
    }
  },

  bindEvents() {
    const closeDrawer = () => {
      document.querySelector(".sidebar-wrapper")?.classList.remove("mobile-open");
      document.querySelector(".sidebar-overlay")?.classList.remove("active");
    };

    document.getElementById("sidebar-overlay")?.addEventListener("click", closeDrawer);
    document.getElementById("mobile-sidebar-close")?.addEventListener("click", closeDrawer);

    const logoutBtn = document.getElementById("btn-sidebar-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        if (confirm("Apakah Anda yakin ingin keluar dari akun?")) {
          Auth.logout();
        }
      });
    }
  }
};