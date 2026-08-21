/**
 * MONETRAC - ACCOUNTS PAGE LOGIC
 */

async function renderAccounts() {
  const accounts = await Storage.getAccounts();
  const transactions = await Storage.getTransactions();

  const totalNetWorth = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  document.getElementById("accounts-total-networth").innerHTML = Utils.formatCurrency(totalNetWorth);
  document.getElementById("accounts-count").textContent = `${accounts.length} Akun Terdaftar`;

  const grid = document.getElementById("accounts-grid");
  if (!grid) return;

  grid.innerHTML = accounts.map(a => {
    // Count transactions for this account
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
            <button class="btn btn-secondary btn-icon btn-sm" onclick="openAccountModal('${a.id}')" title="Edit Akun">
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
          <button class="btn btn-secondary btn-sm" onclick="Modal.openTransactionModal()" title="Tambah Transaksi">
            <i class="fa-solid fa-plus"></i> Transaksi
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function openAccountModal(accId = null) {
  let accToEdit = null;
  if (accId) {
    const accounts = await Storage.getAccounts();
    accToEdit = accounts.find(a => a.id === accId);
  }

  let modal = document.getElementById("universal-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "universal-modal";
    modal.className = "modal-overlay";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <div class="modal-title">
          <i class="fa-solid fa-wallet" style="color:var(--primary)"></i>
          <span>${accToEdit ? 'Edit Akun / Dompet' : 'Tambah Akun Baru'}</span>
        </div>
        <button class="modal-close" onclick="Modal.close()">&times;</button>
      </div>

      <form id="account-form" class="modal-body">
        <input type="hidden" id="acc-id" value="${accToEdit ? accToEdit.id : ''}">

        <div class="form-group">
          <label class="form-label">Nama Akun / Bank / E-Wallet *</label>
          <input type="text" id="acc-name" class="form-control" placeholder="Contoh: BCA, Mandiri, GoPay, ShopeePay, Cash" value="${accToEdit ? accToEdit.name : ''}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Tipe Akun *</label>
          <select id="acc-type" class="form-control" required>
            <option value="Bank" ${accToEdit && accToEdit.type === 'Bank' ? 'selected' : ''}>Rekening Bank</option>
            <option value="Cash" ${accToEdit && accToEdit.type === 'Cash' ? 'selected' : ''}>Cash / Tunai</option>
            <option value="E-Wallet" ${accToEdit && accToEdit.type === 'E-Wallet' ? 'selected' : ''}>E-Wallet / Dompet Digital</option>
            <option value="Credit Card" ${accToEdit && accToEdit.type === 'Credit Card' ? 'selected' : ''}>Kartu Kredit / Paylater</option>
            <option value="Investment" ${accToEdit && accToEdit.type === 'Investment' ? 'selected' : ''}>Investasi / Saham / Reksadana</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Saldo ${accToEdit ? 'Saat Ini' : 'Awal'} (Rp) *</label>
          <input type="number" id="acc-balance" class="form-control" placeholder="0" value="${accToEdit ? accToEdit.balance : '0'}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Warna & Ikon</label>
          <div style="display:flex;gap:10px;">
            <input type="color" id="acc-color" class="form-control" value="${accToEdit ? accToEdit.color : '#16a34a'}" style="width:60px;padding:4px;">
            <select id="acc-icon" class="form-control" style="flex:1;">
              <option value="wallet" ${accToEdit && accToEdit.icon === 'wallet' ? 'selected' : ''}>Dompet (Wallet)</option>
              <option value="building-columns" ${accToEdit && accToEdit.icon === 'building-columns' ? 'selected' : ''}>Bank</option>
              <option value="money-bill" ${accToEdit && accToEdit.icon === 'money-bill' ? 'selected' : ''}>Uang Tunai (Cash)</option>
              <option value="credit-card" ${accToEdit && accToEdit.icon === 'credit-card' ? 'selected' : ''}>Kartu Kredit</option>
              <option value="chart-line" ${accToEdit && accToEdit.icon === 'chart-line' ? 'selected' : ''}>Investasi</option>
            </select>
          </div>
        </div>

        <div class="modal-footer" style="padding:0;border:none;margin-top:16px;">
          <button type="button" class="btn btn-secondary" onclick="Modal.close()">Batal</button>
          <button type="submit" class="btn btn-primary">Simpan Akun</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById("account-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("acc-id").value;
    const name = document.getElementById("acc-name").value;
    const type = document.getElementById("acc-type").value;
    const balance = Number(document.getElementById("acc-balance").value) || 0;
    const color = document.getElementById("acc-color").value;
    const icon = document.getElementById("acc-icon").value;

    const res = await Storage.saveAccount({
      id: id || undefined,
      name,
      type,
      balance,
      color,
      icon
    });

    if (res.success) {
      Utils.showToast("Akun berhasil disimpan!", "success");
      Modal.close();
      renderAccounts();
    } else {
      Utils.showToast("Gagal menyimpan akun: " + res.error, "error");
    }
  });

  modal.classList.add("active");
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