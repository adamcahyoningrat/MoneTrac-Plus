/**
 * MONETRAC - BUDGET MANAGEMENT PAGE LOGIC
 */

async function renderBudget() {
  const budgets = await Storage.getBudgets();
  const categories = await Storage.getCategories();
  const transactions = await Storage.getTransactions();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let totalBudget = 0;
  let totalSpent = 0;

  // Calculate actual spending for each category in current month
  const categorySpending = {};
  transactions.forEach(t => {
    const td = new Date(t.date);
    if (t.type === "Expense" && td.getMonth() === currentMonth && td.getFullYear() === currentYear) {
      const cat = t.category_name || t.category || "Lainnya";
      categorySpending[cat] = (categorySpending[cat] || 0) + (Number(t.amount) || 0);
      totalSpent += (Number(t.amount) || 0);
    }
  });

  totalBudget = budgets.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  const overallPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  document.getElementById("budget-total-limit").innerHTML = Utils.formatCurrency(totalBudget);
  document.getElementById("budget-total-spent").innerHTML = Utils.formatCurrency(totalSpent);
  document.getElementById("budget-total-remaining").innerHTML = Utils.formatCurrency(remainingBudget);
  document.getElementById("budget-overall-percent").textContent = `${overallPercent}%`;

  const listContainer = document.getElementById("budget-list");
  if (!listContainer) return;

  if (!budgets.length) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-chart-simple"></i></div>
        <div class="empty-title">Belum Ada Anggaran Kategori</div>
        <div class="empty-desc">Buat batas pengeluaran bulanan per kategori agar keuangan tetap terkontrol.</div>
        <button class="btn btn-primary" onclick="openBudgetModal()" style="margin-top:12px;">
          <i class="fa-solid fa-plus"></i> Buat Anggaran Baru
        </button>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = budgets.map(b => {
    const catName = b.category_name || b.category;
    const spent = categorySpending[catName] || 0;
    const limit = Number(b.amount) || 1;
    const percent = Math.round((spent / limit) * 100);
    const isOver = spent > limit;
    const remaining = limit - spent;

    return `
      <div class="card" style="padding:20px;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="font-weight:700;font-size:1.05rem;color:var(--text-primary);">${Utils.escapeHTML(catName)}</div>
            ${isOver ? `<span class="badge badge-expense"><i class="fa-solid fa-triangle-exclamation"></i> Overbudget (+${Utils.formatCurrency(spent - limit)})</span>` : ''}
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-secondary btn-icon btn-sm" onclick="openBudgetModal('${b.id}')" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-danger btn-icon btn-sm" onclick="deleteBudget('${b.id}')" title="Hapus">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="progress-container" style="height:10px;">
          <div class="progress-bar" style="width:${Math.min(100, percent)}%;background:${isOver ? 'var(--danger)' : (percent > 80 ? 'var(--warning)' : 'var(--primary)')};"></div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.88rem;">
          <div>
            <span style="color:var(--text-muted);">Terpakai: </span>
            <span style="font-weight:700;color:${isOver ? 'var(--danger)' : 'var(--text-primary)'};">${Utils.formatCurrency(spent)}</span>
            <span style="color:var(--text-muted);"> / Batas: ${Utils.formatCurrency(limit)}</span>
          </div>
          <div style="font-weight:700;color:${isOver ? 'var(--danger)' : 'var(--text-secondary)'};">
            ${isOver ? `Melebihi ${percent}%` : `Sisa ${Utils.formatCurrency(remaining)} (${100 - percent}%)`}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function openBudgetModal(budgetId = null) {
  const categories = await Storage.getCategories();
  const expenseCategories = categories.filter(c => c.type === "Expense");

  let budgetToEdit = null;
  if (budgetId) {
    const budgets = await Storage.getBudgets();
    budgetToEdit = budgets.find(b => b.id === budgetId);
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
          <i class="fa-solid fa-chart-simple" style="color:var(--primary)"></i>
          <span>${budgetToEdit ? 'Edit Anggaran' : 'Atur Anggaran Bulanan'}</span>
        </div>
        <button class="modal-close" onclick="Modal.close()">&times;</button>
      </div>

      <form id="budget-form" class="modal-body">
        <input type="hidden" id="budget-id" value="${budgetToEdit ? budgetToEdit.id : ''}">

        <div class="form-group">
          <label class="form-label">Kategori Pengeluaran *</label>
          <select id="budget-category" class="form-control" required>
            ${expenseCategories.map(c => `
              <option value="${c.name}" ${budgetToEdit && (budgetToEdit.category_name === c.name || budgetToEdit.category === c.name) ? 'selected' : ''}>
                ${c.name}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Batas Anggaran Bulanan (Rp) *</label>
          <input type="number" id="budget-amount" class="form-control" placeholder="0" value="${budgetToEdit ? budgetToEdit.amount : ''}" required min="1000" style="font-size:1.2rem;font-weight:700;">
        </div>

        <div class="modal-footer" style="padding:0;border:none;margin-top:16px;">
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

    if (res.success) {
      Utils.showToast("Anggaran berhasil disimpan!", "success");
      Modal.close();
      renderBudget();
    } else {
      Utils.showToast("Gagal menyimpan: " + res.error, "error");
    }
  });

  modal.classList.add("active");
}

async function deleteBudget(id) {
  if (confirm("Apakah Anda yakin ingin menghapus anggaran kategori ini?")) {
    const res = await Storage.deleteBudget(id);
    if (res.success) {
      Utils.showToast("Anggaran berhasil dihapus!", "success");
      renderBudget();
    } else {
      Utils.showToast("Gagal menghapus: " + res.error, "error");
    }
  }
}

window.renderBudget = renderBudget;
window.onPrivacyChanged = () => renderBudget();