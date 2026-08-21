/**
 * MONETRAC - REPORTS & EXPORT / PRINT LOGIC
 */

async function renderReports() {
  const transactions = await Storage.getTransactions();
  const categories = await Storage.getCategories();
  const accounts = await Storage.getAccounts();

  const monthSelect = document.getElementById("report-month");
  const yearSelect = document.getElementById("report-year");

  const selectedMonth = Number(monthSelect?.value ?? new Date().getMonth());
  const selectedYear = Number(yearSelect?.value ?? new Date().getFullYear());

  let inc = 0;
  let exp = 0;
  let trf = 0;
  const catSummary = {};

  const filtered = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  filtered.forEach(t => {
    const amt = Number(t.amount) || 0;
    if (t.type === "Income") inc += amt;
    if (t.type === "Expense") {
      exp += amt;
      const cat = t.category_name || t.category || "Lainnya";
      catSummary[cat] = (catSummary[cat] || 0) + amt;
    }
    if (t.type === "Transfer") trf += amt;
  });

  const net = inc - exp;

  document.getElementById("report-income").innerHTML = Utils.formatCurrency(inc);
  document.getElementById("report-expense").innerHTML = Utils.formatCurrency(exp);
  document.getElementById("report-net").innerHTML = Utils.formatCurrency(net);
  document.getElementById("report-tx-count").textContent = `${filtered.length} Transaksi`;

  // Expense breakdown by category
  const catTbody = document.getElementById("report-category-tbody");
  if (catTbody) {
    const sortedCats = Object.entries(catSummary).sort((a, b) => b[1] - a[1]);
    if (!sortedCats.length) {
      catTbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">Tidak ada pengeluaran pada periode ini.</td></tr>`;
    } else {
      catTbody.innerHTML = sortedCats.map(([name, amount]) => {
        const share = exp > 0 ? Math.round((amount / exp) * 100) : 0;
        return `
          <tr>
            <td><strong>${Utils.escapeHTML(name)}</strong></td>
            <td style="text-align:right;">${Utils.formatCurrency(amount)}</td>
            <td style="text-align:right;">${share}%</td>
          </tr>
        `;
      }).join('');
    }
  }

  // Detailed Transaction List for Report
  const txTbody = document.getElementById("report-tx-tbody");
  if (txTbody) {
    if (!filtered.length) {
      txTbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px;">Tidak ada transaksi tercatat pada bulan ini.</td></tr>`;
    } else {
      txTbody.innerHTML = filtered.map(t => `
        <tr>
          <td>${Utils.formatDate(t.date, "short")}</td>
          <td><span class="badge ${t.type === 'Income' ? 'badge-income' : (t.type === 'Transfer' ? 'badge-transfer' : 'badge-expense')}">${t.type}</span></td>
          <td>${Utils.escapeHTML(t.category_name || t.category || '-')}</td>
          <td>${Utils.escapeHTML(t.description || '-')}</td>
          <td style="text-align:right;font-weight:700;">${Utils.formatCurrency(t.amount)}</td>
        </tr>
      `).join('');
    }
  }
}

function printFinancialReport() {
  window.print();
}

function exportReportCSV() {
  Storage.getTransactions().then(transactions => {
    const monthSelect = document.getElementById("report-month");
    const yearSelect = document.getElementById("report-year");
    const selectedMonth = Number(monthSelect?.value ?? new Date().getMonth());
    const selectedYear = Number(yearSelect?.value ?? new Date().getFullYear());

    const filtered = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const data = filtered.map(t => ({
      Tanggal: t.date,
      Tipe: t.type,
      Kategori: t.category_name || t.category || "",
      Keterangan: t.description || "",
      Nominal: t.amount,
      Biaya_Admin: t.admin_fee || 0
    }));

    Utils.exportToCSV(`Laporan_Keuangan_${selectedYear}_${selectedMonth + 1}.csv`, data);
  });
}

window.renderReports = renderReports;
window.onPrivacyChanged = () => renderReports();