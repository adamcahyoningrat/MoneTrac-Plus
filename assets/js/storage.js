/**
 * MONETRAC - PURE SUPABASE CLOUD ENGINE (BULLETPROOF CRUD)
 */

function isValidUUID(str) {
  if (!str || typeof str !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

const Storage = {
  // In-Memory Fast Cache for instant modal rendering
  _accounts: [],
  _categories: [],
  _transactions: [],
  _budgets: [],
  _savings: [],
  _debts: [],

  // --------------------------------------------------------------------------
  // ACCOUNTS
  // --------------------------------------------------------------------------
  async getAccounts() {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return this._accounts.length ? this._accounts : [];

    try {
      const { data, error } = await client
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        const defaultAccs = [
          { user_id: user.id, name: "Cash / Tunai", type: "Cash", balance: 0, color: "#16a34a", icon: "money-bill" },
          { user_id: user.id, name: "Rekening Bank", type: "Bank", balance: 0, color: "#1f16a2", icon: "building-columns" },
          { user_id: user.id, name: "E-Wallet", type: "E-Wallet", balance: 0, color: "#1b93d0", icon: "wallet" }
        ];
        const { data: inserted } = await client.from("accounts").insert(defaultAccs).select();
        if (inserted) {
          this._accounts = inserted;
          return inserted;
        }
      }

      this._accounts = data || [];
      return this._accounts;
    } catch (err) {
      console.error("Supabase getAccounts error:", err);
      return this._accounts;
    }
  },

  async saveAccount(account) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi tidak aktif." };

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

      let resData;
      if (account.id && isValidUUID(account.id)) {
        const { data, error } = await client
          .from("accounts")
          .update(payload)
          .eq("id", account.id)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        resData = data;
      } else {
        const { data, error } = await client
          .from("accounts")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        resData = data;
      }

      await this.getAccounts();
      return { success: true, data: resData };
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
      await this.getAccounts();
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
  // CATEGORIES
  // --------------------------------------------------------------------------
  async getCategories() {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return this._categories.length ? this._categories : [];

    try {
      const { data, error } = await client
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

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
        const { data: inserted } = await client.from("categories").insert(defaultCats).select();
        if (inserted) {
          this._categories = inserted;
          return inserted;
        }
      }

      this._categories = data || [];
      return this._categories;
    } catch (err) {
      console.error("Supabase getCategories error:", err);
      return this._categories;
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

      let resData;
      if (category.id && isValidUUID(category.id)) {
        const { data, error } = await client
          .from("categories")
          .update(payload)
          .eq("id", category.id)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        resData = data;
      } else {
        const { data, error } = await client
          .from("categories")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        resData = data;
      }

      await this.getCategories();
      return { success: true, data: resData };
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
      await this.getCategories();
      return { success: true };
    } catch (err) {
      console.error("Supabase deleteCategory error:", err);
      return { success: false, error: err.message };
    }
  },

  // --------------------------------------------------------------------------
  // TRANSACTIONS
  // --------------------------------------------------------------------------
  async getTransactions(filters = {}) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return this._transactions.length ? this._transactions : [];

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
      this._transactions = data || [];
      return this._transactions;
    } catch (err) {
      console.error("Supabase getTransactions error:", err);
      return this._transactions;
    }
  },

