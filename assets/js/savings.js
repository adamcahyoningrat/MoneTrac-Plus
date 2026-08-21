/**
 * MONETRAC - SAVINGS & FINANCIAL GOALS PAGE LOGIC
 */

async function renderSavings() {
  const goals = await Storage.getSavingsGoals();
  const accounts = await Storage.getAccounts();

  // Summary Metrics
  const totalTarget = goals.reduce((acc, g) => acc + (Number(g.target_amount) || 0), 0);
  const totalCollected = goals.reduce((acc, g) => acc + (Number(g.current_amount) || 0), 0);
  const totalRemaining = Math.max(0, totalTarget - totalCollected);
  const totalPercent = totalTarget > 0 ? Math.min(100, Math.round((totalCollected / totalTarget) * 100)) : 0;

  document.getElementById("savings-total-collected").innerHTML = Utils.formatCurrency(totalCollected);
  document.getElementById("savings-total-target").innerHTML = Utils.formatCurrency(totalTarget);
  document.getElementById("savings-total-remaining").innerHTML = Utils.formatCurrency(totalRemaining);
  document.getElementById("savings-total-percent").textContent = `${totalPercent}%`;

  // Render Goal Cards Grid
  const grid = document.getElementById("goals-grid");
  if (!grid) return;

  if (!goals.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon"><i class="fa-solid fa-piggy-bank"></i></div>
        <div class="empty-title">Belum Ada Target Tabungan</div>
        <div class="empty-desc">Buat celengan impian pertama Anda untuk liburan, beli gadget, atau dana darurat!</div>
        <button class="btn btn-primary" onclick="Modal.openSavingsGoalModal()" style="margin-top:12px;">
          <i class="fa-solid fa-plus"></i> Buat Target Tabungan
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = goals.map(g => {
    const current = Number(g.current_amount) || 0;
    const target = Number(g.target_amount) || 1;
    const percent = Math.min(100, Math.round((current / target) * 100));
    const remaining = Math.max(0, target - current);
    const daysLeft = Utils.getDaysRemaining(g.target_date);

    return `
      <div class="goal-card">
        <div class="goal-header">
          <div style="display:flex;align-items:center;gap:14px;">
            <div class="goal-icon" style="background:${g.color || 'var(--primary)'};">
              <i class="fa-solid fa-${g.icon || 'piggy-bank'}"></i>
            </div>
            <div>
              <div class="goal-title">${Utils.escapeHTML(g.name)}</div>
              <div class="goal-deadline">
                ${g.target_date ? `<i class="fa-regular fa-calendar"></i> Target: ${Utils.formatDate(g.target_date, "short")}` : 'Tanpa batas waktu'}
                ${daysLeft !== null ? (daysLeft >= 0 ? ` (${daysLeft} hari lagi)` : ' <span style="color:var(--danger)">(Lewat batas)</span>') : ''}
              </div>
            </div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-secondary btn-icon btn-sm" onclick="editGoal('${g.id}')" title="Edit Target">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-danger btn-icon btn-sm" onclick="deleteGoal('${g.id}')" title="Hapus Target">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div class="progress-container">
          <div class="progress-bar" style="width:${percent}%;background:${g.color || 'var(--primary)'};"></div>
        </div>

        <div class="goal-amounts">
          <div>
            <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Terkumpul</div>
            <div class="goal-current">${Utils.formatCurrency(current)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Target / Sisa</div>
            <div class="goal-target">${Utils.formatCurrency(target)} (${percent}%)</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">Kurang: ${Utils.formatCurrency(remaining)}</div>
          </div>
        </div>

        ${g.notes ? `<div style="font-size:0.82rem;color:var(--text-secondary);background:var(--bg-hover);padding:8px 12px;border-radius:var(--radius-sm);">${Utils.escapeHTML(g.notes)}</div>` : ''}

        <div class="goal-actions">
          <button class="btn btn-success btn-sm btn-block" onclick="Modal.openSavingsMutationModal('${g.id}', 'deposit')">
            <i class="fa-solid fa-circle-plus"></i> Setor (Nabung)
          </button>
          <button class="btn btn-secondary btn-sm btn-block" onclick="Modal.openSavingsMutationModal('${g.id}', 'withdraw')">
            <i class="fa-solid fa-arrow-down"></i> Tarik
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function editGoal(id) {
  const goals = await Storage.getSavingsGoals();
  const g = goals.find(item => item.id === id);
  if (g) Modal.openSavingsGoalModal(g);
}

async function deleteGoal(id) {
  if (confirm("Apakah Anda yakin ingin menghapus target tabungan ini?")) {
    const res = await Storage.deleteSavingsGoal(id);
    if (res.success) {
      Utils.showToast("Target tabungan berhasil dihapus!", "success");
      renderSavings();
    } else {
      Utils.showToast("Gagal menghapus: " + res.error, "error");
    }
  }
}

window.renderSavings = renderSavings;
window.onPrivacyChanged = () => renderSavings();