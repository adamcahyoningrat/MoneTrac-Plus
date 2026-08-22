/**
 * MONETRAC - CATEGORIES PAGE LOGIC
 */

async function renderCategories() {
  const categories = await Storage.getCategories();
  const transactions = await Storage.getTransactions();

  const expenseCategories = categories.filter(c => c.type === "Expense");
  const incomeCategories = categories.filter(c => c.type === "Income");

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
        <button class="btn btn-secondary btn-icon btn-sm" onclick="openCategoryModal('${c.id}')" title="Edit">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-danger btn-icon btn-sm" onclick="deleteCategory('${c.id}')" title="Hapus">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `;
}

function openCategoryModal(catId = null) {
  const categories = Storage.getCachedCategories();
  const catToEdit = catId ? categories.find(c => c.id === catId) : null;

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
    const id = document.getElementById("cat-id").value;
    const name = document.getElementById("cat-name").value;
    const type = document.getElementById("cat-type").value;
    const color = document.getElementById("cat-color").value;
    const icon = document.getElementById("cat-icon").value;

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
      renderCategories();
    } else {
      Utils.showToast("Gagal menyimpan kategori: " + res.error, "error");
    }
  });

  modal.classList.add("active");
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
Modal.openCategoryModal = openCategoryModal;
window.openCategoryModal = openCategoryModal;
