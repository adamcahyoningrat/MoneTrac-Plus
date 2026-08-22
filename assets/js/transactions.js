/**
 * MONETRAC - TRANSACTIONS PAGE LOGIC
 */

let allTransactions = [];
let allAccounts = [];
let allCategories = [];
let currentPage = 1;
const itemsPerPage = 15;

async function renderTransactions() {
  allAccounts = await Storage.getAccounts();
  allCategories = await Storage.getCategories();
  allTransactions = await Storage.getTransactions();

  // Populate Filter Dropdowns safely
  const accFilter = document.getElementById("filter-account");
  if (accFilter && accFilter.options.length <= 1) {
    allAccounts.forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = a.name;
      accFilter.appendChild(opt);
    });
  }

  const catFilter = document.getElementById("filter-category");
  if (catFilter && catFilter.options.length <= 1) {
    allCategories.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.name;
      opt.textContent = c.name;
      catFilter.appendChild(opt);
    });
  }

  applyFiltersAndRender();
}

function applyFiltersAndRender(accounts = null) {
  if (accounts && Array.isArray(accounts) && accounts.length > 0) {
    allAccounts = accounts;
  }
  if (!allAccounts || allAccounts.length === 0) {
    allAccounts = Storage.getCachedAccounts();
  }

  const search = (document.getElementById("search-tx")?.value || "").toLowerCase();
  const typeFilter = document.getElementById("filter-type")?.value || "all";
  const accFilter = document.getElementById("filter-account")?.value || "all";
  const catFilter = document.getElementById("filter-category")?.value || "all";
  const startDate = document.getElementById("filter-start-date")?.value;
  const endDate = document.getElementById("filter-end-date")?.value;

  let filtered = allTransactions.filter(t => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (accFilter !== "all" && (t.account_id !== accFilter && t.to_account_id !== accFilter && t.account !== accFilter && t.toAccount !== accFilter)) return false;
    if (catFilter !== "all" && (t.category_name !== catFilter && t.category !== catFilter)) return false;
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;
    if (search) {
      const desc = (t.description || "").toLowerCase();
      const cat = (t.category_name || t.category || "").toLowerCase();
      if (!desc.includes(search) && !cat.includes(search)) return false;
    }
    return true;
  });

  // Calculate Subtotals
  let totalIncome = 0;
  let totalExpense = 0;
  filtered.forEach(t => {
    if (t.type === "Income") totalIncome += (Number(t.amount) || 0);
    if (t.type === "Expense") totalExpense += (Number(t.amount) || 0);
  });

  const incEl = document.getElementById("filtered-income");
  const expEl = document.getElementById("filtered-expense");
  const cntEl = document.getElementById("filtered-count");

  if (incEl) incEl.innerHTML = Utils.formatCurrency(totalIncome);
  if (expEl) expEl.innerHTML = Utils.formatCurrency(totalExpense);
  if (cntEl) cntEl.textContent = `${filtered.length} Transaksi`;

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const tbody = document.getElementById("tx-tbody");
  if (!tbody) return;

  if (!pageItems.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-icon"><i class="fa-solid fa-receipt"></i></div>
          <div class="empty-title">Tidak Ada Transaksi Ditemukan</div>
          <div class="empty-desc">Coba sesuaikan filter pencarian atau buat transaksi baru.</div>
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = pageItems.map(t => {
      let badgeClass = "badge-expense";
      let amountClass = "amount-expense";
      let sign = "-";
      let icon = "fa-arrow-down";

      if (t.type === "Income") {
        badgeClass = "badge-income";
        amountClass = "amount-income";
        sign = "+";
        icon = "fa-arrow-up";
      } else if (t.type === "Transfer") {
        badgeClass = "badge-transfer";
        amountClass = "amount-transfer";
        sign = "⇄";
        icon = "fa-right-left";
      }

      const acc = allAccounts.find(a => a.id === (t.account_id || t.account));
      const toAcc = allAccounts.find(a => a.id === (t.to_account_id || t.toAccount));
      let accountDisplay = acc ? acc.name : "-";
      if (t.type === "Transfer") {
        accountDisplay = `<span style="color:var(--text-primary);font-weight:600;">${acc ? acc.name : '-'}</span> <i class="fa-solid fa-arrow-right" style="font-size:0.75rem;margin:0 4px;color:var(--transfer);"></i> <span style="color:var(--text-primary);font-weight:600;">${toAcc ? toAcc.name : '-'}</span>`;
      }

      return `
        <tr>
          <td><span style="font-size:0.85rem;color:var(--text-muted);">${Utils.formatDate(t.date, "short")}</span></td>
          <td><span class="badge ${badgeClass}"><i class="fa-solid ${icon}"></i> ${t.type}</span></td>
          <td>${accountDisplay}</td>
          <td><span class="badge badge-account">${Utils.escapeHTML(t.category_name || t.category || '-')}</span></td>
          <td><span style="font-weight:600;color:var(--text-primary);">${Utils.escapeHTML(t.description || '-')}</span></td>
          <td style="text-align:right;">
            <span class="${amountClass}">${sign} ${Utils.formatCurrency(t.amount)}</span>
            ${t.admin_fee ? `<div style="font-size:0.75rem;color:var(--text-muted);">+ Admin: ${Utils.formatCurrency(t.admin_fee)}</div>` : ''}
          </td>
          <td style="text-align:center;">
            <div style="display:flex;gap:6px;justify-content:center;">
              <button class="btn btn-secondary btn-icon btn-sm" onclick="editTransaction('${t.id}')" title="Edit Transaksi">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn btn-danger btn-icon btn-sm" onclick="deleteTransaction('${t.id}')" title="Hapus Transaksi">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Render Pagination Controls
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const container = document.getElementById("tx-pagination");
  if (!container) return;

  container.innerHTML = `
    <button class="btn btn-secondary btn-sm" ${currentPage <= 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
      <i class="fa-solid fa-chevron-left"></i> Sebelumnya
    </button>
    <span style="font-size:0.85rem;color:var(--text-muted);font-weight:600;">Halaman ${currentPage} dari ${totalPages}</span>
    <button class="btn btn-secondary btn-sm" ${currentPage >= totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
      Selanjutnya <i class="fa-solid fa-chevron-right"></i>
    </button>
  `;
}

function changePage(page) {
  currentPage = page;
  applyFiltersAndRender();
}

async function editTransaction(id) {
  const tx = allTransactions.find(t => t.id === id);
  if (tx) {
    Modal.openTransactionModal(tx);
  }
}

async function deleteTransaction(id) {
  if (confirm("Apakah Anda yakin ingin menghapus transaksi ini? Saldo akun akan dikembalikan.")) {
    const res = await Storage.deleteTransaction(id);
    if (res.success) {
      Utils.showToast("Transaksi berhasil dihapus!", "success");
      renderTransactions();
    } else {
      Utils.showToast("Gagal menghapus: " + res.error, "error");
    }
  }
}

function exportTransactionsCSV() {
  const data = allTransactions.map(t => ({
    Tanggal: t.date,
    Tipe: t.type,
    Nominal: t.amount,
    Biaya_Admin: t.admin_fee || 0,
    Kategori: t.category_name || t.category || "",
    Keterangan: t.description || ""
  }));
  Utils.exportToCSV(`Monetrac_Transaksi_${new Date().toISOString().split("T")[0]}.csv`, data);
}

window.renderTransactions = renderTransactions;
window.applyFiltersAndRender = applyFiltersAndRender;
window.onTransactionSaved = () => renderTransactions();
window.onPrivacyChanged = () => applyFiltersAndRender();