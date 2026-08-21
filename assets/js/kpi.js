/**
 * MONETRAC - KPI & FINANCIAL HEALTH METRICS
 */

async function renderKPI() {
  const accounts = await Storage.getAccounts();
  const transactions = await Storage.getTransactions();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(t => {
    const d = new Date(t.date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      if (t.type === "Income") totalIncome += (Number(t.amount) || 0);
      if (t.type === "Expense") totalExpense += (Number(t.amount) || 0);
    }
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;
  const expenseRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : (totalExpense > 0 ? 100 : 0);

  const totalBalance = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);
  const runwayMonths = totalExpense > 0 ? (totalBalance / totalExpense).toFixed(1) : "∞";

  // Financial Score Calculation (0-100)
  let healthScore = 50;
  if (savingsRate >= 20) healthScore += 25;
  else if (savingsRate > 0) healthScore += 10;
  else healthScore -= 20;

  if (Number(runwayMonths) >= 3 || runwayMonths === "∞") healthScore += 25;
  else if (Number(runwayMonths) >= 1) healthScore += 10;

  healthScore = Math.max(10, Math.min(100, healthScore));

  document.getElementById("kpi-score").textContent = `${healthScore} / 100`;
  document.getElementById("kpi-savings-rate").textContent = `${savingsRate}%`;
  document.getElementById("kpi-expense-ratio").textContent = `${expenseRatio}%`;
  document.getElementById("kpi-runway").textContent = `${runwayMonths} Bulan`;

  // Dynamic Financial Advice
  const adviceEl = document.getElementById("kpi-advice");
  if (adviceEl) {
    if (healthScore >= 80) {
      adviceEl.innerHTML = `<span style="color:var(--success);font-weight:700;"><i class="fa-solid fa-circle-check"></i> Kondisi Keuangan Sangat Sehat!</span> Rasio tabungan Anda di atas 20% dan dana cadangan Anda mencukupi lebih dari 3 bulan pengeluaran. Pertahankan alokasi investasi dan tabungan rutin Anda.`;
    } else if (healthScore >= 50) {
      adviceEl.innerHTML = `<span style="color:var(--warning);font-weight:700;"><i class="fa-solid fa-triangle-exclamation"></i> Kondisi Keuangan Cukup Stabil.</span> Pengeluaran Anda seimbang dengan pemasukan. Cobalah untuk menekan pengeluaran konsumtif di kategori sekunder agar tabungan bulanan bisa mencapai minimal 20%.`;
    } else {
      adviceEl.innerHTML = `<span style="color:var(--danger);font-weight:700;"><i class="fa-solid fa-circle-xmark"></i> Perlu Perhatian Khusus!</span> Pengeluaran Anda melebihi atau mendekati total pemasukan bulan ini. Segera evaluasi anggaran belanja dan fokus penuhi kebutuhan pokok terlebih dahulu.`;
    }
  }
}

window.renderKPI = renderKPI;
window.onPrivacyChanged = () => renderKPI();