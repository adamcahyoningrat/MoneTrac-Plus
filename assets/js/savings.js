/**
 * MONETRAC - SAVINGS GOALS PAGE LOGIC
 */

let allSavingsGoals = [];

async function renderSavings() {
  const goals = await Storage.getSavingsGoals();
  allSavingsGoals = goals || [];

  const totalCollected = allSavingsGoals.reduce((acc, g) => acc + (Number(g.current_amount) || 0), 0);
  const totalTarget = allSavingsGoals.reduce((acc, g) => acc + (Number(g.target_amount) || 0), 0);
  const totalRemaining = Math.max(0, totalTarget - totalCollected);
  const totalPercent = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  const colEl = document.getElementById("savings-total-collected");
  const tgtEl = document.getElementById("savings-total-target");
  const remEl = document.getElementById("savings-total-remaining");
  const pctEl = document.getElementById("savings-total-percent");

  if (colEl) colEl.innerHTML = Utils.formatCurrency(totalCollected);
  if (tgtEl) tgtEl.innerHTML = Utils.formatCurrency(totalTarget);
  if (remEl) remEl.innerHTML = Utils.formatCurrency(totalRemaining);
  if (pctEl) pctEl.textContent = `${totalPercent}%`;

  const grid = document.getElementById("savings-grid");
  if (!grid) return;

  if (!allSavingsGoals.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon"><i class="fa-solid fa-piggy-bank"></i></div>
        <div class="empty-title">Belum Ada Target Tabungan</div>
        <div class="empty-desc">Mulai rencanakan target impian Anda seperti Dana Darurat, Liburan, atau Kendaraan.</div>
        <button class="btn btn-primary" onclick="Modal.openSavingsGoalModal()" style="margin-top:12px;">
          <i class="fa-solid fa-plus"></i> Buat Target Tabungan
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = allSavingsGoals.map(g => {
    const current = Number(g.current_amount) || 0;
    const target = Number(g.target_amount) || 1;
    const percent = Math.min(100, Math.round((current / target) * 100));
    const isCompleted = current >= target;

    let deadlineText = "Tanpa batas waktu";
    if (g.target_date) {
      const daysLeft = Math.ceil((new Date(g.target_date) - new Date()) / (1000 * 60 * 60 * 24));
      deadlineText = daysLeft > 0 ? `${daysLeft} hari lagi` : (daysLeft === 0 ? 'Hari ini!' : 'Lewat tenggat');
    }

    return `
      <div class="goal-card card-hover">
        <div class="goal-header">
          <div style="display:flex;align-items:center;gap:12px;">
            <div class="goal-icon" style="background:${g.color || 'var(--primary)'};">
              <i class="fa-solid fa-${g.icon || 'piggy-bank'}"></i>
            </div>
            <div>
              <div class="goal-title">${Utils.escapeHTML(g.name)}</div>
              <div class="goal-deadline"><i class="fa-regular fa-clock"></i> ${deadlineText}</div>
            </div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-secondary btn-icon btn-sm" onclick="Modal.openSavingsGoalModal('${g.id}')" title="Edit">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-danger btn-icon btn-sm" onclick="deleteSavingsGoal('${g.id}')" title="Hapus">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div>
          <div class="goal-amounts">
            <span class="goal-current">${Utils.formatCurrency(current)}</span>
            <span class="goal-target">dari ${Utils.formatCurrency(target)} (${percent}%)</span>
          </div>
          <div class="progress-container" style="margin-top:8px;">
            <div class="progress-bar" style="width:${percent}%;background:${isCompleted ? 'var(--success)' : (g.color || 'var(--primary)')};"></div>
          </div>
        </div>

        <div class="goal-actions">
          <button class="btn btn-success btn-sm" onclick="Modal.openSavingsMutationModal('${g.id}', 'deposit')">
            <i class="fa-solid fa-plus"></i> Setor (Nabung)
          </button>
          <button class="btn btn-secondary btn-sm" onclick="Modal.openSavingsMutationModal('${g.id}', 'withdraw')">
            <i class="fa-solid fa-arrow-down"></i> Tarik
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function deleteSavingsGoal(id) {
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
