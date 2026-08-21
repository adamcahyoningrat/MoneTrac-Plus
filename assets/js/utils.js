/**
 * MONETRAC - UTILITIES & HELPER FUNCTIONS
 */

const Utils = {
  /**
   * Format currency with privacy masking support
   */
  formatCurrency(amount, privacyMode = null) {
    if (privacyMode === null) {
      privacyMode = AppState.getPrivacyMode();
    }

    const num = Number(amount) || 0;
    const formatted = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);

    if (privacyMode) {
      return `<span class="privacy-masked" title="Klik tombol mata di navbar untuk melihat">${formatted}</span>`;
    }
    return formatted;
  },

  /**
   * Format raw number into readable currency string without HTML
   */
  formatCurrencyRaw(amount) {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  },

  /**
   * Format date into readable Indonesian text
   */
  formatDate(dateStr, formatType = "short") {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const monthsShort = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const monthsLong = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    const d = date.getDate();
    const m = date.getMonth();
    const y = date.getFullYear();

    if (formatType === "short") {
      return `${d} ${monthsShort[m]} ${y}`;
    } else if (formatType === "long") {
      return `${days[date.getDay()]}, ${d} ${monthsLong[m]} ${y}`;
    } else if (formatType === "month_year") {
      return `${monthsLong[m]} ${y}`;
    } else if (formatType === "input") {
      const dd = String(d).padStart(2, "0");
      const mm = String(m + 1).padStart(2, "0");
      return `${y}-${mm}-${dd}`;
    }
    return date.toLocaleDateString("id-ID");
  },

  /**
   * Get days remaining until target date
   */
  getDaysRemaining(targetDateStr) {
    if (!targetDateStr) return null;
    const target = new Date(targetDateStr);
    const now = new Date();
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  /**
   * Generate UUID fallback
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  /**
   * Toast notification helper
   */
  showToast(message, type = "success", title = "") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconClass = "fa-circle-check";
    let defaultTitle = "Sukses";
    if (type === "error") {
      iconClass = "fa-circle-xmark";
      defaultTitle = "Terjadi Kesalahan";
    } else if (type === "warning") {
      iconClass = "fa-triangle-exclamation";
      defaultTitle = "Perhatian";
    } else if (type === "info") {
      iconClass = "fa-circle-info";
      defaultTitle = "Informasi";
    }

    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${iconClass}"></i></div>
      <div class="toast-content">
        <div class="toast-title">${title || defaultTitle}</div>
        <div class="toast-message">${this.escapeHTML(message)}</div>
      </div>
      <button class="modal-close" style="width:20px;height:20px;font-size:0.9rem;" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  /**
   * Export array of objects to CSV download
   */
  exportToCSV(filename, rows) {
    if (!rows || !rows.length) {
      this.showToast("Tidak ada data untuk diekspor", "warning");
      return;
    }
    const separator = ",";
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      "\n" +
      rows
        .map(row => {
          return keys
            .map(k => {
              let cell = row[k] === null || row[k] === undefined ? "" : row[k];
              cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`;
              }
              return cell;
            })
            .join(separator);
        })
        .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast(`Data berhasil diekspor ke ${filename}`, "success");
  }
};