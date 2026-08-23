/**
 * MONETRAC - MASTER UNIVERSAL MODAL COMPONENT (100% INSTANT 0MS POPUP FOR ALL FEATURES)
 */

const Modal = {
  activeTransactionType: "Expense",

  // --------------------------------------------------------------------------
  // 1. TRANSACTION MODAL (EXPENSE, INCOME, TRANSFER)
  // --------------------------------------------------------------------------
  openTransactionModal(txToEdit = null) {
    let modal = document.getElementById("universal-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "universal-modal";
      modal.className = "modal-overlay";
      document.body.appendChild(modal);
    }

    this.activeTransactionType = txToEdit ? txToEdit.type : "Expense";
    const isEdit = !!txToEdit;
    const currentAccounts = Storage._accounts.length ? Storage._accounts : [
      { id: "acc_1", name: "Cash / Tunai", balance: 0 },
      { id: "acc_2", name: "Rekening Bank", balance: 0 },
      { id: "acc_3", name: "E-Wallet", balance: 0 }
    ];
    const currentCategories = Storage._categories.length ? Storage._categories : [
      { name: "Food & Beverage", type: "Expense" },
      { name: "Transportation Exp", type: "Expense" },
      { name: "Shopping & Olshop", type: "Expense" },
      { name: "Salary / Gaji", type: "Income" },
      { name: "Freelance Fee", type: "Income" }
    ];

    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid fa-money-bill-transfer" style="color:var(--primary)"></i>
            <span>${isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}</span>
          </div>
          <button class="modal-close" onclick="Modal.close()">&times;</button>
        </div>

        <form id="tx-form" class="modal-form-wrapper">
          <input type="hidden" id="tx-id" value="${txToEdit ? txToEdit.id : ''}">

          <div class="modal-body">
            <!-- Type Switcher -->
            <div class="type-tabs" style="display:flex;background:var(--bg-input,#f1f5f9);border-radius:12px;padding:4px;gap:4px;border:1px solid var(--border-color,#e2e8f0);">
              <button type="button" class="type-tab-btn tab-expense ${this.activeTransactionType === 'Expense' ? 'active' : ''}" data-type="Expense" style="flex:1;padding:9px 8px;border:none;outline:none;font-weight:700;font-size:0.85rem;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                <i class="fa-solid fa-arrow-down-long"></i> Pengeluaran
              </button>
              <button type="button" class="type-tab-btn tab-income ${this.activeTransactionType === 'Income' ? 'active' : ''}" data-type="Income" style="flex:1;padding:9px 8px;border:none;outline:none;font-weight:700;font-size:0.85rem;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                <i class="fa-solid fa-arrow-up-long"></i> Pemasukan
              </button>
              <button type="button" class="type-tab-btn tab-transfer ${this.activeTransactionType === 'Transfer' ? 'active' : ''}" data-type="Transfer" style="flex:1;padding:9px 8px;border:none;outline:none;font-weight:700;font-size:0.85rem;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                <i class="fa-solid fa-right-left"></i> Transfer
              </button>
            </div>

            <!-- Transfer Preview Box -->
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
                ${currentAccounts.map(a => `
                  <option value="${a.id}" ${txToEdit && (txToEdit.account_id === a.id || txToEdit.account === a.id) ? 'selected' : ''}>
                    ${a.name} (${Utils.formatCurrencyRaw(a.balance)})
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group" id="group-target-account" style="display: ${this.activeTransactionType === 'Transfer' ? 'flex' : 'none'};">
              <label class="form-label">Transfer Ke Akun (Tujuan) *</label>
              <select id="tx-to-account" class="form-control">
                ${currentAccounts.map((a, idx) => `
                  <option value="${a.id}" ${txToEdit && (txToEdit.to_account_id === a.id || txToEdit.toAccount === a.id) ? 'selected' : (idx === 1 ? 'selected' : '')}>
                    ${a.name} (${Utils.formatCurrencyRaw(a.balance)})
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group" id="group-admin-fee" style="display: ${this.activeTransactionType === 'Transfer' ? 'flex' : 'none'};">
              <label class="form-label">Biaya Admin Transfer (Opsional)</label>
              <input type="number" id="tx-admin-fee" class="form-control" placeholder="Contoh: 2500" value="${txToEdit && txToEdit.admin_fee ? txToEdit.admin_fee : ''}">
            </div>

            <div class="form-group" id="group-category" style="display: ${this.activeTransactionType !== 'Transfer' ? 'flex' : 'none'};">
              <label class="form-label">Kategori *</label>
              <select id="tx-category" class="form-control">
                <!-- Populated dynamically -->
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="tx-date">Tanggal Transaksi *</label>
              <input type="date" id="tx-date" class="form-control" value="${txToEdit ? (txToEdit.date ? txToEdit.date.split('T')[0] : '') : new Date().toISOString().split('T')[0]}" required>
            </div>

            <div class="form-group">
              <label class="form-label" for="tx-desc">Catatan / Keterangan</label>
              <input type="text" id="tx-desc" class="form-control" placeholder="Contoh: Beli Makan Siang, Gaji Bulanan, dsb." value="${txToEdit ? (txToEdit.description || '') : ''}">
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Batal</button>
            <button type="submit" class="btn btn-primary" id="btn-submit-tx">
              <i class="fa-solid fa-check"></i> Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    `;

    this.renderCategoryOptions(currentCategories, txToEdit ? (txToEdit.category_name || txToEdit.category) : null);
    this.bindTransactionFormEvents(currentAccounts, currentCategories);
    
    // INSTANT DISPLAY (0ms)
    modal.classList.add("active");

    // Asynchronously refresh accounts/categories in background
    Promise.all([Storage.getAccounts(), Storage.getCategories()]).then(([freshAcc, freshCat]) => {
      const accSelect = document.getElementById("tx-account");
      const toAccSelect = document.getElementById("tx-to-account");
      if (accSelect && freshAcc.length > 0) {
        const cur = accSelect.value;
        accSelect.innerHTML = freshAcc.map(a => `<option value="${a.id}" ${cur === a.id ? 'selected' : ''}>${a.name} (${Utils.formatCurrencyRaw(a.balance)})</option>`).join('');
      }
      if (toAccSelect && freshAcc.length > 0) {
        const cur = toAccSelect.value;
        toAccSelect.innerHTML = freshAcc.map(a => `<option value="${a.id}" ${cur === a.id ? 'selected' : ''}>${a.name} (${Utils.formatCurrencyRaw(a.balance)})</option>`).join('');
      }
      if (freshCat.length > 0) {
        this.renderCategoryOptions(freshCat, txToEdit ? (txToEdit.category_name || txToEdit.category) : null);
      }
      this.updateTransferPreview(freshAcc);
    }).catch(e => console.warn(e));
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
          this.updateTransferPreview(Storage._accounts.length ? Storage._accounts : accounts);
        } else {
          targetGroup.style.display = "none";
          adminFeeGroup.style.display = "none";
          catGroup.style.display = "flex";
          previewBox.style.display = "none";
          labelSource.textContent = this.activeTransactionType === "Income" ? "Akun Penerima *" : "Akun Sumber *";
          this.renderCategoryOptions(Storage._categories.length ? Storage._categories : categories);
        }
      });
    });

    document.getElementById("tx-account")?.addEventListener("change", () => this.updateTransferPreview(Storage._accounts.length ? Storage._accounts : accounts));
    document.getElementById("tx-to-account")?.addEventListener("change", () => this.updateTransferPreview(Storage._accounts.length ? Storage._accounts : accounts));

    const form = document.getElementById("tx-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("tx-id")?.value;
      const amount = Number(document.getElementById("tx-amount")?.value) || 0;
      const accountId = document.getElementById("tx-account")?.value;
      const toAccountId = document.getElementById("tx-to-account")?.value;
      const adminFee = Number(document.getElementById("tx-admin-fee")?.value) || 0;
      const categoryName = document.getElementById("tx-category")?.value;
      const date = document.getElementById("tx-date")?.value || new Date().toISOString().split("T")[0];
      const desc = document.getElementById("tx-desc")?.value || "";

      if (this.activeTransactionType === "Transfer" && accountId === toAccountId) {
        Utils.showToast("Akun tujuan tidak boleh sama dengan akun asal transfer!", "error");
        return;
      }

      const submitBtn = document.getElementById("btn-submit-tx");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...`;
      }

      try {
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
        Modal.close();

        if (res.success) {
          Utils.showToast("Transaksi berhasil disimpan!", "success");
          if (typeof renderTransactions === "function") renderTransactions();
          if (typeof renderDashboard === "function") renderDashboard();
          if (typeof renderAccounts === "function") renderAccounts();
        } else {
          Utils.showToast("Gagal menyimpan transaksi: " + (res.error || "Terjadi kesalahan"), "error");
        }
      } catch (err) {
        console.error("Save transaction error:", err);
        Utils.showToast("Terjadi galat: " + err.message, "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<i class="fa-solid fa-check"></i> Simpan Transaksi`;
        }
      }
    });
  },

  // --------------------------------------------------------------------------
  // 2. ACCOUNT MODAL (AKUN & DOMPET)
  // --------------------------------------------------------------------------
  openAccountModal(accId = null) {
    let modal = document.getElementById("universal-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "universal-modal";
      modal.className = "modal-overlay";
      document.body.appendChild(modal);
    }

    const currentAccounts = Storage._accounts || [];
    const accToEdit = accId ? currentAccounts.find(a => a.id === accId) : null;

    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid fa-wallet" style="color:var(--primary)"></i>
            <span>${accToEdit ? 'Edit Akun / Dompet' : 'Tambah Akun Baru'}</span>
          </div>
          <button class="modal-close" onclick="Modal.close()">&times;</button>
        </div>

        <form id="account-form" class="modal-form-wrapper">
          <div class="modal-body">
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
          </div>

          <div class="modal-footer">
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

      Modal.close();
      if (res.success) {
        Utils.showToast("Akun berhasil disimpan!", "success");
        if (typeof renderAccounts === "function") renderAccounts();
      } else {
        Utils.showToast("Gagal menyimpan akun: " + res.error, "error");
      }
    });

    modal.classList.add("active");
  },

  // --------------------------------------------------------------------------
  // 3. CATEGORY MODAL (KATEGORI TRANSAKSI)
  // --------------------------------------------------------------------------
  openCategoryModal(catId = null) {
    let modal = document.getElementById("universal-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "universal-modal";
      modal.className = "modal-overlay";
      document.body.appendChild(modal);
    }

    const currentCategories = Storage._categories || [];
    const catToEdit = catId ? currentCategories.find(c => c.id === catId) : null;

    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid fa-tags" style="color:var(--primary)"></i>
            <span>${catToEdit ? 'Edit Kategori' : 'Tambah Kategori Baru'}</span>
          </div>
          <button class="modal-close" onclick="Modal.close()">&times;</button>
        </div>

        <form id="category-form" class="modal-form-wrapper">
          <div class="modal-body">
            <input type="hidden" id="cat-id" value="${catToEdit ? catToEdit.id : ''}">

            <div class="form-group">
              <label class="form-label">Nama Kategori *</label>
              <input type="text" id="cat-name" class="form-control" placeholder="Contoh: Makanan, Transportasi, Gaji" value="${catToEdit ? catToEdit.name : ''}" required>
            </div>

            <div class="form-group">
              <label class="form-label">Tipe Transaksi *</label>
              <select id="cat-type" class="form-control" required>
                <option value="Expense" ${catToEdit && catToEdit.type === 'Expense' ? 'selected' : ''}>Pengeluaran (Expense)</option>
                <option value="Income" ${catToEdit && catToEdit.type === 'Income' ? 'selected' : ''}>Pemasukan (Income)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Warna & Ikon</label>
              <div style="display:flex;gap:10px;">
                <input type="color" id="cat-color" class="form-control" value="${catToEdit ? catToEdit.color : '#2563eb'}" style="width:60px;padding:4px;">
                <select id="cat-icon" class="form-control" style="flex:1;">
                  <option value="tag" ${catToEdit && catToEdit.icon === 'tag' ? 'selected' : ''}>Tag / Label</option>
                  <option value="utensils" ${catToEdit && catToEdit.icon === 'utensils' ? 'selected' : ''}>Makanan & Minuman</option>
                  <option value="car" ${catToEdit && catToEdit.icon === 'car' ? 'selected' : ''}>Transportasi / Bensin</option>
                  <option value="wifi" ${catToEdit && catToEdit.icon === 'wifi' ? 'selected' : ''}>Internet & Kuota</option>
                  <option value="bolt" ${catToEdit && catToEdit.icon === 'bolt' ? 'selected' : ''}>Listrik & Utilitas</option>
                  <option value="cart-shopping" ${catToEdit && catToEdit.icon === 'cart-shopping' ? 'selected' : ''}>Belanja / Olshop</option>
                  <option value="briefcase" ${catToEdit && catToEdit.icon === 'briefcase' ? 'selected' : ''}>Gaji / Pekerjaan</option>
                  <option value="laptop" ${catToEdit && catToEdit.icon === 'laptop' ? 'selected' : ''}>Freelance / Projek</option>
                  <option value="gift" ${catToEdit && catToEdit.icon === 'gift' ? 'selected' : ''}>Hadiah & Hiburan</option>
                  <option value="receipt" ${catToEdit && catToEdit.icon === 'receipt' ? 'selected' : ''}>Biaya Admin Bank</option>
                </select>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Kategori</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById("category-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("cat-id")?.value;
      const name = document.getElementById("cat-name")?.value;
      const type = document.getElementById("cat-type")?.value;
      const color = document.getElementById("cat-color")?.value;
      const icon = document.getElementById("cat-icon")?.value;

      try {
        const res = await Storage.saveCategory({
          id: id || undefined,
          name,
          type,
          color,
          icon
        });

        Modal.close();
        if (res.success) {
          Utils.showToast("Kategori berhasil disimpan!", "success");
          if (typeof renderCategories === "function") renderCategories();
        } else {
          Utils.showToast("Gagal menyimpan kategori: " + res.error, "error");
        }
      } catch (err) {
        console.error("Save category error:", err);
        Utils.showToast("Terjadi galat: " + err.message, "error");
      }
    });

    modal.classList.add("active");
  },

  // --------------------------------------------------------------------------
  // 4. BUDGET MODAL (ANGGARAN BULANAN)
  // --------------------------------------------------------------------------
  openBudgetModal(budgetId = null) {
    let modal = document.getElementById("universal-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "universal-modal";
      modal.className = "modal-overlay";
      document.body.appendChild(modal);
    }

    const currentCategories = Storage._categories.length ? Storage._categories : [
      { name: "Food & Beverage", type: "Expense" },
      { name: "Transportation Exp", type: "Expense" },
      { name: "Internet & Kuota", type: "Expense" },
      { name: "Electricity / Listrik", type: "Expense" },
      { name: "Shopping & Olshop", type: "Expense" },
      { name: "Other Exp", type: "Expense" }
    ];
    const expenseCategories = currentCategories.filter(c => c.type === "Expense");
    const currentBudgets = Storage._budgets || [];
    const budgetToEdit = budgetId ? currentBudgets.find(b => b.id === budgetId) : null;

    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">
            <i class="fa-solid fa-chart-simple" style="color:var(--primary)"></i>
            <span>${budgetToEdit ? 'Edit Anggaran' : 'Atur Anggaran Bulanan'}</span>
          </div>
          <button class="modal-close" onclick="Modal.close()">&times;</button>
        </div>

        <form id="budget-form" class="modal-form-wrapper">
          <div class="modal-body">
            <input type="hidden" id="budget-id" value="${budgetToEdit ? budgetToEdit.id : ''}">

            <div class="form-group">
              <label class="form-label">Kategori Pengeluaran *</label>
              <select id="budget-category" class="form-control" required>
                ${expenseCategories.map(c => `
                  <option value="${c.name}" ${budgetToEdit && (budgetToEdit.category_name === c.name || budgetToEdit.category === c.name) ? 'selected' : ''}>
                    ${c.name}
                  </option>
                `).join('') || '<option value="Food & Beverage">Food & Beverage</option><option value="Transportation Exp">Transportation Exp</option><option value="Shopping & Olshop">Shopping & Olshop</option>'}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Batas Anggaran Bulanan (Rp) *</label>
              <input type="number" id="budget-amount" class="form-control" placeholder="0" value="${budgetToEdit ? budgetToEdit.amount : ''}" required min="1000" style="font-size:1.2rem;font-weight:700;">
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="Modal.close()">Batal</button>
            <button type="submit" class="btn btn-primary">Simpan Anggaran</button>
          </div>
        </form>
      </div>
    `;

    document.getElementById("budget-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("budget-id").value;
      const catName = document.getElementById("budget-category").value;
      const amount = Number(document.getElementById("budget-amount").value);

      const res = await Storage.saveBudget({
        id: id || undefined,
        category_name: catName,
        amount
      });

      Modal.close();
      if (res.success) {
        Utils.showToast("Anggaran berhasil disimpan!", "success");
        if (typeof renderBudget === "function") renderBudget();
      } else {
        Utils.showToast("Gagal menyimpan: " + res.error, "error");
      }
    });

    modal.classList.add("active");

    // Refresh categories in background
    Storage.getCategories().then(freshCats => {
      const catSelect = document.getElementById("budget-category");
      if (catSelect && freshCats.length > 0) {
        const expCats = freshCats.filter(c => c.type === "Expense");
        if (expCats.length > 0) {
          const curVal = catSelect.value;
          catSelect.innerHTML = expCats.map(c => `<option value="${c.name}" ${curVal === c.name ? 'selected' : ''}>${c.name}</option>`).join('');
        }
      }
    }).catch(e => console.warn(e));
  },

  // --------------------------------------------------------------------------
  // 5. SAVINGS MODAL
  // --------------------------------------------------------------------------
  openSavingsGoalModal(goalToEdit = null) {
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

        <form id="goal-form" class="modal-form-wrapper">
          <input type="hidden" id="goal-id" value="${goalToEdit ? goalToEdit.id : ''}">

          <div class="modal-body">
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
                <input type="color" id="goal-color" class="form-control" value="${goalToEdit ? goalToEdit.color : '#0891b2'}" style="width:60px;padding:4px;">
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
          </div>

          <div class="modal-footer">
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

      Modal.close();
      if (res.success) {
        Utils.showToast("Target Tabungan berhasil disimpan!", "success");
        if (typeof renderSavings === "function") renderSavings();
      } else {
        Utils.showToast("Gagal menyimpan target: " + res.error, "error");
      }
    });

    modal.classList.add("active");
  },

  openSavingsMutationModal(goalId, mutationType = "deposit") {
    let modal = document.getElementById("universal-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "universal-modal";
      modal.className = "modal-overlay";
      document.body.appendChild(modal);
    }

    const currentGoals = Storage._savings || [];
    const currentAccounts = Storage._accounts || [];
    const goal = currentGoals.find(g => g.id === goalId) || { id: goalId, name: "Tabungan", current_amount: 0, target_amount: 0 };
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

        <form id="mutation-form" class="modal-form-wrapper">
          <div class="modal-body">
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
                ${currentAccounts.map(a => `
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
          </div>

          <div class="modal-footer">
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

      Modal.close();
      if (res.success) {
        Utils.showToast(isDeposit ? "Setoran tabungan berhasil disimpan!" : "Penarikan tabungan berhasil!", "success");
        if (typeof renderSavings === "function") renderSavings();
        if (typeof renderDashboard === "function") renderDashboard();
      } else {
        Utils.showToast("Gagal: " + res.error, "error");
      }
    });

    modal.classList.add("active");
  },

  close() {
    const modal = document.getElementById("universal-modal");
    if (modal) {
      modal.classList.remove("active");
    }
  }
};

// Global Handlers attached everywhere
window.openTransactionModal = (tx) => Modal.openTransactionModal(tx);
window.openAccountModal = (id) => Modal.openAccountModal(id);
window.openCategoryModal = (id) => Modal.openCategoryModal(id);
window.openBudgetModal = (id) => Modal.openBudgetModal(id);
window.openSavingsGoalModal = (g) => Modal.openSavingsGoalModal(g);
window.openSavingsMutationModal = (id, type) => Modal.openSavingsMutationModal(id, type);
window.closeModal = () => Modal.close();
