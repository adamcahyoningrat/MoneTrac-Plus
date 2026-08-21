/**
 * MONETRAC - SETTINGS & DATA MIGRATION LOGIC
 */

async function renderSettings() {
  const user = await Auth.getCurrentUser();

  // 1. User Info
  if (user) {
    const name = (user.user_metadata && user.user_metadata.full_name) || (user.email ? user.email.split("@")[0] : "Pengguna");
    document.getElementById("settings-user-name").value = name;
    document.getElementById("settings-user-email").value = user.email || "";
  }

  // 2. Supabase Settings
  document.getElementById("settings-supabase-url").value = SupabaseConfig.getUrl();
  document.getElementById("settings-supabase-key").value = SupabaseConfig.getAnonKey();

  const isConfigured = SupabaseConfig.isConfigured();
  const statusBadge = document.getElementById("supabase-status-badge");
  if (statusBadge) {
    if (isConfigured) {
      statusBadge.className = "badge badge-income";
      statusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Supabase Aktif`;
    } else {
      statusBadge.className = "badge badge-expense";
      statusBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Mode Lokal / Offline`;
    }
  }

  // 3. Privacy Default Switch
  const privacySwitch = document.getElementById("settings-privacy-default");
  if (privacySwitch) {
    privacySwitch.checked = AppState.getPrivacyMode();
  }

  // 4. Theme Radio
  const currentTheme = AppState.getTheme();
  const themeDark = document.getElementById("theme-dark");
  const themeLight = document.getElementById("theme-light");
  if (themeDark && themeLight) {
    themeDark.checked = currentTheme === "dark";
    themeLight.checked = currentTheme === "light";
  }
}

async function saveSupabaseConfig() {
  const url = document.getElementById("settings-supabase-url").value;
  const key = document.getElementById("settings-supabase-key").value;

  SupabaseConfig.saveCredentials(url, key);
  const test = await SupabaseConfig.testConnection();

  if (test.success) {
    Utils.showToast("Koneksi Supabase berhasil disimpan dan terhubung!", "success");
  } else {
    Utils.showToast("Koneksi disimpan, tetapi belum dapat terhubung: " + test.message, "warning");
  }
  renderSettings();
}

async function testSupabaseConnection() {
  Utils.showToast("Menguji koneksi ke Supabase...", "info");
  const test = await SupabaseConfig.testConnection();
  if (test.success) {
    Utils.showToast(test.message, "success");
  } else {
    Utils.showToast(test.message, "error");
  }
}

async function importGSheetJSON() {
  const jsonInput = document.getElementById("import-json-input").value;
  if (!jsonInput.trim()) {
    Utils.showToast("Tempelkan data JSON dari Google Sheet terlebih dahulu!", "warning");
    return;
  }

  try {
    Utils.showToast("Memproses migrasi data...", "info");
    const res = await Storage.importFromGSheetData(jsonInput);
    if (res.success) {
      Utils.showToast(res.message, "success");
      document.getElementById("import-json-input").value = "";
    } else {
      Utils.showToast("Gagal migrasi: " + res.error, "error");
    }
  } catch (e) {
    Utils.showToast("Format JSON tidak valid: " + e.message, "error");
  }
}

async function exportFullBackupJSON() {
  const backup = await Storage.exportAllData();
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", `Monetrac_Backup_${new Date().toISOString().split("T")[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  Utils.showToast("Backup data JSON berhasil diunduh!", "success");
}

async function resetAllData() {
  if (confirm("PERINGATAN: Tindakan ini akan menghapus data transaksi dan akun lokal Anda. Lanjutkan?")) {
    localStorage.removeItem("monetrac_cache_transactions");
    localStorage.removeItem("monetrac_cache_accounts");
    localStorage.removeItem("monetrac_cache_categories");
    localStorage.removeItem("monetrac_cache_budgets");
    localStorage.removeItem("monetrac_cache_savings");
    Utils.showToast("Data lokal berhasil dibersihkan.", "info");
    setTimeout(() => window.location.reload(), 1000);
  }
}

window.renderSettings = renderSettings;