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
      // 1. Update Saldo Akun di Supabase
      if (type === "Expense") {
        if (accountId) await this.updateAccountBalance(accountId, -amount);
      } else if (type === "Income") {
        if (accountId) await this.updateAccountBalance(accountId, amount);
      } else if (type === "Transfer") {
        if (accountId) await this.updateAccountBalance(accountId, -(amount + adminFee));
        if (toAccountId) await this.updateAccountBalance(toAccountId, amount);
      }

      // 2. Simpan Transaksi Langsung ke Supabase (INSERT untuk baru, UPDATE untuk edit)
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
        if (accountId) await this.updateAccountBalance(accountId, -amt);
      } else if (type === "withdraw") {
        if (amt > newGoalAmount) {
          return { success: false, error: "Saldo tabungan tidak mencukupi untuk ditarik." };
        }
        newGoalAmount -= amt;
        if (accountId) await this.updateAccountBalance(accountId, amt);
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
  }
};
