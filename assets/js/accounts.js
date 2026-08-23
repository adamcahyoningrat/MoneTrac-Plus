/**
 * MONETRAC - ACCOUNTS PAGE LOGIC
 */

let allAccounts = [];

async function renderAccounts() {
  const accounts = await Storage.getAccounts();
  const transactions = await Storage.getTransactions();
  allAccounts = accounts || [];

  const totalNetWorth = allAccounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  const networthEl = document.getElementById("accounts-total-networth");
  const countEl = document.getElementById("accounts-count");
  if (networthEl) networthEl.innerHTML = Utils.formatCurrency(totalNetWorth);
  if (countEl) countEl.textContent = `${allAccounts.length} Akun Terdaftar`;

  const grid = document.getElementById("accounts-grid");
  if (!grid) return;

  if (!allAccounts.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon"><i class="fa-solid fa-wallet"></i></div>
        <div class="empty-title">Belum Ada Akun / Dompet</div>
        <div class="empty-desc">Tambahkan rekening bank, uang tunai, atau dompet digital Anda.</div>
        <button class="btn btn-primary" onclick="Modal.openAccountModal()" style="margin-top:12px;">
          <i class="fa-solid fa-plus"></i> Tambah Akun Baru
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = allAccounts.map(a => {
    const txCount = transactions.filter(t => t.account_id === a.id || t.to_account_id === a.id || t.account === a.id || t.toAccount === a.id).length;

    return `
      <div class="card card-hover" style="position:relative;overflow:hidden;display:flex;flex-direction:column;gap:16px;">
        <div style="position:absolute;top:0;left:0;height:4px;width:100%;background:${a.color || 'var(--primary)'};"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;border-radius:var(--radius-md);background:${a.color}22;color:${a.color};display:flex;align-items:center;justify-content:center;font-size:1.3rem;">
              <i class="fa-solid fa-${a.icon || 'wallet'}"></i>
            </div>
            <div>
              <div style="font-weight:700;font-size:1.1rem;color:var(--text-primary);">${Utils.escapeHTML(a.name)}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);text-transform:uppercase;font-weight:600;">${a.type}</div>
            </div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-secondary btn-icon btn-sm" onclick="Modal.openAccountModal('${a.id}')" title="Edit Akun">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-danger btn-icon btn-sm" onclick="deleteAccount('${a.id}')" title="Hapus Akun">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div>
          <div style="font-size:0.75rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Saldo Saat Ini</div>
          <div style="font-size:1.6rem;font-weight:800;color:var(--text-primary);margin-top:2px;">
            ${Utils.formatCurrency(a.balance)}
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border-color);font-size:0.82rem;color:var(--text-muted);">
          <span>${txCount} Transaksi tercatat</span>
          <button class="btn btn-secondary btn-sm" onclick="Modal.openTransactionModal({account_id:'${a.id}'})" title="Tambah Transaksi">
            <i class="fa-solid fa-plus"></i> Transaksi
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function deleteAccount(id) {
  if (confirm("Apakah Anda yakin ingin menghapus akun ini? Transaksi terkait mungkin terpengaruh.")) {
    const res = await Storage.deleteAccount(id);
    if (res.success) {
      Utils.showToast("Akun berhasil dihapus!", "success");
      renderAccounts();
    } else {
      Utils.showToast("Gagal menghapus: " + res.error, "error");
    }
  }
}

window.renderAccounts = renderAccounts;
window.onPrivacyChanged = () => renderAccounts();
