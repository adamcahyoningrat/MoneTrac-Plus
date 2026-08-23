/**
 * MONETRAC - CATEGORIES PAGE LOGIC
 */

let allCategories = [];

async function renderCategories() {
  const categories = await Storage.getCategories();
  const transactions = await Storage.getTransactions();
  allCategories = categories || [];

  const expenseCategories = allCategories.filter(c => c.type === "Expense");
  const incomeCategories = allCategories.filter(c => c.type === "Income");

  const expCount = document.getElementById("cat-expense-count");
  const incCount = document.getElementById("cat-income-count");
  if (expCount) expCount.textContent = `${expenseCategories.length} Kategori`;
  if (incCount) incCount.textContent = `${incomeCategories.length} Kategori`;

  const expenseGrid = document.getElementById("categories-expense-grid");
  const incomeGrid = document.getElementById("categories-income-grid");

  if (expenseGrid) {
    expenseGrid.innerHTML = expenseCategories.map(c => renderCategoryCard(c, transactions)).join('');
  }

  if (incomeGrid) {
    incomeGrid.innerHTML = incomeCategories.map(c => renderCategoryCard(c, transactions)).join('');
  }
}

function renderCategoryCard(c, transactions) {
  const count = transactions.filter(t => (t.category_name === c.name || t.category === c.name)).length;
  return `
    <div class="card card-hover" style="display:flex;align-items:center;justify-content:space-between;padding:16px;">
      <div style="display:flex;align-items:center;gap:14px;">
        <div style="width:42px;height:42px;border-radius:var(--radius-md);background:${c.color}22;color:${c.color};display:flex;align-items:center;justify-content:center;font-size:1.2rem;">
          <i class="fa-solid fa-${c.icon || 'tag'}"></i>
        </div>
        <div>
          <div style="font-weight:700;font-size:0.98rem;color:var(--text-primary);">${Utils.escapeHTML(c.name)}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);">${count} transaksi</div>
        </div>
      </div>
      <div style="display:flex;gap:4px;">
        <button class="btn btn-secondary btn-icon btn-sm" onclick="Modal.openCategoryModal('${c.id}')" title="Edit">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-danger btn-icon btn-sm" onclick="deleteCategory('${c.id}')" title="Hapus">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `;
}

async function deleteCategory(id) {
  if (confirm("Apakah Anda yakin ingin menghapus kategori ini?")) {
    const res = await Storage.deleteCategory(id);
    if (res.success) {
      Utils.showToast("Kategori berhasil dihapus!", "success");
      renderCategories();
    } else {
      Utils.showToast("Gagal menghapus: " + res.error, "error");
    }
  }
}

window.renderCategories = renderCategories;
