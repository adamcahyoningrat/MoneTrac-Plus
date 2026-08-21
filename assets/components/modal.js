/**
 * MONETRAC - UNIVERSAL MODAL COMPONENT (WITH DYNAMIC TRANSFER HANDLING & SAVINGS)
 */

const Modal = {
  activeTransactionType: "Expense",

  /**
   * Opens the Transaction Modal with dynamic form states
   */
  async openTransactionModal(txToEdit = null) {
    const accounts = await Storage.getAccounts();
    const categories = await Storage.getCategories();

    if (!accounts.length) {
      Utils.showToast("Silakan buat akun/dompet terlebih dahulu di menu Akun.", "warning");
      window.location.href = "accounts.html";
      return;
    }

    let modal = document.getElementById("universal-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "universal-modal";
      modal.className = "modal-overlay";
      document.body.appendChild(modal);
    }

    this.activeTransactionType = txToEdit ? txToEdit.type : "Expense";
    const isEdit = !!txToEdit;

    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid fa-money-bill-transfer" style="color:var(--primary)"></i>
            <span>${isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}</span>
          </div>
          <button class="modal-close" onclick="Modal.close()">&times;</button>
        </div>

        <form id="tx-form" class="modal-body">
          <input type="hidden" id="tx-id" value="${txToEdit ? txToEdit.id : ''}">

          <!-- Transaction Type Switcher -->
          <div class="type-tabs">
            <button type="button" class="type-tab-btn tab-expense ${this.activeTransactionType === 'Expense' ? 'active' : ''}" data-type="Expense">
              <i class="fa-solid fa-arrow-down-long"></i> Pengeluaran
            </button>
            <button type="button" class="type-tab-btn tab-income ${this.activeTransactionType === 'Income' ? 'active' : ''}" data-type="Income">
              <i class="fa-solid fa-arrow-up-long"></i> Pemasukan
            </button>
            <button type="button" class="type-tab-btn tab-transfer ${this.activeTransactionType === 'Transfer' ? 'active' : ''}" data-type="Transfer">
              <i class="fa-solid fa-right-left"></i> Transfer
            </button>
          </div>

          <!-- Dynamic Transfer Visual Preview -->
          <div id="transfer-preview-box" class="transfer-preview" style="display: ${this.activeTransactionType === 'Transfer' ? 'flex' : 'none'};">
            <div class="transfer-box">
              <div class="transfer-box-label">Dari Akun</div>
              <div class="transfer-box-val" id="tx-preview-from">-</div>
            </div>
            <div class="transfer-arrow"><i class="fa-solid fa-arrow-right"></i></div>
            <div class="transfer-box">
              <div class="transfer-box-label">Ke Akun</div>
              <div class="transfer-box-val" id="tx-preview-to">-</div>
            </div>
          </div>

          <!-- Amount Input & Quick Chips -->
          <div class="form-group">
            <label class="form-label" for="tx-amount">Nominal Transaksi (Rp) *</label>
            <input type="number" id="tx-amount" class="form-control" placeholder="0" value="${txToEdit ? txToEdit.amount : ''}" required min="1" style="font-size:1.3rem;font-weight:700;">
            <div class="quick-chips">
              <button type="button" class="chip-btn" onclick="Modal.addQuickAmount(10000)">+10rb</button>
              <button type="button" class="chip-btn" onclick="Modal.addQuickAmount(50000)">+50rb</button>
              <button type="button" class="chip-btn" onclick="Modal.addQuickAmount(100000)">+100rb</button>
              <button type="button" class="chip-btn" onclick="Modal.addQuickAmount(500000)">+500rb</button>
              <button type="button" class="chip-btn" onclick="Modal.addQuickAmount(1000000)">+1jt</button>
            </div>
          </div>

          <!-- Account Fields -->
          <div class="form-group" id="group-source-account">
            <label class="form-label" id="label-source-account">Pilih Akun / Dompet *</label>
            <select id="tx-account" class="form-control" required>
              ${accounts.map(a => `
                <option value="${a.id}" ${txToEdit && (txToEdit.account_id === a.id || txToEdit.account === a.id) ? 'selected' : ''}>
                  ${a.name} (${Utils.formatCurrencyRaw(a.balance)})
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Destination Account for Transfer -->
          <div class="form-group" id="group-target-account" style="display: ${this.activeTransactionType === 'Transfer' ? 'flex' : 'none'};">
            <label class="form-label">Transfer Ke Akun (Tujuan) *</label>
            <select id="tx-to-account" class="form-control">
              ${accounts.map((a, idx) => `
                <option value="${a.id}" ${txToEdit && (txToEdit.to_account_id === a.id || txToEdit.toAccount === a.id) ? 'selected' : (idx === 1 ? 'selected' : '')}>
                  ${a.name} (${Utils.formatCurrencyRaw(a.balance)})
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Admin Fee for Transfer -->
          <div class="form-group" id="group-admin-fee" style="display: ${this.activeTransactionType === 'Transfer' ? 'flex' : 'none'};">
            <label class="form-label">Biaya Admin Transfer (Opsional)</label>
            <input type="number" id="tx-admin-fee" class="form-control" placeholder="Contoh: 2500" value="${txToEdit && txToEdit.admin_fee ? txToEdit.admin_fee : ''}">
          </div>

          <!-- Category Field (Hidden for Transfer) -->
          <div class="form-group" id="group-category" style="display: ${this.activeTransactionType !== 'Transfer' ? 'flex' : 'none'};">
            <label class="form-label">Kategori *</label>
            <select id="tx-category" class="form-control">
              <!-- Populated dynamically based on Expense/Income -->
            </select>
          </div>

          <!-- Date and Time -->
          <div class="form-group">
            <label class="form-label" for="tx-date">Tanggal Transaksi *</label>
            <input type="date" id="tx-date" class="form-control" value="${txToEdit ? (txToEdit.date ? txToEdit.date.split('T')[0] : '') : new Date().toISOString().split('T')[0]}" required>
          </div>

          <!-- Description / Notes -->
          <div class="form-group">
            <label class="form-label" for="tx-desc">Catatan / Keterangan</label>
            <input type="text" id="tx-desc" class="form-control" placeholder="Contoh: Beli Makan Siang, Gaji Bulanan, dsb." value="${txToEdit ? (txToEdit.description || '') : ''}">
          </div>

          <div class="modal-footer" style="padding:0;border:none;margin-top:16px;">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Batal</button>
            <button type="submit" class="btn btn-primary">
              <i class="fa-solid fa-check"></i> Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    `;

    this.renderCategoryOptions(categories, txToEdit ? (txToEdit.category_name || txToEdit.category) : null);
    this.bindTransactionFormEvents(accounts, categories);
    modal.classList.add("active");
  },

  addQuickAmount(amount) {
    const input = document.getElementById("tx-amount");
    if (input) {
      const current = Number(input.value) || 0;
      input.value = current + amount;
    }
  },

  renderCategoryOptions(categories, selectedCategory = null) {
    const select = document.getElementById("tx-category");
    if (!select) return;

    const filtered = categories.filter(c => c.type === this.activeTransactionType);
    select.innerHTML = filtered.map(c => `
      <option value="${c.name}" ${selectedCategory === c.name ? 'selected' : ''}>
        ${c.name}
      </option>
    `).join('') || `<option value="Lainnya">Lainnya</option>`;
  },

  updateTransferPreview(accounts) {
    const fromSelect = document.getElementById("tx-account");
    const toSelect = document.getElementById("tx-to-account");
    const previewFrom = document.getElementById("tx-preview-from");
    const previewTo = document.getElementById("tx-preview-to");

    if (fromSelect && previewFrom) {
      const acc = accounts.find(a => a.id === fromSelect.value);
      previewFrom.textContent = acc ? acc.name : "-";
    }
    if (toSelect && previewTo) {
      const acc = accounts.find(a => a.id === toSelect.value);
      previewTo.textContent = acc ? acc.name : "-";
    }
  },

  bindTransactionFormEvents(accounts, categories) {
    // Tab switching
    const tabs = document.querySelectorAll(".type-tab-btn");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        this.activeTransactionType = tab.getAttribute("data-type");

        const targetGroup = document.getElementById("group-target-account");
        const adminFeeGroup = document.getElementById("group-admin-fee");
        const catGroup = document.getElementById("group-category");
        const previewBox = document.getElementById("transfer-preview-box");
        const labelSource = document.getElementById("label-source-account");

        if (this.activeTransactionType === "Transfer") {
          targetGroup.style.display = "flex";
          adminFeeGroup.style.display = "flex";
          catGroup.style.display = "none";
          previewBox.style.display = "flex";
          labelSource.textContent = "Dari Akun (Sumber) *";
          this.updateTransferPreview(accounts);
        } else {
          targetGroup.style.display = "none";
          adminFeeGroup.style.display = "none";
          catGroup.style.display = "flex";
          previewBox.style.display = "none";
          labelSource.textContent = this.activeTransactionType === "Income" ? "Akun Penerima *" : "Akun Sumber *";
          this.renderCategoryOptions(categories);
        }
      });
    });

    // Account changes for preview
    document.getElementById("tx-account")?.addEventListener("change", () => this.updateTransferPreview(accounts));
    document.getElementById("tx-to-account")?.addEventListener("change", () => this.updateTransferPreview(accounts));
    this.updateTransferPreview(accounts);

    // Form submit
    const form = document.getElementById("tx-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("tx-id").value;
      const amount = Number(document.getElementById("tx-amount").value);
      const accountId = document.getElementById("tx-account").value;
      const toAccountId = document.getElementById("tx-to-account")?.value;
      const adminFee = Number(document.getElementById("tx-admin-fee")?.value) || 0;
      const categoryName = document.getElementById("tx-category")?.value;
      const date = document.getElementById("tx-date").value;
      const desc = document.getElementById("tx-desc").value;

      if (this.activeTransactionType === "Transfer" && accountId === toAccountId) {
        Utils.showToast("Akun tujuan tidak boleh sama dengan akun asal transfer!", "error");
        return;
      }

      const txPayload = {
        id: id || undefined,
        type: this.activeTransactionType,
        amount: amount,
        admin_fee: adminFee,
        account_id: accountId,
        to_account_id: this.activeTransactionType === "Transfer" ? toAccountId : null,
        category_name: this.activeTransactionType === "Transfer" ? "Transfer" : categoryName,
        date: date,
        description: desc
      };

      const res = await Storage.saveTransaction(txPayload);
      if (res.success) {
        Utils.showToast("Transaksi berhasil disimpan!", "success");
        Modal.close();
        if (window.onTransactionSaved) {
          window.onTransactionSaved();
        } else {
          window.location.reload();
        }
      } else {
        Utils.showToast("Gagal menyimpan transaksi: " + (res.error || "Terjadi kesalahan"), "error");
      }
    });
  },

  /**
   * Open Savings Goal Modal (Create / Edit Goal)
   */
  async openSavingsGoalModal(goalToEdit = null) {
    const accounts = await Storage.getAccounts();
    let modal = document.getElementById("universal-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "universal-modal";
      modal.className = "modal-overlay";
      document.body.appendChild(modal);
    }

    const isEdit = !!goalToEdit;

    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid fa-piggy-bank" style="color:var(--primary)"></i>
            <span>${isEdit ? 'Edit Target Tabungan' : 'Buat Target Tabungan Baru'}</span>
          </div>
          <button class="modal-close" onclick="Modal.close()">&times;</button>
        </div>

        <form id="goal-form" class="modal-body">
          <input type="hidden" id="goal-id" value="${goalToEdit ? goalToEdit.id : ''}">

          <div class="form-group">
            <label class="form-label">Nama Target Tabungan *</label>
            <input type="text" id="goal-name" class="form-control" placeholder="Contoh: Dana Darurat, Beli Motor, Umroh" value="${goalToEdit ? goalToEdit.name : ''}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Target Nominal (Rp) *</label>
            <input type="number" id="goal-target-amount" class="form-control" placeholder="0" value="${goalToEdit ? goalToEdit.target_amount : ''}" required min="1000">
          </div>

          <div class="form-group">
            <label class="form-label">Saldo Awal Terkumpul (Rp)</label>
            <input type="number" id="goal-current-amount" class="form-control" placeholder="0" value="${goalToEdit ? goalToEdit.current_amount : '0'}">
          </div>

          <div class="form-group">
            <label class="form-label">Target Tanggal Tercapai (Opsional)</label>
            <input type="date" id="goal-target-date" class="form-control" value="${goalToEdit && goalToEdit.target_date ? goalToEdit.target_date.split('T')[0] : ''}">
          </div>

          <div class="form-group">
            <label class="form-label">Warna & Ikon</label>
            <div style="display:flex;gap:10px;">
              <input type="color" id="goal-color" class="form-control" value="${goalToEdit ? goalToEdit.color : '#3b82f6'}" style="width:60px;padding:4px;">
              <select id="goal-icon" class="form-control" style="flex:1;">
                <option value="piggy-bank" ${goalToEdit && goalToEdit.icon === 'piggy-bank' ? 'selected' : ''}>Celengan (Piggy Bank)</option>
                <option value="shield-halved" ${goalToEdit && goalToEdit.icon === 'shield-halved' ? 'selected' : ''}>Perisai (Dana Darurat)</option>
                <option value="car" ${goalToEdit && goalToEdit.icon === 'car' ? 'selected' : ''}>Kendaraan / Mobil</option>
                <option value="house" ${goalToEdit && goalToEdit.icon === 'house' ? 'selected' : ''}>Rumah / Properti</option>
                <option value="laptop" ${goalToEdit && goalToEdit.icon === 'laptop' ? 'selected' : ''}>Gadget / Laptop</option>
                <option value="plane" ${goalToEdit && goalToEdit.icon === 'plane' ? 'selected' : ''}>Liburan / Traveling</option>
                <option value="graduation-cap" ${goalToEdit && goalToEdit.icon === 'graduation-cap' ? 'selected' : ''}>Pendidikan</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Catatan Tambahan</label>
            <textarea id="goal-notes" class="form-control" rows="2" placeholder="Catatan motivasi atau rincian target...">${goalToEdit ? (goalToEdit.notes || '') : ''}</textarea>
          </div>

          <div class="modal-footer" style="padding:0;border:none;margin-top:16px;">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Target</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById("goal-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("goal-id").value;
      const name = document.getElementById("goal-name").value;
      const targetAmount = Number(document.getElementById("goal-target-amount").value);
      const currentAmount = Number(document.getElementById("goal-current-amount").value) || 0;
      const targetDate = document.getElementById("goal-target-date").value;
      const color = document.getElementById("goal-color").value;
      const icon = document.getElementById("goal-icon").value;
      const notes = document.getElementById("goal-notes").value;

      const res = await Storage.saveSavingsGoal({
        id: id || undefined,
        name,
        target_amount: targetAmount,
        current_amount: currentAmount,
        target_date: targetDate || null,
        color,
        icon,
        notes
      });

      if (res.success) {
        Utils.showToast("Target Tabungan berhasil disimpan!", "success");
        Modal.close();
        if (window.renderSavings) window.renderSavings();
      } else {
        Utils.showToast("Gagal menyimpan target: " + res.error, "error");
      }
    });

    modal.classList.add("active");
  },

  /**
   * Open Savings Mutation Modal (Deposit / Withdraw)
   */
  async openSavingsMutationModal(goalId, mutationType = "deposit") {
    const goals = await Storage.getSavingsGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const accounts = await Storage.getAccounts();
    let modal = document.getElementById("universal-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "universal-modal";
      modal.className = "modal-overlay";
      document.body.appendChild(modal);
    }

    const isDeposit = mutationType === "deposit";

    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid ${isDeposit ? 'fa-circle-arrow-up' : 'fa-circle-arrow-down'}" style="color:${isDeposit ? 'var(--success)' : 'var(--warning)'}"></i>
            <span>${isDeposit ? 'Setor Tabungan (Nabung)' : 'Tarik Saldo Tabungan'}</span>
          </div>
          <button class="modal-close" onclick="Modal.close()">&times;</button>
        </div>

        <form id="mutation-form" class="modal-body">
          <div style="background:var(--bg-hover);padding:14px;border-radius:var(--radius-md);margin-bottom:16px;border:1px solid var(--border-color);">
            <div style="font-size:0.82rem;color:var(--text-muted);">Target:</div>
            <div style="font-size:1.1rem;font-weight:700;color:var(--text-primary);">${goal.name}</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:2px;">
              Terkumpul: <strong>${Utils.formatCurrency(goal.current_amount)}</strong> dari target ${Utils.formatCurrency(goal.target_amount)}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Nominal ${isDeposit ? 'Setoran' : 'Penarikan'} (Rp) *</label>
            <input type="number" id="mutation-amount" class="form-control" placeholder="0" required min="1" style="font-size:1.25rem;font-weight:700;">
          </div>

          <div class="form-group">
            <label class="form-label">${isDeposit ? 'Ambil Dana Dari Akun' : 'Transfer Hasil Tarik Ke Akun'} *</label>
            <select id="mutation-account" class="form-control" required>
              ${accounts.map(a => `
                <option value="${a.id}">${a.name} (${Utils.formatCurrencyRaw(a.balance)})</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Tanggal Transaksi</label>
            <input type="date" id="mutation-date" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Catatan</label>
            <input type="text" id="mutation-notes" class="form-control" placeholder="${isDeposit ? 'Nabung rutin bulanan...' : 'Penarikan darurat...'}">
          </div>

          <div class="modal-footer" style="padding:0;border:none;margin-top:16px;">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Batal</button>
            <button type="submit" class="btn ${isDeposit ? 'btn-success' : 'btn-primary'}">
              ${isDeposit ? '<i class="fa-solid fa-plus"></i> Setor Dana' : '<i class="fa-solid fa-arrow-down"></i> Tarik Dana'}
            </button>
          </div>
        </form>
      </div>
    `;

    document.getElementById("mutation-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const amount = Number(document.getElementById("mutation-amount").value);
      const accountId = document.getElementById("mutation-account").value;
      const date = document.getElementById("mutation-date").value;
      const notes = document.getElementById("mutation-notes").value;

      const res = await Storage.addSavingsMutation({
        goalId: goal.id,
        type: mutationType,
        amount: amount,
        accountId: accountId,
        date: date,
        notes: notes
      });

      if (res.success) {
        Utils.showToast(isDeposit ? "Setoran tabungan berhasil disimpan!" : "Penarikan tabungan berhasil!", "success");
        Modal.close();
        if (window.renderSavings) window.renderSavings();
        if (window.renderDashboard) window.renderDashboard();
      } else {
        Utils.showToast("Gagal: " + res.error, "error");
      }
    });

    modal.classList.add("active");
  },

  /**
   * Close any active modal
   */
  close() {
    const modal = document.getElementById("universal-modal");
    if (modal) {
      modal.classList.remove("active");
    }
  }
};