/**
 * MONETRAC - DASHBOARD PAGE LOGIC (WITH RESPONSIVE CHARTS & WIDGETS)
 */

let cashflowChart = null;
let categoryChart = null;

async function renderDashboard() {
  const accounts = await Storage.getAccounts();
  const transactions = await Storage.getTransactions();
  const savingsGoals = await Storage.getSavingsGoals();

  // 1. Calculate KPI values
  const totalBalance = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let monthlyIncome = 0;
  let monthlyExpense = 0;
  let monthlyTransfer = 0;

  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  currentMonthTx.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === "Income") monthlyIncome += amt;
    else if (t.type === "Expense") monthlyExpense += amt;
    else if (t.type === "Transfer") monthlyTransfer += amt;
  });

  const netSavings = monthlyIncome - monthlyExpense;

  // 2. Render Stat Cards
  document.getElementById("stat-total-balance").innerHTML = Utils.formatCurrency(totalBalance);
  document.getElementById("stat-monthly-income").innerHTML = Utils.formatCurrency(monthlyIncome);
  document.getElementById("stat-monthly-expense").innerHTML = Utils.formatCurrency(monthlyExpense);
  document.getElementById("stat-net-savings").innerHTML = Utils.formatCurrency(netSavings);

  // 3. Render Recent Transactions Table
  const tbody = document.getElementById("recent-tx-tbody");
  if (tbody) {
    const recent = transactions.slice(0, 7);
    if (!recent.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">
            <div class="empty-icon"><i class="fa-solid fa-receipt"></i></div>
            <div class="empty-title">Belum Ada Transaksi</div>
            <div class="empty-desc">Mulai catat transaksi pertama Anda dengan tombol Transaksi Baru.</div>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = recent.map(t => {
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

        const acc = accounts.find(a => a.id === (t.account_id || t.account));
        const toAcc = accounts.find(a => a.id === (t.to_account_id || t.toAccount));
        let accountDisplay = acc ? acc.name : "Akun";
        if (t.type === "Transfer" && toAcc) {
          accountDisplay = `${acc ? acc.name : '-'} ➔ ${toAcc.name}`;
        }

        return `
          <tr>
            <td>
              <div style="font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${Utils.escapeHTML(t.description || t.category_name || t.category || t.type)}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${Utils.formatDate(t.date, "short")}</div>
            </td>
            <td>
              <span class="badge ${badgeClass}"><i class="fa-solid ${icon}"></i> ${t.type}</span>
            </td>
            <td>
              <span style="font-size:0.82rem;color:var(--text-secondary);white-space:nowrap;">${accountDisplay}</span>
            </td>
            <td>
              <span style="font-size:0.82rem;color:var(--text-secondary);white-space:nowrap;">${Utils.escapeHTML(t.category_name || t.category || '-')}</span>
            </td>
            <td style="text-align:right;">
              <span class="${amountClass}">
                ${sign} ${Utils.formatCurrency(t.amount)}
              </span>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 4. Render Accounts Quick Widget
  const accWidget = document.getElementById("dashboard-accounts-list");
  if (accWidget) {
    accWidget.innerHTML = accounts.map(a => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:var(--radius-md);background:var(--bg-hover);border:1px solid var(--border-color);gap:8px;">
        <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
          <div style="width:34px;height:34px;border-radius:var(--radius-sm);background:${a.color}22;color:${a.color};display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">
            <i class="fa-solid fa-${a.icon || 'wallet'}"></i>
          </div>
          <div style="min-width:0;">
            <div style="font-weight:600;font-size:0.88rem;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.escapeHTML(a.name)}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);">${a.type}</div>
          </div>
        </div>
        <div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);flex-shrink:0;">
          ${Utils.formatCurrency(a.balance)}
        </div>
      </div>
    `).join('') || `<div style="color:var(--text-muted);font-size:0.82rem;text-align:center;">Belum ada akun</div>`;
  }

  // 5. Render Savings Goals Widget
  const savingsWidget = document.getElementById("dashboard-savings-list");
  if (savingsWidget) {
    if (!savingsGoals.length) {
      savingsWidget.innerHTML = `<div style="color:var(--text-muted);font-size:0.82rem;text-align:center;padding:10px;">Belum ada target tabungan. <a href="savings.html">Buat target</a></div>`;
    } else {
      savingsWidget.innerHTML = savingsGoals.slice(0, 3).map(g => {
        const percent = Math.min(100, Math.round(((Number(g.current_amount) || 0) / (Number(g.target_amount) || 1)) * 100));
        return `
          <div style="padding:10px 12px;border-radius:var(--radius-md);background:var(--bg-hover);border:1px solid var(--border-color);display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
              <span style="font-weight:600;font-size:0.88rem;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.escapeHTML(g.name)}</span>
              <span style="font-size:0.78rem;font-weight:700;color:var(--primary);flex-shrink:0;">${percent}%</span>
            </div>
            <div class="progress-container" style="height:6px;">
              <div class="progress-bar" style="width:${percent}%;background:${g.color || 'var(--primary)'};"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted);">
              <span>${Utils.formatCurrency(g.current_amount)}</span>
              <span>Target: ${Utils.formatCurrency(g.target_amount)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // 6. Render Responsive Charts
  renderCharts(transactions);
}

function renderCharts(transactions) {
  const isMobile = window.innerWidth < 768;

  // Monthly Cashflow (Last 6 Months)
  const monthLabels = [];
  const incomeData = [];
  const expenseData = [];

  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    monthLabels.push(d.toLocaleDateString("id-ID", { month: "short" }));

    let inc = 0;
    let exp = 0;
    transactions.forEach(t => {
      const td = new Date(t.date);
      if (td.getMonth() === m && td.getFullYear() === y) {
        if (t.type === "Income") inc += (Number(t.amount) || 0);
        if (t.type === "Expense") exp += (Number(t.amount) || 0);
      }
    });
    incomeData.push(inc);
    expenseData.push(exp);
  }

  const ctxCashflow = document.getElementById("cashflowChart");
  if (ctxCashflow && window.Chart) {
    if (cashflowChart) cashflowChart.destroy();
    cashflowChart = new Chart(ctxCashflow, {
      type: "bar",
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: "Pemasukan",
            data: incomeData,
            backgroundColor: "#10b981",
            borderRadius: 4
          },
          {
            label: "Pengeluaran",
            data: expenseData,
            backgroundColor: "#ef4444",
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: "#94a3b8",
              boxWidth: 12,
              font: { size: isMobile ? 10 : 12 }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#94a3b8", font: { size: isMobile ? 9 : 11 } }
          },
          y: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: {
              color: "#94a3b8",
              font: { size: isMobile ? 9 : 11 },
              callback: val => (val >= 1000000 ? (val / 1000000) + "jt" : (val >= 1000 ? (val / 1000) + "rb" : val))
            }
          }
        }
      }
    });
  }

  // Category Donut Chart (Current Month)
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const categoryTotals = {};

  transactions.forEach(t => {
    const td = new Date(t.date);
    if (t.type === "Expense" && td.getMonth() === currentMonth && td.getFullYear() === currentYear) {
      const cat = t.category_name || t.category || "Lainnya";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(t.amount) || 0);
    }
  });

  const catLabels = Object.keys(categoryTotals);
  const catData = Object.values(categoryTotals);
  const catColors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

  const ctxCategory = document.getElementById("categoryChart");
  if (ctxCategory && window.Chart) {
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(ctxCategory, {
      type: "doughnut",
      data: {
        labels: catLabels.length ? catLabels : ["Belum Ada Pengeluaran"],
        datasets: [
          {
            data: catData.length ? catData : [1],
            backgroundColor: catData.length ? catColors.slice(0, catLabels.length) : ["#334155"],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: isMobile ? "bottom" : "right",
            labels: {
              color: "#94a3b8",
              boxWidth: 10,
              font: { size: isMobile ? 9 : 11 }
            }
          }
        },
        cutout: isMobile ? "60%" : "70%"
      }
    });
  }
}

window.addEventListener("resize", () => {
  if (cashflowChart || categoryChart) {
    Storage.getTransactions().then(tx => renderCharts(tx));
  }
});

window.onTransactionSaved = () => renderDashboard();
window.onPrivacyChanged = () => renderDashboard();