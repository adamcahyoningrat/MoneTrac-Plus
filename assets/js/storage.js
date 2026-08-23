/**
 * MONETRAC - PURE FULL CLOUD DATA ACCESS LAYER (100% SUPABASE POSTGRESQL)
 * --------------------------------------------------------------------------
 * Seluruh data (Akun, Kategori, Transaksi, Tabungan, Anggaran) dibaca & ditulis
 * langsung ke server Supabase Cloud secara real-time. Tidak ada penyimpanan lokal
 * yang tumpang tindih sehingga sinkronisasi antar perangkat 100% presisi.
 * --------------------------------------------------------------------------
 */

const Storage = {
  // --------------------------------------------------------------------------
  // 1. ACCOUNTS / DOMPET (PURE SUPABASE)
  // --------------------------------------------------------------------------
  async getAccounts() {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return [];

    try {
      const { data, error } = await client
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Jika pengguna baru belum punya akun, auto-seed akun default di Supabase
      if (!data || data.length === 0) {
        const defaultAccs = [
          { user_id: user.id, name: "Cash / Tunai", type: "Cash", balance: 0, color: "#16a34a", icon: "money-bill" },
          { user_id: user.id, name: "Rekening Bank", type: "Bank", balance: 0, color: "#1f16a2", icon: "building-columns" },
          { user_id: user.id, name: "E-Wallet", type: "E-Wallet", balance: 0, color: "#1b93d0", icon: "wallet" }
        ];
        const { data: inserted, error: insErr } = await client.from("accounts").insert(defaultAccs).select();
        if (!insErr && inserted) return inserted;
      }

      return data || [];
    } catch (err) {
      console.error("Supabase getAccounts error:", err);
      return [];
    }
  },

  async saveAccount(account) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi pengguna tidak aktif." };

    try {
      const payload = {
        user_id: user.id,
        name: account.name,
        type: account.type || "Bank",
        balance: Number(account.balance) || 0,
        color: account.color || "#16a34a",
        icon: account.icon || "wallet",
        updated_at: new Date().toISOString()
      };

      if (account.id) {
        payload.id = account.id;
      }

      const { data, error } = await client
        .from("accounts")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error("Supabase saveAccount error:", err);
      return { success: false, error: err.message };
    }
  },

  async deleteAccount(accountId) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi tidak aktif." };

    try {
      const { error } = await client
        .from("accounts")
        .delete()
        .eq("id", accountId)
        .eq("user_id", user.id);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("Supabase deleteAccount error:", err);
      return { success: false, error: err.message };
    }
  },

  async updateAccountBalance(accountId, deltaAmount) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user || !accountId) return;

    try {
      // Ambil saldo aktual langsung dari Supabase
      const { data: acc, error } = await client
        .from("accounts")
        .select("balance")
        .eq("id", accountId)
        .eq("user_id", user.id)
        .single();

      if (error || !acc) return;

      const newBalance = (Number(acc.balance) || 0) + Number(deltaAmount);
      await client
        .from("accounts")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", accountId)
        .eq("user_id", user.id);
    } catch (err) {
      console.error("Supabase updateAccountBalance error:", err);
    }
  },

  // --------------------------------------------------------------------------
  // 2. CATEGORIES (PURE SUPABASE)
  // --------------------------------------------------------------------------
  async getCategories() {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return [];

    try {
      const { data, error } = await client
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Auto-seed default kategori di Supabase jika kosong
      if (!data || data.length === 0) {
        const defaultCats = [
          { user_id: user.id, name: "Salary / Gaji", type: "Income", color: "#2563eb", icon: "briefcase" },
          { user_id: user.id, name: "Freelance Fee", type: "Income", color: "#24e7eb", icon: "laptop" },
          { user_id: user.id, name: "Investasi & Bunga", type: "Income", color: "#10b981", icon: "chart-line" },
          { user_id: user.id, name: "Other Revenue", type: "Income", color: "#69eb24", icon: "gift" },
          { user_id: user.id, name: "Food & Beverage", type: "Expense", color: "#ef4444", icon: "utensils" },
          { user_id: user.id, name: "Transportation Exp", type: "Expense", color: "#eb24a2", icon: "car" },
          { user_id: user.id, name: "Internet & Kuota", type: "Expense", color: "#f59e0b", icon: "wifi" },
          { user_id: user.id, name: "Electricity / Listrik", type: "Expense", color: "#ebc924", icon: "bolt" },
          { user_id: user.id, name: "Shopping & Olshop", type: "Expense", color: "#8b5cf6", icon: "cart-shopping" },
          { user_id: user.id, name: "Other Exp", type: "Expense", color: "#eb5f24", icon: "boxes-stacked" }
        ];
        const { data: inserted, error: insErr } = await client.from("categories").insert(defaultCats).select();
        if (!insErr && inserted) return inserted;
      }

      return data || [];
    } catch (err) {
      console.error("Supabase getCategories error:", err);
      return [];
    }
  },

  async saveCategory(category) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi tidak aktif." };

    try {
      const payload = {
        user_id: user.id,
        name: category.name,
        type: category.type || "Expense",
        color: category.color || "#2563eb",
        icon: category.icon || "tag"
      };

      if (category.id) {
        payload.id = category.id;
      }

      const { data, error } = await client
        .from("categories")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error("Supabase saveCategory error:", err);
      return { success: false, error: err.message };
    }
  },

  async deleteCategory(categoryId) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi tidak aktif." };

    try {
      const { error } = await client
        .from("categories")
        .delete()
        .eq("id", categoryId)
        .eq("user_id", user.id);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("Supabase deleteCategory error:", err);
      return { success: false, error: err.message };
    }
  },

  // --------------------------------------------------------------------------
  // 3. TRANSACTIONS (PURE SUPABASE)
  // --------------------------------------------------------------------------
  async getTransactions(filters = {}) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return [];

    try {
      let query = client
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("timestamp", { ascending: false });

      if (filters.type && filters.type !== "all") {
        query = query.eq("type", filters.type);
      }
      if (filters.startDate) {
        query = query.gte("date", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("date", filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Supabase getTransactions error:", err);
      return [];
    }
  },

  async saveTransaction(transaction) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi tidak aktif." };

    const amount = Number(transaction.amount) || 0;
    const adminFee = Number(transaction.admin_fee) || 0;
    const type = transaction.type;
    const accountId = transaction.account_id || transaction.account || null;
    const toAccountId = transaction.to_account_id || transaction.toAccount || null;
    const rawDate = transaction.date ? transaction.date.substring(0, 10) : new Date().toISOString().split("T")[0];

    try {
      // 1. Update Saldo Akun di Supabase
      if (type === "Expense") {
        if (accountId) await this.updateAccountBalance(accountId, -amount);
      } else if (type === "Income") {
        if (accountId) await this.updateAccountBalance(accountId, amount);
      } else if (type === "Transfer") {
        if (accountId) await this.updateAccountBalance(accountId, -(amount + adminFee));
        if (toAccountId) await this.updateAccountBalance(toAccountId, amount);
      }

      // 2. Simpan Transaksi Langsung ke Supabase
      const payload = {
        user_id: user.id,
        type: type,
        date: rawDate,
        amount: amount,
        admin_fee: adminFee,
        account_id: accountId,
        to_account_id: type === "Transfer" ? toAccountId : null,
        category_id: transaction.category_id || null,
        category_name: transaction.category_name || transaction.category || (type === "Transfer" ? "Transfer Saldo" : "Lainnya"),
        description: transaction.description || "",
        notes: transaction.notes || "",
        timestamp: transaction.timestamp || new Date().toISOString()
      };

      if (transaction.id) {
        payload.id = transaction.id;
      }

      const { data, error } = await client
        .from("transactions")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error("Supabase saveTransaction error:", err);
      return { success: false, error: err.message };
    }
  },

  async deleteTransaction(txId) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user || !txId) return { success: false, error: "Sesi tidak aktif." };

    try {
      // 1. Ambil data transaksi untuk mengembalikan saldo (Reversal)
      const { data: tx, error: fetchErr } = await client
        .from("transactions")
        .select("*")
        .eq("id", txId)
        .eq("user_id", user.id)
        .single();

      if (!fetchErr && tx) {
        const amount = Number(tx.amount) || 0;
        const adminFee = Number(tx.admin_fee) || 0;
        if (tx.type === "Expense" && tx.account_id) {
          await this.updateAccountBalance(tx.account_id, amount);
        } else if (tx.type === "Income" && tx.account_id) {
          await this.updateAccountBalance(tx.account_id, -amount);
        } else if (tx.type === "Transfer") {
          if (tx.account_id) await this.updateAccountBalance(tx.account_id, amount + adminFee);
          if (tx.to_account_id) await this.updateAccountBalance(tx.to_account_id, -amount);
        }
      }

      // 2. Hapus dari Supabase
      const { error: delErr } = await client
        .from("transactions")
        .delete()
        .eq("id", txId)
        .eq("user_id", user.id);

      if (delErr) throw delErr;
      return { success: true };
    } catch (err) {
      console.error("Supabase deleteTransaction error:", err);
      return { success: false, error: err.message };
    }
  },

  // --------------------------------------------------------------------------
  // 4. SAVINGS GOALS (PURE SUPABASE)
  // --------------------------------------------------------------------------
  async getSavingsGoals() {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return [];

    try {
      const { data, error } = await client
        .from("savings_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Supabase getSavingsGoals error:", err);
      return [];
    }
  },

  async saveSavingsGoal(goal) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi tidak aktif." };

    try {
      const payload = {
        user_id: user.id,
        name: goal.name,
        target_amount: Number(goal.target_amount) || 0,
        current_amount: Number(goal.current_amount) || 0,
        target_date: goal.target_date || null,
        account_id: goal.account_id || null,
        color: goal.color || "#0891b2",
        icon: goal.icon || "piggy-bank",
        notes: goal.notes || "",
        status: goal.status || "in_progress",
        updated_at: new Date().toISOString()
      };

      if (goal.id) {
        payload.id = goal.id;
      }

      const { data, error } = await client
        .from("savings_goals")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error("Supabase saveSavingsGoal error:", err);
      return { success: false, error: err.message };
    }
  },

  async deleteSavingsGoal(goalId) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi tidak aktif." };

    try {
      const { error } = await client
        .from("savings_goals")
        .delete()
        .eq("id", goalId)
        .eq("user_id", user.id);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("Supabase deleteSavingsGoal error:", err);
      return { success: false, error: err.message };
    }
  },

  async addSavingsMutation({ goalId, type, amount, accountId, notes, date }) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi tidak aktif." };

    const amt = Number(amount) || 0;
    if (amt <= 0) return { success: false, error: "Nominal harus lebih besar dari 0" };

    try {
      // 1. Ambil data target tabungan langsung dari Supabase
      const { data: goal, error: gErr } = await client
        .from("savings_goals")
        .select("*")
        .eq("id", goalId)
        .eq("user_id", user.id)
        .single();

      if (gErr || !goal) return { success: false, error: "Target tabungan tidak ditemukan." };

      let newGoalAmount = Number(goal.current_amount) || 0;

      if (type === "deposit") {
        newGoalAmount += amt;
        if (accountId) await this.updateAccountBalance(accountId, -amt);
      } else if (type === "withdraw") {
        if (amt > newGoalAmount) {
          return { success: false, error: "Saldo tabungan tidak mencukupi untuk ditarik." };
        }
        newGoalAmount -= amt;
        if (accountId) await this.updateAccountBalance(accountId, amt);
      }

      // 2. Update status & jumlah di Supabase
      const newStatus = newGoalAmount >= Number(goal.target_amount) ? "completed" : "in_progress";
      await client
        .from("savings_goals")
        .update({ current_amount: newGoalAmount, status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", goalId)
        .eq("user_id", user.id);

      // 3. Catat mutasi di Supabase savings_transactions
      await client.from("savings_transactions").insert({
        user_id: user.id,
        goal_id: goalId,
        type: type,
        amount: amt,
        account_id: accountId || null,
        date: date || new Date().toISOString().split("T")[0],
        notes: notes || ""
      });

      // 4. Catat transaksi transfer pendukung
      await this.saveTransaction({
        type: "Transfer",
        date: date || new Date().toISOString().split("T")[0],
        amount: amt,
        account_id: type === "deposit" ? accountId : null,
        to_account_id: type === "withdraw" ? accountId : null,
        category_name: type === "deposit" ? `Nabung: ${goal.name}` : `Tarik Tabungan: ${goal.name}`,
        description: notes || (type === "deposit" ? `Setor tabungan ke ${goal.name}` : `Penarikan dari ${goal.name}`)
      });

      return { success: true, newAmount: newGoalAmount };
    } catch (err) {
      console.error("Supabase addSavingsMutation error:", err);
      return { success: false, error: err.message };
    }
  },

  // --------------------------------------------------------------------------
  // 5. BUDGETS (PURE SUPABASE)
  // --------------------------------------------------------------------------
  async getBudgets() {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return [];

    try {
      const { data, error } = await client
        .from("budgets")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Supabase getBudgets error:", err);
      return [];
    }
  },

  async saveBudget(budget) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi tidak aktif." };

    try {
      const payload = {
        user_id: user.id,
        category_name: budget.category_name || budget.category,
        category_id: budget.category_id || null,
        amount: Number(budget.amount) || 0,
        month: budget.month || null
      };

      if (budget.id) {
        payload.id = budget.id;
      }

      const { data, error } = await client
        .from("budgets")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error("Supabase saveBudget error:", err);
      return { success: false, error: err.message };
    }
  },

  async deleteBudget(budgetId) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi tidak aktif." };

    try {
      const { error } = await client
        .from("budgets")
        .delete()
        .eq("id", budgetId)
        .eq("user_id", user.id);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error("Supabase deleteBudget error:", err);
      return { success: false, error: err.message };
    }
  },

  // --------------------------------------------------------------------------
  // 6. MIGRATION & BACKUP (DIRECT TO SUPABASE)
  // --------------------------------------------------------------------------
  async importFromGSheetData(rawJson) {
    try {
      const data = typeof rawJson === "string" ? JSON.parse(rawJson) : rawJson;

      let importedAcc = 0;
      let importedCat = 0;
      let importedTx = 0;
      let importedBg = 0;

      if (data.myfinance_categories && Array.isArray(data.myfinance_categories)) {
        for (const cat of data.myfinance_categories) {
          await this.saveCategory({
            name: cat.name,
            type: cat.type,
            color: cat.color,
            icon: cat.icon
          });
          importedCat++;
        }
      }

      const accountMap = {};
      if (data.myfinance_accounts && Array.isArray(data.myfinance_accounts)) {
        for (const acc of data.myfinance_accounts) {
          const res = await this.saveAccount({
            name: acc.name,
            type: acc.type,
            balance: acc.balance,
            color: acc.color,
            icon: acc.icon
          });
          if (res.success && res.data) {
            accountMap[acc.id] = res.data.id;
          }
          importedAcc++;
        }
      }

      if (data.myfinance_budgets && Array.isArray(data.myfinance_budgets)) {
        for (const bg of data.myfinance_budgets) {
          await this.saveBudget({
            category_name: bg.category,
            amount: bg.amount
          });
          importedBg++;
        }
      }

      if (data.myfinance_transactions && Array.isArray(data.myfinance_transactions)) {
        for (const tx of data.myfinance_transactions) {
          const txDate = tx.date ? tx.date.split("T")[0] : new Date().toISOString().split("T")[0];
          await this.saveTransaction({
            type: tx.type,
            date: txDate,
            amount: Number(tx.amount) || 0,
            admin_fee: 0,
            account_id: accountMap[tx.account] || null,
            to_account_id: accountMap[tx.toAccount] || null,
            category_name: tx.category || (tx.type === "Transfer" ? "Transfer" : "Lainnya"),
            description: tx.description || "",
            timestamp: tx.timestamp || new Date().toISOString()
          });
          importedTx++;
        }
      }

      return {
        success: true,
        message: `Migrasi Cloud Berhasil! Diimpor: ${importedAcc} Akun, ${importedCat} Kategori, ${importedTx} Transaksi, ${importedBg} Anggaran.`
      };
    } catch (e) {
      console.error("Migration error:", e);
      return { success: false, error: e.message };
    }
  },

  async exportAllData() {
    const accounts = await this.getAccounts();
    const categories = await this.getCategories();
    const transactions = await this.getTransactions();
    const budgets = await this.getBudgets();
    const savings = await this.getSavingsGoals();

    return {
      export_date: new Date().toISOString(),
      version: "2.0.0-pure-cloud",
      myfinance_accounts: accounts,
      myfinance_categories: categories,
      myfinance_transactions: transactions,
      myfinance_budgets: budgets,
      myfinance_savings: savings
    };
  }
};
