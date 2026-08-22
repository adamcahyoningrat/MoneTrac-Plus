/**
 * MONETRAC - STORAGE & DATA ACCESS LAYER (SUPABASE + RESILIENT LOCAL CACHE)
 */

const Storage = {
  // --------------------------------------------------------------------------
  // SYNCHRONOUS CACHE GETTERS (INSTANT 0MS ACCESS)
  // --------------------------------------------------------------------------
  getCachedAccounts() {
    const cached = localStorage.getItem("monetrac_cache_accounts");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: "acc_1", name: "Cash / Tunai", type: "Cash", balance: 0, color: "#16a34a", icon: "money-bill" },
      { id: "acc_2", name: "Rekening Bank", type: "Bank", balance: 0, color: "#1f16a2", icon: "building-columns" },
      { id: "acc_3", name: "E-Wallet", type: "E-Wallet", balance: 0, color: "#1b93d0", icon: "wallet" }
    ];
  },

  getCachedCategories() {
    const cached = localStorage.getItem("monetrac_cache_categories");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: "cat_1", name: "Salary / Gaji", type: "Income", color: "#2563eb", icon: "briefcase" },
      { id: "cat_2", name: "Freelance Fee", type: "Income", color: "#24e7eb", icon: "laptop" },
      { id: "cat_3", name: "Other Revenue", type: "Income", color: "#69eb24", icon: "gift" },
      { id: "cat_4", name: "Food & Beverage", type: "Expense", color: "#ef4444", icon: "utensils" },
      { id: "cat_5", name: "Transportation Exp", type: "Expense", color: "#eb24a2", icon: "car" },
      { id: "cat_6", name: "Internet & Kuota", type: "Expense", color: "#f59e0b", icon: "wifi" },
      { id: "cat_7", name: "Electricity / Listrik", type: "Expense", color: "#ebc924", icon: "bolt" },
      { id: "cat_8", name: "Shopping & Olshop", type: "Expense", color: "#8b5cf6", icon: "cart-shopping" },
      { id: "cat_9", name: "Other Exp", type: "Expense", color: "#eb5f24", icon: "boxes-stacked" }
    ];
  },

  getCachedTransactions() {
    const cached = localStorage.getItem("monetrac_cache_transactions");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  },

  getCachedBudgets() {
    const cached = localStorage.getItem("monetrac_cache_budgets");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  },

  getCachedSavingsGoals() {
    const cached = localStorage.getItem("monetrac_cache_savings");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  },

  // --------------------------------------------------------------------------
  // ACCOUNTS
  // --------------------------------------------------------------------------
  async getAccounts() {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    if (client && user) {
      try {
        const { data, error } = await client
          .from("accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (!error && data) {
          if (data.length > 0) {
            localStorage.setItem("monetrac_cache_accounts", JSON.stringify(data));
            return data;
          } else {
            // Auto-seed default accounts to Supabase
            const defaultAccounts = [
              { user_id: user.id, name: "Cash / Tunai", type: "Cash", balance: 0, color: "#16a34a", icon: "money-bill" },
              { user_id: user.id, name: "Rekening Bank", type: "Bank", balance: 0, color: "#1f16a2", icon: "building-columns" },
              { user_id: user.id, name: "E-Wallet", type: "E-Wallet", balance: 0, color: "#1b93d0", icon: "wallet" }
            ];
            const { data: inserted } = await client.from("accounts").insert(defaultAccounts).select();
            if (inserted && inserted.length > 0) {
              localStorage.setItem("monetrac_cache_accounts", JSON.stringify(inserted));
              return inserted;
            }
          }
        }
      } catch (e) {
        console.warn("Supabase getAccounts error:", e);
      }
    }

    return this.getCachedAccounts();
  },

  async saveAccount(account) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    const accountData = {
      name: account.name,
      type: account.type || "Bank",
      balance: Number(account.balance) || 0,
      color: account.color || "#16a34a",
      icon: account.icon || "wallet"
    };

    // Optimistically update local cache
    const accounts = this.getCachedAccounts();
    if (account.id) {
      const idx = accounts.findIndex(a => a.id === account.id);
      if (idx !== -1) accounts[idx] = { ...accounts[idx], ...accountData };
    } else {
      accountData.id = "acc_" + Date.now();
      accounts.push(accountData);
    }
    localStorage.setItem("monetrac_cache_accounts", JSON.stringify(accounts));

    if (client && user) {
      try {
        accountData.user_id = user.id;
        if (account.id && !account.id.startsWith("acc_")) {
          const { data, error } = await client
            .from("accounts")
            .update(accountData)
            .eq("id", account.id)
            .eq("user_id", user.id)
            .select()
            .single();
          if (!error && data) {
            await this.getAccounts();
            return { success: true, data };
          }
        } else {
          const { data, error } = await client
            .from("accounts")
            .insert(accountData)
            .select()
            .single();
          if (!error && data) {
            await this.getAccounts();
            return { success: true, data };
          }
        }
      } catch (e) {
        console.warn("Supabase saveAccount sync error:", e);
      }
    }

    return { success: true, data: accountData };
  },

  async deleteAccount(accountId) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    const accounts = this.getCachedAccounts().filter(a => a.id !== accountId);
    localStorage.setItem("monetrac_cache_accounts", JSON.stringify(accounts));

    if (client && user) {
      try {
        if (!accountId.startsWith("acc_")) {
          await client
            .from("accounts")
            .delete()
            .eq("id", accountId)
            .eq("user_id", user.id);
        }
        await this.getAccounts();
      } catch (e) {
        console.warn("Supabase deleteAccount error:", e);
      }
    }

    return { success: true };
  },

  async updateAccountBalance(accountId, deltaAmount) {
    const accounts = this.getCachedAccounts();
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;

    const newBalance = (Number(acc.balance) || 0) + Number(deltaAmount);
    await this.saveAccount({ ...acc, balance: newBalance });
  },

  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------
  async getCategories() {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    if (client && user) {
      try {
        const { data, error } = await client
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (!error && data) {
          if (data.length > 0) {
            localStorage.setItem("monetrac_cache_categories", JSON.stringify(data));
            return data;
          } else {
            // Auto-seed default categories to Supabase
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
            if (inserted && inserted.length > 0) {
              localStorage.setItem("monetrac_cache_categories", JSON.stringify(inserted));
              return inserted;
            }
          }
        }
      } catch (e) {
        console.warn("Supabase getCategories error:", e);
      }
    }

    return this.getCachedCategories();
  },

  async saveCategory(category) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    const catData = {
      name: category.name,
      type: category.type || "Expense",
      color: category.color || "#2563eb",
      icon: category.icon || "tag"
    };

    // Optimistically update local cache
    const categories = this.getCachedCategories();
    if (category.id) {
      const idx = categories.findIndex(c => c.id === category.id);
      if (idx !== -1) categories[idx] = { ...categories[idx], ...catData };
    } else {
      catData.id = "cat_" + Date.now();
      categories.push(catData);
    }
    localStorage.setItem("monetrac_cache_categories", JSON.stringify(categories));

    if (client && user) {
      try {
        catData.user_id = user.id;
        if (category.id && !category.id.startsWith("cat_")) {
          await client
            .from("categories")
            .update(catData)
            .eq("id", category.id)
            .eq("user_id", user.id);
        } else {
          await client
            .from("categories")
            .insert(catData);
        }
        await this.getCategories();
      } catch (e) {
        console.warn("Supabase saveCategory sync error:", e);
      }
    }

    return { success: true, data: catData };
  },

  async deleteCategory(categoryId) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    const categories = this.getCachedCategories().filter(c => c.id !== categoryId);
    localStorage.setItem("monetrac_cache_categories", JSON.stringify(categories));

    if (client && user) {
      try {
        if (!categoryId.startsWith("cat_")) {
          await client
            .from("categories")
            .delete()
            .eq("id", categoryId)
            .eq("user_id", user.id);
        }
        await this.getCategories();
      } catch (e) {
        console.warn("Supabase deleteCategory error:", e);
      }
    }

    return { success: true };
  },

  // --------------------------------------------------------------------------
  // TRANSACTIONS
  // --------------------------------------------------------------------------
  async getTransactions(filters = {}) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    let txList = [];

    if (client && user) {
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
        if (filters.accountId) {
          query = query.or(`account_id.eq.${filters.accountId},to_account_id.eq.${filters.accountId}`);
        }
        if (filters.categoryId) {
          query = query.eq("category_id", filters.categoryId);
        }
        if (filters.startDate) {
          query = query.gte("date", filters.startDate);
        }
        if (filters.endDate) {
          query = query.lte("date", filters.endDate);
        }

        const { data, error } = await query;
        if (!error && data) {
          if (data.length > 0) {
            txList = data;
            localStorage.setItem("monetrac_cache_transactions", JSON.stringify(data));
          } else {
            // If Supabase returned [], but we have cached items from migration/offline, keep cached items!
            const cached = this.getCachedTransactions();
            if (cached.length > 0) {
              txList = cached;
            } else {
              localStorage.setItem("monetrac_cache_transactions", JSON.stringify([]));
            }
          }
        }
      } catch (e) {
        console.warn("Supabase getTransactions error:", e);
      }
    }

    if (!txList.length) {
      let cached = this.getCachedTransactions();
      if (filters.type && filters.type !== "all") {
        cached = cached.filter(t => t.type === filters.type);
      }
      if (filters.accountId) {
        cached = cached.filter(t => t.account_id === filters.accountId || t.to_account_id === filters.accountId || t.account === filters.accountId || t.toAccount === filters.accountId);
      }
      if (filters.categoryId) {
        cached = cached.filter(t => t.category_id === filters.categoryId || t.category === filters.categoryId);
      }
      if (filters.startDate) {
        cached = cached.filter(t => t.date >= filters.startDate);
      }
      if (filters.endDate) {
        cached = cached.filter(t => t.date <= filters.endDate);
      }
      txList = cached;
    }

    return txList;
  },

  async saveTransaction(transaction) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    const amount = Number(transaction.amount) || 0;
    const adminFee = Number(transaction.admin_fee) || 0;
    const type = transaction.type;
    const accountId = transaction.account_id || transaction.account;
    const toAccountId = transaction.to_account_id || transaction.toAccount;

    const txData = {
      type: type,
      date: transaction.date || new Date().toISOString().split("T")[0],
      amount: amount,
      admin_fee: adminFee,
      account_id: accountId || null,
      to_account_id: type === "Transfer" ? (toAccountId || null) : null,
      category_id: transaction.category_id || null,
      category_name: transaction.category_name || transaction.category || (type === "Transfer" ? "Transfer Saldo" : "Lainnya"),
      description: transaction.description || "",
      notes: transaction.notes || "",
      timestamp: transaction.timestamp || new Date().toISOString()
    };

    // 1. Update balances optimistically
    if (type === "Expense") {
      if (accountId) await this.updateAccountBalance(accountId, -amount);
    } else if (type === "Income") {
      if (accountId) await this.updateAccountBalance(accountId, amount);
    } else if (type === "Transfer") {
      if (accountId) await this.updateAccountBalance(accountId, -(amount + adminFee));
      if (toAccountId) await this.updateAccountBalance(toAccountId, amount);
    }

    // 2. Save optimistically to localStorage
    const transactions = this.getCachedTransactions();
    if (transaction.id) {
      const idx = transactions.findIndex(t => t.id === transaction.id);
      if (idx !== -1) transactions[idx] = { ...transactions[idx], ...txData };
    } else {
      txData.id = "tx_" + Date.now();
      transactions.unshift(txData);
    }
    localStorage.setItem("monetrac_cache_transactions", JSON.stringify(transactions));

    // 3. Persist to Supabase in background
    if (client && user) {
      try {
        txData.user_id = user.id;
        if (transaction.id && !transaction.id.startsWith("tx_") && !transaction.id.startsWith("id_")) {
          await client
            .from("transactions")
            .update(txData)
            .eq("id", transaction.id)
            .eq("user_id", user.id);
        } else {
          const { data, error } = await client
            .from("transactions")
            .insert(txData)
            .select()
            .single();
          if (!error && data) {
            txData.id = data.id;
            const updated = this.getCachedTransactions();
            if (updated.length > 0) updated[0].id = data.id;
            localStorage.setItem("monetrac_cache_transactions", JSON.stringify(updated));
          }
        }
      } catch (e) {
        console.warn("Supabase saveTransaction sync error:", e);
      }
    }

    return { success: true, data: txData };
  },

  async deleteTransaction(txId) {
    const transactions = this.getCachedTransactions();
    const tx = transactions.find(t => t.id === txId);

    if (tx) {
      const amount = Number(tx.amount) || 0;
      const adminFee = Number(tx.admin_fee) || 0;
      const accountId = tx.account_id || tx.account;
      const toAccountId = tx.to_account_id || tx.toAccount;

      if (tx.type === "Expense") {
        if (accountId) await this.updateAccountBalance(accountId, amount);
      } else if (tx.type === "Income") {
        if (accountId) await this.updateAccountBalance(accountId, -amount);
      } else if (tx.type === "Transfer") {
        if (accountId) await this.updateAccountBalance(accountId, amount + adminFee);
        if (toAccountId) await this.updateAccountBalance(toAccountId, -amount);
      }
    }

    const updated = transactions.filter(t => t.id !== txId);
    localStorage.setItem("monetrac_cache_transactions", JSON.stringify(updated));

    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    if (client && user) {
      try {
        if (!txId.startsWith("tx_") && !txId.startsWith("id_")) {
          await client
            .from("transactions")
            .delete()
            .eq("id", txId)
            .eq("user_id", user.id);
        }
      } catch (e) {
        console.warn("Supabase deleteTransaction sync error:", e);
      }
    }

    return { success: true };
  },

  // --------------------------------------------------------------------------
  // SAVINGS GOALS
  // --------------------------------------------------------------------------
  async getSavingsGoals() {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    if (client && user) {
      try {
        const { data, error } = await client
          .from("savings_goals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (!error && data && data.length > 0) {
          localStorage.setItem("monetrac_cache_savings", JSON.stringify(data));
          return data;
        }
      } catch (e) {
        console.warn("Supabase getSavingsGoals error:", e);
      }
    }

    return this.getCachedSavingsGoals();
  },

  async saveSavingsGoal(goal) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    const goalData = {
      name: goal.name,
      target_amount: Number(goal.target_amount) || 0,
      current_amount: Number(goal.current_amount) || 0,
      target_date: goal.target_date || null,
      account_id: goal.account_id || null,
      color: goal.color || "#0891b2",
      icon: goal.icon || "piggy-bank",
      notes: goal.notes || "",
      status: goal.status || "in_progress"
    };

    const goals = this.getCachedSavingsGoals();
    if (goal.id) {
      const idx = goals.findIndex(g => g.id === goal.id);
      if (idx !== -1) goals[idx] = { ...goals[idx], ...goalData };
    } else {
      goalData.id = "goal_" + Date.now();
      goals.push(goalData);
    }
    localStorage.setItem("monetrac_cache_savings", JSON.stringify(goals));

    if (client && user) {
      try {
        goalData.user_id = user.id;
        if (goal.id && !goal.id.startsWith("goal_")) {
          await client
            .from("savings_goals")
            .update(goalData)
            .eq("id", goal.id)
            .eq("user_id", user.id);
        } else {
          await client
            .from("savings_goals")
            .insert(goalData);
        }
        await this.getSavingsGoals();
      } catch (e) {
        console.warn("Supabase saveSavingsGoal sync error:", e);
      }
    }

    return { success: true, data: goalData };
  },

  async deleteSavingsGoal(goalId) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    const goals = this.getCachedSavingsGoals().filter(g => g.id !== goalId);
    localStorage.setItem("monetrac_cache_savings", JSON.stringify(goals));

    if (client && user) {
      try {
        if (!goalId.startsWith("goal_")) {
          await client
            .from("savings_goals")
            .delete()
            .eq("id", goalId)
            .eq("user_id", user.id);
        }
        await this.getSavingsGoals();
      } catch (e) {
        console.warn("Supabase deleteSavingsGoal error:", e);
      }
    }

    return { success: true };
  },

  async addSavingsMutation({ goalId, type, amount, accountId, notes, date }) {
    const amt = Number(amount) || 0;
    if (amt <= 0) return { success: false, error: "Nominal harus lebih besar dari 0" };

    const goals = this.getCachedSavingsGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return { success: false, error: "Target tabungan tidak ditemukan" };

    let newGoalAmount = Number(goal.current_amount) || 0;

    if (type === "deposit") {
      newGoalAmount += amt;
      if (accountId) {
        await this.updateAccountBalance(accountId, -amt);
      }
    } else if (type === "withdraw") {
      if (amt > newGoalAmount) {
        return { success: false, error: "Saldo tabungan tidak mencukupi untuk ditarik" };
      }
      newGoalAmount -= amt;
      if (accountId) {
        await this.updateAccountBalance(accountId, amt);
      }
    }

    await this.saveSavingsGoal({
      ...goal,
      current_amount: newGoalAmount,
      status: newGoalAmount >= goal.target_amount ? "completed" : "in_progress"
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
  },

  // --------------------------------------------------------------------------
  // BUDGETS
  // --------------------------------------------------------------------------
  async getBudgets() {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    if (client && user) {
      try {
        const { data, error } = await client
          .from("budgets")
          .select("*")
          .eq("user_id", user.id);

        if (!error && data && data.length > 0) {
          localStorage.setItem("monetrac_cache_budgets", JSON.stringify(data));
          return data;
        }
      } catch (e) {
        console.warn("Supabase getBudgets error:", e);
      }
    }

    return this.getCachedBudgets();
  },

  async saveBudget(budget) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    const budgetData = {
      category_name: budget.category_name || budget.category,
      category_id: budget.category_id || null,
      amount: Number(budget.amount) || 0,
      month: budget.month || null
    };

    const budgets = this.getCachedBudgets();
    if (budget.id) {
      const idx = budgets.findIndex(b => b.id === budget.id);
      if (idx !== -1) budgets[idx] = { ...budgets[idx], ...budgetData };
    } else {
      budgetData.id = "b_" + Date.now();
      budgets.push(budgetData);
    }
    localStorage.setItem("monetrac_cache_budgets", JSON.stringify(budgets));

    if (client && user) {
      try {
        budgetData.user_id = user.id;
        if (budget.id && !budget.id.startsWith("b_")) {
          await client
            .from("budgets")
            .update(budgetData)
            .eq("id", budget.id)
            .eq("user_id", user.id);
        } else {
          await client
            .from("budgets")
            .insert(budgetData);
        }
        await this.getBudgets();
      } catch (e) {
        console.warn("Supabase saveBudget sync error:", e);
      }
    }

    return { success: true, data: budgetData };
  },

  async deleteBudget(budgetId) {
    const client = SupabaseConfig.getClient();
    const user = await Auth.getCurrentUser();

    const budgets = this.getCachedBudgets().filter(b => b.id !== budgetId);
    localStorage.setItem("monetrac_cache_budgets", JSON.stringify(budgets));

    if (client && user) {
      try {
        if (!budgetId.startsWith("b_")) {
          await client
            .from("budgets")
            .delete()
            .eq("id", budgetId)
            .eq("user_id", user.id);
        }
        await this.getBudgets();
      } catch (e) {
        console.warn("Supabase deleteBudget error:", e);
      }
    }

    return { success: true };
  },

  // --------------------------------------------------------------------------
  // MIGRATION & BACKUP
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
        const client = SupabaseConfig.getClient();
        const user = await Auth.getCurrentUser();

        for (const tx of data.myfinance_transactions) {
          const txDate = tx.date ? tx.date.split("T")[0] : new Date().toISOString().split("T")[0];
          const txData = {
            type: tx.type,
            date: txDate,
            amount: Number(tx.amount) || 0,
            admin_fee: 0,
            account_id: accountMap[tx.account] || null,
            to_account_id: accountMap[tx.toAccount] || null,
            category_name: tx.category || (tx.type === "Transfer" ? "Transfer" : "Lainnya"),
            description: tx.description || "",
            timestamp: tx.timestamp || new Date().toISOString()
          };

          if (client && user) {
            txData.user_id = user.id;
            await client.from("transactions").insert(txData);
          } else {
            txData.id = "tx_" + Date.now() + Math.random().toString(36).substr(2, 5);
            const cached = JSON.parse(localStorage.getItem("monetrac_cache_transactions") || "[]");
            cached.push(txData);
            localStorage.setItem("monetrac_cache_transactions", JSON.stringify(cached));
          }
          importedTx++;
        }
      }

      return {
        success: true,
        message: `Migrasi Berhasil! Diimpor: ${importedAcc} Akun, ${importedCat} Kategori, ${importedTx} Transaksi, ${importedBg} Anggaran.`
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
      version: "2.0.0-supabase",
      myfinance_accounts: accounts,
      myfinance_categories: categories,
      myfinance_transactions: transactions,
      myfinance_budgets: budgets,
      myfinance_savings: savings
    };
  }
};