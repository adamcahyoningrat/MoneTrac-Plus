/**
 * MONETRAC - DEBTS & RECEIVABLES PAGE LOGIC
 */

let allDebts = [];
let activeFilter = "all";

async function renderDebts() {
  const [debts, accounts] = await Promise.all([
    Storage.getDebts(),
    Storage.getAccounts()
  ]);
  allDebts = debts || [];

  let totalPayable = 0;
  let totalReceivable = 0;
  let paidCount = 0;

  allDebts.forEach(d => {
    const total = Number(d.total_amount) || 0;
    const paid = Number(d.paid_amount) || 0;
    const remaining = Math.max(0, total - paid);

    if (d.type === "payable") {
      totalPayable += remaining;
    } else {
      totalReceivable += remaining;
    }

    if (d.status === "paid" || remaining <= 0) {
      paidCount++;
    }
  });

  const payableEl = document.getElementById("debts-total-payable");
  const receivableEl = document.getElementById("debts-total-receivable");
  const paidEl = document.getElementById("debts-total-paid");

  if (payableEl) payableEl.innerHTML = Utils.formatCurrency(totalPayable);
  if (receivableEl) receivableEl.innerHTML = Utils.formatCurrency(totalReceivable);
  if (paidEl) paidEl.textContent = `${paidCount} Lunas`;

  const grid = document.getElementById("debts-grid");
  if (!grid) return;

  const filtered = activeFilter === "all" ? allDebts : allDebts.filter(d => d.type === activeFilter);

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon"><i class="fa-solid fa-hand-holding-dollar"></i></div>
        <div class="empty-title">Belum Ada Catatan Hutang / Piutang</div>
        <div class="empty-desc">Catat pinjaman atau tagihan Anda agar keuangan tetap terpantau dengan baik.</div>
        <button class="btn btn-primary" onclick="Modal.openDebtModal()" style="margin-top:12px;">
          <i class="fa-solid fa-plus"></i> Tambah Catatan
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(d => {
    const isPayable = d.type === "payable";
    const total = Number(d.total_amount) || 0;
    const paid = Number(d.paid_amount) || 0;
    const remaining = Math.max(0, total - paid);
    const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
    const isDone = d.status === "paid" || remaining <= 0;

    let dueText = "Tanpa jatuh tempo";
    if (d.due_date) {
      const daysLeft = Math.ceil((new Date(d.due_date) - new Date()) / (1000 * 60 * 60 * 24));
      dueText = daysLeft > 0 ? `${daysLeft} hari lagi` : (daysLeft === 0 ? 'Hari ini!' : 'Lewat tempo');
    }

    return `
      <div class="goal-card card-hover" style="border-left: 4px solid ${isPayable ? '#ef4444' : '#10b981'};">
        <div class="goal-header">
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="goal-icon" style="background:${isPayable ? '#ef444422' : '#10b98122'};color:${isPayable ? '#ef4444' : '#10b981'};">
              <i class="fa-solid ${isPayable ? 'fa-arrow-down-long' : 'fa-arrow-up-long'}"></i>
            </div>
            <div>
              <div class="goal-title">${Utils.escapeHTML(d.person_name)}</div>
              <div style="font-size:0.75rem;font-weight:700;color:${isPayable ? '#ef4444' : '#10b981'};text-transform:uppercase;">
                ${isPayable ? 'Hutang Saya' : 'Piutang Saya'}
              </div>
            </div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-secondary btn-icon btn-sm" onclick='Modal.openDebtModal(${JSON.stringify(d).replace(/'/g, "&apos;")})' title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-danger btn-icon btn-sm" onclick="deleteDebt('${d.id}')" title="Hapus">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div>
          <div class="goal-amounts">
            <div>
              <div style="font-size:0.75rem;color:var(--text-muted);">Sisa Tagihan:</div>
              <span class="goal-current" style="color:${isDone ? 'var(--success)' : 'var(--text-primary)'};">
                ${Utils.formatCurrency(remaining)}
              </span>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.75rem;color:var(--text-muted);">Total:</div>
              <span class="goal-target">${Utils.formatCurrency(total)} (${percent}%)</span>
            </div>
          </div>

          <div class="progress-container" style="margin-top:8px;">
            <div class="progress-bar" style="width:${percent}%;background:${isDone ? 'var(--success)' : (isPayable ? '#ef4444' : '#10b981')};"></div>
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">
            <i class="fa-regular fa-clock"></i> Tempo: ${dueText}
          </div>
        </div>

        <div class="goal-actions" style="margin-top:10px;">
          ${!isDone ? `
            <button class="btn ${isPayable ? 'btn-primary' : 'btn-success'} btn-sm btn-block" onclick="Modal.openDebtPaymentModal('${d.id}')">
              <i class="fa-solid fa-money-bill-wave"></i> ${isPayable ? 'Bayar Cicilan / Lunas' : 'Terima Pelunasan'}
            </button>
          ` : `
            <button class="btn btn-secondary btn-sm btn-block" disabled style="opacity:0.7;">
              <i class="fa-solid fa-check"></i> Sudah Lunas
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

function filterDebts(type) {
  activeFilter = type;
  document.querySelectorAll(".debt-filter-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-filter") === type);
    btn.classList.toggle("btn-primary", btn.getAttribute("data-filter") === type);
    btn.classList.toggle("btn-secondary", btn.getAttribute("data-filter") !== type);
  });
  renderDebts();
}

async function deleteDebt(id) {
  if (confirm("Apakah Anda yakin ingin menghapus catatan hutang/piutang ini?")) {
    const res = await Storage.deleteDebt(id);
    if (res.success) {
      Utils.showToast("Catatan berhasil dihapus!", "success");
      renderDebts();
    } else {
      Utils.showToast("Gagal menghapus: " + res.error, "error");
    }
  }
}

window.renderDebts = renderDebts;
window.filterDebts = filterDebts;
window.deleteDebt = deleteDebt;