async saveTransaction(transaction) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi tidak aktif." };

    const amount = Number(transaction.amount) || 0;
    const adminFee = Number(transaction.admin_fee) || 0;
    const type = transaction.type;
    const accountId = isValidUUID(transaction.account_id) ? transaction.account_id : (isValidUUID(transaction.account) ? transaction.account : null);
    const toAccountId = isValidUUID(transaction.to_account_id) ? transaction.to_account_id : (isValidUUID(transaction.toAccount) ? transaction.toAccount : null);
    const rawDate = transaction.date ? transaction.date.substring(0, 10) : new Date().toISOString().split("T")[0];

    try {
      // 1. JIKA EDIT: Netralkan (Revert) efek saldo transaksi lama terlebih dahulu
      if (transaction.id && isValidUUID(transaction.id)) {
        const { data: oldTx } = await client
          .from("transactions")
          .select("*")
          .eq("id", transaction.id)
          .eq("user_id", user.id)
          .single();

        if (oldTx) {
          const oldAmt = Number(oldTx.amount) || 0;
          const oldFee = Number(oldTx.admin_fee) || 0;
          if (oldTx.type === "Expense" && oldTx.account_id) {
            await this.updateAccountBalance(oldTx.account_id, oldAmt); // Kembalikan uang pengeluaran lama
          } else if (oldTx.type === "Income" && oldTx.account_id) {
            await this.updateAccountBalance(oldTx.account_id, -oldAmt); // Tarik kembali pemasukan lama
          } else if (oldTx.type === "Transfer") {
            if (oldTx.account_id) await this.updateAccountBalance(oldTx.account_id, oldAmt + oldFee);
            if (oldTx.to_account_id) await this.updateAccountBalance(oldTx.to_account_id, -oldAmt);
          }
        }
      }

      // 2. Terapkan efek saldo baru
      if (type === "Expense") {
        if (accountId) await this.updateAccountBalance(accountId, -amount);
      } else if (type === "Income") {
        if (accountId) await this.updateAccountBalance(accountId, amount);
      } else if (type === "Transfer") {
        if (accountId) await this.updateAccountBalance(accountId, -(amount + adminFee));
        if (toAccountId) await this.updateAccountBalance(toAccountId, amount);
      }

      // 3. Simpan pembaruan data transaksi ke Supabase
      const payload = {
        user_id: user.id,
        type: type,
        date: rawDate,
        amount: amount,
        admin_fee: adminFee,
        account_id: accountId,
        to_account_id: type === "Transfer" ? toAccountId : null,
        category_id: isValidUUID(transaction.category_id) ? transaction.category_id : null,
        category_name: transaction.category_name || transaction.category || (type === "Transfer" ? "Transfer Saldo" : "Lainnya"),
        description: transaction.description || "",
        notes: transaction.notes || "",
        timestamp: transaction.timestamp || new Date().toISOString()
      };

      let resData;
      if (transaction.id && isValidUUID(transaction.id)) {
        const { data, error } = await client
          .from("transactions")
          .update(payload)
          .eq("id", transaction.id)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        resData = data;
      } else {
        const { data, error } = await client
          .from("transactions")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        resData = data;
      }

      await this.getTransactions();
      await this.getAccounts();
      return { success: true, data: resData };
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
      const { data: tx } = await client
        .from("transactions")
        .select("*")
        .eq("id", txId)
        .eq("user_id", user.id)
        .single();

      if (tx) {
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

      const { error: delErr } = await client
        .from("transactions")
        .delete()
        .eq("id", txId)
        .eq("user_id", user.id);

      if (delErr) throw delErr;
      await this.getTransactions();
      return { success: true };
    } catch (err) {
      console.error("Supabase deleteTransaction error:", err);
      return { success: false, error: err.message };
    }
  },

  // --------------------------------------------------------------------------
  // SAVINGS GOALS
  // --------------------------------------------------------------------------
  async getSavingsGoals() {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return this._savings.length ? this._savings : [];

    try {
      const { data, error } = await client
        .from("savings_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      this._savings = data || [];
      return this._savings;
    } catch (err) {
      console.error("Supabase getSavingsGoals error:", err);
      return this._savings;
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
        account_id: isValidUUID(goal.account_id) ? goal.account_id : null,
        color: goal.color || "#0891b2",
        icon: goal.icon || "piggy-bank",
        notes: goal.notes || "",
        status: goal.status || "in_progress",
        updated_at: new Date().toISOString()
      };

      let resData;
      if (goal.id && isValidUUID(goal.id)) {
        const { data, error } = await client
          .from("savings_goals")
          .update(payload)
          .eq("id", goal.id)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        resData = data;
      } else {
        const { data, error } = await client
          .from("savings_goals")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        resData = data;
      }

      await this.getSavingsGoals();
      return { success: true, data: resData };
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
      await this.getSavingsGoals();
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
        // JANGAN panggil updateAccountBalance di sini
      } else if (type === "withdraw") {
        if (amt > newGoalAmount) {
          return { success: false, error: "Saldo tabungan tidak mencukupi untuk ditarik." };
        }
        newGoalAmount -= amt;
        // JANGAN panggil updateAccountBalance di sini
      }

      const newStatus = newGoalAmount >= Number(goal.target_amount) ? "completed" : "in_progress";
      await client
        .from("savings_goals")
        .update({ current_amount: newGoalAmount, status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", goalId)
        .eq("user_id", user.id);

      await client.from("savings_transactions").insert({
        user_id: user.id,
        goal_id: goalId,
        type: type,
        amount: amt,
        account_id: isValidUUID(accountId) ? accountId : null,
        date: date || new Date().toISOString().split("T")[0],
        notes: notes || ""
      });

      // saveTransaction di bawah ini yang akan memotong saldo akun kas murni tepat 1 kali
      if (accountId && isValidUUID(accountId)) {
        await this.saveTransaction({
          type: "Transfer",
          date: date || new Date().toISOString().split("T")[0],
          amount: amt,
          account_id: type === "deposit" ? accountId : null,
          to_account_id: type === "withdraw" ? accountId : null,
          category_name: type === "deposit" ? `Nabung: ${goal.name}` : `Tarik Tabungan: ${goal.name}`,
          description: notes || (type === "deposit" ? `Setor tabungan ke ${goal.name}` : `Penarikan dari ${goal.name}`)
        });
      }

      await this.getAccounts();
      await this.getSavingsGoals();

      return { success: true, newAmount: newGoalAmount };
    } catch (err) {
      console.error("Supabase addSavingsMutation error:", err);
      return { success: false, error: err.message };
    }
  },
  // --------------------------------------------------------------------------
  // BUDGETS
  // --------------------------------------------------------------------------
  async getBudgets() {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return this._budgets.length ? this._budgets : [];

    try {
      const { data, error } = await client
        .from("budgets")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      this._budgets = data || [];
      return this._budgets;
    } catch (err) {
      console.error("Supabase getBudgets error:", err);
      return this._budgets;
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
        category_id: isValidUUID(budget.category_id) ? budget.category_id : null,
        amount: Number(budget.amount) || 0,
        month: budget.month || null
      };

      let resData;
      if (budget.id && isValidUUID(budget.id)) {
        const { data, error } = await client
          .from("budgets")
          .update(payload)
          .eq("id", budget.id)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        resData = data;
      } else {
        const { data, error } = await client
          .from("budgets")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        resData = data;
      }

      await this.getBudgets();
      return { success: true, data: resData };
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
      await this.getBudgets();
      return { success: true };
    } catch (err) {
      console.error("Supabase deleteBudget error:", err);
      return { success: false, error: err.message };
    }
  },

  // --------------------------------------------------------------------------
  // DEBTS & RECEIVABLES (HUTANG & PIUTANG)
  // --------------------------------------------------------------------------
  async getDebts() {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return this._debts || [];

    try {
      const { data, error } = await client
        .from("debts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      this._debts = data || [];
      return this._debts;
    } catch (err) {
      console.error("Supabase getDebts error:", err);
      return this._debts || [];
    }
  },

  async saveDebt(debt, adjustBalance = false, accountId = null) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi tidak aktif." };

    const totalAmount = Number(debt.total_amount) || 0;
    const paidAmount = Number(debt.paid_amount) || 0;
    let status = "unpaid";
    if (paidAmount >= totalAmount) {
      status = "paid";
    } else if (paidAmount > 0) {
      status = "partially_paid";
    }

    const payload = {
      user_id: user.id,
      type: debt.type || "payable",
      person_name: debt.person_name,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      due_date: debt.due_date || null,
      status: status,
      notes: debt.notes || "",
      updated_at: new Date().toISOString()
    };

    try {
      let resData;
      const isNew = !debt.id || !isValidUUID(debt.id);

      if (!isNew) {
        const { data, error } = await client
          .from("debts")
          .update(payload)
          .eq("id", debt.id)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        resData = data;
      } else {
        const { data, error } = await client
          .from("debts")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        resData = data;

        // Jika opsi "Sesuaikan saldo akun" dicentang pada hutang/piutang baru:
        if (adjustBalance && accountId && isValidUUID(accountId) && totalAmount > 0) {
          if (debt.type === "payable") {
            // Kita pinjam uang -> Saldo kas/bank kita bertambah
            await this.saveTransaction({
              type: "Income",
              amount: totalAmount,
              account_id: accountId,
              category_name: "Pinjaman / Hutang",
              description: `Pencairan hutang dari: ${debt.person_name}`,
              date: new Date().toISOString().split("T")[0]
            });
          } else if (debt.type === "receivable") {
            // Kita meminjamkan uang -> Saldo kas/bank kita berkurang
            await this.saveTransaction({
              type: "Expense",
              amount: totalAmount,
              account_id: accountId,
              category_name: "Pinjaman Diberikan",
              description: `Pinjaman diberikan ke: ${debt.person_name}`,
              date: new Date().toISOString().split("T")[0]
            });
          }
        }
      }

      await this.getDebts();
      await this.getAccounts();
      return { success: true, data: resData };
    } catch (err) {
      console.error("Supabase saveDebt error:", err);
      return { success: false, error: err.message };
    }
  },

  async deleteDebt(debtId) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi tidak aktif." };

    try {
      const { error } = await client
        .from("debts")
        .delete()
        .eq("id", debtId)
        .eq("user_id", user.id);

      if (error) throw error;
      await this.getDebts();
      return { success: true };
    } catch (err) {
      console.error("Supabase deleteDebt error:", err);
      return { success: false, error: err.message };
    }
  },

  async addDebtPayment({ debtId, amount, accountId, date, notes }) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();
    if (!client || !user) return { success: false, error: "Sesi tidak aktif." };

    const payAmt = Number(amount) || 0;
    if (payAmt <= 0) return { success: false, error: "Nominal harus lebih besar dari 0" };

    try {
      const { data: debt, error: dErr } = await client
        .from("debts")
        .select("*")
        .eq("id", debtId)
        .eq("user_id", user.id)
        .single();

      if (dErr || !debt) return { success: false, error: "Data hutang/piutang tidak ditemukan." };

      const totalAmt = Number(debt.total_amount) || 0;
      const curPaid = Number(debt.paid_amount) || 0;
      const sisa = Math.max(0, totalAmt - curPaid);

      if (payAmt > sisa) {
        return { success: false, error: `Nominal melebihi sisa tagihan (Maks: ${Utils.formatCurrencyRaw(sisa)})` };
      }

      const newPaid = curPaid + payAmt;
      const newStatus = newPaid >= totalAmt ? "paid" : "partially_paid";

      // 1. Update sisa terbayar di tabel debts
      await client
        .from("debts")
        .update({
          paid_amount: newPaid,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", debtId)
        .eq("user_id", user.id);

      // 2. Catat ke debt_payments
      await client.from("debt_payments").insert({
        user_id: user.id,
        debt_id: debtId,
        amount: payAmt,
        account_id: isValidUUID(accountId) ? accountId : null,
        payment_date: date || new Date().toISOString().split("T")[0],
        notes: notes || ""
      });

      // 3. Mutasi saldo akun (1x melalui saveTransaction)
      if (accountId && isValidUUID(accountId)) {
        if (debt.type === "payable") {
          // Bayar hutang kita -> Kas berkurang (Expense)
          await this.saveTransaction({
            type: "Expense",
            amount: payAmt,
            account_id: accountId,
            category_name: "Bayar Hutang",
            description: notes || `Bayar hutang ke: ${debt.person_name}`,
            date: date || new Date().toISOString().split("T")[0]
          });
        } else if (debt.type === "receivable") {
          // Orang bayar piutang ke kita -> Kas bertambah (Income)
          await this.saveTransaction({
            type: "Income",
            amount: payAmt,
            account_id: accountId,
            category_name: "Terima Piutang",
            description: notes || `Terima pelunasan piutang dari: ${debt.person_name}`,
            date: date || new Date().toISOString().split("T")[0]
          });
        }
      }

      await this.getDebts();
      await this.getAccounts();
      return { success: true, newPaid, newStatus };
    } catch (err) {
      console.error("Supabase addDebtPayment error:", err);
      return { success: false, error: err.message };
    }
  },
};
