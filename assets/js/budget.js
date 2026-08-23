/**
 * MONETRAC - BUDGET MANAGEMENT PAGE LOGIC
 */

let allBudgets = [];

async function renderBudget() {
  const budgets = await Storage.getBudgets();
  const categories = await Storage.getCategories();
  const transactions = await Storage.getTransactions();
  allBudgets = budgets || [];

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let totalBudget = 0;
  let totalSpent = 0;

  const categorySpending = {};
  transactions.forEach(t => {
    const td = new Date(t.date);
    if (t.type === "Expense" && td.getMonth() === currentMonth && td.getFullYear() === currentYear) {
      const cat = t.category_name || t.category || "Lainnya";
      categorySpending[cat] = (categorySpending[cat] || 0) + (Number(t.amount) || 0);
      totalSpent += (Number(t.amount) || 0);
    }
  });

  totalBudget = allBudgets.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  const overallPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const limitEl = document.getElementById("budget-total-limit");
  const spentEl = document.getElementById("budget-total-spent");
  const remEl = document.getElementById("budget-total-remaining");
  const pctEl = document.getElementById("budget-overall-percent");

  if (limitEl) limitEl.innerHTML = Utils.formatCurrency(totalBudget);
  if (spentEl) spentEl.innerHTML = Utils.formatCurrency(totalSpent);
  if (remEl) remEl.innerHTML = Utils.formatCurrency(remainingBudget);
  if (pctEl) pctEl.textContent = `${overallPercent}%`;

  const listContainer = document.getElementById("budget-list");
  if (!listContainer) return;

  if (!allBudgets.length) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-chart-simple"></i></div>
        <div class="empty-title">Belum Ada Anggaran Kategori</div>
        <div class="empty-desc">Buat batas pengeluaran bulanan per kategori agar keuangan tetap terkontrol.</div>
        <button class="btn btn-primary" onclick="Modal.openBudgetModal()" style="margin-top:12px;">
          <i class="fa-solid fa-plus"></i> Buat Anggaran Baru
        </button>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = allBudgets.map(b => {
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
            <button class="btn btn-secondary btn-icon btn-sm" onclick="Modal.openBudgetModal('${b.id}')" title="Edit">
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
